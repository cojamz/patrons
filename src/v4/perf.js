// Snappiness tracer (design/eval/perf/). Off unless the page has ?trace=1: then nothing below runs, no listener,
// observer or patch is installed, and the exports are no-ops. On, it records:
//   - input → next paint for every pointer/key interaction (Event Timing, durationThreshold 16, plus a rAF fallback
//     for the fast ones), labelled by what was hit (space, shop card, option, seat, rim, rate…);
//   - long tasks and long animation frames (LoAF, with their scripts);
//   - React commits per component (a fiber walk on the devtools hook, plus <PerfProfiler> around GameScreen);
//   - every animation and transition (Element.animate, CSS animation/transition events) and the wheel's rAF spins;
//   - session steps: local bot step scheduled → applied → shown → painted; online move sent → host applied →
//     state received → shown → painted. `?lag=MS` (works without ?trace) delays the online transport both ways;
//   - hover open delay: pointer over a hover target → its card in the DOM (and its "You'd get" filled in).
// window.__perf = { entries, summary(), reset(), mark(name) }. A corner overlay shows p50/p95 input→paint.
// Harness: node scripts/v4-perf.mjs <url> <label> [--cpu=4] [--online]
import { Profiler, createElement } from 'react';

const qs = (() => { try { return new URLSearchParams(globalThis.location?.search || ''); } catch { return new URLSearchParams(''); } })();
export const PERF_ON = typeof window !== 'undefined' && qs.get('trace') === '1';
export const LAG_MS = typeof window !== 'undefined' ? Math.max(0, Math.min(5000, Number(qs.get('lag')) || 0)) : 0;

const now = () => performance.now();
const E = {
  meta: {}, inputs: [], hovers: [], loaf: [], longtasks: [], commits: [], profiler: [], anims: [], spins: [],
  session: [], shown: [], yours: [], net: [], clicks: [], marks: [],
};

// ---------- labels: what an event or animation hit ----------
const cls = el => (el && typeof el.className === 'string' ? el.className : el && el.className && el.className.baseVal) || '';
function labelOf(t) {
  if (!t || !t.closest) return { kind: 'other', key: '' };
  const opt = t.closest('[data-option]');
  const o = opt ? opt.getAttribute('data-option') : '';
  const slot = t.closest('[data-slot]');
  if (slot) return { kind: 'space', key: slot.getAttribute('data-slot'), option: o };
  if (t.closest('[data-next-round]')) return { kind: 'next-round', key: '' };
  if (t.closest('[data-place]')) return { kind: 'place-confirm', key: t.closest('[data-place]').getAttribute('data-place') };
  const card = t.closest('.lt-shop [data-uid]');
  if (card) return { kind: 'shop-card', key: card.getAttribute('data-uid'), option: o };
  const rate = t.closest('[data-rate]');
  if (rate) return { kind: 'rate', key: rate.getAttribute('data-rate'), option: o };
  if (t.closest('[data-rim]')) return { kind: 'rim', key: t.closest('[data-rim]').getAttribute('data-rim') };
  if (t.closest('[data-deck], .lt-deck')) return { kind: 'deck', key: '' };
  if (o) {
    const k = o.split(':')[0];
    return { kind: o === 'pass' ? 'pass' : k === 'pay' ? 'pay' : `option:${k}`, key: o, option: o };
  }
  const seat = t.closest('.lt-seat[data-pid]');
  if (seat) return { kind: 'seat', key: seat.getAttribute('data-pid') };
  if (t.closest('[data-tip]')) return { kind: 'tip', key: '' };
  if (t.closest('.stage')) return { kind: 'wheel', key: '' };
  if (t.closest('button')) return { kind: 'button', key: (t.closest('button').textContent || '').trim().slice(0, 24) };
  return { kind: 'other', key: '' };
}
const animLabel = el => {
  if (!el || !el.tagName) return '?';
  if (el.classList && el.classList.contains('ghost-layer')) return `ghost.${cls(el).replace(/\s*ghost-layer\s*/, ' ').trim().split(/\s+/).join('.')}`;
  const c = cls(el).trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
  const data = el.getAttribute && (el.getAttribute('data-slot') != null ? '[slot]' : el.getAttribute('data-uid') != null ? '[uid]' : el.getAttribute('data-pid') != null ? '[pid]' : '');
  return `${el.tagName.toLowerCase()}${c ? `.${c}` : ''}${data || ''}`;
};

