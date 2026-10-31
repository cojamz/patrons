// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE, memberCount, followers as engineFollowers, applyMove, contestTable, roundWorkers, WORKERS, allQuadrantIds, turnRail, roundOrder } from '../engine/v4/index.js';
import { contextFor, logSince } from '../engine/v4/core.js';
import { defaultEmoji } from './art/emojis.js';
import { usableNow, memberAsks } from './game/memberUse.js';
import { panelWords } from './game/panelText.js';

// Seat colors are an accent now (identity is the player's emoji on their leader, Cory 2026-10-14): ochre, teal,
// terracotta-rose, lavender-plum, each ΔE ≥ 30 (CIE76) from every resource color on screen (the Lamplit inks) and
// readable on walnut, measured in src/test/v4/ui/colors.test.js.
export const PLAYER_COLORS = ['#9c845a', '#48c8d4', '#fca2a8', '#eac0fc', '#00e8b8', '#90c058']; // P5 and P6: five and six players (2026-10-22), clear of every resource color
export const SEAT_SIGILS = ['circle', 'triangle', 'square', 'star', 'diamond', 'cross'];
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
// a color inside a rule reads lowercase, like every other ("Most magenta members", beside "Most red"; RC1 sweep 9/58)
export const lowColor = t => t.replace(/(?<=\S\s)(Gold|Red|Blue|Green|Magenta|Silver|Yellow|Purple|White)\b/g, m => m.toLowerCase());
export const shortLabel = label => lowColor(label.replace(/\s*\(.*\)\s*$/, ''));
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

/** The member giving p a second buy this round (Big Spender: flag extraBuy), by name, or null. */
export function extraBuyer(state, p) {
  for (const u of p.members) {
    const c = state.cards[u];
    if (!c || (c.spent && c.spent.extraBuy === state.round)) continue;
    const d = [c.def, c.copy].filter(Boolean).map(id => defById(id)).find(x => x.extraBuy);
    if (d) return defById(c.def).name;
  }
  return null;
}

/** The line under your first "place a minion" of each round: where the open spaces are. */
export const RING_NOTE = {
  1: 'The dark inner rings open in rounds II and III.',
  2: 'The middle ring opened this round.',
  3: 'The inner ring opened this round.',
};

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
  // only the ones that would do something now (the engine's dry run), said once and quietly; three or more point at
  // the lit figures in your seat rather than reading out a list (Cory, 2026-10-15: make using a member obvious)
  const usable = mine ? usableNow(state, pend.player).map(u => u.name) : [];
  const use = usable.length > 2 ? `one of your ${usable.length} lit members` : usable.join(' or ') || null;
  switch (pend.kind) {
    case 'setup': {
      return mine
        // the count is the pick's own title ("Pick 1 of 2"), right where you pick; the header doesn't repeat it (w3b #6)
        ? { who: p, text: state.artifacts && Object.keys(state.artifacts).length ? 'Pick an artifact' : 'Draft 1 resource' }
        : { who: p, text: state.artifacts && Object.keys(state.artifacts).length ? `${name} is picking an artifact` : `${name} is drafting a resource` };
    }
    case 'place': {
      // a second placement in a row says why: the snake turning round on you is your turn again, not a bonus;
      // an extra turn names the card or space that gave it (RC1 panel: "Extra turn" at the turnaround read as a bonus)
      const t = currentTurn(state);
      if (t && t.again) {
        const or = use ? `…or use ${use} first` : null;
        // a turn taken early (Crunch Time) is your own next minion, moved up: not a bonus
        if (t.early) {
          return mine
            ? { who: p, lead: `Your next turn, now (${t.early}): `, text: 'place a minion', keepCase: true, ...(or ? { sub: or } : {}) }
            : { who: p, text: `${name}: next turn, now (${t.early})` };
        }
        // back to back because a rival took their turns early (Crunch Time), not because the snake turned
        if (t.closed) {
          const by = closedBy(state, t.closed, mine ? pend.player : null);
          return mine
            ? { who: p, lead: `Your turn again (${by}) — `, text: 'place a minion', ...(or ? { sub: or } : {}) }
            : { who: p, text: `${name} again (${by})` };
        }
        if (t.kind === 'snake') {
          return mine
            // the headline says it, and so do the rail and the chip ("now twice"): no third telling (w2b #15)
            ? { who: p, lead: 'Your turn again (snake order) — ', text: 'place a minion', ...(or ? { sub: or } : {}) }
            : { who: p, text: `${name} again (snake order)` };
        }
        const why = t.why ? ` (${t.why})` : '';
        const what = t.kind === 'hand' ? 'Extra minion' : '+1 minion';
        return mine
          ? { who: p, lead: `${what}${why}: `, text: 'place it now', keepCase: true, ...(or ? { sub: or } : {}) }
          : { who: p, text: `${name}: ${what.toLowerCase()}${why}` };
      }
    }
    // falls through
    case 'place-plain': {
      if (!mine) return { who: p, text: `${name} is placing a minion` };
      // your first placement of a round says which rings are open (a friend's first game: he missed the inner rings):
      // once a round, one short line, and a usable member's line wins the room
      const first = !Object.values(state.slots || {}).includes(p.id);
      const sub = use ? `…or use ${use} first` : first ? RING_NOTE[state.round] : null;
      return { who: p, text: `Place a minion on a glowing space`, ...(sub ? { sub } : {}), ...(sub && !use ? { brief: true } : {}) };
    }
    // the headline is a verb phrase that fits one line at 1270×700; the details go in the line under it (sub)
    case 'buy':
      return mine
        // the headline stays one short line beside Release and Pass; the line under it finishes it rather than saying it
        // again (it read "Recruit or buy" over "Recruit a member or buy followers, or pass")
        // a second buy (Big Spender) says so and names the card that gave it (w2a #6: it fired with no cue)
        // only a real second buy spends it (core.js boughtOnce): a pass keeps it for a later turn this round, and says so
        // (w3: the game-feel tester thought Big Spender fired twice)
        // once the member glows on your seat with its own "Skip, keep it for later" (memberUse.js memberAsks), the line
        // under the headline would say it a second time: it goes, all but another way out
        ? (pend.extra ? { who: p, text: `Recruit again (${extraBuyer(state, p) || 'a second recruit'})`, keepCase: false,
          ...([...memberAsks(state, p.id).values()].some(a => a.kind === 'again')
            ? (use ? { sub: `…or use ${use}` } : {})
            : { sub: `Once a round: pass and ${extraBuyer(state, p) || 'it'} keeps it for a later turn${use ? `; or use ${use}` : ''}` }) }
          // one line for one step (blind testers, 2026-10-15: headline, a subtitle saying it again and the step tabs):
          // the headline says it all; the line under it only when there's another way out
          : { who: p, text: 'Recruit a member or followers', ...(use ? { sub: `…or use ${use}` } : {}) })
        : { who: p, text: pend.extra ? `${name} recruits again (${extraBuyer(state, p) || 'a second recruit'})` : `${name} is shopping` };
    case 'pay':
      return mine ? { who: p, text: 'Choose how to pay' } : { who: p, text: `${name} is paying` };
    case 'choose': {
      if (!mine) return { who: p, text: `${name} is choosing` };
      // the question itself is in the note on the board; the headline names what's asking ("Kickback: choose below")
      // a ransom ("Shake Down: pay P2 4 (2 red, 2 gold) to keep Magnate?") is your call, said as "P2 is taking your Magnate: pay 4 to keep it?" (panel Oct 26: "P2 holds Magnate" read as if P2 owned it); was "P2 holds Magnate: keep it
      // for 4?" (RC1 round 3 #55), never "Shake Down: choose one"
      const ransom = String(pend.prompt || '').match(/^Shake Down: pay (.+?) (\d+(?: \([^)]+\))?) to keep (.+)\?$/);
      if (ransom) {
        // it's the thief's turn and your call (w3b #37: "Your turn — …" during P4's turn); with too little to pay,
        // say so, rather than leave "Let Middleman go" as the only button with no reason
        const have = Object.values(p.res || {}).reduce((a, b) => a + b, 0);
        const can = pend.options.some(o => o.value === 'pay');
        return { who: p, lead: 'Your call — ', text: `${ransom[1]} is taking your ${ransom[3]}: pay ${ransom[2]} to keep it?`, keepCase: true,
          ...(can ? {} : { sub: `You hold ${have}: not enough to pay ${ransom[2]}, so it goes` }) };
      }
      const asker = (String(pend.prompt || '').match(/^([^:]{2,28}):\s/) || [])[1];
      const short = String(pend.prompt || '').length <= 36;
      // Launderers' rearranging is its own card (LaunderCard.jsx)
      if (asker === 'Launderers' && pend.options.some(o => o.id === 'split' || o.kind === 'amount')) return { who: p, text: 'Launderers: rearrange your resources', keepCase: true };
      if (asker && asker !== name) {
        // options that all point at seats are answered on the cults (the seat selector, game/seatPick.js)
        return { who: p, text: `${asker}: ${pend.options.some(o => o.target) ? 'pick on the board' : 'choose one'}`, keepCase: true };
      }
      if (short) return { who: p, text: pend.prompt };
      // your own name before the question goes ("P2: take 6 more from the release, in any colors")
      const pr = String(pend.prompt || '');
      const own = pr.startsWith(`${name}: `) ? pr.slice(name.length + 2) : pr;
      return { who: p, text: own.length <= 46 ? own : 'answer the question below' };
    }
    default:
      return { who: p, text: pend.prompt };
  }
}

