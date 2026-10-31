// Saved hot-seat games stopped where P1 (the only person) is about to make a move that sends something to someone, for
// the travel gate (e2e/v4/travel.mjs): a steal (round I and round III), a gift (Kickback), a member taken (Poach), a
// ransom paid, and a member's Use. Each comes from real bot games (P1 played by the Normal bot until the moment), with
// the engine's own effect stream saying what must travel from where to where.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const prompt = s => (s.pending && s.pending.prompt) || '';
const fx = n => n.effects || [];
// kind → the table, and which of P1's moves it is: (state before, move, state after) → { from, to } of what travels
export const TRAVEL = {
  // a take: a rival's stack to yours (it may arrive as magenta)
  steal1: { q: ['gold', 'thieves', 'red', 'purple'], hit: (s, mv, n) => s.round === 1 && takeOf(n) },
  steal3: { q: ['gold', 'thieves', 'red', 'purple'], hit: (s, mv, n) => s.round === 3 && takeOf(n) },
  // a gift: Kickback's +1 gold to the rival you pick, from the space to their gold
  gift: { q: ['gold', 'red', 'blue', 'green'], hit: (s, mv, n) => /^Kickback: give/.test(prompt(s)) && (g => g && { from: g.from, to: g.to })(fx(n).find(e => e.type === 'gain' && e.to.pid !== 0)) },
  // a member taken: Poach, a rival's member to your crowd
  member: { q: ['gold', 'thieves', 'red', 'purple'], hit: (s, mv, n) => /^Poach: take which/.test(prompt(s)) && (e => e && { from: { kind: 'crowd', pid: e.from.pid }, to: { kind: 'member', pid: 0, uid: e.what.uid } })(fx(n).find(e => e.type === 'member-move' && e.to.pid === 0)) },
  // a ransom paid: your resources to the rival who holds your member (arriving as magenta)
  ransom: { q: ['gold', 'thieves', 'red', 'purple'], force: 'pay', hit: (s, mv, n) => /^Shake Down: pay /.test(prompt(s)) && mv.option === 'pay' && (g => g && { from: { kind: 'seat', pid: 0 }, to: g.to })(fx(n).find(e => e.type === 'gain' && e.to.pid !== 0)) },
  // a member's Use: what it gives flies from the member to your stack
  use: { q: ['gold', 'red', 'blue', 'green'], hit: (s, mv, n) => String(mv.option).startsWith('use:') && s.pending.kind === 'buy' && (g => g && { from: { kind: 'member', pid: 0, uid: g.cause.uid }, to: g.to })(fx(n).find(e => e.type === 'gain' && e.cause.kind === 'member' && e.to.pid === 0)) },
  // a member off the top of the deck (Walk-In): its card leaves the deck for your crowd
  walkin: { q: ['red', 'gold', 'blue', 'green'], hit: (s, mv, n) => (e => e && { from: { kind: 'pile' }, to: { kind: 'member', pid: 0, uid: e.what.uid } })(fx(n).find(e => e.type === 'recruit' && e.from.kind === 'pile' && e.to.pid === 0)) },
};
function takeOf(n) {
  const t = fx(n).find(e => e.type === 'transfer' && e.to.pid === 0);
  if (t) return { from: t.from, to: t.to };
  // a steal that arrives as magenta: a rival's pay and your gain under one cause
  const p = fx(n).find(e => e.type === 'pay' && e.from.pid !== 0 && e.from.kind === 'stack');
  // (two picks in one move pay and gain under one cause: pair the gain of the same color first)
  const gs = p ? fx(n).filter(e => e.type === 'gain' && e.to.pid === 0 && e.cause === p.cause) : [];
  const g = gs.find(e => e.to.r === p.from.r) || gs[0];
  return g ? { from: p.from, to: g.to } : null;
}

/** { save, moves (P1's options to click, in order), expect: { from, to }, after: the engine's state after the last } */
export function travelSave(kind) {
  const sc = TRAVEL[kind];
  for (let seed = 1; seed < 400; seed++) {
    let s = createGame({ seats: SEATS, seed, quadrants: sc.q });
    const rand = seededRandom(seed);
    const turn = [];
    for (let k = 0; k < 3000 && !s.over; k++) {
      let mv = chooseBotMove(s, rand);
      if (sc.force && s.pending && s.pending.player === 0 && /^Shake Down: pay /.test(prompt(s)) && s.pending.options.some(o => o.id === sc.force)) mv = { player: 0, option: sc.force };
      let n;
      try { n = applyMove(s, mv, { effects: true }); } catch { break; }
      if (s.pending && s.pending.player === 0) {
        // a counted pick (Collect Debts, Help Yourself) is clicked pick by pick: start at the first one
        if (s.pending.kind !== 'choose' || !turn.length || turn[turn.length - 1][0].pending.kind !== 'choose') turn.length = 0;
        turn.push([s, mv]);
        const hit = sc.hit(s, mv, n);
        if (hit) {
          const start = turn[0][0];
          start.build = buildStamp();
          return {
            seed, expect: hit, after: n, moves: turn.map(([, m]) => m.option),
            save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', quadrants: sc.q }, state: start, undo: null, savedAt: Date.now() },
          };
        }
      } else turn.length = 0;
      s = n;
    }
  }
  throw new Error(`travel-save: no game found for ${kind}`);
}
