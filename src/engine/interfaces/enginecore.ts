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
  image: string
  status: STATUS
  execorder: { order: string[] }
  tasks: TASK[]
}

export interface TASK {
  name: string
  id: string
  description: string
  retrycount: number
  script: string
  env: ENV[]
  state: STATUS
  start_time: Date
  end_time: Date
  job_execution_id: string
  output: string
  depends_on: null | string
}

export interface TASKLOG {
  id: string
  jobid: string
  taskid: TASK['id']
  content: string
  logpart: number
}
