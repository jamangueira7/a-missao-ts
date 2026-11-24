import { expect, test } from '@playwright/test';
import pg from 'pg';
import { Player, clearLevelOne, openGame } from './helpers';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://lab:lab@db:5432/lab';
const PREFIX = 'E2E-';

/** Apaga só as partidas que estes testes criaram (nome começa com "E2E-"), para não poluir o ranking. */
async function cleanRuns(): Promise<void> {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query('delete from runs where name like $1', [`${PREFIX}%`]);
  } finally {
    await client.end();
  }
}

test.beforeAll(cleanRuns);
test.afterAll(cleanRuns);

test('pega a espada no nível 1, derrota o morcego e chega ao nível 2', async ({ page }) => {
  await openGame(page, 0.5);
  const situation = page.getByLabel('Situação');
  await expect(situation).toContainText('Nível 1/7');
  await expect(page.getByText('Mãos vazias')).toBeVisible();

  await clearLevelOne(new Player(page));

  await expect(situation).toContainText('Nível 2/7');
  await expect(situation).toContainText('❤ 8');
  await expect(page.getByRole('button', { name: /Espada/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Você pegou: Espada.')).toBeVisible();
  await expect(page.getByText('Nível 2: novos inimigos à vista.')).toBeVisible();
  await expect(page.getByTitle('Fantasma: 8/8')).toBeVisible();
});

test('perde a partida, salva o nome e o vê no ranking; "jogar de novo" recomeça', async ({ page }) => {
  // Com 0,99 o morcego voa sempre para a esquerda, cai na linha de cima e bate 2 por turno.
  await openGame(page, 0.99);
  const player = new Player(page);
  await expect(page.getByText('Ninguém saiu da masmorra ainda')).toBeVisible();

  for (let i = 0; i < 12; i++) {
    if (await page.getByRole('heading', { name: 'Você caiu na masmorra' }).isVisible()) break;
    await player.turn('ArrowLeft');
  }
  await expect(page.getByRole('heading', { name: 'Você caiu na masmorra' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Andar para cima' })).toBeDisabled();

  const name = `${PREFIX}${Date.now().toString(36)}`;
  await page.getByLabel('Seu nome no ranking').fill(name);
  await page.getByRole('button', { name: 'Salvar' }).click();

  await expect(page.getByText('✓ Partida salva no ranking.')).toBeVisible();
  const row = page.locator('.ranking li', { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText('nível 1');

  await page.getByRole('button', { name: /Jogar de novo/ }).click();
  await expect(page.getByRole('heading', { name: 'Você caiu na masmorra' })).toBeHidden();
  await expect(page.getByLabel('Situação')).toContainText('Nível 1/7');
  await expect(page.getByLabel('Situação')).toContainText('❤ 10');
  await expect(page.getByRole('button', { name: 'Andar para cima' })).toBeEnabled();

  // O ranking vem do Postgres: recarregar a página não o apaga.
  await page.reload();
  await expect(page.locator('.ranking li', { hasText: name })).toBeVisible();
});
