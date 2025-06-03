import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { UserTeam } from './user-team.entity';

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
}
