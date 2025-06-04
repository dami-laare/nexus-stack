import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749036405032 implements MigrationInterface {
  name = 'Migration1749036405032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notification_contexts"
            ADD CONSTRAINT "UQ_c1da3106ab952a10d89a0e8bc3a" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "event_settings"
            ADD CONSTRAINT "UQ_eb9ae7a94c32aed910998d3fda8" UNIQUE ("id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "event_settings" DROP CONSTRAINT "UQ_eb9ae7a94c32aed910998d3fda8"
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_contexts" DROP CONSTRAINT "UQ_c1da3106ab952a10d89a0e8bc3a"
        `);
  }
}
