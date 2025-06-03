import { Column, Entity } from 'typeorm';
import { BaseDatabaseEntity } from './base.entity';

@Entity({ name: 'permissions' })
export class Permission extends BaseDatabaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description?: string;
}