// ---------- this round's turns: the snake, extra minions, extra turns ----------
const ROUND_LINE = /^Round \S+ (begins|ends)\./;
/** Where this round's log starts (just after the last round-end line, so round-start hooks like Late Risers count). */
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
    let m = l.match(/^(.+?)'s (.+?): (.+?) gets (1 more minion|(\d+) more minions), placed now\.$/);
    if (m && m[1] === m[3]) { add(m[1], m[2], m[5] ? Number(m[5]) : 1); continue; }
    m = l.match(/^(.+?)'s (Late Risers): 1 more minion, placed first\.$/);
    if (m) { add(m[1], m[2], 1); continue; }
    m = l.match(/^(.+?) gets (1 more minion|(\d+) more minions), placed now\.$/);
    if (!m) continue;
    // paid for just before: "P1's Taskmaster: pays 5 purple…" (older "pays N purple for X" / "spends N purple on X"
    // lines still parse in saved logs); else the space just taken (Overtime and Crunch Time are free)
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
 * card or space gave), why names that card or space, early names the space a player took that turn early with
 * (Crunch Time: their own turn, moved up), and at is 'done' | 'now' | 'later'. Every turn is one placement.
 */
export function turnSequence(state) {
  if (!(state.round >= 1) || state.over) return [];
  const r = turnRail(state);
  const seq = [...r.done.map(pid => ({ pid, at: 'done' })), ...(r.current != null ? [{ pid: r.current, at: 'now' }] : []), ...r.next.map(pid => ({ pid, at: 'later' }))];
  // the round's order, with turns taken early (Crunch Time) moved up: they're the player's own turns, not extra ones
  const { order, early, src, late } = roundOrder(state);
  // a Last Call caller's turns still to come go after everyone else's, as the engine runs them (core lastCallLast),
  // so a rival's skipped turn that lands at the end still comes before them
  // (read off the queue too: a screen mid-animation shows the caller's flag before its turn record has moved them)
  const isLast = pid => state.players[pid].lastCall === state.round;
  const queued = (state.queue || []).slice(0, Math.max(0, (state.queue || []).findIndex(t => t.t === 'allPlaced'))).filter(t => t.t === 'turn');
  if (queued.some(t => isLast(t.p)) && queued.findIndex(t => isLast(t.p)) > queued.findLastIndex(t => !isLast(t.p))) {
    let k = 0;
    for (const t of seq) if (t.at !== 'later' && k < order.length && order[k] === t.pid) k++;
    const rest = order.slice(k).map((pid, i) => i + k);
    const last = i => isLast(order[i]);
    const sorted = [...rest.filter(i => !last(i)), ...rest.filter(last)];
    const take = a => { const v = sorted.map(i => a[i]); v.forEach((x, i) => { a[k + i] = x; }); };
    [order, early, src, late].forEach(take);
  }
  const snake = (WORKERS[state.round - 1] || 0) * state.players.length;
  // the round's order is the sequence with the extra turns taken out: match it in order, and what's left over is extra
  let j = 0;
  for (const t of seq) {
    if (j < order.length && order[j] === t.pid) {
      // snake or hand by where the turn sat before it was taken early
      t.kind = src[j] < snake ? 'snake' : 'hand';
      t.src = src[j];
      if (early[j]) t.early = early[j];
      if (late && late[j]) t.late = late[j];
      j++;
    } else t.kind = 'extra';
  }
  // Two of one seat's own turns back to back that were not side by side in the plain snake: a rival took turns early
  // (Crunch Time) and closed the gap between them. That is not the snake turning (Cory #98: "the middle player went
  // twice?"), so it says who moved their turns up: closed = { pid, why }.
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1], t = seq[i];
    // (after your own Crunch Time chain your next turn may follow at once: still your own run, nothing closed)
    if (a.pid !== t.pid || a.kind === 'extra' || t.kind === 'extra' || t.early || a.early || t.late || a.late || t.src === a.src + 1) continue;
    const by = seq.find(x => x.early && x.pid !== t.pid && x.src > a.src && x.src < t.src);
    // or a rival's turn in between was skipped (Sleep In, Hold Up) and now comes after everyone's
    const gone = !by && seq.find(x => x.late && x.pid !== t.pid && x.src > a.src && x.src < t.src);
    t.closed = by ? { pid: by.pid, why: by.early } : gone ? { pid: gone.pid, why: gone.late, skipped: true } : { pid: null, why: null };
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
/** Why two turns came back to back off the snake (turnSequence's closed): "P1 took turns early with Crunch Time",
 *  or "P2's turn was skipped (Hold Up)". */
export function closedBy(state, closed, me = null) {
  if (!closed || closed.pid == null) return 'turns in between were taken early';
  if (closed.skipped) return `${closed.pid === me ? 'your' : `${state.players[closed.pid].name}'s`} turn was skipped${closed.why ? ` (${closed.why})` : ''}`;
  const who = closed.pid === me ? 'you' : state.players[closed.pid].name;
  return `${who} took turns early${closed.why ? ` with ${closed.why}` : ''}`;
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

/**
 * Follower breakdown for the results table, adding up exactly to the total: self (1) + members + bought + effects
 * (during play: members' triggers, spaces and choices, losses negative) + contests + endGame. play lists effects by
 * cause from the engine's ledger ([{ label, n }]: "Robin Hood" +2, "P2's Raider" −3, "Your Call" +4); an older save
 * without a ledger gets one "during play" line.
 */
export function breakdown(state, p) {
  // followers that members are worth, as the engine counts them (a Doppelganger can copy a follower value)
  const members = printedFollowers(state, p);
  const endGame = p.final ? p.final.total : 0;
  const bought = boughtFollowers(state, p);
  const rawEffects = p.bonus - p.contest - endGame - bought;
  const floor = Math.max(0, -(1 + p.bonus + members));
  const effects = rawEffects + floor;
  const rows = state.ledger && state.ledger[p.id] ? Object.entries(state.ledger[p.id]).filter(([, n]) => n).map(([label, n]) => ({ label, n })) : [];
  const listed = rows.reduce((t, l) => t + l.n, 0);
  const play = listed === rawEffects ? rows : [...rows, { label: rows.length ? 'other' : 'during play', n: rawEffects - listed }].filter(l => l.n);
  if (floor) play.push({ label: 'Minimum 0 followers', n: floor });
  return { self: 1, members, contests: p.contest, bought, effects, endGame, floor, play, parts: p.final ? p.final.parts : [] };
}

// Read printed values directly: a signed follower loss can put the raw total below its zero floor.
const printedFollowers = (state, p) => p.members.reduce((n, uid) => {
  const c = state.cards[uid], own = cardDef(state, uid).f ?? 1;
  return n + (c.copy ? Math.max(own, defById(c.copy).f ?? 1) : own);
}, 0);

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
  if (tied.length > 1) {
    const most = Math.max(...tied.map(p => memberCount(state, p)));
    const winners = tied.filter(p => memberCount(state, p) === most);
    return winners.length === 1
      ? `${winners[0].name} won the ${f(w)}-follower tie with ${most} members.`
      : `${winners.map(p => p.name).join(' and ')} tie on ${f(w)} followers and ${most} members.`;
  }
  const b = breakdown(state, w);
  const lead = ranked[1] ? `${w.name} won by ${f(w) - f(ranked[1])}` : `${w.name} won`;
  // Name the biggest real sources, in the words the results table uses.
  const n = w.members.reduce((s2, u) => s2 + cardDef(state, u).n, 0);
  const swept = Object.entries(contestRounds(state)[w.id] || {}).sort((a2, c) => c[1].rounds - a2[1].rounds || c[1].v - a2[1].v)[0];
  // "P4 won by 17, mostly by holding Most members all three rounds (+20)." Biggest source first, in plain words.
  const say = {
    members: v => `by recruiting ${n} members (+${v})`,
    bought: v => `by recruiting followers (+${v})`,
    effects: v => `from abilities and spaces during play (+${v})`,
    endGame: v => `from end-game bonuses (+${v})`,
    // the sweep names its own followers, never the contests' total (Most Magenta members gave +10 of +18)
    contests: v => (swept && swept[1].rounds >= 2
      ? (swept[1].v === v
        ? `by holding ${swept[1].rule} ${swept[1].rounds === 3 ? 'all three rounds' : 'two rounds of three'} (+${v})`
        : `from the rims' prizes (+${v}; ${swept[1].rule} ${swept[1].rounds === 3 ? 'all three rounds' : 'two rounds of three'}, +${swept[1].v})`)
      : `from the rims' prizes (+${v})`),
  };
  const top = [['members', b.members], ['bought', b.bought], ['effects', b.effects], ['endGame', b.endGame], ['contests', b.contests]]
    .filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).slice(0, 2);
  if (!top.length) return `${lead}.`;
  // two equal sources are said as equal (w3a #19: "mostly by buying followers (+32), then from the rims' prizes (+32)")
  if (top[1] && top[1][1] === top[0][1]) return `${lead}, as much ${say[top[0][0]](top[0][1])} as ${say[top[1][0]](top[1][1])}.`;
  return `${lead}, mostly ${say[top[0][0]](top[0][1])}${top[1] ? `, then ${say[top[1][0]](top[1][1])}` : ''}.`;
}

