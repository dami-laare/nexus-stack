import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Equal, IsNull, Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { get } from 'lodash';
import { Device } from 'src/libs/database/entities/device.entity';
import { CacheService } from 'src/libs/cache/cache.service';
import {
  IForbiddenException,
  IUnauthorizedException,
} from '../exceptions/exceptions';
import { AuthHelpers } from '../utils/helpers/auth.helpers';
import { IRequest } from '../utils/helpers/types/common.helpers.types';
import {
  LOOSE_AUTH,
  REQUIRE_2FA_KEY,
  SKIP_AUTH_GUARD_KEY,
} from '../utils/decorators/auth.decorators';
import { User } from '../database/entities/user.entity';

export const TWO_FA_CODE_HEADER_KEY = 'x-authentication-code';

@Injectable()
export class AuthGuard implements CanActivate {
  userRepository: Repository<User>;
  deviceRepository: Repository<Device>;

  constructor(
    private readonly authHelpers: AuthHelpers,
    private readonly reflector: Reflector,
    @InjectDataSource()
    private readonly datasource: DataSource,
    private readonly cacheService: CacheService,
  ) {
    this.userRepository = this.datasource.getRepository(User);
    this.deviceRepository = this.datasource.getRepository(Device);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: IRequest = context.switchToHttp().getRequest();

    const shouldSkipAuth = !!(
      this.reflector.get(SKIP_AUTH_GUARD_KEY, context.getHandler()) ??
      this.reflector.get(SKIP_AUTH_GUARD_KEY, context.getClass())
    );

    const looseAuth = !!(
      this.reflector.get(LOOSE_AUTH, context.getHandler()) ??
      this.reflector.get(LOOSE_AUTH, context.getClass())
    );

    if (shouldSkipAuth) {
      return true;
    }

    const accessToken = get(request, 'cookies.access_token', '').replace(
      /^Bearer\s/,
      '',
    );

    if (!accessToken && !looseAuth) {
      throw new IUnauthorizedException({
        message: 'Session expired. Please login again.',
      });
    }

    const decoded = await this.authHelpers.verifyAccessToken(accessToken);

    if (!decoded?.id && !looseAuth) {
      throw new IUnauthorizedException({
        message: 'Session expired. Please login again.',
      });
    }

    const admin = await this.userRepository.findOne({
      where: {
        id: Equal(decoded.id),
        deletedAt: IsNull(),
      },
      relations: {
        teams: {
          role: {
            permissions: true,
          },
          team: true,
        },
      },
    });

    if (!admin && !looseAuth) {
      throw new IUnauthorizedException({
        message: 'Session expired. Please login again.',
      });
    }

    if (!admin.currentTeamId && !decoded.currentTeamId) {
      throw new IUnauthorizedException({
        message: 'Session expired. Please login again.',
      });
    }

    let savedDevice: Device;

    if (request.device.os?.name && request.device.os?.version) {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(admin.id),
          os: request.device.os.name,
          versionId: request.device.os.version,
        },
      });
    } else {
      savedDevice = await this.deviceRepository.findOne({
        where: {
          userId: Equal(admin.id),
          userAgent: Equal(request.device.ua),
        },
      });
    }

    if (!savedDevice && !looseAuth) {
      throw new IUnauthorizedException({
        message: 'Unauthorized device access.',
      });
    }

    const cachedToken = await this.cacheService.get(
      `nexus:access:${admin.id}:${savedDevice?.id}`,
    );

    if (cachedToken !== accessToken && !looseAuth) {
      throw new IUnauthorizedException({
        message: 'Session expired. Please login again.',
      });
    }

    const require2fa = this.reflector.get<boolean>(
      REQUIRE_2FA_KEY,
      context.getHandler(),
    );

    if (require2fa) {
      const authenticationOtp = get(
        request,
        `headers.${TWO_FA_CODE_HEADER_KEY}`,
        '',
      ) as string;

      if (!authenticationOtp) {
        throw new IUnauthorizedException({
          message:
            'Two factor authentication is required to access this feature',
        });
      }

      if (admin.isTwoFactorAuthenticationEnabled) {
        const isAuthenticationCodeValid =
          this.authHelpers.validateTwoFactorAuthenticationCode(
            authenticationOtp,
            admin.twoFactorAuthenticationSecret,
          );

        if (!isAuthenticationCodeValid) {
          throw new IUnauthorizedException({
            message: 'Invalid authentication code.',
          });
        }
      } else {
        const cachedAuthenticationCode = await this.cacheService.get(
          `nexus:admin:otp:${admin.email}`,
        );

        if (cachedAuthenticationCode !== authenticationOtp) {
          throw new IUnauthorizedException({
            message: 'Invalid authentication code.',
          });
        }

        await this.cacheService.delete(admin.email);
      }
    }

    const adminTeam = admin.teams.find(
      (team) => team.teamId === decoded.currentTeamId,
    );

    const requiredPermissions: string[] = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (requiredPermissions) {
      if (
        !admin ||
        !adminTeam.role.slug.toLowerCase() ||
        !adminTeam.role.permissions
      ) {
        throw new IForbiddenException({
          message: 'Access Denied: No valid role or permissions found',
        });
      }

      const adminPermissions = adminTeam.role.permissions.map(
        (perm) => perm.slug,
      );

      const hasPermission = requiredPermissions.some((perm) =>
        adminPermissions.includes(perm),
      );

      if (!hasPermission) {
        throw new IForbiddenException({
          message: `Access Denied: You need one of the following permissions: ${requiredPermissions.join(', ')}`,
        });
      }
    }

    request.user = admin;
    request.currentTeam = adminTeam?.team;
    request.currentRole = adminTeam?.role;

    // const scope = Sentry.getCurrentScope();

    // scope.setUser({
    //   id: admin.id,
    //   username: admin.email,
    // });

    return true;
  }
}
