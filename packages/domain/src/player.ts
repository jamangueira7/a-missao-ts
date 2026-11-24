import type { Direction, Point } from './direction';
import type { Enemy } from './enemies';
import { DUNGEON, Mover, type Bounds, type IsBlocked } from './mover';
import type { RandomSource } from './random';
import { isPotion, type AttackResult, type ItemKind, type Weapon } from './weapons';

export const PLAYER_HIT_POINTS = 10;

/** O jogador: vida, inventário (várias armas, uma equipada por vez), andar, atacar e levar dano. */
export class Player extends Mover {
  private hp = PLAYER_HIT_POINTS;
  private readonly weapons = new Map<ItemKind, Weapon>();
  private equippedKind: ItemKind | null = null;

  constructor(location: Point, bounds: Bounds = DUNGEON) {
    super(location, bounds);
  }

  get hitPoints(): number {
    return this.hp;
  }

  get dead(): boolean {
    return this.hp <= 0;
  }

  /** Tipos das armas carregadas, na ordem em que foram pegas. */
  get inventory(): readonly ItemKind[] {
    return [...this.weapons.keys()];
  }

  get equipped(): Weapon | null {
    return this.equippedKind ? (this.weapons.get(this.equippedKind) ?? null) : null;
  }

  has(kind: ItemKind): boolean {
    return this.weapons.has(kind);
  }

  weaponName(kind: ItemKind): string {
    return this.weapons.get(kind)?.name ?? kind;
  }

  move(direction: Direction, isBlocked: IsBlocked): boolean {
    return this.step(direction, isBlocked);
  }

  /** Começa o nível novo na casa de partida, com a vida e o inventário que tinha. */
  placeAt(location: Point): void {
    this.location = location;
  }

  /** Pega a arma do chão; se ainda não tinha nenhuma equipada, equipa. */
  pickUp(weapon: Weapon): void {
    this.weapons.set(weapon.kind, weapon);
    if (!this.equippedKind) this.equippedKind = weapon.kind;
  }

  equip(kind: ItemKind): boolean {
    if (!this.weapons.has(kind)) return false;
    this.equippedKind = kind;
    return true;
  }

  hit(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
  }

  heal(amount: number): void {
    this.hp += amount;
  }

  /** Ataca com a arma equipada. Poção usada sai do inventário e a próxima arma é equipada. */
  attack(direction: Direction, enemies: readonly Enemy[], random: RandomSource): AttackResult | null {
    const weapon = this.equipped;
    if (!weapon) return null;
    const result = weapon.attack(direction, {
      from: this.location,
      enemies,
      random,
      heal: (amount) => this.heal(amount),
    });
    if (isPotion(weapon) && weapon.used) {
      this.weapons.delete(weapon.kind);
      this.equippedKind = this.weapons.keys().next().value ?? null;
    }
    return result;
  }
}
