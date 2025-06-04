import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/libs/database/entities/user.entity';
import { Device } from 'src/libs/database/entities/device.entity';
import { AuthHelpers } from 'src/libs/utils/helpers/auth.helpers';
import { RequestContextService } from 'src/libs/utils/services/request-context';
import { CacheService } from 'src/libs/cache/cache.service';
import { IBadRequestException } from 'src/libs/exceptions/exceptions';
import * as moment from 'moment';

jest.mock('src/libs/utils/helpers/auth.helpers');
jest.mock('src/libs/utils/services/request-context');
jest.mock('src/libs/cache/cache.service');

describe('AuthService', () => {
  let service: AuthService;
  let mockDataSource: Partial<DataSource>;
  let mockUserRepository: Partial<Repository<User>>;
  let mockDeviceRepository: Partial<Repository<Device>>;
  let mockAuthHelpers: jest.Mocked<AuthHelpers>;
  let mockRequestContext: jest.Mocked<RequestContextService>;
  let mockCacheService: jest.Mocked<CacheService>;

  const mockUser = {
    id: '1',
    username: 'testuser',
    password: 'hashedpassword',
    email: 'test@example.com',
    currentTeamId: '1',
  };

  const mockDevice = {
    id: '1',
    userId: '1',
    os: 'iOS',
    versionId: '15.0',
    model: 'iPhone',
    userAgent: 'Mozilla',
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockDeviceRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === User) return mockUserRepository;
        if (entity === Device) return mockDeviceRepository;
        return {};
      }),
    };

    mockRequestContext = {
      req: {
        device: {
          os: { name: 'iOS', version: '15.0' },
          device: { model: 'iPhone' },
          ua: 'Mozilla',
        },
        user: mockUser,
        currentDevice: mockDevice,
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AuthHelpers,
          useValue: {
            verifyPassword: jest.fn(),
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
          },
        },
        {
          provide: RequestContextService,
          useValue: mockRequestContext,
        },
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockAuthHelpers = module.get(AuthHelpers);
    mockCacheService = module.get(CacheService);
  });

  describe('login', () => {
    const mockResponse = {
      cookie: jest.fn(),
    } as any;

    it('should successfully login a user with valid credentials', async () => {
      const loginPayload = {
        username: 'testuser',
        password: 'password123',
      };

      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      (AuthHelpers.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockDeviceRepository.findOne = jest.fn().mockResolvedValue(mockDevice);
      mockAuthHelpers.signAccessToken.mockResolvedValue({
        token: 'access-token',
        exp: moment().add(15, 'minutes').valueOf().toString(),
      });
      mockAuthHelpers.signRefreshToken.mockResolvedValue({
        token: 'refresh-token',
        exp: moment().add(7, 'days').valueOf().toString(),
      });

      const result = await service.login(loginPayload, mockResponse);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw IBadRequestException for invalid credentials', async () => {
      const loginPayload = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      (AuthHelpers.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginPayload, mockResponse)).rejects.toThrow(
        IBadRequestException,
      );
    });
  });

  describe('logout', () => {
    const mockResponse = {
      clearCookie: jest.fn(),
    } as any;

    it('should successfully logout a user', async () => {
      const result = await service.logout(mockResponse);

      expect(mockCacheService.delete).toHaveBeenCalledWith(
        `nexus:access:${mockUser.id}:${mockDevice.id}`,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful.');
    });
  });

  describe('refreshToken', () => {
    const mockResponse = {
      cookie: jest.fn(),
    } as any;

    it('should successfully refresh tokens', async () => {
      mockAuthHelpers.signAccessToken.mockResolvedValue({
        token: 'new-access-token',
        exp: moment().add(15, 'minutes').valueOf().toString(),
      });
      mockAuthHelpers.signRefreshToken.mockResolvedValue({
        token: 'new-refresh-token',
        exp: moment().add(7, 'days').valueOf().toString(),
      });

      const result = await service.refreshToken(mockResponse);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully.');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('initiateResetPassword', () => {
    it('should initiate password reset with email', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockCacheService.set = jest.fn().mockResolvedValue(true);

      await service.initiateResetPassword({
        email: 'test@example.com',
        username: undefined,
      });

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should initiate password reset with username', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockCacheService.set = jest.fn().mockResolvedValue(true);

      await service.initiateResetPassword({
        email: undefined,
        username: 'testuser',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });
});
