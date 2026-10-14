// Payment picker: default preselected (one tap confirms), adjusted by tapping coins in and out, Confirm only on a
// legal spend, Back works.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';
import HowToPlay from '../../../v4/HowToPlay.jsx';
import { RULEBOOK } from '../../../v4/rulebook.js';
import { readFileSync } from 'node:fs';

afterEach(cleanup);

const session = (state, mySeats) => ({
  getState: () => state, subscribe: () => () => {}, submit: vi.fn(() => Promise.resolve(state)),
  mySeats, info: { mode: 'local', seats: [], version: 1 }, destroy() {},
});

/** Play bot games until some buy option leads to a 'pay' question with 2+ ways. */
let payCache = null;
function findPayState() {
  if (payCache) return payCache;
  return (payCache = searchPayState());
}
function searchPayState() {
  for (let seed = 1; seed < 60; seed++) {
    let s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }, { kind: 'bot' }], seed });
    for (let k = 0; k < 400 && !s.over; k++) {
      if (s.pending.kind === 'buy') {
        for (const o of s.pending.options.filter(x => x.kind === 'card' || x.kind === 'tier')) {
          const t = applyMove(s, { player: s.pending.player, option: o.id });
          if (t.pending && t.pending.kind === 'pay' && t.pending.options.filter(x => x.kind === 'pay').length >= 2) return t;
        }
      }
      s = applyMove(s, chooseBotMove(s, () => 0.5));
    }
  }
  throw new Error('no pay state found');
}

describe('v4 payment picker', () => {
  it('preselects the default so one tap confirms; tapping a resource swaps it in for another legal way', () => {
    const state = findPayState();
    const me = state.pending.player;
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    const dlg = screen.getByRole('dialog');
    const res = state.resources;
    const ways = state.pending.options.filter(o => o.kind === 'pay');
    const def = ways.find(o => o.default);
    const confirm = within(dlg).getByRole('button', { name: 'Confirm' });
    expect(confirm.disabled).toBe(false);
    expect(confirm.getAttribute('data-option')).toBe(def.id);
    expect(dlg.querySelector('[data-pay-status]').textContent).toMatch(/Paid in full/);
    // the cost shows one coin per resource spent
    expect(dlg.querySelectorAll('[data-pay-coin]').length).toBe(res.reduce((n, r) => n + def.spend[r], 0));
    // a swap the engine allows: one more of r, one less of the most-spent other color
    const ids = new Set(ways.map(o => o.id));
    const id = v => `pay:${res.map(r => v[r] || 0).join('-')}`;
    const r = res.find(c => state.players[me].res[c] > def.spend[c]
      && res.some(y => y !== c && def.spend[y] > 0 && ids.has(id({ ...def.spend, [c]: def.spend[c] + 1, [y]: def.spend[y] - 1 }))));
    expect(r).toBeTruthy();
    fireEvent.click(dlg.querySelector(`[data-pay-add="${r}"]`));
    const chosen = within(dlg).getByRole('button', { name: 'Confirm' }).getAttribute('data-option');
    expect(chosen).not.toBe(def.id);
    expect(ids.has(chosen)).toBe(true);
    fireEvent.click(within(dlg).getByRole('button', { name: 'Confirm' }));
    expect(ss.submit).toHaveBeenCalledWith({ player: me, option: chosen });
  });

  it('Back returns to the buy step', () => {
    const state = findPayState();
    const me = state.pending.player;
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Back' }));
    expect(ss.submit).toHaveBeenCalledWith({ player: me, option: 'back' });
  });

  it('Confirm is disabled when the spend does not match a legal way', () => {
    const state = findPayState();
    render(<GameScreen session={session(state, [state.pending.player])} />);
    const dlg = screen.getByRole('dialog');
    // take one coin back out of the cost: no longer pays it, and the slot says so
    const def = state.pending.options.find(o => o.default);
    const color = state.resources.find(r => def.spend[r] > 0);
    fireEvent.click(dlg.querySelector(`[data-pay-coin="${color}"]`));
    expect(within(dlg).getByRole('button', { name: 'Confirm' }).disabled).toBe(true);
    expect(dlg.querySelector('[data-pay-status]').textContent).toMatch(/1 more to pay/);
    // tap that color in your resources: it goes back in, and the cost is paid again
    fireEvent.click(dlg.querySelector(`[data-pay-add="${color}"]`));
    expect(within(dlg).getByRole('button', { name: 'Confirm' }).getAttribute('data-option')).toBe(def.id);
    expect(dlg.querySelector('[data-pay-status]').textContent).toMatch(/Paid in full/);
  });
});

describe('how to play', () => {
  it('renders the rulebook text and closes', () => {
    const onClose = vi.fn();
    render(<HowToPlay onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Cults — How to play' })).toBeTruthy();
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(3);
    expect(RULEBOOK).toBe(readFileSync('design/rulebook.md', 'utf8'));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
