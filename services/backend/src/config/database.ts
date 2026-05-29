import knex, { Knex } from 'knex';
import { env } from './env';

const dbName = env.NODE_ENV === 'test' ? env.DB_NAME_TEST : env.DB_NAME;

const db: Knex = knex({
  client: 'mysql2',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: dbName,
  },
  pool: {
    min: 2,
    max: 10,
  },
});

export { db };
