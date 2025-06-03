import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ name: 'devices' })
export class Device extends BaseDatabaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ nullable: true })
  os: string | null;

  @Column({ name: 'version_id', nullable: true })
  versionId: string | null;

  @Column({ name: 'notification_token', nullable: true })
  notificationToken: string | null;
}
