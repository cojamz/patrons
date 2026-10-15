// Your turn ending says so (w3b #58: after the second Pass the next frame was already a bot's line): when the table
// moves from a step of yours to someone else's, the header says "Your turn is over" for a beat, then the next line.
import { describe, it, expect, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(cleanup);

const SEATS = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }];
function advanceTo(state, kind, who) {
  let s = state;
  for (let k = 0; k < 800; k++) {
    if (s.pending && s.round >= 1 && s.pending.kind === kind && s.pending.player === who) return s;
    s = applyMove(s, chooseBotMove(s, () => 0.3));
  }
  throw new Error(`never reached ${kind}`);
}
function drivenSession(state, mySeats) {
  let cur = state;
  const subs = createEmitter();
  const info = { mode: 'local', seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })), version: 1 };
  return {
    getState: () => cur,
    subscribe(fn) { const off = subs.on(fn); fn(cur, info); return off; },
    submit: () => Promise.resolve(cur),
    publish(next) { cur = next; subs.emit(cur, info); },
    mySeats, info, destroy() {},
  };
}
const wait = ms => act(() => new Promise(r => setTimeout(r, ms)));

describe('the header when your turn ends', () => {
  it('says "Your turn is over" for a beat, then the next player\'s line', async () => {
    let state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'buy', 0);
    const session = drivenSession(state, [0]);
    const { container } = render(<GameScreen session={session} pace={0} />);
    await wait(20);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(/^Your turn/);
    const next = applyMove(state, { player: 0, option: 'pass' });
    expect(next.pending.player).not.toBe(0);
    act(() => { session.publish(next); });
    for (let w = 0; w < 100 && container.querySelector('.lt').getAttribute('data-moves') !== String(next.moves); w++) await wait(10);
    expect(container.querySelector('[data-prompt]').textContent).toBe('Your turn is over');
    await wait(1000);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(new RegExp(`^${next.players[next.pending.player].name} `));
    // the next step lands before the beat runs out: it shows at once
    state = next;
    const then = applyMove(state, chooseBotMove(state, () => 0.3));
    act(() => { session.publish(then); });
    await wait(30);
    expect(container.querySelector('[data-turn-over]')).toBeNull();
  });
});
