// Who's winning, read off the engine (meta round 2, #7). The top score row is gone (Cory, 2026-10-15: "you can kind
// of see the score already on people's cards"): each chair shows its own total, its place and, on hover, the margin
// ("P4 leads by 5", "You: 41 followers, 4 behind P4"). Most followers first; members break a follower tie (the
// end-of-game rule). Every number is the engine's followers().
import { followers, memberCount } from '../../engine/v4/index.js';

/** The players ranked: [{ id, name, f, m }] most followers first, members breaking ties, then seat. */
export function rankRows(state, me = null) {
  return state.players
    .map(p => ({ id: p.id, name: p.id === me ? 'You' : p.name, f: followers(state, p), m: memberCount(state, p) }))
    .sort((a, b) => b.f - a.f || b.m - a.m || a.id - b.id);
}

const ORD = n => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

/**
 * Each chair's place: { pid: { place, text, lead, f, title } }. place is 1-based and shared on a full tie (followers
 * and members level); lead: this chair leads (or shares the lead) while someone trails; title: the margin in words.
 * Empty before round I.
 */
export function seatRanks(state, me = null) {
  const out = {};
  if (!(state.round >= 1)) return out;
  const rows = rankRows(state, me);
  const top = rows[0];
  const shared = rows.filter(r => r.f === top.f && r.m === top.m);
  const second = rows.find(r => r.f < top.f || r.m < top.m);
  const unit = n => `${n} follower${n === 1 ? '' : 's'}`;
  rows.forEach((r, k) => {
    const place = 1 + rows.findIndex(x => x.f === r.f && x.m === r.m);
    let title;
    if (!second) title = `Everyone has ${unit(r.f)}`;
    else if (shared.length > 1 && shared.includes(r)) title = `${shared.map(x => x.name).join(' and ')} share the lead with ${unit(r.f)}`;
    else if (k === 0) title = `${r.name} ${r.name === 'You' ? 'lead' : 'leads'} by ${top.f - second.f || 0}${top.f === second.f ? ` (members break the tie: ${top.m} to ${second.m})` : ''} · ${unit(r.f)}`;
    else title = `${r.name}: ${unit(r.f)}, ${top.f - r.f} behind ${shared.map(x => x.name).join(' and ')}${top.f === r.f ? ` (members break the tie: ${top.m} to ${r.m})` : ''}`;
    out[r.id] = { place, text: ORD(place), lead: !!second && shared.includes(r), f: r.f, title };
  });
  return out;
}
