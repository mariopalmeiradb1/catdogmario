import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('animals', (table) => {
    table.string('id', 36).primary();
    table.string('ong_id', 36).notNullable();
    table.string('name', 150).notNullable();
    table.enum('species', ['dog', 'cat']).notNullable();
    table.string('breed', 100).notNullable();
    table.enum('sex', ['male', 'female']).notNullable();
    table.enum('size', ['small', 'medium', 'large']).notNullable();
    table.integer('estimated_age_months').unsigned().notNullable();
    table.string('temperament', 100).nullable();
    table.boolean('special_needs').notNullable().defaultTo(false);
    table.text('special_needs_description').nullable();
    table.string('description', 500).nullable();
    table.string('photo_url', 500).nullable();
    table.enum('status', ['available', 'in_adoption_process', 'adopted']).notNullable().defaultTo('available');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.foreign('ong_id').references('ongs.id').onDelete('CASCADE');
    table.index(['status', 'name'], 'idx_animals_status_name');
    table.index(['ong_id'], 'idx_animals_ong_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('animals');
}
