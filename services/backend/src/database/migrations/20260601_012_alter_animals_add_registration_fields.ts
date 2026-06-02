import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('animals', (table) => {
    table.enum('castration', ['yes', 'no', 'unknown']).notNullable().defaultTo('unknown');
    table.enum('estimated_age_category', ['puppy', 'young', 'adult', 'senior']).nullable();
    table.decimal('weight_kg', 5, 1).nullable();
    table.integer('height_cm').unsigned().nullable();
    table.integer('length_cm').unsigned().nullable();
    table.text('rescue_observations').nullable();
    table.text('general_observations').nullable();
  });

  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN temperament JSON NULL');
  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN size ENUM(\'small\', \'medium\', \'large\') NULL');
  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN name VARCHAR(100) NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN name VARCHAR(150) NOT NULL');
  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN size ENUM(\'small\', \'medium\', \'large\') NOT NULL');
  await knex.schema.raw('ALTER TABLE animals MODIFY COLUMN temperament VARCHAR(100) NULL');

  await knex.schema.alterTable('animals', (table) => {
    table.dropColumn('castration');
    table.dropColumn('estimated_age_category');
    table.dropColumn('weight_kg');
    table.dropColumn('height_cm');
    table.dropColumn('length_cm');
    table.dropColumn('rescue_observations');
    table.dropColumn('general_observations');
  });
}
