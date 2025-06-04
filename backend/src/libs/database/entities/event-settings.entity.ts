import { Column, Entity } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { KAFKA_TOPICS } from '../../types/events.types';

export enum EventServices {
  NOTIFICATIONS = 'notifications',
}

export type NotificationChannels = 'email' | 'discord' | 'slack' | 'webhook';

export interface NotificationsEventsConfig
  extends Record<
    NotificationChannels,
    {
      schema: Record<any, any>;
      context: string;
    }
  > {}

export type EventsConfigMap = {
  [EventServices.NOTIFICATIONS]: NotificationsEventsConfig;
};

@Entity({ name: 'event_settings' })
export class EventSettings<
  T extends EventServices = EventServices,
> extends BaseDatabaseEntity {
  @Column()
  event: string;

  @Column()
  category: KAFKA_TOPICS;

  @Column({ type: 'jsonb', default: {} })
  // Configures how the notification service reacts to events emitted to it
  settings: EventsConfigMap[T];

  // This allows us to create domain specific event actions
  @Column({ nullable: true })
  service: EventServices;
}
