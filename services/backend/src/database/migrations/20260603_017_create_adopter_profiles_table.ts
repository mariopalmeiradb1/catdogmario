import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('adopter_profiles', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().unique();
    table.string('full_name', 150).notNullable();
    table.string('cpf', 11).notNullable().unique();
    table.string('rg', 20).notNullable();
    table.date('birth_date').notNullable();
    table.string('phone', 15).notNullable();
    table.string('cep', 8).notNullable();
    table.string('street', 200).notNullable();
    table.string('number', 10).notNullable();
    table.string('complement', 100).nullable();
    table.string('neighborhood', 100).notNullable();
    table.string('city', 100).notNullable();
    table.specificType('state', 'CHAR(2)').notNullable();
    table.boolean('has_current_animals').notNullable().defaultTo(false);
    table.string('current_animals_description', 500).nullable();
    table.boolean('had_animals_before').notNullable().defaultTo(false);
    table.string('previous_animals_description', 500).nullable();
    table
      .enum('status', ['active', 'inactive'])
      .notNullable()
      .defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.foreign('user_id', 'fk_adopter_profiles_user').references('id').inTable('users').onDelete('CASCADE');

    table.index(['cpf'], 'idx_adopter_profiles_cpf');
    table.index(['user_id'], 'idx_adopter_profiles_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('adopter_profiles');
}
