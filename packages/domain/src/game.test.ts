import { describe, expect, it } from 'vitest';
import { Direction } from './direction';
import { Game } from './game';
import { LEVELS, type LevelDef } from './levels';
import { sequenceRandom } from './random';

const MAX = () => sequenceRandom([99]);

describe('Game', () => {
  it('monta os 7 níveis do livro, do morcego com espada aos três inimigos', () => {
    expect(LEVELS).toHaveLength(7);
    const game = new Game({ random: MAX() });
    expect(game.level).toBe(1);
    expect(game.levelCount).toBe(7);
    expect(game.enemies.map((e) => e.kind)).toEqual(['bat']);
    expect(game.floorItem?.kind).toBe('sword');
    expect(LEVELS[6]!.enemies.map((e) => e.kind)).toEqual(['bat', 'ghost', 'ghoul']);
  });

  it('o jogador anda dentro dos limites e pega a arma ao pisar nela', () => {
    const levels: LevelDef[] = [
      { enemies: [{ kind: 'ghost', at: { x: 9, y: 5 } }], items: ['sword'], itemAt: { x: 0, y: 1 } },
    ];
    const game = new Game({ random: sequenceRandom([2]), levels });
    game.move(Direction.Left);
    expect(game.playerPosition).toEqual({ x: 0, y: 2 });
    game.move(Direction.Up);
    expect(game.playerPosition).toEqual({ x: 0, y: 1 });
    expect(game.inventory).toEqual([{ kind: 'sword', name: 'Espada', equipped: true }]);
    expect(game.floorItem).toBeNull();
  });

  it('atacar sem arma não gasta o turno', () => {
    const game = new Game({ random: MAX() });
    game.attack(Direction.Right);
    expect(game.turn).toBe(0);
    expect(game.log[0]?.text).toMatch(/mãos vazias/);
  });

  it('derrota: o zumbi colado bate 4 por turno até a vida acabar', () => {
    const levels: LevelDef[] = [{ enemies: [{ kind: 'ghoul', at: { x: 1, y: 2 } }], items: [], itemAt: { x: 9, y: 0 } }];
    // 99 → zumbi fica parado (2 de 0..2) e bate o máximo (4).
    const game = new Game({ random: MAX(), levels });
    game.move(Direction.Left);
    game.move(Direction.Left);
    expect(game.playerHitPoints).toBe(2);
    expect(game.status).toBe('playing');
    game.move(Direction.Left);
    expect(game.playerHitPoints).toBe(0);
    expect(game.status).toBe('lost');
    expect(game.log[1]?.text).toBe('Zumbi te acertou: -4');
    game.move(Direction.Down);
    expect(game.playerPosition).toEqual({ x: 0, y: 2 });
  });

  it('vitória: limpar o último nível termina o jogo', () => {
    const levels: LevelDef[] = [
      { enemies: [{ kind: 'bat', at: { x: 1, y: 2 } }], items: ['sword'], itemAt: { x: 0, y: 3 } },
    ];
    const game = new Game({ random: MAX(), levels });
    game.move(Direction.Down); // pega a espada; o morcego vai para (0,2) e bate 2
    expect(game.enemies[0]).toMatchObject({ x: 0, y: 2 });
    expect(game.playerHitPoints).toBe(8);
    game.attack(Direction.Up); // -3
    game.attack(Direction.Up); // -3: morcego morre
    expect(game.status).toBe('won');
    expect(game.playerHitPoints).toBe(6);
    expect(game.log[0]?.text).toMatch(/missão cumprida/);
  });

  it('ao limpar um nível passa para o próximo, de volta à partida, com o item que ainda falta', () => {
    const levels: LevelDef[] = [
      { enemies: [{ kind: 'bat', at: { x: 1, y: 2 } }], items: ['sword'], itemAt: { x: 0, y: 3 } },
      { enemies: [{ kind: 'ghost', at: { x: 9, y: 5 } }], items: ['sword', 'bow'], itemAt: { x: 5, y: 5 } },
    ];
    const game = new Game({ random: MAX(), levels });
    game.move(Direction.Down);
    game.attack(Direction.Up);
    game.attack(Direction.Up);
    expect(game.status).toBe('playing');
    expect(game.level).toBe(2);
    expect(game.playerPosition).toEqual({ x: 0, y: 2 });
    expect(game.floorItem?.kind).toBe('bow');
  });

  it('equipar troca a arma sem gastar turno e reiniciar volta ao nível 1', () => {
    const game = new Game({ random: MAX() });
    expect(game.equip('bow')).toBe(false);
    game.move(Direction.Down);
    game.restart();
    expect(game.level).toBe(1);
    expect(game.turn).toBe(0);
    expect(game.playerHitPoints).toBe(10);
  });
});
