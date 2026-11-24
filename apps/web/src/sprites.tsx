import type { EnemyKind, ItemKind } from '@lab/domain';

/** Arte própria em SVG (viewBox 64×64). Cada personagem e item tem uma cor fixa em toda a tela. */
export const ENEMY_COLORS: Record<EnemyKind, string> = { bat: '#a77be0', ghost: '#9fd8ea', ghoul: '#86c25a' };
export const ITEM_COLORS: Record<ItemKind, string> = {
  sword: '#d7dde6',
  bow: '#c98a4b',
  mace: '#9aa3ad',
  'blue-potion': '#4f9bff',
  'red-potion': '#f2555a',
};
export const PLAYER_COLOR = '#f0b43c';

interface SpriteProps {
  size?: number | string;
  className?: string;
}

export function HeroSprite({ size = '100%', className }: SpriteProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="rgb(0 0 0 / 35%)" />
      <path d="M16 56 L20 34 Q32 28 44 34 L48 56 Z" fill="#2f6f8f" />
      <path d="M26 34 L32 56 L38 34 Z" fill="#245a75" />
      <rect x="22" y="40" width="20" height="4" rx="2" fill="#7a4a24" />
      <rect x="30" y="39" width="5" height="6" rx="1" fill={PLAYER_COLOR} />
      <circle cx="32" cy="22" r="12" fill="#c7ccd4" />
      <path d="M20 22 a12 12 0 0 1 24 0 v4 h-24 z" fill="#aab1bc" />
      <rect x="23" y="21" width="18" height="4" rx="2" fill="#2a2f38" />
      <path d="M32 10 Q40 2 46 8 Q40 8 34 12 Z" fill="#e2483d" />
      <circle cx="44" cy="44" r="8" fill={PLAYER_COLOR} stroke="#9a6a14" strokeWidth="2" />
      <path d="M44 38 v12 M38 44 h12" stroke="#9a6a14" strokeWidth="2" />
    </svg>
  );
}

function BatSprite() {
  const c = ENEMY_COLORS.bat;
  return (
    <>
      <ellipse cx="32" cy="58" rx="12" ry="3" fill="rgb(0 0 0 / 30%)" />
      <path d="M32 30 L6 18 Q10 30 4 38 Q14 34 18 42 Q22 34 28 38 Z" fill="#6c4a9a" />
      <path d="M32 30 L58 18 Q54 30 60 38 Q50 34 46 42 Q42 34 36 38 Z" fill="#6c4a9a" />
      <ellipse cx="32" cy="34" rx="10" ry="12" fill={c} />
      <path d="M24 24 L26 14 L30 23 Z M40 24 L38 14 L34 23 Z" fill={c} />
      <circle cx="28" cy="31" r="3" fill="#ffe14d" />
      <circle cx="36" cy="31" r="3" fill="#ffe14d" />
      <circle cx="28" cy="31" r="1.2" fill="#2a1a3a" />
      <circle cx="36" cy="31" r="1.2" fill="#2a1a3a" />
      <path d="M29 39 l1.5 3 l1.5 -3 M33 39 l1.5 3 l1.5 -3" fill="#fff" />
    </>
  );
}

function GhostSprite() {
  const c = ENEMY_COLORS.ghost;
  return (
    <>
      <ellipse cx="32" cy="59" rx="12" ry="3" fill="rgb(0 0 0 / 25%)" />
      <path
        d="M14 54 V28 a18 18 0 0 1 36 0 V54 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 z"
        fill={c}
        fillOpacity="0.92"
        stroke="#e9f8fd"
        strokeWidth="2"
      />
      <ellipse cx="25" cy="28" rx="4" ry="6" fill="#1d2b3a" />
      <ellipse cx="39" cy="28" rx="4" ry="6" fill="#1d2b3a" />
      <ellipse cx="32" cy="41" rx="4" ry="5" fill="#1d2b3a" />
    </>
  );
}

