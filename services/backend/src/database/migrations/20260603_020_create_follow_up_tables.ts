import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('follow_up_reminders', (table) => {
    table.string('id', 36).primary();
    table.string('adoption_request_id', 36).notNullable();
    table.string('ong_id', 36).notNullable();
    table.integer('reminder_number').notNullable();
    table.date('due_date').notNullable();
    table.enum('status', ['pending', 'overdue', 'completed', 'cancelled']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('adoption_request_id').references('id').inTable('adoption_requests');
    table.foreign('ong_id').references('id').inTable('ongs');
    table.unique(['adoption_request_id', 'reminder_number']);
  });

  await knex.schema.createTable('follow_up_contacts', (table) => {
    table.string('id', 36).primary();
    table.string('reminder_id', 36).notNullable().unique();
    table.string('registered_by', 36).notNullable();
    table.string('ong_id', 36).notNullable();
    table.date('contact_date').notNullable();
    table.enum('status', ['positive', 'neutral', 'negative', 'no_response']).notNullable();
    table.text('observation').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('reminder_id').references('id').inTable('follow_up_reminders');
    table.foreign('registered_by').references('id').inTable('users');
    table.foreign('ong_id').references('id').inTable('ongs');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('follow_up_contacts');
  await knex.schema.dropTableIfExists('follow_up_reminders');
}
