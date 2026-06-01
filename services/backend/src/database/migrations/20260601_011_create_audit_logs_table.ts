import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable();
    table.string('user_name', 255).notNullable();
    table.uuid('ong_id').notNullable();
    table.string('action', 100).notNullable();
    table.string('entity', 100).notNullable();
    table.uuid('entity_id').notNullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['ong_id', 'created_at'], 'idx_audit_logs_ong_created');
    table.index(['user_id'], 'idx_audit_logs_user');
    table.index(['action'], 'idx_audit_logs_action');
    table.index(['entity'], 'idx_audit_logs_entity');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}
