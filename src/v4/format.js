// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE, followers as engineFollowers, applyMove, contestTable, roundWorkers, WORKERS, allQuadrantIds } from '../engine/v4/index.js';
import { contextFor } from '../engine/v4/core.js';

// Seat colors: muted (bone, slate teal, ochre-terracotta, dusty plum) for a warm table, each ΔE ≥ 30 (CIE76) from all nine
// resource colors and readable on dark wood (measured in src/test/v4/ui/colors.test.js). Identity never rests on
// color alone: every seat also has a sigil (circle, triangle, square, star) on its figures and name dots.
export const PLAYER_COLORS = ['#c9b48a', '#1b9393', '#ba7330', '#b88fc7'];
export const SEAT_SIGILS = ['circle', 'triangle', 'square', 'star'];
export const seatSigil = id => SEAT_SIGILS[id % SEAT_SIGILS.length];
/** The emoji a player picked (shown on their leader's robe), or null: then the seat's sigil stands in. */
export const seatEmoji = (state, id) => (state && state.players[id] && state.players[id].emoji) || null;
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
    const extra = c.copy ? ` → ${defById(c.copy).name}` : c.color ? ` · ${quadrant(c.color).name} spaces` : ''; // "Hustler · Gold spaces" (it read as a color tag)
    const key = [d.id, c.used ? 'u' : '', c.on === false ? 'off' : '', c.copy || '', c.color || ''].join('|');
    if (!out.has(key)) out.set(key, { key, uids: [], def: d, card: c, label: d.name + extra, count: 0 });
    const g = out.get(key);
    g.uids.push(uid);
    g.count += 1;
  }
  return [...out.values()];
}

/** A member's printed cost as parts. Pass the table's resources: a colored part whose color isn't on the table
 *  is paid in any colors (the engine's rule), so it reads as "any" instead of a color nobody can hold. */
export function costParts(def, resources = null) {
  const parts = [];
  // the colored part is paid in the sphere's resource (module id 'thieves' pays in magenta)
  let color = def.quadrant;
  try { color = quadrant(def.quadrant).resource; } catch { /* a bare color */ }
  if (resources && !resources.includes(color)) return (def.s || 0) + (def.w || 0) ? [{ color: 'any', n: (def.s || 0) + (def.w || 0) }] : [];
  if (def.s) parts.push({ color, n: def.s });
  if (def.w) parts.push({ color: 'any', n: def.w });
  return parts;
}

export const tierCostText = t => (t.colors > 1 ? `${t.cost}, ${t.colors}+ colors` : `${t.cost} of anything`);
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
    case 'place': {
      // back-to-back snake turn: say so
      let again = false;
      for (let i = state.log.length - 1; i >= 0; i--) {
        const l = state.log[i];
        if (/^Round \S+ begins\./.test(l)) break;
        const m = l.match(/^(.+?) took .+ \(\w+\)\.$/);
        if (m) { again = m[1] === name; break; }
      }
      if (mine && again) return { who: p, text: 'Your turn again (snake order) — place a worker' };
    }
    // falls through
    case 'place-plain':
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
      return mine ? { who: p, text: pend.prompt } : { who: p, text: `${name} is choosing` };
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

/**
 * Each round's contests as the engine decided them: [{ round, prize, results:[contest] }] (state.contests, which
 * endRound writes). Saves from before the record existed fall back to the round-end lines still in the log.
 */
export function contestHistory(state) {
  if (Array.isArray(state.contests)) return state.contests;
  const out = [];
  for (const line of state.log) {
    const r = isRoundEnd(line) ? parseRoundEnd(state, line) : null;
    if (!r) continue;
    const round = ['I', 'II', 'III'].indexOf(r.round) + 1;
    out.push({ round, prize: RING_VALUE[round - 1], results: r.rows.map(row => ({ qid: row.qid, label: row.label, rule: shortLabel(row.label), winners: row.winners, prize: row.v, rows: [] })) });
  }
  return out;
}

