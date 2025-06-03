import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748980151990 implements MigrationInterface {
  name = 'Migration1748980151990';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "devices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "user_id" uuid,
                "device_id" character varying,
                "model" character varying,
                "user_agent" character varying,
                "os" character varying,
                "version_id" character varying,
                "notification_token" character varying,
                CONSTRAINT "UQ_b1514758245c12daf43486dd1f0" UNIQUE ("id"),
                CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "devices"
            ADD CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "devices" DROP CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c"
        `);
    await queryRunner.query(`
            DROP TABLE "devices"
        `);
  }
}
