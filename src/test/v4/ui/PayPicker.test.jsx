// Paying (dialogs pod, 2026-10-15): the cost as sockets at the engine's price, the default way already in (one tap
// pays), a stack click or a coin click swaps to the nearest other legal way (the payment never goes short), every
// rule-changer named in a line, Cancel goes back, and a single way to pay skips the dialog.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, memberPrice, TIERS } from '../../../engine/v4/index.js';
import { resume } from '../../../engine/v4/core.js';
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

const payIds = st => st.pending.options.filter(o => o.kind === 'pay');
const vec = (st, id) => Object.fromEntries(id.slice(4).split('-').map((n, i) => [st.resources[i], Number(n)]));

describe('v4 payment picker', () => {
  it('lifts the engine’s default coins off your stacks (one tap pays) and a stack click swaps a coin in', () => {
    const state = findPayState();
    const me = state.pending.player;
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    const dlg = screen.getByRole('dialog');
    const res = state.resources;
    const ways = payIds(state);
    const def = ways.find(o => o.default);
    // the coins lifted off your stacks pay the engine's price (memberPrice for a member, the tier's cost for followers)
    const p = state.players[me];
    const units = state.pending.uid !== undefined ? memberPrice(state, p, state.pending.uid).total : TIERS.find(t => t.key === state.pending.tier).cost;
    expect(res.reduce((n, r) => n + def.spend[r], 0)).toBeGreaterThanOrEqual(Math.ceil(units / 2));
    expect(dlg.querySelectorAll('[data-socket]').length).toBe(0); // no second row of the same coins (wave-2 tester A)
    const pay = dlg.querySelector('.pay-go');
    expect(pay.disabled).toBe(false);
    expect(pay.getAttribute('data-option')).toBe(def.id);
    // one lifted coin per resource the default spends, and Pay names them
    expect(dlg.querySelectorAll('.ps-out .ps-coin').length).toBe(res.reduce((n, r) => n + Math.min(12, def.spend[r]), 0));
    expect(pay.dataset.payTotal).toBe(res.filter(r => def.spend[r] > 0).map(r => `${def.spend[r]}${r}`).join(' '));
    // a stack whose color can go in for another: the payment moves to the nearest legal way with one more of it
    const ids = new Set(ways.map(o => o.id));
    const r = res.find(c => p.res[c] > def.spend[c] && ways.some(o => o.spend[c] > def.spend[c]));
    expect(r).toBeTruthy();
    fireEvent.click(dlg.querySelector(`[data-pay-add="${r}"]`));
    const chosen = dlg.querySelector('.pay-go').getAttribute('data-option');
    expect(chosen).not.toBe(def.id);
    expect(ids.has(chosen)).toBe(true);
    expect(vec(state, chosen)[r]).toBe(def.spend[r] + 1);
    // the number under each stack is what you keep
    for (const c of res) expect(Number(dlg.querySelector(`[data-pay-add="${c}"]`).dataset.keep)).toBe(p.res[c] - vec(state, chosen)[c]);
    // ...and the sheet says so in words (w3b #25), and a color you hold none of still shows its dot, faint
    expect(dlg.querySelector('[data-pay-legend]').textContent).toMatch(/what you keep/);
    for (const c of res) expect(!!dlg.querySelector(`[data-stack="${c}"] .ps-none`)).toBe(!(p.res[c] > 0));
    fireEvent.click(dlg.querySelector('.pay-go'));
    expect(ss.submit).toHaveBeenCalledWith({ player: me, option: chosen });
  });

  it('Cancel (and Escape) go back to the buy step', () => {
    const state = findPayState();
    const me = state.pending.player;
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(ss.submit).toHaveBeenCalledWith({ player: me, option: 'back' });
  });

  it('a coin clicked in the cost goes home and another legal way takes its place: the payment never goes short', () => {
    const state = findPayState();
    render(<GameScreen session={session(state, [state.pending.player])} />);
    const dlg = screen.getByRole('dialog');
    const ways = payIds(state);
    const ids = new Set(ways.map(o => o.id));
    const def = ways.find(o => o.default);
    // a color some other legal way spends less of
    const color = state.resources.find(r => def.spend[r] > 0 && ways.some(o => o.spend[r] < def.spend[r]));
    expect(color).toBeTruthy();
    fireEvent.click(dlg.querySelector(`[data-pay-coin="${color}"]`));
    const now = dlg.querySelector('.pay-go');
    expect(now.disabled).toBe(false);
    expect(ids.has(now.getAttribute('data-option'))).toBe(true);
    expect(vec(state, now.getAttribute('data-option'))[color]).toBe(def.spend[color] - 1);
    // and that color's stack puts one back in
    fireEvent.click(dlg.querySelector(`[data-pay-add="${color}"]`));
    expect(vec(state, dlg.querySelector('.pay-go').getAttribute('data-option'))[color]).toBe(def.spend[color]);
    // Enter pays whatever is in the cost
    const want = dlg.querySelector('.pay-go').getAttribute('data-option');
    fireEvent.keyDown(dlg.querySelector('.pay-card'), { key: 'Enter' });
    expect(within(dlg).getByRole('button', { name: /^Pay/ }).getAttribute('data-option')).toBe(want);
  });

  it('names every rule-changer in one quiet line each, and the default pays exactly the price they make', () => {
    // a member with a colored part, paid by someone holding Penny Pincher and a −4 discount
    let state = structuredClone(findPayState());
    const me = state.pending.player;
    const p = state.players[me];
    const free = def => Object.values(state.cards).find(c => c.def === def && !state.players.some(x => x.members.includes(c.uid)));
    const pp = free('gold.thrift');
    state.pile = state.pile.filter(u => u !== pp.uid); state.shop = state.shop.filter(u => u !== pp.uid);
    p.members.push(pp.uid);
    p.discount = 4;
    p.res = { ...p.res, gold: 6, red: 6, blue: 6, green: 6 };
    // a gold member face up (its colored part is gold, so the discount and the double gold both bend it)
    const target = state.pile.find(u => state.cards[u].def.startsWith('gold.') && state.cards[u].def !== 'gold.thrift' && memberPrice(state, p, u).total >= 2);
    state.pile = state.pile.filter(u => u !== target); state.shop = [target, ...state.shop];
    expect(target).toBeDefined();
    state.queue[0] = { t: 'pay', p: me, uid: target };
    state = resume(state);
    expect(state.pending.kind).toBe('pay');
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    const dlg = screen.getByRole('dialog');
    const rules = [...dlg.querySelectorAll('[data-pay-rule]')].map(e => e.textContent);
    expect(rules.some(t => /gold counts double/.test(t))).toBe(true);
    expect(rules.some(t => /−4/.test(t))).toBe(true);
    // the default way pays the engine's price (each gold pays 2 here), no coin wasted beyond half a gold
    const v = vec(state, dlg.querySelector('.pay-go').getAttribute('data-option'));
    const paid = Object.entries(v).reduce((t, [c, n]) => t + n * (c === 'gold' ? 2 : 1), 0);
    const price = memberPrice(state, state.players[me], target).total;
    expect(paid).toBeGreaterThanOrEqual(price);
    expect(paid - price).toBeLessThan(2);
    expect(dlg.textContent).not.toMatch(/×2/); // the double gold is the one line, never a "×2" token
  });

  it('only one way to pay: no dialog, it pays at once', async () => {
    let state = structuredClone(findPayState());
    const me = state.pending.player;
    const p = state.players[me];
    const uid = state.pending.uid ?? state.shop.find(u => memberPrice(state, p, u).total > 0);
    // exactly the price in one color the cost takes: one legal way
    const pr = memberPrice(state, p, uid);
    p.res = Object.fromEntries(state.resources.map(r => [r, 0]));
    p.res[pr.color || state.resources[0]] = pr.total;
    p.discount = 0;
    state.queue[0] = { t: 'pay', p: me, uid };
    state = resume(state);
    expect(payIds(state).length).toBe(1);
    const ss = session(state, [me]);
    render(<GameScreen session={ss} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await new Promise(r => setTimeout(r, 20));
    expect(ss.submit).toHaveBeenCalledWith({ player: me, option: payIds(state)[0].id });
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