// ---------- after the next paint: rAF, then a message (runs right after the frame is produced) ----------
let mc = null;
const afterPaint = fn => {
  requestAnimationFrame(() => {
    if (!mc) { mc = new MessageChannel(); mc.port1.onmessage = e => { const q = mc.q; mc.q = []; for (const f of q) f(now()); }; mc.q = []; }
    mc.q.push(fn);
    mc.port2.postMessage(0);
  });
};

// ---------- statistics ----------
export function stats(xs) {
  const a = xs.filter(x => typeof x === 'number' && isFinite(x)).sort((p, q) => p - q);
  if (!a.length) return { n: 0, p50: null, p95: null, max: null, mean: null };
  const at = p => a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))];
  const r = v => Math.round(v * 10) / 10;
  return { n: a.length, p50: r(at(0.5)), p95: r(at(0.95)), max: r(a[a.length - 1]), mean: r(a.reduce((s, v) => s + v, 0) / a.length) };
}
const group = (xs, keyOf) => { const m = new Map(); for (const x of xs) { const k = keyOf(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };

// ---------- React: a fiber walk on the devtools hook (dev builds carry actualDuration) ----------
const WATCH = new Set(['App', 'GameScreen', 'Wheel', 'ShopCards', 'CultSeat', 'HoverCardLayer', 'SinceStrip', 'RankRow', 'TurnCard', 'PayPicker',
  'ChoicePrompt', 'Reckoning', 'RoundEnd', 'MemberDeck', 'FollowerRates', 'Results', 'Menu', 'SpaceCard', 'SeatCard', 'ShopCardHover', 'StandingsCard',
  'Popover', 'Tip', 'PromptActions', 'Chronicle', 'Log', 'Tick', 'Handoff', 'OnlineBar', 'TouchTips', 'Sprite', 'Minion', 'Leader']);
const nameOf = f => {
  const t = f.type;
  if (!t) return null;
  if (f.tag === 11) return t.displayName || (t.render && t.render.name) || null;
  return t.displayName || t.name || null;
};
function walkCommit(root) {
  const t = now();
  const top = root && root.current;
  if (!top) return;
  const per = new Map();
  const stack = [top];
  let visited = 0;
  while (stack.length) {
    const f = stack.pop();
    visited++;
    const tag = f.tag;
    if (tag === 0 || tag === 1 || tag === 2 || tag === 11 || tag === 15) {
      const rendered = !f.alternate || (f.flags & 1) === 1;
      if (rendered) {
        const n = nameOf(f);
        if (n && WATCH.has(n)) {
          const d = typeof f.actualDuration === 'number' ? f.actualDuration : null;
          const cur = per.get(n) || { n: 0, dur: 0, timed: d != null };
          cur.n += 1; cur.dur += d || 0;
          per.set(n, cur);
        }
      }
    }
    // a subtree with no work this commit kept its old children: skip it
    if (f.alternate && f.child === f.alternate.child) { if (f.sibling) stack.push(f.sibling); continue; }
    if (f.sibling) stack.push(f.sibling);
    if (f.child) stack.push(f.child);
  }
  const total = typeof top.actualDuration === 'number' ? top.actualDuration : null;
  E.commits.push({ t, total, visited, comps: Object.fromEntries([...per].map(([k, v]) => [k, { n: v.n, ms: v.timed ? Math.round(v.dur * 100) / 100 : null }])) });
  if (E.commits.length > 6000) E.commits.splice(0, 1000);
}
function hookReact() {
  let hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    // production: a minimal hook (installed before react-dom loads: main.jsx imports this file first)
    let id = 0;
    hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map(), supportsFiber: true, isDisabled: false, inject(r) { id += 1; this.renderers.set(id, r); return id; }, onScheduleFiberRoot() {}, onCommitFiberRoot() {}, onPostCommitFiberRoot() {}, onCommitFiberUnmount() {} };
  }
  const orig = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = function patched(id, root, ...rest) {
    try { walkCommit(root); } catch { /* never break React */ }
    return orig ? orig.call(this, id, root, ...rest) : undefined;
  };
}

