// Watches every flight on the table (a coin, a follower, a member's card, a minion going home) and notes any that
// leaves the screen before it has arrived: its animation still short of its end when its node is taken away.
// Injected with page.addInitScript(FLIGHT_WATCH); read with page.evaluate(() => window.__flightWatch.report()).
// A flight cut within 150 ms of a press or a key is the player skipping (a click lands the show) and is counted apart.
// With an unminified build (vite build --minify false) each cut carries the call that took it away.
export const FLIGHT_WATCH = () => {
  const W = { flights: 0, landed: 0, cut: [], skipped: 0, missed: [], aimed: 0, lastInput: -1e9, round: '' };
  window.__flightWatch = W;
  const live = new Map(); // node → { anim, end, born, kind, to, target }
  const byAnim = new WeakMap();
  W.aim = (anim, el) => { const r = byAnim.get(anim); if (r) { r.target = el; W.aimed++; } };
  const isFlight = el => el && el.classList && el.classList.contains('ghost-layer') && (el.classList.contains('piece-flight') || el.classList.contains('card-flight') || el.classList.contains('worker-flight'));
  const travels = frames => Array.isArray(frames) && frames.some(f => f && typeof f.transform === 'string' && /translate\((?!0(px)?,\s*0(px)?\))/.test(f.transform));
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (frames, opts) {
    const a = animate.call(this, frames, opts);
    if (isFlight(this) && travels(frames)) {
      const o = typeof opts === 'number' ? { duration: opts } : opts || {};
      W.flights++;
      // where its path ends: its box's centre plus the last keyframe's move
      const last = [...frames].reverse().find(f => f && typeof f.transform === 'string' && /translate\(/.test(f.transform));
      const m = last && /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(last.transform);
      const r = this.getBoundingClientRect();
      const rec = { anim: a, end: (o.delay || 0) + (o.duration || 0), born: performance.now(), kind: this.className.replace(/ghost-layer|path-\w+/g, '').trim(), to: m ? { x: r.left + r.width / 2 + Number(m[1]), y: r.top + r.height / 2 + Number(m[2]) } : null };
      live.set(this, rec);
      byAnim.set(a, rec);
      // window.__flightStall = n: every nth flight, the page freezes just after it leaves, longer than the flight itself
      // (a slow laptop's long frame, Firefox's especially): the flight starts late and must still play to its end
      if (window.__flightStall && W.flights % window.__flightStall === 0) { const until = performance.now() + rec.end + 700; queueMicrotask(() => { while (performance.now() < until) { /* a long frame */ } }); }
      // as it lands: is the place it was meant for still where its path ends? (a place that moved meanwhile leaves the
      // piece fading out over nothing, short of its number)
      a.addEventListener('finish', () => {
        const el = rec.target;
        if (!el || !rec.to || !el.isConnected) return;
        const b = el.getBoundingClientRect();
        if (!b.width) return;
        const off = Math.round(Math.hypot(b.left + b.width / 2 - rec.to.x, b.top + b.height / 2 - rec.to.y));
        if (off > Math.max(14, Math.min(b.width, b.height) / 2 + 6)) W.missed.push({ kind: rec.kind, off, round: (document.querySelector('.hub-label b')?.textContent || '').trim(), moves: document.querySelector('.app.game')?.dataset.moves, target: (el.className || '').toString().slice(0, 60) });
      });
    }
    return a;
  };
  const gone = (el, how) => {
    const f = live.get(el);
    if (!f) return;
    live.delete(el);
    const t = f.anim.currentTime;
    const at = t == null ? null : Math.round(t);
    if (f.anim.playState === 'finished' || (at != null && at >= f.end - 34)) { W.landed++; return; }
    const now = performance.now();
    if (now - W.lastInput < 150) { W.skipped++; return; }
    const r = el.getBoundingClientRect();
    W.cut.push({ kind: f.kind, at, end: f.end, share: at == null ? null : Math.round(100 * Math.max(0, at) / (f.end || 1)), age: Math.round(now - f.born), state: f.anim.playState, how, round: (document.querySelector('.hub-label b')?.textContent || '').trim(), moves: document.querySelector('.app.game')?.dataset.moves, x: Math.round(r.left), y: Math.round(r.top), stack: (new Error().stack || '').split('\n').slice(2, 9).map(s => s.trim().replace(/\(?https?:\/\/[^/]+\/[^)]*\/([^/)]+)\)?/, '$1')).join(' < ') });
  };
  const remove = Element.prototype.remove;
  Element.prototype.remove = function () { if (live.has(this)) gone(this, 'remove'); return remove.call(this); };
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (c) { if (live.has(c)) gone(c, 'removeChild'); return removeChild.call(this, c); };
  const input = e => { if (e.isTrusted) W.lastInput = performance.now(); };
  addEventListener('pointerdown', input, true);
  addEventListener('keydown', input, true);
  W.report = () => {
    const by = {};
    for (const c of W.cut) { const k = `${c.kind} · ${c.stack.split(' < ').slice(0, 3).join(' < ')}`; (by[k] ||= { n: 0, shares: [] }).n++; by[k].shares.push(c.share); }
    return { flights: W.flights, landed: W.landed, skipped: W.skipped, cut: W.cut.length, by, samples: W.cut.slice(0, 40), aimed: W.aimed, missed: W.missed.length, misses: W.missed.slice(0, 40) };
  };
};
