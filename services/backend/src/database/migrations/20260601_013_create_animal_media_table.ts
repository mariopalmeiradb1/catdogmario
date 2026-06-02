import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('animal_media', (table) => {
    table.string('id', 36).primary();
    table.string('animal_id', 36).notNullable();
    table.enum('type', ['photo', 'video']).notNullable();
    table.string('url', 500).notNullable();
    table.string('original_name', 255).notNullable();
    table.integer('size_bytes').unsigned().notNullable();
    table.string('mime_type', 50).notNullable();
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.foreign('animal_id').references('animals.id').onDelete('CASCADE');
    table.index(['animal_id', 'type'], 'idx_animal_media_animal_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('animal_media');
}
