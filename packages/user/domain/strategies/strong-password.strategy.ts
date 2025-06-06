import { Injectable } from '@EyJs'
import type { PasswordValidationStrategy } from './password-validation.strategy'

@Injectable()
export class StrongPasswordStrategy implements PasswordValidationStrategy {
  validate(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8

    return (
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar &&
      isLongEnough
    )
  }

  getErrorMessage(): string {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters'
  }
}
