/* eslint-disable no-undef */
const { EventEmitter } = require('events')

class MessageBroker {
  constructor() {
    this.eventEmitter = new EventEmitter()
  }

  async publishTaskLogPart(taskLogPart) {
    // Simulate broker publishing
    this.eventEmitter.emit('taskLogPart', taskLogPart)
    return Promise.resolve()
  }

  // For testing/demonstration purposes
  onTaskLogPart(callback) {
    this.eventEmitter.on('taskLogPart', callback)
  }
}

class LogForwarder {
  constructor(broker, taskId, options = {}) {
    this.broker = broker
    this.taskId = taskId
    this.part = 0
    this.queue = []
    this.buffer = []
    this.isDestroyed = false

    // Configuration options with defaults
    this.options = {
      bufferSize: options.bufferSize || 1000,
      flushInterval: options.flushInterval || 1000, // ms
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000 // ms
    }

    this.startFlushTimer()
  }

  write(data) {
    if (this.isDestroyed) {
      throw new Error('LogForwarder has been destroyed')
    }

    return new Promise((resolve, reject) => {
      const copy = Buffer.from(data)

      if (this.queue.length >= this.options.bufferSize) {
        reject(new Error('Buffer full, unable to write'))
        return
      }

      this.queue.push(copy)
      resolve(data.length)
    })
  }

  async publishWithRetry(taskLogPart, attempts = 0) {
    try {
      await this.broker.publishTaskLogPart(taskLogPart)
    } catch (error) {
      if (attempts < this.options.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay * Math.pow(2, attempts)))
        return this.publishWithRetry(taskLogPart, attempts + 1)
      }
      throw error
    }
  }

  startFlushTimer() {
    this.flushInterval = setInterval(async () => {
      if (this.queue.length === 0) return

      // Process all queued items
      while (this.queue.length > 0) {
        const data = this.queue.shift()
        this.buffer.push(data)
      }

      if (this.buffer.length > 0) {
        const concatenatedBuffer = Buffer.concat(this.buffer)
        this.part += 1

        const taskLogPart = {
          number: this.part,
          taskId: this.taskId,
          contents: concatenatedBuffer.toString()
        }

        try {
          await this.publishWithRetry(taskLogPart)
        } catch (error) {
          console.error('Failed to forward log part after retries:', error)
          // Requeue failed messages
          this.queue.unshift(Buffer.from(concatenatedBuffer))
        }

        // Clear buffer after successful publish
        this.buffer = []
      }
    }, this.options.flushInterval)
  }

  destroy() {
    this.isDestroyed = true
    clearInterval(this.flushInterval)
    this.queue = []
    this.buffer = []
  }
}

// Example usage and helper class for logging
class TaskLogger {
  constructor(broker, taskId, options = {}) {
    this.forwarder = new LogForwarder(broker, taskId, options)
  }

  async log(message) {
    const timestamp = new Date().toISOString()
    const formattedMessage = `${timestamp} - ${message}\n`
    await this.forwarder.write(Buffer.from(formattedMessage))
  }

  destroy() {
    this.forwarder.destroy()
  }
}

module.exports = {
  LogForwarder,
  TaskLogger,
  MessageBroker
}
