export type Json = string

// Table jobexecutions
export interface JobexecutionSchema {
  id: string
  job_id: string | null
  state: string
  start_time: Date
  end_time: Date | null
  updated_at: Date | null
}
export interface JobexecutionInputSchema {
  id?: string
  job_id?: string | null
  state: string
  start_time?: Date
  end_time?: Date | null
  updated_at?: Date | null
}

const jobexecutionSchema = {
  tableName: 'jobexecutions',
  columns: ['id', 'job_id', 'state', 'start_time', 'end_time', 'updated_at'],
  requiredForInsert: ['state', 'start_time'],
  primaryKey: 'id',
  foreignKeys: {},
  $type: null as unknown as JobexecutionSchema,
  $input: null as unknown as JobexecutionInputSchema
} as const

// Table jobs
export interface JobSchema {
  id: string
  name: string
  description: string
  created_at: Date | null
  updated_at: Date | null
  tasks: Json
}
export interface JobsInputSchema {
  id?: string
  name: string
  description: string
  created_at?: Date | null
  updated_at?: Date | null
  tasks: string
}
const jobSchema = {
  tableName: 'jobs',
  columns: ['id', 'name', 'description', 'created_at', 'updated_at', 'execorder', 'tasks'],
  requiredForInsert: ['name', 'description', 'tasks'],
  primaryKey: 'id',
  foreignKeys: {},
  $type: null as unknown as JobSchema,
  $input: null as unknown as JobsInputSchema
} as const

// Table taskexecutions
export interface TaskexecutionSchema {
  id: string
  job_exc_id: string | null
  task_id: string
  state: string
  start_time: Date | null
  end_time: Date | null
  logs: string | null
  updated_at: Date | null
}
export interface TaskexecutionInputSchema {
  id: string
  job_exc_id: string | null
  task_id: string
  state: string
  start_time?: Date | null
  end_time?: Date | null
  logs?: string | null
  updated_at?: Date | null
}
const taskexecutionSchema = {
  tableName: 'taskexecutions',
  columns: ['id', 'job_exc_id', 'task_id', 'state', 'start_time', 'end_time', 'logs', 'updated_at'],
  requiredForInsert: ['id', 'task_id', 'state'],
  primaryKey: null,
  foreignKeys: { job_exc_id: { table: 'jobexecutions', column: 'id', $type: null as unknown as JobexecutionSchema } },
  $type: null as unknown as TaskexecutionSchema,
  $input: null as unknown as TaskexecutionInputSchema
} as const

export interface TasklogSchema {
  id: string | null
  task_exec_id: string | null
  task_part_number: number | null
  logs: string | null
  created_at: Date | null
}
export interface TasklogInputSchema {
  id?: string | null
  task_exec_id?: string | null
  task_part_number?: number | null
  logs?: string | null
}

export interface TableTypes {
  jobexecution: {
    select: JobexecutionSchema
    input: JobexecutionInputSchema
  }
  job: {
    select: JobSchema
    input: JobsInputSchema
  }
  taskexecution: {
    select: TaskexecutionSchema
    input: TaskexecutionInputSchema
  }
}

export const tables = {
  jobexecutionSchema,
  jobSchema,
  taskexecutionSchema
}
