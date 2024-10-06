export class DockerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DockerRuntimeError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DockerError)
    }
  }
}
