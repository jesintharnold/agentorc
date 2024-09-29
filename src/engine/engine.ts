import { Postgres } from './datastore/postgres'
import { logger } from './logger/logger'

logger.info('Creating the engine')
logger.info('Connecting to Postres')
const A = Postgres.getInstance()
A.testConnection()
