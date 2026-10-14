// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE, followers as engineFollowers, memberCount, countMembersOfColor, applyMove } from '../engine/v4/index.js';

export const PLAYER_COLORS = ['#f4efe2', '#ff8fb1', '#b9a2ff', '#ffa94d'];
export const playerColor = id => PLAYER_COLORS[id % PLAYER_COLORS.length];
export const resColor = r => `var(--${r})`;
export { roman };

export const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Scoring banner text for a quadrant on a ring, e.g. "MOST GOLD +2". */
/** A scoring label without its parenthetical note ("Most members (red members break ties)" -> "Most members"). */
export const shortLabel = label => label.replace(/\s*\(.*\)\s*$/, '');
export const bannerText = (qid, ring) => `${shortLabel(quadrant(qid).scoring.label).toUpperCase()}  +${RING_VALUE[ring - 1]}`;

/** Group a player's members into chips. Identical cards in identical states share one chip. */
export function memberChips(state, p) {
  const out = new Map();
  for (const uid of p.members) {
    const c = state.cards[uid];
    const d = cardDef(state, uid);
    const extra = c.copy ? ` → ${defById(c.copy).name}` : c.color ? ` · works ${quadrant(c.color).name}` : '';
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

export const tierCostText = t => (t.colors === 1 ? `${t.cost} of anything` : `${t.cost}, ${t.colors}+ colors (gold counts as any)`);
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

/** Per player, per contest label: { rounds, v } from every round-end line in the log. */
export function contestRounds(state) {
  const out = state.players.map(() => ({}));
  for (const line of state.log) {
    const r = isRoundEnd(line) ? parseRoundEnd(state, line) : null;
    if (!r) continue;
    for (const row of r.rows) for (const id of row.winners) {
      const e = out[id][row.label] || (out[id][row.label] = { rounds: 0, v: 0 });
      e.rounds += 1; e.v += row.v;
    }
  }
  return out;
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
  // A contest won round after round is usually the real story.
  const swept = Object.entries(contestRounds(state)[w.id] || {}).sort((a, c) => c[1].rounds - a[1].rounds || c[1].v - a[1].v)[0];
  if (swept && swept[1].rounds >= 2 && b.contests >= Math.max(b.members, b.bought, b.effects, b.endGame) * 0.6) {
    const [full, { rounds, v }] = swept;
    const label = shortLabel(full);
    const res = (label.match(/^Most (gold|red|blue|green)$/i) || [])[1];
    const lead2 = res ? `hoarded ${res.toLowerCase()}` : `led ${label.toLowerCase()}`;
    const when = rounds === 3 ? 'all three rounds' : `${rounds} of 3 rounds`;
    return `${lead}: ${lead2}, winning ${label} ${when} (+${v}).`;
  }
  if (top === 'endGame' && b.parts.length) {
    const best = b.parts.map(s => { const m = s.match(/^(.*) \+(\d+)$/); return m ? { name: m[1], n: Number(m[2]) } : null; }).filter(Boolean).sort((a, c) => c.n - a.n)[0];
    return `${lead}: ${best.name} turned the endgame into ${best.n} followers.`;
  }
  if (top === 'contests') {
    const per = contestWins(state)[w.id];
    const most = Object.entries(per).sort((a, c) => c[1] - a[1])[0];
    return most
      ? `${lead}: ${b.contests} followers from ring contests, ${most[1]} of them for ${shortLabel(most[0]).toLowerCase()}.`
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
  const out = [{ title: 'Setup', lines: [], start: 0 }];
  state.log.forEach((line, i) => {
    const m = line.match(/^Round (\S+) begins\./);
    if (m) out.push({ title: `Round ${m[1]}`, lines: [], start: i });
    out[out.length - 1].lines.push(line);
  });
  return out.filter(s => s.lines.length);
}

// ---------- live contest standings (display only, using each quadrant's own scoring rule) ----------
function scoringCtx(state) {
  return {
    state,
    memberCount: p => memberCount(state, p),
    countMembersOfColor: (p, q) => countMembersOfColor(state, p, q),
    followers: p => engineFollowers(state, p),
    rivals: p => state.players.filter(o => o !== p),
    player: id => state.players[id],
    quadrant,
  };
}
/**
 * For each quadrant: { qid, label, rows:[{ id, score, shown }] sorted best first, leaders:[ids], margin }.
 * `shown` is the number people see; a rule may fold a tiebreak into its score (Most members adds red members
 * as a fraction of 1000), so scores of 1000 and up show their whole part.
 */
export function standings(state) {
  const ctx = scoringCtx(state);
  return state.quadrants.map(qid => {
    const q = quadrant(qid);
    const rows = state.players.map(p => {
      let score = 0;
      try { score = q.scoring.score(ctx, p); } catch { score = 0; }
      return { id: p.id, score, shown: score >= 1000 ? Math.floor(score / 1000) : score };
    }).sort((a, b) => b.score - a.score);
    const top = rows[0] ? rows[0].score : 0;
    const leaders = top > 0 ? rows.filter(r => r.score === top).map(r => r.id) : [];
    const next = rows.find(r => r.score < top);
    const margin = leaders.length === 1 && next ? rows[0].shown - next.shown : 0;
    return { qid, label: q.scoring.label, rows, leaders, margin, top };
  });
}

/** "P2 8 · P3 8 · you 1": the top few, by name ("you" for meId). */
export function standingLine(state, st, meId, max = 3) {
  return st.rows.slice(0, max).map(r => `${r.id === meId ? 'you' : state.players[r.id].name} ${r.shown}`).join(' · ');
}

// ---------- the round-end moment ----------
/**
 * The table exactly when the round was scored: the move that ended the round replayed onto the state before it,
 * stopping right after scoring (before the next round's start effects and reset board). Display only.
 * Returns null if it can't be reconstructed.
 */
export function scoringSnapshot(before, after) {
  if (!before || !before.pending || !after) return null;
  const cut = before.queue.findIndex(t => t.t === 'endRound');
  if (cut < 0) return null;
  const target = JSON.stringify(after.log.slice(-6));
  for (const o of before.pending.options) {
    const move = { player: before.pending.player, option: o.id };
    let full;
    try { full = applyMove(before, move); } catch { continue; }
    if (JSON.stringify(full.log.slice(-6)) !== target || full.round !== after.round) continue;
    const trimmed = { ...before, queue: before.queue.slice(0, cut + 1) };
    try { return applyMove(trimmed, move); } catch { return null; }
  }
  return null;
}

/** Where a player's followers came from during a round: { contests, members, bought, effects }. */
export function roundGains(start, end, p, contests) {
  const was = start.players[p.id];
  const memF = st => engineFollowers(st, st.players[p.id]) - 1 - st.players[p.id].bonus;
  const members = memF(end) - memF(start);
  const roundLines = newLogLines(start, end);
  const re = new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} bought (\\d+) followers?\\b`);
  const bought = roundLines.reduce((s, l) => { const m = l.match(re); return s + (m ? Number(m[1]) : 0); }, 0);
  const total = engineFollowers(end, end.players[p.id]) - engineFollowers(start, was);
  return { contests, members, bought, effects: total - contests - members - bought, total };
}

// ---------- log lines, said plainly ----------
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The action the actor took most recently before line i ("P1 took Joint Venture (Gold).") */
function lastAction(log, i, actor) {
  const re = new RegExp(`^${esc(actor)} took (.+?) \\(\\w+\\)\\.$`);
  for (let k = i - 1; k >= 0 && k >= i - 12; k--) { const m = log[k].match(re); if (m) return m[1]; }
  return null;
}
/**
 * Rewrites log lines whose wording teaches the wrong rule. Gifts in the engine create resources for the receiver
 * (nobody loses them), so "P1 gave 1 gold to P2" reads as "P2 gains 1 gold (P1's Joint Venture)".
 * Returns { text, gift? } where gift = { to, n, color, text } for a receiver's pill.
 */
export function explainLine(log, i) {
  const line = log[i];
  let m = line.match(/^(.+?) gave (\d+) (\w+) to (.+?)\.$/) || null;
  if (m) {
    const [, from, n, color, to] = m;
    const why = lastAction(log, i, from);
    const src = why ? `${from}'s ${why}` : from;
    return { text: `${to} gains ${n} ${color} (${src}).`, gift: { to, n: Number(n), color, text: `+${n} ${color} (${src})` } };
  }
  m = line.match(/^(.+?) gave (.+?) (\d+) (\w+)\.$/);
  if (m) {
    const [, from, to, n, color] = m;
    const why = lastAction(log, i, from);
    const src = why ? `${from}'s ${why}` : from;
    return { text: `${to} gains ${n} ${color} (${src}).`, gift: { to, n: Number(n), color, text: `+${n} ${color} (${src})` } };
  }
  m = line.match(/^(.+?)'s (\w[\w ]*?) gives (.+?) (\d+) (\w+)\.$/);
  if (m) {
    const [, from, card, to, n, color] = m;
    return { text: `${to} gains ${n} ${color} (${from}'s ${card}).`, gift: { to, n: Number(n), color, text: `+${n} ${color} (${from}'s ${card})` } };
  }
  m = line.match(/^(.+?) took (\d+) (\w+) and gave everyone else (\d+) (\w+)\.$/);
  if (m) return { text: `${m[1]} gains ${m[2]} ${m[3]}; everyone else gains ${m[4]} ${m[5]}.` };
  m = line.match(/^(.+?)'s Hustler works the (\w+) spaces\.$/);
  if (m) return { text: `${m[1]}'s Hustler: +1 gold each time ${m[1]} takes a ${m[2]} space.` };
  return { text: line };
}
export const plainLine = (log, i) => explainLine(log, i).text;

/** The tiebreak folded into a "most members"-style score ("(red members break ties)" -> "red"), if any. */
export function tiebreakWord(label) {
  const m = label.match(/\((\w+) members? breaks? ties\)/i);
  return m ? m[1] : null;
}
/** For tied shown counts, the tiebreak amount to show next to the name ("2 red"), else null. */
export function tiebreakNote(st, row) {
  const word = tiebreakWord(st.label);
  if (!word || row.score < 1000) return null;
  const tied = st.rows.some(r => r !== row && r.shown === row.shown);
  return tied ? `${row.score - row.shown * 1000} ${word}` : null;
}

/** The latest placement by someone other than `mine`, read from the log and the board (survives a reload). */
export function latestRivalMove(state, mine) {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const m = state.log[i].match(/^(.+?) took (.+?) \((\w+)\)\.$/);
    if (!m) { if (/^Round \S+ begins\./.test(state.log[i])) return null; continue; }
    const p = state.players.find(x => x.name === m[1]);
    if (!p || mine.includes(p.id)) continue;
    const q = state.quadrants.findIndex(id => quadrant(id).name === m[3]);
    if (q < 0) continue;
    const i2 = quadrant(state.quadrants[q]).actions.findIndex(a => a.name === m[2]);
    const key = `${q}-${i2}`;
    if (state.slots[key] === p.id) return { key, pid: p.id, n: i };
  }
  return null;
}
