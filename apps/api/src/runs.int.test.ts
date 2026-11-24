import type { Kysely } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Run } from '@lab/domain';
import { buildApp } from './app';
import type { Database } from './db';
import { openTestDb, resetTables } from './testing/db';

let db: Kysely<Database>;
let app: FastifyInstance;

beforeAll(async () => {
  db = await openTestDb();
  app = buildApp(db);
});

beforeEach(() => resetTables(db));

afterAll(async () => {
  await app.close();
  await db.destroy();
});

const save = (run: unknown) => app.inject({ method: 'POST', url: '/api/runs', payload: run as object });
const ranking = async () => (await app.inject({ method: 'GET', url: '/api/runs/ranking' })).json();
const countRows = async () => Number((await db.selectFrom('runs').select(db.fn.countAll().as('n')).executeTakeFirstOrThrow()).n);

const run = (name: string, level: number, hitPoints: number, won = false): Run => ({ name, level, hitPoints, won });

describe('POST /api/runs e GET /api/runs/ranking (Postgres de verdade)', () => {
  it('grava a partida, devolve 201 com id e data e depois a lista', async () => {
    const res = await save(run('Ana', 4, 3));

    expect(res.statusCode).toBe(201);
    const created = res.json();
    expect(created).toMatchObject({ id: 1, name: 'Ana', level: 4, hitPoints: 3, won: false });
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    expect(await ranking()).toEqual([created]);
    const row = await db.selectFrom('runs').selectAll().executeTakeFirstOrThrow();
    expect(row).toMatchObject({ name: 'Ana', level: 4, hit_points: 3, won: false });
  });

  it('tira os espaços das pontas do nome antes de gravar', async () => {
    const res = await save(run('  Bia  ', 1, 5));
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe('Bia');
    expect((await db.selectFrom('runs').select('name').executeTakeFirstOrThrow()).name).toBe('Bia');
  });

  it('recusa corpo inválido com 400 e mensagem, sem gravar nada', async () => {
    const invalid: unknown[] = [
      run('', 1, 0),
      run('   ', 1, 0),
      run('x'.repeat(21), 1, 0),
      run('Ana', 0, 0),
      run('Ana', 8, 0),
      run('Ana', 2.5, 0),
      run('Ana', 3, -1),
      run('Ana', 3, 100),
      run('Ana', 7, 0, true),
      { name: 'Ana', level: 3, hitPoints: 2 },
      { name: 'Ana', level: '3', hitPoints: 2, won: false },
      { name: 42, level: 3, hitPoints: 2, won: false },
    ];
    for (const body of invalid) {
      const res = await save(body);
      expect(res.statusCode, JSON.stringify(body)).toBe(400);
      expect(res.json().error).toBeTypeOf('string');
    }
    expect(await countRows()).toBe(0);
    expect(await ranking()).toEqual([]);
  });

  it('recusa JSON malformado e corpo que não é um objeto, sem gravar', async () => {
    const broken = await app.inject({
      method: 'POST',
      url: '/api/runs',
      headers: { 'content-type': 'application/json' },
      payload: '{"name": "Ana", ',
    });
    expect(broken.statusCode).toBe(400);
    const notObject = await app.inject({
      method: 'POST',
      url: '/api/runs',
      headers: { 'content-type': 'application/json' },
      payload: '"Ana"',
    });
    expect(notObject.statusCode).toBe(400);
    expect(await countRows()).toBe(0);
  });

  it('ordena por vitória, depois nível, depois vida, e a mais antiga ganha o empate', async () => {
    await save(run('perdeu-6-vida-8', 6, 8));
    await save(run('perdeu-nivel-2', 2, 9));
    await save(run('venceu-vida-3', 7, 3, true));
    await save(run('perdeu-6-vida-3', 6, 3));
    await save(run('venceu-vida-9', 7, 9, true));
    await save(run('empate-antiga', 5, 4));
    await save(run('empate-nova', 5, 4));

    const names = (await ranking()).map((r: { name: string }) => r.name);

    expect(names).toEqual([
      'venceu-vida-9',
      'venceu-vida-3',
      'perdeu-6-vida-8',
      'perdeu-6-vida-3',
      'empate-antiga',
      'empate-nova',
      'perdeu-nivel-2',
    ]);
  });

  it('devolve só as 10 melhores partidas', async () => {
    for (let level = 1; level <= 7; level++) await save(run(`nivel-${level}`, level, 5));
    for (const hp of [1, 2, 3, 4, 5]) await save(run(`vida-${hp}`, 1, hp));
    expect(await countRows()).toBe(12);

    const result = await ranking();

    expect(result).toHaveLength(10);
    const names = result.map((r: { name: string }) => r.name);
    expect(names[0]).toBe('nivel-7');
    expect(names).not.toContain('vida-1');
    expect(names).not.toContain('vida-2');
  });

  it('um ranking vazio é uma lista vazia, não um erro', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/runs/ranking' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});
