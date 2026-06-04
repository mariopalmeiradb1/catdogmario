import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visits', (table) => {
    table.datetime('completed_at').nullable();
    table.string('completed_by', 36).nullable().references('users.id').onDelete('SET NULL');
    table.enum('evaluation', ['positive', 'neutral', 'negative']).nullable();
    table.text('observations').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visits', (table) => {
    table.dropColumn('observations');
    table.dropColumn('evaluation');
    table.dropColumn('completed_by');
    table.dropColumn('completed_at');
  });
}
