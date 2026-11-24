import { vi } from 'vitest';
import type { RankedRun } from '@lab/domain';

export function rankedRun(extra: Partial<RankedRun> = {}): RankedRun {
  return {
    id: 1,
    name: 'Ana',
    level: 7,
    hitPoints: 4,
    won: true,
    createdAt: '2026-01-05T12:00:00.000Z',
    ...extra,
  };
}

interface Reply {
  status: number;
  body: unknown;
}

interface ApiOptions {
  /** Corpo do GET /api/runs/ranking (ou uma recusa). */
  ranking?: RankedRun[] | Reply;
  /** Resposta do POST /api/runs; recebe o corpo enviado. */
  save?: (body: unknown) => Reply;
}

/** `fetch` falso da API: guarda as chamadas para o teste conferir o que a tela enviou. */
export function stubApi({ ranking = [], save }: ApiOptions = {}) {
  const posted: unknown[] = [];
  let current = ranking;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    let reply: Reply;
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      posted.push(body);
      reply = save ? save(body) : { status: 201, body: rankedRun({ ...body, id: 99 }) };
    } else if (url === '/api/runs/ranking') {
      reply = Array.isArray(current) ? { status: 200, body: current } : current;
    } else {
      reply = { status: 404, body: {} };
    }
    return { ok: reply.status < 400, status: reply.status, json: async () => reply.body } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    posted,
    fetchMock,
    /** Troca o ranking que a próxima consulta vai receber. */
    setRanking(next: RankedRun[]) {
      current = next;
    },
  };
}
