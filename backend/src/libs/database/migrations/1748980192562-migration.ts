import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748980192562 implements MigrationInterface {
  name = 'Migration1748980192562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "devices"
            ADD CONSTRAINT "UQ_b1514758245c12daf43486dd1f0" UNIQUE ("id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "devices" DROP CONSTRAINT "UQ_b1514758245c12daf43486dd1f0"
        `);
  }
}
