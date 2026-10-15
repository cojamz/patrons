// Render budgets (perf, 2026-10-15: "it just doesn't feel snappy at all"). Deterministic counts, not wall-clock: a
// fiber walk on React's devtools hook counts every component that rendered in each commit (the ?trace=1 tracer's own
// method, src/v4/perf.js). Fails if hovering a space re-renders the shop, if a rival's step re-renders all four chairs,
// or if a click on a lit space re-renders the table before the press can paint (design/eval/perf/fixes.md).
import { vi, describe, it, expect, afterEach } from 'vitest';

const R = vi.hoisted(() => {
  // installed before react-dom loads (vi.hoisted runs ahead of the imports), as the tracer does in the browser
  const counts = new Map();
  const R = { counts, commits: 0, reset() { counts.clear(); R.commits = 0; }, n: name => counts.get(name) || 0, total: () => [...counts.values()].reduce((a, b) => a + b, 0) };
  const nameOf = f => { const t = f.type; if (!t) return null; if (f.tag === 11) return t.displayName || (t.render && t.render.name) || null; return t.displayName || t.name || null; };
  const walk = root => {
    const top = root && root.current;
    if (!top) return;
    R.commits += 1;
    const stack = [top];
    while (stack.length) {
      const f = stack.pop();
      if ([0, 1, 2, 11, 15].includes(f.tag) && (!f.alternate || (f.flags & 1) === 1)) {
        const n = nameOf(f);
        if (n) counts.set(n, (counts.get(n) || 0) + 1);
      }
      if (f.alternate && f.child === f.alternate.child) { if (f.sibling) stack.push(f.sibling); continue; }
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  };
  let id = 0;
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(), supportsFiber: true, isDisabled: false,
    inject(r) { id += 1; this.renderers.set(id, r); return id; },
    onScheduleFiberRoot() {}, onCommitFiberRoot(_id, root) { try { walk(root); } catch { /* never break React */ } }, onPostCommitFiberRoot() {}, onCommitFiberUnmount() {},
  };
  return R;
});

import { render, act, fireEvent, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { createLocalSession } from '../../../v4/session/local.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(() => { cleanup(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

const SEATS = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }];
/** Bot moves for every seat until it's seat `who`'s `kind` step (round I or later). */
function advanceTo(state, kind, who = null, max = 800) {
  let s = state;
  for (let k = 0; k < max; k++) {
    if (s.pending && s.round >= 1 && s.pending.kind === kind && (who == null || s.pending.player === who)) return s;
    s = applyMove(s, chooseBotMove(s, () => 0.3));
  }
  throw new Error(`never reached ${kind}`);
}
/** A session the test drives: it publishes exactly the states handed to it. */
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
const flush = () => new Promise(r => setTimeout(r, 0));
const settle = async (n = 6) => { for (let k = 0; k < n; k++) await act(flush); };

describe('render budget', () => {
  it('hovering a space renders neither the shop nor the table', async () => {
    const state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'place', 0);
    const session = drivenSession(state, [0]);
    const { container } = render(<GameScreen session={session} pace={0} />);
    await settle();
    const spaces = [...container.querySelectorAll('.slot.can[data-slot]')];
    expect(spaces.length).toBeGreaterThan(2);
    R.reset();
    for (const el of spaces.slice(0, 3)) {
      act(() => { fireEvent.pointerEnter(el, { pointerType: 'mouse' }); });
      await settle(3); // the dry run lands (on the main thread in tests) and the tick may appear
      act(() => { fireEvent.pointerLeave(el, { pointerType: 'mouse' }); });
    }
    await settle(3);
    const report = { commits: R.commits, components: R.total(), ShopCards: R.n('ShopCards'), GameScreen: R.n('GameScreen'), Wheel: R.n('Wheel'), CultSeat: R.n('CultSeat') };
    console.log('[render-budget] 3 space hovers:', JSON.stringify(report));
    expect(report.ShopCards).toBe(0);
    expect(report.GameScreen).toBe(0);
    expect(report.Wheel).toBe(0);
    expect(report.CultSeat).toBe(0);
  });

  it('a rival\'s step re-renders only the chairs whose view changed', async () => {
    let state = advanceTo(createGame({ seats: SEATS, seed: 33 }), 'place', 1); // Bo is about to place
    const session = drivenSession(state, [0]);
    render(<GameScreen session={session} pace={0} />);
    await settle();
    const perStep = [];
    for (let k = 0; k < 6 && state.pending && state.pending.player !== 0; k++) {
      const next = applyMove(state, chooseBotMove(state, () => 0.3));
      R.reset();
      act(() => { session.publish(next); });
      await settle(3);
      perStep.push({ kind: state.pending.kind, actor: state.pending.player, turnEnds: !(next.pending && next.pending.player === state.pending.player), CultSeat: R.n('CultSeat'), GameScreen: R.n('GameScreen'), ShopCards: R.n('ShopCards'), components: R.total() });
      state = next;
    }
    console.log('[render-budget] rival steps:', JSON.stringify(perStep));
    // a step inside a rival's turn (placing, choosing, buying while the turn stays theirs) never re-renders all four
    // chairs: at most the actor's and the one it touched (a chair's own reaction, a hop or a gesture, is a render too).
    // The step that ends a turn moves every chair's place in the turn order ("now", "next", "in 2"), so all four redraw.
    const inside = perStep.filter(s => !s.turnEnds);
    expect(inside.length).toBeGreaterThan(1);
    for (const s of inside) expect(s.CultSeat).toBeLessThanOrEqual(2);
    for (const s of perStep) expect(s.ShopCards).toBeLessThanOrEqual(1); // the shop once per step, at most
  });

  it('a click on a lit space lets the press paint before the table re-renders', async () => {
    const state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'place', 0);
    const session = createLocalSession({ state, botDelayMs: 1e9 });
    const { container } = render(<GameScreen session={session} pace={0} />);
    await settle();
    const el = container.querySelector('.slot.can[data-slot]');
    const key = el.getAttribute('data-slot');
    // outside act: the browser's own order (the click's task, then microtasks, then a frame)
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    R.reset();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    for (let k = 0; k < 8; k++) await Promise.resolve(); // the click's microtasks: everything before the next paint
    const beforePaint = { commits: R.commits, components: R.total(), GameScreen: R.n('GameScreen'), Wheel: R.n('Wheel'), CultSeat: R.n('CultSeat'), ShopCards: R.n('ShopCards') };
    // the engine ran at once (same move, same undo checkpoint): only the table's picture waits for the next frame
    expect(session.getState().slots[key]).toBe(0);
    expect(session.undoKind).toBe('place');
    for (let k = 0; k < 20 && container.querySelector('.lt').getAttribute('data-moves') !== String(session.getState().moves); k++) await new Promise(r => setTimeout(r, 10));
    const after = { commits: R.commits, components: R.total(), GameScreen: R.n('GameScreen') };
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    console.log('[render-budget] click on a space, before paint:', JSON.stringify(beforePaint), 'after:', JSON.stringify(after));
    expect(beforePaint.Wheel).toBe(0);
    expect(beforePaint.CultSeat).toBe(0);
    expect(beforePaint.ShopCards).toBe(0);
    expect(beforePaint.GameScreen).toBe(0);
    // and the table does show the move right after
    expect(container.querySelector('.lt').getAttribute('data-moves')).toBe(String(session.getState().moves));
    expect(container.querySelector(`[data-slot="${key}"] .worker`)).toBeTruthy();
    session.destroy();
  });
});
