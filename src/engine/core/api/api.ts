import express from 'express'
import { logger } from '../../logger/logger'
import { AddressInfo } from 'net'
const server: express.Application = express()

server.use(express.json())

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
