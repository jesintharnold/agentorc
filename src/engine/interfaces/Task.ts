export interface env {
  [key: string]: string
}

export enum status {
  'PENDING',
  'SCHEDULED',
  'RUNNING',
  'COMPLETED'
}
export interface Task {
  name: string
  id: string
  description: string
  retrycount: number
  script: string
  env: env[]
  state: status
  start_time: Date
  end_time: Date
  job_execution_id: string
  output: string
  depends_on: null | string
}

export interface workflow {
  name: string
  description: string
  jobID?: string
  image: string
  status?: status
  tasks: {
    name: string
    id?: string
    description?: string
    retrycount: number | 0
    script?: string
    env?: env[]
    depends_on?: null | string
  }[]
}
