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
import { seatRanks } from '../../../v4/game/RankRow.jsx';
import Tick, { countMs } from '../../../v4/game/Tick.jsx';
import { saveLocalSoon, flushLocalSave, clearLocal, claimLocal, loadLocal } from '../../../v4/saved.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

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
    const { container } = render(<GameScreen session={session} pace={0} />);
    await settle();
    const perStep = [];
    for (let k = 0; k < 6 && state.pending && state.pending.player !== 0; k++) {
      const next = applyMove(state, chooseBotMove(state, () => 0.3));
      R.reset();
      act(() => { session.publish(next); });
      // the table holds each step for its chain (director.js): wait until it shows this one, then a beat more
      for (let w = 0; w < 200 && container.querySelector('.lt').getAttribute('data-moves') !== String(next.moves); w++) await act(() => new Promise(r => setTimeout(r, 10)));
      await settle(3);
      perStep.push({ rankViewsChanged: state.players.filter(p => JSON.stringify(seatRanks(state, 0)[p.id]) !== JSON.stringify(seatRanks(next, 0)[p.id])).length, kind: state.pending.kind, actor: state.pending.player, turnEnds: !(next.pending && next.pending.player === state.pending.player), Wheel: R.n('Wheel'), Space: R.n('WheelSpace'), CultSeat: R.n('CultSeat'), GameScreen: R.n('GameScreen'), ShopCards: R.n('ShopCards'), components: R.total() });
      state = next;
    }
    console.log('[render-budget] rival steps:', JSON.stringify(perStep));
    // a step inside a rival's turn (placing, choosing, buying while the turn stays theirs) never re-renders all four
    // chairs: the actor's, any it touched, and a chair's own reaction (a hop or a gesture) redraw.
    // The step that ends a turn moves every chair's place in the turn order ("now", "next", "in 2"), so all four redraw.
    const inside = perStep.filter(s => !s.turnEnds);
    expect(inside.length).toBeGreaterThan(1);
    for (const s of inside) {
      // A new leader/score margin changes every seat's visible score tooltip, even within one turn.
      // Unchanged rank views still enforce the original no-whole-table-redraw budget.
      if (s.rankViewsChanged === 4) expect(s.CultSeat).toBeLessThanOrEqual(4);
      else expect(s.CultSeat).toBeLessThan(4);
    }
    for (const s of perStep) expect(s.ShopCards).toBeLessThanOrEqual(1); // the shop once per step, at most
    // the wheel redraws only the spaces whose picture changed: the one just taken and the last placement's (its ring)
    for (const s of perStep) expect(s.Space).toBeLessThanOrEqual(2);
    // one commit of the table per step: the strip, the turn card and the new minion's flash are read while it renders
    for (const s of perStep) expect(s.GameScreen).toBe(1);
  });

  // (lag pass 2026-10-21: at 4x CPU a rAF spin got 4 frames in ~800ms while a rival's move rendered) the spin runs on the
  // compositor: the board's layers and its spaces get Web Animations through the turn's angles, and React renders once,
  // when it lands
  it('a wheel spin is handed to the compositor: no render while it turns, the wheel renders once when it lands', async () => {
    const state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'place', 0);
    const session = drivenSession(state, [0]);
    const { container } = render(<GameScreen session={session} pace={0} />);
    await settle();
    const anims = [];
    const had = Element.prototype.animate;
    Element.prototype.animate = function (frames, opts) { const a = { el: this, frames, opts, startTime: null, currentTime: 0, onfinish: null, cancel() { a.cancelled = true; } }; anims.push(a); return a; };
    try {
      R.reset();
      act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
      const turning = { Wheel: R.n('Wheel'), GameScreen: R.n('GameScreen') };
      const layers = anims.filter(a => a.el.tagName.toLowerCase() === 'svg'), spaces = anims.filter(a => a.el.matches('[data-slot]'));
      const angles = new Set(layers.length ? layers[0].frames.map(f => f.transform) : []);
      expect(layers.length).toBeGreaterThan(0);
      expect(spaces.length).toBe(container.querySelectorAll('.stage > [data-slot]').length);
      expect(angles.size).toBeGreaterThan(2); // it turns through several angles
      expect(turning.Wheel + turning.GameScreen).toBe(0); // the key itself renders nothing
      const g = container.querySelector('.stage svg g[transform]').getAttribute('transform');
      await act(async () => { layers[0].onfinish(); });
      await act(() => new Promise(r => setTimeout(r, 50)));
      const report = { commits: R.commits, Wheel: R.n('Wheel'), GameScreen: R.n('GameScreen'), anims: anims.length };
      console.log('[render-budget] one spin:', JSON.stringify(report));
      expect(container.querySelector('.stage svg g[transform]').getAttribute('transform')).not.toBe(g); // landed
      expect(anims.every(a => a.cancelled)).toBe(true); // and let go of its animations
      expect(report.Wheel).toBeLessThanOrEqual(1);
      expect(report.GameScreen).toBeLessThanOrEqual(1);
    } finally {
      if (had) Element.prototype.animate = had; else delete Element.prototype.animate;
    }
  });

  it('a desktop click on a lit space lets the press paint before the table re-renders', async () => {
    vi.stubGlobal('matchMedia', vi.fn(q => ({ matches: q.includes('min-width: 861px'), addEventListener() {}, removeEventListener() {} })));
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
    const beforePaint = { commits: R.commits, components: R.total(), GameScreen: R.n('GameScreen'), Wheel: R.n('Wheel'), CultSeat: R.n('CultSeat'), ShopCards: R.n('ShopCards'), minion: !!container.querySelector(`[data-slot="${key}"] .worker[data-seat="0"]`) };
    // the engine ran at once (same move, same undo checkpoint): only the table's picture waits for the next frame
    expect(session.getState().slots[key]).toBe(0);
    expect(session.undoKind).toBe('place');
    // (the transition commits when the box gets to it: up to 3s on a loaded box, where 200ms flaked)
    for (let k = 0; k < 300 && container.querySelector('.lt').getAttribute('data-moves') !== String(session.getState().moves); k++) await new Promise(r => setTimeout(r, 10));
    const after = { commits: R.commits, components: R.total(), GameScreen: R.n('GameScreen') };
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    console.log('[render-budget] click on a space, before paint:', JSON.stringify(beforePaint), 'after:', JSON.stringify(after));
    // the press paints your minion standing there (lag pass 2026-10-21): the Wheel alone renders in the click
    expect(beforePaint.Wheel).toBeLessThanOrEqual(1);
    expect(beforePaint.minion).toBe(true);
    expect(beforePaint.CultSeat).toBe(0);
    expect(beforePaint.ShopCards).toBe(0);
    expect(beforePaint.GameScreen).toBe(0);
    // and the table does show the move right after
    expect(container.querySelector('.lt').getAttribute('data-moves')).toBe(String(session.getState().moves));
    expect(container.querySelector(`[data-slot="${key}"] .worker`)).toBeTruthy();
    session.destroy();
  });

  it('a move never writes the save inside the click: it lands in idle time, and at once when the page goes away', async () => {
    const state = advanceTo(createGame({ seats: SEATS, seed: 21 }), 'place', 0);
    claimLocal();
    localStorage.removeItem('patrons.v4.local');
    const writes = [];
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === 'patrons.v4.local') writes.push(JSON.parse(v).state.moves); return real.call(this, k, v); };
    try {
      const a = state, b = applyMove(a, chooseBotMove(a, () => 0.3)), c = applyMove(b, chooseBotMove(b, () => 0.3));
      saveLocalSoon({ x: 1 }, a); saveLocalSoon({ x: 1 }, b); saveLocalSoon({ x: 1 }, c);
      expect(writes).toEqual([]); // nothing on the input path
      await new Promise(r => setTimeout(r, 600)); // idle time (or the timer where there's no requestIdleCallback)
      expect(writes).toEqual([c.moves]); // coalesced: only the latest state, once
      saveLocalSoon({ x: 1 }, b);
      window.dispatchEvent(new Event('pagehide')); // leaving the page writes it at once
      expect(writes).toEqual([c.moves, b.moves]);
      saveLocalSoon({ x: 1 }, c);
      loadLocal(); // a read writes the waiting save first, so it sees the latest move
      expect(writes).toEqual([c.moves, b.moves, c.moves]);
      saveLocalSoon({ x: 1 }, a);
      clearLocal(); // starting over drops a waiting save
      expect(flushLocalSave()).toBe(false);
      expect(localStorage.getItem('patrons.v4.local')).toBe(null);
    } finally { Storage.prototype.setItem = real; localStorage.removeItem('patrons.v4.local'); }
  });

  it('a number counting renders at its start and end, never once per frame (the frames write the text node)', async () => {
    // frames on a timer (jsdom's own don't run the count here)
    const raf0 = globalThis.requestAnimationFrame, caf0 = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    globalThis.cancelAnimationFrame = id => clearTimeout(id);
    const { container, rerender } = render(<Tick value={3} float={false} />);
    await settle(2);
    R.reset();
    const seen = new Set();
    act(() => { rerender(<Tick value={15} float={false} dur={600} />); });
    try { for (let k = 0; k < Math.ceil(countMs(12, 600) / 20) + 5; k++) { await act(() => new Promise(r => setTimeout(r, 20))); seen.add(container.querySelector('.tv').textContent); } } finally { globalThis.requestAnimationFrame = raf0; globalThis.cancelAnimationFrame = caf0; }
    const report = { Tick: R.n('Tick'), commits: R.commits, values: seen.size };
    console.log('[render-budget] one count 3 → 15:', JSON.stringify(report));
    expect(container.querySelector('.tv').textContent).toBe('15');
    expect(report.values).toBeGreaterThan(3); // it counted through the numbers between
    expect(report.Tick).toBeLessThanOrEqual(4); // the new value, its glow on and off, the end: not one per frame
  });

  it('a rival step reads the layout only where it must (no per-step reads in the commit)', async () => {
    let state = advanceTo(createGame({ seats: SEATS, seed: 33 }), 'place', 1);
    const session = drivenSession(state, [0]);
    const { container } = render(<GameScreen session={session} pace={0} />);
    await settle();
    // every call that makes the browser lay the page out (or recompute style) when the DOM has changed
    const reads = new Map();
    // each read is counted by name and by the function that made it (the stack's first frame outside the wrapper)
    const count = name => {
      reads.set(name, (reads.get(name) || 0) + 1);
      const fr = (new Error().stack.split('\n')[3] || '').trim().replace(/^at /, '');
      const fn = fr.split(' ')[0];
      reads.set(`@${fn}`, (reads.get(`@${fn}`) || 0) + 1);
    };
    const restore = [];
    const wrapFn = (obj, name) => { const orig = obj[name]; obj[name] = function (...a) { count(name); return orig.apply(this, a); }; restore.push(() => { obj[name] = orig; }); };
    const wrapGet = (obj, name) => { const d = Object.getOwnPropertyDescriptor(obj, name); if (!d || !d.get) return; Object.defineProperty(obj, name, { ...d, get() { count(name); return d.get.call(this); } }); restore.push(() => Object.defineProperty(obj, name, d)); };
    wrapFn(Element.prototype, 'getBoundingClientRect');
    wrapFn(window, 'getComputedStyle');
    wrapFn(HTMLElement.prototype, 'focus');
    for (const n of ['offsetHeight', 'offsetWidth']) wrapGet(HTMLElement.prototype, n);
    for (const n of ['scrollHeight', 'clientHeight']) wrapGet(Element.prototype, n);
    const perStep = [];
    let lastActor = null;
    try {
      for (let k = 0; k < 6 && state.pending && state.pending.player !== 0; k++) {
        const next = applyMove(state, chooseBotMove(state, () => 0.3));
        reads.clear();
        act(() => { session.publish(next); });
        for (let w = 0; w < 200 && container.querySelector('.lt').getAttribute('data-moves') !== String(next.moves); w++) await act(() => new Promise(r => setTimeout(r, 10)));
        await settle(3);
        perStep.push({ newCard: state.pending.player !== lastActor, ...Object.fromEntries(reads) });
        lastActor = state.pending.player;
        state = next;
      }
    } finally { restore.forEach(f => f()); }
    const by = (s, re) => Object.entries(s).filter(([k]) => k.startsWith('@') && re.test(k)).reduce((a, [, v]) => a + v, 0);
    console.log('[render-budget] layout reads per rival step:', JSON.stringify(perStep));
    for (const s of perStep) {
      // never per step: the chairs' column (a ResizeObserver lays it out), the strip's overflow (its own observer), the
      // focus (only when a step's kind changes and focus is lost), and the turn card's dock (once per layout change, and
      // in the layout that seats the card by its chair, once per turn)
      expect(by(s, /layColumn/)).toBe(0);
      expect(by(s, /SinceStrip|ResizeObserver/)).toBe(0);
      expect(s.focus || 0).toBe(0);
      if (!s.newCard) expect(by(s, /turnCardPlace/)).toBe(0);
    }
  });

  it('no effect writes a custom property on the table root during a step (it re-styled the whole page each time)', async () => {
    // a laptop-like page in jsdom: the chairs' column and the strip have sizes, the turn card docks under the story, and
    // ResizeObserver reports, so the paths that write --seats-end and --turn-h run
    const restore = [];
    const stubGet = (proto, name, fn) => { const d = Object.getOwnPropertyDescriptor(proto, name); Object.defineProperty(proto, name, { ...d, get: fn }); restore.push(() => Object.defineProperty(proto, name, d)); };
    stubGet(HTMLElement.prototype, 'offsetHeight', () => 100);
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ left: 10, top: 10, right: 210, bottom: 110, width: 200, height: 100, x: 10, y: 10 });
    restore.push(() => { Element.prototype.getBoundingClientRect = rect; });
    const gcs = window.getComputedStyle;
    window.getComputedStyle = (el, ...a) => { const cs = gcs(el, ...a); return new Proxy(cs, { get: (t, k) => (k === 'getPropertyValue' ? n => (n === '--turn-dock' ? 'since' : t.getPropertyValue(n)) : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) }); };
    restore.push(() => { window.getComputedStyle = gcs; });
    const RO0 = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; } observe(el) { setTimeout(() => this.cb([{ target: el }]), 0); } unobserve() {} disconnect() {} };
    restore.push(() => { globalThis.ResizeObserver = RO0; });
    const writes = [];
    const setProp = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (name, ...a) { if (String(name).startsWith('--')) writes.push({ style: this, name }); return setProp.call(this, name, ...a); };
    restore.push(() => { CSSStyleDeclaration.prototype.setProperty = setProp; });
    try {
      let state = advanceTo(createGame({ seats: SEATS, seed: 33 }), 'place', 1);
      const session = drivenSession(state, [0]);
      const { container } = render(<GameScreen session={session} pace={0} />);
      await settle();
      const root = container.querySelector('.app.game');
      writes.length = 0;
      for (let k = 0; k < 6 && state.pending && state.pending.player !== 0; k++) {
        const next = applyMove(state, chooseBotMove(state, () => 0.3));
        act(() => { session.publish(next); });
        for (let w = 0; w < 200 && root.getAttribute('data-moves') !== String(next.moves); w++) await act(() => new Promise(r => setTimeout(r, 10)));
        await settle(3);
        state = next;
      }
      const onRoot = writes.filter(w => w.style === root.style).map(w => w.name);
      const story = container.querySelector('.lt-since');
      const onStory = writes.filter(w => story && w.style === story.style).map(w => w.name);
      console.log('[render-budget] custom properties written during rival steps: on the table', JSON.stringify(onRoot), 'on the story', JSON.stringify([...new Set(onStory)]));
      expect(onRoot).toEqual([]);
      expect(onStory.length).toBeGreaterThan(0); // the paths did run: they write where the value is read
    } finally { restore.forEach(f => f()); }
  });
});
