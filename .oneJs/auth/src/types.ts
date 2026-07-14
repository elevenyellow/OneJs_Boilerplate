export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles]

export interface AuthUser {
  userId: string
  email?: string
  role: UserRole | string
  payload: Record<string, unknown>
}

export interface AuthStrategy {
  validate(token: string): Promise<AuthUser>
}
