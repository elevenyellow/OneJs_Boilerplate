import { UserRoles } from '@OneJs/core'

export const AppRoles = {
  ...UserRoles,
  MODERATOR: 'moderator',
} as const

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles]
