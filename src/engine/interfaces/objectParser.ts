/* eslint-disable no-unused-labels */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { JobSchema } from './dbschema'
import { ENV, JOB, STATUS } from './enginecore'
import { UUID } from 'crypto'

export function DbtoJob(_jobdb_: JobSchema) {
  const _taskmap_ = JSON.parse(_jobdb_.tasks)
  _taskmap_.map((task: { task_id: UUID; id: UUID; retrycount: number; script: string; env: ENV; image: string }) => ({
    id: task.id,
    job_exc_id: _taskmap_.id,
    task_id: task.task_id,
    retrycount: task.retrycount,
    script: task.script,
    env: task.env,
    state: STATUS.PENDING,
    job_execution_id: _jobdb_.id,
    image: task.image
  }))
  const _job_: JOB = {
    id: _jobdb_.id,
    name: _jobdb_.name,
    description: _jobdb_.description,
    status: STATUS.PENDING,
    tasks: _taskmap_
  }
}
