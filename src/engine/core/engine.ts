/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Postgres } from '../datastore/postgres'
import { logger } from '../logger/logger'
import { QUEUES_LIST } from '../queue/queue-engine'
import { Rabbitmq } from '../queue/rabbitmq'
import { Enginelisteners } from '../queue/queue-listeners'

export async function initEngine() {
  try {
    //Initate Postgres
    const postgres = await Postgres.getInstance().testConnection()
    if (postgres) {
      //Initate RabbitMQ
      const RMQ = new Rabbitmq(QUEUES_LIST)
      await RMQ.getWrapper().waitForConnect()
      //Initate Listeners
      new Enginelisteners()
      //Initate controller API
      logger.info(`Controller Init successfull`)
    }
  } catch (error: any) {
    logger.error('Error during controller initialization:', error)
    throw error
  }
}
