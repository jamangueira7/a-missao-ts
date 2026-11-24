import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LevelDef } from '@lab/domain';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { rankedRun, stubApi } from './test/api';

/** Níveis do jogo de teste: cada teste escolhe os seus antes de renderizar a tela. */
const scenario = vi.hoisted(() => ({ levels: [] as LevelDef[] }));

// Mesmo hook de produção, mas com níveis pequenos e sorteio sempre no máximo (dano máximo, fantasma parado).
vi.mock('./useGame', async () => {
  const { useCallback, useReducer, useRef } = await import('react');
  const { Game, sequenceRandom } = await import('@lab/domain');
  return {
    useGame() {
      const ref = useRef<InstanceType<typeof Game> | null>(null);
      if (ref.current === null) ref.current = new Game({ random: sequenceRandom([99]), levels: scenario.levels });
      const [, render] = useReducer((n: number) => n + 1, 0);
      const act = useCallback((action: (game: InstanceType<typeof Game>) => unknown) => {
        action(ref.current!);
        render();
      }, []);
      return {
        game: ref.current,
        move: (d: never) => act((g) => g.move(d)),
        attack: (d: never) => act((g) => g.attack(d)),
        equip: (k: never) => act((g) => g.equip(k)),
        restart: () => act((g) => g.restart()),
      };
    },
  };
});

// Morcego colado na partida, espada logo abaixo, arco no nível seguinte.
const BAT_AND_SWORD: LevelDef = { enemies: [{ kind: 'bat', at: { x: 1, y: 2 } }], items: ['sword'], itemAt: { x: 0, y: 3 } };
const GHOST_AND_BOW: LevelDef = { enemies: [{ kind: 'ghost', at: { x: 9, y: 5 } }], items: ['bow'], itemAt: { x: 0, y: 1 } };
const GHOUL_NEXT_DOOR: LevelDef = { enemies: [{ kind: 'ghoul', at: { x: 1, y: 2 } }], items: [], itemAt: { x: 9, y: 0 } };

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const inHand = () => screen.getByText('Na mão').parentElement!;
const diary = () => within(screen.getByRole('heading', { name: 'Diário' }).closest('section')!);
const situation = () => screen.getByLabelText('Situação');

function setup(levels: LevelDef[], api = stubApi()) {
  scenario.levels = levels;
  const user = userEvent.setup();
  render(<App />);
  return { user, api };
}

/** Pega a espada (desce uma casa) e derruba o morcego com dois golpes para cima. */
async function swordAndKillBat(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{ArrowDown}');
  await user.keyboard('ww');
}

async function lose(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  return screen.findByRole('heading', { name: 'Você caiu na masmorra' });
}

async function win(user: ReturnType<typeof userEvent.setup>) {
  await swordAndKillBat(user);
  return screen.findByRole('heading', { name: 'Missão cumprida!' });
}

describe('combate e inventário', () => {
  it('ataca com WASD e o diário e as barras de vida mostram o golpe e a resposta do inimigo', async () => {
    const { user } = setup([BAT_AND_SWORD]);
    await user.keyboard('{ArrowDown}');
    expect(diary().getByText('Morcego te acertou: -2')).toBeInTheDocument();
    expect(situation()).toHaveTextContent('❤ 8');
    expect(screen.getByTitle('Morcego: 6/6')).toBeInTheDocument();

    await user.keyboard('w');

    expect(diary().getByText('Você acertou o Morcego: -3')).toBeInTheDocument();
    expect(screen.getByTitle('Morcego: 3/6')).toBeInTheDocument();
    expect(situation()).toHaveTextContent('❤ 6');
    const vitals = within(screen.getByRole('heading', { name: 'Vida' }).closest('section')!);
    expect(vitals.getByText('Você').closest('li')).toHaveTextContent('6');
    expect(vitals.getByText(/Morcego/).closest('li')).toHaveTextContent('3');
  });

  it('ataca também pelos botões de direção', async () => {
    const { user } = setup([BAT_AND_SWORD]);
    await user.keyboard('{ArrowDown}');
    await user.click(button('Atacar para cima'));
    expect(diary().getByText('Você acertou o Morcego: -3')).toBeInTheDocument();
  });

  it('troca de arma pelo clique e pelas teclas 1 a 5 conforme a ordem do inventário', async () => {
    const { user } = setup([BAT_AND_SWORD, GHOST_AND_BOW]);
    await swordAndKillBat(user);
    expect(situation()).toHaveTextContent('Nível 2/2');
    await user.keyboard('{ArrowUp}');
    expect(diary().getByText('Você pegou: Arco.')).toBeInTheDocument();
    // Pegar o arco não troca a mão: a espada continua equipada.
    expect(button(/Espada/)).toHaveAttribute('aria-pressed', 'true');
    expect(button(/Arco/)).toHaveAttribute('aria-pressed', 'false');

    await user.keyboard('2');
    expect(button(/Arco/)).toHaveAttribute('aria-pressed', 'true');
    expect(button(/Espada/)).toHaveAttribute('aria-pressed', 'false');
    expect(inHand()).toHaveTextContent('Na mãoArco');

    await user.click(button(/Espada/));
    expect(button(/Espada/)).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('1');
    expect(diary().getAllByText('Equipou: Espada.').length).toBeGreaterThanOrEqual(2);
  });

  it('derrubar o morcego leva ao nível 2 com a vida que sobrou', async () => {
    const { user } = setup([BAT_AND_SWORD, GHOST_AND_BOW]);
    await swordAndKillBat(user);
    expect(situation()).toHaveTextContent('Nível 2/2');
    expect(situation()).toHaveTextContent('❤ 6');
    expect(diary().getByText('Nível 2: novos inimigos à vista.')).toBeInTheDocument();
    expect(screen.getByTitle('Fantasma: 8/8')).toBeInTheDocument();
  });
});

