import { CLOCKWISE, Direction, type Point } from './direction';
import { DUNGEON, Mover, type Bounds, type IsBlocked } from './mover';
import type { RandomSource } from './random';

export type EnemyKind = 'bat' | 'ghost' | 'ghoul';

/** Inimigo: vida, morto ou vivo, ataque ao jogador e um movimento próprio de cada subclasse. */
export abstract class Enemy extends Mover {
  private hp: number;
  readonly maxHitPoints: number;
  readonly maxDamage: number;

  constructor(location: Point, hitPoints: number, maxDamage: number, bounds: Bounds = DUNGEON) {
    super(location, bounds);
    this.hp = hitPoints;
    this.maxHitPoints = hitPoints;
    this.maxDamage = maxDamage;
  }

  abstract get kind(): EnemyKind;
  abstract get name(): string;

  /** Cada inimigo decide como anda no seu turno. */
  abstract move(player: Point, random: RandomSource, isBlocked: IsBlocked): void;

  get hitPoints(): number {
    return this.hp;
  }

  get dead(): boolean {
    return this.hp <= 0;
  }

  hit(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
  }

  /** Se está colado no jogador, sorteia o dano (1 até `maxDamage`); senão devolve 0. */
  attack(player: Point, random: RandomSource): number {
    if (this.dead || !this.nearby(player)) return 0;
    return random.next(1, this.maxDamage + 1);
  }

  /** Direção que aproxima do jogador: primeiro na horizontal, depois na vertical. */
  protected directionTo(player: Point): Direction {
    if (player.x > this.location.x) return Direction.Right;
    if (player.x < this.location.x) return Direction.Left;
    return player.y < this.location.y ? Direction.Up : Direction.Down;
  }
}

/** Morcego: metade das vezes vai na direção do jogador, metade numa direção aleatória. Dano até 2. */
export class Bat extends Enemy {
  constructor(location: Point, bounds?: Bounds) {
    super(location, 6, 2, bounds);
  }

  get kind(): EnemyKind {
    return 'bat';
  }

  get name(): string {
    return 'Morcego';
  }

  override move(player: Point, random: RandomSource, isBlocked: IsBlocked): void {
    if (this.dead) return;
    const direction = random.next(0, 2) === 0 ? this.directionTo(player) : CLOCKWISE[random.next(0, 4)]!;
    this.step(direction, isBlocked);
  }
}

/** Fantasma: um terço das vezes vai na direção do jogador; no resto fica parado. Dano até 3. */
export class Ghost extends Enemy {
  constructor(location: Point, bounds?: Bounds) {
    super(location, 8, 3, bounds);
  }

  get kind(): EnemyKind {
    return 'ghost';
  }

  get name(): string {
    return 'Fantasma';
  }

  override move(player: Point, random: RandomSource, isBlocked: IsBlocked): void {
    if (this.dead) return;
    if (random.next(0, 3) === 0) this.step(this.directionTo(player), isBlocked);
  }
}

/** Zumbi, o mais forte: dois terços das vezes vai na direção do jogador; no resto fica parado. Dano até 4. */
export class Ghoul extends Enemy {
  constructor(location: Point, bounds?: Bounds) {
    super(location, 10, 4, bounds);
  }

  get kind(): EnemyKind {
    return 'ghoul';
  }

  get name(): string {
    return 'Zumbi';
  }

  override move(player: Point, random: RandomSource, isBlocked: IsBlocked): void {
    if (this.dead) return;
    if (random.next(0, 3) < 2) this.step(this.directionTo(player), isBlocked);
  }
}

export function createEnemy(kind: EnemyKind, location: Point, bounds?: Bounds): Enemy {
  if (kind === 'bat') return new Bat(location, bounds);
  if (kind === 'ghost') return new Ghost(location, bounds);
  return new Ghoul(location, bounds);
}