/** Lines added to the log between two states. The log only appends (and trims its front past a cap). */
export function newLogLines(prev, next) {
  const a = prev.log, b = next.log;
  if (a === b) return [];
  // the engine counts every line it has said: the log keeps only its last lines, and a new line can repeat the last one
  if (prev.logN != null && next.logN != null && next.logN >= prev.logN) return logSince(next, prev.logN);
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
    if (m) {
      // a round's start (members paying out) is logged after the last round's end and before its own "begins": those
      // lines open the new round, never trail the old one (w2a #27: round II's income sat above "Round I ends")
      const cur = out[out.length - 1];
      const end = cur.lines.findLastIndex(l => /^Round \S+ ends\./.test(l));
      const moved = end >= 0 ? cur.lines.splice(end + 1) : [];
      out.push({ title: `Round ${m[1]}`, lines: moved, start: i - moved.length });
    }
    out[out.length - 1].lines.push(line);
  });
  return out.filter(s => s.lines.length);
}

/**
 * A section's lines as turns, newest turn first, each turn's lines in the order they happened: [[index in section]].
 * The log read newest-first line by line put effects above their causes ("You stole 2…" over "You took Redistribute",
 * w3b #49); now a turn reads top-down. A turn starts where a player takes a space ("P2 took Kickback (Gold).");
 * a round's end and the game's end stand alone, on top. A bare "P2 passed." is left out (w3a #34: noise; a turn
 * with no recruit or buy line bought nothing).
 */
export function turnGroups(state, lines) {
  const names = state.players.map(p => esc(p.name)).join('|');
  const took = new RegExp(`^(${names}) (?:took .+|joined .+ on .+) \\([A-Z][a-z]+\\)\\.$`); // a turn: a space taken or joined
  const pass = new RegExp(`^(${names}) passed\\.$`);
  const alone = /^(Round \S+ ends\.|Game over\.)/;
  const groups = [];
  let g = null;
  lines.forEach((l, j) => {
    if (pass.test(l)) return;
    if (!g || took.test(l) || alone.test(l)) { g = []; groups.push(g); }
    g.push(j);
    if (alone.test(l)) g = null;
  });
  // a round's opening line heads its group: the members' round-start pay-outs are logged just before it
  for (const grp of groups) {
    const k = grp.findIndex(j => /^Round \S+ begins\./.test(lines[j]));
    if (k > 0) grp.unshift(...grp.splice(k, 1));
  }
  return groups.reverse();
}

/**
 * A member's trigger that fires the same way again and again (Tipster: "P3's Tipster: +1 white." after every move) is
 * shown once per round, at its newest, with how many times it fired (w4b #29: it filled the log). Takes turnGroups'
 * groups; returns { groups, times: Map(index → n) }. Only exact repeats, three or more, of a "Name's Member: …" line.
 */
