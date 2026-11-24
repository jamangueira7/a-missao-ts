import type { CSSProperties } from 'react';
import { Direction, type EnemyView, type ItemKind, type ItemView, type LogEntry } from '@lab/domain';
import { ENEMY_COLORS, EnemySprite, HeroSprite, ITEM_COLORS, ItemSprite, PLAYER_COLOR } from './sprites';

const ARROWS: Record<Direction, string> = {
  [Direction.Up]: '↑',
  [Direction.Right]: '→',
  [Direction.Down]: '↓',
  [Direction.Left]: '←',
};
const NAMES: Record<Direction, string> = {
  [Direction.Up]: 'cima',
  [Direction.Right]: 'direita',
  [Direction.Down]: 'baixo',
  [Direction.Left]: 'esquerda',
};
const WASD: Record<Direction, string> = {
  [Direction.Up]: 'W',
  [Direction.Right]: 'D',
  [Direction.Down]: 'S',
  [Direction.Left]: 'A',
};
const CROSS: readonly [Direction, string][] = [
  [Direction.Up, 'up'],
  [Direction.Left, 'left'],
  [Direction.Right, 'right'],
  [Direction.Down, 'down'],
];

interface PadProps {
  label: string;
  hint: string;
  variant: 'move' | 'attack';
  disabled: boolean;
  onPress(direction: Direction): void;
}

/** Botões em cruz para andar ou atacar. */
export function DirectionPad({ label, hint, variant, disabled, onPress }: PadProps) {
  return (
    <div className={`pad pad-${variant}`}>
      <span className="pad-label">{label}</span>
      <div className="pad-grid" role="group" aria-label={label}>
        {CROSS.map(([d, area]) => (
          <button
            key={d}
            type="button"
            className={`pad-btn pad-${area}`}
            disabled={disabled}
            onClick={() => onPress(d)}
            aria-label={`${label} para ${NAMES[d]}`}
            title={`${label} para ${NAMES[d]} (${variant === 'move' ? 'seta' : WASD[d]})`}
          >
            {ARROWS[d]}
          </button>
        ))}
        <span className="pad-center" aria-hidden="true">
          {variant === 'move' ? '👣' : '⚔️'}
        </span>
      </div>
      <span className="pad-hint">{hint}</span>
    </div>
  );
}

interface InventoryProps {
  items: readonly ItemView[];
  disabled: boolean;
  onEquip(kind: ItemKind): void;
}

/** Inventário clicável: a arma equipada fica em destaque. Teclas 1 a 5 equipam. */
export function Inventory({ items, disabled, onEquip }: InventoryProps) {
  if (items.length === 0) {
    return <p className="muted empty">Mãos vazias. Ande até a arma brilhando no chão.</p>;
  }
  return (
    <ul className="inventory">
      {items.map((item, i) => (
        <li key={item.kind}>
          <button
            type="button"
            className={`slot${item.equipped ? ' is-equipped' : ''}`}
            style={{ '--item': ITEM_COLORS[item.kind] } as CSSProperties}
            aria-pressed={item.equipped}
            disabled={disabled}
            onClick={() => onEquip(item.kind)}
            title={`${item.name} (tecla ${i + 1})`}
          >
            <span className="slot-key">{i + 1}</span>
            <ItemSprite kind={item.kind} size={40} />
            <span className="slot-name">{item.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="bar" aria-hidden="true">
      <div className="bar-fill" style={{ width: `${Math.min(1, value / max) * 100}%`, background: color }} />
    </div>
  );
}

/** Pontos de vida de todos que estão na sala. */
export function Vitals({ hitPoints, enemies }: { hitPoints: number; enemies: readonly EnemyView[] }) {
  return (
    <ul className="vitals">
      <li style={{ '--who': PLAYER_COLOR } as CSSProperties}>
        <HeroSprite size={34} />
        <span className="vital-name">Você</span>
        <Bar value={hitPoints} max={10} color={PLAYER_COLOR} />
        <strong>{hitPoints}</strong>
      </li>
      {enemies.map((e) => (
        <li key={e.id} className={e.dead ? 'is-dead' : undefined}>
          <EnemySprite kind={e.kind} size={34} />
          <span className="vital-name">
            {e.name}
            <small>dano até {e.maxDamage}</small>
          </span>
          <Bar value={e.hitPoints} max={e.maxHitPoints} color={ENEMY_COLORS[e.kind]} />
          <strong>{e.dead ? '☠' : e.hitPoints}</strong>
        </li>
      ))}
    </ul>
  );
}

/** Últimas ações, a mais nova em cima. */
export function ActionLog({ entries }: { entries: readonly LogEntry[] }) {
  return (
    <ol className="log" aria-live="polite" aria-relevant="additions">
      {entries.map((e) => (
        <li key={e.id} className={`log-${e.tone}`}>
          {e.text}
        </li>
      ))}
    </ol>
  );
}
