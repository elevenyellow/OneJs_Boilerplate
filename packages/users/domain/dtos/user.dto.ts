/**
 * DTO for User database representation
 */
export interface UserDatabaseDto {
  id: string
  clerkId: string
  email: string
  name: string | null
  avatar: string | null
  preferences: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for User API response
 */
export interface UserResponseDto {
  id: string
  clerkId: string
  email: string
  name: string | null
  avatar: string | null
  preferences: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

/**
 * DTO for creating a user
 */
export interface CreateUserInputDto {
  clerkId: string
  email: string
  name?: string | null
  avatar?: string | null
  preferences?: Record<string, unknown> | null
}

/**
 * DTO for updating a user
 */
export interface UpdateUserInputDto {
  name?: string | null
  avatar?: string | null
  preferences?: Record<string, unknown> | null
}
