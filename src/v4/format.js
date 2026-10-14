// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE, followers as engineFollowers } from '../engine/v4/index.js';

export const PLAYER_COLORS = ['#f4efe2', '#ff8fb1', '#b9a2ff', '#ffa94d'];
export const playerColor = id => PLAYER_COLORS[id % PLAYER_COLORS.length];
export const resColor = r => `var(--${r})`;
export { roman };

export const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Scoring banner text for a quadrant on a ring, e.g. "MOST GOLD +2". */
export const bannerText = (qid, ring) => `${quadrant(qid).scoring.label.toUpperCase()}  +${RING_VALUE[ring - 1]}`;

/** Group a player's members into chips. Identical cards in identical states share one chip. */
export function memberChips(state, p) {
  const out = new Map();
  for (const uid of p.members) {
    const c = state.cards[uid];
    const d = cardDef(state, uid);
    const extra = c.copy ? ` → ${defById(c.copy).name}` : c.color ? ` · ${quadrant(c.color).name}` : '';
    const key = [d.id, c.used ? 'u' : '', c.on === false ? 'off' : '', c.copy || '', c.color || ''].join('|');
    if (!out.has(key)) out.set(key, { key, uids: [], def: d, card: c, label: d.name + extra, count: 0 });
    const g = out.get(key);
    g.uids.push(uid);
    g.count += 1;
  }
  return [...out.values()];
}

export function costParts(def) {
  const parts = [];
  if (def.s) parts.push({ color: def.quadrant, n: def.s });
  if (def.w) parts.push({ color: 'any', n: def.w });
  return parts;
}

export const tierCostText = t => (t.colors === 1 ? `${t.cost} of anything` : `${t.cost}, ${t.colors}+ colors`);
export { TIERS };

/**
 * Header line, phrased for people. `me` is true when the seat to act is controlled here.
 * Returns { who, text } where who is the acting player (or null).
 */
export function promptFor(state, mine) {
  if (state.over) return { who: null, text: 'Game over' };
  const pend = state.pending;
  if (!pend) return { who: null, text: '' };
  const p = state.players[pend.player];
  const name = p.name;
  switch (pend.kind) {
    case 'setup': {
      const k = (pend.prompt.match(/\((\d) of 2\)/) || [])[1] || '';
      return mine
        ? { who: p, text: `Pick a starting resource${k ? ` (${k} of 2)` : ''}` }
        : { who: p, text: `${name} is picking a starting resource` };
    }
    case 'place':
      return mine
        ? { who: p, text: `Place a worker on a glowing space` }
        : { who: p, text: `${name} is placing a worker` };
    case 'buy':
      return mine
        ? { who: p, text: 'Recruit a member, buy followers, or pass' }
        : { who: p, text: `${name} is shopping` };
    case 'pay':
      return mine ? { who: p, text: 'Choose how to pay' } : { who: p, text: `${name} is paying` };
    case 'choose':
      return mine ? { who: p, text: pend.prompt } : { who: p, text: `${name} is deciding: ${pend.prompt}` };
    default:
      return { who: p, text: pend.prompt };
  }
}

