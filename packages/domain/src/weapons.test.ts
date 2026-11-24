import { describe, expect, it } from 'vitest';
import { Direction, type Point } from './direction';
import { Bat, Ghoul, type Enemy } from './enemies';
import { Player } from './player';
import { sequenceRandom } from './random';
import { BluePotion, Bow, Mace, RedPotion, Sword, isPotion, type AttackContext } from './weapons';

const MAX = sequenceRandom([99]); // sempre o maior valor possível

function context(enemies: Enemy[], from: Point = { x: 4, y: 3 }): AttackContext & { healed: number[] } {
  const healed: number[] = [];
  return { from, enemies, random: MAX, heal: (n) => healed.push(n), healed };
}

describe('Espada (alcance 1, dano até 3)', () => {
  it('acerta quem está colado na direção escolhida', () => {
    const bat = new Bat({ x: 4, y: 2 });
    const result = new Sword().attack(Direction.Up, context([bat]));
    expect(result.hits).toEqual([{ enemy: 'Morcego', damage: 3, killed: false }]);
    expect(bat.hitPoints).toBe(3);
  });

  it('não alcança duas casas', () => {
    const bat = new Bat({ x: 4, y: 1 });
    expect(new Sword().attack(Direction.Up, context([bat])).hits).toEqual([]);
  });

  it('se não acerta na frente, tenta as laterais (mas não atrás)', () => {
    const right = new Bat({ x: 5, y: 3 });
    expect(new Sword().attack(Direction.Up, context([right])).hits).toHaveLength(1);
    const left = new Bat({ x: 3, y: 3 });
    expect(new Sword().attack(Direction.Up, context([left])).hits).toHaveLength(1);
    const behind = new Bat({ x: 4, y: 4 });
    expect(new Sword().attack(Direction.Up, context([behind])).hits).toEqual([]);
  });
});

describe('Arco (alcance 3, dano 1)', () => {
  it('acerta a 3 casas, mas não a 4', () => {
    const near = new Ghoul({ x: 7, y: 3 });
    expect(new Bow().attack(Direction.Right, context([near])).hits).toEqual([
      { enemy: 'Zumbi', damage: 1, killed: false },
    ]);
    const far = new Ghoul({ x: 8, y: 3 });
    expect(new Bow().attack(Direction.Right, context([far])).hits).toEqual([]);
  });

  it('só atira na direção escolhida', () => {
    const side = new Ghoul({ x: 4, y: 2 });
    expect(new Bow().attack(Direction.Right, context([side])).hits).toEqual([]);
  });
});

describe('Maça (alcance 2, dano até 6)', () => {
  it('gira em círculo e acerta nas quatro direções', () => {
    const enemies = [
      new Ghoul({ x: 4, y: 1 }),
      new Ghoul({ x: 6, y: 3 }),
      new Bat({ x: 4, y: 5 }),
      new Ghoul({ x: 3, y: 3 }),
    ];
    const result = new Mace().attack(Direction.Left, context(enemies));
    expect(result.hits.map((h) => h.damage)).toEqual([6, 6, 6, 6]);
    expect(enemies[2]!.dead).toBe(true);
  });

  it('não alcança três casas', () => {
    const far = new Ghoul({ x: 4, y: 0 });
    expect(new Mace().attack(Direction.Up, context([far])).hits).toEqual([]);
  });
});

describe('Poções', () => {
  it('azul cura até 5 e vermelha até 10, uma vez só', () => {
    const blue = new BluePotion();
    const ctx = context([]);
    expect(blue.attack(Direction.Up, ctx).healed).toBe(5);
    expect(blue.used).toBe(true);
    expect(blue.attack(Direction.Up, ctx).healed).toBe(0);
    expect(new RedPotion().attack(Direction.Up, ctx).healed).toBe(10);
    expect(ctx.healed).toEqual([5, 10]);
  });

  it('isPotion separa poção de arma', () => {
    expect(isPotion(new BluePotion())).toBe(true);
    expect(isPotion(new Sword())).toBe(false);
  });

  it('some do inventário depois de usada e a próxima arma é equipada', () => {
    const player = new Player({ x: 0, y: 0 });
    player.pickUp(new Sword());
    player.pickUp(new RedPotion());
    player.hit(8);
    expect(player.equip('red-potion')).toBe(true);
    player.attack(Direction.Up, [], sequenceRandom([3]));
    expect(player.hitPoints).toBe(5);
    expect(player.inventory).toEqual(['sword']);
    expect(player.equipped?.kind).toBe('sword');
  });
});
