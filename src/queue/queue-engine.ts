/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { JOB, TASK, TASKLOG } from '../interfaces/enginecore'
import { Rabbitmq } from './rabbitmq'

// Queues we are using for AgentORC. Retry mechanism will be added later.
export const QUEUES_LIST = [
  'JOB_QUEUE',
  'JOB_COMPLETED_QUEUE',
  'JOB_FAILED_QUEUE',
  'TASK_SCHEDULED_QUEUE',
  'TASK_COMPLETED_QUEUE',
  'TASK_FAILED_QUEUE',
  'TASK_LOG_QUEUE',
  'TASK_RUNNING_QUEUE'
]

export enum QUEUES {
  JOB_QUEUE = 'JOB_QUEUE',
  JOB_COMPLETED_QUEUE = 'JOB_COMPLETED_QUEUE',
  JOB_FAILED_QUEUE = 'JOB_FAILED_QUEUE',
  TASK_SCHEDULED_QUEUE = 'TASK_SCHEDULED_QUEUE',
  TASK_COMPLETED_QUEUE = 'TASK_COMPLETED_QUEUE',
  TASK_FAILED_QUEUE = 'TASK_FAILED_QUEUE',
  TASK_LOG_QUEUE = 'TASK_LOG_QUEUE',
  TASK_RUNNING_QUEUE = 'TASK_RUNNING_QUEUE'
}

const MQ = Rabbitmq.getInstance()

export function publishJob(QueueName: string, job: JOB): Promise<boolean> {
  return MQ.publish(QueueName, job)
}
export function publishTask(QueueName: string, task: TASK): Promise<boolean> {
  return MQ.publish(QueueName, task)
}
export function publishTaskLog(log: TASKLOG): Promise<boolean> {
  return MQ.publish(QUEUES.TASK_LOG_QUEUE, log)
}

export async function subscribeJob(QueueName: string, callback: (job: any) => Promise<void>) {
  return MQ.subscribe(QueueName, callback)
}
export async function subscribeTask(QueueName: string, callback: (task: any) => Promise<void>) {
  return MQ.subscribe(QueueName, callback)
}
export async function subscribeTaskLog(callback: (log: TASKLOG) => Promise<void>) {
  return MQ.subscribe(QUEUES.TASK_LOG_QUEUE, callback)
}
