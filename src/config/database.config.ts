import { DataSourceOptions } from 'typeorm';

export type AppEnv = 'development' | 'staging' | 'production';

export function getAppEnv(): AppEnv {
  const env = process.env.APP_ENV ?? process.env.NODE_ENV;
  return env === 'production' || env === 'staging' ? env : 'development';
}

type Getter = (key: string) => string | undefined;

type LoggerOptions = DataSourceOptions['logging'];

function getLogging(appEnv: AppEnv): LoggerOptions {
  switch (appEnv) {
    case 'development':
      return true;
    case 'staging':
      return ['error', 'warn', 'migration'];
    default:
      return ['error', 'migration'];
  }
}

export function buildDatabaseOptions(
  get: Getter = (k) => process.env[k],
  appEnv: AppEnv = getAppEnv(),
) {
  const isLocal = appEnv === 'development';
  const isRailwayInternal = get('DB_HOST')?.includes('railway.internal');

  return {
    type: 'postgres',
    host: get('DB_HOST'),
    port: Number.parseInt(get('DB_PORT') ?? '5432', 10),
    username: get('DB_USERNAME'),
    password: get('DB_PASSWORD'),
    database: get('DB_NAME'),
    synchronize: false, // schéma géré uniquement par les migrations
    logging: getLogging(appEnv),
    ssl:
      isLocal || isRailwayInternal
        ? false
        : { rejectUnauthorized: true, ca: get('DB_SSL_CA') },
  } satisfies Partial<DataSourceOptions>;
}
