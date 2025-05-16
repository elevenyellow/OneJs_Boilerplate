export class EyJsError extends Error {
  statusCode: number
  explanatoryMessage: string

  constructor(message: string, statusCode: number, explanatoryMessage: string) {
    super(message)
    this.statusCode = statusCode
    this.explanatoryMessage = explanatoryMessage

    // Establecer el prototipo explícitamente
    Object.setPrototypeOf(this, EyJsError.prototype)
  }

  toResponse() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      error: this.explanatoryMessage,
    }
  }
}
