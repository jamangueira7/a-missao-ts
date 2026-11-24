/** As quatro direções em que o jogador anda ou ataca (o `enum Direction` do livro). */
export enum Direction {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
}

/** Posição numa casa da grade lógica (x = coluna, y = linha; y cresce para baixo). */
export interface Point {
  readonly x: number;
  readonly y: number;
}

const DELTAS: Record<Direction, Point> = {
  [Direction.Up]: { x: 0, y: -1 },
  [Direction.Right]: { x: 1, y: 0 },
  [Direction.Down]: { x: 0, y: 1 },
  [Direction.Left]: { x: -1, y: 0 },
};

/** Ordem no sentido horário, usada pelas laterais da espada e pelo giro da maça. */
export const CLOCKWISE: readonly Direction[] = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];

export function offset(point: Point, direction: Direction, steps = 1): Point {
  const delta = DELTAS[direction];
  return { x: point.x + delta.x * steps, y: point.y + delta.y * steps };
}

export function turnClockwise(direction: Direction): Direction {
  return CLOCKWISE[(CLOCKWISE.indexOf(direction) + 1) % 4]!;
}

export function turnCounterClockwise(direction: Direction): Direction {
  return CLOCKWISE[(CLOCKWISE.indexOf(direction) + 3) % 4]!;
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
