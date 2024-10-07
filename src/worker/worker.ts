/* eslint-disable @typescript-eslint/no-explicit-any */
import { STATUS, TASK } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { publishTask, QUEUES, subscribeTask } from '../queue/queue-engine'
import { Rabbitmq } from '../queue/rabbitmq'
import { DockerRuntime } from '../runtime/docker/docker'
import { RuntimeError } from '../runtime/runtime.error'
import { gettimewithoutzone } from '../utils/timezone'

export class Worker {
  private runtime: DockerRuntime | undefined
  private mq: Rabbitmq
  constructor(name: string) {
    logger.info(`Starting worker-${name} Initializtion`)
    this.initRuntime()
    this.mq = Rabbitmq.getInstance()
  }
  private async initRuntime() {
    try {
      this.runtime = DockerRuntime.getInstance()
      await this.runtime.testConnection()
    } catch (error: any) {
      throw new RuntimeError('Runtime Initalization - FAILED')
    }
  }
  public startConsumer() {
    try {
      logger.info(`Listener ${QUEUES.TASK_SCHEDULED_QUEUE} STARTED`)
      subscribeTask(QUEUES.TASK_SCHEDULED_QUEUE, async (_task_) => {
        const task: TASK = JSON.parse(_task_?.content)
        logger.debug(
          `Task consumed from ${QUEUES.TASK_SCHEDULED_QUEUE} Task name - ${task.name} Task ID - ${task.id} Job ID - ${task.job_execution_id}`
        )
        if (task.state == STATUS.SCHEDULED) {
          task.state = STATUS.RUNNING
          await publishTask(QUEUES.TASK_RUNNING_QUEUE, task)
        }
        if (task.state == STATUS.RUNNING) {
          await this.handleTask(task)
          this.mq.getWrapper().ack(_task_)
        }
      })
    } catch (error: any) {
      logger.error(`ERROR IN CONSUMER - ${QUEUES.TASK_SCHEDULED_QUEUE} - ${error?.message}`)
    }
  }
  private async handleTask(task: TASK) {
    const start_time = gettimewithoutzone()
    try {
      const runtask = await this.runtime?.runTask(task)
      const end_time = gettimewithoutzone()
      runtask!.start_time = start_time
      runtask!.end_time = end_time
      if (runtask) {
        await publishTask(QUEUES.TASK_COMPLETED_QUEUE, runtask)
      }
    } catch (error: any) {
      const _task_ = task
      _task_.state = STATUS.FAILED
      _task_.output = `${error?.message}`
      _task_!.start_time = start_time
      _task_!.end_time = gettimewithoutzone()
      await publishTask(QUEUES.TASK_FAILED_QUEUE, _task_)
    }
  }
}