export function foldRepeats(lines, groups) {
  const n = new Map();
  for (const l of lines) if (/^.+?'s [^:]+: /.test(l)) n.set(l, (n.get(l) || 0) + 1);
  const seen = new Set(), times = new Map();
  const out = groups.map(g => g.filter(j => {
    const l = lines[j];
    if (!(n.get(l) >= 3)) return true;
    if (seen.has(l)) return false;
    seen.add(l); times.set(j, n.get(l));
    return true;
  })).filter(g => g.length);
  return { groups: out, times };
}

/**
 * A turn's lines as [key, text], with back-to-back gains from the same card joined: "Ana's Last Call: +1 purple." and
 * "Ana's Last Call: +4 followers." read "Ana's Last Call: +1 purple, +4 followers." (Cory, 2026-10-22: the log is
 * scannable, concise but thorough). Only lines that are nothing but numbers ("+1 purple", "−2 blue") join.
 */
export function mergeGains(items) {
  const out = [];
  const gains = /^(.+?'s [^:]+): ([+−][^.()]*)\.$/;
  for (const [j, text] of items) {
    const m = text.match(gains), prev = out[out.length - 1];
    const pm = prev && prev[1].match(gains);
    if (m && pm && m[1] === pm[1]) { prev[1] = `${pm[1]}: ${pm[2]}, ${m[2]}.`; continue; }
    out.push([j, text]);
  }
  return out;
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
  return { qid: c.qid, label: c.label, rule: lowColor(c.rule || shortLabel(c.label)), counts: c.counts || null, tiebreak: c.tiebreak || null, prize: c.prize, rows, leaders, margin, top: rows[0] ? rows[0].score : 0 };
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
  const target = JSON.stringify(after.log);
  // Scoring can fill the log tail identically after different buys. Replay the actual recorded move;
  // otherwise a same-value card earlier in the options could replace the member really recruited.
  const recorded = after.moves === before.moves + 1 ? after.history?.[before.moves] : null;
  const options = recorded && recorded[0] === before.pending.player
    ? before.pending.options.filter(o => o.id === recorded[1]) : before.pending.options;
  for (const o of options) {
    const move = { player: before.pending.player, option: o.id };
    let full;
    try { full = applyMove(before, move); } catch { continue; }
    if (JSON.stringify(full.log) !== target || full.round !== after.round) continue;
    const trimmed = { ...before, queue: before.queue.slice(0, cut + 1) };
    // with its own effect stream (the closing move up to its scoring, no round-start income): the table plays the
    // closing move from it, never from a state diff that reads every change as a follower buy (Cory, 2026-10-17)
    try { return applyMove(trimmed, move, { effects: true }); } catch { return null; }
  }
  return null;
}

/** Where a player's followers came from during a round: { contests, members, bought, effects }. */
export function roundGains(start, end, p, contests) {
  const was = start.players[p.id];
  const memF = st => printedFollowers(st, st.players[p.id]);
  const members = memF(end) - memF(start);
  const roundLines = newLogLines(start, end);
  const re = new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} bought (\\d+) followers?\\b`);
  const bought = roundLines.reduce((s, l) => { const m = l.match(re); return s + (m ? Number(m[1]) : 0); }, 0);
  const total = engineFollowers(end, end.players[p.id]) - engineFollowers(start, was);
  // which members came and went, so the words say what moved the count (w3a #19: a swap that lost a follower read
  // "−1 from new members")
  const had = new Set(was.members), has = new Set(end.players[p.id].members);
  const ins = [...has].filter(u => !had.has(u)), outs = [...had].filter(u => !has.has(u));
  const joined = ins.length, left = outs.length;
  // what the members that left were worth (their printed followers), so new members and losses are said apart
  const worth = (st, u) => { try { return cardDef(st, u).f ?? 1; } catch { return 1; } };
  const lost = outs.reduce((t, u) => t + worth(start, u), 0);
  const who = esc(p.name);
  const swap = new RegExp(`^${who} traded |^.+? traded .+ for ${who}'s |^.+? swapped ${who}'s |^.+? swapped .+ and ${who}'s |swaps sides: .+ gets ${who}'s |^${who}'s Double Agent swaps sides`);
  const swapped = roundLines.some(l => swap.test(l));
  return { contests, members, bought, effects: total - contests - members - bought, total, joined, left, swapped, lost, gained: members + lost };
}

/** What moved a player's member followers this round, in words: "from new members", "from a swap"… */
export function membersWhy(g) {
  if (!g.left) return 'from new members';
  if (g.swapped && g.joined === g.left) return g.left > 1 ? 'from swaps' : 'from a swap';
  if (!g.joined) return 'from members that left';
  return 'from members in and out';
}
const sgn = n => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
/**
 * The round's member followers as the summary says them: one part, or new members and losses apart ("+11 from new
 * members · −1 from members that left"); a swap and nothing else is one part, "−1 from a swap" (w3a #19).
 */
export function membersParts(g, short = false) {
  if (!g || !g.members && !g.lost) return [];
  // short: the summary's cell, so it stays a line or two (w4b #30: it wrapped to three); the long words go in its hover
  // ("−1 members lost" read as a count of members, and whose? blind testers, 2026-10-15: it's followers, from members who left)
  const W = short ? { 'from new members': 'new members', 'from a swap': 'swapped', 'from swaps': 'swapped', 'from members that left': 'from members who left' } : null;
  const say = t => (W && W[t]) || t;
  if (!g.left || (g.swapped && g.joined === g.left) || !g.joined) return g.members ? [`${sgn(g.members)} ${say(membersWhy(g))}`] : [];
  return [g.gained ? `${sgn(g.gained)} ${say('from new members')}` : null, g.lost ? `−${g.lost} ${say('from members that left')}` : null].filter(Boolean);
}

// ---------- log lines, said plainly ----------
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The action the actor took most recently before line i ("P1 took Kickback (Gold).") */
function lastAction(log, i, actor) {
  const re = new RegExp(`^${esc(actor)} took (.+?) \\(\\w+\\)\\.$`);
  for (let k = i - 1; k >= 0 && k >= i - 12; k--) { const m = log[k].match(re); if (m) return m[1]; }
  return null;
}
/** The round line i falls in, from the log's own "Round II begins." lines (1 before the first). */
function roundAt(log, i) {
  for (let k = i; k >= 0; k--) { const m = /^Round (I{1,3}) begins\./.exec(log[k]); if (m) return m[1].length; }
  return 1;
}
/**
 * The words the board prints on a space, said plainly ("Copy a space taken this round"), by its name and, when the line
 * gives it, its sphere's name; '' when no space has that name. The board shows these words, not the space's name (blind
 * panel r1: the log said "Encore", the board "Copy a space taken this round"; wave-2 B#3: "which space is Crime Wave?").
 */
export function boardWords(name, round = 1, sphere = null) {
  for (const id of allQuadrantIds()) {
    const q = quadrant(id);
    if (sphere && q.name !== sphere) continue;
    const a = q.actions.find(x => x.name === name);
    if (!a) continue;
    let w = '';
    try { w = panelWords(id, a, Math.max(1, Math.min(3, round))) || ''; } catch { w = ''; }
    return w.replace(/(^|[^\d])1 @f/g, '$11 follower').replace(/@f/g, 'followers').replace(/@\w/g, '').trim();
  }
  return '';
}
/** "P1 took Encore (Echo)." → "P1 took Encore (Copy a space taken this round)."; a copy names its space's words too. */
function withBoardWords(log, i, line) {
  let m = line.match(/^(.+? took )(.+?) \(([A-Z][\w ]*)\)\.$/);
  if (m) { const w = boardWords(m[2], roundAt(log, i), m[3]); return w ? `${m[1]}${m[2]} (${w}).` : line; }
  m = line.match(/^(.*?\bcop(?:ied|ies) )(.+?)( \([^)]*'s\))?(:.*)$/);
  // "Cy copied Rising Tide (Di's): +6 silver." → "Cy copied Di's Rising Tide (Gain silver: half the top rival’s): +6 silver."
  if (m) { const w = boardWords(m[2], roundAt(log, i)); const whose = m[3] ? `${m[3].slice(2, -1)} ` : ''; return w ? `${m[1]}${whose}${m[2]} (${w})${m[4]}` : line; }
  return line;
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
  // a minion on a space a rival already took is Squatter's doing (the only member that lets you join): say so, never
  // let it read as a copy (plain-words pass: "P3 joined P2 on Crescendo")
  m = line.match(/^(.+?) joined (.+?) on (.+?) \((\w+)\)\.$/);
  if (m) return { text: `${m[1]} joined ${m[2]} on ${m[3]} (Squatter).` };
  // plain verbs, never flavor (w4b #28: "flourishes", "transmuted"), with the space that did it
  m = line.match(/^(.+?) flourishes: \+(\d+) of each other color\.$/);
  if (m) return { text: `${m[1]} gets +${m[2]} of each other color (Bumper Crop).` };
  m = line.match(/^(.+?) had no full set to flourish\.$/);
  if (m) return { text: `${m[1]} had no full set: nothing from Bumper Crop.` };
  m = line.match(/^(.+?) transmuted (.+)\.$/);
  if (m) return { text: `${m[1]} swapped ${m[2].replace(/ → /g, ' for ')} (Trade Seeds).` };
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
  // in the card's own words (w3b #49: "+1 each time" vs the card's "per round number")
  if (m) return { text: `${m[1]}'s Hustler picks ${m[2]}: ${m[2]} actions give ${m[1]} +1 gold per round number.` };
  return { text: line };
}
/** A log line said plainly, its spaces in the words the board shows them by. */
export const plainLine = (log, i) => withBoardWords(log, i, explainLine(log, i).text);

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
  // only where the tiebreak decides something: a tie for the lead, among players who have any (w2b #45: "(0 yellow)"
  // under every player, and a note for someone with no sets)
  const top = Math.max(...st.rows.map(r => r.shown));
  if (!row.shown || row.shown !== top) return null;
  const tied = st.rows.some(r => r !== row && r.shown === row.shown);
  // "1 red member", "2 red members"
  return tied ? `${row.tiebreak} ${row.tiebreak === 1 ? st.tiebreak.unit.replace(/members$/, 'member') : st.tiebreak.unit}` : null;
}

/** "5 minions each", or "5 minions each · Bo 6" when someone's members change their count this round (Extra Hand). */
/**
 * Why a player picks first this round, in words (w3a A2, blocker: the summary said "P3 picks first" while P3 led, and
 * the reason was nowhere): the member that always picks first ("Front-runner"), else "fewest followers" from round II
 * on, else null (round I's order is drawn).
 */
export function firstPickWhy(state, pid) {
  const p = state.players[pid];
  if (!p) return null;
  for (const u of p.members) { let d = null; try { d = cardDef(state, u); } catch { /* gone */ } if (d && d.pickFirst) return d.name; }
  return state.round >= 2 ? 'fewest followers' : null;
}

export function workersNote(state) {
  if (!state.round) return '';
  const base = WORKERS[state.round - 1];
  const odd = state.players.filter(p => roundWorkers(state, p) !== base);
  // "P2 has 6", never "P2 6" (w3a A12: it read as P2's score)
  return `${base} minions each${odd.length ? ` · ${odd.map(p => `${p.name} has ${roundWorkers(state, p)}`).join(', ')}` : ''}`;
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
 * What one member or artifact has gained its owner this game, and (for one that scores at game end) what it would
 * score if the game ended now (Cory, Oct 29). { made: '+7 red, +2 followers' | null, end: n | null }. Display only:
 * the end-game score runs on a copy.
 */
export function cardGains(state, uid) {
  const card = state.cards[uid];
  if (!card) return { made: null, end: null };
  const m = card.made || {};
  const parts = [...state.resources.filter(r => m[r] > 0).map(r => `+${m[r]} ${r}`),
    ...Object.keys(m).filter(k => k !== 'followers' && !state.resources.includes(k) && m[k] > 0).map(k => `+${m[k]} ${k}`),
    ...(m.followers > 0 ? [`+${m.followers} follower${m.followers === 1 ? '' : 's'}`] : [])];
  let end = null;
  const owner = state.players.find(p => p.members.includes(uid));
  const defs = [defById(card.def), ...(card.copy ? [defById(card.copy)] : [])].filter(d => d && d.onGameEnd);
  if (owner && defs.length && !state.over) {
    try {
      const copy = structuredClone(state), ctx = contextFor(copy), p = copy.players[owner.id];
      end = defs.reduce((s, d) => s + (d.onGameEnd(ctx, p, ctx.card(uid)) || 0), 0);
    } catch { end = null; }
  }
  return { made: parts.length ? parts.join(', ') : null, end };
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

/** A turn card's line for a minion placed now: "+1 minion, placed now", or with the card that gave it ("Night Owl: +1 minion, placed now"). */
const EXTRA_LINE = /^(?:[^:]+: )?\+\d+ minions?, placed now$/;

/**
 * A steal that arrives in another color, told once (rule-style: "…, as magenta." once, at the end):
 * "1 gold from P2, 1 red from you, as magenta" in place of "+2 magenta" and a "from" line per rival, which told the same
 * coins twice. gain: the taker's [[r, d]]; lost: [[who, [[r, d]]]] per rival. Null unless the taker gained one color
 * only, the rivals only lost other colors, and what they lost adds up to the gain.
 */
function stolenAs(gain, lost) {
  if (gain.length !== 1 || !(gain[0][1] > 0) || !lost.length) return null;
  const [c, n] = gain[0];
  let sum = 0;
  for (const [, list] of lost) for (const [r, d] of list) { if (r === c || !(d < 0)) return null; sum -= d; }
  if (sum !== n) return null;
  return `${lost.map(([who, list]) => `${list.map(([r, d]) => `${-d} ${r}`).join(', ')} from ${who}`).join(', ')}, as ${c}`;
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
  // what you got on a rival's turn, summed, and the members that paid it (as effectStory's gift)
  const giftRes = {}, giftWhy = [];
  const gave = (r, d) => { if (d > 0) giftRes[r] = (giftRes[r] || 0) + d; };
  seg.forEach((ls, k) => {
    const [a, b] = states[k];
    // what members did, on lines of their own; their amounts come off the gross so nothing is counted twice
    const traced = P.map(() => ({}));
    const said = [];
    for (const l of ls) {
      const t = traceLine(l, P, res);
      // the space's own gain, said by the log under its name ("Ana's Tide: +3 blue."), is the gross line's: not a member's
      if (t && t.card === space && t.target === actor && !t.followers && !t.discount) continue;
      if (t) {
        for (const r in t.res) traced[t.target][r] = (traced[t.target][r] || 0) + t.res[r];
        tracedF[t.target] += t.followers;
        const bits = [...Object.entries(t.res).filter(([, d]) => d).map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`),
          ...(t.followers ? [`${t.followers > 0 ? '+' : '−'}${fword(t.followers)}`] : []), ...(t.discount ? [`next member costs ${t.discount} less`] : [])].join(', ');
        // "Treasurer: +3 gold" (the actor's own), "Tax Collector: Di +1 gold", "Ana's Retinue: Bo +1 silver"
        const card = t.owner === actor || t.owner === t.target ? t.card : `${whose(t.owner)} ${t.card}`;
        if (me != null && me !== actor && t.target === me && Object.values(t.res).some(d => d > 0)) {
          for (const r in t.res) gave(r, t.res[r]);
          const why = t.owner === me || t.owner === actor ? t.card : `${P[t.owner].name}'s ${t.card}`;
          if (!giftWhy.includes(why)) giftWhy.push(why);
          // a plain gain of yours is told once, on the gift line
          if (Object.values(t.res).every(d => d >= 0) && !t.followers && !t.discount) continue;
        }
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
      // a rival's answer to this turn (Shake Down's ransom, Poach's replacement): whose call, what they gave and why
      // that much, so the card never shows a bare "+2 magenta" against a "+4" hover (blind tester, aminus r1 #3, #4)
      const rival = P.find(p => p.id !== actor && l.startsWith(`${p.name} `));
      if (rival) {
        const rest = l.slice(rival.name.length + 1), who2 = cap(nm(rival.id));
        if ((m = rest.match(/^chose to pay (?:.+? )?(\d+) \((.+)\) to keep (.+): its cost is \d+\.$/))) { said.push(`${who2} paid ${m[1]} to keep ${m[3]} (its cost)`); continue; }
        if ((m = rest.match(/^chose to let (.+) go to .+ rather than pay (\d+)\.$/))) { said.push(`${who2} let ${m[1]} go rather than pay ${m[2]}`); continue; }
        if ((m = rest.match(/^couldn't pay (\d+) \(held (\d+)\), so lost (.+) to .+\.$/))) { said.push(`${who2} couldn’t pay ${m[1]}, so lost ${m[3]}`); continue; }
        if ((m = rest.match(/^gets no replacement: (.+)\.$/))) { said.push(`${who2} gets no replacement: ${m[1]}`); continue; }
      }
      if (!l.startsWith(`${A.name} `) && !l.startsWith(`${A.name}'s `)) continue;
      const own = l.slice(A.name.length);
      if ((m = own.match(/^'s Top Up: (.+ tie for your fewest .+)\.$/))) said.push(youName(`Top Up: ${m[1]}`).replace(/\byour fewest\b/, actor === me ? 'your fewest' : 'the fewest'));
      else if ((m = own.match(/^ uses (.+?)\.$/))) said.push(`used ${m[1]}`);
      // a buy step skipped because nothing was affordable is said on the card (blind tester B: after Lie Low it passed
      // silently, straight into the round's scoring, where the toast never showed)
      else if (/^ couldn't afford anything\.$/.test(own)) said.push('nothing affordable');
      else if ((m = own.match(/^ traded (.+)\.$/))) said.push(youName(`traded ${m[1]}`));
      else if ((m = own.match(/^ pulled a heist: (.+)\.$/))) said.push(youName(`took ${m[1]}`));
      // the card that gave it, named (Cory: "Log did not indicate a Night Owl turn"): "Night Owl: an extra turn after this one"
      else if ((m = own.match(/^'s (.+?): .+? gets (1 more minion|(\d+) more minions), placed now\.$/))) said.push(`${m[1]}: +${m[3] || 1} minion${m[3] ? 's' : ''}, placed now`);
      else if ((m = own.match(/gets (1 more minion|(\d+) more minions), placed now\.$/))) said.push(`+${m[2] || 1} minion${m[2] ? 's' : ''}, placed now`);
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
    // a steal that arrives as magenta is one line, naming each rival and what they lost (as its flight shows it)
    const rivals = P.filter(p => p.id !== actor).map(p => [p, gross(p.id)]);
    const as = k === 0 ? stolenAs(gross(actor), rivals.filter(([, d]) => d.length).map(([p, d]) => [nm(p.id), d])) : null;
    if (as) { gain = as; out.push(as); } else if (k === 0) { const g = gross(actor); if (g.length) { gain = signed(g); out.push(gain); } }
    for (const [p, d] of rivals) {
      const lost = d.filter(([, x]) => x < 0), got = d.filter(([, x]) => x > 0);
      if (lost.length && as) { if (p.id === me) hit = `took ${lost.map(([r, x]) => `${Math.abs(x)} of your ${r}`).join(', ')}`; } else if (lost.length) {
        // the amount first ("1● from P2"): "from P2 1●" read as "P21" (w3b, as the summary's counts did)
        out.push(`${plain(lost)} from ${nm(p.id)}`);
        if (p.id === me) hit = `took ${lost.map(([r, x]) => `${Math.abs(x)} of your ${r}`).join(', ')}`;
      }
      // what you got is told once, on the gift line
      if (got.length && !(p.id === me && me !== actor)) out.push(`${nm(p.id)} ${signed(got)}`);
      if (p.id === me) for (const [r, x] of got) gave(r, x);
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
  const f = fl(end) - fl(start) - tracedF[actor]; // what a line above already told (e.g. "Help Yourself: +1 follower") is not told again
  if (f) out.push(`${f > 0 ? '+' : '−'}${fword(f)}`);
  // a rival's followers that moved and no member line explains (a follower drawn from them)
  for (const p of P) {
    if (p.id === actor) continue;
    const fp = s => engineFollowers(s, s.players[p.id]) - (s.players[p.id].contest || 0);
    const g = fp(end) - fp(start) - tracedF[p.id];
    if (g) out.push(`${nm(p.id)} ${g > 0 ? '+' : '−'}${fword(g)}`);
  }
  // members used before the placement, in order, lead the head (w4 skeptic #6: "You took Spree / +3● / 3● from P2 /
  // Tribute Band: +6●" put a Use's gains under a space that gives nothing): "You used Tribute Band, then took Spree"; a
  // turn so far holding only a Use is "You used Tribute Band", never a bare "You"
  const useRe = new RegExp(`^${an} (?:uses|used) (.+?)(?::|\\.$)`);
  const placeAt = seg[0].findIndex(l => placeRe.test(l));
  const usedFirst = (placeAt < 0 ? seg[0] : seg[0].slice(0, placeAt)).map(l => (l.match(useRe) || [])[1]).filter(Boolean);
  // a Use that logs only its own lines ("Ana's Tribute Band: +2 red.", no "Ana uses …") still leads the head
  for (const c of Object.values(end.cards)) {
    if (!c.used || start.cards[c.uid]?.used || !A.members.includes(c.uid)) continue;
    const n = defById(c.def).name, at = seg[0].findIndex(l => l.startsWith(`${A.name}'s ${n}`));
    if (at >= 0 && (placeAt < 0 || at < placeAt) && !usedFirst.includes(n)) usedFirst.push(n);
  }
  for (const n of usedFirst) { const k = out.indexOf(`used ${n}`); if (k >= 0) out.splice(k, 1); } // said once, in the head
  if (!place && !out.length && !usedFirst.length) return null;
  const did = place ? (joined ? `joined ${nm(joined.id)} on ${space} (Squatter)` : `took ${space}`) : null;
  const head = usedFirst.length ? `${who} used ${usedFirst.join(', ')}${did ? `, then ${did}` : ''}` : did ? `${who} ${did}` : who;
  // the strip's one line: what hit you first, then the biggest thing the turn did
  // a member changing hands names both and whose it was first ("took your Retinue, gave Broker"; w4 A#62: the strip said
  // "Swap Sides · bought 10" with no word of the swap)
  const swapLine = out.filter(l => /^(took (your|\S+['’]s) |gave .+ to )/.test(l)).join(', ');
  const big = swapLine || out.find(l => /^(recruited|bought|traded|released) /.test(l) || EXTRA_LINE.test(l));
  // a gain that came in another color names the member that changed it (w4 skeptic #18: "Bandwagon (+1 red …): +6 gold")
  const convRe = new RegExp(`^${an}'s (.+?): \\d+ \\w+ comes as \\d+ \\w+\\.$`);
  const conv = [...new Set(lines.map(l => (l.match(convRe) || [])[1]).filter(Boolean))];
  const gainSaid = gain && conv.length ? `${gain} (${conv.join(', ')})` : gain;
  const giftBits = Object.entries(giftRes).map(([r, d]) => `+${d} ${r}`);
  const gift = giftBits.length ? `you ${giftBits.join(' ')}${giftWhy.length ? ` (${giftWhy.join(', ')})` : ''}` : '';
  // it leads, right after the space's own result (the turn card shows its first lines; the rest fold)
  if (gift) out.splice(gain ? 1 : 0, 0, gift);
  // who paid for it and who else got something (panel r1: the strip never named a steal's victims or a gift's
  // recipients, so "+3 gold" read as found money): "2 gold from P4, 1 gold from P2", "P2 +1 gold"
  const names = P.filter(p => p.id !== actor).map(p => esc(nm(p.id))).join('|');
  const flowRe = names ? new RegExp(`^(?:\\d+ \\w+(?:, \\d+ \\w+)* from (?:${names})|(?:${names}) [+−]\\d)`) : null;
  const flows = flowRe ? out.filter(l => flowRe.test(l) && l !== gift && l !== gain).join(', ') : '';
  const short = [hit && !`${flows} ${gain}`.includes('from you') && !(big && big.includes(hit)) ? hit : null, gift || null, gainSaid, flows || null, big && big.replace(/ \(paid .*\)$/, '').replace(/ \(free\)$/, '')].filter(Boolean).slice(0, 3).join(' · ');
  // what the card names, from the table itself: the space's key, and the uid of each member recruited (hover targets)
  let spaceKey = null;
  if (place) {
    const q = end.quadrants.findIndex(id => quadrant(id).name === place[4]);
    const i = q < 0 ? -1 : quadrant(end.quadrants[q]).actions.findIndex(x => x.name === space);
    if (i >= 0) spaceKey = `${q}-${i}`;
  }
  const uids = {};
  for (const u of end.players[actor].members) if (!start.players[actor].members.includes(u) && end.cards[u]) uids[cardDef(end, u).name] = u;
  return { text: [head, ...out].join(' · '), head, lines: out, space, spaceKey, uids, actor, touched: [...touched], short, hit, gift, conv };
}

/**
 * One placement told from the engine's effect stream (effects.js): every change, grouped by what caused it and summed,
 * so nothing repeats and nothing is netted across causes (wave-2 tester: "traded 1 blue for 1 follower" ×3, Robin
 * Hood's follower twice, and P2's Raider taking 3 followers that the strip never mentioned).
 *   "P2 took Shoal · +2 blue +1 green · Raider: +3 followers −3 white · you −3 followers +3 white · recruited Banker (paid 4 gold)"
 * `fx`: the turn's effects in order. Same shape as turnStory; `hit` names what cost you and its cause
 * ("Raider took 3 of your followers"). Returns null if nothing happened.
 */
export function effectStory(start, end, actor, me = null, fx = []) {
  const base = turnStory(start, end, actor, me, null);
  const P = end.players;
  const nm = id => (id === 'shop' ? 'the shop' : id === me ? 'you' : P[id].name);
  const whose = id => (id === 'shop' ? "the shop's" : id === me ? 'your' : `${P[id].name}'s`);
  const fword = n => `${Math.abs(n)} follower${Math.abs(n) === 1 ? '' : 's'}`;
  const cardName = u => (end.cards[u] ? cardDef(end, u).name : start.cards[u] ? cardDef(start, u).name : 'a member');
  const groups = new Map();
  const groupOf = c => {
    const key = !c ? 'space' : c.kind === 'space' || c.kind === 'move' ? 'space' : c.kind === 'member' ? `member:${c.uid}:${c.def || ''}` : c.kind === 'recruit' ? `recruit:${c.uid}` : c.kind === 'buy' ? `buy:${c.tier}` : c.kind === 'release' ? `release:${c.uid}` : null;
    if (!key) return null;
    if (!groups.has(key)) groups.set(key, { key, cause: c, res: P.map(() => ({})), fol: P.map(() => 0), moved: [], disc: 0 });
    return groups.get(key);
  };
  for (const e of fx) {
    const g = groupOf(e.cause);
    if (!g) continue;
    const add = (pid, r, n) => { g.res[pid][r] = (g.res[pid][r] || 0) + n; };
    if (e.type === 'gain') add(e.to.pid, e.what.r, e.what.n);
    else if (e.type === 'pay') add(e.from.pid, e.what.r, -e.what.n);
    else if (e.type === 'transfer') { add(e.from.pid, e.what.r, -e.what.n); add(e.to.pid, e.what.r, e.what.n); }
    else if (e.type === 'followers') g.fol[e.to.kind === 'count' ? e.to.pid : e.from.pid] += e.what.n;
    else if (e.type === 'member-move') g.moved.push({ uid: e.what.uid, from: e.from.pid, to: e.to.pid });
    // Promote/Demote physically exchange a cult member and a shop card under the action's cause.
    // Their outgoing card returns to the shop, rather than being released to the pile.
    else if (e.type === 'release' && e.to.kind === 'shop') g.moved.push({ uid: e.what.uid, from: e.from.pid, to: 'shop' });
    // Red's swaps with the shop record the incoming card as a recruit under the move ('move'), not the space
    else if (e.type === 'recruit' && e.from.kind === 'shop' && (e.cause?.kind === 'space' || e.cause?.kind === 'move')) g.moved.push({ uid: e.what.uid, from: 'shop', to: e.to.pid });
    else if (e.type === 'discount' && e.to.pid === actor) g.disc += e.what.n;
  }
  const signedOf = (g, pid) => {
    const list = Object.entries(g.res[pid]).filter(([, d]) => d).map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`);
    if (g.fol[pid]) list.push(`${g.fol[pid] > 0 ? '+' : '−'}${fword(g.fol[pid])}`);
    return list.join(' ');
  };
  const paidOf = (g, pid) => Object.entries(g.res[pid]).filter(([, d]) => d < 0).map(([r, d]) => `${-d} ${r}`).join(', ');
  const out = [], hits = [];
  let gain = '';
  // the space's own result first, then what members added to it: a member that fires before the space's gain landed
  // (Hustler) put "Hustler: +3●" over the space's "+3●", which read as one line twice (w3a #36)
  const ordered = [...groups.values()].sort((a, b) => (b.key === 'space') - (a.key === 'space'));
  // what you got on a rival's turn, and from what (wave-2 testers A#3, B#46: "my silver went 3→9 between turns with no
  // cause shown"): every gain to you summed into one part, naming each member that paid it ("you +3 silver (Silversmith,
  // P3's Caterer)"); the space's own share is the line's space, already named
  const giftRes = {}, giftWhy = [];
  if (me != null && me !== actor) {
    for (const g of ordered) {
      const got = Object.entries(g.res[me]).filter(([, d]) => d > 0);
      if (!got.length && !(g.fol[me] > 0)) continue;
      for (const [r, d] of got) giftRes[r] = (giftRes[r] || 0) + d;
      if (g.fol[me] > 0) giftRes[' followers'] = (giftRes[' followers'] || 0) + g.fol[me];
      const c = g.cause || {};
      const owner = c.pid ?? actor;
      const name = c.kind === 'member' ? (c.def ? defById(c.def)?.name : cardName(c.uid)) : (c.kind === 'recruit' || c.kind === 'release') ? cardName(c.uid) : null;
      if (name) { const why = owner === me || owner === actor ? name : `${P[owner].name}'s ${name}`; if (!giftWhy.includes(why)) giftWhy.push(why); }
    }
  }
  const giftBits = Object.entries(giftRes).map(([r, d]) => (r === ' followers' ? `+${fword(d)}` : `+${d} ${r}`));
  const gift = giftBits.length ? `you ${giftBits.join(' ')}${giftWhy.length ? ` (${giftWhy.join(', ')})` : ''}` : '';
  // a gain of yours that the gift line already tells isn't told again in its own group
  const toldInGift = (g, pid) => !!gift && pid === me && !(g.fol[pid] < 0) && Object.values(g.res[pid]).every(d => d >= 0);
  // a steal that arrives as magenta: one line naming each rival and what they lost (stolenAs), or null
  const stolen = (g, owner) => {
    if (g.moved.length || g.fol.some(n => n)) return null;
    const res = pid => Object.entries(g.res[pid]).filter(([, d]) => d);
    return stolenAs(res(owner), P.filter(p => p.id !== owner && res(p.id).length).map(p => [nm(p.id), res(p.id)]));
  };
  // told: the rivals' losses are already told (a steal as magenta): only what it took from you is noted
  const others = (g, owner, told = false) => {
    const bits = [];
    for (const p of P) {
      if (p.id === owner || toldInGift(g, p.id)) continue;
      const lost = Object.entries(g.res[p.id]).filter(([, d]) => d < 0), got = Object.entries(g.res[p.id]).filter(([, d]) => d > 0);
      // the actor's own doing reads "from you 3 gold"; a member's reads as its changes ("Raider: you −3 followers")
      if (told) { /* said in the steal's line */ } else if (lost.length && owner === actor && g.cause && g.cause.kind !== 'member' && !got.length && !g.fol[p.id]) bits.push(`${lost.map(([r, d]) => `${-d} ${r}`).join(', ')} from ${nm(p.id)}`);
      else if (lost.length || got.length || g.fol[p.id]) bits.push(`${nm(p.id)} ${signedOf(g, p.id)}`);
      if (p.id === me) {
        const c = g.cause || {};
        const who = c.kind === 'member' && c.def ? defById(c.def)?.name : (c.kind === 'recruit' || c.kind === 'release') ? cardName(c.uid) : null;
        const why = who ? `${owner === actor || c.kind !== 'member' ? '' : `${P[owner].name}'s `}${who} took` : 'took';
        const what = [...lost.map(([r, d]) => `${-d} of your ${r}`), ...(g.fol[p.id] < 0 ? [`${-g.fol[p.id]} of your followers`] : [])];
        if (what.length) hits.push(`${why} ${what.join(', ')}`);
      }
    }
    // a rival's member exchanged for the shop's (or another rival's) is one swap, both named: "swapped your Recruiter
    // for the shop's Big Spender" (Cory's backlog: Red's shop swap told only the member that left)
    const paired = new Set();
    for (const m of g.moved) {
      if (paired.has(m) || m.from === owner || m.to === owner) continue;
      const back = g.moved.find(x => x !== m && !paired.has(x) && x.from === m.to && x.to === m.from);
      if (!back) continue;
      paired.add(m); paired.add(back);
      const [mine, theirs] = back.from === me || m.from === 'shop' ? [back, m] : [m, back];
      const line = `swapped ${whose(mine.from)} ${cardName(mine.uid)} for ${whose(theirs.from)} ${cardName(theirs.uid)}`;
      bits.push(line);
      if ((mine.from === me || theirs.from === me) && actor !== me) hits.push(line);
    }
    // a shop exchange tells what left first ("gave X to the shop, took the shop's Y"), whatever order the engine moved them
    for (const m of [...g.moved].sort((x, y) => (x.from === 'shop') - (y.from === 'shop'))) {
      if (paired.has(m)) continue;
      bits.push(m.to === owner ? `took ${whose(m.from)} ${cardName(m.uid)}` : m.from === owner ? `gave ${cardName(m.uid)} to ${nm(m.to)}` : `${cardName(m.uid)}: ${nm(m.from)} → ${nm(m.to)}`);
      if (m.from === me && m.to !== me && actor !== me) hits.push(`took your ${cardName(m.uid)}`);
    }
    return bits;
  };
  for (const g of ordered) {
    const c = g.cause || {};
    if (g.key === 'space') {
      const as = stolen(g, actor);
      const mine = as || signedOf(g, actor);
      if (mine) { gain = mine; out.push(mine); }
      out.push(...others(g, actor, !!as));
      if (g.disc) out.push(`next member costs ${g.disc} less`);
    } else if (c.kind === 'member') {
      const owner = c.pid ?? actor;
      const def = c.def ? defById(c.def) : null;
      const label = `${owner === actor ? '' : `${whose(owner)} `}${def ? def.name : cardName(c.uid)}`;
      const as = toldInGift(g, owner) ? null : stolen(g, owner);
      const bits = [as || (toldInGift(g, owner) ? '' : signedOf(g, owner)), ...others(g, owner, !!as)].filter(Boolean);
      if (g.disc) bits.push(`next member costs ${g.disc} less`);
      // one line per member (its parts joined with commas: the card splits lines on " · ")
      if (bits.length) out.push(`${label[0].toUpperCase()}${label.slice(1)}: ${bits.join(', ')}`);
    } else if (c.kind === 'recruit') {
      const paid = paidOf(g, actor);
      const line = `recruited ${cardName(c.uid)} (${paid ? `paid ${paid}` : 'free'})`;
      // two same-named members in one turn read as one line, not the same line twice
      const k = out.indexOf(line);
      if (k >= 0) out[k] = line.replace(/^recruited (.+) \(/, 'recruited $1 twice (');
      else out.push(line);
      out.push(...others(g, actor));
    } else if (c.kind === 'buy') {
      const n = g.fol[actor];
      out.push(`bought ${fword(n)} (paid ${paidOf(g, actor) || 'nothing'})`);
      out.push(...others(g, actor));
    } else if (c.kind === 'release') {
      const back = Object.entries(g.res[actor]).filter(([, d]) => d > 0).map(([r, d]) => `${d} ${r}`).join(', ');
      out.push(`released ${cardName(c.uid)}${back ? ` for ${back}` : ''}`);
    }
  }
  // what you got leads, right after the space's own result (the turn card shows its first lines; the rest fold)
  if (gift) out.splice(gain ? 1 : 0, 0, gift);
  // what only the log says (an extra turn, a member used, a switch): kept from the log's story
  for (const l of (base ? base.lines : [])) if ((/^(used |switched )/.test(l) || EXTRA_LINE.test(l)) && !out.includes(l) && !(base.head && l.startsWith('used ') && base.head.includes(` ${l}`))) out.push(l);
  if (!base && !out.length) return null;
  const hit = hits.join(', ');
  // a member changing hands names both and whose it was first ("took your Retinue, gave Broker"; w4 A#62: the strip said
  // "Swap Sides · bought 10" with no word of the swap)
  const swapLine = out.filter(l => /^(took (your|the shop['’]s|\S+['’]s) |gave .+ to |swapped .+ for )/.test(l)).join(', ');
  const big = swapLine || out.find(l => /^(recruited|bought|traded|released) /.test(l) || EXTRA_LINE.test(l));
  const conv = base && base.conv && base.conv.length ? base.conv : [];
  // the strip's one line: what hit you, then what you got, then the biggest thing the turn did
  const hitSaid = hit && !(big && big.includes(hit)) && !(gain && gain.includes('from you')) ? hit : null;
  const short = [hitSaid, gift || null, gain && conv.length ? `${gain} (${conv.join(', ')})` : gain, big && !(hitSaid && hitSaid.includes(big)) && big.replace(/ \((paid .*|free)\)$/, '')].filter(Boolean).slice(0, 2).join(' · ');
  const head = base ? base.head : (actor === me ? 'You' : P[actor].name);
  const touched = base ? base.touched : [];
  return { ...(base || {}), text: [head, ...out].join(' · '), head, lines: out, actor, touched, short, hit, gift, fx: true };
}

/** Who won a finished game: most followers, members breaking a follower tie (the rule; Results ranks the same way). */
export function finalWinners(state) {
  const ids = state.ranking || state.players.map(p => p.id);
  const key = id => `${engineFollowers(state, state.players[id])}|${memberCount(state, state.players[id])}`;
  return ids.filter(id => key(id) === key(ids[0]));
}
