import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749036337227 implements MigrationInterface {
  name = 'Migration1749036337227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "notification_contexts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "slug" character varying NOT NULL,
                "name" character varying,
                "email_template" text,
                "discord_template" text,
                CONSTRAINT "UQ_c1da3106ab952a10d89a0e8bc3a" UNIQUE ("id"),
                CONSTRAINT "UQ_8df577cfbb3c2fc6a58e43466e3" UNIQUE ("slug"),
                CONSTRAINT "PK_c1da3106ab952a10d89a0e8bc3a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "event_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "event" character varying NOT NULL,
                "category" character varying NOT NULL,
                "settings" jsonb NOT NULL DEFAULT '{}',
                "service" character varying,
                CONSTRAINT "UQ_eb9ae7a94c32aed910998d3fda8" UNIQUE ("id"),
                CONSTRAINT "PK_eb9ae7a94c32aed910998d3fda8" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "event_settings"
        `);
    await queryRunner.query(`
            DROP TABLE "notification_contexts"
        `);
  }
}
