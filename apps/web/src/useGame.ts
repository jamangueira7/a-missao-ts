import { useCallback, useReducer, useRef } from 'react';
import { Game, type Direction, type ItemKind } from '@lab/domain';

/** Liga o React ao `Game`: guarda a instância num ref e força o render depois de cada ação. */
export function useGame() {
  const ref = useRef<Game | null>(null);
  if (ref.current === null) ref.current = new Game();
  const [, render] = useReducer((n: number) => n + 1, 0);

  const act = useCallback((action: (game: Game) => unknown) => {
    action(ref.current!);
    render();
  }, []);

  const move = useCallback((d: Direction) => act((g) => g.move(d)), [act]);
  const attack = useCallback((d: Direction) => act((g) => g.attack(d)), [act]);
  const equip = useCallback((kind: ItemKind) => act((g) => g.equip(kind)), [act]);
  const restart = useCallback(() => act((g) => g.restart()), [act]);

  return { game: ref.current, move, attack, equip, restart };
}
