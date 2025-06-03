import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Unique(['id'])
export class BaseDatabaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'deleted_by', nullable: true, type: 'uuid' })
  deletedBy?: string | null;

  @Column({ name: 'updated_by', nullable: true, type: 'uuid' })
  updatedBy?: string | null;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy?: string | null;
}
