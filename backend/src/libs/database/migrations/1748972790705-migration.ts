import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748972790705 implements MigrationInterface {
  name = 'Migration1748972790705';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"
        `);
    await queryRunner.query(`
            ALTER TABLE "permissions"
            ADD CONSTRAINT "UQ_920331560282b8bd21bb02290df" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "FK_be073aa8ea984d05d91a1c276d9"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_006715ef1e1b40852f379efe567"
        `);
    await queryRunner.query(`
            ALTER TABLE "teams"
            ADD CONSTRAINT "UQ_7e5523774a38b08a6236d322403" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_19a2f4d5fe9994e9f337a84323c"
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"
        `);
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "UQ_c1433d71a4838793a49dcad46ab" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "UQ_f7e0532d285aa51d49450cf3dc1" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_a3ffb1c0c8416b9fc6f907b7433" UNIQUE ("id")
        `);
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_be073aa8ea984d05d91a1c276d9" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_19a2f4d5fe9994e9f337a84323c" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_006715ef1e1b40852f379efe567" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_006715ef1e1b40852f379efe567"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_19a2f4d5fe9994e9f337a84323c"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33"
        `);
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "FK_be073aa8ea984d05d91a1c276d9"
        `);
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_a3ffb1c0c8416b9fc6f907b7433"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_ee838ec2b13ac600a162c20ce33" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams" DROP CONSTRAINT "UQ_f7e0532d285aa51d49450cf3dc1"
        `);
    await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "UQ_c1433d71a4838793a49dcad46ab"
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_19a2f4d5fe9994e9f337a84323c" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT "UQ_7e5523774a38b08a6236d322403"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_teams"
            ADD CONSTRAINT "FK_006715ef1e1b40852f379efe567" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_be073aa8ea984d05d91a1c276d9" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "permissions" DROP CONSTRAINT "UQ_920331560282b8bd21bb02290df"
        `);
    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }
}
