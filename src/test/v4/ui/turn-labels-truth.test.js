// @vitest-environment node
// The seats' and the header's turn words agree with the engine's real next placer, for every viewer's seat (online,
// each guest computes its own words for its own seat from the same state).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, turnRail, actionAt } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../engine/v4/content/index.js';
import purple from '../../../engine/v4/content/purple.js';
import { seatTurns, turnPlaces } from '../../../v4/game/seats.js';
import { tableView } from '../../../v4/game/order.js';
import { promptFor, currentTurn, turnSequence } from '../../../v4/format.js';

registerQuadrant(purple);

const planned = s => (s.turns || []).length + s.queue.filter(t => t.t === 'turn').length;
const earlyN = s => (s.early && s.early.round === s.round ? s.early.moves.length : 0);
/** Who really places next (the next turn the engine starts this round), or undefined when the plan changed on the way
 *  (an extra turn granted, turns taken early) so no label could have known it; null when the round ends first. */
/** A turn skipped or moved up on the way (Hold Up on a turn already last, Right Away next to its own turn) changes the
 *  plan without moving any count above: read it from the log lines since s (the log is capped, so from s's last line). */
const moved = (s, t) => t.log.slice(t.log.lastIndexOf(s.log.at(-1)) + 1).some(l => / skips their next turn\.| takes (their next|an extra|\d+ extra)/.test(l));
function realNext(s, rand) {
  const r = s.round, n0 = (s.turns || []).length, p0 = planned(s), e0 = earlyN(s);
  let t = s;
  for (let g = 0; g < 400; g++) {
    t = applyMove(t, chooseBotMove(t, rand));
    if (t.round !== r || t.over) return null;
    // (a turn skipped on the way is a plan change too, even one already last in the order, which moves nothing)
    if ((t.turns || []).length > n0) return planned(t) === p0 && earlyN(t) === e0 && !moved(s, t) ? t.turns[n0] : undefined;
  }
  return undefined;
}

const TABLES = [
  { n: 3, q: ['gold', 'red', 'purple', 'green'] },
  { n: 4, q: ['gold', 'red', 'purple', 'green'] },
  { n: 2, q: ['purple', 'red', 'gold', 'green'] },
  // whoever can, takes Crunch Time at once (its turns moved up close the gaps between the others' turns: #98, #99)
  { n: 3, q: ['gold', 'red', 'purple', 'green'], crunch: true },
  { n: 4, q: ['gold', 'red', 'purple', 'green'], crunch: true },
];
/** The bot's move, or Crunch Time when the table forces it and it's open. */
function nextMove(s, rand, crunch) {
  if (crunch && s.pending?.kind === 'place') {
    const o = s.pending.options.find(x => x.kind === 'slot' && actionAt(s, x.q, x.i).name === 'Crunch Time');
    if (o) return { player: s.pending.player, option: o.id };
  }
  return chooseBotMove(s, rand);
}

/** A bot move that leaves Purple's other turn-moving spaces alone when anything else is open (so the round's shape
 *  is Crunch Time's alone). */
const MOVES = ['skip', 'holdup', 'again', 'lastcall'];
function plainBot(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  const moves = x => x.kind === 'slot' && x.q !== undefined && MOVES.includes(actionAt(s, x.q, x.i).key);
  const alt = o && moves(o) && s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !moves(x));
  return alt ? { player: m.player, option: alt.id } : m;
}

