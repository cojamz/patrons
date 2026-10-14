// Who's winning, in one quiet line under the prompt (meta round 2, #7): "P4 41 · You 36 · P3 24 · P2 23", most
// followers first (members break a follower tie, the end-of-game rule), the leader lit. Hover (long-press) on a name
// gives the margin: "P4 leads by 5", "You: 5 behind P4". Every number is the engine's followers().
import { followers, memberCount } from '../../engine/v4/index.js';
import { Follower } from '../art/Follower.jsx';
import './lamp-b.css';

/** The players ranked: [{ id, name, f, m }] most followers first, members breaking ties, then seat. */
export function rankRows(state, me = null) {
  return state.players
    .map(p => ({ id: p.id, name: p.id === me ? 'You' : p.name, f: followers(state, p), m: memberCount(state, p) }))
    .sort((a, b) => b.f - a.f || b.m - a.m || a.id - b.id);
}

export default function RankRow({ state, me = null }) {
  if (!(state.round >= 1)) return null;
  const rows = rankRows(state, me);
  const top = rows[0];
  const shared = rows.filter(r => r.f === top.f && r.m === top.m);
  const second = rows.find(r => r.f < top.f || r.m < top.m);
  const say = (r, k) => {
    const unit = n => `${n} follower${n === 1 ? '' : 's'}`;
    if (shared.length > 1 && shared.includes(r)) return `${shared.map(x => x.name).join(' and ')} share the lead with ${unit(r.f)}`;
    if (k === 0) return `${r.name} ${r.name === 'You' ? 'lead' : 'leads'} by ${top.f - second.f || 0}${top.f === second.f ? ` (members break the tie: ${top.m} to ${second.m})` : ''} · ${unit(r.f)}`;
    return `${r.name}: ${unit(r.f)}, ${top.f - r.f} behind ${shared.map(x => x.name).join(' and ')}`;
  };
  return (
    <div className="lt-rank" data-rank="" role="list" aria-label="Followers, most first">
      <Follower size={10} title="followers" />
      {rows.map((r, k) => (
        <span key={r.id} role="listitem" data-pid={r.id} data-followers={r.f}
          className={`rk${shared.includes(r) ? ' lead' : ''}${r.id === me ? ' me' : ''}`} title={say(r, k)}>
          {k ? <i aria-hidden="true">·</i> : null}{r.name} <b className="num">{r.f}</b>
        </span>
      ))}
    </div>
  );
}
