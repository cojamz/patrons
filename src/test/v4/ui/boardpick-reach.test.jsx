// Every choice put to a person can be answered by a click (QA stall hunt, 2026-10-15). The board picker (boardPick.js)
// moves a choice's answers onto the board and keeps the list for the keyboard only, so an answer with no clickable
// place on the board is one a mouse can't give: the game stands still (tables e2e, market-echo).
//  - every engine option is reachable: lit on the board in some step, or a button by the caption;
//  - a gift or a pair (the gift card, GiftCard.jsx) answers every engine option in some step, its second row always
//    holds a real answer once a first is picked, and its answers are the engine's own ids;
//  - a lit member is never folded into a chair's "+N" (CultSeat), where nothing can be clicked.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, cardDef } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { boardPicker, giftPick, seatPart } from '../../../v4/game/boardPick.js';
import CultSeat from '../../../v4/game/CultSeat.jsx';

afterEach(cleanup);

// the e2e tables between them seat every newer sphere, and the pairs (red's swaps, yellow, silver)
const TABLES = [['gold', 'red', 'market', 'echo'], ['gold', 'thieves', 'purple', 'silver'], ['red', 'trading', 'yellow', 'echo'], ['yellow', 'market', 'thieves', 'trading']];
const seats = n => Array.from({ length: n }, (_, k) => ({ name: `P${k + 1}`, kind: 'human' }));

/** What's wrong with the picker for this choice (strings), [] when every answer has a click. */
function unreachable(state) {
  const pend = state.pending;
  const engine = new Set(pend.options.map(o => o.id));
  const reach = new Set(), bad = [];
  // the gift card: each first picked in turn, its second row and the rest buttons
  const g = giftPick(state, pend);
  if (g) {
    // a gift (its color fixed), a color of yours (one row), and the asks from far away (a steal, a recruit from the row,
    // a minion's move: one row) have no first to pick: the card as it opens is the step
    const steps = ['gift', 'color', 'steal', 'recruit', 'move'].includes(g.kind) ? [g] : g.firsts.map(f => giftPick(state, pend, f.a));
    for (const s of steps) {
      if (!s.seconds.length) bad.push(`the second row (after ${s.chosen}) holds nothing to answer with`);
      for (const { o, b } of s.seconds) {
        if (!engine.has(o.id)) bad.push(`${o.id} is not an answer the engine offers`);
        if (!s.others.includes(b)) bad.push(`${o.id} pairs with ${b}, which the quiet second row never shows`);
        reach.add(o.id);
      }
    }
    for (const o of g.rest) reach.add(o.id);
    if (g.kind === 'gift' && g.seconds.some(x => x.b === pend.player)) bad.push('a gift offers your own face');
    if (g.kind === 'steal' && g.seconds.some(x => x.o.target.pid === pend.player)) bad.push('a steal offers your own stack');
    // what the card shows is what the engine offers: every steal stack on the card is an answer (and none is missing)
    if (g.kind === 'steal') for (const r of g.rivals) for (const st of r.stacks) if (!engine.has(st.o.id)) bad.push(`the card's ${st.o.id} is not an engine answer`);
    for (const id of engine) if (!reach.has(id)) bad.push(`${id} has no click on the gift card`);
    return bad.map(b => `${pend.prompt}: ${b}`);
  }
  const pk = boardPicker(state, pend);
  if (!pk) return []; // no board picker: the whole list is buttons
  for (const s of [pk]) {
    // a step the picker gives up on (two answers on one thing) is shown as the full list
    if (!s) { engine.forEach(id => reach.add(id)); continue; }
    for (const o of s.options) if (!engine.has(o.id)) bad.push(`${o.id} is not an answer the engine offers`);
    // a choice of a player lights rival chairs only: your own chair has no button
    for (const [key, o] of s.where) if (key === `seat:${pk.actor}`) bad.push(`${o.id} names your own chair, which has no button`);
    s.options.forEach(o => reach.add(o.id));
  }
  for (const id of engine) if (!reach.has(id)) bad.push(`${id} has no click (not lit in any step, not a button)`);
  return bad.map(b => `${pend.prompt}: ${b}`);
}

describe('the board picker leaves no answer without a click', () => {
  for (const q of TABLES) {
    it(`${q.join(',')}: random legal play, every choice`, () => {
      const problems = new Set();
      let choices = 0;
      for (const seed of [11, 12]) {
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
  it('two copies of one space (a taker and a Squatter) stay on the board: the better lit, the other a button (w4 skeptic #3)', () => {
    const s = createGame({ seats: seats(4), seed: 2, quadrants: ['gold', 'echo', 'red', 'trading'] });
    const pend = { kind: 'choose', player: 0, prompt: 'Encore: copy which space?', options: [
      { id: 'space:e:a', kind: 'space', value: '0-1', hint: 3, label: 'Rush (P2): +2 gold', target: { space: '0-1' } },
      { id: 'space:e:b', kind: 'space', value: '0-1#2', hint: 5, label: 'Rush (P3): +2 gold', target: { space: '0-1' } },
      { id: 'space:e:c', kind: 'space', value: '2-0', hint: 1, label: 'Turnout (P4): +1 red', target: { space: '2-0' } },
    ] };
    const pk = boardPicker(s, pend, null);
    expect(pk).not.toBeNull();
    expect(pk.spaces.get('0-1')).toBe('space:e:b');
    expect(pk.rest.map(o => o.id)).toEqual(['space:e:a']);
  });

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
    // A member picker expands the crowd so every offered member stays reachable.
    expect(container.querySelectorAll('.cs-member').length).toBe(uids.length);
    expect(container.querySelector(`.cs-pick-member[data-option="take:${last}"]`), 'the lit member has its button').not.toBeNull();
  });
});
