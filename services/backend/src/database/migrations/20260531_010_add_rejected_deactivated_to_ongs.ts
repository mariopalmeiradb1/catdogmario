import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.timestamp('rejected_at').nullable();
    table.timestamp('deactivated_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.dropColumn('deactivated_at');
    table.dropColumn('rejected_at');
  });
}
