import { Module } from '@nestjs/common';
import { NotificationEventsService } from './notifications.events.service';
import { EmailNotificationsService } from './services/email.notification.service';

@Module({
  providers: [NotificationEventsService, EmailNotificationsService],
})
export class NotificationEventsModule {}
