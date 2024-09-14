/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from 'crypto'
import {
  JobsInputSchema,
  JobexecutionInputSchema,
  TaskexecutionInputSchema,
  JobSchema,
  JobexecutionSchema,
  TasklogSchema
} from '../interfaces/dbschema'
import { STATUS } from '../interfaces/enginecore'
import { logger } from '../logger/logger'
import { Postgres } from './postgres'
import { DBError } from './db.error'

const connection = Postgres.getInstance().con()

export async function createJob(job: JobsInputSchema): Promise<{ id: string }> {
  console.log(job)
  try {
    const data = await connection`
        INSERT INTO orc.jobs(
	        name, description, image, execorder, tasks)
	        VALUES (${job.name},${job.description},${job.image},${job.execorder},${job.tasks})
          RETURNING id;
        `
    return data[0] as { id: string }
  } catch (error: any) {
    logger.info('Error creating job:', error)
    throw new DBError(error?.message)
  }
}

export async function createJobExec(jobexec: JobexecutionInputSchema): Promise<{ id: string }> {
  console.log(jobexec)
  try {
    const data = await connection`
        INSERT INTO orc.jobexecutions(
	      job_id, state, start_time)
	      VALUES (${jobexec.job_id},${jobexec.state},${jobexec.start_time});
        RETURNING id;
        `
    return data[0] as { id: string }
  } catch (error: any) {
    logger.info('Error creating job execution:', error)
    throw new DBError(error?.message)
  }
}

export async function createTaskExec(taskexec: TaskexecutionInputSchema): Promise<{ id: string }> {
  console.log(taskexec)
  try {
    const data = await connection`
        INSERT INTO orc.taskexecutions(
	      id, job_exc_id, task_id, state)
	      VALUES (${taskexec.id}, ${taskexec.job_exc_id}, ${taskexec.task_id}, ${taskexec.state});
        `
    return data[0] as { id: string }
  } catch (error: any) {
    logger.info('Error creating Task execution:', error)
    throw new DBError(error?.message)
  }
}

// SELECT - JOB by ID
// SELECT - JOB EXECUTIONS by JOB_EXEC_ID
// SELECT - TASK BY TASK_ID
export async function selectJobs(limit: number, skip: number): Promise<JobSchema[]> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobs ORDER BY created_at ASC
        LIMIT ${limit} OFFSET ${skip};
        `
    return data as any as JobSchema[]
  } catch (error: any) {
    logger.info('Error select Job:', error)
    throw new DBError(error?.message)
  }
}

export async function selectjobbyID(ID: string): Promise<JobSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobs where id=${ID};
        `
    return data[0] as JobSchema
  } catch (error: any) {
    logger.info('Error select Job by ID:', error)
    throw new DBError(error?.message)
  }
}

export async function selectexecJobs(limit: number, skip: number): Promise<JobexecutionSchema[]> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobexecutions ORDER BY updated_at ASC
        LIMIT ${limit} OFFSET ${skip};
        `
    return data as any as JobexecutionSchema[]
  } catch (error: any) {
    logger.info('Error select execution jobs :', error)
    throw new DBError(error?.message)
  }
}

export async function selectjobexecbyID(ID: string): Promise<JobexecutionSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobexecutions where id=${ID};
        `
    return data[0] as JobexecutionSchema
  } catch (error: any) {
    logger.info('Error select Job execution:', error)
    throw new DBError(error?.message)
  }
}

export async function selecttaskexecbyID(ID: string): Promise<JobexecutionSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.taskexecutions where id=${ID};
        `
    return data[0] as JobexecutionSchema
  } catch (error: any) {
    logger.info('Error select Task execution:', error)
    throw new DBError(error?.message)
  }
}

export async function updatejobState(state: string, ID: string): Promise<boolean> {
  try {
    await connection`
        UPDATE orc.jobexecutions
	        SET state=${state} ${state == STATUS.COMPLETED ? connection`, end_time = ${connection`CURRENT_TIMESTAMP()`}` : connection``}
	          WHERE id=${ID};
        `
    return true
  } catch (error: any) {
    logger.info('Error update job state execution:', error)
    throw new DBError(error?.message)
  }
}

export async function updatetaskState(state: string, ID: string): Promise<boolean> {
  try {
    await connection`
        UPDATE orc.taskexecutions
	        SET state=${state} ${state == STATUS.COMPLETED ? connection`, end_time = ${connection`CURRENT_TIMESTAMP()`}` : connection``}
	          WHERE id=${ID};
        `
    return true
  } catch (error: any) {
    logger.info('Error update job state execution:', error)
    throw new DBError(error?.message)
  }
}

// VIEW - select overall status of job by ID
// - SHOW ALL THE JOB EXECUTIONS
// - IF A TASK is selected , then mention the logs
// UPDATE TASK LOG BY ID

export async function createtaskLog(taskID: string, logpartNumber: number, logContent: string): Promise<boolean> {
  try {
    await connection`
        INSERT INTO orc.tasklog(
	      task_exec_id, task_part_number, logs, created_at)
	      VALUES (${taskID},${logpartNumber},${logContent});
        `
    return true
  } catch (error: any) {
    logger.info('Error insert execution task log:', error)
    throw new DBError(error?.message)
  }
}

export async function selecttaskexecLog(taskID: string, size: number): Promise<TasklogSchema> {
  try {
    const _tasklog_ = await connection`
        SELECT id, task_exec_id, task_part_number, logs, created_at
	      FROM orc.tasklog where task_exec_id=${taskID} order by task_part_number 
        ASC limit ${size}
        `
    return _tasklog_[0] as TasklogSchema
  } catch (error: any) {
    logger.info('Error select task log by taskID:', error)
    throw new DBError(error?.message)
  }
}

export async function getJobexecwithTasks(jobexecID: UUID) {
  try {
    const _tasklog_ = await connection`
        SELECT from orc.jobexecutions jobexec INNER JOIN orc.taskexecutions taskexec 
        ON jobexec.id = taskexec.job_exc_id where jobexec.id = ${jobexecID}
        `
    return _tasklog_[0]
  } catch (error: any) {
    logger.info('Error select whole jobs & Task', error)
    throw new DBError(error?.message)
  }
}
