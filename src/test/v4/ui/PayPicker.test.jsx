// Payment picker: default preselected (one tap confirms), adjustable, Confirm only on a legal spend, Back works.
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

describe('v4 payment picker', { timeout: 30000 }, () => {
  it('preselects the default so one tap confirms; another way can be picked', () => {
    const state = findPayState();
    const me = state.pending.player;
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    const dlg = screen.getByRole('dialog');
    const ways = state.pending.options.filter(o => o.kind === 'pay');
    const def = ways.find(o => o.default);
    const confirm = within(dlg).getByRole('button', { name: 'Confirm' });
    expect(confirm.disabled).toBe(false);
    expect(confirm.getAttribute('data-option')).toBe(def.id);
    // pick another way from the quick list: Confirm now carries that option
    const quick = [...dlg.querySelectorAll('.way')].find(b => b.getAttribute('aria-pressed') === 'false');
    fireEvent.click(quick);
    const chosen = within(dlg).getByRole('button', { name: 'Confirm' }).getAttribute('data-option');
    expect(chosen).not.toBe(def.id);
    expect(ways.map(o => o.id)).toContain(chosen);
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
    // remove one coin of whatever the default spends: no longer pays the cost
    const def = state.pending.options.find(o => o.default);
    const color = state.resources.find(r => def.spend[r] > 0);
    fireEvent.click(within(dlg).getByRole('button', { name: `One less ${color}` }));
    expect(within(dlg).getByRole('button', { name: 'Confirm' }).disabled).toBe(true);
  });
});

describe('how to play', () => {
  it('renders the rulebook text and closes', () => {
    const onClose = vi.fn();
    render(<HowToPlay onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Patrons — How to play' })).toBeTruthy();
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(3);
    expect(RULEBOOK).toBe(readFileSync('design/rulebook.md', 'utf8'));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
