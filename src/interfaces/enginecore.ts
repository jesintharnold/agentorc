/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ENV {
  [key: string]: string
}

export enum STATUS {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface JOB {
  id?: string
  name: string
  description: string
  status: STATUS
  tasks: TASK[]
}

export interface TASK {
  task_id: any
  name: string
  id: string
  retrycount: number
  script: string
  env: ENV
  state: STATUS
  start_time: Date
  end_time: Date
  job_execution_id: string
  depends_on: null | string
  image: string
  output?: string
}

export interface TASKLOG {
  id?: string
  taskid: TASK['id']
  content: string
  logpart: number
}
