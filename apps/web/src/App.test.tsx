import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { rankedRun, stubApi } from './test/api';

/** Nível 1 de verdade (morcego em 7,1; espada em 2,3), com o sorteio sempre no máximo. */
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
});

const diary = () => within(screen.getByRole('heading', { name: 'Diário' }).closest('section')!);
const situation = () => screen.getByLabelText('Situação');
const dungeon = () => screen.getByRole('img', { name: /^Masmorra 10 por 6/ });
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const inHand = () => screen.getByText('Na mão').parentElement!;

async function pickUpSword(user: ReturnType<typeof userEvent.setup>) {
  await user.click(button('Andar para direita'));
  await user.click(button('Andar para direita'));
  await user.click(button('Andar para baixo'));
}

describe('tela do jogo', () => {
  it('começa no nível 1 com as mãos vazias, o diário de boas-vindas e os ataques desabilitados', async () => {
    stubApi();
    render(<App />);

    expect(situation()).toHaveTextContent('Nível 1/7');
    expect(situation()).toHaveTextContent('❤ 10');
    expect(situation()).toHaveTextContent('Turno 0');
    expect(dungeon()).toHaveAccessibleName(/coluna 1, linha 3, com 10 de vida/);
    expect(screen.getByText(/Mãos vazias/)).toBeInTheDocument();
    expect(screen.getByText('nada')).toBeInTheDocument();
    expect(diary().getByText('Você desceu à masmorra. Pegue a arma do chão!')).toBeInTheDocument();
    expect(button('Atacar para cima')).toBeDisabled();
    expect(button('Andar para cima')).toBeEnabled();
    expect(await screen.findByText(/Ninguém saiu da masmorra ainda/)).toBeInTheDocument();
  });

  it('mostra o ranking vindo da API e avisa quando ele não carrega', async () => {
    const api = stubApi({
      ranking: [rankedRun({ name: 'Ana' }), rankedRun({ id: 2, name: 'Bia', won: false, level: 5, hitPoints: 0 })],
    });
    const { unmount } = render(<App />);
    const first = await screen.findByText('Ana');
    expect(first).toBeInTheDocument();
    expect(screen.getByText('Bia')).toBeInTheDocument();
    expect(screen.getByText('nível 5')).toBeInTheDocument();
    expect(api.fetchMock).toHaveBeenCalledWith('/api/runs/ranking');
    unmount();

    stubApi({ ranking: { status: 500, body: {} } });
    render(<App />);
    expect(await screen.findByText('Não foi possível carregar o ranking.')).toBeInTheDocument();
  });

  it('anda pelos botões de direção e gasta um turno por passo', async () => {
    stubApi();
    const user = userEvent.setup();
    render(<App />);

    await user.click(button('Andar para direita'));
    expect(dungeon()).toHaveAccessibleName(/coluna 2, linha 3/);
    expect(situation()).toHaveTextContent('Turno 1');
    await user.click(button('Andar para cima'));
    expect(dungeon()).toHaveAccessibleName(/coluna 2, linha 2/);
    expect(situation()).toHaveTextContent('Turno 2');
  });

  it('anda pelas setas do teclado e avisa quando bate na parede', async () => {
    stubApi();
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(dungeon()).toHaveAccessibleName(/coluna 2, linha 4/);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(dungeon()).toHaveAccessibleName(/coluna 1, linha 4/);
    expect(diary().getByText('O caminho está bloqueado.')).toBeInTheDocument();
    expect(situation()).toHaveTextContent('Turno 4');
  });

  it('pisar na arma do chão a coloca no inventário, equipada, e registra no diário', async () => {
    stubApi();
    const user = userEvent.setup();
    render(<App />);

    await pickUpSword(user);

    const sword = button(/Espada/);
    expect(sword).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/Mãos vazias/)).not.toBeInTheDocument();
    expect(inHand()).toHaveTextContent('Na mãoEspada');
    expect(diary().getByText('Você pegou: Espada.')).toBeInTheDocument();
    expect(button('Atacar para cima')).toBeEnabled();
  });

  it('equipa a espada pelo clique e pela tecla 1 sem gastar turno', async () => {
    stubApi();
    const user = userEvent.setup();
    render(<App />);
    await pickUpSword(user);
    const turn = /Turno 3/;

    await user.click(button(/Espada/));
    expect(diary().getAllByText('Equipou: Espada.')).toHaveLength(1);
    await user.keyboard('1');
    expect(diary().getAllByText('Equipou: Espada.')).toHaveLength(2);
    await user.keyboard('4');
    expect(diary().getAllByText('Equipou: Espada.')).toHaveLength(2);
    expect(situation()).toHaveTextContent(turn);
  });
});