describe('turn labels agree with the engine', () => {
  // gaps closed per table, over its six seeds: which seed closes one moves with prices and bot buys (2026-10-18)
  const closedBy = {};
  for (const tb of TABLES) for (let seed = 1; seed <= 6; seed++) it(`${tb.n} players${tb.crunch ? ', Crunch Time taken' : ''}, seed ${seed}`, () => {
    let s = createGame({ seats: Array.from({ length: tb.n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: tb.q });
    const rand = seededRandom(seed * 7 + 1);
    let checked = 0, closedSeen = 0, viewSeen = 0;
    for (let step = 0; step < 3000 && !s.over; step++) {
      const pend = s.pending;
      if (s.round >= 1 && pend && s.current != null) {
        const nxt = realNext(s, seededRandom(seed * 1000 + step));
        const rail = turnRail(s);
        for (let me = 0; me < tb.n; me++) {
          const w = seatTurns(s, me)[me];
          if (!w) continue;
          // "your turn" only on the seat placing now
          if (w.kind === 'now') expect(s.current, `step ${step} me ${me}`).toBe(me);
          if (s.current === me && pend.player === me) expect(w.kind).toBe('now');
          // "→ right after this one" only on the seat that really places next
          if (nxt !== undefined && nxt !== null) {
            if (w.kind === 'soon') expect(nxt, `step ${step} me ${me} soon`).toBe(me);
            if (nxt === me && s.current !== me) expect(w.kind, `step ${step} me ${me}`).toBe('soon');
          }
          if (w.kind === 'done') expect(rail.next.includes(me) || s.current === me).toBe(false);
          // the header names the seat that is acting, for whoever is watching
          const pr = promptFor(s, pend.player === me);
          if (pr.who) expect(pr.who.id).toBe(pend.player);
        }
        // "X again (snake order)" only where the planned snake really turns on X: two of X's turns that sat side by
        // side in the round's plan, at the end of a pass
        if (pend.kind === 'place') {
          const t = currentTurn(s);
          // (a seat that took an extra turn this round is left out: its k-th turn is no longer its k-th planned one)
          // (from last round's end: an extra turn first, like Late Riser's, is logged before "Round … begins")
          const since = s.log.slice(Math.max(0, s.log.findLastIndex(l => /^Round \S+ ends\./.test(l))));
          const nm = s.players[pend.player].name;
          const hadExtra = since.some(l => l.startsWith(`${nm} takes`) && /extra turn/.test(l) || l.startsWith(`${nm}'s`) && /: (\S+ takes )?(an|\d+) extra turns?/.test(l));
          // (so is a seat that took its own turns early: its last turns moved up, so its k-th turn isn't its k-th planned)
          const tookEarly = s.early && s.early.round === s.round && s.early.moves.some(m => m.p === pend.player);
          if (t && t.again && t.kind === 'snake' && !t.early && !hadExtra && !tookEarly) {
            const done = s.turns.length; // this turn is s.turns[done - 1]
            const text = promptFor(s, false).text;
            // where the two turns sat in the plain snake (state.order: first pass, then the passes)
            const order = s.order, nP = s.players.length;
            const plan = []; // plain-snake positions of this player's turns taken so far, in order
            let mine = 0;
            for (let k = 0; k < done; k++) if (s.turns[k] === pend.player) mine++;
            for (let k = 0; k < order.length && plan.length < mine; k++) if (order[k] === pend.player) plan.push(k);
            const [a, b] = plan.slice(-2);
            const turnaround = b - a === 1 && b % nP === 0;
            if (turnaround) expect(text, `step ${step}`).toMatch(/snake order/);
            else {
              // the gap closed because a rival took turns early (or had one skipped): the header and the seat say so, never "snake order"
              expect(text, `step ${step}: plain snake had them at ${a} and ${b}`).not.toMatch(/snake order/);
              expect(text).toMatch(/took turns early|turn was skipped/);
              closedSeen++;
            }
          }
        }
        checked++;
      }
      const next = applyMove(s, nextMove(s, rand, tb.crunch));
      // the screen draws the newer physical state with the settled one's turn record while a move animates
      // (GameScreen: tableView): its turn words are the settled state's, for every viewer
      if (s.round >= 1 && next.round === s.round && !next.over) {
        const view = tableView(next, s);
        for (let me = 0; me < tb.n; me++) {
          const a = turnPlaces(view, me), b = turnPlaces(s, me);
          expect(a.order, `step ${step}`).toEqual(b.order);
          for (const p of s.players) expect([a.places[p.id]?.label, a.places[p.id]?.twice], `step ${step} seat ${p.id}`).toEqual([b.places[p.id]?.label, b.places[p.id]?.twice]);
          expect(seatTurns(view, me)[me]?.say).toBe(seatTurns(s, me)[me]?.say);
        }
        // and so are the reasons: snake turn, extra turn, a turn taken early, a gap closed by one
        const kinds = st => turnSequence(st).map(t => [t.pid, t.kind, t.early || null, t.closed ? t.closed.pid : null]);
        expect(kinds(view), `step ${step}`).toEqual(kinds(s));
        if (earlyN(next) !== earlyN(s)) viewSeen++;
      }
      s = next;
    }
    expect(checked).toBeGreaterThan(20);
    closedBy[tb.n + (tb.crunch ? 'c' : '')] = (closedBy[tb.n + (tb.crunch ? 'c' : '')] || 0) + closedSeen;
    if (tb.crunch) expect(viewSeen, 'a Crunch Time move is drawn mid-animation at least once').toBeGreaterThan(0);
  });
  for (const tb of TABLES.filter(t => t.crunch)) it(`${tb.n} players, Crunch Time taken: a forced Crunch Time table closes a gap at least once`, () => {
    expect(closedBy[tb.n + 'c'] || 0).toBeGreaterThan(0);
  });
});

describe('a gap closed by Crunch Time is said as such (Cory #98, #99)', () => {
  it('3 players, round III: A takes Crunch Time first, so B places twice in a row: never "snake order"', () => {
    // a seeded bot game with the A A A B C C B A A B C C B B C shape (seed 14 since Even Swap's +2 red (Oct 25) changed what bots buy)
    let s = createGame({ seats: Array.from({ length: 3 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 14, quadrants: ['gold', 'red', 'purple', 'green'] });
    const rand = seededRandom(14);
    while (!(s.round === 3 && s.pending?.kind === 'place')) s = applyMove(s, plainBot(s, rand));
    const [A, B] = s.order;
    s = applyMove(s, nextMove(s, rand, true)); // A takes Crunch Time: A A A B C C B A A B C C B B C, give or take extra turns
    // walk the round by what the turn record says, not by fixed turn numbers (bots' buys shift extra turns around)
    const step = () => { s = applyMove(s, plainBot(s, rand)); };
    const placing = () => s.round === 3 && s.pending?.kind === 'place';
    let plainSeen = false, pairSeen = false;
    while (s.round === 3 && !s.over && !pairSeen) {
      if (placing()) {
        const t = currentTurn(s);
        if (t?.again && t.kind === 'snake' && !t.closed && s.current !== A && !plainSeen) {
          // a plain snake turnaround still says snake order
          expect(promptFor(s, false).text).toMatch(/again \(snake order\)$/);
          plainSeen = true;
        }
        const seq = turnSequence(s), k = seq.findIndex(x => x.at !== 'done');
        if (s.current === B && seq[k + 1]?.pid === B && seq[k + 1]?.closed) {
          // B's first of the pair: A's last two turns moved up, closing B's gap
          expect(turnPlaces(s, B).places[B]).toMatchObject({ label: 'now', twice: true });
          expect(turnPlaces(s, B).places[B].title).toMatch(new RegExp(`Back to back because ${s.players[A].name} took turns early with Crunch Time\\.`));
          expect(turnPlaces(s, B).places[B].title).not.toMatch(/snake order/);
          expect(turnPlaces(s, s.order[2]).places[B].title).toMatch(new RegExp(`because ${s.players[A].name} took turns early`));
          expect(turnPlaces(s, A).places[B].title).toMatch(/because you took turns early with Crunch Time/);
          do step(); while (!placing() && s.round === 3);
          expect(s.current).toBe(B);
          expect(promptFor(s, false).text).toBe(`${s.players[B].name} again (${s.players[A].name} took turns early with Crunch Time)`);
          expect(promptFor(s, true).lead).toBe(`Your turn again (${s.players[A].name} took turns early with Crunch Time) — `);
          pairSeen = true;
          break;
        }
      }
      step();
    }
    expect(plainSeen).toBe(true);
    expect(pairSeen).toBe(true);
  });
});
