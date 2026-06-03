import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('adoption_requests', (table) => {
    table.timestamp('completed_at').nullable().after('updated_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('adoption_requests', (table) => {
    table.dropColumn('completed_at');
  });
}
