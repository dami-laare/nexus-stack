import { Test, TestingModule } from '@nestjs/testing';
import { AuthHelpers } from './auth.helpers';
import { ConfigService } from '@nestjs/config';
import { CacheService } from 'src/libs/cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { Device } from 'src/libs/database/entities/device.entity';
import { User } from 'src/libs/database/entities/user.entity';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { AuthJwtPayload } from './types/auth.helpers.types';

jest.mock('argon2');
jest.mock('otplib');
jest.mock('crypto');

describe('AuthHelpers', () => {
  let service: AuthHelpers;
  let configService: jest.Mocked<ConfigService>;
  let cacheService: jest.Mocked<CacheService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockDevice: Device = {
    id: '1',
    userId: '1',
    os: 'iOS',
    versionId: '15.0',
    model: 'iPhone',
    userAgent: 'Mozilla',
  } as Device;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthHelpers,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            delete: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthHelpers>(AuthHelpers);
    configService = module.get(ConfigService);
    cacheService = module.get(CacheService);
    jwtService = module.get(JwtService);
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await AuthHelpers.hashPassword(plainPassword);

      expect(result).toBe(hashedPassword);
      expect(argon2.hash).toHaveBeenCalledWith(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    });

    it('should throw error when hashing fails', async () => {
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      await expect(AuthHelpers.hashPassword('password123')).rejects.toThrow(
        'Error hashing password',
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await AuthHelpers.verifyPassword(
        plainPassword,
        hashedPassword,
      );

      expect(result).toBe(true);
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, plainPassword);
    });

    it('should throw error when verification fails', async () => {
      (argon2.verify as jest.Mock).mockRejectedValue(new Error('Verify error'));

      await expect(
        AuthHelpers.verifyPassword('password123', 'hashedPassword123'),
      ).rejects.toThrow('Error verifying password');
    });
  });

  describe('signRefreshToken', () => {
    it('should sign and cache refresh token', async () => {
      const payload: AuthJwtPayload = { id: '1', currentTeamId: '1' };
      const token = 'refresh-token';

      configService.get.mockReturnValueOnce('refresh-secret');
      configService.get.mockReturnValueOnce('10080');
      jwtService.sign.mockReturnValue(token);

      const result = await service.signRefreshToken(payload, mockDevice);

      expect(cacheService.delete).toHaveBeenCalledWith(
        `refresh:${payload.id}:${mockDevice.id}`,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'refresh-secret',
        expiresIn: '10080m',
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toHaveProperty('token', token);
      expect(result).toHaveProperty('exp');
    });
  });

  describe('signAccessToken', () => {
    it('should sign and cache access token', async () => {
      const payload: AuthJwtPayload = { id: '1', currentTeamId: '1' };
      const token = 'access-token';

      configService.get.mockReturnValueOnce('access-secret');
      configService.get.mockReturnValueOnce('15');
      jwtService.sign.mockReturnValue(token);

      const result = await service.signAccessToken(payload, mockDevice);

      expect(cacheService.delete).toHaveBeenCalledWith(
        `nexus:access:${payload.id}:${mockDevice.id}`,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'access-secret',
        expiresIn: '15m',
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toHaveProperty('token', token);
      expect(result).toHaveProperty('exp');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', async () => {
      const token = 'valid-refresh-token';
      const decoded: AuthJwtPayload = { id: '1', currentTeamId: '1' };

      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockReturnValue(decoded);

      const result = await service.verifyRefreshToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'refresh-secret',
      });
      expect(result).toEqual(decoded);
    });

    it('should return null for invalid refresh token', async () => {
      const token = 'invalid-refresh-token';

      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.verifyRefreshToken(token);

      expect(result).toBeNull();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', async () => {
      const token = 'valid-access-token';
      const decoded: AuthJwtPayload = { id: '1', currentTeamId: '1' };

      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockReturnValue(decoded);

      const result = await service.verifyAccessToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'access-secret',
      });
      expect(result).toEqual(decoded);
    });

    it('should return null for invalid access token', async () => {
      const token = 'invalid-access-token';

      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.verifyAccessToken(token);

      expect(result).toBeNull();
    });
  });

  describe('generateTwoFactorAuthenticationSecret', () => {
    it('should generate 2FA secret and OTP URL', () => {
      const secret = 'generated-secret';
      const otpAuthUrl =
        'otpauth://totp/Nexus%20Stack:test@example.com?secret=generated-secret&issuer=Nexus%20Stack';

      (authenticator.generateSecret as jest.Mock).mockReturnValue(secret);
      (authenticator.keyuri as jest.Mock).mockReturnValue(otpAuthUrl);

      const result = service.generateTwoFactorAuthenticationSecret(mockUser);

      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        mockUser.email,
        'Nexus Stack',
        secret,
      );
      expect(result).toEqual({ secret, otpAuthUrl });
    });
  });

  describe('validateTwoFactorAuthenticationCode', () => {
    it('should validate 2FA code successfully', () => {
      const code = '123456';
      const secret = 'user-2fa-secret';

      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = service.validateTwoFactorAuthenticationCode(code, secret);

      expect(authenticator.verify).toHaveBeenCalledWith({
        token: code,
        secret,
      });
      expect(result).toBe(true);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate specified number of backup codes', async () => {
      const count = 3;
      const mockResetPasswordDetails = {
        resetPasswordToken: 'token123',
        hashedResetPasswordToken: 'hashedToken123456789012345',
        resetPasswordTokenExpires: new Date(),
      };

      jest
        .spyOn(service, 'getResetPasswordDetails')
        .mockResolvedValue(mockResetPasswordDetails);

      const result = await service.generateBackupCodes(count);

      expect(result).toHaveLength(count);
      expect(service.getResetPasswordDetails).toHaveBeenCalledTimes(count);
      result.forEach((code) => {
        expect(code).toHaveLength(10);
      });
    });
  });

  describe('generateLoginToken', () => {
    it('should generate and cache login token', async () => {
      const device = { ua: 'test-ua' };
      const mockResetPasswordDetails = {
        resetPasswordToken: 'login-token',
        hashedResetPasswordToken: 'hashed-login-token',
        resetPasswordTokenExpires: new Date(),
      };

      jest
        .spyOn(service, 'getResetPasswordDetails')
        .mockResolvedValue(mockResetPasswordDetails);

      const result = await service.generateLoginToken(mockUser, device as any);

      expect(cacheService.get).toHaveBeenCalledWith(
        `nexus:auth:login_token:${mockUser.email}`,
      );
      expect(cacheService.set).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ loginToken: 'login-token' });
    });

    it('should delete previous login token if exists', async () => {
      const device = { ua: 'test-ua' };
      const previousToken = 'previous-token';
      const mockResetPasswordDetails = {
        resetPasswordToken: 'login-token',
        hashedResetPasswordToken: 'hashed-login-token',
        resetPasswordTokenExpires: new Date(),
      };

      jest
        .spyOn(service, 'getResetPasswordDetails')
        .mockResolvedValue(mockResetPasswordDetails);
      cacheService.get.mockResolvedValue(previousToken);

      await service.generateLoginToken(mockUser, device as any);

      expect(cacheService.delete).toHaveBeenCalled();
    });
  });
});
