import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { GlobalConfig } from 'src/libs/config/global.config';
import { NodeEnv } from 'src/libs/types/common.types';

export class LoginRequest {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordRequest {
  @IsNotEmpty()
  @IsString()
  @IsEmail({
    blacklisted_chars:
      (GlobalConfig().server.env as NodeEnv) === 'production' ? '+' : '',
  })
  @ValidateIf((o: VerifyResetPasswordOtpRequest) => !o.username)
  email: string;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((o: VerifyResetPasswordOtpRequest) => !o.email)
  username: string;
}

export class ResetPasswordRequest {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class VerifyResetPasswordOtpRequest {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((o: VerifyResetPasswordOtpRequest) => !o.username)
  email: string;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((o: VerifyResetPasswordOtpRequest) => !o.email)
  username: string;
}
