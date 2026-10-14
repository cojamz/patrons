// Round end as a moment: each quadrant's winner with a +N chip, follower totals ticking up, then Next round.
import { useEffect } from 'react';
import { followers, WORKERS } from '../../engine/v4/index.js';
import { playerColor, roman } from '../format.js';
import Tick from './Tick.jsx';

export default function RoundEnd({ info, onNext, autoMs }) {
  const { result, before, after } = info;
  useEffect(() => {
    if (!autoMs) return undefined;
    const t = setTimeout(onNext, autoMs);
    return () => clearTimeout(t);
  }, [autoMs, onNext]);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); onNext(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onNext]);

  const name = id => after.players[id].name;
  const ranked = [...after.players].sort((a, b) => followers(after, b) - followers(after, a));
  const first = !after.over && after.order && after.order.length ? after.players[after.order[0]] : null;
  return (
    <div className="overlay moment" role="dialog" aria-modal="true" aria-label={`Round ${result.round} scoring`}>
      <div className="dialog roundend">
        <h2>Round {result.round} scored</h2>
        <ul className="re-rows">
          {result.rows.map(r => (
            <li key={r.qid} style={{ '--c': `var(--${r.qid})` }} className={r.winners.length ? '' : 'none'}>
              <span className="re-q"><i />{r.label}</span>
              <span className="re-w">
                {r.winners.length
                  ? r.winners.map((id, k) => <b key={id} style={{ color: playerColor(id) }}>{k ? ' & ' : ''}{name(id)}</b>)
                  : <em>no one</em>}
              </span>
              <span className="re-chip" aria-label={`plus ${r.v} followers`}>+{r.v}</span>
            </li>
          ))}
        </ul>
        <div className="re-totals">
          {ranked.map(p => {
            const was = before.players[p.id] ? followers(before, before.players[p.id]) : followers(after, p);
            return (
              <div key={p.id} className="re-p" style={{ '--pc': playerColor(p.id) }}>
                <span className="nm"><i />{p.name}</span>
                <Tick value={followers(after, p)} from={was} color="var(--ink)" className="re-f" dur={700} />
              </div>
            );
          })}
        </div>
        {first && <p className="hint">Round {roman(after.round)} · {WORKERS[after.round - 1]} workers each · {first.name} picks first</p>}
        <button type="button" className="btn pri" data-next-round autoFocus onClick={onNext}>
          {after.over ? 'See results' : `Start round ${roman(after.round)}`}
        </button>
      </div>
    </div>
  );
}
