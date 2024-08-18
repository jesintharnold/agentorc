export interface ENV {
  [key: string]: string
}

export enum STATUS {
  'PENDING',
  'SCHEDULED',
  'RUNNING',
  'COMPLETED'
}

export interface JOB {
  name: string
  description: string
  image: string
  status: string
  execorder: string[]
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

// export interface workflow {
//   name: string
//   description: string
//   jobID?: string
//   image: string
//   status?: status
//   tasks: Task
// }
