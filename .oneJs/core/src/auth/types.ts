export type UserRole = 'user' | 'admin' | 'staff';

export const UserRoles = {
  USER: 'user' as UserRole,
  ADMIN: 'admin' as UserRole,
  STAFF: 'staff' as UserRole,
} as const;

export interface AuthUser {
  userId: string;
  email?: string;
  role: UserRole | string; // Allows custom roles
  payload: any;
}

export interface AuthStrategy {
  validate(token: string): Promise<AuthUser>;
}

