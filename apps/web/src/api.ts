import type { RankedRun, Run } from '@lab/domain';

export async function fetchRanking(): Promise<RankedRun[]> {
  const res = await fetch('/api/runs/ranking');
  if (!res.ok) throw new Error('Não foi possível carregar o ranking.');
  return res.json();
}

export async function saveRun(run: Run): Promise<RankedRun> {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(run),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível salvar a partida.');
  return body;
}
