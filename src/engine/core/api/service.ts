/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  getJobexecwithTasks
} from '../../datastore/dbengine'
import { orderTask } from '../../dependencygraph/taskorder'
import { UUID } from 'crypto'
import { publishJob, QUEUES } from '../../queue/queue-engine'
import { JobexecutionSchema, JobSchema, TaskexecutionInputSchema } from '../../interfaces/dbschema'

async function saveJob(jobs: JOB) {
  try {
    const _depgraph_ = await orderTask(jobs)
    jobs.execorder = { order: [..._depgraph_] }
    const DB = await createJob({
      name: jobs.name,
      description: jobs.description,
      execorder: JSON.stringify(jobs.execorder),
      tasks: JSON.stringify(jobs.tasks),
      image: jobs.image
    })
    return DB
  } catch (error: any) {
    logger.error(`Save Job error - ${error.message}`)
    throw error
  }
}

async function runJob(jobID: UUID) {
  try {
    const jobData = await selectjobbyID(jobID)
    if (!jobData) {
      logger.warn(`Job with ID ${jobID} not found.`)
      return null // Return null if job data is not found
    }

    let tasks
    try {
      tasks = JSON.parse(jobData.tasks)
    } catch (parseError) {
      logger.error('Error parsing tasks:', parseError)
      throw new Error('Invalid tasks format')
    }

    const _task_ = tasks.map((task: { task_id: UUID; id: UUID; retrycount: number; script: string; env: ENV }) => ({
      id: v4(),
      job_exc_id: jobID,
      task_id: task.task_id,
      retrycount: task.retrycount,
      script: task.script,
      env: task.env,
      state: STATUS.PENDING,
      job_execution_id: jobData.id,
      output: null
    }))
    const job: JOB = {
      id: jobData.id,
      name: jobData.name,
      description: jobData.description,
      image: jobData.image,
      status: STATUS.PENDING,
      execorder: JSON.parse(jobData.tasks),
      tasks: _task_
    }
    const addQueueJob = await publishJob(QUEUES.JOB_PENDING_QUEUE, job)
    if (!addQueueJob) {
      throw Error('Publish JOB - Queue error')
    }
    //Insert to the DB with TaskID generated
    const _task_exec_ = _task_.map((task: any) => {
      const _insert_exec_task_: TaskexecutionInputSchema = {
        id: task.id,
        task_id: task.task_id,
        state: STATUS.PENDING
      }
      return createTaskExec(_insert_exec_task_)
    })
    await Promise.all(_task_exec_)
    return job
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw error
  }
}
async function getJobs(limit: number, pages: number) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobSchema[] = await selectJobs(limit, (pages - 1) * limit)
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw error
  }
}
async function getJobById(jobID: UUID) {
  try {
    const _jobdata_: JobSchema = await selectjobbyID(jobID)
    return _jobdata_
  } catch (error: any) {
    logger.error('Error Job by ID:', error) // Log the error
    throw error
  }
}

async function getexecJobs(limit: number, pages: number) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobexecutionSchema[] = await selectexecJobs(limit, (pages - 1) * limit)
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job:', error) // Log the error
    throw error
  }
}
async function getexecJobById(jobexecID: UUID) {
  try {
    // considering page starts with number - 1
    const _jobdata_: JobexecutionSchema = await selectjobexecbyID(jobexecID)
    return _jobdata_
  } catch (error: any) {
    logger.error('Error running job exec by ID:', error) // Log the error
    throw error
  }
}
async function taskexecById(taskexecID: UUID) {
  try {
    // considering page starts with number - 1
    const _taskdata_: JobexecutionSchema = await selecttaskexecbyID(taskexecID)
    return _taskdata_
  } catch (error: any) {
    logger.error('Error running task exec by ID:', error) // Log the error
    throw error
  }
}
async function taskexecLog(taskexecID: UUID, part: number) {
  try {
    const _taskdata_ = await selecttaskexecLog(taskexecID, part)
    return _taskdata_
  } catch (error: any) {
    logger.error('Error running task exec by ID:', error) // Log the error
    throw error
  }
}

async function getexecJobwithTasks(jobID: UUID) {
  try {
    const _jobtaskdata_ = await getJobexecwithTasks(jobID)
    return _jobtaskdata_
  } catch (error: any) {
    logger.error('Error select whole jobs & Task', error) // Log the error
    throw error
  }
} //This includes all the task status and all but no logs included.
