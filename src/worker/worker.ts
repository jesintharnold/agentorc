/* eslint-disable @typescript-eslint/no-explicit-any */
import { STATUS, TASK } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { publishTask, QUEUES, subscribeTask } from '../queue/queue-engine'
import { Rabbitmq } from '../queue/rabbitmq'
import { DockerRuntime } from '../runtime/docker/docker'
import { RuntimeError } from '../runtime/runtime.error'

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
      logger.error(error?.message)
      throw new RuntimeError('Runtime Initalization - FAILED')
    }
  }
  public startConsumer() {
    try {
      subscribeTask(QUEUES.TASK_SCHEDULED_QUEUE, async (_task_) => {
        const task: TASK = JSON.parse(_task_?.content)
        logger.debug(`Task scheduled - ${task.id} Job Id - ${task.job_execution_id}`)
        if (task.state == STATUS.SCHEDULED) {
          task.state = STATUS.RUNNING
          await publishTask(QUEUES.TASK_RUNNING_QUEUE, task)
        }
        this.mq.getWrapper().ack(_task_)
        //Checking based on state
        if (task.state == STATUS.RUNNING) {
          await this.handleTask(task)
        }
      })
    } catch (error: any) {
      logger.error(error?.message)
    }
  }
  private async handleTask(task: TASK) {
    try {
      const runtask = await this.runtime?.runTask(task)
      if (runtask) {
        await publishTask(QUEUES.TASK_COMPLETED_QUEUE, runtask)
      }
    } catch (error: any) {
      const _task_ = task
      _task_.state = STATUS.FAILED
      _task_.output = `${error?.message}`
      logger.error(_task_)
      await publishTask(QUEUES.TASK_FAILED_QUEUE, _task_)
    }
  }
}
