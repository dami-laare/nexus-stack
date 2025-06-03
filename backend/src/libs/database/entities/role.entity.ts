import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';
import { Permission } from './permission.entity';
import { Team } from './team.entity';

export enum RoleStatuses {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity({
  name: 'roles',
})
export class Role extends BaseDatabaseEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: RoleStatuses.ACTIVE })
  status?: RoleStatuses;

  @JoinColumn({ name: 'parent_id' })
  @ManyToOne(() => Role, { nullable: true })
  parent?: Role;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    name: 'role_permissions',
  })
  permissions: Permission[];

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ nullable: true })
  teamId: string;
}
