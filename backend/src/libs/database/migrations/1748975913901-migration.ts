import { readFileSync } from 'fs';
import slugify from 'slugify';
import { AuthHelpers } from '../../utils/helpers/auth.helpers';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 } from 'uuid';
import { TeamStatus } from '../entities/user-team.entity';

// Initialize default team, roles, permissions and user
export class Migration1748975913901 implements MigrationInterface {
  defaultCompanyName = 'Global';
  defaultRoleName = 'Administrator';
  defaultUsername = 'admin';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Setup default team
    const defaultTeamId = v4();
    await queryRunner.query(
      `INSERT INTO teams (id, name, slug) VALUES ($1, $2, $3)`,
      [
        defaultTeamId,
        this.defaultCompanyName,
        slugify(this.defaultCompanyName, { lower: true }),
      ],
    );

    // Setup default role
    const defaultRoleId = v4();
    const adminRole = [
      defaultRoleId,
      this.defaultRoleName,
      slugify(this.defaultRoleName),
      null,
      'active',
      '',
    ];
    const parameters = [adminRole];
    await queryRunner.query(
      `INSERT INTO roles (id, name, slug, parent_id, status, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
      parameters.flat(),
    );

    // Setup default user
    const defaultUserId = v4();
    await queryRunner.query(
      `INSERT INTO users (id, username, password) VALUES ($1, $2, $3)`,
      [
        defaultUserId,
        this.defaultUsername,
        await AuthHelpers.hashPassword(
          (process.env.DEFAULT_PASSWORD_FILE
            ? readFileSync(process.env.DEFAULT_PASSWORD_FILE).toString()
            : undefined) ?? process.env.DEFAULT_PASSWORD!,
        ),
      ],
    );

    await queryRunner.query(
      `INSERT INTO user_teams (id, user_id, role_id, team_id, status) VALUES ($1, $2, $3, $4, $5)`,
      [v4(), defaultUserId, defaultRoleId, defaultTeamId, TeamStatus.ACTIVE],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE user_teams`);
    await queryRunner.query(`TRUNCATE TABLE users`);
    await queryRunner.query(`TRUNCATE TABLE roles`);
    await queryRunner.query(`TRUNCATE TABLE teams`);
  }
}
