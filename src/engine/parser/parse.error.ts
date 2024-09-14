export class ParseError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'ParseError'
  }
}
