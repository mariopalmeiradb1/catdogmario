import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ongs', (table) => {
    table.string('id', 36).primary();
    table.string('name', 150).notNullable();
    table.string('cnpj', 18).notNullable().unique();
    table.string('phone', 20).notNullable();
    table.string('address', 500).notNullable();
    table.enum('status', ['pending', 'approved', 'rejected', 'inactive']).notNullable().defaultTo('pending');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ongs');
}
