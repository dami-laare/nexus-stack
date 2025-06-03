import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748981513736 implements MigrationInterface {
  name = 'Migration1748981513736';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "current_team_id" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "two_factor_authentication_secret" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "two_factor_authentication_backup_codes" text array
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "is_two_factor_authentication_enabled" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "last_login" TIMESTAMP
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "last_login"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "is_two_factor_authentication_enabled"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "two_factor_authentication_backup_codes"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "two_factor_authentication_secret"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "current_team_id"
        `);
  }
}
