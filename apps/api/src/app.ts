import Fastify from 'fastify';
import type { Kysely, Selectable } from 'kysely';
import { rankRuns, validateRun, type RankedRun } from '@lab/domain';
import type { Database, RunsTable } from './db';

const RANKING_SIZE = 10;

function toRankedRun(row: Selectable<RunsTable>): RankedRun {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    hitPoints: row.hit_points,
    won: row.won,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function buildApp(db: Kysely<Database>) {
  const app = Fastify({ logger: { level: 'info' } });

  app.get('/api/health', async () => ({ ok: true }));

  /** Salva uma partida terminada. Valida com as mesmas regras do domínio. */
  app.post('/api/runs', async (request, reply) => {
    const result = validateRun(request.body);
    if (!result.ok) return reply.code(400).send({ error: result.error });
    const { name, level, hitPoints, won } = result.run;
    const row = await db
      .insertInto('runs')
      .values({ name, level, hit_points: hitPoints, won })
      .returningAll()
      .executeTakeFirstOrThrow();
    return reply.code(201).send(toRankedRun(row));
  });

  /** As melhores partidas: vitória, nível e vida, nessa ordem. */
  app.get('/api/runs/ranking', async () => {
    const rows = await db
      .selectFrom('runs')
      .selectAll()
      .orderBy('won', 'desc')
      .orderBy('level', 'desc')
      .orderBy('hit_points', 'desc')
      .orderBy('created_at', 'asc')
      .limit(RANKING_SIZE)
      .execute();
    return rankRuns(rows.map(toRankedRun));
  });

  return app;
}
