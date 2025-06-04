import { Injectable } from '@nestjs/common';
import {
  LoginRequest,
  ResetPasswordRequest,
  VerifyResetPasswordOtpRequest,
} from './dto/request.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Equal, IsNull, Repository } from 'typeorm';
import { User } from 'src/libs/database/entities/user.entity';
import { IBadRequestException } from 'src/libs/exceptions/exceptions';
import { AuthHelpers } from 'src/libs/utils/helpers/auth.helpers';
import { RequestContextService } from 'src/libs/utils/services/request-context';
import { Device } from 'src/libs/database/entities/device.entity';
import { Response } from 'src/libs/utils/http/response.util';
import { LoginResponse } from './dto/response.dto';
import { CacheService } from 'src/libs/cache/cache.service';
import { Response as ExpressResponse } from 'express';
import * as moment from 'moment';
import { CommonHelpers } from 'src/libs/utils/helpers/common.helpers';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  userRepository: Repository<User>;
  deviceRepository: Repository<Device>;

  constructor(
    @InjectDataSource() private readonly datasource: DataSource,
    private readonly authHelpers: AuthHelpers,
    private readonly reqContext: RequestContextService,
    private readonly cache: CacheService,
  ) {
    this.userRepository = this.datasource.getRepository(User);
    this.deviceRepository = this.datasource.getRepository(Device);
  }

  async login(payload: LoginRequest, res: ExpressResponse) {
    const { password, username } = payload;

    const user = await this.userRepository.findOne({
      where: {
        username: Equal(username),
      },
    });

    if (!user)
      throw new IBadRequestException({
        message: 'Invalid credentials',
      });

    const passwordMatches = await AuthHelpers.verifyPassword(
      password,
      user.password,
    );

    if (!passwordMatches)
      throw new IBadRequestException({
        message: 'Invalid credentials',
      });

    const req = this.reqContext.req;

    let savedDevice: Device;

    if (req.device.os?.name && req.device.os?.version) {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(user.id),
          os: req.device.os.name,
          versionId: req.device.os.version,
        },
      });
    } else {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(user.id),
          userAgent: Equal(this.reqContext.req.device.ua),
        },
      });
    }
    const { device } = req;

    if (!savedDevice)
      savedDevice = await this.deviceRepository.save({
        userId: user.id,
        os: device.os.name,
        versionId: device.os.version,
        model: device.device.model,
        userAgent: device.ua,
      });

    const [access, refresh] = await Promise.all([
      this.authHelpers.signAccessToken(
        {
          id: user.id,
          currentTeamId: user.currentTeamId,
        },
        savedDevice,
      ),
      this.authHelpers.signRefreshToken(
        {
          id: user.id,
          currentTeamId: user.currentTeamId,
        },
        savedDevice,
      ),
    ]);

    res.cookie('access_token', access.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: moment(access.exp).diff(moment(), 'milliseconds'),
    });

    res.cookie('refresh_token', refresh.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: moment(refresh.exp).diff(moment(), 'milliseconds'),
    });

    delete access.token;
    delete refresh.token;

    return Response.success({
      message: 'Login successful',
      data: new LoginResponse({
        access,
        refresh,
        user,
      }),
      event: {
        payload: {
          after: {
            user,
          },
          before: {},
        },
        key: user.id,
        name: 'auth:login',
      },
    });
  }

  async logout(res: ExpressResponse) {
    const { user, currentDevice } = this.reqContext.req;

    await this.cache.delete(`nexus:access:${user.id}:${currentDevice?.id}`);

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return Response.success({ message: 'Logout successful.' });
  }

  async refreshToken(res: ExpressResponse) {
    const { user, currentDevice } = this.reqContext.req;

    const [access, refresh] = await Promise.all([
      this.authHelpers.signAccessToken(
        {
          id: user.id,
          currentTeamId: user.currentTeamId,
        },
        currentDevice,
      ),
      this.authHelpers.signRefreshToken(
        {
          id: user.id,
          currentTeamId: user.currentTeamId,
        },
        currentDevice,
      ),
    ]);

    res.cookie('access_token', access.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: moment(access.exp).diff(moment(), 'milliseconds'),
    });

    res.cookie('refresh_token', refresh.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: moment(refresh.exp).diff(moment(), 'milliseconds'),
    });

    delete access.token;
    delete refresh.token;

    return Response.success({
      message: 'Token refreshed successfully.',
      data: new LoginResponse({
        access,
        refresh,
        user,
      }),
      event: {
        payload: {
          after: {
            user,
          },
          before: {},
        },
        key: user.id,
        name: 'auth:session:refresh',
      },
    });
  }

  async initiateResetPassword({
    email,
    username,
  }: {
    email: string;
    username: string;
  }) {
    let user: User;

    if (email)
      user = await this.userRepository.findOne({
        where: {
          email: Equal(email.trim().toLowerCase()),
          deletedAt: IsNull(),
        },
      });

    if (username)
      user = await this.userRepository.findOne({
        where: {
          username: Equal(username.trim()),
          deletedAt: IsNull(),
        },
      });

    if (user) {
      const otp = CommonHelpers.generateRandomCode(6);

      const encryptedOtp = createHash('sha256').update(otp).digest('hex');

      await this.cache.set(
        `reset_password_otp:${encryptedOtp}`,
        JSON.stringify({ userId: user.id }),
        600000,
      );

      // TODO Implement notification
    }

    return Response.success({
      message: 'Password reset initiated successfully',
      event: {
        payload: {
          after: {
            user,
          },
          before: {},
        },
        key: user.id,
        name: 'auth:password:reset:initiate',
      },
    });
  }

  async resetPassword({
    token,
    password,
    confirmPassword,
  }: ResetPasswordRequest) {
    const { device } = this.reqContext.req;

    const savedTokenDetails: {
      userId: string;
    } = await this.cache.get(`reset_password_token:${token}`);

    if (!savedTokenDetails?.userId) {
      throw new IBadRequestException({
        message:
          'Oops! That reset password token is invalid. Please try again.',
      });
    }

    if (password !== confirmPassword) {
      throw new IBadRequestException({
        message: 'Passwords do not match',
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: Equal(savedTokenDetails.userId), deletedAt: IsNull() },
    });

    if (!user) {
      throw new IBadRequestException({
        message:
          'Oops! That reset password token is invalid. Please try again.',
      });
    }

    await this.userRepository.update(
      {
        id: user.id,
      },
      { password: await AuthHelpers.hashPassword(password) },
    );

    let savedDevice: Device;

    if (device.os?.name && device.os?.version) {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(user.id),
          os: device.os.name,
          versionId: device.os.version,
        },
      });
    } else {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(user.id),
          userAgent: Equal(device.ua),
        },
      });
    }

    const allSavedDevices = await this.deviceRepository.find({
      where: {
        userId: Equal(user.id),
      },
    });
    for (const dev of allSavedDevices) {
      if (dev.id !== savedDevice?.id) {
        await this.cache.delete(`auth:${user.id}:${dev.id}`);
      }
    }

    await this.cache.delete(`reset_password_otp:${token}`);

    return Response.success({
      message:
        'You have successfully reset your password. Please proceed to login.',
      event: {
        payload: {
          after: {
            user,
          },
          before: {},
        },
        key: user.id,
        name: 'auth:password:reset:complete',
      },
    });
  }

  async verifyResetPasswordOtp({
    otp,
    email,
    username,
  }: VerifyResetPasswordOtpRequest) {
    const encryptedOtp = createHash('sha256').update(otp).digest('hex');

    let user = await this.userRepository.findOne({
      where: { email: Equal(email.trim().toLowerCase()), deletedAt: IsNull() },
    });

    if (!user) {
      user = await this.userRepository.findOne({
        where: {
          username: Equal(username.trim()),
          deletedAt: IsNull(),
        },
      });

      if (!user)
        throw new IBadRequestException({
          message: 'Invalid OTP',
          _meta: {
            message: `User with ${email} does not exist`,
          },
        });
    }

    const savedTokenDetails: {
      userId: string;
    } = await this.cache.get(`reset_password_otp:${encryptedOtp}`);

    if (!savedTokenDetails?.userId || user.id !== savedTokenDetails?.userId) {
      throw new IBadRequestException({
        message: 'Invalid OTP',
      });
    }

    const { resetPasswordToken, resetPasswordTokenExpires } =
      await this.authHelpers.getResetPasswordDetails();

    const ttl = CommonHelpers.getTTLfromDate(resetPasswordTokenExpires);

    await this.cache.set(
      `reset_password_token:${resetPasswordToken}`,
      JSON.stringify({ ...savedTokenDetails }),
      ttl,
    );

    return Response.success({
      message: 'OTP verified successfully',
      data: {
        token: resetPasswordToken,
      },
      event: {
        payload: {
          after: {
            user,
          },
          before: {},
        },
        key: user.id,
        name: 'auth:password:reset:otp',
      },
    });
  }
}
