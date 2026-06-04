import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('visits', (table) => {
    table.string('id', 36).primary();
    table.string('adoption_request_id', 36).notNullable();
    table.string('animal_id', 36).notNullable();
    table.string('ong_id', 36).notNullable();
    table.string('scheduled_by', 36).notNullable();
    table.datetime('visit_date').notNullable();
    table.string('notes', 500).nullable();
    table.enum('status', ['scheduled', 'completed', 'cancelled']).notNullable().defaultTo('scheduled');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('adoption_request_id').references('adoption_requests.id').onDelete('CASCADE');
    table.foreign('animal_id').references('animals.id').onDelete('CASCADE');
    table.foreign('ong_id').references('ongs.id').onDelete('CASCADE');
    table.foreign('scheduled_by').references('users.id');

    table.index(['animal_id', 'status'], 'idx_visits_animal_status');
    table.index(['adoption_request_id'], 'idx_visits_adoption_request_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('visits');
}
