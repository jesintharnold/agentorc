import { JOB, TASK, TASKLOG } from './enginecore'

export interface QueueOperations {
  publishJob(QueueName: string, job: JOB): Promise<void>
  subscribeJob(QueueName: string, job: JOB): Promise<void>
  publishTask(QueueName: string, task: TASK): Promise<void>
  subscribeTask(QueueName: string, task: TASK): Promise<void>
  publishTaskLog(log: TASKLOG): Promise<void>
  subscribeTaskLog(log: TASKLOG): Promise<void>
}