/** <PerfProfiler id="GameScreen">…</PerfProfiler>: React.Profiler while tracing, the children alone otherwise. */
export function PerfProfiler({ id, children }) {
  if (!PERF_ON) return children;
  return createElement(Profiler, { id, onRender: (pid, phase, actual, base, start, commit) => {
    E.profiler.push({ id: pid, phase, actual: Math.round(actual * 100) / 100, base: Math.round(base * 100) / 100, start, commit });
    if (E.profiler.length > 6000) E.profiler.splice(0, 1000);
  } }, children);
}

// ---------- sessions: bot steps and online round trips ----------
/** Watches a session's states (App calls it for the session on screen). Returns an unsubscribe, or undefined when off. */
export function traceSession(session) {
  if (!PERF_ON || !session || typeof session.subscribe !== 'function') return undefined;
  const mode = session.info?.mode || 'local';
  E.meta.mode = mode;
  let last = null;
  return session.subscribe(st => {
    if (!st || st === last) return;
    last = st;
    const p = st.pending;
    const actor = p ? p.player : null;
    E.session.push({ t: now(), mode, moves: st.moves, round: st.round, kind: p ? p.kind : null, actor, bot: actor != null && st.players[actor] ? st.players[actor].kind === 'bot' : false, mine: actor != null && (session.mySeats || []).includes(actor) });
  });
}

/** Wraps an online transport: `?lag=MS` delays every write and every read/notification by MS (both ways), and the
 *  tracer records sent moves and received state versions. Returns the transport itself when neither is on. */
export function perfTransport(t) {
  if (!t || (!PERF_ON && !LAG_MS)) return t;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const lagged = fn => async (...a) => { if (LAG_MS) await wait(LAG_MS); const r = await fn(...a); if (LAG_MS) await wait(LAG_MS); return r; };
  const out = { ...t };
  for (const k of ['get', 'set', 'update', 'remove', 'transaction']) if (typeof t[k] === 'function') out[k] = lagged(t[k].bind(t));
  out.push = async (path, value) => {
    const t0 = now();
    if (PERF_ON && /\/moves$/.test(path) && value && value.mid) E.net.push({ t: t0, ev: 'sent', mid: value.mid, option: value.move && value.move.option });
    if (LAG_MS) await wait(LAG_MS);
    const key = await t.push(path, value);
    if (PERF_ON && value && value.mid) E.net.push({ t: now(), ev: 'acked', mid: value.mid });
    return key;
  };
  const delayCb = cb => (...a) => { if (LAG_MS) setTimeout(() => cb(...a), LAG_MS); else cb(...a); };
  out.subscribe = (path, cb) => t.subscribe(path, delayCb((val, ...r) => {
    if (PERF_ON && /\/state$/.test(path) && val && typeof val.version === 'number') {
      // the host stamps `at` with Date.now() (same machine here): convert to this page's clock
      const hostAt = typeof val.at === 'number' ? val.at - (Date.now() - now()) : null;
      E.net.push({ t: now(), ev: 'state', version: val.version, mid: val.lastMove && val.lastMove.mid, by: val.lastMove && val.lastMove.by, hostAt, bytes: typeof val.stateJson === 'string' ? val.stateJson.length : 0 });
    }
    return cb(val, ...r);
  }));
  if (typeof t.onChildAdded === 'function') out.onChildAdded = (path, cb) => t.onChildAdded(path, delayCb(cb));
  return out;
}

