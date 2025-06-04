import { Column, Entity } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';

@Entity({ name: 'notification_contexts' })
export class NotificationContext extends BaseDatabaseEntity {
  @Column({
    unique: true,
  })
  slug: string;

  @Column({
    nullable: true,
  })
  name: string;

  @Column({ nullable: true, type: 'text' })
  emailTemplate: {
    body: string;
    title: string;
  };

  @Column({ nullable: true, type: 'text' })
  discordTemplate: {
    body: string;
    title: string;
  };
}
