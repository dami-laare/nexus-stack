import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';
import { NotificationContext } from '../../../../libs/database/entities/notification-context.entity';
import { Response } from '../../../../libs/utils/http/response.util';

@Injectable()
export class EmailNotificationsService {
  private transporter: Transporter;
  private emailTransporterValid: boolean = false;
  private logger = new Logger();

  constructor(private readonly config: ConfigService) {
    this.transporter = createTransport(config.get('notifications.smtp'));
    this.defaultSender = {
      address: config.get('notifications.smtp.defaults.senderEmail'),
      name: config.get('notifications.smtp.defaults.senderName'),
    };
  }

  defaultSender: {
    address: string;
    name: string;
  };

  async handleEmailChannelEvents(context: NotificationContext, data: any) {
    const { emailTemplate } = context;

    if (!emailTemplate)
      return Response.error('Email template not found for context');

    try {
      await this.transporter.verify();
    } catch (err) {
      this.logger.error('SMTP credentials not provided or invalid');
    }

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
}
