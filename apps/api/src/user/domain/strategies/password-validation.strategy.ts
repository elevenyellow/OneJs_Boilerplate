export interface PasswordValidationStrategy {
  validate(password: string): boolean
  getErrorMessage(): string
}
