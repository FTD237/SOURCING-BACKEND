import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions, getAppEnv } from './database.config';

// Local : charge le fichier .env.<env>. Sur Railway/prod : rien à charger, les variables sont injectées.
config({ path: `.env.${getAppEnv()}` });

export default new DataSource({
  ...buildDatabaseOptions(),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
});
