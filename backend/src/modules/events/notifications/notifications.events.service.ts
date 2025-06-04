import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Handlebars from 'handlebars';
import {
  EventServices,
  EventSettings,
  NotificationChannels,
} from 'src/libs/database/entities/event-settings.entity';
import { NotificationContext } from 'src/libs/database/entities/notification-context.entity';
import { BroadcastPayload, KAFKA_TOPICS } from 'src/libs/types/events.types';
import { EventsHelpers } from 'src/libs/utils/helpers/events.helpers';
import { Response } from 'src/libs/utils/http/response.util';
import { DataSource, Equal, In, Repository } from 'typeorm';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationEventsService {
  eventsSettingsRepository: Repository<EventSettings>;
  contextRepository: Repository<NotificationContext>;
  private transporter: Transporter;
  private emailTransporterValid: boolean = false;
  private logger = new Logger();

  defaultSender: {
    address: string;
    name: string;
  };

  constructor(
    @InjectDataSource() private readonly datasource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.eventsSettingsRepository =
      this.datasource.getRepository(EventSettings);
    this.contextRepository = this.datasource.getRepository(NotificationContext);
    this.transporter = createTransport(config.get('notifications.smtp'));
    this.defaultSender = {
      address: config.get('notifications.smtp.defaults.senderEmail'),
      name: config.get('notifications.smtp.defaults.senderName'),
    };

    this.transporter
      .verify()
      .then((valid) => {
        this.emailTransporterValid = valid;
      })
      .catch(() => {
        this.logger.error('SMTP credentials not provided or invalid');
      });
  }

  private async handleEmailChannelEvents(
    context: NotificationContext,
    data: any,
  ) {
    const { emailTemplate } = context;

    if (!emailTemplate)
      return Response.error('Email template not found for context');

    if (!this.emailTransporterValid)
      return Response.error('SMTP credentials not provided or invalid');

    const bodyTemplate = Handlebars.compile(emailTemplate.body);
    const subjectTemplate = Handlebars.compile(emailTemplate.title);

    const body = bodyTemplate(data);
    const subject = subjectTemplate(data);

    await this.transporter.sendMail({
      attachDataUrls: true,
      priority: 'high',
      html: body,
      subject,
      from: this.defaultSender,
      sender: this.defaultSender.address,
      to: data.recipient,
    });
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
      throw new Error('Abort: Notifications event configuration not found');

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
            return await this.handleEmailChannelEvents(
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
