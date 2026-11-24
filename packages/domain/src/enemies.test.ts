import { describe, expect, it } from 'vitest';
import { Bat, Ghost, Ghoul } from './enemies';
import { sequenceRandom } from './random';

const free = () => false;

describe('Morcego', () => {
  it('na metade "vai até o jogador" anda uma casa na direção dele', () => {
    const bat = new Bat({ x: 5, y: 2 });
    bat.move({ x: 0, y: 2 }, sequenceRandom([0]), free);
    expect(bat.position).toEqual({ x: 4, y: 2 });
  });

  it('na metade aleatória sorteia a direção e não sai da masmorra', () => {
    const bat = new Bat({ x: 0, y: 0 });
    bat.move({ x: 5, y: 5 }, sequenceRandom([1, 0]), free); // aleatório, para cima: bate na parede
    expect(bat.position).toEqual({ x: 0, y: 0 });
    bat.move({ x: 5, y: 5 }, sequenceRandom([1, 3]), free); // aleatório, para a esquerda: parede
    expect(bat.position).toEqual({ x: 0, y: 0 });
    bat.move({ x: 5, y: 5 }, sequenceRandom([1, 2]), free); // aleatório, para baixo
    expect(bat.position).toEqual({ x: 0, y: 1 });
  });

  it('tem 6 de vida e dano até 2', () => {
    const bat = new Bat({ x: 1, y: 1 });
    expect(bat.hitPoints).toBe(6);
    expect(bat.attack({ x: 2, y: 2 }, sequenceRandom([99]))).toBe(2);
  });
});

describe('Fantasma', () => {
  it('um terço das vezes vai até o jogador, no resto fica parado', () => {
    const ghost = new Ghost({ x: 5, y: 5 });
    ghost.move({ x: 5, y: 0 }, sequenceRandom([1]), free);
    expect(ghost.position).toEqual({ x: 5, y: 5 });
    ghost.move({ x: 5, y: 0 }, sequenceRandom([2]), free);
    expect(ghost.position).toEqual({ x: 5, y: 5 });
    ghost.move({ x: 5, y: 0 }, sequenceRandom([0]), free);
    expect(ghost.position).toEqual({ x: 5, y: 4 });
  });

  it('não entra na casa ocupada pelo jogador', () => {
    const ghost = new Ghost({ x: 9, y: 5 });
    ghost.move({ x: 8, y: 5 }, sequenceRandom([0]), (p) => p.x === 8 && p.y === 5);
    expect(ghost.position).toEqual({ x: 9, y: 5 });
  });

  it('tem 8 de vida e dano até 3', () => {
    const ghost = new Ghost({ x: 1, y: 1 });
    expect(ghost.hitPoints).toBe(8);
    expect(ghost.attack({ x: 1, y: 0 }, sequenceRandom([99]))).toBe(3);
  });
});

describe('Zumbi', () => {
  it('dois terços das vezes vai até o jogador, no resto fica parado', () => {
    const ghoul = new Ghoul({ x: 9, y: 0 });
    ghoul.move({ x: 9, y: 5 }, sequenceRandom([0]), free);
    ghoul.move({ x: 9, y: 5 }, sequenceRandom([1]), free);
    expect(ghoul.position).toEqual({ x: 9, y: 2 });
    ghoul.move({ x: 9, y: 5 }, sequenceRandom([2]), free);
    expect(ghoul.position).toEqual({ x: 9, y: 2 });
  });

  it('é o mais forte: 10 de vida e dano até 4, só quando está colado', () => {
    const ghoul = new Ghoul({ x: 4, y: 4 });
    expect(ghoul.hitPoints).toBe(10);
    expect(ghoul.attack({ x: 5, y: 5 }, sequenceRandom([99]))).toBe(4);
    expect(ghoul.attack({ x: 6, y: 4 }, sequenceRandom([99]))).toBe(0);
  });

  it('morto não anda nem ataca', () => {
    const ghoul = new Ghoul({ x: 4, y: 4 });
    ghoul.hit(50);
    expect(ghoul.dead).toBe(true);
    expect(ghoul.hitPoints).toBe(0);
    ghoul.move({ x: 0, y: 4 }, sequenceRandom([0]), free);
    expect(ghoul.position).toEqual({ x: 4, y: 4 });
    expect(ghoul.attack({ x: 4, y: 5 }, sequenceRandom([99]))).toBe(0);
  });
});
