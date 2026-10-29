// Launderers (Cory, 2026-10-29: "should let me rearrange colors as i please, not all to one color"): the card sets any
// mix with − and +, keeps the total, and Done answers the engine's steps for that mix, one after another.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { applyMove } from '../../../engine/v4/index.js';
import { take } from '../../engine/v4/helpers.js';
import { sceneQ, buy } from '../../engine/v4/cards-helpers.js';
import LaunderCard, { launderChoice, launderStep } from '../../../v4/game/LaunderCard.jsx';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const recruited = () => buy(take(sceneQ({ res: [{ gold: 4, red: 3, blue: 2, green: 1 }], shop: ['benders.launderer'] }), 'gold.rush'), 'benders.launderer');

/** The card on a live table: each pick is a real move, and the card sees the new question. */
function table(s) {
  const picks = [];
  let view;
  const onPick = id => { picks.push(id); s = applyMove(s, { player: s.pending.player, option: id }); view.rerender(ui()); };
  const ui = () => (launderChoice(s, s.pending) ? <LaunderCard key="ld" state={s} onPick={onPick} busy={false} /> : <p>after</p>);
  view = render(ui());
  return { picks, now: () => s };
}
const row = c => document.querySelector(`[data-launder="${c}"]`);
const press = (c, step) => fireEvent.click(row(c).querySelector(`[data-step="${step}"]`));

describe('Launderers card', () => {
  it('any mix: lift some off, put them on other colors, Done answers each step', () => {
    vi.useFakeTimers();
    const s0 = recruited();
    const before = { ...s0.players[0].res };
    const total = Object.values(before).reduce((a, b) => a + b, 0);
    const t = table(s0);
    const done = screen.getByRole('button', { name: 'Done' });
    press('gold', '-'); press('gold', '-');
    expect(screen.getByRole('status').textContent).toMatch(/2 still to place/);
    expect(done.disabled).toBe(true);
    press('green', '+'); press('blue', '+');
    expect(done.disabled).toBe(false);
    fireEvent.click(done);
    for (let k = 0; k < 6; k++) act(() => { vi.advanceTimersByTime(200); });
    const want = { ...before, gold: before.gold - 2, green: before.green + 1, blue: before.blue + 1 };
    expect(t.now().players[0].res).toEqual(want);
    expect(Object.values(t.now().players[0].res).reduce((a, b) => a + b, 0)).toBe(total);
    expect(t.picks[0]).toBe('split');
    expect(screen.getByText('after')).toBeTruthy();
  });
  it('All puts everything on one color in one answer; Keep my colors keeps them', () => {
    const s0 = recruited();
    const total = Object.values(s0.players[0].res).reduce((a, b) => a + b, 0);
    let t = table(s0);
    fireEvent.click(screen.getByRole('button', { name: `All ${total} blue` }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(t.picks).toEqual(['color:blue']);
    expect(t.now().players[0].res.blue).toBe(total);
    cleanup();
    t = table(s0);
    fireEvent.click(screen.getByRole('button', { name: 'Keep my colors' }));
    expect(t.picks).toEqual(['keep']);
    expect(t.now().players[0].res).toEqual(s0.players[0].res);
  });
  it('a split step with no mix behind it (a reload mid-way) stays the plain question', () => {
    const s = applyMove(recruited(), { player: 0, option: 'split' });
    expect(launderChoice(s, s.pending)).toBe(false);
    expect(launderStep(s, s.pending, { gold: 0, red: 0, blue: 0, green: 0 }).id).toBe('amount:0');
  });
});
