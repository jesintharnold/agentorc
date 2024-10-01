/* eslint-disable @typescript-eslint/no-unused-vars */
import { createtaskLog, updatejobState, updatetaskState } from '../datastore/dbengine'
import { JOB, STATUS, TASK, TASKLOG } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { publishTask, QUEUES, subscribeJob, subscribeTask, subscribeTaskLog } from './queue-engine'
import { Rabbitmq } from './rabbitmq'

export class Enginelisteners {
  private mq: Rabbitmq
  constructor() {
    this.mq = Rabbitmq.getInstance()
    this.listenJOB()
    this.listencompleteTASK()
    this.listenlogTask()
    this.listenfailedTASK()
  }
  private listenJOB(job_schedule_count: number = 5) {
    logger.info(`Listener ${QUEUES.JOB_QUEUE} STARTED`)
    subscribeJob(QUEUES.JOB_QUEUE, async (_job_) => {
      const scheduled_job_queue_count = await this.mq.getmsgCount(QUEUES.JOB_QUEUE)
      logger.info('Job queue count :', scheduled_job_queue_count)
      const job: JOB = JSON.parse(_job_?.content)
      if (scheduled_job_queue_count < job_schedule_count) {
        logger.info(`Scheduling Tasks: from ${job.name} job`)
        job.id ? updatejobState(STATUS.PENDING, job.id) : false
        const task_published = await Promise.all(
          job.tasks.map(async (task) => {
            try {
              await publishTask(QUEUES.TASK_SCHEDULED_QUEUE, task)
              task.state = STATUS.SCHEDULED
              await updatetaskState(STATUS.SCHEDULED, task.id)
              return true
            } catch (error) {
              task.state = STATUS.FAILED
              logger.error(`Job queue - ${job.id} , Task ID - ${task.id}`)
              return false
            }
          })
        )
        // Retry mechanism for Task needs to be introduced
        if (task_published) {
          this.mq.getWrapper().ack(_job_)
          job.status = STATUS.SCHEDULED
          job.id ? updatejobState(STATUS.SCHEDULED, job.id) : false
        } else {
          //Add the job to JOB_FAILED_QUEUE better will be add to JOB_FAILED_QUEUE ,these failed queue --> change into FAILED_STATE
          logger.error(`Failed to publish job: ${job.name}. Job remains in JOB_QUEUE.`)
          job.status = STATUS.FAILED
          job.id ? updatejobState(STATUS.FAILED, job.id) : false
        }
      } else {
        logger.info(
          `Job queue is full. Current scheduled jobs: ${scheduled_job_queue_count}. Job not scheduled: ${job.name}`
        )
      }
    })
  }
  private listencompleteTASK() {
    logger.info(`Listener ${QUEUES.TASK_COMPLETED_QUEUE} STARTED`)
    subscribeTask(QUEUES.TASK_COMPLETED_QUEUE, async (_task_) => {
      const task: TASK = JSON.parse(_task_?.content)
      logger.info(`Task completed - ${task.id} Job Id - ${task.job_execution_id}`)
      task.state = STATUS.COMPLETED
      await updatetaskState(STATUS.COMPLETED, task.id)
      this.mq.getWrapper().ack(_task_)
    })
  }

  private listenfailedTASK() {
    logger.info(`Listener ${QUEUES.TASK_FAILED_QUEUE} STARTED`)
    subscribeTask(QUEUES.TASK_FAILED_QUEUE, async (_task_) => {
      const task: TASK = JSON.parse(_task_?.content)
      task.state = STATUS.FAILED
      logger.info(`Task failed - ${task.id} Job Id - ${task.job_execution_id} retry count - ${task.retrycount}`)
      await updatetaskState(STATUS.FAILED, task.id)
      this.mq.getWrapper().ack(_task_)
    })
  }

  private listenlogTask() {
    logger.info(`Listener ${QUEUES.TASK_LOG_QUEUE} STARTED`)
    subscribeTaskLog(async (_log_) => {
      const log: TASKLOG = JSON.parse(_log_?.content)
      logger.info(`TaskID - ${log.taskid} JobID - ${log.jobid} TaskPart - ${log.logpart}`)
      await createtaskLog(log.taskid, log.logpart, log.content)
      this.mq.getWrapper().ack(_log_)
    })
  }
  // Listeners pending
  // - TASK_SCHEDULED_QUEUE
  // - JOB_FAILED_QUEUE
  // - JOB_COMPLETED_QUEUE
}
