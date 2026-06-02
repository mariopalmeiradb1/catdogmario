import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('animals', (table) => {
    table.string('responsibility_term_number', 100).nullable();
    table.timestamp('adopted_at').nullable();
  });

  await knex.schema.createTable('animal_status_history', (table) => {
    table.string('id', 36).primary();
    table.string('animal_id', 36).notNullable();
    table
      .enum('from_status', ['available', 'in_adoption_process', 'adopted', 'inactive'])
      .notNullable();
    table
      .enum('to_status', ['available', 'in_adoption_process', 'adopted', 'inactive'])
      .notNullable();
    table.enum('trigger_type', ['automatic', 'manual']).notNullable();
    table.string('trigger_reason', 255).nullable();
    table.string('triggered_by', 36).notNullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('animal_id')
      .references('id')
      .inTable('animals')
      .onDelete('CASCADE');

    table.index('animal_id', 'idx_status_history_animal_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('animal_status_history');
  await knex.schema.alterTable('animals', (table) => {
    table.dropColumn('responsibility_term_number');
    table.dropColumn('adopted_at');
  });
}
