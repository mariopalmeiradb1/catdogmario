import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.string('description', 500).notNullable().defaultTo('');
    table.integer('capacity').unsigned().notNullable().defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.dropColumn('capacity');
    table.dropColumn('description');
  });
}
