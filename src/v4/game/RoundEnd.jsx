// Round end as a moment: each quadrant's winner with a +N chip, follower totals ticking up (contests split from
// everything else gained this round), then the button that starts the next round.
import { useEffect } from 'react';
import { followers, WORKERS } from '../../engine/v4/index.js';
import { playerColor, roman } from '../format.js';
import Tick from './Tick.jsx';
import { useDialog } from './parts.jsx';

export default function RoundEnd({ info, onNext, autoMs }) {
  const { result, start, after } = info;
  const box = useDialog(onNext);
  useEffect(() => {
    if (!autoMs) return undefined;
    const t = setTimeout(onNext, autoMs);
    return () => clearTimeout(t);
  }, [autoMs, onNext]);

  const name = id => after.players[id].name;
  const contest = id => result.rows.reduce((s, r) => s + (r.winners.includes(id) ? r.v : 0), 0);
  const ranked = [...after.players].sort((a, b) => followers(after, b) - followers(after, a));
  const first = !after.over && after.order && after.order.length ? after.players[after.order[0]] : null;
  return (
    <div className="overlay moment" role="dialog" aria-modal="true" aria-label={`Round ${result.round} scoring`}>
      <div className="dialog roundend" ref={box}>
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
              <span className="re-chip num" aria-label={`plus ${r.v} followers`}>+{r.v}</span>
            </li>
          ))}
        </ul>
        <div className="re-totals" role="table" aria-label="Followers after this round">
          <div className="re-head" role="row"><span role="columnheader">Player</span><span role="columnheader">Contests</span><span role="columnheader">Other gains</span><span role="columnheader">Followers</span></div>
          {ranked.map(p => {
            const now = followers(after, p);
            const was = start && start.players[p.id] ? followers(start, start.players[p.id]) : now;
            const c = contest(p.id);
            const other = now - was - c;
            return (
              <div key={p.id} className="re-p" role="row" style={{ '--pc': playerColor(p.id) }}>
                <span className="nm" role="cell"><i />{p.name}</span>
                <span className="re-d num" role="cell">{c ? `+${c}` : '—'}</span>
                <span className="re-d num" role="cell" title="Members, buys and member effects this round">{other ? `${other > 0 ? '+' : ''}${other}` : '—'}</span>
                <Tick value={now} from={was} color="var(--ink)" className="re-f num" dur={700} float={false} />
              </div>
            );
          })}
        </div>
        {first && <p className="hint">Round {roman(after.round)} · <span className="num">{WORKERS[after.round - 1]}</span> workers each · {first.name} picks first</p>}
        <button type="button" className="btn pri" data-next-round data-autofocus onClick={onNext}>
          {after.over ? 'See results' : `Start round ${roman(after.round)}`}
        </button>
      </div>
    </div>
  );
}
