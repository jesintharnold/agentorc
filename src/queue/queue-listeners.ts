/* eslint-disable @typescript-eslint/no-unused-vars */
import { string } from 'zod'
import { createtaskLog, updatejobState, updatetaskState } from '../datastore/dbengine'
import { JOB, STATUS, TASK, TASKLOG } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { publishJob, publishTask, QUEUES, subscribeJob, subscribeTask, subscribeTaskLog } from './queue-engine'
import { Rabbitmq } from './rabbitmq'
import { gettimewithoutzone } from '../utils/timezone'

export class Enginelisteners {
  private mq: Rabbitmq
  constructor() {
    this.mq = Rabbitmq.getInstance()
    this.listenJOBSCHEDULED()
    this.listenJOBFAILED()
    this.listenJOBCOMPLETED()

    this.listencompleteTASK()
    this.listenlogTASK()
    this.listenfailedTASK()
    this.listenRunningTASK()
  }
  private listenJOBSCHEDULED(job_schedule_count: number = 5) {
    logger.info(`Listener ${QUEUES.JOB_QUEUE} STARTED`)
    subscribeJob(QUEUES.JOB_QUEUE, async (_job_) => {
      const scheduled_job_queue_count = await this.mq.getmsgCount(QUEUES.JOB_QUEUE)
      logger.info('Job queue count :', scheduled_job_queue_count)
      const job: JOB = JSON.parse(_job_?.content)
      const total_task_count = job.tasks.length
      if (scheduled_job_queue_count < job_schedule_count) {
        logger.info(`Scheduling Tasks: from ${job.name} job`)
        job.id ? updatejobState(STATUS.PENDING, job.id) : false
        const task_published = await Promise.all(
          job.tasks.map(async (task, index) => {
            try {
              task.state = STATUS.SCHEDULED
              task.count = [index + 1, total_task_count]
              await publishTask(QUEUES.TASK_SCHEDULED_QUEUE, task)
              await updatetaskState(STATUS.SCHEDULED, task.id)
              return true
            } catch (error) {
              task.state = STATUS.FAILED
              logger.error(`Job queue - ${job.id} ,Task name - ${task.name}  Task ID - ${task.id}`)
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
        logger.debug(
          `Job queue is full. Current scheduled jobs: ${scheduled_job_queue_count}. Job not scheduled: ${job.name}`
        )
      }
    })
  }

  private listenJOBCOMPLETED() {
    logger.info(`Listener ${QUEUES.JOB_COMPLETED_QUEUE} STARTED`)
    subscribeJob(QUEUES.JOB_COMPLETED_QUEUE, async (_job_) => {
      const job: { jobid: JOB['id']; endtime: string } = JSON.parse(_job_?.content)
      logger.debug(`Job consumed from ${QUEUES.JOB_COMPLETED_QUEUE} Job ID - ${job.jobid}`)
      job.jobid && (await updatejobState(STATUS.COMPLETED, job.jobid, job.endtime))
      this.mq.getWrapper().ack(_job_)
    })
  }

  private listenJOBFAILED() {
    logger.info(`Listener ${QUEUES.JOB_FAILED_QUEUE} STARTED`)
    subscribeJob(QUEUES.JOB_FAILED_QUEUE, async (_job_) => {
      const job: { jobid: JOB['id']; endtime: string } = JSON.parse(_job_?.content)
      logger.debug(`Job consumed from ${QUEUES.JOB_FAILED_QUEUE} Job ID - ${job.jobid}`)
      job.jobid && (await updatejobState(STATUS.FAILED, job.jobid, job.endtime))
      this.mq.getWrapper().ack(_job_)
    })
  }

  private listencompleteTASK() {
    logger.info(`Listener ${QUEUES.TASK_COMPLETED_QUEUE} STARTED`)
    subscribeTask(QUEUES.TASK_COMPLETED_QUEUE, async (_task_) => {
      const task: TASK = JSON.parse(_task_?.content)
      logger.debug(
        `Task consumed from ${QUEUES.TASK_COMPLETED_QUEUE} Task ID - ${task.id} Job ID - ${task.job_execution_id}`
      )
      await updatetaskState(STATUS.COMPLETED, task.id, task.end_time, task.start_time)
      const current_task = task?.count?.[0]
      const total_task = task?.count?.[1]

      if (current_task == total_task) {
        await publishJob(QUEUES.TASK_COMPLETED_QUEUE, { jobid: task.job_execution_id, endtime: gettimewithoutzone() })
      }
      this.mq.getWrapper().ack(_task_)
    })
  }

  private listenfailedTASK() {
    logger.info(`Listener ${QUEUES.TASK_FAILED_QUEUE} STARTED`)
    subscribeTask(QUEUES.TASK_FAILED_QUEUE, async (_task_) => {
      const task: TASK = JSON.parse(_task_?.content)
      logger.debug(
        `Task consumed from ${QUEUES.TASK_FAILED_QUEUE} Task ID - ${task.id} Job ID - ${task.job_execution_id}`
      )
      await updatetaskState(STATUS.FAILED, task.id, task.end_time, task.start_time)
      const current_task = task?.count?.[0]
      const total_task = task?.count?.[1]
      if (current_task == total_task) {
        await publishJob(QUEUES.JOB_FAILED_QUEUE, { jobid: task.job_execution_id, endtime: gettimewithoutzone() })
      }
      this.mq.getWrapper().ack(_task_)
    })
  }

  private listenlogTASK() {
    logger.info(`Listener ${QUEUES.TASK_LOG_QUEUE} STARTED`)
    subscribeTaskLog(async (_log_) => {
      const log: TASKLOG = JSON.parse(_log_?.content)
      await createtaskLog(log.taskid, log.logpart, log.content)
      this.mq.getWrapper().ack(_log_)
    })
  }
  // Listeners pending
  // - JOB_FAILED_QUEUE
  // - JOB_COMPLETED_QUEUE

  private listenRunningTASK() {
    logger.info(`Listener ${QUEUES.TASK_RUNNING_QUEUE} STARTED`)
    subscribeTask(QUEUES.TASK_RUNNING_QUEUE, async (_task_) => {
      const task: TASK = JSON.parse(_task_?.content)
      logger.debug(
        `Task consumed from ${QUEUES.TASK_RUNNING_QUEUE} Task ID - ${task.id} Job ID - ${task.job_execution_id}`
      )
      await updatetaskState(STATUS.RUNNING, task.id)
      this.mq.getWrapper().ack(_task_)
    })
  }
}
