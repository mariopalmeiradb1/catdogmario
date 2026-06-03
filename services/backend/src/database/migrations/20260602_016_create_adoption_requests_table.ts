import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('adoption_requests', (table) => {
    table.string('id', 36).primary();
    table.string('animal_id', 36).notNullable();
    table.string('adopter_id', 36).notNullable();
    table.string('ong_id', 36).notNullable();
    table
      .enum('status', ['pending', 'in_review', 'approved', 'rejected', 'cancelled', 'completed'])
      .notNullable()
      .defaultTo('pending');
    table.text('rejection_reason').nullable();
    table.enum('cancelled_by', ['adopter', 'system']).nullable();
    table.string('cancellation_reason', 255).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.foreign('animal_id').references('id').inTable('animals').onDelete('CASCADE');
    table.foreign('adopter_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('ong_id').references('id').inTable('ongs').onDelete('CASCADE');

    table.index(['animal_id', 'status'], 'idx_adoption_requests_animal_status');
    table.index(['adopter_id', 'status'], 'idx_adoption_requests_adopter_status');
    table.index(['ong_id', 'status'], 'idx_adoption_requests_ong_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('adoption_requests');
}
