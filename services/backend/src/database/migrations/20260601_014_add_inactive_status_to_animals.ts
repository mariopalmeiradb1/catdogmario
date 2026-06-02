import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(
    "ALTER TABLE animals MODIFY COLUMN status ENUM('available', 'in_adoption_process', 'adopted', 'inactive') NOT NULL DEFAULT 'available'",
  );
  await knex.schema.alterTable('animals', (table) => {
    table.timestamp('inactivated_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('animals', (table) => {
    table.dropColumn('inactivated_at');
  });
  await knex.schema.raw(
    "ALTER TABLE animals MODIFY COLUMN status ENUM('available', 'in_adoption_process', 'adopted') NOT NULL DEFAULT 'available'",
  );
}
