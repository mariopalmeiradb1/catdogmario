import knex, { Knex } from 'knex';
import { createApp } from '~/app';
import { Express } from 'express';

let testDb: Knex;
let app: Express;

export function getTestApp(): Express {
  if (!app) {
    app = createApp();
  }
  return app;
}

export function getTestDb(): Knex {
  if (!testDb) {
    testDb = knex({
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME_TEST || 'catdog_mario_test',
      },
    });
  }
  return testDb;
}

export async function setupTestDb(): Promise<void> {
  const db = getTestDb();
  await db.migrate.latest({
    directory: './src/database/migrations',
    extension: 'ts',
  });
}

export async function cleanTestDb(): Promise<void> {
  const db = getTestDb();
  await db('follow_up_contacts').del();
  await db('follow_up_reminders').del();
  await db('adoption_requests').del();
  await db('adopter_profiles').del();
  await db('volunteer_profiles').del();
  await db('refresh_tokens').del();
  await db('password_resets').del();
  await db('email_confirmations').del();
  await db('users').del();
  await db('ongs').del();
}

export async function destroyTestDb(): Promise<void> {
  const db = getTestDb();
  await db.destroy();
}
