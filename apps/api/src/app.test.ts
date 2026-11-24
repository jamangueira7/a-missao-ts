import { describe, expect, it, vi } from 'vitest';
import type { Kysely } from 'kysely';
import { buildApp } from './app';
import type { Database } from './db';

/** Banco falso: devolve a linha "gravada" e permite conferir que nada foi gravado na recusa. */
function fakeDb() {
  const row = { id: 1, name: 'Ana', level: 4, hit_points: 3, won: false, created_at: new Date('2026-01-05T12:00:00Z') };
  const executeTakeFirstOrThrow = vi.fn(async () => row);
  const chain = { values: () => chain, returningAll: () => chain, executeTakeFirstOrThrow };
  const insertInto = vi.fn(() => chain);
  return { db: { insertInto } as unknown as Kysely<Database>, insertInto };
}

describe('API', () => {
  it('responde o health check', async () => {
    const app = buildApp({} as Kysely<Database>);
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('POST /api/runs recusa corpo inválido com 400 e não grava', async () => {
    const { db, insertInto } = fakeDb();
    const app = buildApp(db);
    for (const payload of [
      { name: '', level: 1, hitPoints: 0, won: false },
      { name: 'Ana', level: 9, hitPoints: 0, won: false },
      { name: 'Ana', level: 3, hitPoints: -2, won: false },
      { name: 'Ana', level: 3, hitPoints: 2 },
    ]) {
      const res = await app.inject({ method: 'POST', url: '/api/runs', payload });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeTypeOf('string');
    }
    expect(insertInto).not.toHaveBeenCalled();
  });

  it('POST /api/runs grava uma partida válida e devolve 201', async () => {
    const { db, insertInto } = fakeDb();
    const app = buildApp(db);
    const res = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: { name: 'Ana', level: 4, hitPoints: 3, won: false },
    });
    expect(res.statusCode).toBe(201);
    expect(insertInto).toHaveBeenCalledWith('runs');
    expect(res.json()).toMatchObject({ name: 'Ana', level: 4, hitPoints: 3, won: false });
  });
});
