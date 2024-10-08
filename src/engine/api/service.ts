/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 } from 'uuid'
import { ENV, JOB, STATUS } from '../../interfaces/enginecore'
import { logger } from '../../logger/logger'
import {
  createJob,
  createTaskExec,
  selectjobbyID,
  selectexecJobs,
  selectJobs,
  selectjobexecbyID,
  selecttaskexecbyID,
  selecttaskexecLog,
  getJobexecwithTasks,
  createJobExec
} from '../../datastore/dbengine'
import { UUID } from 'crypto'
import { publishJob, QUEUES } from '../../queue/queue-engine'
import { JobexecutionSchema, JobSchema, TaskexecutionInputSchema } from '../../interfaces/dbschema'
import { ServiceAPIError } from './errors/service.error'

export async function saveJob(jobs: JOB) {
  try {
    const DB = await createJob({
      name: jobs.name,
      description: jobs.description,
      tasks: JSON.stringify(jobs.tasks)
    })
    return DB
  } catch (error: any) {
    logger.error(`Save Job error - ${error}`)
    throw new ServiceAPIError('Error while saving the Job', 400)
  }
}

export async function runJob(jobID: UUID) {
  try {
    const jobData = await selectjobbyID(jobID)

    if (!jobData) {
      logger.warn(`Job with ID ${jobID} not found.`)
      throw new ServiceAPIError(`Job with ID ${jobID} not found`, 404)
    }

    let tasks
    try {
      tasks = JSON.parse(jobData.tasks)
      console.info(tasks)
    } catch (parseError) {
      logger.error('Error parsing tasks:', parseError)
      throw new ServiceAPIError(`Invalid Job format `, 400)
    }

    // Create a entry for Job in DB
    const { id: job_execution_id } = await createJobExec({
      job_id: jobID,
      state: STATUS.SCHEDULED
    })

    const _task_ = tasks.map(
      (task: { task_id: UUID; id: UUID; retrycount: number; script: string; env: ENV; image: string }) => ({
        id: v4(),
        job_id: jobData.id,
        task_id: task.task_id,
        retrycount: task.retrycount,
        script: task.script,
        env: task.env,
        image: task.image,
        state: STATUS.PENDING,
        job_execution_id: job_execution_id
      })
    )
    const job: JOB = {
      id: job_execution_id,
      name: jobData.name,
      description: jobData.description,
      status: STATUS.PENDING,
      tasks: _task_
    }
    const addQueueJob = await publishJob(QUEUES.JOB_QUEUE, job)
    if (!addQueueJob) {
      logger.error(`Error while adding JOB to the ${QUEUES.JOB_QUEUE}`)
      throw new ServiceAPIError(`Internal Server Error`, 500)
    }

    //Insert to the DB with TaskID generated
    const _task_exec_ = _task_.map((task: any) => {
      const _insert_exec_task_: TaskexecutionInputSchema = {
        id: task.id,
        task_id: task.task_id,
        state: STATUS.PENDING,
        job_exc_id: job_execution_id
      }
      return createTaskExec(_insert_exec_task_)
    })

    await Promise.all(_task_exec_)
    return job
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw new ServiceAPIError(`An unexpected error occurred while running the job`, 500)
  }
}
export async function getJobs(limit: number, pages: number) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobSchema[] = await selectJobs(limit, (pages - 1) * limit)
    if (_jobdata_.length == 0) {
      throw new ServiceAPIError(`No Jobs found`, 404)
    }
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Jobs`, 500)
  }
}
export async function getJobById(jobID: UUID) {
  try {
    const _jobdata_: JobSchema = await selectjobbyID(jobID)
    if (!_jobdata_) {
      throw new ServiceAPIError(`No Jobs found with the ID - ${jobID}`, 404)
    }
    return _jobdata_
  } catch (error: any) {
    logger.error('Error Job by ID:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Jobs`, 500)
  }
}

export async function getexecJobs(limit: number, pages: number) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobexecutionSchema[] = await selectexecJobs(limit, (pages - 1) * limit)
    if (_jobdata_.length == 0) {
      throw new ServiceAPIError(`No Jobs executions found`, 404)
    }
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Job executions`, 500)
  }
}
export async function getexecJobById(jobexecID: UUID) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobexecutionSchema = await selectjobexecbyID(jobexecID)
    if (!_jobdata_) {
      throw new ServiceAPIError(`No Job executions found with the ID - ${jobexecID}`, 404)
    }
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job exec by ID:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Job executions`, 500)
  }
}
export async function taskexecById(taskexecID: UUID) {
  try {
    // considering page starts with number - 1
    const _taskdata_: JobexecutionSchema = await selecttaskexecbyID(taskexecID)
    if (!_taskdata_) {
      throw new ServiceAPIError(`No Task executions found with the ID - ${taskexecID}`, 404)
    }
    return _taskdata_
  } catch (error: any) {
    logger.error('Error running task exec by ID:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Task executions`, 500)
  }
}
export async function taskexecLog(taskexecID: UUID, part: number) {
  try {
    const _taskdata_ = await selecttaskexecLog(taskexecID, part)
    if (!_taskdata_) {
      throw new ServiceAPIError(`No Task Log found with the ID - ${taskexecID} , Part - ${part}`, 404)
    }
    return _taskdata_
  } catch (error: any) {
    logger.error('Error running task exec by ID:', error) // Log the error
    throw new ServiceAPIError(`Unable to retrive Task execution Logs`, 500)
  }
}

export async function getexecJobwithTasks(jobID: UUID) {
  try {
    const _jobtaskdata_ = await getJobexecwithTasks(jobID)
    return _jobtaskdata_
  } catch (error: any) {
    logger.error('Error select whole jobs & Task', error) // Log the error
    throw error
  }
} //This includes all the task status and all but no logs included.
