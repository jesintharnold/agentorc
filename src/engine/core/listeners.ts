/* eslint-disable @typescript-eslint/no-unused-vars */

import { createtaskLog, updatejobState, updatetaskState } from '../datastore/dbengine'
import { JOB, STATUS, TASK, TASKLOG } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { publishJob, QUEUES, subscribeJob, subscribeTask, subscribeTaskLog } from '../queue/queue-engine'
import { Rabbitmq } from '../queue/rabbitmq'

class Enginelisteners {
  private mq: Rabbitmq
  constructor() {
    this.mq = Rabbitmq.getInstance()
    this.listenJOB()
    this.listencompleteTASK()
    this.listenlogTask()
  }
  private listenJOB(job_schedule_count: number = 5) {
    logger.info(`Job Listener started`)
    subscribeJob(QUEUES.JOB_PENDING_QUEUE, async (job: JOB) => {
      const scheduled_job_queue_count = await this.mq.getmsgCount(QUEUES.JOB_PENDING_QUEUE)
      if (scheduled_job_queue_count < job_schedule_count) {
        logger.info(`Scheduling job: ${job.name} to JOB_SCHEDULED_QUEUE`)
        job.status = STATUS.SCHEDULED
        const published = await publishJob(QUEUES.JOB_SCHEDULED_QUEUE, job)
        const stateChange = job.id ? updatejobState(STATUS.SCHEDULED, job.id) : false
        if (published && stateChange) {
          this.mq.getWrapper().ack(job)
        } else {
          logger.error(`Failed to publish job: ${job.name}. Job remains in JOB_PENDING_QUEUE.`)
        }
      } else {
        logger.info(
          `Job queue is full. Current scheduled jobs: ${scheduled_job_queue_count}. Job not scheduled: ${job.name}`
        )
      }
    })
  }
  private listencompleteTASK() {
    logger.info(`Job Listener started`)
    subscribeTask(QUEUES.TASK_QUEUE, async (task: TASK) => {
      logger.info(`Task completed - ${task.id} Job Id - ${task.job_execution_id}`)
      await updatetaskState(task.state, task.id)
      this.mq.getWrapper().ack(task)
    })
  }
  private listenlogTask() {
    logger.info(`Job Listener started`)
    subscribeTaskLog(async (log: TASKLOG) => {
      logger.info(`TaskID - ${log.taskid} JobID - ${log.jobid} TaskPart - ${log.logpart}`)
      await createtaskLog(log.taskid, log.logpart, log.content)
      this.mq.getWrapper().ack(log)
    })
  }
}
