import type { EnemyView, FloorItemView, LogEntry, Point } from '@lab/domain';
import { EnemySprite, HeroSprite, ItemSprite } from './sprites';

const CELL = 100;
const STONES = ['#3a3d45', '#363940', '#3f424b', '#34373e', '#41444d'];

/** Sorteio fixo por casa, só para variar a cor das pedras (é desenho, não regra do jogo). */
function shade(x: number, y: number): string {
  return STONES[(x * 7 + y * 13 + x * y) % STONES.length]!;
}

/** Chão de pedra desenhado em SVG: lajes com rejunte, rachaduras e o brilho de duas tochas. */
function StoneFloor({ width, height }: { width: number; height: number }) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x * CELL;
      const py = y * CELL;
      tiles.push(
        <g key={`${x}-${y}`}>
          <rect x={px + 3} y={py + 3} width={CELL - 6} height={CELL - 6} rx="10" fill={shade(x, y)} />
          <path d={`M${px + 10} ${py + 14} h${CELL - 30}`} stroke="rgb(255 255 255 / 6%)" strokeWidth="3" />
          {(x * 3 + y * 5) % 7 === 0 && (
            <path
              d={`M${px + 30} ${py + 20} l12 18 l-6 14 l14 20`}
              stroke="rgb(0 0 0 / 35%)"
              strokeWidth="2"
              fill="none"
            />
          )}
          {(x + y * 3) % 9 === 4 && <circle cx={px + 70} cy={py + 72} r="6" fill="rgb(0 0 0 / 18%)" />}
        </g>,
      );
    }
  }
  const w = width * CELL;
  const h = height * CELL;
  return (
    <svg className="floor" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="torch" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#ffb347" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="#202228" />
      {tiles}
      <ellipse cx={w * 0.25} cy="0" rx={w * 0.3} ry={h * 0.7} fill="url(#torch)" />
      <ellipse cx={w * 0.75} cy="0" rx={w * 0.3} ry={h * 0.7} fill="url(#torch)" />
      <rect width={w} height={h} fill="url(#vignette)" />
    </svg>
  );
}

function place(p: Point, width: number, height: number) {
  return { left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%`, width: `${100 / width}%`, height: `${100 / height}%` };
}

interface DungeonProps {
  width: number;
  height: number;
  player: Point;
  playerHitPoints: number;
  enemies: readonly EnemyView[];
  floorItem: FloorItemView | null;
  lastEntry: LogEntry | undefined;
}

/** A masmorra vista de cima: cada ícone posicionado pela coordenada da casa. */
export function Dungeon({ width, height, player, playerHitPoints, enemies, floorItem, lastEntry }: DungeonProps) {
  const hurtKey = lastEntry?.tone === 'hurt' ? lastEntry.id : 0;
  return (
    <div
      className="dungeon"
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={`Masmorra ${width} por ${height}. Você está na coluna ${player.x + 1}, linha ${player.y + 1}, com ${playerHitPoints} de vida.`}
    >
      <StoneFloor width={width} height={height} />
      {floorItem && (
        <div className="token item-token" style={place(floorItem, width, height)} title={`${floorItem.name} no chão`}>
          <ItemSprite kind={floorItem.kind} />
        </div>
      )}
      {enemies.map((e) => (
        <div
          key={e.id}
          className={`token enemy-token enemy-${e.kind}${e.dead ? ' is-dead' : ''}`}
          style={place(e, width, height)}
          title={`${e.name}: ${e.hitPoints}/${e.maxHitPoints}`}
        >
          <div className="mini-bar" aria-hidden="true">
            <span style={{ width: `${(e.hitPoints / e.maxHitPoints) * 100}%` }} />
          </div>
          <EnemySprite kind={e.kind} key={`${e.id}-${e.hitPoints}`} className={e.hitPoints < e.maxHitPoints ? 'sprite hit-flash' : 'sprite'} />
        </div>
      ))}
      <div className="token hero-token" style={place(player, width, height)} title="Você">
        <div className="mini-bar hero-bar" aria-hidden="true">
          <span style={{ width: `${Math.min(playerHitPoints, 10) * 10}%` }} />
        </div>
        <HeroSprite key={hurtKey} className={hurtKey ? 'sprite hurt' : 'sprite'} />
      </div>
    </div>
  );
}
