import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RUN_NAME_MAX, validateRun, type GameStatus, type RankedRun } from '@lab/domain';
import { saveRun } from './api';

interface GameOverProps {
  status: Exclude<GameStatus, 'playing'>;
  level: number;
  levelCount: number;
  hitPoints: number;
  onSaved(): void;
  onRestart(): void;
}

/** Tela de fim de jogo: resultado, nome para o ranking e "jogar de novo". */
export function GameOver({ status, level, levelCount, hitPoints, onSaved, onRestart }: GameOverProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const won = status === 'won';

  useEffect(() => input.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const check = validateRun({ name, level, hitPoints, won });
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveRun(check.run);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay">
      <section className={`game-over ${won ? 'is-won' : 'is-lost'}`} aria-labelledby="game-over-title" aria-live="assertive">
        <span className="game-over-icon" aria-hidden="true">
          {won ? '🏆' : '💀'}
        </span>
        <h2 id="game-over-title">{won ? 'Missão cumprida!' : 'Você caiu na masmorra'}</h2>
        <p>
          {won
            ? `Os ${levelCount} níveis estão limpos e você saiu com ${hitPoints} de vida.`
            : `Chegou ao nível ${level} de ${levelCount}. Da próxima vez, beba a poção antes!`}
        </p>
        {saved ? (
          <p className="saved" role="status">
            ✓ Partida salva no ranking.
          </p>
        ) : (
          <form className="save-form" onSubmit={submit}>
            <label htmlFor="run-name">Seu nome no ranking</label>
            <div className="save-row">
              <input
                id="run-name"
                ref={input}
                value={name}
                maxLength={RUN_NAME_MAX}
                autoComplete="nickname"
                placeholder="Aventureira"
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
            {error && (
              <p className="hint" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
        <button type="button" className="btn btn-secondary btn-wide" onClick={onRestart}>
          ↻ Jogar de novo
        </button>
      </section>
    </div>
  );
}

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Ranking salvo no Postgres, já ordenado pela API. */
export function Ranking({ runs, error }: { runs: RankedRun[] | null; error: string | null }) {
  if (error) return <p className="hint">{error}</p>;
  if (runs === null) return <p className="muted">Carregando…</p>;
  if (runs.length === 0) return <p className="muted">Ninguém saiu da masmorra ainda. Seja o primeiro!</p>;
  return (
    <ol className="ranking">
      {runs.map((r, i) => (
        <li key={r.id} className={i < 3 ? `top top-${i + 1}` : undefined}>
          <span className="rank-pos">{i + 1}</span>
          <span className="rank-name">
            {r.name}
            <small>{DATE.format(new Date(r.createdAt))}</small>
          </span>
          <span className="rank-level">nível {r.level}</span>
          <span className="rank-hp">❤ {r.hitPoints}</span>
          <span className="rank-result" title={r.won ? 'Venceu' : 'Caiu'}>
            {r.won ? '🏆' : '💀'}
          </span>
        </li>
      ))}
    </ol>
  );
}
