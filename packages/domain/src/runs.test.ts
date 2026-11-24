import { describe, expect, it } from 'vitest';
import { rankRuns, validateRun, type RankedRun } from './runs';

describe('validateRun', () => {
  it('aceita uma partida válida e apara o nome', () => {
    expect(validateRun({ name: '  Ana ', level: 7, hitPoints: 4, won: true })).toEqual({
      ok: true,
      run: { name: 'Ana', level: 7, hitPoints: 4, won: true },
    });
  });

  it.each([
    [null],
    [{ name: '', level: 1, hitPoints: 0, won: false }],
    [{ name: 'x'.repeat(21), level: 1, hitPoints: 0, won: false }],
    [{ name: 'Ana', level: 8, hitPoints: 0, won: false }],
    [{ name: 'Ana', level: 2.5, hitPoints: 0, won: false }],
    [{ name: 'Ana', level: 3, hitPoints: -1, won: false }],
    [{ name: 'Ana', level: 3, hitPoints: 2, won: 'sim' }],
    [{ name: 'Ana', level: 7, hitPoints: 0, won: true }],
  ])('recusa %j', (input) => {
    expect(validateRun(input).ok).toBe(false);
  });
});

describe('rankRuns', () => {
  it('ordena por vitória, nível e vida (desempate pelo mais antigo)', () => {
    const run = (id: number, level: number, hitPoints: number, won = false): RankedRun => ({
      id,
      name: `J${id}`,
      level,
      hitPoints,
      won,
      createdAt: `2026-01-0${id}`,
    });
    const ranked = rankRuns([run(1, 3, 5), run(2, 7, 1, true), run(3, 5, 2), run(4, 5, 9), run(5, 3, 5)]);
    expect(ranked.map((r) => r.id)).toEqual([2, 4, 3, 1, 5]);
  });
});
