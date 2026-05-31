import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.string('mission', 300).nullable();
    table.string('instagram', 255).nullable();
    table.string('facebook', 255).nullable();
    table.string('whatsapp', 11).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ongs', (table) => {
    table.dropColumn('whatsapp');
    table.dropColumn('facebook');
    table.dropColumn('instagram');
    table.dropColumn('mission');
  });
}
