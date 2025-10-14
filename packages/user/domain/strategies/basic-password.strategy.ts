import { Injectable } from '@OneJs'
import { PasswordValidationStrategy } from './password-validation.strategy'

@Injectable()
export class BasicPasswordStrategy implements PasswordValidationStrategy {
  validate(password: string): boolean {
    return password.length >= 6
  }

  getErrorMessage(): string {
    return 'Password must be at least 6 characters long'
  }
}
