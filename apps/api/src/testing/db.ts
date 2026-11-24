import { sql, type Kysely } from 'kysely';
import pg from 'pg';
import { createDb, migrate, type Database } from '../db';

const TEST_DB = 'lab_test';

/** Mesma URL do banco de desenvolvimento, trocando só o nome do banco. */
function urlFor(database: string): string {
  const url = new URL(process.env.DATABASE_URL ?? 'postgres://lab:lab@localhost:5432/lab');
  url.pathname = `/${database}`;
  return url.toString();
}

/** Cria o banco `lab_test` se ele não existir (conectando no banco de desenvolvimento). */
async function ensureTestDatabase(): Promise<void> {
  const admin = new pg.Client({ connectionString: urlFor('postgres') });
  await admin.connect();
  try {
    const found = await admin.query('select 1 from pg_database where datname = $1', [TEST_DB]);
    if (found.rowCount === 0) await admin.query(`create database ${TEST_DB}`);
  } finally {
    await admin.end();
  }
}

/** Banco de testes pronto: criado, com as migrations aplicadas. Lembre de chamar `db.destroy()`. */
export async function openTestDb(): Promise<Kysely<Database>> {
  await ensureTestDatabase();
  const db = createDb(urlFor(TEST_DB));
  await migrate(db);
  return db;
}

/** Esvazia as tabelas e zera os ids, para um teste não enxergar os dados do outro. */
export async function resetTables(db: Kysely<Database>): Promise<void> {
  await sql`truncate table runs restart identity`.execute(db);
}
