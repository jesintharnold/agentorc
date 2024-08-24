/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect, AmqpConnectionManager, ChannelWrapper, Channel } from 'amqp-connection-manager'
import { logger } from '../logger/logger'

export class Rabbitmq {
  private amqpConnection: AmqpConnectionManager
  private static queueSingleton: Rabbitmq
  private channelWrapper: ChannelWrapper
  private queueNames: string[]
  constructor(queueNames: string[]) {
    this.queueNames = queueNames
    this.amqpConnection = connect(['amqp://localhost'])
    this.amqpConnection.on('connect', () => logger.info('Rabbit Mq connected'))
    this.amqpConnection.on('disconnect', (err: unknown) => logger.error('Disconnected from RabbitMQ', err))
    this.amqpConnection.on('connectFailed', (err: unknown, url: unknown) =>
      logger.error('Connection failed to RabbitMQ', err, url)
    )

    this.channelWrapper = this.amqpConnection.createChannel({
      json: true,
      setup: async (channel: any) => {
        await this.setupQueues(channel, this.queueNames)
      }
    })
  }
  private async setupQueues(channel: Channel, queueNames: string[]): Promise<void> {
    for (const queue of queueNames) {
      await channel.assertQueue(queue, { durable: true })
      logger.info(`Queue ${queue} created`)
    }
  }

  public static getInstance(queueNames: string[] = []): Rabbitmq {
    if (!this.queueSingleton) {
      this.queueSingleton = new Rabbitmq(queueNames)
    }
    return this.queueSingleton
  }

  public async closeMQ(): Promise<boolean> {
    try {
      await this.amqpConnection.close()
      return true
    } catch (error: any) {
      logger.error(error?.message)
      return false
    }
  }

  public con(): AmqpConnectionManager {
    return this.amqpConnection
  }

  public async publish(QueueName: string, data: unknown): Promise<boolean> {
    try {
      await this.channelWrapper.sendToQueue(QueueName, data)
      return true
    } catch (error: any) {
      logger.error(`Failed to publish to ${QueueName}: ${error?.message}`)
      return false
    }
  }
  public async subscribe(QueueName: string, callback: (data: any) => Promise<void>): Promise<void> {
    logger.info(`Subscribed to ${QueueName}`)
    return await this.channelWrapper.consume(QueueName, async (data) => {
      try {
        await callback(data)
        this.channelWrapper.ack(data)
      } catch (error: any) {
        this.channelWrapper.nack(data)
        logger.error(`Error processing message from ${QueueName}: ${error?.message}`)
      }
    })
  }
}
