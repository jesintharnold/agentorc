import { Postgres } from './datastore/postgres'
import { logger } from './logger/logger'

logger.info('Creating the engine')
logger.info('Connecting to Postres')
const A = Postgres.getInstance()
A.testConnection()
setTimeout(async () => {
  logger.info('Running the Query DB job Insert')
  // const job = {
  //   name: 'jesinth',
  //   description: 'Cat',
  //   tasks: JSON.stringify({ name: 'jesinth' }),
  //   status: 'PENDING',
  //   image: 'ubuntu',
  //   execorder: ['A', 'B']
  // }
}, 3000)
