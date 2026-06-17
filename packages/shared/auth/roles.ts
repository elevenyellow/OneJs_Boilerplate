import { UserRoles } from '@OneJs/auth'

export const AppRoles = {
  ...UserRoles,
  MODERATOR: 'moderator',
} as const

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles]
