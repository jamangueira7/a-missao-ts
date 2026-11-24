import { LEVEL_COUNT } from './levels';

/** Uma partida terminada, como vai para o ranking. */
export interface Run {
  readonly name: string;
  readonly level: number;
  readonly hitPoints: number;
  readonly won: boolean;
}

export interface RankedRun extends Run {
  readonly id: number;
  readonly createdAt: string;
}

export const RUN_NAME_MAX = 20;
/** Vida final máxima aceita: 10 de partida + todas as poções no máximo, com folga. */
export const RUN_HP_MAX = 99;

export type RunValidation = { ok: true; run: Run } | { ok: false; error: string };

/** As mesmas regras na tela e na API. */
export function validateRun(input: unknown): RunValidation {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'Envie um objeto JSON.' };
  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0 || name.length > RUN_NAME_MAX) {
    return { ok: false, error: `O nome precisa ter de 1 a ${RUN_NAME_MAX} caracteres.` };
  }
  const { level, hitPoints, won } = body;
  if (!Number.isInteger(level) || (level as number) < 1 || (level as number) > LEVEL_COUNT) {
    return { ok: false, error: `O nível vai de 1 a ${LEVEL_COUNT}.` };
  }
  if (!Number.isInteger(hitPoints) || (hitPoints as number) < 0 || (hitPoints as number) > RUN_HP_MAX) {
    return { ok: false, error: `A vida final vai de 0 a ${RUN_HP_MAX}.` };
  }
  if (typeof won !== 'boolean') return { ok: false, error: 'Diga se venceu (true ou false).' };
  if (won && hitPoints === 0) return { ok: false, error: 'Quem venceu não pode ter 0 de vida.' };
  return { ok: true, run: { name, level: level as number, hitPoints: hitPoints as number, won } };
}

/** Comparador do ranking: vitória primeiro, depois nível maior, depois mais vida, depois o mais antigo. */
export function compareRuns(a: RankedRun, b: RankedRun): number {
  return (
    Number(b.won) - Number(a.won) ||
    b.level - a.level ||
    b.hitPoints - a.hitPoints ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

export function rankRuns(runs: readonly RankedRun[]): RankedRun[] {
  return [...runs].sort(compareRuns);
}
