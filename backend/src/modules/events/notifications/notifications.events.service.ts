import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  EventServices,
  EventSettings,
  NotificationChannels,
} from '../../../libs/database/entities/event-settings.entity';
import { NotificationContext } from '../../../libs/database/entities/notification-context.entity';
import {
  BroadcastPayload,
  KAFKA_TOPICS,
} from '../../../libs/types/events.types';
import { EventsHelpers } from '../../../libs/utils/helpers/events.helpers';
import { Response } from '../../../libs/utils/http/response.util';
import { DataSource, Equal, In, Repository } from 'typeorm';
import { EmailNotificationsService } from './services/email.notification.service';

@Injectable()
export class NotificationEventsService {
  private readonly eventsSettingsRepository: Repository<EventSettings>;
  private readonly contextRepository: Repository<NotificationContext>;

  constructor(
    @InjectDataSource() private readonly datasource: DataSource,
    private readonly emailService: EmailNotificationsService,
  ) {
    this.eventsSettingsRepository =
      this.datasource.getRepository(EventSettings);
    this.contextRepository = this.datasource.getRepository(NotificationContext);
  }

  async handleBroadcastEvents(payload: BroadcastPayload) {
    const { name } = payload;

    const eventSettings = await this.eventsSettingsRepository.findOne({
      where: {
        category: Equal(KAFKA_TOPICS.BROADCAST),
        event: Equal(name),
        service: Equal(EventServices.NOTIFICATIONS),
      },
    });

    if (!eventSettings || !eventSettings?.settings)
      return Response.error(
        'Abort: Notifications event configuration not found',
      );

    const { settings } = eventSettings;

    const contexts = await this.contextRepository.find({
      where: {
        slug: In(
          Object.values(settings)
            .filter((s: { context: string }) => !!s.context)
            .map((s: { context: string }) => s.context),
        ),
      },
    });

    const promises = Object.keys(settings).map(
      async (channel: NotificationChannels) => {
        const channelSetting = settings[channel];

        if (!channelSetting) {
          return Response.error('No settings found for channel', {
            channel,
            event: payload.name,
          });
        }

        const { context, schema } = channelSetting;
        const channelContext = contexts.find((c) => c.slug === context);

        if (!channelContext)
          return Response.error('No notification context found for channel', {
            channel,
            context,
            event: payload.name,
          });

        const parsedData = EventsHelpers.processEventConfigSchema(
          schema,
          payload,
        );

        const recipient = parsedData.recipient;

        if (!recipient)
          return Response.error(
            'No notification recipient found for event channel',
            {
              channel,
              context,
              event: payload.name,
            },
          );

        switch (channel) {
          case 'email':
            return await this.emailService.handleEmailChannelEvents(
              channelContext,
              parsedData,
            );
            break;
          default:
            return {
              success: false,
              message: `Channel ${channel} is not implemented`,
            };
        }
      },
    );

    const results = await Promise.allSettled(promises);

    const failed = results.filter(
      (r) => r.status === 'fulfilled' && !r.value.success,
    );

    if (failed.length > 0)
      return Response.error('Failed to process notification event', failed);

    return Response.success({
      message: 'Notification event processed successfully',
      data: results,
    });
  }
}
