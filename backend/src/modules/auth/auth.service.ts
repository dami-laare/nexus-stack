import { Injectable } from '@nestjs/common';
import { LoginRequest } from './dto/request.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';
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
}
