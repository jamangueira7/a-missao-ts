import { expect, type Page } from '@playwright/test';

/**
 * Sorteio combinado: o jogo usa `Math.random`, então o teste o troca por uma fila de valores
 * (`window.__q`, um por sorteio) e, quando a fila acaba, por um valor fixo (`window.__d`).
 * Com 0,99 o dano é sempre o máximo e fantasma/zumbi ficam parados; com 0,5 o morcego desce sempre.
 */
export async function openGame(page: Page, fallback: number): Promise<void> {
  await page.addInitScript((value) => {
    const w = window as unknown as { __d: number; __q: number[] };
    w.__d = value;
    w.__q = [];
    Math.random = () => (w.__q.length > 0 ? w.__q.shift()! : w.__d);
  }, fallback);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A Missão' })).toBeVisible();
}

export async function setFallback(page: Page, value: number): Promise<void> {
  await page.evaluate((v) => {
    (window as unknown as { __d: number }).__d = v;
  }, value);
}

/** Acompanha o contador de turnos para esperar a tela atualizar antes da próxima tecla. */
export class Player {
  private turns = 0;

  constructor(private readonly page: Page) {}

  /** Aperta a tecla (gasta um turno) com os sorteios dessa jogada, em ordem. */
  async turn(key: string, ...rolls: number[]): Promise<void> {
    await this.page.evaluate((r) => {
      (window as unknown as { __q: number[] }).__q = r;
    }, rolls);
    await this.page.keyboard.press(key);
    this.turns++;
    await expect(this.page.getByLabel('Situação')).toContainText(new RegExp(`Turno ${this.turns}$`));
  }

  async repeat(key: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) await this.turn(key);
  }
}

/**
 * Nível 1 do início ao fim: pega a espada em (2,3), desce até a linha do morcego (que, com sorteio 0,5,
 * desce sempre até o canto da coluna 7) e o derruba com dois golpes de 3. Termina no nível 2 com 8 de vida.
 */
export async function clearLevelOne(player: Player): Promise<void> {
  await player.repeat('ArrowRight', 2);
  await player.turn('ArrowDown'); // pisa na espada
  await player.repeat('ArrowDown', 2);
  await player.repeat('ArrowRight', 3);
  await player.turn('ArrowRight', 0.5, 0.5, 0); // chega colado: o morcego bate 1
  await player.turn('d', 0.99, 0.5, 0.5, 0); // -3 no morcego, ele bate 1
  await player.turn('d', 0.99); // -3: derrotado
}
