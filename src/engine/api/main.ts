import express from 'express'
import { logger } from '../../logger/logger'
import { AddressInfo } from 'net'
import { jobengineroute, taskengineroute } from './route'
import { initEngine } from '../engine'
import bodyParser from 'body-parser'
import { Worker } from '../../worker/worker'

const server: express.Application = express()
server.use(bodyParser.text({ type: ['application/yaml', 'text/yaml', 'application/x-yaml'] }))
server.use(express.json())
server.use('/jobs', jobengineroute)
server.use('/tasks', taskengineroute)

const PORT = 5005
const app = server.listen(PORT, async () => {
  await initEngine() //creating a Initalizer for Engine coordinator
  const worker = new Worker('1')
  worker.startConsumer()

  const address = app.address()
  if (address && typeof address !== 'string') {
    const netObj: AddressInfo = address
    const port: number = netObj.port
    const hostname: string = netObj.address
    logger.info(`Engine API started and running in ${hostname}${port}`)
  } else {
    logger.info('Engine API started but address is not available')
  }
})
