/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transform, TransformCallback } from 'stream'
import { RuntimeError } from './runtime.error'
import { TASKLOG } from '../interfaces/enginecore'
import { publishTaskLog } from '../queue/queue-engine'

export class Streamlogger extends Transform {
  private chunkSize: number
  private interval: number
  private chunkqueue: Buffer[]
  private part: number
  private taskID: string
  private timerInterval: NodeJS.Timeout | undefined
  constructor(taskID: TASKLOG['taskid'], chunkSize: number = 1000, interval: number = 1000) {
    super()
    this.chunkSize = chunkSize
    this.interval = interval
    this.chunkqueue = []
    this.part = 0
    this.taskID = taskID

    this.startQueueTimer()
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      let cleanedLogs = ''
      const headerLength = 8
      if (this.chunkqueue.length >= this.chunkSize) {
        callback(new RuntimeError('Log Buffer full'))
        return
      }

      let index = 0
      while (index < chunk.length) {
        const messageLength = chunk.readUInt32BE(index + 4)
        const logMessage = chunk.slice(index + headerLength, index + headerLength + messageLength).toString('utf-8')
        cleanedLogs += logMessage
        index += headerLength + messageLength
      }
      this.chunkqueue.push(Buffer.from(cleanedLogs))
      callback()
    } catch (error: any) {
      callback(new RuntimeError(error?.message))
    }
  }
  private async startQueueTimer(): Promise<void> {
    this.timerInterval = setInterval(async () => {
      if (this.chunkqueue.length > 0) {
        const buffer = Buffer.concat(this.chunkqueue)
        this.chunkqueue = []
        this.part += 1
        try {
          const logcontent: TASKLOG = {
            taskid: this.taskID,
            content: buffer.toString(),
            logpart: this.part
          }
          await publishTaskLog(logcontent)
          this.emit('flushed', `Queue pushed - ${this.part}`)
        } catch (error: any) {
          this.emit('error', error?.message)
        }
      }
    }, this.interval)
  }
  public cleanup(): void {
    if (this.timerInterval != undefined) {
      clearInterval(this.timerInterval)
    }
    super.destroy()
  }
}
