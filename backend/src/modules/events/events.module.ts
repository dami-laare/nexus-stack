import { Module } from '@nestjs/common';
import { NotificationEventsModule } from './notifications/notifications.events.module';

@Module({
  imports: [NotificationEventsModule],
})
export class EventsModule {}
