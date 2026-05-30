import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.string('city', 100).nullable();
    table.string('state', 2).nullable();
    table.index(['city'], 'idx_ongs_city');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.dropIndex(['city'], 'idx_ongs_city');
    table.dropColumn('state');
    table.dropColumn('city');
  });
}
