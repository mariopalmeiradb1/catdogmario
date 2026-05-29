import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  const email = 'admin@catdogmario.com.br';

  const existing = await knex('users').where({ email }).first();
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await knex('users').insert({
    id: uuidv4(),
    name: 'Administrador do Sistema',
    email,
    password_hash: passwordHash,
    role: 'system_admin',
    ong_id: null,
    email_confirmed_at: knex.fn.now(),
    is_active: true,
  });
}
