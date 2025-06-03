import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Team } from './team.entity';

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity({
  name: 'user_teams',
})
export class UserTeam extends BaseDatabaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @Column()
  roleId: string;

  @Column()
  teamId: string;

  @Column({ default: TeamStatus.PENDING })
  status: TeamStatus;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id', referencedColumnName: 'id' })
  team: Team;
}
