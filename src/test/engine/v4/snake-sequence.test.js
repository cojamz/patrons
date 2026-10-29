// @vitest-environment node
// The round's real turn sequence against the plain snake when one seat takes turns out of it (3 players, Purple table).
// Cory's play notes #98/#99 (2026-10-17): "the middle player went twice?" after Crunch Time.
// - An extra turn (Go-Getter, Night Owl, Errand Runner, Taskmaster, Late Riser) is a turn put in: everyone else keeps
//   the plain snake, untouched.
// - Crunch Time ("Take your next 2 turns right away", Cory 2026-10-15) moves your own last two turns of the round up (Cory, 2026-10-21: it shouldn't skip your next turns). Nobody gains
//   or loses a turn, everyone else keeps their order, but the gaps those two turns left close: a seat that never places
//   twice in a row in the plain snake (the middle seat) can now. That is the rule, not a reshuffle.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, contextFor, actionAt } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../engine/v4/content/index.js';
import purple, { extraTurns } from '../../../engine/v4/content/purple.js';

registerQuadrant(purple);
const Q = ['gold', 'red', 'purple', 'green'];
const L = 'ABC'; // A, B, C: the round's first pass (A picks first)

function toRound(r, seed = 11) {
  let s = createGame({ seats: Array.from({ length: 3 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q });
  const rand = seededRandom(seed);
  while (!(s.round === r && s.pending?.kind === 'place')) s = applyMove(s, botMove(s, rand));
  return { s, rand };
}
/** Plays the round out; onTurn may answer the first decision of a turn. Returns who started each turn, in order. */
function playRound(s, rand, onTurn) {
  const r = s.round, seq = [];
  let seen = -1;
  for (let g = 0; g < 2000 && s.round === r && !s.over; g++) {
    if (s.pending?.kind === 'place' && s.turns.length !== seen) {
      seen = s.turns.length;
      seq.push(s.pending.player);
      const t = onTurn?.(s);
      if (t) { s = t; continue; }
    }
    s = applyMove(s, botMove(s, rand));
  }
  return seq;
}
/** A bot move, minus Purple's turn-moving spaces (Sleep In, Hold Up, Right Away, Last Call, and Crowd In's extra minion; these tests count the plain snake against Crunch Time). */
function botMove(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  if (o?.kind === 'slot' && o.q !== undefined && ['skip', 'holdup', 'again', 'lastcall', 'crowdin'].includes(actionAt(s, o.q, o.i).key)) {
    const alt = s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !['skip', 'holdup', 'again', 'lastcall', 'crowdin'].includes(actionAt(s, x.q, x.i).key));
    if (alt) return { player: m.player, option: alt.id };
  }
  return m;
}
const letters = (base, seq) => seq.map(p => L[base.indexOf(p)]).join(' ');
const others = (seq, who) => seq.filter(p => p !== who);

describe('snake vs real sequence, 3 players, one seat taking turns out of it', () => {
  const crunch = at => {
    // seed 21: no seat's members hand out an extra turn in this round III (seeds 11, 12, 14, 15 to 18 and, after the Oct 29 prices, 19 and 20 did)
    const { s, rand } = toRound(3, 21);
    const base = s.order.slice(0, 3), who = base[at];
    const seq = playRound(s, rand, st => {
      if (st.pending.player !== who || st.turns.filter(p => p === who).length !== 1) return null;
      const o = st.pending.options.find(x => x.kind === 'slot' && actionAt(st, x.q, x.i).name === 'Crunch Time');
      return o ? applyMove(st, { player: who, option: o.id }) : null;
    });
    return { base, who, plain: s.order, seq };
  };
  it('Crunch Time on the first seat\'s first turn (round III): its last two turns move up, so the middle seat places twice in a row at the end', () => {
    const { base, who, plain, seq } = crunch(0);
    console.log(`Crunch Time, seat A\n  plain : ${letters(base, plain)}\n  actual: ${letters(base, seq)}`);
    expect(letters(base, plain)).toBe('A B C C B A A B C C B A A B C');
    expect(letters(base, seq)).toBe('A A A B C C B A A B C C B B C');
    // same placements per seat, everyone else's order untouched
    expect([...seq].sort()).toEqual([...plain].sort());
    expect(others(seq, who)).toEqual(others(plain, who));
  });
  it('Crunch Time on the middle seat\'s first turn: its last two turns move up and the rest of the order stays', () => {
    const { base, who, plain, seq } = crunch(1);
    console.log(`Crunch Time, seat B\n  plain : ${letters(base, plain)}\n  actual: ${letters(base, seq)}`);
    expect(letters(base, seq)).toBe('A B B B C C B A A B C C A A C');
    expect(others(seq, who)).toEqual(others(plain, who));
  });
  for (const at of [0, 1]) it(`an extra turn (Go-Getter) for seat ${L[at]} in round II goes in; nobody else moves`, () => {
    const { s, rand } = toRound(2, 16);
    const base = s.order.slice(0, 3), who = base[at];
    let done = false;
    const seq = playRound(s, rand, st => {
      if (done || st.pending.player !== who) return null;
      done = true;
      expect(extraTurns(contextFor(st), st.players[who], 1, 'Go-Getter')).toBe(1);
      return null;
    });
    console.log(`Go-Getter, seat ${L[at]}\n  plain : ${letters(base, s.order)}\n  actual: ${letters(base, seq)}`);
    expect(letters(base, seq)).toBe(at === 0 ? 'A A B C C B A A B C C B A' : 'A B B C C B A A B C C B A');
    expect(seq.length).toBe(s.order.length + 1);
    // take the inserted turn out (right after the seat's first) and it's the plain snake
    const back = [...seq]; back.splice(seq.indexOf(who) + 1, 1);
    expect(back).toEqual(s.order);
  });
});
