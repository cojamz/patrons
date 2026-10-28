// The swap card identifies actual holders: the actor need not own either member.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { createGame, cardDef, quadrant } from '../../../engine/v4/index.js';
import GiftCard from '../../../v4/game/GiftCard.jsx';
import { giftPick } from '../../../v4/game/boardPick.js';
import { panelText } from '../../../v4/game/panelText.js';

afterEach(cleanup);
function scene() {
  const s = createGame({ seed: 53, seats: ['Ana', 'Bo', 'Cy'].map(name => ({ name, kind: 'human' })), quadrants: ['gold', 'red', 'purple', 'echo'] });
  const [a, b, c] = s.shop.splice(0, 3);
  s.players[1].members.push(a);
  s.players[2].members.push(b);
  s.shop.push(c);
  s.pending = { kind: 'choose', player: 0, prompt: 'Even Swap: swap any two equal-cost members', options: [
    { kind: 'trade', id: `trade:${a}:${b}`, value: [a, b] },
    { kind: 'trade', id: `trade:${a}:${c}`, value: [a, c] },
    { kind: 'trade', id: `trade:${b}:${a}`, value: [b, a] },
    { kind: 'trade', id: `trade:${c}:${a}`, value: [c, a] },
  ] };
  return { s, a, b, c };
}
const view = (s, first = null, onAnswer = () => {}) => <GiftCard state={s} gift={giftPick(s, s.pending, first)} onFirst={() => {}} onAnswer={onAnswer} busy={false} />;

describe('trade picker', () => {
  it('keeps the same buttons when the table re-renders with an equal state', () => {
    const { s } = scene();
    const { container, rerender } = render(view(s));
    const before = container.querySelector('.gift-card .gc-row[data-row="1"] .gc-member');
    expect(before).not.toBeNull();
    act(() => { rerender(view({ ...s })); });
    expect(container.querySelector('.gift-card .gc-row[data-row="1"] .gc-member')).toBe(before);
  });

  it('groups rival cults and the shop without claiming ownership', () => {
    const { s, a, b, c } = scene();
    const { container, getByRole } = render(view(s));
    for (const [uid, who] of [[a, 'Bo'], [b, 'Cy'], [c, 'Shop']]) {
      expect(container.querySelector(`.gc-row[data-row="1"] [data-uid="${uid}"]`).getAttribute('aria-label')).toBe(`${who}: ${cardDef(s, uid).name}`);
    }
    expect(getByRole('group').textContent).not.toContain('Yours');
    expect(container.querySelectorAll('.gc-row[data-row="2"] .gc-member:not([disabled])')).toHaveLength(0);
  });

  it('answers rival-to-rival and rival-to-shop swaps with exact engine option ids', () => {
    const { s, a, b, c } = scene(), answer = vi.fn();
    const { container } = render(view(s, a, answer));
    const live = [...container.querySelectorAll('.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])')].map(e => e.dataset.option).sort();
    expect(live).toEqual(s.pending.options.filter(o => o.value[0] === a).map(o => o.id).sort());
    expect(container.querySelector(`.gift-card .gc-row[data-row="1"] .gc-member.chosen[data-uid="${a}"]`)).not.toBeNull();
    fireEvent.click(container.querySelector(`.gc-row[data-row="2"] [data-uid="${b}"]`));
    expect(answer.mock.calls[0][0]).toBe(`trade:${a}:${b}`);
    fireEvent.click(container.querySelector(`.gc-row[data-row="2"] [data-uid="${c}"]`));
    expect(answer.mock.calls[1][0]).toBe(`trade:${a}:${c}`);
    expect(container.querySelector('.gc-what').textContent).not.toContain('your');
  });

  it('keeps Promote and Demote ownership neutral and shows the new limits', () => {
    const { s, a, c } = scene();
    for (const title of ['Promote', 'Demote']) {
      s.pending = { ...s.pending, prompt: `${title}: swap a member with one in the shop`, options: [{ kind: 'trade', id: `trade:${a}:${c}`, value: [a, c] }] };
      expect(giftPick(s, s.pending).head).toBe(`${title} a member`);
      // Panel asks in its own name (release QA, Oct 28: its Demote read "Swap any two equal-cost members")
      s.pending = { ...s.pending, prompt: `Panel: ${title.toLowerCase()} another member` };
      expect(giftPick(s, s.pending).head).toBe(`${title} a member`);
    }
    expect(panelText('red', quadrant('red').actions.find(a => a.key === 'hireup')).second).toBe('shop cost up to 2 more');
    expect(panelText('red', quadrant('red').actions.find(a => a.key === 'trade')).second).toBe('shop cost at least 2 less');
    expect([1, 2, 3].map(r => panelText('red', { key: 'turnout' }, r).main)).toEqual(['+3 red', '+4 red', '+5 red']);
  });
});
