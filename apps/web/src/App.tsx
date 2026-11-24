import { useCallback, useEffect, useState } from 'react';
import { Direction, type RankedRun } from '@lab/domain';
import { fetchRanking } from './api';
import { Dungeon } from './Dungeon';
import { ActionLog, DirectionPad, Inventory, Vitals } from './Panel';
import { GameOver, Ranking } from './Results';
import { useGame } from './useGame';

const MOVE_KEYS: Record<string, Direction> = {
  ArrowUp: Direction.Up,
  ArrowRight: Direction.Right,
  ArrowDown: Direction.Down,
  ArrowLeft: Direction.Left,
};
const ATTACK_KEYS: Record<string, Direction> = {
  w: Direction.Up,
  d: Direction.Right,
  s: Direction.Down,
  a: Direction.Left,
};

export function App() {
  const { game, move, attack, equip, restart } = useGame();
  const [ranking, setRanking] = useState<RankedRun[] | null>(null);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const playing = game.status === 'playing';
  const inventory = game.inventory;

  const loadRanking = useCallback(() => {
    fetchRanking()
      .then((runs) => {
        setRanking(runs);
        setRankingError(null);
      })
      .catch((err: Error) => setRankingError(err.message));
  }, []);

  useEffect(loadRanking, [loadRanking]);

  // Teclado: setas andam, WASD ataca, 1 a 5 equipam.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!playing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (MOVE_KEYS[key]) {
        e.preventDefault();
        move(MOVE_KEYS[key]);
      } else if (ATTACK_KEYS[key]) {
        e.preventDefault();
        attack(ATTACK_KEYS[key]);
      } else if (/^[1-5]$/.test(key)) {
        const item = inventory[Number(key) - 1];
        if (item) equip(item.kind);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, inventory, move, attack, equip]);

  const equipped = inventory.find((i) => i.equipped);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🗡️
          </span>
          <div>
            <h1>A Missão</h1>
            <p>Limpe os 7 níveis da masmorra sem perder a vida</p>
          </div>
        </div>
        <div className="hud" aria-label="Situação">
          <span className="chip chip-level">
            Nível <strong>{game.level}</strong>/{game.levelCount}
          </span>
          <span className="chip chip-hp">
            ❤ <strong>{game.playerHitPoints}</strong>
          </span>
          <span className="chip">
            Turno <strong>{game.turn}</strong>
          </span>
        </div>
      </header>

      <main className="columns">
        <section className="card board-card" aria-label="Masmorra">
          <div className="levels" aria-hidden="true">
            {Array.from({ length: game.levelCount }, (_, i) => (
              <span key={i} className={i + 1 < game.level ? 'done' : i + 1 === game.level ? 'current' : undefined} />
            ))}
          </div>
          <div className="board-wrap">
            <Dungeon
              width={game.width}
              height={game.height}
              player={game.playerPosition}
              playerHitPoints={game.playerHitPoints}
              enemies={game.enemies}
              floorItem={game.floorItem}
              lastEntry={game.log[0]}
            />
            {game.status !== 'playing' && (
              <GameOver
                key={game.turn}
                status={game.status}
                level={game.level}
                levelCount={game.levelCount}
                hitPoints={game.playerHitPoints}
                onSaved={loadRanking}
                onRestart={restart}
              />
            )}
          </div>
          <div className="controls">
            <DirectionPad label="Andar" hint="setas" variant="move" disabled={!playing} onPress={move} />
            <div className="equipped">
              <span className="muted">Na mão</span>
              <strong>{equipped ? equipped.name : 'nada'}</strong>
            </div>
            <DirectionPad
              label="Atacar"
              hint="W A S D"
              variant="attack"
              disabled={!playing || !equipped}
              onPress={attack}
            />
          </div>
        </section>

        <aside className="side">
          <section className="card">
            <header className="card-header">
              <h2>Inventário</h2>
              <span className="muted">teclas 1–5</span>
            </header>
            <Inventory items={inventory} disabled={!playing} onEquip={equip} />
          </section>
          <section className="card">
            <header className="card-header">
              <h2>Vida</h2>
              <span className="muted">nível {game.level}</span>
            </header>
            <Vitals hitPoints={game.playerHitPoints} enemies={game.enemies} />
          </section>
          <section className="card">
            <header className="card-header">
              <h2>Diário</h2>
            </header>
            <ActionLog entries={game.log} />
          </section>
        </aside>
      </main>

      <div className="columns lower">
        <section className="card">
          <header className="card-header">
            <h2>Ranking</h2>
            <span className="muted">vitória, nível e vida</span>
          </header>
          <Ranking runs={ranking} error={rankingError} />
        </section>
        <section className="card how">
          <header className="card-header">
            <h2>Como jogar</h2>
          </header>
          <ul>
            <li>A cada turno você anda <em>ou</em> ataca; depois cada inimigo vivo age.</li>
            <li>
              <strong>Espada</strong> 1 casa, dano até 3, tenta as laterais · <strong>Arco</strong> 3 casas, dano 1 ·{' '}
              <strong>Maça</strong> 2 casas em todas as direções, dano até 6.
            </li>
            <li>
              <strong>Poção azul</strong> cura até 5 e a <strong>vermelha</strong> até 10: equipe e “ataque” para beber.
            </li>
            <li>Inimigos colados em você (até na diagonal) atacam. Limpe a sala para descer.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
