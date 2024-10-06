export class RuntimeError extends Error {
  constructor(message: string, env: string = 'Docker') {
    super(message)
    this.name = `${env} Runtime Error`

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RuntimeError)
    }
  }
}