/** Contest wins per player per contest label: followers won there over the game. */
export function contestWins(state) {
  const wins = state.players.map(() => ({}));
  for (const h of contestHistory(state)) for (const c of h.results) for (const id of c.winners) wins[id][c.label] = (wins[id][c.label] || 0) + (c.prize ?? h.prize);
  return wins;
}

/** Per player, per contest label: { rounds, v, qid, rule } over the game (the engine's record). */
export function contestRounds(state) {
  const out = state.players.map(() => ({}));
  for (const h of contestHistory(state)) for (const c of h.results) for (const id of c.winners) {
    const e = out[id][c.label] || (out[id][c.label] = { rounds: 0, v: 0, qid: c.qid, rule: c.rule || shortLabel(c.label), list: [] });
    e.rounds += 1; e.v += c.prize ?? h.prize; e.list.push(roman(h.round));
  }
  return out;
}

/** "Most Magenta members: +10 over the game (rounds I, III)" for each contest a player won, biggest first. */
export function contestLines(state, p) {
  return Object.values(contestRounds(state)[p.id] || {}).sort((a, b) => b.v - a.v)
    .map(e => ({ ...e, text: `${e.rule}: +${e.v} over the game (round${e.rounds > 1 ? 's' : ''} ${e.list.join(', ')})` }));
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
  // Name the biggest real sources, in the words the results table uses.
  const n = w.members.reduce((s2, u) => s2 + cardDef(state, u).n, 0);
  const swept = Object.entries(contestRounds(state)[w.id] || {}).sort((a2, c) => c[1].rounds - a2[1].rounds || c[1].v - a2[1].v)[0];
  // "P4 won by 17, mostly by holding Most members all three rounds (+20)." Biggest source first, in plain words.
  const say = {
    members: v => `by recruiting ${n} members (+${v})`,
    bought: v => `by buying followers (+${v})`,
    effects: v => `from members' abilities (+${v})`,
    endGame: v => `from end-game bonuses (+${v})`,
    // the sweep names its own followers, never the contests' total (Most Magenta members gave +10 of +18)
    contests: v => (swept && swept[1].rounds >= 2
      ? (swept[1].v === v
        ? `by holding ${swept[1].rule} ${swept[1].rounds === 3 ? 'all three rounds' : 'two rounds of three'} (+${v})`
        : `from contests (+${v}; ${swept[1].rule} ${swept[1].rounds === 3 ? 'all three rounds' : 'two rounds of three'}, +${swept[1].v})`)
      : `from contests (+${v})`),
  };
  const top = [['members', b.members], ['bought', b.bought], ['effects', b.effects], ['endGame', b.endGame], ['contests', b.contests]]
    .filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).slice(0, 2);
  if (!top.length) return `${lead}.`;
  return `${lead}, mostly ${say[top[0][0]](top[0][1])}${top[1] ? `, then ${say[top[1][0]](top[1][1])}` : ''}.`;
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

// ---------- contest standings: the engine's contestTable, the same function that scores the round ----------
/**
 * One contest for display: { qid, label, rule, counts, tiebreak, prize, rows:[{ id, score, shown, tiebreak }],
 * leaders:[ids], margin, top }. shown is the rule's count (never a re-derived number); leaders are the ids that
 * would take the prize if the round ended now (none when the best score is 0).
 */
