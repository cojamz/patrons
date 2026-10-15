// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE, memberCount, followers as engineFollowers, applyMove, contestTable, roundWorkers, WORKERS, allQuadrantIds, turnRail } from '../engine/v4/index.js';
import { contextFor } from '../engine/v4/core.js';
import { defaultEmoji } from './art/emojis.js';

// Seat colors are an accent now (identity is the player's emoji on their leader, Cory 2026-10-14): ochre, teal,
// terracotta-rose, lavender-plum, each ΔE ≥ 30 (CIE76) from every resource color on screen (the Lamplit inks) and
// readable on walnut, measured in src/test/v4/ui/colors.test.js.
export const PLAYER_COLORS = ['#9c845a', '#48c8d4', '#fca2a8', '#eac0fc'];
export const SEAT_SIGILS = ['circle', 'triangle', 'square', 'star'];
export const seatSigil = id => SEAT_SIGILS[id % SEAT_SIGILS.length];
/** The emoji a player picked (their minions, and the emblem on their leader), or the seat's default. */
export const seatEmoji = (state, id) => (state && state.players[id] && state.players[id].emoji) || defaultEmoji(id);
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
  // members you can use right now (any time on your turn, Cory 2026-10-15): named in the line under the headline
  const usable = pend.options.filter(o => o.kind === 'use').map(o => o.label.replace(/^Use /, ''));
  const use = usable.length > 1 ? `${usable.slice(0, -1).join(', ')} or ${usable.at(-1)}` : usable[0];
  switch (pend.kind) {
    case 'setup': {
      const k = (pend.prompt.match(/\((\d) of 2\)/) || [])[1] || '';
      return mine
        ? { who: p, text: `Pick a starting resource${k ? ` (${k} of 2)` : ''}` }
        : { who: p, text: `${name} is picking a starting resource` };
    }
    case 'place': {
      // a second placement in a row says why: the snake turning round on you is your turn again, not a bonus;
      // an extra turn names the card or space that gave it (RC1 panel: "Extra turn" at the turnaround read as a bonus)
      const t = currentTurn(state);
      if (t && t.again) {
        const or = use ? `…or use ${use} first` : null;
        if (t.kind === 'snake') {
          return mine
            ? { who: p, lead: 'Your turn again (snake order) — ', text: 'place a minion', sub: or || 'Snake order: whoever ends a pass starts the next, so you place twice in a row' }
            : { who: p, text: `${name} again (snake order)` };
        }
        const why = t.why ? ` (${t.why})` : '';
        const what = t.kind === 'hand' ? 'Extra minion' : 'Extra turn';
        return mine
          ? { who: p, lead: `${what}${why}: `, text: 'place one more minion', keepCase: true, ...(or ? { sub: or } : {}) }
          : { who: p, text: `${name}: ${what.toLowerCase()}${why}` };
      }
    }
    // falls through
    case 'place-plain':
      return mine
        ? { who: p, text: `Place a minion on a glowing space`, ...(use ? { sub: `…or use ${use} first` } : {}) }
        : { who: p, text: `${name} is placing a minion` };
    // the headline is a verb phrase that fits one line at 1270×700; the details go in the line under it (sub)
    case 'buy':
      return mine
        ? { who: p, text: 'Recruit or buy', sub: `Recruit a member or buy followers, or pass${use ? `; or use ${use}` : ''}` }
        : { who: p, text: `${name} is shopping` };
    case 'pay':
      return mine ? { who: p, text: 'Choose how to pay' } : { who: p, text: `${name} is paying` };
    case 'choose': {
      if (!mine) return { who: p, text: `${name} is choosing` };
      // the question itself is in the note on the board; the headline names what's asking ("Kickback: choose below")
      const asker = (String(pend.prompt || '').match(/^([^:]{2,28}):\s/) || [])[1];
      const short = String(pend.prompt || '').length <= 36;
      return asker && asker !== name
        // options that all point at seats are answered on the cults (the seat selector, game/seatPick.js)
        ? { who: p, text: `${asker}: ${pend.options.some(o => o.target) ? 'pick on the board' : 'choose below'}`, keepCase: true }
        : short ? { who: p, text: pend.prompt } : { who: p, text: 'Choose below' };
    }
    default:
      return { who: p, text: pend.prompt };
  }
}

