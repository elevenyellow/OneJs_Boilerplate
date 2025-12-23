import { ErrorCodes } from './error-codes'

export const DefaultErrorMessages: Record<string, string> = {
  [ErrorCodes.AUTH_MISSING]: 'You must be logged in to access this resource.',
  [ErrorCodes.AUTH_INVALID]: 'Invalid authentication token.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired.',

  [ErrorCodes.USER_NOT_FOUND]: 'User not found.',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'This user already exists.',

  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed.',
  [ErrorCodes.PAYLOAD_MALFORMED]: 'Malformed data received.',

  [ErrorCodes.PERMISSION_DENIED]: 'Access denied.',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'Not found.',
  [ErrorCodes.SERVER_ERROR]: 'Server error.',
  [ErrorCodes.UNKNOWN]: 'An unknown error occurred.',
}