// ---------- summary ----------
function summary() {
  const r1 = v => (v == null ? null : Math.round(v));
  // input → paint per kind (click-like interactions: pointerdown, click, keydown; hovers are separate)
  const inputs = E.inputs.filter(x => x.type !== 'pointerover');
  const byKind = group(inputs, x => `${x.type} ${x.kind}`);
  const inputRows = [...byKind].map(([k, xs]) => ({ kind: k, ...stats(xs.map(x => x.dur)), delay: stats(xs.map(x => x.inputDelay)).p95, proc: stats(xs.map(x => x.processing)).p95 })).sort((a, b) => (b.p95 || 0) - (a.p95 || 0));
  const all = stats(inputs.map(x => x.dur));
  const hoverRows = [...group(E.hovers.filter(h => h.domMs != null), h => h.kind)].map(([k, xs]) => ({ kind: k, ...stats(xs.map(h => h.domMs)), content: stats(xs.map(h => h.contentMs)).p95, handler: stats(xs.map(h => h.handlerMs)).p95 }));
  const missed = E.hovers.filter(h => h.domMs == null).length;
  const loaf = [...E.loaf].sort((a, b) => b.duration - a.duration);
  const compRows = [...group(E.commits.flatMap(c => Object.entries(c.comps).map(([n, v]) => ({ n, ms: v.ms, k: v.n }))), x => x.n)]
    .map(([n, xs]) => ({ component: n, renders: xs.reduce((s, x) => s + x.k, 0), commits: xs.length, ...stats(xs.map(x => x.ms)) })).sort((a, b) => (b.p95 || 0) - (a.p95 || 0));
  const prof = [...group(E.profiler, p => p.id)].map(([id, xs]) => ({ id, ...stats(xs.map(x => x.actual)) }));
  const animRows = [...group(E.anims, a => `${a.src} ${a.label}${a.name ? ` (${a.name})` : ''}`)].map(([k, xs]) => ({
    anim: k, count: xs.length, durationMs: stats(xs.map(a => a.duration)).p50, maxMs: stats(xs.map(a => a.duration)).max, loop: xs.some(a => a.loop),
    totalMs: r1(xs.reduce((s, a) => s + (isFinite(a.duration) ? a.duration : 0), 0)), easing: xs[0].easing || '',
  })).sort((a, b) => b.totalMs - a.totalMs);
  // bot pacing: a bot's state → the next state (applied), then when the table showed it and painted it
  const steps = [];
  for (let k = 0; k + 1 < E.session.length; k++) {
    const a = E.session[k], b = E.session[k + 1];
    if (!a.bot) continue;
    const sh = E.shown.find(s => s.moves === b.moves && s.t >= b.t - 1);
    steps.push({ moves: b.moves, kind: a.kind, think: b.t - a.t, toShown: sh ? sh.t - b.t : null, paint: sh && sh.painted ? sh.painted - sh.t : null });
  }
  const shownGaps = [];
  for (let k = 1; k < E.shown.length; k++) shownGaps.push(E.shown[k].t - E.shown[k - 1].t);
  // the player's waits: from the end of your turn (yours → 0) to your next turn painted (yours → 1)
  const waits = [];
  for (let k = 0; k < E.yours.length; k++) {
    const y = E.yours[k];
    if (y.v !== '1' || !k) continue;
    const off = [...E.yours.slice(0, k)].reverse().find(x => x.v === '0');
    if (off) waits.push({ ms: (y.painted || y.t) - off.t, settleMs: y.settleMs, running: y.running });
  }
  // online: each move this page sent → host applied → state here → shown → painted
  const trips = [];
  for (const s of E.net.filter(n => n.ev === 'sent')) {
    const st = E.net.find(n => n.ev === 'state' && n.mid === s.mid);
    if (!st) continue;
    const sess = E.session.find(x => x.t >= st.t - 1);
    const sh = sess ? E.shown.find(x => x.moves === sess.moves && x.t >= st.t - 1) : null;
    trips.push({ option: s.option, hostApplied: st.hostAt != null ? st.hostAt - s.t : null, received: st.t - s.t, shown: sh ? sh.t - s.t : null, painted: sh && sh.painted ? sh.painted - s.t : null, bytes: st.bytes });
  }
  const eaten = E.clicks.filter(c => c.eaten);
  return {
    meta: { ...E.meta, lag: LAG_MS, ua: navigator.userAgent, at: new Date().toISOString() },
    inputToPaint: { all, byKind: inputRows },
    hover: { byKind: hoverRows, missed },
    loaf: { count: E.loaf.length, over100: E.loaf.filter(l => l.duration > 100).length, totalBlocking: r1(E.loaf.reduce((s, l) => s + (l.blockingDuration || 0), 0)), top: loaf.slice(0, 10) },
    longtasks: { count: E.longtasks.length, total: r1(E.longtasks.reduce((s, l) => s + l.duration, 0)), max: r1(Math.max(0, ...E.longtasks.map(l => l.duration))) },
    react: { components: compRows, profiler: prof, commits: E.commits.length, commitTotal: stats(E.commits.map(c => c.total)) },
    animations: animRows,
    spins: E.spins.map(s => ({ ...s, frames: s.frames.length, maxGap: r1(Math.max(0, ...s.frames.slice(1).map((f, k) => f - s.frames[k]))), ms: r1(s.end - s.start) })),
    pacing: { botSteps: stats(steps.map(s => s.think)), botToShown: stats(steps.map(s => s.toShown)), shownToPaint: stats(steps.map(s => s.paint)), shownGap: stats(shownGaps), steps },
    waits: { turnWait: stats(waits.map(w => w.ms)), settleAfterTurn: stats(waits.map(w => w.settleMs)), list: waits },
    online: { trips, received: stats(trips.map(t => t.received)), painted: stats(trips.map(t => t.painted)), hostApplied: stats(trips.map(t => t.hostApplied)), states: E.net.filter(n => n.ev === 'state').length },
    clicks: { count: E.clicks.length, eaten: eaten.length, eatenList: eaten.map(c => ({ kind: c.kind, option: c.option, at: r1(c.t) })) },
    marks: E.marks,
  };
}