// ---------- this round's turns: the snake, extra minions, extra turns ----------
const ROUND_LINE = /^Round \S+ (begins|ends)\./;
/** Where this round's log starts (just after the last round-end line, so round-start hooks like Late Riser count). */
function roundLogStart(log) {
  for (let i = log.length - 1; i >= 0; i--) if (/^Round \S+ ends\./.test(log[i])) return i + 1;
  return 0;
}
/** The cards and spaces that gave each player extra turns this round, in order: { [pid]: ['Night Owl', …] }. */
function extraGrants(state) {
  const out = {}, log = state.log;
  const byName = n => state.players.find(p => p.name === n);
  const add = (n, why, k) => { const p = byName(n); if (p) for (let j = 0; j < k; j++) (out[p.id] = out[p.id] || []).push(why); };
  for (let i = roundLogStart(log); i < log.length; i++) {
    const l = log[i];
    let m = l.match(/^(.+?)'s (.+?): (.+?) takes (an extra turn|(\d+) extra turns)\.$/);
    if (m && m[1] === m[3]) { add(m[1], m[2], m[5] ? Number(m[5]) : 1); continue; }
    m = l.match(/^(.+?)'s (Late Riser): an extra turn first\.$/);
    if (m) { add(m[1], m[2], 1); continue; }
    m = l.match(/^(.+?) takes (an extra turn|(\d+) extra turns)\.$/);
    if (!m) continue;
    // paid for just before: "P1's Taskmaster: pays 5 purple…", "P1 pays 4 purple for Overtime.", "P1 spends 8 purple on Crunch Time."
    const prev = log[i - 1] || '', who = esc(m[1]);
    const why = (prev.match(new RegExp(`^${who}'s (.+?): pays `)) || prev.match(new RegExp(`^${who} pays \\d+ purple for (.+?)(?: \\(|\\.$)`))
      || prev.match(new RegExp(`^${who} spends \\d+ purple on (.+?)(?: \\(|\\.$)`)) || [])[1] || lastAction(log, i, m[1]);
    add(m[1], why, m[3] ? Number(m[3]) : 1);
  }
  return out;
}
/**
 * This round's turns in order, from the engine's turn record and queue: [{ pid, kind, why, at }] where kind is
 * 'snake' (the round's order), 'hand' (an extra minion from a member, after the snake) or 'extra' (an extra turn a
 * card or space gave), why names that card or space, and at is 'done' | 'now' | 'later'. Every turn is one placement.
 */
export function turnSequence(state) {
  if (!(state.round >= 1) || state.over) return [];
  const r = turnRail(state);
  const seq = [...r.done.map(pid => ({ pid, at: 'done' })), ...(r.current != null ? [{ pid: r.current, at: 'now' }] : []), ...r.next.map(pid => ({ pid, at: 'later' }))];
  const order = state.order || [];
  const snake = (WORKERS[state.round - 1] || 0) * state.players.length;
  // the round's order is the sequence with the extra turns taken out: match it in order, and what's left over is extra
  let j = 0;
  for (const t of seq) {
    if (j < order.length && order[j] === t.pid) { t.kind = j < snake ? 'snake' : 'hand'; j++; } else t.kind = 'extra';
  }
  const grants = extraGrants(state), used = {};
  const begins = state.log.slice(roundLogStart(state.log)).find(l => /^Round \S+ begins\./.test(l)) || '';
  for (const t of seq) {
    if (t.kind === 'extra') { const k = used[t.pid] = (used[t.pid] || 0) + 1; t.why = (grants[t.pid] || [])[k - 1] || null; }
    else if (t.kind === 'hand') { const nm = esc(state.players[t.pid].name); t.why = (begins.match(new RegExp(`${nm}'s (.+?): \\+\\d+ minions?\\.`)) || [])[1] || null; }
    else t.why = null;
  }
  return seq;
}
/** The turn being played (or about to be): { pid, kind, why, again } — again when the same player also had the turn before. */
export function currentTurn(state) {
  const seq = turnSequence(state);
  const i = seq.findIndex(t => t.at !== 'done');
  if (i < 0) return null;
  return { ...seq[i], again: i > 0 && seq[i - 1].pid === seq[i].pid };
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
/** The action the actor took most recently before line i ("P1 took Kickback (Gold).") */
function lastAction(log, i, actor) {
  const re = new RegExp(`^${esc(actor)} took (.+?) \\(\\w+\\)\\.$`);
  for (let k = i - 1; k >= 0 && k >= i - 12; k--) { const m = log[k].match(re); if (m) return m[1]; }
  return null;
}
/**
 * Rewrites log lines whose wording teaches the wrong rule. Gifts in the engine create resources for the receiver
 * (nobody loses them), so "P1 gave 1 gold to P2" reads as "P2 gains 1 gold (P1's Kickback)".
 * Returns { text, gift? } where gift = { to, n, color, text } for a receiver's pill.
 */
export function explainLine(log, i) {
  const line = log[i];
  // first: "P4 took 2 magenta and gave everyone else 1 magenta." (Goody Bags), which the "gave" forms below would misread
  let m = line.match(/^(.+?) took (\d+) (\w+) and gave everyone else (\d+) (\w+)\.$/);
  if (m) return { text: `${m[1]} gains ${m[2]} ${m[3]}; everyone else gains ${m[4]} ${m[5]}.` };
  m = line.match(/^(.+?) gave (\d+) (\w+) to (.+?)\.$/) || null;
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

/** "5 minions each", or "5 minions each · Bo 6" when someone's members change their count this round (Extra Hand). */
export function workersNote(state) {
  if (!state.round) return '';
  const base = WORKERS[state.round - 1];
  const odd = state.players.filter(p => roundWorkers(state, p) !== base);
  return `${base} minions each${odd.length ? ` · ${odd.map(p => `${p.name} ${roundWorkers(state, p)}`).join(', ')}` : ''}`;
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
 * A member's trace line, parsed: "Di's Tax Collector: +1 gold." (the owner's own change) or "Bo +1 silver (Ana's
 * Retinue)." (another player's) → { owner, target, card, res: { color: n }, followers, discount }, else null.
 */
export function traceLine(line, players, resources) {
  const parts = s => {
    const res = {};
    let followers = 0, discount = 0;
    for (const tok of s.split(', ')) {
      let m = tok.match(/^([+−-])(\d+) (\w+)$/);
      if (m) {
        const n = Number(m[2]) * (m[1] === '+' ? 1 : -1);
        if (/^followers?$/.test(m[3])) followers += n;
        else if (resources.includes(m[3])) res[m[3]] = (res[m[3]] || 0) + n;
        else return null;
        continue;
      }
      m = tok.match(/^next member costs (\d+) less$/);
      if (m) { discount += Number(m[1]); continue; }
      return null;
    }
    return { res, followers, discount };
  };
  const body = line.replace(/\.$/, '');
  for (const o of players) {
    if (!body.startsWith(`${o.name}'s `)) continue;
    const rest = body.slice(o.name.length + 3), c = rest.indexOf(': ');
    const got = c > 0 ? parts(rest.slice(c + 2)) : null;
    if (got) return { owner: o.id, target: o.id, card: rest.slice(0, c), ...got };
  }
  const m = body.match(/^(.+) \((.+?)'s (.+?)\)$/);
  const owner = m && players.find(p => p.name === m[2]);
  if (owner) for (const t of players) {
    if (!m[1].startsWith(`${t.name} `)) continue;
    const got = parts(m[1].slice(t.name.length + 1));
    if (got) return { owner: owner.id, target: t.id, card: m[3], ...got };
  }
  return null;
}

/**
 * One placement told in plain words, for the turn card by the acting cult (Cory: "too hard to tell what's going on").
 * A turn is one placement and its buy, so a snake turnaround or an extra turn gets a card of its own (RC1 panel: the
 * card netted a second placement's gains against the first one's payment, under the first one's name).
 * `start` is the state when the turn began, `mid` when it reached its buy (or null), `end` when it passed on (or now).
 * Amounts are gross: what the space gave, what was paid, and every member that fired on a line of its own.
 *   "Bo took Collect Debts · +3 gold · from you 3 gold · Tax Collector: you +1 gold · recruited Banker (paid 6 gold) · +1 follower"
 * Returns { text, head, lines, space, actor, touched, short, hit } or null if nothing happened.
 * `me` is the person at this device (named "you"), or null. short is the one line for the "since your last turn"
 * strip; hit says what it took from you, if anything.
 */
export function turnStory(start, end, actor, me = null, mid = null) {
  if (!start || !end || actor == null || !end.players[actor]) return null;
  const P = end.players, A = P[actor], res = end.resources;
  const nm = id => (id === me ? 'you' : P[id].name);
  const whose = id => (id === me ? 'your' : `${P[id].name}'s`);
  const who = actor === me ? 'You' : A.name;
  const youName = s => (me != null ? s.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${esc(P[me].name)}'s(?![\\p{L}\\p{N}])`, 'gu'), '$1your') : s);
  let lines = newLogLines(start, end);
  const cut = lines.findIndex(l => ROUND_LINE.test(l) || /^Game over\./.test(l));
  if (cut >= 0) lines = lines.slice(0, cut);
  const nAct = mid ? Math.min(lines.length, newLogLines(start, mid).length) : lines.length;
  const seg = [lines.slice(0, nAct), lines.slice(nAct)];
  const states = [[start, mid || end], [mid || end, end]];
  const an = esc(A.name);
  const placeRe = new RegExp(`^${an} (?:took (.+?)|joined (.+?) on (.+?)) \\((\\w+)\\)\\.$`);
  const place = seg[0].map(l => l.match(placeRe)).find(Boolean) || null;
  const space = place ? place[1] || place[3] : null;
  const joined = place && place[2] ? P.find(p => p.name === place[2]) : null;

  const signed = list => list.map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`).join(' ');
  const plain = list => list.map(([r, d]) => `${Math.abs(d)} ${r}`).join(', ');
  const fword = n => `${Math.abs(n)} follower${Math.abs(n) === 1 ? '' : 's'}`;
  const out = [];
  const touched = new Set();
  const tracedF = P.map(() => 0);
  let gain = '', hit = '';
  seg.forEach((ls, k) => {
    const [a, b] = states[k];
    // what members did, on lines of their own; their amounts come off the gross so nothing is counted twice
    const traced = P.map(() => ({}));
    const said = [];
    for (const l of ls) {
      const t = traceLine(l, P, res);
      if (t) {
        for (const r in t.res) traced[t.target][r] = (traced[t.target][r] || 0) + t.res[r];
        tracedF[t.target] += t.followers;
        const bits = [...Object.entries(t.res).filter(([, d]) => d).map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`),
          ...(t.followers ? [`${t.followers > 0 ? '+' : '−'}${fword(t.followers)}`] : []), ...(t.discount ? [`next member costs ${t.discount} less`] : [])].join(', ');
        // "Treasurer: +3 gold" (the actor's own), "Tax Collector: Di +1 gold", "Ana's Retinue: Bo +1 silver"
        const card = t.owner === actor || t.owner === t.target ? t.card : `${whose(t.owner)} ${t.card}`;
        said.push(`${cap(card)}: ${t.target === actor && t.owner === actor ? '' : `${nm(t.target)} `}${bits}`);
        continue;
      }
      // a gain changed on its way in: "Underdog: gold 4 → 8", "Midas: 2 blue came as 2 gold"
      let m = l.match(/^(.+?)'s (.+?): (?:(\w+) gain (\d+) → (\d+)|(\d+) (\w+) comes as (\d+) (\w+))\.$/);
      const by = m && P.find(p => p.name === m[1]);
      if (by) {
        const card = by.id === actor ? m[2] : `${whose(by.id)} ${m[2]}`;
        said.push(`${cap(card)}: ${m[3] ? `${m[3]} ${m[4]} → ${m[5]}` : `${m[6]} ${m[7]} came as ${m[8]} ${m[9]}`}`);
        continue;
      }
      if (!l.startsWith(`${A.name} `) && !l.startsWith(`${A.name}'s `)) continue;
      const own = l.slice(A.name.length);
      if ((m = own.match(/^ uses (.+?)\.$/))) said.push(`used ${m[1]}`);
      else if ((m = own.match(/^ traded (.+)\.$/))) said.push(youName(`traded ${m[1]}`));
      else if ((m = own.match(/takes (an extra turn|(\d+) extra turns)\.$/))) said.push(m[2] ? `${m[2]} extra turns` : 'an extra turn');
      else if ((m = own.match(/^'s next member costs (\d+) less\.$/))) said.push(`next member costs ${m[1]} less`);
      else if ((m = own.match(/^ recruited (.+?)(?: from the pile with .+?)? \((.+)\)\.$/))) said.push(m[2] === 'free' ? `recruited ${m[1]} (free)` : `recruited ${m[1]} (paid ${m[2]})`);
      else if ((m = own.match(/^ bought (\d+) followers? \((.+)\)\.$/))) said.push(`bought ${fword(Number(m[1]))} (paid ${m[2]})`);
      else if ((m = own.match(/^ released (.+?) to the bottom of the pile, for (.+)\.$/))) {
        const back = ls.map(x => x.match(new RegExp(`^${an} takes (\\d+) (\\w+) from the release\\.$`))).filter(Boolean).map(x => `${x[1]} ${x[2]}`);
        said.push(`released ${m[1]} for ${back.length ? back.join(', ') : m[2]}`);
      } else if ((m = own.match(/^ switched (.+?) (on|off)\.$/))) said.push(`switched ${m[1]} ${m[2]}`);
    }
    const gross = id => res.map(r => [r, (b.players[id].res[r] || 0) - (a.players[id].res[r] || 0) - (traced[id][r] || 0)]).filter(([, d]) => d);
    // the action's own numbers (k 0); in the buy step the payment is told by its own line, so only rivals count
    if (k === 0) { const g = gross(actor); if (g.length) { gain = signed(g); out.push(gain); } }
    for (const p of P) {
      if (p.id === actor) continue;
      const d = gross(p.id);
      const lost = d.filter(([, x]) => x < 0), got = d.filter(([, x]) => x > 0);
      if (lost.length) {
        out.push(`from ${nm(p.id)} ${plain(lost)}`);
        if (p.id === me) hit = `took ${lost.map(([r, x]) => `${Math.abs(x)} of your ${r}`).join(', ')}`;
      }
      if (got.length) out.push(`${nm(p.id)} ${signed(got)}`);
    }
    out.push(...said);
  });
  for (const p of P) if (p.id !== actor && res.some(r => (end.players[p.id].res[r] || 0) !== (start.players[p.id].res[r] || 0))) touched.add(p.id);
  // a member of yours that left your cult this turn (a swap), or followers you lost, hit you too
  if (me != null && me !== actor) {
    const gone = start.players[me].members.filter(u => !end.players[me].members.includes(u));
    if (gone.length && !hit) hit = `took your ${gone.map(u => (end.cards[u] ? cardDef(end, u).name : 'member')).join(', ')}`;
  }
  // followers: what this turn changed (contest prizes are the round's, not the turn's)
  const fl = s => engineFollowers(s, s.players[actor]) - (s.players[actor].contest || 0);
  const f = fl(end) - fl(start);
  if (f) out.push(`${f > 0 ? '+' : '−'}${fword(f)}`);
  // a rival's followers that moved and no member line explains (a follower drawn from them)
  for (const p of P) {
    if (p.id === actor) continue;
    const fp = s => engineFollowers(s, s.players[p.id]) - (s.players[p.id].contest || 0);
    const g = fp(end) - fp(start) - tracedF[p.id];
    if (g) out.push(`${nm(p.id)} ${g > 0 ? '+' : '−'}${fword(g)}`);
  }
  if (!place && !out.length) return null;
  const head = place ? (joined ? `${who} joined ${nm(joined.id)} on ${space}` : `${who} took ${space}`) : who;
  // the strip's one line: what hit you first, then the biggest thing the turn did
  const big = out.find(l => /^(recruited|bought|traded|released) |^(an extra turn|\d+ extra turns)$/.test(l));
  const short = [hit, gain, big && big.replace(/ \(paid .*\)$/, '').replace(/ \(free\)$/, '')].filter(Boolean).slice(0, 2).join(' · ');
  // what the card names, from the table itself: the space's key, and the uid of each member recruited (hover targets)
  let spaceKey = null;
  if (place) {
    const q = end.quadrants.findIndex(id => quadrant(id).name === place[4]);
    const i = q < 0 ? -1 : quadrant(end.quadrants[q]).actions.findIndex(x => x.name === space);
    if (i >= 0) spaceKey = `${q}-${i}`;
  }
  const uids = {};
  for (const u of end.players[actor].members) if (!start.players[actor].members.includes(u) && end.cards[u]) uids[cardDef(end, u).name] = u;
  return { text: [head, ...out].join(' · '), head, lines: out, space, spaceKey, uids, actor, touched: [...touched], short, hit };
}

/** Who won a finished game: most followers, members breaking a follower tie (the rule; Results ranks the same way). */
export function finalWinners(state) {
  const ids = state.ranking || state.players.map(p => p.id);
  const key = id => `${engineFollowers(state, state.players[id])}|${memberCount(state, state.players[id])}`;
  return ids.filter(id => key(id) === key(ids[0]));
}
