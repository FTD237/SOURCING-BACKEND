import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? 'development'}`,
});

const isProduction = process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: !isProduction,
  ssl: isProduction,
  ...(isProduction && {
    extra: {
      ssl: process.env.DB_HOST?.includes('railway.internal')
        ? false
        : { rejectUnauthorized: true, ca: process.env.DB_SSL_CA },
    },
  }),
});

export default AppDataSource;
