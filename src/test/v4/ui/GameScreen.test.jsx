// UI contract: the game screen renders engine state, and what's clickable is exactly pending.options
// for seats this client controls. Clicks become { player, option } moves.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../engine/v4/index.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(cleanup);

function fakeSession(state, mySeats) {
  return {
    getState: () => state,
    subscribe: () => () => {},
    submit: vi.fn(() => Promise.resolve(state)),
    mySeats,
    info: { mode: 'local', seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })), version: 1 },
    destroy() {},
  };
}

/** Play bot moves until the pending decision is of `kind`. */
function advanceTo(state, kind, max = 500) {
  let s = state;
  for (let k = 0; k < max && s.pending && s.pending.kind !== kind; k++) s = applyMove(s, chooseBotMove(s, () => 0.3));
  if (!s.pending || s.pending.kind !== kind) throw new Error(`never reached ${kind}`);
  return s;
}

const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const clickable = container => [...container.querySelectorAll('[data-option]')].map(e => e.getAttribute('data-option'));

describe('v4 game screen', { timeout: 30000 }, () => {
  it('setup: offers each starting color and submits the option id', () => {
    const state = createGame({ seats, seed: 7 });
    const session = fakeSession(state, [0]);
    const { container } = render(<GameScreen session={session} />);
    const ids = new Set(clickable(container));
    expect(ids).toEqual(new Set(state.pending.options.map(o => o.id)));
    fireEvent.click(within(container.querySelector('.prompt')).getByRole('button', { name: 'Take 1 gold' }));
    expect(session.submit).toHaveBeenCalledWith({ player: 0, option: 'color:gold' });
    expect(screen.getByText(/pick a starting resource/i, { selector: '[data-prompt] *' })).toBeTruthy();
  });

  it('place: every open space is clickable (wheel and card), locked and taken spaces are not', () => {
    let state = advanceTo(createGame({ seats, seed: 11 }), 'place');
    // take one space so a taken space exists, then come back round to a placement
    state = applyMove(state, chooseBotMove(state, () => 0.3));
    state = advanceTo(state, 'place');
    const me = state.pending.player;
    const session = fakeSession(state, [me]);
    const { container } = render(<GameScreen session={session} />);
    const legal = new Set(state.pending.options.map(o => o.id));
    const shown = new Set(clickable(container));
    expect(shown).toEqual(legal);
    // the wheel has one clickable space per legal slot
    expect(container.querySelectorAll('.slot.can').length).toBe(legal.size);
    // taken spaces show a worker and aren't clickable
    for (const key of Object.keys(state.slots)) {
      const g = container.querySelector(`[data-slot="${key}"]`);
      expect(g.getAttribute('data-option')).toBeNull();
      expect(g.querySelector('.worker')).not.toBeNull();
    }
    // round II cards are locked in round I
    const q = quadrant(state.quadrants[0]);
    const panel = container.querySelector('.quad');
    const locked = q.actions.filter(a => a.ring > state.round).map(a => within(panel).getByText(a.name).closest('button'));
    for (const b of locked) { expect(b.getAttribute('aria-disabled')).toBe('true'); expect(b.getAttribute('data-option')).toBeNull(); }
    // clicking a wheel space submits it
    const first = state.pending.options[0];
    fireEvent.click(container.querySelector(`[data-slot="${first.q}-${first.i}"]`));
    expect(session.submit).toHaveBeenCalledWith({ player: me, option: first.id });
  });

  it("nothing is clickable when the seat to act isn't ours", () => {
    const state = advanceTo(createGame({ seats, seed: 3 }), 'place');
    const notMe = (state.pending.player + 1) % state.players.length;
    const session = fakeSession(state, [notMe]);
    const { container } = render(<GameScreen session={session} />);
    expect(clickable(container)).toEqual([]);
    fireEvent.click(container.querySelector('.slot'));
    expect(session.submit).not.toHaveBeenCalled();
    expect(container.querySelector('[data-prompt]').textContent).toMatch(/is placing a worker/);
  });

  it('buy: affordable shop cards, follower buys and Pass match the options; the rest are inert', () => {
    let state = advanceTo(createGame({ seats, seed: 5 }), 'buy');
    const me = state.pending.player;
    const session = fakeSession(state, [me]);
    const { container } = render(<GameScreen session={session} />);
    const legal = new Set(state.pending.options.map(o => o.id));
    expect(new Set(clickable(container))).toEqual(legal);
    for (const uid of state.shop) {
      const el = container.querySelector(`.shop .card[data-option="card:${uid}"]`);
      expect(!!el).toBe(legal.has(`card:${uid}`));
    }
    const pass = within(container.querySelector('.fbuy')).getByRole('button', { name: 'Pass' });
    fireEvent.click(pass);
    expect(session.submit).toHaveBeenCalledWith({ player: me, option: 'pass' });
  });

  it('hot-seat: a second person gets a handoff screen before their options appear', () => {
    const two = [{ name: 'Ana', kind: 'human' }, { name: 'Bea', kind: 'human' }];
    let state = createGame({ seats: two, seed: 2 });
    state = applyMove(state, { player: 0, option: 'color:gold' });
    state = applyMove(state, { player: 0, option: 'color:red' });
    expect(state.pending.player).toBe(1);
    const session = fakeSession(state, [0, 1]);
    const { container } = render(<GameScreen session={session} />);
    expect(screen.getByRole('dialog', { name: /Bea.s turn/ })).toBeTruthy();
    expect(clickable(container)).toEqual([]);
    fireEvent.click(container.querySelector('[data-handoff]'));
    expect(clickable(container).length).toBe(state.pending.options.length);
  });

  it('game over: shows the ranking with a followers breakdown', () => {
    let state = createGame({ seats, seed: 9 });
    for (let k = 0; k < 2000 && !state.over; k++) state = applyMove(state, chooseBotMove(state, () => 0.4));
    expect(state.over).toBe(true);
    const onPlayAgain = vi.fn();
    render(<GameScreen session={fakeSession(state, [0])} onPlayAgain={onPlayAgain} />);
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(1 + seats.length);
    expect(within(table).getByText('Contests')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(onPlayAgain).toHaveBeenCalled();
  });
});
