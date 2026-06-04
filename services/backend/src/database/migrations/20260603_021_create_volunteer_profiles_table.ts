import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('volunteer_profiles', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('cpf', 14).notNullable();
    table.string('rg', 20).notNullable();
    table.date('birth_date').notNullable();
    table.string('phone', 15).notNullable();
    table.string('zip_code', 9).notNullable();
    table.string('street', 200).notNullable();
    table.string('number', 10).notNullable();
    table.string('complement', 100).nullable();
    table.string('neighborhood', 100).notNullable();
    table.string('city', 100).notNullable();
    table.string('state', 2).notNullable();
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_volunteer_profiles_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('volunteer_profiles');
}
