import { ErrorCodes, Inject, OneJsError, UseAuth } from '@OneJs/core'
import { Controller, Get, Patch, Post } from '@OneJs/server'
import type { Context } from 'elysia'
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from '../../application/dtos/user.dto'
import { UserService } from '../../application/user.service'

@Controller('/auth')
export class AuthController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  // ── Public ────────────────────────────────────────────────

  @Post('/register')
  async register(ctx: Context) {
    const body = ctx.body as Partial<RegisterUserDto>
    if (!body?.email || !body?.password)
      throw new OneJsError(
        'Validation failed',
        400,
        'email and password are required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const dto = new RegisterUserDto(body.email, body.password)
    const user = await this.userService.register(dto.email, dto.password)

    ctx.set.status = 201
    return user.toDto()
  }

  @Post('/login')
  async login(ctx: Context) {
    const body = ctx.body as Partial<LoginDto>
    if (!body?.email || !body?.password)
      throw new OneJsError(
        'Validation failed',
        400,
        'email and password are required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const dto = new LoginDto(body.email, body.password)
    const { token, user } = await this.userService.login(
      dto.email,
      dto.password,
    )

    return { token, user: user.toDto() }
  }

  @Post('/forgot-password')
  async forgotPassword(ctx: Context) {
    const body = ctx.body as Partial<ForgotPasswordDto>
    if (!body?.email)
      throw new OneJsError(
        'Validation failed',
        400,
        'email is required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const dto = new ForgotPasswordDto(body.email)
    const resetToken = await this.userService.forgotPassword(dto.email)

    // In production: send email with reset link, never expose resetToken.
    // Returned here only for demo/development purposes.
    return {
      message: 'If the email exists, a reset link has been sent',
      ...(resetToken ? { resetToken } : {}),
    }
  }

  @Post('/reset-password')
  async resetPassword(ctx: Context) {
    const body = ctx.body as Partial<ResetPasswordDto>
    if (!body?.token || !body?.newPassword)
      throw new OneJsError(
        'Validation failed',
        400,
        'token and newPassword are required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const dto = new ResetPasswordDto(body.token, body.newPassword)
    await this.userService.resetPassword(dto.token, dto.newPassword)

    return { message: 'Password reset successfully' }
  }

  // ── Authenticated ─────────────────────────────────────────

  @Patch('/password')
  @UseAuth()
  async updatePassword(ctx: Context) {
    const body = ctx.body as Partial<UpdatePasswordDto>
    if (!body?.currentPassword || !body?.newPassword)
      throw new OneJsError(
        'Validation failed',
        400,
        'currentPassword and newPassword are required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const userId = (ctx.store as { user: { userId: string } }).user.userId
    const dto = new UpdatePasswordDto(body.currentPassword, body.newPassword)
    await this.userService.updatePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    )

    return { message: 'Password updated successfully' }
  }

  @Get('/me')
  @UseAuth()
  async me(ctx: Context) {
    const userId = (ctx.store as { user: { userId: string } }).user.userId
    const user = await this.userService.getById(userId)

    if (!user)
      throw new OneJsError(
        'Not Found',
        404,
        `User not found: ${userId}`,
        {},
        ErrorCodes.USER_NOT_FOUND,
      )

    return user.toDto()
  }
}
