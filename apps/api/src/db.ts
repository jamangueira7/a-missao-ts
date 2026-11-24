import { Kysely, Migrator, PostgresDialect, type ColumnType, type Generated } from 'kysely';
import pg from 'pg';
import { migrations } from './migrations/index';

/** Uma partida terminada (tabela `runs`). */
export interface RunsTable {
  id: Generated<number>;
  name: string;
  level: number;
  hit_points: number;
  won: boolean;
  created_at: ColumnType<Date, never, never>;
}

/** Tabelas do laboratório: acrescente aqui junto com a migration. */
export interface Database {
  runs: RunsTable;
}

export function createDb(url = process.env.DATABASE_URL ?? 'postgres://lab:lab@localhost:5432/lab') {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: url }) }),
  });
}

/** Aplica as migrations pendentes ao subir a API. */
export async function migrate(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({ db, provider: { getMigrations: async () => migrations } });
  const { error, results } = await migrator.migrateToLatest();
  for (const r of results ?? []) console.log(`migration ${r.migrationName}: ${r.status}`);
  if (error) throw error;
}
