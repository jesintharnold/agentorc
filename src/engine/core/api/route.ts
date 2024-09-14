import { Request, Response, Router } from 'express'
import { schemavalidation } from './schema/middleware'
import { runJobschema, tasklogschema, taskschema } from './schema/jobschema'

export const jobengineroute = Router()

// Insert router middleware here
// engineroute.use()
jobengineroute.post('/add', (req: Request, res: Response) => {
  // validate the YAML
  // convert to JOBS
  // call the function
})
jobengineroute.post('/run', schemavalidation(runJobschema),(req: Request, res: Response) => {})
jobengineroute.get('/', (req: Request, res: Response) => {})
jobengineroute.post('/', schemavalidation(runJobschema), (req: Request, res: Response) => {})
jobengineroute.get('/executions', (req: Request, res: Response) => {})
jobengineroute.post('/executions', schemavalidation(runJobschema), (req: Request, res: Response) => {})

export const taskengineroute = Router()
jobengineroute.get('/executions', schemavalidation(taskschema), (req: Request, res: Response) => {})
jobengineroute.get('/executions/log', schemavalidation(tasklogschema), (req: Request, res: Response) => {})
