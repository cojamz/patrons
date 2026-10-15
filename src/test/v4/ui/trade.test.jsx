// The trade picker (Swap Sides) keeps its buttons across table updates: a new state object with the same question
// must not rebuild them (a component defined inside render did, every ~2s even idle, and a slow click was lost).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../engine/v4/index.js';
import { ChoicePrompt } from '../../../v4/game/parts.jsx';

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
    const { container, rerender } = render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />);
    const before = container.querySelector('.trade .btn.rich');
    expect(before).not.toBeNull();
    act(() => { rerender(<ChoicePrompt state={{ ...s }} onPick={() => {}} busy={false} />); });
    expect(container.querySelector('.trade .btn.rich')).toBe(before);
  });
});
