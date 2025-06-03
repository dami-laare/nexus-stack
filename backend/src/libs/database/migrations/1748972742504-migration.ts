import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1748972742504 implements MigrationInterface {
  name = 'Migration1748972742504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                CONSTRAINT "UQ_920331560282b8bd21bb02290df" UNIQUE ("id"),
                CONSTRAINT "UQ_d090ad82a0e97ce764c06c7b312" UNIQUE ("slug"),
                CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "teams" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                CONSTRAINT "UQ_7e5523774a38b08a6236d322403" UNIQUE ("id"),
                CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                "status" character varying NOT NULL DEFAULT 'active',
                "parent_id" uuid,
                "team_id" uuid,
                CONSTRAINT "UQ_c1433d71a4838793a49dcad46ab" UNIQUE ("id"),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "user_teams" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                "team_id" uuid NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                CONSTRAINT "UQ_f7e0532d285aa51d49450cf3dc1" UNIQUE ("id"),
                CONSTRAINT "PK_f7e0532d285aa51d49450cf3dc1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "deleted_by" uuid,
                "updated_by" uuid,
                "created_by" uuid,
                "username" character varying,
                "email" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "password" character varying,
                CONSTRAINT "UQ_a3ffb1c0c8416b9fc6f907b7433" UNIQUE ("id"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id")
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
            DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"
        `);
    await queryRunner.query(`
            DROP TABLE "role_permissions"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "user_teams"
        `);
    await queryRunner.query(`
            DROP TABLE "roles"
        `);
    await queryRunner.query(`
            DROP TABLE "teams"
        `);
    await queryRunner.query(`
            DROP TABLE "permissions"
        `);
  }
}
