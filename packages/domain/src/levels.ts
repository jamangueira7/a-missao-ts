import type { Point } from './direction';
import type { EnemyKind } from './enemies';
import type { ItemKind } from './weapons';

/** Um nível: quem aparece onde e qual item fica no chão. */
export interface LevelDef {
  readonly enemies: readonly { readonly kind: EnemyKind; readonly at: Point }[];
  /** Itens em ordem de preferência: entra o primeiro que o jogador ainda não carrega (ou nenhum). */
  readonly items: readonly ItemKind[];
  readonly itemAt: Point;
}

/** Casa de partida do jogador em todo nível (coluna 0, meio da masmorra). */
export const START: Point = { x: 0, y: 2 };

/**
 * Os 7 níveis (tabela da pág. 325 do livro), numa grade de 10×6 casas. Posições fixas para o jogo
 * ser justo e testável; o aleatório fica no movimento e no dano.
 */
export const LEVELS: readonly LevelDef[] = [
  { enemies: [{ kind: 'bat', at: { x: 7, y: 1 } }], items: ['sword'], itemAt: { x: 2, y: 3 } },
  { enemies: [{ kind: 'ghost', at: { x: 8, y: 4 } }], items: ['blue-potion'], itemAt: { x: 4, y: 0 } },
  { enemies: [{ kind: 'ghoul', at: { x: 8, y: 2 } }], items: ['bow'], itemAt: { x: 3, y: 5 } },
  {
    enemies: [
      { kind: 'bat', at: { x: 6, y: 0 } },
      { kind: 'ghost', at: { x: 8, y: 5 } },
    ],
    items: ['bow', 'blue-potion'],
    itemAt: { x: 4, y: 3 },
  },
  {
    enemies: [
      { kind: 'bat', at: { x: 7, y: 4 } },
      { kind: 'ghoul', at: { x: 9, y: 1 } },
    ],
    items: ['red-potion'],
    itemAt: { x: 2, y: 0 },
  },
  {
    enemies: [
      { kind: 'ghost', at: { x: 6, y: 5 } },
      { kind: 'ghoul', at: { x: 9, y: 2 } },
    ],
    items: ['mace'],
    itemAt: { x: 3, y: 2 },
  },
  {
    enemies: [
      { kind: 'bat', at: { x: 5, y: 0 } },
      { kind: 'ghost', at: { x: 8, y: 5 } },
      { kind: 'ghoul', at: { x: 9, y: 2 } },
    ],
    items: ['mace', 'red-potion'],
    itemAt: { x: 2, y: 4 },
  },
];

export const LEVEL_COUNT = LEVELS.length;
