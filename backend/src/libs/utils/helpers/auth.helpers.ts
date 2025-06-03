import * as argon2 from 'argon2';
import { AuthJwtPayload } from './types/auth.helpers.types';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/libs/cache/cache.service';
import { Device } from 'src/libs/database/entities/device.entity';
import { CommonHelpers } from './common.helpers';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { User } from 'src/libs/database/entities/user.entity';
import * as moment from 'moment';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthHelpers {
  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly jwtService: JwtService,
  ) {}
  /**
   * Hash a plain text password using Argon2
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    try {
      const hashedPassword = await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  /**
   * Verify a plain text password against a hashed password
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      throw new Error('Error verifying password');
    }
  }

  async signRefreshToken(payload: AuthJwtPayload, device: Device) {
    await this.cache.delete(
      `refresh:${payload.id}:${device?.id ?? 'anonymous'}`,
    );

    const token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refresh_token_secret'),
      expiresIn: `${this.config.get<string>(
        'jwt.refresh_token_expiration_minutes',
      )}m`,
    });

    const ttl = CommonHelpers.getTTLFromJWT(token);

    await this.cache.set(
      `refresh:${payload.id}:${device.id}`,
      token,
      ttl || 1000,
    );

    return {
      token,
      exp: CommonHelpers.getJWTExpiryMoment(token).toISOString(),
    };
  }

  async signAccessToken(payload: AuthJwtPayload, device: Device) {
    await this.cache.delete(
      `nexus:access:${payload.id}:${device?.id ?? 'anonymous'}`,
    );

    const token = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.access_token_secret'),
      expiresIn: `${this.config.get<string>(
        'jwt.access_token_expiration_minutes',
      )}m`,
    });

    const ttl = CommonHelpers.getTTLFromJWT(token);

    await this.cache.set(
      `nexus:access:${payload.id}:${device.id}`,
      token,
      ttl || 1000,
    );

    return {
      token,
      exp: CommonHelpers.getJWTExpiryMoment(token).toISOString(),
    };
  }

  async verifyRefreshToken(token: string): Promise<AuthJwtPayload | null> {
    try {
      const decoded: AuthJwtPayload = await this.jwtService.verify(token, {
        secret: this.config.get('jwt.refresh_token_secret'),
      });

      return decoded;
    } catch (err) {
      console.log('🚀🚀🚀', { err });
      return null;
    }
  }

  async verifyAccessToken(token: string): Promise<AuthJwtPayload | null> {
    try {
      const decoded: AuthJwtPayload = await this.jwtService.verify(token, {
        secret: this.config.get('jwt.access_token_secret'),
      });
      return decoded;
    } catch (err) {
      console.log('verifyAccessToken', { err });
      return null;
    }
  }

  generateTwoFactorAuthenticationSecret(user: User) {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, `Nexus Stack`, secret);
    return {
      secret,
      otpAuthUrl,
    };
  }

  validateTwoFactorAuthenticationCode(
    twoFactorAuthenticationCode: string,
    secret: string,
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret,
    });
  }

  async generateBackupCodes(count = 6) {
    const backupCodes = [];
    for (let i = 0; i < count; i++) {
      const fullToken = (await this.getResetPasswordDetails())
        .hashedResetPasswordToken;
      backupCodes.push(`${fullToken.slice(0, 10)}`);
    }
    return backupCodes;
  }

  generateSessionId() {
    return `${moment().format('YYYYMMDDHmmss')}-00-${CommonHelpers.generateReference(
      10,
    )}`;
  }

  async getResetPasswordDetails() {
    // Generate reset password token
    const resetPasswordToken = randomBytes(20).toString('hex');

    // Hash reset password token
    const hashedResetPasswordToken = createHash('sha256')
      .update(resetPasswordToken)
      .digest('hex');

    // Set resetPasswordExpire
    const resetPasswordTokenExpires = moment()
      .add(this.config.get('defaults.reset_password_expires'), 'minutes')
      .toDate();

    return {
      resetPasswordToken,
      hashedResetPasswordToken,
      resetPasswordTokenExpires,
    };
  }

  async generateLoginToken(user: User, device: UAParser.IResult) {
    const {
      resetPasswordToken: loginToken,
      hashedResetPasswordToken: hashedLoginToken,
      resetPasswordTokenExpires: loginTokenExpires,
    } = await this.getResetPasswordDetails();
    const ttl = CommonHelpers.getTTLfromDate(loginTokenExpires);

    const previousLoginToken = await this.cache.get(
      `nexus:auth:login_token:${user.email}`,
    );

    if (previousLoginToken) {
      const hashedSavedResetPasswordToken = createHash('sha256')
        .update(previousLoginToken)
        .digest('hex');

      await this.cache.delete(hashedSavedResetPasswordToken);
    }

    await this.cache.set(
      hashedLoginToken,
      JSON.stringify({
        loginToken,
        adminUserId: user.id,
        device: device,
      }),
      ttl || 1000,
    );

    await this.cache.set(
      `nexus:admin:login_token:${user.email}`,
      loginToken,
      ttl || 1000,
    );

    return { loginToken };
  }
}
