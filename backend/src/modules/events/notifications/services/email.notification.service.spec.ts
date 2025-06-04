import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationsService } from './email.notification.service';
import { ConfigService } from '@nestjs/config';
import { NotificationContext } from '../../../../libs/database/entities/notification-context.entity';
import { createTransport } from 'nodemailer';

jest.mock('nodemailer');

describe('EmailNotificationsService', () => {
  let service: EmailNotificationsService;
  let mockTransporter: any;

  const mockSmtpConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password123',
    },
    defaults: {
      senderEmail: 'noreply@example.com',
      senderName: 'Test Sender',
    },
  };

  const mockContext: Partial<NotificationContext> = {
    id: '1',
    slug: 'test-context',
    name: 'Test Context',
    emailTemplate: {
      body: '<p>Hello {{name}}, your {{type}} notification is ready!</p>',
      title: '{{type}} Notification for {{name}}',
    },
    discordTemplate: {
      body: 'Hello {{name}}!',
      title: 'Test Discord Template',
    },
  };

  beforeEach(async () => {
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn(),
    };

    (createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              switch (key) {
                case 'notifications.smtp':
                  return mockSmtpConfig;
                case 'notifications.smtp.defaults.senderEmail':
                  return mockSmtpConfig.defaults.senderEmail;
                case 'notifications.smtp.defaults.senderName':
                  return mockSmtpConfig.defaults.senderName;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailNotificationsService>(EmailNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize nodemailer transporter with correct config', () => {
    expect(createTransport).toHaveBeenCalledWith(mockSmtpConfig);
  });

  it('should set default sender correctly', () => {
    expect(service['defaultSender']).toEqual({
      address: mockSmtpConfig.defaults.senderEmail,
      name: mockSmtpConfig.defaults.senderName,
    });
  });

  describe('handleEmailChannelEvents', () => {
    it('should send email with correct template data', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      const data = {
        name: 'John',
        type: 'Test',
        recipient: 'john@example.com',
      };

      await service.handleEmailChannelEvents(
        mockContext as NotificationContext,
        data,
      );

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        attachDataUrls: true,
        priority: 'high',
        html: '<p>Hello John, your Test notification is ready!</p>',
        subject: 'Test Notification for John',
        from: {
          address: mockSmtpConfig.defaults.senderEmail,
          name: mockSmtpConfig.defaults.senderName,
        },
        sender: mockSmtpConfig.defaults.senderEmail,
        to: 'john@example.com',
      });
    });

    it('should handle missing email template', async () => {
      const contextWithoutTemplate = {
        ...mockContext,
        emailTemplate: undefined,
      };

      const result = await service.handleEmailChannelEvents(
        contextWithoutTemplate as NotificationContext,
        {},
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email template not found for context');
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle SMTP verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('SMTP error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const data = {
        name: 'John',
        type: 'Test',
        recipient: 'john@example.com',
      };

      await service.handleEmailChannelEvents(
        mockContext as NotificationContext,
        data,
      );

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle template compilation with missing data', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      const data = {
        recipient: 'john@example.com',
      };

      await service.handleEmailChannelEvents(
        mockContext as NotificationContext,
        data,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<p>Hello , your  notification is ready!</p>',
          subject: ' Notification for ',
        }),
      );
    });

    it('should handle sendMail failure', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(new Error('Send error'));

      const data = {
        name: 'John',
        type: 'Test',
        recipient: 'john@example.com',
      };

      await expect(
        service.handleEmailChannelEvents(
          mockContext as NotificationContext,
          data,
        ),
      ).rejects.toThrow('Send error');
    });
  });
});
