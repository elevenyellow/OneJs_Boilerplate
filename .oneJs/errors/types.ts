import { ErrorCodes } from './error-codes'

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
