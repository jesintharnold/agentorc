export class DBError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'DBError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DBError)
    }
  }
}
