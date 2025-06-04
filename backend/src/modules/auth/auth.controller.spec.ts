import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/libs/guards/auth.guard';
import {
  ForgotPasswordRequest,
  VerifyResetPasswordOtpRequest,
} from './dto/request.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  const mockAuthService = {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    initiateResetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginPayload = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access: { exp: 123456789 },
          refresh: { exp: 987654321 },
          user: { id: '1', username: 'testuser' },
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginPayload, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(
        loginPayload,
        mockResponse,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        message: 'Logout successful.',
      };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(mockResponse);

      expect(authService.logout).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          access: { exp: 123456789 },
          refresh: { exp: 987654321 },
          user: { id: '1', username: 'testuser' },
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(mockResponse);

      expect(authService.refreshToken).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('initiateResetPassword', () => {
    it('should call authService.initiateResetPassword with email', async () => {
      const payload: ForgotPasswordRequest = {
        email: 'test@example.com',
        username: undefined,
      };

      const expectedResponse = {
        success: true,
        message: 'Password reset initiated.',
      };

      mockAuthService.initiateResetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.initiateResetPassword(payload);

      expect(authService.initiateResetPassword).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResponse);
    });

    it('should call authService.initiateResetPassword with username', async () => {
      const payload: ForgotPasswordRequest = {
        email: undefined,
        username: 'testuser',
      };

      const expectedResponse = {
        success: true,
        message: 'Password reset initiated.',
      };

      mockAuthService.initiateResetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.initiateResetPassword(payload);

      expect(authService.initiateResetPassword).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('validateInitiateResetPasswordOtp', () => {
    it('should call authService.initiateResetPassword with OTP payload', async () => {
      const payload: VerifyResetPasswordOtpRequest = {
        otp: '123456',
        email: 'test@example.com',
        username: undefined,
      };

      const expectedResponse = {
        success: true,
        message: 'OTP validated successfully.',
      };

      mockAuthService.initiateResetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.validateInitiateResetPasswordOtp(payload);

      expect(authService.initiateResetPassword).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with correct parameters', async () => {
      const payload = {
        token: 'reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const expectedResponse = {
        success: true,
        message: 'Password reset successful.',
      };

      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(payload);

      expect(authService.resetPassword).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResponse);
    });
  });
});
