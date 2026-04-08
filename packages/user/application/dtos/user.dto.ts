export class UserDto {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly role: string,
    readonly createdAt: Date,
  ) {}
}

export class RegisterUserDto {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}

export class LoginDto {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}

export class ForgotPasswordDto {
  constructor(readonly email: string) {}
}

export class ResetPasswordDto {
  constructor(
    readonly token: string,
    readonly newPassword: string,
  ) {}
}

export class UpdatePasswordDto {
  constructor(
    readonly currentPassword: string,
    readonly newPassword: string,
  ) {}
}