describe('fim de jogo', () => {
  it('derrota: mostra a tela de queda e desabilita andar, atacar e equipar', async () => {
    const { user } = setup([GHOUL_NEXT_DOOR]);
    await lose(user);

    expect(screen.getByText('Chegou ao nível 1 de 1. Da próxima vez, beba a poção antes!')).toBeInTheDocument();
    expect(diary().getByText('Você caiu no nível 1.')).toBeInTheDocument();
    for (const name of ['Andar para cima', 'Andar para baixo', 'Andar para esquerda', 'Andar para direita']) {
      expect(button(name)).toBeDisabled();
    }
    expect(button('Atacar para cima')).toBeDisabled();
    const turn = situation().textContent;
    await user.keyboard('{ArrowDown}');
    expect(situation().textContent).toBe(turn);
  });

  it('vitória: mostra a tela de missão cumprida com a vida final e deixa os botões desabilitados', async () => {
    const { user } = setup([BAT_AND_SWORD]);
    await win(user);

    expect(screen.getByText('Os 1 níveis estão limpos e você saiu com 6 de vida.')).toBeInTheDocument();
    expect(button('Andar para direita')).toBeDisabled();
    expect(button('Atacar para direita')).toBeDisabled();
    expect(button(/Espada/)).toBeDisabled();
  });

  it('salva o nome no ranking com os dados da partida e mostra a confirmação e o ranking novo', async () => {
    const api = stubApi();
    const { user } = setup([BAT_AND_SWORD], api);
    await win(user);
    api.setRanking([rankedRun({ id: 99, name: 'Bia', level: 1, hitPoints: 6 })]);

    await user.type(screen.getByLabelText('Seu nome no ranking'), '  Bia  ');
    await user.click(button('Salvar'));

    expect(await screen.findByText('✓ Partida salva no ranking.')).toBeInTheDocument();
    expect(api.posted).toEqual([{ name: 'Bia', level: 1, hitPoints: 6, won: true }]);
    expect(await screen.findByText('Bia', { selector: '.rank-name' })).toBeInTheDocument();
  });

  it('recusa nome vazio sem chamar a API e mostra o erro da API quando ela recusa', async () => {
    const api = stubApi({ save: () => ({ status: 400, body: { error: 'Nome já usado.' } }) });
    const { user } = setup([GHOUL_NEXT_DOOR], api);
    await lose(user);

    await user.click(button('Salvar'));
    expect(await screen.findByRole('alert')).toHaveTextContent('O nome precisa ter de 1 a 20 caracteres.');
    expect(api.posted).toHaveLength(0);

    await user.type(screen.getByLabelText('Seu nome no ranking'), 'Caio');
    await user.click(button('Salvar'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nome já usado.'));
    expect(api.posted).toEqual([{ name: 'Caio', level: 1, hitPoints: 0, won: false }]);
    expect(screen.queryByText('✓ Partida salva no ranking.')).not.toBeInTheDocument();
  });

  it('"Jogar de novo" fecha a tela de resultado e recomeça no nível 1 com vida cheia', async () => {
    const { user } = setup([GHOUL_NEXT_DOOR]);
    await lose(user);

    await user.click(button(/Jogar de novo/));

    expect(screen.queryByRole('heading', { name: 'Você caiu na masmorra' })).not.toBeInTheDocument();
    expect(situation()).toHaveTextContent('Nível 1/1');
    expect(situation()).toHaveTextContent('❤ 10');
    expect(situation()).toHaveTextContent('Turno 0');
    expect(button('Andar para cima')).toBeEnabled();
    expect(screen.getByText(/Mãos vazias/)).toBeInTheDocument();
  });
});