export function toStanding(c) {
  const rows = c.rows.map(r => ({ id: r.player, score: r.score, shown: r.count, tiebreak: r.tiebreak }));
  const leaders = [...c.winners];
  const lead = rows.find(r => leaders.includes(r.id));
  const next = rows.find(r => !leaders.includes(r.id));
  const margin = leaders.length === 1 && next ? lead.shown - next.shown : 0;
  return { qid: c.qid, label: c.label, rule: c.rule || shortLabel(c.label), counts: c.counts || null, tiebreak: c.tiebreak || null, prize: c.prize, rows, leaders, margin, top: rows[0] ? rows[0].score : 0 };
}
/** Every quadrant's contest if the round ended now, from the engine. */
export function standings(state) {
  let table;
  try { table = contestTable(state); } catch { return []; }
  return table.map(toStanding);
}
/** A round's contests as recorded when they were scored (state.contests), or null for an old save. */
export function scoredStandings(state, round) {
  const h = Array.isArray(state.contests) ? state.contests.find(x => x.round === round) : null;
  return h ? h.results.map(toStanding) : null;
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
  m = line.match(/^(.+?)'s (.+?): (\w+) gain (\d+) → (\d+)\.$/);
  if (m) {
    const [, who, card, color, a, b2] = m;
    const why = lastAction(log, i, who);
    const extra = Number(b2) - Number(a);
    return { text: line, gift: { to: who, n: Number(b2), color, text: `+${a} ${why || color}, ${extra >= 0 ? '+' : '−'}${Math.abs(extra)} ${card}` } };
  }
  m = line.match(/^(.+?)'s Hustler works the (\w+) spaces\.$/);
  if (m) return { text: `${m[1]}'s Hustler: +1 gold each time ${m[1]} takes a ${m[2]} space.` };
  return { text: line };
}
export const plainLine = (log, i) => explainLine(log, i).text;

/** The unit a contest's tiebreak counts ("red members", "purple"), from the engine's scoring, or null. */
export function tiebreakWord(label) {
  for (const id of allQuadrantIds()) {
    const q = quadrant(id);
    if (q.scoring.label === label) return q.scoring.tiebreak ? q.scoring.tiebreak.unit : null;
  }
  return null;
}
/** For a row tied on the shown count, its tiebreak ("2 red members"), else null. */
export function tiebreakNote(st, row) {
  if (!st.tiebreak || row.tiebreak == null) return null;
  const tied = st.rows.some(r => r !== row && r.shown === row.shown);
  return tied ? `${row.tiebreak} ${st.tiebreak.unit}` : null;
}

/** "5 workers each", or "5 workers each · Bo 6" when someone's members change their count this round (Extra Hand). */
export function workersNote(state) {
  if (!state.round) return '';
  const base = WORKERS[state.round - 1];
  const odd = state.players.filter(p => roundWorkers(state, p) !== base);
  return `${base} workers each${odd.length ? ` · ${odd.map(p => `${p.name} ${roundWorkers(state, p)}`).join(', ')}` : ''}`;
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

/**
 * Placements this round since your last one, oldest first: [{ key, pid, action }]. Your own latest placement is
 * included when it's the newest thing on the board, so the strip always says what just happened.
 */
export function movesSinceYourTurn(state, mine) {
  const out = [];
  for (let i = state.log.length - 1; i >= 0; i--) {
    const line = state.log[i];
    if (/^Round \S+ begins\./.test(line)) break;
    const m = line.match(/^(.+?) took (.+?) \((\w+)\)\.$/);
    if (!m) continue;
    const p = state.players.find(x => x.name === m[1]);
    if (!p) continue;
    const q = state.quadrants.findIndex(id => quadrant(id).name === m[3]);
    if (q < 0) continue;
    const i2 = quadrant(state.quadrants[q]).actions.findIndex(a => a.name === m[2]);
    const key = `${q}-${i2}`;
    if (state.slots[key] !== p.id) continue;
    if (mine.includes(p.id)) { if (!out.length) out.push({ key, pid: p.id, action: m[2], mine: true }); break; }
    out.push({ key, pid: p.id, action: m[2] });
    if (out.length >= 6) break;
  }
  return out.reverse();
}

/**
 * Each player's end-game bonuses if the game ended now: { [pid]: { total, parts:[{ name, n }] } }.
 * Runs the members' own onGameEnd scoring on a copy of the state (display only).
 */
export function projectedEndGame(state) {
  const out = {};
  let copy;
  try { copy = structuredClone(state); } catch { return out; }
  const ctx = contextFor(copy);
  for (const p of copy.players) {
    const parts = [];
    for (const uid of p.members) {
      const card = copy.cards[uid];
      const defs = [defById(card.def)];
      if (card.copy) defs.push(defById(card.copy));
      for (const d of defs) {
        if (!d.onGameEnd) continue;
        let n = 0;
        try { n = d.onGameEnd(ctx, p, ctx.card(uid)) || 0; } catch { n = 0; }
        if (n) parts.push({ name: d.name, n });
      }
    }
    out[p.id] = { total: parts.reduce((s, x) => s + x.n, 0), parts };
  }
  return out;
}

/**
 * One turn told in plain words, for the line by the board after anyone's turn (Cory: "too hard to tell what's going
 * on"). `start` is the state when `actor`'s turn began, `end` when it passed on. Everything is read off the two
 * states and the log between them, so it's true whatever the action or member did:
 *   "P3 took Pickpocket · +1 gold +1 green · from you 1 gold · from P4 1 green · recruited Mob (paid 4 red) · +1 follower"
 * Returns { text, touched } (touched: the other players whose resources changed), or null if nothing happened.
 * `me` is the person at this device (named "you"), or null.
 */
export function turnStory(start, end, actor, me = null, mid = null) {
  if (!start || !end || actor == null || !end.players[actor]) return null;
  const nm = id => (id === me ? 'you' : end.players[id].name);
  const who = actor === me ? 'You' : end.players[actor].name;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lines = newLogLines(start, end);
  const took = lines.map(l => l.match(new RegExp(`^${esc(end.players[actor].name)} took (.+) \\((\\w+)\\)\\.$`))).find(Boolean);
  const res = end.resources;
  const delta = (id, a = start, b = end) => res.map(r => [r, (b.players[id].res[r] || 0) - (a.players[id].res[r] || 0)]).filter(([, d]) => d);
  const signed = list => list.map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`).join(' ');
  const plain = list => list.map(([r, d]) => `${Math.abs(d)} ${r}`).join(', ');
  const parts = [];
  // with `mid` (the state when the turn reached its buy), what the action gave and what the buy cost are told apart
  const mine = delta(actor, start, mid || end);
  if (mine.length) parts.push(signed(mine));
  const touched = [];
  for (const p of end.players) {
    if (p.id === actor) continue;
    const d = delta(p.id);
    if (!d.length) continue;
    touched.push(p.id);
    const lost = d.filter(([, x]) => x < 0), got = d.filter(([, x]) => x > 0);
    if (lost.length) parts.push(`from ${nm(p.id)} ${plain(lost)}`);
    if (got.length) parts.push(`${nm(p.id)} ${signed(got)}`);
  }
  const before = new Set(start.players[actor].members);
  const recruits = end.players[actor].members.filter(u => !before.has(u)).map(u => (end.cards[u] ? cardDef(end, u).name : null)).filter(Boolean);
  const paid = mid ? delta(actor, mid, end).filter(([, d]) => d < 0) : [];
  if (recruits.length) parts.push(`recruited ${recruits.join(', ')}${paid.length ? ` (paid ${plain(paid)})` : ''}`);
  else if (paid.length) parts.push(`paid ${plain(paid)}`);
  const lostMembers = start.players[actor].members.length + recruits.length - end.players[actor].members.length;
  if (lostMembers > 0) parts.push(`${lostMembers} member${lostMembers > 1 ? 's' : ''} gone`);
  const f = engineFollowers(end, end.players[actor]) - engineFollowers(start, start.players[actor]);
  if (f) parts.push(`${f > 0 ? '+' : '−'}${Math.abs(f)} follower${Math.abs(f) === 1 ? '' : 's'}`);
  if (!took && !parts.length) return null;
  const head = took ? `${who} took ${took[1]}` : `${who}`;
  return { text: [head, ...parts].join(' · '), touched, actor };
}
