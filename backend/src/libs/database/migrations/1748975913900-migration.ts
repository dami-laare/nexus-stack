import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748975913900 implements MigrationInterface {
  name = 'Migration1748975913900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "UQ_881f72bac969d9a00a1a29e1079" UNIQUE ("slug")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "UQ_881f72bac969d9a00a1a29e1079"
        `);
  }
}
