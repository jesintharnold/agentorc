/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect, AmqpConnectionManager, ChannelWrapper, Channel } from 'amqp-connection-manager'

export class Rabbitmq {
  private amqpConnection: AmqpConnectionManager
  private static queueSingleton: Rabbitmq
  private channelWrapper: ChannelWrapper
  private queueNames: string[]
  constructor(queueNames: string[]) {
    this.queueNames = queueNames
    this.amqpConnection = connect(['amqp://localhost'])
    this.amqpConnection.on('connect', () => console.info('Rabbit Mq connected'))
    this.amqpConnection.on('disconnect', (err: unknown) => console.error('Disconnected from RabbitMQ', err))
    this.amqpConnection.on('connectFailed', (err: unknown, url: unknown) =>
      console.error('Connection failed to RabbitMQ', err, url)
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
      console.info(`Queue ${queue} created`)
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
      console.error(error?.message)
      return false
    }
  }

  public con(): AmqpConnectionManager {
    return this.amqpConnection
  }

  public async publish(QueueName: string, data: unknown): Promise<void> {
    await this.channelWrapper.sendToQueue(QueueName, data)
  }
  public async subscribe(QueueName: string, callback: (data: unknown) => Promise<void>): Promise<void> {
    await this.channelWrapper.consume(QueueName, async (data) => {
      await callback(data.content)
      this.channelWrapper.ack(data)
    })
    console.info(`Subscribed to ${QueueName}`)
  }
}
