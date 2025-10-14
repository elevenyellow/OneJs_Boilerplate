import { EyJsError } from '@OneJs'

export class CreateUserDto {
  constructor(
    public name: string,
    public email: string,
    public password: string,
    public createdAt?: Date,
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.email) {
      throw new EyJsError('Email is required', 400, 'Email is required')
    }

    if (!this.isValidEmail(this.email)) {
      throw new EyJsError('Invalid email format', 400, 'Invalid email format')
    }

    if (!this.name) {
      throw new EyJsError('Name is required', 400, 'Name is required')
    }

    if (this.name.length < 2) {
      throw new EyJsError(
        'Name must be at least 2 characters long',
        400,
        'Name must be at least 2 characters long',
      )
    }

    if (!this.password) {
      throw new EyJsError('Password is required', 400, 'Password is required')
    }

    if (this.password.length < 6) {
      throw new EyJsError(
        'Password must be at least 6 characters long',
        400,
        'Password must be at least 6 characters long',
      )
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static create(email: string, name: string, password: string): CreateUserDto {
    return new CreateUserDto(name, email, password, new Date())
  }
}