/** Followers a player bought with the follower buys. Uses p.bought when the engine tracks it, else the log. */
export function boughtFollowers(state, p) {
  if (typeof p.bought === 'number') return p.bought;
  const re = new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} bought (\\d+) followers?\\b`);
  return state.log.reduce((s, l) => { const m = l.match(re); return s + (m ? Number(m[1]) : 0); }, 0);
}

/** Follower breakdown for the results table: self + members + bought + member effects + contests + end game. */
export function breakdown(state, p) {
  // followers that members are worth, as the engine counts them (a Doppelganger can copy a follower value)
  const members = engineFollowers(state, p) - 1 - p.bonus;
  const endGame = p.final ? p.final.total : 0;
  const bought = Math.min(boughtFollowers(state, p), Math.max(0, p.bonus - p.contest - endGame));
  const effects = p.bonus - p.contest - endGame - bought;
  return { self: 1, members, contests: p.contest, bought, effects, endGame, parts: p.final ? p.final.parts : [] };
}

// ---------- round end, read back from the engine's log line ----------
const ROUND_END = /^Round (\S+) ends\.\s*/;
export const isRoundEnd = line => ROUND_END.test(line);

/**
 * "Round II ends. Most gold: P1 & P2 +4 · Most members: P3 +4" -> { round: 'II', rows: [{ qid, label, winners:[ids], v }] }.
 * Every quadrant gets a row; quadrants nobody led have no winners.
 */
export function parseRoundEnd(state, line) {
  const m = line.match(ROUND_END);
  if (!m) return null;
  const body = line.slice(m[0].length);
  const scored = {};
  if (!/^No one scored/.test(body)) {
    for (const seg of body.split(' · ')) {
      const s = seg.match(/^(.*): (.*) \+(\d+)$/);
      if (!s) continue;
      const qid = state.quadrants.find(q => quadrant(q).scoring.label === s[1]);
      if (!qid) continue;
      const winners = s[2].split(' & ').map(n => state.players.find(p => p.name === n)).filter(Boolean).map(p => p.id);
      scored[qid] = { winners, v: Number(s[3]) };
    }
  }
  const ringValue = RING_VALUE[['I', 'II', 'III'].indexOf(m[1])] ?? 0;
  return {
    round: m[1],
    rows: state.quadrants.map(qid => ({ qid, label: quadrant(qid).scoring.label, winners: scored[qid]?.winners || [], v: scored[qid]?.v ?? ringValue })),
  };
}

/** Contest wins per player per quadrant label, from every round-end line still in the log. */
export function contestWins(state) {
  const wins = state.players.map(() => ({}));
  for (const line of state.log) {
    const r = isRoundEnd(line) ? parseRoundEnd(state, line) : null;
    if (!r) continue;
    for (const row of r.rows) for (const id of row.winners) wins[id][row.label] = (wins[id][row.label] || 0) + row.v;
  }
  return wins;
}

/** One sentence on why the winner won, built from the followers breakdown. */
export function winSentence(state) {
  const ranked = (state.ranking || state.players.map(p => p.id)).map(id => state.players[id]);
  const f = p => engineFollowers(state, p);
  const w = ranked[0];
  const tied = ranked.filter(p => f(p) === f(w));
  if (tied.length > 1) return `${tied.map(p => p.name).join(' and ')} tie on ${f(w)} followers.`;
  const b = breakdown(state, w);
  const lead = ranked[1] ? `${w.name} won by ${f(w) - f(ranked[1])}` : `${w.name} won`;
  const sources = [['members', b.members], ['contests', b.contests], ['bought', b.bought], ['effects', b.effects], ['endGame', b.endGame]];
  const [top] = sources.reduce((a, c) => (c[1] > a[1] ? c : a));
  if (top === 'endGame' && b.parts.length) {
    const best = b.parts.map(s => { const m = s.match(/^(.*) \+(\d+)$/); return m ? { name: m[1], n: Number(m[2]) } : null; }).filter(Boolean).sort((a, c) => c.n - a.n)[0];
    return `${lead}: ${best.name} turned the endgame into ${best.n} followers.`;
  }
  if (top === 'contests') {
    const per = contestWins(state)[w.id];
    const most = Object.entries(per).sort((a, c) => c[1] - a[1])[0];
    return most
      ? `${lead}: ${b.contests} followers from ring contests, ${most[1]} of them for ${most[0].toLowerCase()}.`
      : `${lead}: ${b.contests} followers from ring contests.`;
  }
  if (top === 'bought') return `${lead}: ${b.bought} followers bought outright.`;
  if (top === 'effects') return `${lead}: members' effects added ${b.effects} followers during play.`;
  const n = w.members.reduce((s, u) => s + cardDef(state, u).n, 0);
  return `${lead}: ${n} members worth ${b.members} followers.`;
}

/** Lines added to the log between two states. The log only appends (and trims its front past a cap). */
export function newLogLines(prev, next) {
  const a = prev.log, b = next.log;
  if (a === b) return [];
  if (b.length >= a.length && (a.length === 0 || b[a.length - 1] === a[a.length - 1])) return b.slice(a.length);
  // trimmed at the front: find where prev's tail (last 4 lines) ends in next
  const tail = a.slice(-4);
  for (let j = b.length; j >= tail.length; j--) {
    if (tail.every((l, k) => b[j - tail.length + k] === l)) return b.slice(j);
  }
  return b.slice(-1);
}

/** The log split into sections: Setup, then one per round. Each: { title, lines }. */
export function logSections(state) {
  const out = [{ title: 'Setup', lines: [] }];
  for (const line of state.log) {
    const m = line.match(/^Round (\S+) begins\./);
    if (m) out.push({ title: `Round ${m[1]}`, lines: [] });
    out[out.length - 1].lines.push(line);
  }
  return out.filter(s => s.lines.length);
}
