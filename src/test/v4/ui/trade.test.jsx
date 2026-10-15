// The trade picker (Swap Sides, now on the gift card: GiftCard.jsx) keeps its buttons across table updates: a new state
// object with the same question must not rebuild them (a component defined inside render did, every ~2s even idle, and
// a slow click was lost). Its second row holds the engine's own ids once one of yours is picked.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../engine/v4/index.js';
import GiftCard from '../../../v4/game/GiftCard.jsx';
import { giftPick } from '../../../v4/game/boardPick.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];

/** A game at Ana's Swap Sides question: everyone holds members, Ana takes Swap Sides in round II. */
function tradeScene() {
  for (let seed = 1; seed < 60; seed++) {
    let s = createGame({ seats, seed, quadrants: ['gold', 'red', 'blue', 'green'] });
    const q = s.quadrants.indexOf('red');
    const i = quadrant('red').actions.findIndex(a => a.key === 'trade');
    for (let k = 0; k < 2000 && !s.over; k++) {
      if (s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.pending.options.some(o => o.id === `slot:${q}-${i}`)) {
        const t = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
        if (t.pending && t.pending.player === 0 && t.pending.options.length && t.pending.options.every(o => o.kind === 'trade')) return t;
      }
      s = applyMove(s, chooseBotMove(s, () => 0.4));
    }
  }
  return null;
}

describe('trade picker', () => {
  it('keeps the same buttons when the table re-renders with an equal state', () => {
    const s = tradeScene();
    expect(s, 'a Swap Sides question').not.toBeNull();
    const card = st => <GiftCard state={st} gift={giftPick(st, st.pending)} onFirst={() => {}} onAnswer={() => {}} busy={false} />;
    const { container, rerender } = render(card(s));
    const before = container.querySelector('.gift-card .gc-row[data-row="1"] .gc-member');
    expect(before).not.toBeNull();
    act(() => { rerender(card({ ...s })); });
    expect(container.querySelector('.gift-card .gc-row[data-row="1"] .gc-member')).toBe(before);
  });

  it('once one of yours is picked, their members answer with the engine\u2019s own ids', () => {
    const s = tradeScene();
    const a = s.pending.options[0].value[0];
    const { container } = render(<GiftCard state={s} gift={giftPick(s, s.pending, a)} onFirst={() => {}} onAnswer={() => {}} busy={false} />);
    const live = [...container.querySelectorAll('.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])')].map(e => e.dataset.option).sort();
    expect(live).toEqual(s.pending.options.filter(o => o.value[0] === a).map(o => o.id).sort());
    expect(container.querySelector(`.gift-card .gc-row[data-row="1"] .gc-member.chosen[data-uid="${a}"]`)).not.toBeNull();
  });
});