function GhoulSprite() {
  const c = ENEMY_COLORS.ghoul;
  return (
    <>
      <ellipse cx="32" cy="58" rx="15" ry="4" fill="rgb(0 0 0 / 35%)" />
      <path d="M18 58 L20 38 Q32 32 44 38 L46 58 Z" fill="#5b4a3a" />
      <path d="M22 44 L8 40 M42 44 L56 38" stroke={c} strokeWidth="6" strokeLinecap="round" />
      <rect x="18" y="8" width="28" height="30" rx="12" fill={c} />
      <path d="M22 14 q6 -6 12 0" stroke="#4d7a2c" strokeWidth="2" fill="none" />
      <circle cx="26" cy="22" r="4" fill="#fff6c2" />
      <circle cx="38" cy="23" r="3" fill="#fff6c2" />
      <circle cx="26" cy="22" r="1.6" fill="#c0392b" />
      <circle cx="38" cy="23" r="1.3" fill="#c0392b" />
      <path d="M24 31 h16" stroke="#2c3a1e" strokeWidth="2.5" />
      <path d="M27 29 v4 M31 29 v4 M35 29 v4" stroke="#2c3a1e" strokeWidth="1.5" />
    </>
  );
}

export function EnemySprite({ kind, size = '100%', className }: SpriteProps & { kind: EnemyKind }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      {kind === 'bat' ? <BatSprite /> : kind === 'ghost' ? <GhostSprite /> : <GhoulSprite />}
    </svg>
  );
}

function Flask({ color }: { color: string }) {
  return (
    <>
      <rect x="26" y="8" width="12" height="6" rx="2" fill="#8a5a2b" />
      <path d="M27 14 h10 v8 l9 14 a14 14 0 1 1 -28 0 l9 -14 z" fill="#e9eef5" fillOpacity="0.35" stroke="#e9eef5" strokeWidth="2" />
      <path d="M20 40 h24 a12 12 0 1 1 -24 0 z" fill={color} />
      <circle cx="27" cy="44" r="2.5" fill="#fff" fillOpacity="0.7" />
    </>
  );
}

export function ItemSprite({ kind, size = '100%', className }: SpriteProps & { kind: ItemKind }) {
  const c = ITEM_COLORS[kind];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      {kind === 'sword' && (
        <g transform="rotate(45 32 32)">
          <path d="M29 4 h6 v36 l-3 4 l-3 -4 z" fill={c} stroke="#8d97a5" strokeWidth="1.5" />
          <rect x="20" y="40" width="24" height="5" rx="2" fill="#e0a42c" />
          <rect x="29" y="45" width="6" height="11" rx="2" fill="#7a4a24" />
          <circle cx="32" cy="59" r="3.5" fill="#e0a42c" />
        </g>
      )}
      {kind === 'bow' && (
        <>
          <path d="M18 6 Q52 32 18 58" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M18 6 V58" stroke="#efe6d2" strokeWidth="1.5" />
          <path d="M10 32 H52" stroke="#a7a19a" strokeWidth="2.5" />
          <path d="M52 32 l-7 -5 v10 z" fill="#d7dde6" />
          <path d="M10 32 l-4 -4 M10 32 l-4 4" stroke="#e2483d" strokeWidth="2.5" />
        </>
      )}
      {kind === 'mace' && (
        <g transform="rotate(-30 32 32)">
          <rect x="29" y="28" width="6" height="32" rx="3" fill="#7a4a24" />
          <path
            d="M32 4 l4 8 l9 -3 l-3 9 l8 4 l-8 4 l3 9 l-9 -3 l-4 8 l-4 -8 l-9 3 l3 -9 l-8 -4 l8 -4 l-3 -9 l9 3 z"
            fill={c}
            stroke="#5f6770"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="22" r="7" fill="#b9c1ca" />
        </g>
      )}
      {(kind === 'blue-potion' || kind === 'red-potion') && <Flask color={c} />}
    </svg>
  );
}
