import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEventsService } from './notifications.events.service';
import { DatabaseModule } from '../../../libs/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { GlobalConfig } from '../../../libs/config/global.config';
import { GlobalConfigValidationSchema } from '../../../libs/config/config.validator';
import { EmailNotificationsService } from './services/email.notification.service';
import { v4 } from 'uuid';
import { DataSource, Repository } from 'typeorm';
import {
  EventServices,
  EventSettings,
} from '../../../libs/database/entities/event-settings.entity';
import { NotificationContext } from '../../../libs/database/entities/notification-context.entity';
import { KAFKA_TOPICS } from '../../../libs/types/events.types';

describe('NotificationEventsService', () => {
  let service: NotificationEventsService;
  let emailService: EmailNotificationsService;
  let dataSource: DataSource;
  let eventsSettingsRepository: Repository<EventSettings>;
  let contextRepository: Repository<NotificationContext>;

  const mockEventSettings: Partial<EventSettings> = {
    id: v4(),
    category: KAFKA_TOPICS.BROADCAST,
    event: 'test-event',
    service: EventServices.NOTIFICATIONS,
    settings: {
      email: {
        context: 'test-context',
        schema: {
          recipient: 'test@example.com',
          subject: 'Test Subject',
          message: {
            rule: { if: [{ var: 'payload.after.type' }, 'success', 'error'] },
          },
        },
      },
      discord: {
        context: 'test-context',
        schema: {},
      },
      slack: {
        context: 'test-context',
        schema: {},
      },
      webhook: {
        context: 'test-context',
        schema: {},
      },
    },
  };

  const mockContext: Partial<NotificationContext> = {
    id: v4(),
    slug: 'test-context',
    name: 'Test Context',
    emailTemplate: {
      body: '<p>{{message}}</p>',
      title: 'Email Template',
    },
    discordTemplate: {
      body: '{{message}}',
      title: 'Discord Template',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventsService,
        {
          provide: EmailNotificationsService,
          useValue: {
            handleEmailChannelEvents: jest.fn(),
          },
        },
      ],
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [GlobalConfig],
          validationSchema: GlobalConfigValidationSchema,
        }),
      ],
    }).compile();

    service = module.get<NotificationEventsService>(NotificationEventsService);
    emailService = module.get<EmailNotificationsService>(
      EmailNotificationsService,
    );
    dataSource = module.get<DataSource>(DataSource);
    eventsSettingsRepository = dataSource.getRepository(EventSettings);
    contextRepository = dataSource.getRepository(NotificationContext);

    // Clear repositories
    await eventsSettingsRepository.clear();
    await contextRepository.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail when event is unsupported', async () => {
    const res = await service.handleBroadcastEvents({
      key: 'non-existent-key',
      name: 'non-existent-name',
      payload: { after: {}, before: {} },
      request: { id: v4(), ip: '::0', ua: 'NexusTestingSuite/1.0.0' },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe(
      'Abort: Notifications event configuration not found',
    );
  });

  it('should process email notification successfully', async () => {
    // Setup test data
    await eventsSettingsRepository.save(mockEventSettings);
    await contextRepository.save(mockContext);

    (emailService.handleEmailChannelEvents as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Email sent successfully',
    });

    const res = await service.handleBroadcastEvents({
      key: 'test-key',
      name: 'test-event',
      payload: {
        after: { type: true },
        before: {},
      },
      request: { id: v4(), ip: '::0', ua: 'NexusTestingSuite/1.0.0' },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(emailService.handleEmailChannelEvents).toHaveBeenCalledWith(
      mockContext,
      expect.objectContaining({
        recipient: 'test@example.com',
        subject: 'Test Subject',
        message: 'success',
      }),
    );
  });

  it('should handle missing notification context', async () => {
    // Setup test data with non-existent context
    const settingsWithInvalidContext: Partial<EventSettings> = {
      ...mockEventSettings,
      settings: {
        email: {
          context: 'non-existent-context',
          schema: {
            recipient: 'test@example.com',
            subject: 'Test Subject',
          },
        },
        discord: {
          context: 'test-context',
          schema: {},
        },
        slack: {
          context: 'test-context',
          schema: {},
        },
        webhook: {
          context: 'test-context',
          schema: {},
        },
      },
    };

    await eventsSettingsRepository.save(settingsWithInvalidContext);

    const res = await service.handleBroadcastEvents({
      key: 'test-key',
      name: 'test-event',
      payload: {
        after: {},
        before: {},
      },
      request: { id: v4(), ip: '::0', ua: 'NexusTestingSuite/1.0.0' },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe('Failed to process notification event');
  });

  it('should handle missing recipient in schema', async () => {
    // Setup test data without recipient
    const settingsWithoutRecipient: Partial<EventSettings> = {
      ...mockEventSettings,
      settings: {
        email: {
          context: 'test-context',
          schema: {
            subject: 'Test Subject',
          },
        },
        discord: {
          context: 'test-context',
          schema: {},
        },
        slack: {
          context: 'test-context',
          schema: {},
        },
        webhook: {
          context: 'test-context',
          schema: {},
        },
      },
    };

    await eventsSettingsRepository.save(settingsWithoutRecipient);
    await contextRepository.save(mockContext);

    const res = await service.handleBroadcastEvents({
      key: 'test-key',
      name: 'test-event',
      payload: {
        after: {},
        before: {},
      },
      request: { id: v4(), ip: '::0', ua: 'NexusTestingSuite/1.0.0' },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe('Failed to process notification event');
  });

  it('should handle email service failure', async () => {
    await eventsSettingsRepository.save(mockEventSettings);
    await contextRepository.save(mockContext);

    (emailService.handleEmailChannelEvents as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to send email',
    });

    const res = await service.handleBroadcastEvents({
      key: 'test-key',
      name: 'test-event',
      payload: {
        after: { type: true },
        before: {},
      },
      request: { id: v4(), ip: '::0', ua: 'NexusTestingSuite/1.0.0' },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe('Failed to process notification event');
  });
});
