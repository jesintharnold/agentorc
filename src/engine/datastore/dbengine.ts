import {
  JobsInputSchema,
  JobexecutionInputSchema,
  TaskexecutionInputSchema,
  JobSchema,
  JobexecutionSchema
} from '../interfaces/dbschema'
import { STATUS } from '../interfaces/enginecore'
import { Postgres } from './postgres'

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
  } catch (error: unknown) {
    console.error('Error creating job:', error)
    throw error
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
  } catch (error: unknown) {
    console.error('Error creating job execution:', error)
    throw error
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
  } catch (error: unknown) {
    console.error('Error creating Task execution:', error)
    throw error
  }
}

// SELECT - JOB by ID
// SELECT - JOB EXECUTIONS by JOB_EXEC_ID
// SELECT - TASK BY TASK_ID
export async function getjobbyID(ID: string): Promise<JobSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobs where id=${ID};
        `
    return data[0] as JobSchema
  } catch (error: unknown) {
    console.error('Error select Job:', error)
    throw error
  }
}

export async function getjobexecbyID(ID: string): Promise<JobexecutionSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.jobexecutions where id=${ID};
        `
    return data[0] as JobexecutionSchema
  } catch (error: unknown) {
    console.error('Error select Job execution:', error)
    throw error
  }
}

export async function gettaskexecbyID(ID: string): Promise<JobexecutionSchema> {
  try {
    const data = await connection`
        SELECT * FROM orc.taskexecutions where id=${ID};
        `
    return data[0] as JobexecutionSchema
  } catch (error: unknown) {
    console.error('Error select Task execution:', error)
    throw error
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
  } catch (error: unknown) {
    console.error('Error update job state execution:', error)
    return false
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
  } catch (error: unknown) {
    console.error('Error update job state execution:', error)
    return false
  }
}

// VIEW - get overall status of job by ID
// - SHOW ALL THE JOB EXECUTIONS
// - IF A TASK is selected , then mention the logs
// UPDATE TASK LOG BY ID

// export async function updatetaskLog(ID: string, logs: string): Promise<boolean> {
//   try {
//     await connection`
//         UPDATE orc.taskexecutions
// 	        SET state=${state} ${state == STATUS.COMPLETED ? connection`, end_time = ${connection`CURRENT_TIMESTAMP()`}` : connection``}
// 	          WHERE id=${ID};
//         `
//     return true
//   } catch (error: unknown) {
//     console.error('Error update job state execution:', error)
//     return false
//   }
// }