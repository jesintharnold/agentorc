import express from 'express'
import { logger } from '../../logger/logger'
import { AddressInfo } from 'net'
import { jobengineroute, taskengineroute } from './route'
const server: express.Application = express()

server.use(express.json())
server.use('/jobs', jobengineroute)
server.use('/tasks', taskengineroute)

const PORT = 5005
const app = server.listen(PORT, () => {
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
