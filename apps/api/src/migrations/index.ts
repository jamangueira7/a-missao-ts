import { sql, type Kysely, type Migration } from 'kysely';

/** Migrations em ordem de nome (ex.: '0001_runs'). Cada uma com `up` e `down`. */
export const migrations: Record<string, Migration> = {
  '0001_runs': {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable('runs')
        .addColumn('id', 'serial', (c) => c.primaryKey())
        .addColumn('name', 'varchar(20)', (c) => c.notNull())
        .addColumn('level', 'integer', (c) => c.notNull())
        .addColumn('hit_points', 'integer', (c) => c.notNull())
        .addColumn('won', 'boolean', (c) => c.notNull())
        .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
        .execute();
      await db.schema
        .createIndex('runs_ranking_idx')
        .on('runs')
        .columns(['won desc', 'level desc', 'hit_points desc'])
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable('runs').execute();
    },
  },
};
