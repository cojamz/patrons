// Every choice put to a person can be answered by a click (QA stall hunt, 2026-10-15). The board picker (boardPick.js)
// moves a choice's answers onto the board and keeps the list for the keyboard only, so an answer with no clickable
// place on the board is one a mouse can't give: the game stands still (tables e2e, market-echo).
//  - every engine option is reachable: lit on the board in some step, or a button by the caption;
//  - a pair's second step always lights a real answer, never only "put it back" or "switch yours";
//  - a lit member is never folded into a chair's "+N" (CultSeat), where nothing can be clicked.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, cardDef } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { boardPicker, seatPart } from '../../../v4/game/boardPick.js';
import CultSeat from '../../../v4/game/CultSeat.jsx';

afterEach(cleanup);

// the e2e tables between them seat every newer sphere, and the pairs (red's swaps, yellow, silver)
const TABLES = [['gold', 'red', 'market', 'echo'], ['gold', 'thieves', 'purple', 'silver'], ['red', 'trading', 'yellow', 'echo'], ['yellow', 'market', 'thieves', 'trading']];
const seats = n => Array.from({ length: n }, (_, k) => ({ name: `P${k + 1}`, kind: 'human' }));

/** What's wrong with the picker for this choice (strings), [] when every answer has a click. */
function unreachable(state) {
  const pend = state.pending;
  const pk = boardPicker(state, pend, null);
  if (!pk) return []; // no board picker: the whole list is buttons
  const engine = new Set(pend.options.map(o => o.id));
  const reach = new Set(), bad = [];
  const steps = [pk, ...(pk.combo ? pk.combo.firsts.map(f => boardPicker(state, pend, f)) : [])];
  for (const s of steps) {
    // a step the picker gives up on (two answers on one thing) is shown as the full list
    if (!s) { engine.forEach(id => reach.add(id)); continue; }
    for (const o of s.options) if (o.kind !== 'first' && !engine.has(o.id)) bad.push(`${o.id} is not an answer the engine offers`);
    // a choice of a player lights rival chairs only: your own chair has no button
    for (const [key, o] of s.where) if (key === `seat:${pk.actor}` && o.kind !== 'first') bad.push(`${o.id} names your own chair, which has no button`);
    const real = s.options.filter(o => o.kind !== 'first');
    if (s.combo && s.combo.chosen != null && !real.length) bad.push(`the second step (after ${s.combo.chosen}) lights nothing to answer with`);
    real.forEach(o => reach.add(o.id));
  }
  for (const id of engine) if (!reach.has(id)) bad.push(`${id} has no click (not lit in any step, not a button)`);
  return bad.map(b => `${pend.prompt}: ${b}`);
}

describe('the board picker leaves no answer without a click', () => {
  for (const q of TABLES) {
    it(`${q.join(',')}: random legal play, every choice`, () => {
      const problems = new Set();
      let choices = 0;
      for (const seed of [11, 12, 13]) {
        const rand = seededRandom(seed * 7919);
        let s = createGame({ seats: seats(seed % 2 ? 4 : 3), seed, quadrants: q });
        for (let k = 0; k < 4000 && s.pending && !s.over; k++) {
          if (s.pending.kind === 'choose') { choices++; unreachable(s).forEach(p => problems.add(p)); }
          // half the moves random (branches bots avoid), half a bot's (members, so swaps and steals come up)
          const opts = s.pending.options;
          const move = rand() < 0.5 ? { player: s.pending.player, option: opts[Math.floor(rand() * opts.length)].id } : chooseBotMove(s, rand);
          s = applyMove(s, move);
        }
      }
      expect(choices).toBeGreaterThan(0);
      expect([...problems]).toEqual([]);
    });
  }
});

describe('CultSeat: a lit member is never folded into "+N"', () => {
  it('a chair with more member kinds than fit still shows the one the picker lights, with its button', () => {
    let s = createGame({ seats: seats(3), seed: 5, quadrants: TABLES[0] });
    for (let k = 0; k < 400 && !(s.pending && s.pending.kind === 'place' && s.round >= 1); k++) s = applyMove(s, chooseBotMove(s, () => 0.3));
    // twelve different members on P2's chair: more kinds than a chair shows before "+N"
    const kinds = new Map();
    for (const c of Object.values(s.cards)) if (!kinds.has(c.def) && s.shop.indexOf(c.uid) < 0) kinds.set(c.def, c.uid);
    const uids = [...kinds.values()].slice(0, 12);
    s.pile = s.pile.filter(u => !uids.includes(u));
    s.players[1].members.push(...uids);
    // the picker lights the one the chair shows last (grouped by color in table order, off-table colors after)
    const at = u => { const i = s.quadrants.indexOf(cardDef(s, u).quadrant); return i < 0 ? s.quadrants.length : i; };
    const last = uids.reduce((b, u) => (at(u) >= at(b) ? u : b), uids[0]);
    const o = { id: `take:${last}`, label: 'that one', kind: 'member', value: last, target: { uid: last } };
    s.pending = { player: 0, kind: 'choose', prompt: 'Hand-pick: which member?', options: [o] };
    const pk = boardPicker(s, s.pending);
    const part = seatPart(s, pk, 1);
    const { container } = render(<CultSeat state={s} pid={1} me={0} pick={{ ...part, title: pk.title, onPick: () => {}, onDenied: () => {} }} />);
    expect(container.querySelector('.cs-more'), 'the chair folds some members').not.toBeNull();
    expect(container.querySelector(`.cs-pick-member[data-option="take:${last}"]`), 'the lit member has its button').not.toBeNull();
  });
});
