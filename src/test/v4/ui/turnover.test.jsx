// Your turn ending says so (w3b #58: after the second Pass the next frame was already a bot's line): when the table
// moves from a step of yours to someone else's, the header says "Your turn is over" for a beat, then the next line.
import { speedScale } from '../../../v4/motion.js';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(cleanup);

const SEATS = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }];
function advanceTo(state, kind, who, also = () => true) {
  let s = state;
  for (let k = 0; k < 800; k++) {
    if (s.pending && s.round >= 1 && s.pending.kind === kind && s.pending.player === who && also(s)) return s;
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
    submit: vi.fn(() => Promise.resolve(cur)),
    publish(next) { cur = next; subs.emit(cur, info); },
    mySeats, info, destroy() {},
  };
}
const wait = ms => act(() => new Promise(r => setTimeout(r, ms)));

describe('the header when your turn ends', () => {
  it('says "Your turn is over" for a beat, then the next player\'s line', async () => {
    // a buy step whose pass hands the table to someone else (a snake turnaround or a step of yours after it isn't a
    // turn ending: the bot moves that reach the table changed with the reworks, so the fixture asks for it)
    const handsOver = s => s.pending.options.some(o => o.id === 'pass') && applyMove(s, { player: 0, option: 'pass' }).pending?.player !== 0;
    let state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'buy', 0, handsOver);
    const session = drivenSession(state, [0]);
    const { container } = render(<GameScreen session={session} pace={0} />);
    await wait(20);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(/^Your turn/);
    const next = applyMove(state, { player: 0, option: 'pass' });
    expect(next.pending.player).not.toBe(0);
    act(() => { session.publish(next); });
    for (let w = 0; w < 100 && container.querySelector('.lt').getAttribute('data-moves') !== String(next.moves); w++) await wait(10);
    expect(container.querySelector('[data-prompt]').textContent).toBe('Your turn is over');
    await wait(Math.round(800 * speedScale()) + 100);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(new RegExp(`^${next.players[next.pending.player].name} `));
    // the next step lands before the beat runs out: it shows at once
    state = next;
    const then = applyMove(state, chooseBotMove(state, () => 0.3));
    act(() => { session.publish(then); });
    await wait(30);
    expect(container.querySelector('[data-turn-over]')).toBeNull();
  });

  it('a copy with one space to copy answers itself (w4 skeptic #30)', async () => {
    let state = null;
    for (let seed = 1; seed < 80 && !state; seed++) {
      let s = createGame({ seats: SEATS, seed, quadrants: ['gold', 'echo', 'red', 'trading'] });
      for (let k = 0; k < 1500 && !s.over; k++) {
        const p = s.pending;
        if (p && p.player === 0 && p.kind === 'choose' && p.options.length === 1 && p.options[0].kind === 'space' && p.options[0].target && p.options[0].target.space) { state = s; break; }
        s = applyMove(s, chooseBotMove(s, () => 0.3));
      }
    }
    expect(state).not.toBeNull();
    const session = drivenSession(state, [0]);
    render(<GameScreen session={session} pace={0} />);
    await wait(700);
    expect(session.submit).toHaveBeenCalledWith({ player: 0, option: state.pending.options[0].id });
  });
});
