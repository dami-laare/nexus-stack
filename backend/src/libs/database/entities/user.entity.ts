import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { UserTeam } from './user-team.entity';
import { Device } from './device.entity';

@Entity({
  name: 'users',
})
export class User extends BaseDatabaseEntity {
  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @OneToMany(() => UserTeam, (team) => team.user)
  teams: UserTeam[];

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  currentTeamId: string;

  @OneToMany(() => Device, (d) => d.user)
  devices: Device[];

  @Column({ nullable: true })
  twoFactorAuthenticationSecret?: string;

  @Column({
    nullable: true,
    type: 'text',
    array: true,
  })
  twoFactorAuthenticationBackupCodes?: string[];

  @Column({
    type: 'boolean',
    default: false,
  })
  isTwoFactorAuthenticationEnabled?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;
}
