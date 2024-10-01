export class ServiceAPIError extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message)
    this.message = message
    this.statusCode = statusCode

    if (Error.stackTraceLimit) {
      Error.captureStackTrace(this, ServiceAPIError)
    }
  }
}
