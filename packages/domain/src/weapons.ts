import { CLOCKWISE, offset, samePoint, turnClockwise, turnCounterClockwise, type Direction, type Point } from './direction';
import type { Enemy } from './enemies';
import type { RandomSource } from './random';

export type ItemKind = 'sword' | 'bow' | 'mace' | 'blue-potion' | 'red-potion';

/** O que a arma precisa saber na hora do golpe. */
export interface AttackContext {
  readonly from: Point;
  readonly enemies: readonly Enemy[];
  readonly random: RandomSource;
  /** Usado pelas poções para curar quem as bebe. */
  heal(amount: number): void;
}

export interface Hit {
  readonly enemy: string;
  readonly damage: number;
  readonly killed: boolean;
}

export interface AttackResult {
  readonly hits: readonly Hit[];
  readonly healed: number;
}

/** Arma: nome, alcance e dano (em casas e pontos) e um padrão de ataque próprio. */
export abstract class Weapon {
  abstract get kind(): ItemKind;
  abstract get name(): string;
  abstract attack(direction: Direction, context: AttackContext): AttackResult;

  /**
   * Procura, casa a casa a partir do jogador, o primeiro inimigo vivo na direção até `range` casas e
   * tira dele de 1 até `damage` pontos. Devolve o golpe ou null se não achou ninguém.
   */
  protected damageEnemy(direction: Direction, range: number, damage: number, context: AttackContext): Hit | null {
    for (let steps = 1; steps <= range; steps++) {
      const square = offset(context.from, direction, steps);
      const enemy = context.enemies.find((e) => !e.dead && samePoint(e.position, square));
      if (enemy) {
        const amount = context.random.next(1, damage + 1);
        enemy.hit(amount);
        return { enemy: enemy.name, damage: amount, killed: enemy.dead };
      }
    }
    return null;
  }
}

/** Espada: alcance 1 casa (10 no livro), dano até 3. Tenta a direção escolhida e depois as laterais. */
export class Sword extends Weapon {
  static readonly RANGE = 1;
  static readonly DAMAGE = 3;

  get kind(): ItemKind {
    return 'sword';
  }

  get name(): string {
    return 'Espada';
  }

  attack(direction: Direction, context: AttackContext): AttackResult {
    const order = [direction, turnClockwise(direction), turnCounterClockwise(direction)];
    for (const d of order) {
      const hit = this.damageEnemy(d, Sword.RANGE, Sword.DAMAGE, context);
      if (hit) return { hits: [hit], healed: 0 };
    }
    return { hits: [], healed: 0 };
  }
}

/** Arco: alcance 3 casas (30 no livro), dano 1, só na direção escolhida. */
export class Bow extends Weapon {
  static readonly RANGE = 3;
  static readonly DAMAGE = 1;

  get kind(): ItemKind {
    return 'bow';
  }

  get name(): string {
    return 'Arco';
  }

  attack(direction: Direction, context: AttackContext): AttackResult {
    const hit = this.damageEnemy(direction, Bow.RANGE, Bow.DAMAGE, context);
    return { hits: hit ? [hit] : [], healed: 0 };
  }
}

/** Maça: alcance 2 casas (20 no livro), dano até 6. Gira em círculo e acerta nas quatro direções. */
export class Mace extends Weapon {
  static readonly RANGE = 2;
  static readonly DAMAGE = 6;

  get kind(): ItemKind {
    return 'mace';
  }

  get name(): string {
    return 'Maça';
  }

  attack(direction: Direction, context: AttackContext): AttackResult {
    const start = CLOCKWISE.indexOf(direction);
    const hits: Hit[] = [];
    for (let i = 0; i < 4; i++) {
      const hit = this.damageEnemy(CLOCKWISE[(start + i) % 4]!, Mace.RANGE, Mace.DAMAGE, context);
      if (hit) hits.push(hit);
    }
    return { hits, healed: 0 };
  }
}

/** Poção: uma arma com a propriedade extra "usada". Some do inventário depois de usada. */
export interface IPotion {
  readonly used: boolean;
  readonly maxHeal: number;
}

/** O `is IPotion` do C#: um *type guard* que estreita a arma para poção. */
export function isPotion(weapon: Weapon): weapon is Weapon & IPotion {
  return 'used' in weapon && 'maxHeal' in weapon;
}

abstract class Potion extends Weapon implements IPotion {
  private wasUsed = false;
  abstract get maxHeal(): number;

  get used(): boolean {
    return this.wasUsed;
  }

  /** Beber a poção: cura de 1 até `maxHeal`, uma vez só. A direção não importa. */
  attack(_direction: Direction, context: AttackContext): AttackResult {
    if (this.wasUsed) return { hits: [], healed: 0 };
    this.wasUsed = true;
    const amount = context.random.next(1, this.maxHeal + 1);
    context.heal(amount);
    return { hits: [], healed: amount };
  }
}

export class BluePotion extends Potion {
  get kind(): ItemKind {
    return 'blue-potion';
  }

  get name(): string {
    return 'Poção azul';
  }

  get maxHeal(): number {
    return 5;
  }
}

export class RedPotion extends Potion {
  get kind(): ItemKind {
    return 'red-potion';
  }

  get name(): string {
    return 'Poção vermelha';
  }

  get maxHeal(): number {
    return 10;
  }
}

export function createWeapon(kind: ItemKind): Weapon {
  switch (kind) {
    case 'sword':
      return new Sword();
    case 'bow':
      return new Bow();
    case 'mace':
      return new Mace();
    case 'blue-potion':
      return new BluePotion();
    case 'red-potion':
      return new RedPotion();
  }
}
