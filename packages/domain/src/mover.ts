import { offset, type Direction, type Point } from './direction';

/** Tamanho da masmorra em casas. Alcance das armas e distância dos ataques contam em casas. */
export interface Bounds {
  readonly width: number;
  readonly height: number;
}

export const DUNGEON: Bounds = { width: 10, height: 6 };

/** Diz se uma casa está ocupada (parede de inimigo, jogador...). Quem move não entra nela. */
export type IsBlocked = (point: Point) => boolean;

/** Tudo o que anda pela masmorra: posição, limites e "está perto de". */
export abstract class Mover {
  protected location: Point;
  protected readonly bounds: Bounds;

  constructor(location: Point, bounds: Bounds = DUNGEON) {
    this.location = location;
    this.bounds = bounds;
  }

  get position(): Point {
    return this.location;
  }

  /** Perto = na mesma casa ou numa das 8 vizinhas, até `distance` casas (distância de xadrez). */
  nearby(point: Point, distance = 1): boolean {
    return Math.abs(point.x - this.location.x) <= distance && Math.abs(point.y - this.location.y) <= distance;
  }

  /** Anda uma casa; fica parado se sair da masmorra ou se a casa estiver ocupada. Devolve se andou. */
  protected step(direction: Direction, isBlocked: IsBlocked = () => false): boolean {
    const next = offset(this.location, direction);
    if (!this.inBounds(next) || isBlocked(next)) return false;
    this.location = next;
    return true;
  }

  protected inBounds(point: Point): boolean {
    return point.x >= 0 && point.y >= 0 && point.x < this.bounds.width && point.y < this.bounds.height;
  }
}
