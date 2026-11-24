import path from 'node:path';
import { expect, test } from '@playwright/test';
import { Player, clearLevelOne, openGame, setFallback } from './helpers';

test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

/**
 * Joga (com sorteio combinado) até o nível 3: espada, poção azul e arco no inventário, o arco na mão,
 * o zumbi já flechado e o diário cheio. Salva docs/screenshot.png para o README (make screenshot).
 */
test('print do README: masmorra no nível 3 com inventário e diário', async ({ page }) => {
  await openGame(page, 0.5);
  const player = new Player(page);

  await clearLevelOne(player);

  // Nível 2: pega a poção azul em (4,0), contorna o fantasma e o derruba com três golpes.
  await player.repeat('ArrowUp', 2);
  await player.repeat('ArrowRight', 4);
  await player.repeat('ArrowDown', 4);
  await player.repeat('ArrowRight', 2);
  await player.turn('ArrowRight', 0.5, 0); // colado no fantasma: ele bate 1
  await player.turn('d', 0.99, 0.5, 0);
  await player.turn('d', 0.99, 0.5, 0);
  await player.turn('d', 0.99);
  await expect(page.getByLabel('Situação')).toContainText('Nível 3/7');

  // Nível 3: com 0,99 o zumbi fica parado. Pega o arco em (3,5), equipa (tecla 3) e atira duas vezes de longe.
  await setFallback(page, 0.99);
  await player.repeat('ArrowDown', 3);
  await player.repeat('ArrowRight', 3);
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: /Arco/ })).toHaveAttribute('aria-pressed', 'true');
  await player.repeat('ArrowUp', 3);
  await player.repeat('ArrowRight', 3);
  await player.turn('d');
  await player.turn('d');

  await expect(page.getByTitle('Zumbi: 8/10')).toBeVisible();
  await expect(page.getByLabel('Situação')).toContainText('❤ 5');
  await expect(page.getByRole('button', { name: /Espada/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Poção azul/ })).toBeVisible();

  // Tira o foco e o cursor de cima de qualquer coisa e espera as animações curtas terminarem.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshot.png') });
});
