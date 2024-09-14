import { Request, Response, Router } from 'express'
import { schemavalidation } from './schema/middleware'
import { getjobschema, runJobschema, tasklogschema, taskschema } from './schema/jobschema'
import { JOB } from '../../interfaces/enginecore'
import { convertJson } from '../../parser/yamltojson'
import { getexecJobById, getexecJobs, getJobById, getJobs, runJob, saveJob, taskexecById, taskexecLog } from './service'
import { JobexecutionSchema, JobSchema, TasklogSchema } from '../../interfaces/dbschema'

export const jobengineroute = Router()

// Insert router middleware here
// engineroute.use()
jobengineroute.post('/add', async (req: Request, res: Response) => {
  const { job } = req.body
  const _jobdata_: JOB = await convertJson(job)
  const _save_ = await saveJob(_jobdata_)
  return res.status(200).json({
    jobid: _save_.id
  })
})
jobengineroute.post('/run', schemavalidation(runJobschema), async (req: Request, res: Response): Response => {
  const { jobid } = req.body
  const job: JOB = await runJob(jobid)
  return res.status(200).json({
    jobid: job.id,
    status: job.status
  })
})
jobengineroute.get('/', schemavalidation(getjobschema), async (req: Request, res: Response): Promise<Response> => {
  const { limit, page } = req.body
  const _getjobs_ = await getJobs(limit, page)
  return res.status(200).json(_getjobs_)
})
jobengineroute.post('/', schemavalidation(runJobschema), async (req: Request, res: Response): Promise<Response> => {
  const { jobid } = req.body
  const job: JobSchema = await getJobById(jobid)
  return res.status(200).json(job)
})
jobengineroute.get('/executions', async (req: Request, res: Response): Promise<Response> => {
  const { limit, page } = req.body
  const _getjobsexec_ = await getexecJobs(limit, page)
  return res.status(200).json(_getjobsexec_)
})
jobengineroute.post(
  '/executions',
  schemavalidation(runJobschema),
  async (req: Request, res: Response): Promise<Response> => {
    const { jobid } = req.body
    const job: JobexecutionSchema = await getexecJobById(jobid)
    return res.status(200).json(job)
  }
)

export const taskengineroute = Router()
jobengineroute.get(
  '/executions',
  schemavalidation(taskschema),
  async (req: Request, res: Response): Promise<Response> => {
    const { taskid } = req.body
    const task: JobexecutionSchema = await taskexecById(taskid)
    return res.status(200).json(task)
  }
)
jobengineroute.get(
  '/executions/log',
  schemavalidation(tasklogschema),
  async (req: Request, res: Response): Promise<Response> => {
    const { taskid, logpart } = req.body
    const tasklog: TasklogSchema = await taskexecLog(taskid, logpart)
    return res.status(200).json(tasklog)
  }
)
