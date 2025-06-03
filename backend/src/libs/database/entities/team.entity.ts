import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { UserTeam } from './user-team.entity';

@Entity({
  name: 'teams',
})
export class Team extends BaseDatabaseEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @OneToMany(() => UserTeam, (t) => t.team)
  users: UserTeam[];
}
