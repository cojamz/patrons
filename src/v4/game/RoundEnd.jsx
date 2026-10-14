// Round end as a moment: each quadrant's winner with a +N chip, follower totals ticking up (contests split from
// everything else gained this round), then the button that starts the next round.
import { useEffect, useRef, useState } from 'react';
import { followers } from '../../engine/v4/index.js';
import { playerColor, roman, standings, scoredStandings, roundGains, tiebreakNote, workersNote } from '../format.js';
import Tick from './Tick.jsx';
import { useDialog } from './parts.jsx';
import { Tip, ContestStandings, NamedText } from './Info.jsx';
import { Who } from './Glyphs.jsx';

export default function RoundEnd({ info, onNext, autoMs }) {
  const { result, start, after, board } = info;
  const at = board || after; // the table at the moment of scoring
  // The contests exactly as the engine scored them (state.contests); an old save without the record re-reads the
  // engine's contest table on the scoring snapshot. Every number and winner below comes from one of those two.
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const counts = scoredStandings(after, roundNo) || standings(at).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  const rows = counts.map(st => ({ ...st, winners: st.leaders, v: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0 }));
  const box = useDialog(onNext);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); onNext(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onNext]);
  // a body taller than the card scrolls, and says so with a fade at the bottom edge
  const body = useRef(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = body.current;
    if (!el) return undefined;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    const t = setTimeout(check, 400);
    return () => { el.removeEventListener('scroll', check); removeEventListener('resize', check); clearTimeout(t); };
  }, []);
  useEffect(() => {
    if (!autoMs) return undefined;
    const t = setTimeout(onNext, autoMs);
    return () => clearTimeout(t);
  }, [autoMs, onNext]);

  const name = id => after.players[id].name;
  const contest = id => rows.reduce((s, r) => s + (r.winners.includes(id) ? r.v : 0), 0);
  // Sorted by the total shown on this card (end-game bonuses, if any, come next on the results screen).
  const shownTotal = p => followers(at, at.players[p.id]);
  const ranked = [...after.players].sort((a, b) => shownTotal(b) - shownTotal(a));
  const finalParts = after.over ? after.players.filter(p => p.final && p.final.parts.length) : [];
  const first = !after.over && after.order && after.order.length ? after.players[after.order[0]] : null;
  return (
    <div className="overlay moment" role="dialog" aria-modal="true" aria-label={`Round ${result.round} scoring`}>
      <div className="dialog roundend" ref={box}>
        <h2>Round {result.round} scored</h2>
        <div className={`re-body${more ? ' more' : ''}`} ref={body}>
        <ul className="re-rows">
          {rows.map(r => (
            <li key={r.qid} style={{ '--c': `var(--${r.qid})` }} className={r.winners.length ? '' : 'none'} data-qid={r.qid} data-winners={r.winners.join(',')}>
              <span className="re-q"><i /><span>
                <Tip className="re-rule" label={`${r.rule}: what it counts and every count`} content={() => <ContestStandings state={at} st={r} scored />}>{r.rule}</Tip>
                {r.tiebreak && <small className="re-tb">{r.tiebreak.text}</small>}
              </span></span>
              <span className="re-w">
                <span className="re-win">
                  {r.winners.length
                    ? r.winners.map((id, k) => <b key={id}>{k ? ' & ' : ''}<Who state={after} id={id} /></b>)
                    : <em>no one scored</em>}
                </span>
                <small className="re-counts num">
                  {r.rows.map(row => {
                    const tb = tiebreakNote(r, row);
                    return <span key={row.id} className={r.winners.includes(row.id) ? 'won' : ''} data-pid={row.id} data-count={row.shown}>{name(row.id)} {row.shown}{tb ? <small> ({tb})</small> : null}</span>;
                  })}
                </small>
              </span>
              <span className="re-chip num" aria-label={`plus ${r.v} followers`} title={`${r.rule}: the leader gains +${r.v} followers in round ${result.round}`}>+{r.v}</span>
            </li>
          ))}
        </ul>
        <div className="re-totals" role="table" aria-label="Followers after this round">
          <div className="re-head" role="row"><span role="columnheader">Player</span><span role="columnheader">Contests</span><span role="columnheader" title="Followers gained this round: what new members are worth, followers bought, and effects (followers from members' abilities during play)">Other</span><span role="columnheader">Followers</span></div>
          {ranked.map(p => {
            const now = followers(at, at.players[p.id]);
            const was = start && start.players[p.id] ? followers(start, start.players[p.id]) : now;
            const c = contest(p.id);
            const g = start ? roundGains(start, at, p, c) : null;
            const other = now - was - c;
            const why = g ? [g.members && `${g.members > 0 ? '+' : ''}${g.members} from members`, g.bought && `+${g.bought} bought`, g.effects && `${g.effects > 0 ? '+' : ''}${g.effects} effects`].filter(Boolean).join(' · ') : '';
            return (
              <div key={p.id} className="re-p" role="row" style={{ '--pc': playerColor(p.id) }}>
                <span className="nm" role="cell"><Who state={after} id={p.id} /></span>
                <span className="re-d num" role="cell">{c ? `+${c}` : '—'}</span>
                <span className="re-d num" role="cell">{other ? (why || `${other > 0 ? '+' : ''}${other}`) : '—'}</span>
                <Tick value={now} from={was} color="var(--ink)" className="re-f num" dur={700} float={false} />
              </div>
            );
          })}
        </div>
        {after.over && (
          <p className="hint re-next">
            End-game bonuses come next{finalParts.length ? ': ' : '.'}
            {finalParts.map((p, k) => <span key={p.id}>{k ? ' · ' : ''}<b style={{ color: playerColor(p.id) }}>{p.name}</b> <NamedText state={after} text={p.final.parts.join(', ')} /></span>)}
          </p>
        )}
        {first && <p className="hint">Round {roman(after.round)} · <span className="num">{workersNote(after)}</span> · {first.name} picks first</p>}
        </div>
        {more && <span className="re-more" aria-hidden="true">More below ↓</span>}
        <div className="re-foot">
        <button type="button" className="btn pri" data-next-round data-autofocus onClick={onNext}>
          {after.over ? 'See results' : `Start round ${roman(after.round)}`}
        </button>
        </div>
      </div>
    </div>
  );
}