// ---------- install (only with ?trace=1) ----------
function install() {
  E.meta.start = new Date().toISOString();
  E.meta.url = location.href;
  hookReact();

  // input → next paint: every interaction gets a rAF fallback; Event Timing (≥16ms) refines it
  const pendingIn = new Map(); // timeStamp → record
  const onInput = e => {
    if (e.type === 'pointerdown' && e.pointerType !== 'mouse' && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    const lab = labelOf(e.target);
    const rec = { type: e.type, kind: e.type === 'keydown' ? `key:${e.key}` : lab.kind, key: lab.key, option: lab.option || '', t: e.timeStamp, dur: null, fallback: null, inputDelay: now() - e.timeStamp, processing: null, et: false };
    if (e.type === 'keydown' && !/^(Arrow|Enter| |Escape|Tab)/.test(e.key)) return;
    E.inputs.push(rec);
    pendingIn.set(Math.round(e.timeStamp), rec);
    afterPaint(t => { rec.fallback = t - rec.t; if (rec.dur == null) rec.dur = rec.fallback; setTimeout(() => pendingIn.delete(Math.round(rec.t)), 3000); });
    if (e.type === 'click' && lab.option) {
      const c = { t: e.timeStamp, kind: lab.kind, option: lab.option, moves: document.querySelector('.app.game')?.dataset.moves, eaten: false };
      E.clicks.push(c);
      setTimeout(() => {
        const m = document.querySelector('.app.game')?.dataset.moves;
        // a click on a live option that changed nothing on screen: eaten (step lock, busy, double-click guard)
        if (m === c.moves && !document.querySelector('[data-place], .dialog.pay, .prompt.choice')) c.eaten = true;
      }, 1200);
    }
  };
  for (const type of ['pointerdown', 'click', 'keydown']) addEventListener(type, onInput, { capture: true, passive: true });
  try {
    new PerformanceObserver(list => {
      for (const en of list.getEntries()) {
        const rec = pendingIn.get(Math.round(en.startTime));
        if (rec && rec.type === en.name) { rec.dur = Math.max(en.duration, rec.dur || 0); rec.et = true; rec.processing = en.processingEnd - en.processingStart; rec.inputDelay = en.processingStart - en.startTime; }
        else if (en.name === 'pointerover' || en.name === 'mouseover') { const h = E.hovers.find(x => Math.round(x.t) === Math.round(en.startTime)); if (h) h.handlerMs = en.processingEnd - en.processingStart; }
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch { E.meta.noEventTiming = true; }

  // hover: pointer over a hover target → its card in the DOM (and, for a space, "You'd get" filled in)
  const hoverTarget = t => {
    if (!t || !t.closest) return null;
    const slot = t.closest('[data-slot]'); if (slot) return { kind: 'space', key: slot.getAttribute('data-slot'), sel: `[data-space-card="${slot.getAttribute('data-slot')}"]` };
    const card = t.closest('.lt-shop [data-uid]'); if (card) return { kind: 'shop-card', key: card.getAttribute('data-uid'), sel: `[data-card-hover="${card.getAttribute('data-uid')}"]` };
    const rim = t.closest('[data-rim]'); if (rim) return { kind: 'rim', key: rim.getAttribute('data-rim'), sel: '[data-hover-card="plaque"]' };
    const tip = t.closest('[data-tip]'); if (tip) return { kind: 'tip', key: '', sel: '[data-tip-body]' };
    const seat = t.closest('.lt-seat[data-pid]'); if (seat && t.closest('.cs-head')) return { kind: 'seat', key: seat.getAttribute('data-pid'), sel: `[data-seat-card="${seat.getAttribute('data-pid')}"]` };
    return null;
  };
  let lastHover = null;
  addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const h = hoverTarget(e.target);
    if (!h || (lastHover && lastHover.kind === h.kind && lastHover.key === h.key && !lastHover.done)) return;
    const rec = { ...h, t: e.timeStamp, domMs: null, contentMs: null, handlerMs: null, done: false };
    delete rec.sel;
    lastHover = rec;
    E.hovers.push(rec);
    const t0 = e.timeStamp;
    const look = ts => {
      if (lastHover !== rec) return; // the pointer moved on first
      const el = document.querySelector(`[data-hover-layer][data-open="1"] ${h.sel}, .lt-note.pinned ${h.sel}, .popover ${h.sel}`);
      if (el && rec.domMs == null) rec.domMs = ts - t0;
      if (el && rec.contentMs == null && !el.querySelector('.youd-get.pending')) { rec.contentMs = ts - t0; rec.done = true; return; }
      if (ts - t0 < 2500) requestAnimationFrame(look); else rec.done = true;
    };
    requestAnimationFrame(look);
  }, { capture: true, passive: true });

  // long tasks and long animation frames
  try { new PerformanceObserver(l => { for (const en of l.getEntries()) E.longtasks.push({ t: en.startTime, duration: en.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* unsupported */ }
  try {
    new PerformanceObserver(l => {
      for (const en of l.getEntries()) {
        E.loaf.push({
          t: Math.round(en.startTime), duration: Math.round(en.duration), blockingDuration: Math.round(en.blockingDuration || 0),
          renderMs: en.renderStart ? Math.round(en.startTime + en.duration - en.renderStart) : 0,
          styleLayoutMs: en.styleAndLayoutStart ? Math.round(en.startTime + en.duration - en.styleAndLayoutStart) : 0,
          scripts: (en.scripts || []).map(s => ({ invoker: s.invoker, type: s.invokerType, fn: s.sourceFunctionName || '', src: String(s.sourceURL || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), char: s.sourceCharPosition, ms: Math.round(s.duration), forcedLayoutMs: Math.round(s.forcedStyleAndLayoutDuration || 0) })).sort((a, b) => b.ms - a.ms).slice(0, 5),
        });
        if (E.loaf.length > 3000) E.loaf.splice(0, 500);
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { E.meta.noLoaf = true; }

  // animations: Web Animations (patched), CSS animations and transitions (events)
  const proto = Element.prototype;
  const animate = proto.animate;
  if (animate) {
    proto.animate = function patchedAnimate(frames, opts) {
      const a = animate.call(this, frames, opts);
      try {
        const o = typeof opts === 'number' ? { duration: opts } : (opts || {});
        const dur = (Number(o.duration) || 0) * (o.iterations === Infinity ? 1 : (o.iterations || 1)) + (Number(o.delay) || 0);
        const rec = { src: 'waapi', label: animLabel(this), name: '', t: now(), duration: dur, easing: o.easing || 'linear', loop: o.iterations === Infinity, end: null };
        E.anims.push(rec);
        a.addEventListener('finish', () => { rec.end = now(); });
        a.addEventListener('cancel', () => { rec.end = now(); rec.cancelled = true; });
      } catch { /* never break an animation */ }
      return a;
    };
  }
  const cssTiming = (el, test) => {
    try {
      const a = el.getAnimations().find(test);
      if (!a) return {};
      const ct = a.effect.getComputedTiming();
      const timing = a.effect.getTiming();
      return { duration: ct.iterations === Infinity ? ct.duration : ct.activeDuration + (ct.delay || 0), loop: ct.iterations === Infinity, easing: timing.easing };
    } catch { return {}; }
  };
  addEventListener('animationstart', e => {
    const tm = cssTiming(e.target, a => a.animationName === e.animationName);
    E.anims.push({ src: 'css-anim', label: animLabel(e.target), name: e.animationName, t: now(), duration: tm.duration ?? null, loop: !!tm.loop, easing: tm.easing || '' });
  }, true);
  addEventListener('transitionrun', e => {
    const tm = cssTiming(e.target, a => a.transitionProperty === e.propertyName);
    E.anims.push({ src: 'css-trans', label: animLabel(e.target), name: e.propertyName, t: now(), duration: tm.duration ?? null, loop: false, easing: tm.easing || '' });
  }, true);
  if (E.anims.length > 20000) E.anims.splice(0, 5000);

  // the table: which state is on screen (data-moves), whose turn it is (data-yours), the wheel's spin (transform)
  let spin = null;
  const runningSettle = () => {
    let settle = 0, running = 0;
    try {
      for (const a of document.getAnimations()) {
        if (a.playState !== 'running') continue;
        const ct = a.effect && a.effect.getComputedTiming();
        if (!ct || ct.iterations === Infinity) continue;
        running++;
        const left = (ct.endTime || 0) - (ct.localTime || 0);
        if (left > settle) settle = left;
      }
    } catch { /* ignore */ }
    return { settle: Math.round(settle), running };
  };
  const mo = new MutationObserver(list => {
    const t = now();
    for (const m of list) {
      const el = m.target;
      if (m.attributeName === 'data-moves' && el.classList.contains('game')) {
        const rec = { t, moves: Number(el.getAttribute('data-moves')), painted: null };
        E.shown.push(rec);
        afterPaint(p => { rec.painted = p; });
      } else if (m.attributeName === 'data-yours' && el.classList.contains('game')) {
        const v = el.getAttribute('data-yours');
        const rs = runningSettle();
        const rec = { t, v, painted: null, settleMs: rs.settle, running: rs.running };
        E.yours.push(rec);
        afterPaint(p => { rec.painted = p; });
      } else if (m.attributeName === 'transform' && el.classList && el.classList.contains('wheel')) {
        const rot = Number((/rotate\(([-\d.e]+)/.exec(el.getAttribute('transform') || '') || [])[1]);
        if (!spin || t - spin.end > 150) { spin = { start: t, end: t, from: rot, to: rot, frames: [t] }; E.spins.push(spin); }
        else { spin.end = t; spin.to = rot; spin.frames.push(t); }
      }
    }
  });
  const watch = () => mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-moves', 'data-yours', 'transform'] });
  if (document.documentElement) watch();

  window.__perf = {
    entries: E,
    summary,
    reset() { for (const k of Object.keys(E)) if (Array.isArray(E[k])) E[k].length = 0; },
    mark(name) { E.marks.push({ t: now(), name }); },
  };
  overlay();
}

function overlay() {
  const boot = () => {
    const el = document.createElement('div');
    el.setAttribute('data-perf-overlay', '');
    el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:2147483647;pointer-events:none;font:11px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.72);color:#e8e2cf;padding:4px 7px;border-radius:5px;max-width:300px;white-space:pre';
    document.body.appendChild(el);
    setInterval(() => {
      const xs = E.inputs.filter(x => x.type !== 'pointerover' && x.dur != null);
      const s = stats(xs.map(x => x.dur));
      const slow = [...xs].reverse().find(x => x.dur > 100);
      const hv = stats(E.hovers.map(h => h.domMs));
      el.textContent = `in→paint p50 ${s.p50 ?? '–'} p95 ${s.p95 ?? '–'} ms (${s.n})\nhover p50 ${hv.p50 ?? '–'} p95 ${hv.p95 ?? '–'} · LoAF ${E.loaf.length}${slow ? `\nslow: ${slow.type} ${slow.kind} ${Math.round(slow.dur)}ms` : ''}`;
    }, 500);
  };
  if (document.body) boot(); else addEventListener('DOMContentLoaded', boot, { once: true });
}

if (PERF_ON) { try { install(); } catch (err) { console.warn('[perf] tracer failed to start', err); } }
