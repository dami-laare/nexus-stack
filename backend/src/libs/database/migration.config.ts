import 'tsconfig-paths/register';

import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { GlobalConfig } from '../config/global.config';

const datasource = new DataSource({
  ...GlobalConfig().typeorm,
  entities: [join(__dirname, 'entities', '*{.ts,.js}')],
  migrations: [
    join(__dirname, 'migrations', '*{.ts,.js}'),
    process.env.NODE_ENV === 'local'
      ? join(__dirname, 'archive', 'migrations', '*{.ts,.js}')
      : '',
  ],
  type: 'postgres',
  namingStrategy: new SnakeNamingStrategy(),
  ssl:
    process.env.DB_USE_SSL === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
  },
} as DataSourceOptions);

export default datasource;
