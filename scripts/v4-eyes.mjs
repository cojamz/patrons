import { browserPath } from '../e2e/v4/lib/browser.mjs';
// v4-eyes: a screen-only browser that a tester drives from Bash. It hands back screenshots, coordinates and timings,
// never DOM, text or selectors, so the tester sees exactly what a person sees and feels what a person waits for.
//
//   node scripts/v4-eyes.mjs start <url> [--name <tester>] [--port 9520] [--device laptop|phone] [--keep]
//        (--keep reuses this tester's browser profile, so a game saved before a stop or a crash resumes)
//   node scripts/v4-eyes.mjs <command> [args...]          (set EYES_PORT=<port> when not 9520)
//
// Commands (every action waits until the screen settles, up to 5 s, then prints how long that took and saves a shot):
//   shot [label]               the screen right now → PNG path (no waiting: catches things mid-motion)
//   grid [label]               the screen with a coordinate grid (lines every 50 px, numbers every 100) for aiming
//   zoom x y w h [label]       a 2× close-up of a region, like leaning in to read small print
//   click x y | dblclick x y | hover x y | move x y | drag x1 y1 x2 y2   (hover jumps straight to x y)
//   tap x y | hold x y [ms]    touch on the phone (mouse on the laptop); hold = long-press, shot taken while held
//   press <key>                Enter, Escape, Tab, Shift+Tab, ArrowLeft, Space…
//   type <text>
//   scroll dx dy               mouse wheel at the pointer
//   wait ms                    sit and watch; says whether the screen moved meanwhile (bots playing, timers)
//   timing                     the last action again: ms to first visible change, ms until the screen stopped,
//                              where it changed, and input-to-paint from the browser's own event timing
//   frames [n] [idle]          a contact sheet of what the screen did after the last action (or, with "idle",
//                              while you were away since it settled), in order, with ms offsets: judge motion here
//   watch <ms> [action…]       do the action (click x y, hover x y, press Enter…, or nothing: just watch, e.g. a bot's
//                              turn) and record the screen for exactly <ms> (≤20 s) without waiting for it to settle:
//                              timing + motion lines, a 12-frame contact sheet and a shot at the end. Repeat the same
//                              action at each Speed (Quick / Steady / Relaxed) to compare them.
//   motion-log <label> | off | show   while on, every measured action appends a row (label, action, first, complete,
//                              bursts, settle, motion ms, beats, frame gaps, stutters, load) to <shots dir>/motion-log.csv;
//                              show prints it with per-label means (e.g. motion-log relaxed … motion-log steady …)
//
// Every action (and timing / watch) prints, under its usual line:
//   response x…, y… (N px from the pointer): first 20 ms → complete 61 ms, 1 burst
//       the place that answered your input (earliest to change, nearest the pointer): when it first changed and when
//       it stopped changing ("complete": the popover finished filling, not merely appeared), and how many separate
//       bursts it changed in (a ≥60 ms still gap splits bursts: 2 bursts = it appeared, then its content filled in late).
//       Measured on that region alone, so a bot or an animation elsewhere can't hold it open; other places follow.
//   WARNING: not complete within 100 ms …   when the response region was still changing after 100 ms (or filled in late)
//   motion 1840 ms in 6 beats (moving 1210 ms) · STUTTERS: painted-frame gaps median 17 ms, max 120 ms · 3 stutters
//   >50 ms (gaps 120, 95, 70 ms), 1 >100 ms · 98 frames · box load 0.4/4 CPUs
//       from the screencast's paint timestamps: span first→last change, beats = bursts separated by ≥80 ms of stillness
//       (a hole under 150 ms inside otherwise smooth (≤40 ms) motion of the same thing counts as a stutter instead),
//       gaps between painted frames while moving, verdict smooth / STUTTERS (any gap >50 ms) / CHOPPY (median >34 ms).
//       Honest limit: the screencast can miss frames when the box is busy, which makes gaps look bigger than a person
//       would see; trust stutter counts most at low load (the load is printed on the line). wait and frames print it too.
//   resize w h | reload | back
//   stop                       close the browser (always, when you're done; it also closes itself after 15 idle min)
//
// One tester browser on the box at a time by default (EYES_MAX=<n> raises it). How it measures: a CDP screencast
// streams a frame each time the compositor paints; frames are diffed at half size, pixels that flicker on their own
// while nobody acts (idle animations) are masked out, and "settled" means 450 ms with no other pixel changing.
import { chromium, devices } from 'playwright';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, readdirSync, rmSync, existsSync, openSync } from 'node:fs';
import { loadavg, cpus } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { jpegjs, PNG } = require('playwright-core/lib/utilsBundle');

const ROOT = '/tmp/eyes';
const LOCKS = join(ROOT, 'locks');
const SELF = fileURLToPath(import.meta.url);
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };

const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const liveLocks = () => { mkdirSync(LOCKS, { recursive: true });
  return readdirSync(LOCKS).map(f => { try { return JSON.parse(readFileSync(join(LOCKS, f), 'utf8')); } catch { return null; } })
    .filter(l => l && alive(l.pid)); };

const cmd = argv.shift();
if (!cmd || cmd === 'help' || cmd === '--help') { console.log(readFileSync(SELF, 'utf8').split('\nimport ')[0]); process.exit(0); }

if (cmd === 'start') {
  const port = Number(flag('port', process.env.EYES_PORT || 9520)), name = flag('name', 'tester'), device = flag('device', 'laptop'), keep = argv.includes('--keep');
  if (keep) argv.splice(argv.indexOf('--keep'), 1);
  const url = argv[0];
  if (!url) { console.error('usage: v4-eyes.mjs start <url> [--name n] [--port p] [--device laptop|phone]'); process.exit(2); }
  const max = Number(process.env.EYES_MAX || 1), live = liveLocks();
  if (live.some(l => l.port === port)) { console.error(`port ${port} already has an eyes browser (pid ${live.find(l => l.port === port).pid}); stop it first`); process.exit(2); }
  if (live.length >= max) { console.error(`refused: ${live.length} eyes browser(s) already open (${live.map(l => `${l.name} on ${l.port}, pid ${l.pid}`).join('; ')}). The box takes ${max} at a time: stop one first (EYES_PORT=<port> node scripts/v4-eyes.mjs stop).`); process.exit(2); }
  const dir = join(ROOT, name); mkdirSync(dir, { recursive: true });
  const log = openSync(join(dir, 'server.log'), 'a');
  const child = spawn(process.execPath, [SELF, 'serve', url, '--name', name, '--port', String(port), '--device', device, '--keep', keep ? '1' : '0'], { detached: true, stdio: ['ignore', log, log] });
  child.unref();
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 500));
    try { const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', body: JSON.stringify({ cmd: 'ping' }) }); if (r.ok) {
      console.log(`eyes ready: ${device} ${device === 'phone' ? '390×664 touch' : '1270×700'} on port ${port}, shots in ${dir}/ (pid ${child.pid}).\nNext: EYES_PORT=${port} node ${SELF} shot`); process.exit(0); } } catch {}
    if (!alive(child.pid)) break;
  }
  console.error(`eyes did not start; see ${join(dir, 'server.log')}`); process.exit(1);
}

if (cmd !== 'serve') {
  // client: one command to the running browser
  const port = Number(process.env.EYES_PORT || 9520);
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', body: JSON.stringify({ cmd, args: argv }) });
    const t = await r.text(); process.stdout.write(t.endsWith('\n') ? t : t + '\n'); process.exit(r.ok ? 0 : 1);
  } catch { console.error(`no eyes browser on port ${port}. Start one: node ${SELF} start <url> [--port ${port}]`); process.exit(1); }
}

// ───────────────────────────── server ─────────────────────────────
const url = argv[0], port = Number(flag('port', 9520)), name = flag('name', 'tester'), device = flag('device', 'laptop'), keep = flag('keep', '0') === '1';
const dir = join(ROOT, name); mkdirSync(dir, { recursive: true });
const lockFile = join(LOCKS, `${port}.json`);
mkdirSync(LOCKS, { recursive: true });
writeFileSync(lockFile, JSON.stringify({ pid: process.pid, port, name, device, url, since: new Date().toISOString() }));
const phone = device === 'phone';

// a persistent profile per tester, so the game's saved state survives a crashed tab or a restart (--keep);
// a plain start wipes it, so every fresh tester starts from a clean browser
const profile = join(dir, 'profile');
if (!keep) rmSync(profile, { recursive: true, force: true });
const ctx = await chromium.launchPersistentContext(profile, { executablePath: browserPath, ...(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1270, height: 700 } }) });
await ctx.addInitScript(() => {
  // the browser's own Event Timing: input → next paint, per event (numbers only, read back below)
  window.__eyesEv = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__eyesEv.push([e.name, performance.timeOrigin + e.startTime, e.duration, e.processingStart - e.startTime, e.processingEnd - e.processingStart]); }
    if (window.__eyesEv.length > 300) window.__eyesEv.splice(0, 150); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
  // when each input really reached the page (the driver's own round trip doesn't count against the game)
  window.__eyesIn = [];
  for (const t of ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel']) addEventListener(t, e => {
    const at = performance.timeOrigin + e.timeStamp, last = window.__eyesIn[window.__eyesIn.length - 1];
    if (t === 'pointermove' && last && last[0] === t && at - last[1] < 250) return;
    window.__eyesIn.push([t, at]); if (window.__eyesIn.length > 200) window.__eyesIn.splice(0, 100); }, { capture: true, passive: true });
});
let page = ctx.pages()[0] || (await ctx.newPage());
let pageErrors = 0, crashed = false;
const watch = pg => { pg.on('pageerror', () => pageErrors++); pg.on('crash', () => { crashed = true; }); };
watch(page);
// a crashed tab (the box runs out of memory) is reopened on the next command, on the same profile, so the saved game resumes
async function revive() {
  if (!crashed) return '';
  crashed = false;
  try { await page.close(); } catch {}
  page = await ctx.newPage(); watch(page);
  await page.goto(url, { waitUntil: 'load' }); await startCast(); await sleep(800);
  return 'NOTE: the browser tab crashed (the box is short of memory: not a game bug). Reopened the game at its URL; your saved game should offer to resume.\n';
}
let vw = phone ? 390 : 1270, vh = phone ? 664 : 700;

// ── screencast: every painted frame, diffed against the one before ──
let W = 0, H = 0, prev = null, cdp = null;
const frames = []; // { t, jpeg, n, box, changed } kept ~90 s, changed-only
let ambientLog = []; // { t, idx: Int32Array } small idle changes: pixels that move with nobody acting
let act = null;      // the action being measured
let lastSettle = 0, lastAction = null;
const ABS = 36;      // per-pixel RGB distance that counts as a change (above JPEG noise)
const CELL = 8;      // region grid, in screencast pixels
let cellStamp = null, cellGen = 0;

function diff(a, b) {
  const n = W * H, idx = []; let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const d = Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2]);
    if (d > ABS) { idx.push(i); const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
  return { idx, box: idx.length ? [minx, miny, maxx, maxy] : null };
}
let ambientMask = null, maskAt = 0;
function buildAmbient(now) {
  ambientLog = ambientLog.filter(a => now - a.t < 20000);
  const hits = new Uint8Array(W * H), mask = new Uint8Array(W * H);
  for (const a of ambientLog) for (const i of a.idx) if (hits[i] < 255) hits[i]++;
  for (let i = 0; i < hits.length; i++) if (hits[i] >= 2) {
    const x = i % W, y = (i / W) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) mask[yy * W + xx] = 1; }
  }
  return mask;
}
async function startCast() {
  if (cdp) { try { await cdp.send('Page.stopScreencast'); } catch {} }
  cdp = await ctx.newCDPSession(page);
  prev = null; ambientLog = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    const now = Date.now();
    const ts = metadata && metadata.timestamp && Math.abs(metadata.timestamp * 1000 - now) < 5000 ? metadata.timestamp * 1000 : now;
    const jpeg = Buffer.from(data, 'base64');
    let img; try { img = jpegjs.decode(jpeg, { useTArray: true }); } catch { return; }
    if (img.width !== W || img.height !== H) { W = img.width; H = img.height; prev = null; ambientLog = []; }
    if (!prev) { prev = img.data; frames.push({ t: ts, jpeg, n: 0, box: null }); return; }
    const d = diff(prev, img.data); prev = img.data;
    if (!d.idx.length) return;
    const quiet = !act && now - lastSettle > 1500;
    if (quiet && d.idx.length < W * H * 0.01) ambientLog.push({ t: ts, idx: Int32Array.from(d.idx) });
    if (!act && now - maskAt > 1000) { ambientMask = buildAmbient(now); maskAt = now; }
    let n = d.idx.length, box = d.box;
    const mask = act ? act.mask : ambientMask;
    if (mask) { let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1; n = 0;
      for (const i of d.idx) if (!mask[i]) { n++; const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      box = n ? [minx, miny, maxx, maxy] : null; }
    if (act && act.map && n >= 6) for (const i of d.idx) if (!mask || !mask[i]) act.map[i] = 1;
    if (n < 6) return; // only idle shimmer changed
    if (act && ts >= act.t0) { // which 8-px cells this frame touched, so each changed place gets its own timeline
      const cw = Math.ceil(W / CELL), cs = [], g = ++cellGen;
      if (!cellStamp || cellStamp.length !== cw * Math.ceil(H / CELL)) cellStamp = new Uint32Array(cw * Math.ceil(H / CELL));
      for (const i of d.idx) if (!mask || !mask[i]) { const c = (((i / W) | 0) / CELL | 0) * cw + (((i % W) / CELL) | 0); if (cellStamp[c] !== g) { cellStamp[c] = g; cs.push(c); } }
      act.log.push({ t: ts, cells: Uint16Array.from(cs), box }); }
    frames.push({ t: ts, jpeg, n, box });
    while (frames.length && (frames.length > 900 || now - frames[0].t > 90000)) frames.shift();
    if (act && ts >= act.t0) {
      if (act.first == null) act.first = ts - act.t0;
      act.last = ts - act.t0; act.count++;
      act.area += n;
      act.box = act.box ? [Math.min(act.box[0], box[0]), Math.min(act.box[1], box[1]), Math.max(act.box[2], box[2]), Math.max(act.box[3], box[3])] : box;
    }
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: phone ? vw : Math.round(vw / 2), maxHeight: phone ? vh : Math.round(vh / 2), everyNthFrame: 1 });
}

await page.goto(url, { waitUntil: 'load' });
await startCast();

let shotN = 0;
const shotPath = label => join(dir, `${String(++shotN).padStart(3, '0')}-${String(label || 'shot').replace(/[^\w.-]+/g, '_').slice(0, 40)}.png`);
const snap = async label => { const p = shotPath(label); await page.screenshot({ path: p, scale: 'css' }); return p; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sx = () => vw / (W || vw), sy = () => vh / (H || vh);
const toPage = b => b && [Math.round(b[0] * sx()), Math.round(b[1] * sy()), Math.round((b[2] + 1) * sx()), Math.round((b[3] + 1) * sy())];

async function measure(label, pointer, fn, { cap = 5000, quiet = 450, noResponse = 1500, fixed = 0 } = {}) {
  const t0 = Date.now();
  act = { label, pointer, t0, first: null, last: null, count: 0, area: 0, box: null, mask: buildAmbient(t0), map: new Uint8Array(W * H), log: [], fixed };
  ambientMask = act.mask;
  await fn();
  const tIn = Date.now();
  for (;;) {
    await sleep(40);
    const now = Date.now();
    if (fixed) { if (now - tIn >= fixed) break; continue; } // watch: record the whole window, settled or not
    if (act.first == null && now - t0 > noResponse) break;
    if (act.first != null && now - (t0 + act.last) >= quiet && now - tIn > 150) break;
    if (now - t0 > cap) { act.capped = true; break; }
  }
  let ev = [], inp = [];
  try { [ev, inp] = await page.evaluate(t => [(window.__eyesEv || []).filter(e => e[1] >= t - 30), (window.__eyesIn || []).filter(e => e[1] >= t - 30)], t0); } catch {}
  const m = act; act = null; lastSettle = Date.now(); m.events = ev; m.dispatch = tIn - t0; m.end = Date.now(); lastAction = m;
  // re-base on the moment the input reached the page, so a slow driver round trip isn't blamed on the game
  m.inputAt = 0;
  if (inp.length) { const shift = Math.max(0, Math.min(inp[0][1] - t0, m.dispatch)); m.inputAt = shift;
    if (m.first != null) { m.first = Math.max(0, m.first - shift); m.last = Math.max(0, m.last - shift); } }
  m.an = analyze(m);
  logMotion(m);
  return m;
}
// separate regions that changed (so a popover that opens far from the pointer shows up as its own region)
function regions(m) {
  if (!m.map || !W) return [];
  const C = CELL, cw = Math.ceil(W / C), ch = Math.ceil(H / C), cell = new Uint16Array(cw * ch);
  for (let i = 0; i < m.map.length; i++) if (m.map[i]) { const x = i % W, y = (i / W) | 0; cell[((y / C) | 0) * cw + ((x / C) | 0)]++; }
  const on = new Uint8Array(cw * ch); for (let k = 0; k < on.length; k++) on[k] = cell[k] >= 3 ? 1 : 0;
  const seen = new Uint8Array(cw * ch), out = [];
  for (let k = 0; k < on.length; k++) if (on[k] && !seen[k]) {
    const st = [k]; seen[k] = 1; let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1, px = 0;
    while (st.length) { const q = st.pop(), x = q % cw, y = (q / cw) | 0; px += cell[q];
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy, r = yy * cw + xx;
        if (xx >= 0 && yy >= 0 && xx < cw && yy < ch && on[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
    out.push({ px, cbox: [minx, miny, maxx, maxy], box: toPage([minx * C, miny * C, Math.min(W - 1, (maxx + 1) * C - 1), Math.min(H - 1, (maxy + 1) * C - 1)]) });
  }
  return out.sort((a, b) => b.px - a.px).slice(0, 4);
}
const BURST_GAP = 60;  // ms of stillness inside one region that splits it into separate bursts ("painted, then filled in")
const BEAT_GAP = 80;   // ms of stillness on the whole screen that separates two motion beats
const distTo = (bb, p) => p ? Math.round(Math.hypot(Math.max(bb[0] - p[0], 0, p[0] - bb[2]), Math.max(bb[1] - p[1], 0, p[1] - bb[3]))) : null;
// one region's own timeline: when it first changed, when it last changed ("complete"), and in how many bursts
function regionTiming(m, r) {
  const cw = Math.ceil(W / CELL), [x0, y0, x1, y1] = r.cbox, ts = [];
  for (const f of m.log) { for (const c of f.cells) { const x = c % cw, y = (c / cw) | 0;
    if (x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1) { ts.push(Math.max(0, f.t - m.t0 - (m.inputAt || 0))); break; } } }
  if (!ts.length) return null;
  let bursts = 1; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] >= BURST_GAP) bursts++;
  const tail = (m.end - m.t0 - (m.inputAt || 0)) - ts.at(-1);
  return { first: ts[0], complete: ts.at(-1), bursts, frames: ts.length, open: tail < BURST_GAP + 40 };
}
// frame-gap statistics for a run of changed frames ({ t, box } in screencast px): beats, painted-frame gaps, stutters.
// A gap ≥ BEAT_GAP ends a beat, unless it is a hole in the middle of smooth motion (≤40 ms gaps on both sides, the
// same place moving before and after, and under 150 ms): that hole is a stutter, not a pause.
function motionStats(list) {
  const fr = list.filter(f => f.box).sort((a, b) => a.t - b.t);
  if (!fr.length) return null;
  const g = []; for (let i = 1; i < fr.length; i++) g.push(fr[i].t - fr[i - 1].t);
  const near = (a, b) => a[0] - 20 <= b[2] && b[0] - 20 <= a[2] && a[1] - 20 <= b[3] && b[1] - 20 <= a[3];
  const brk = g.map((x, i) => { if (x < BEAT_GAP) return false; if (x >= 150) return true;
    const smooth = g[i - 1] != null && g[i - 1] <= 40 && g[i + 1] != null && g[i + 1] <= 40;
    return !(smooth && near(fr[i].box, fr[i + 1].box)); });
  let beats = 1, moving = 0, bs = fr[0].t;
  for (let i = 0; i < g.length; i++) if (brk[i]) { moving += fr[i].t - bs; beats++; bs = fr[i + 1].t; }
  moving += fr.at(-1).t - bs;
  const inMo = g.filter((_, i) => !brk[i]), sorted = [...inMo].sort((a, b) => a - b);
  const st = inMo.filter(x => x > 50).sort((a, b) => b - a);
  return { frames: fr.length, span: Math.round(fr.at(-1).t - fr[0].t), moving: Math.round(moving), beats,
    median: sorted.length ? Math.round(sorted[sorted.length >> 1]) : null, max: sorted.length ? Math.round(sorted.at(-1)) : null,
    stutters: st.map(Math.round), over100: st.filter(x => x > 100).length, load: loadavg()[0] };
}
function motionLine(s) {
  if (!s) return 'motion: nothing moved';
  const l = s.load, c = cpus().length, ld = `box load ${l.toFixed(1)}/${c} CPUs`;
  if (s.frames < 2) return `motion: a single painted change (a snap, no animation) · ${ld}`;
  const verdict = s.median > 34 ? 'CHOPPY' : s.stutters.length ? 'STUTTERS' : 'smooth';
  return `motion ${s.span} ms in ${s.beats} beat${s.beats > 1 ? 's' : ''} (moving ${s.moving} ms) · ${verdict}: ` +
    `painted-frame gaps median ${s.median} ms, max ${s.max} ms · ${s.stutters.length} stutter${s.stutters.length === 1 ? '' : 's'} >50 ms` +
    (s.stutters.length ? ` (gaps ${s.stutters.slice(0, 6).join(', ')} ms)` : '') + `, ${s.over100} >100 ms · ${s.frames} frames · ${ld}` +
    (l > c * 0.5 ? ' (busy box: the recorder can miss frames, so gaps may be the box, not the game)' : '');
}
function analyze(m) {
  const rs = regions(m).map(r => ({ ...r, dist: distTo(r.box, m.pointer), tm: regionTiming(m, r) })).filter(r => r.tm);
  let resp = null;
  if (rs.length) { const big = rs.filter(r => r.px >= rs[0].px * 0.1); // a speck that flickers isn't the answer to your input
    const f0 = Math.min(...big.map(r => r.tm.first));
    const cand = big.filter(r => r.tm.first <= f0 + 30);
    resp = cand.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0) || b.px - a.px)[0]; }
  return { rs, resp, motion: motionStats(m.log) };
}
const bb = r => `x ${r.box[0]}–${r.box[2]}, y ${r.box[1]}–${r.box[3]}`;
function describe(m, { brief = false } = {}) {
  let lit = 0; if (m.map) for (let i = 0; i < m.map.length; i++) lit += m.map[i];
  const pct = W && H ? (lit / (W * H)) * 100 : 0;
  const b = toPage(m.box);
  const parts = [`${m.label}`];
  if (m.first == null) parts.push(`NO VISIBLE CHANGE within ${m.fixed ? m.fixed + ' ms' : '1.5 s'}`);
  else {
    parts.push(`first change ${Math.round(m.first)} ms`);
    parts.push(m.fixed ? `last change ${Math.round(m.last)} ms (watched ${m.fixed} ms)` : m.capped ? `still moving after ${Math.round((Date.now() - m.t0) / 1000)} s` : `settled ${Math.round(m.last)} ms`);
    const rs = regions(m);
    const where = (rs.length ? rs.map(r => r.box) : [b]).map(bb => {
      let s = `x ${bb[0]}–${bb[2]}, y ${bb[1]}–${bb[3]}`;
      if (m.pointer) { const dist = distTo(bb, m.pointer);
        s += dist === 0 ? ' (under the pointer)' : ` (${dist} px from the pointer)`; }
      return s; });
    parts.push(`changed ${pct < 1 ? pct.toFixed(1) : Math.round(pct)}% of the screen, in ${where.length > 1 ? where.length + ' places: ' : ''}${where.join('; ')}`);
  }
  const evs = m.events.filter(e => /pointer|mouse|click|key|touch/.test(e[0]));
  if (evs.length) { const worst = evs.reduce((a, e) => (e[2] > a[2] ? e : a)); parts.push(`input→paint ${Math.round(worst[2])} ms (${worst[0]}, handler ${Math.round(worst[4])} ms)`); }
  else if (!brief) parts.push('input→paint under 16 ms or no input event');
  const flags = [];
  if (m.first != null && m.first > 100) flags.push('SLOW TO RESPOND (>100 ms)');
  if (m.first != null && !m.capped && !m.fixed && m.last > 1000) flags.push('LONG TO SETTLE (>1 s)');
  const lines = [parts.join(' · ') + (flags.length ? ' · ' + flags.join(' · ') : '')];
  const an = m.an || analyze(m);
  if (an.resp) { const r = an.resp, t = r.tm;
    const others = an.rs.filter(o => o !== r && o.px >= r.px * 0.15).slice(0, 2).map(o => `${bb(o)}: first ${Math.round(o.tm.first)} → complete ${Math.round(o.tm.complete)} ms, ${o.tm.bursts} burst${o.tm.bursts > 1 ? 's' : ''}`);
    lines.push(`response ${bb(r)}${r.dist == null ? '' : r.dist === 0 ? ' (under the pointer)' : ` (${r.dist} px from the pointer)`}: first ${Math.round(t.first)} ms → complete ${Math.round(t.complete)} ms, ` +
      `${t.bursts} burst${t.bursts > 1 ? 's' : ''}${t.open ? ' (still changing when measuring stopped)' : ''}` +
      (m.first != null && !m.fixed && Math.round(m.last) > Math.round(t.complete) + 60 ? ` · the screen as a whole settled at ${Math.round(m.last)} ms (something else kept moving)` : '') +
      (others.length ? ` · elsewhere: ${others.join('; ')}` : ''));
    const big = (r.box[2] - r.box[0]) * (r.box[3] - r.box[1]) > vw * vh * 0.4;
    if (t.complete > 100 && (big || (t.open && t.bursts > 3))) lines.push(`NOTE: the response ran into other motion (${big ? 'most of the screen changed' : 'that place never went still'}: bots, a turn handover or an animation), so its "complete" time can't be told apart here; repeat the action when the screen is still to time it alone`);
    else if (t.complete > 100) lines.push(`WARNING: not complete within 100 ms: the response region kept changing until ${Math.round(t.complete)} ms` +
      (t.bursts > 1 ? ` in ${t.bursts} separate bursts (it appeared, then its content changed again: filled in late)` : t.complete - t.first < 30 ? ' (it appeared in one go, but late)' : ' (one continuous change: a slow open or animation)'));
    else if (t.bursts > 1) lines.push(`WARNING: the response region changed in ${t.bursts} separate bursts (it appeared, then its content changed again: filled in late)`);
  }
  if (an.motion && an.motion.frames >= 2) lines.push(motionLine(an.motion));
  return lines.join('\n');
}
// motion-log <label>: every measured action appends its numbers to <out dir>/motion-log.csv under that label
let mlog = null;
const mlogPath = () => join(dir, 'motion-log.csv');
const MLOG_COLS = 'when,label,action,first_ms,complete_ms,bursts,settle_ms,motion_ms,moving_ms,beats,frames,median_gap_ms,max_gap_ms,stutters_50,stutters_100,load1';
function logMotion(m) {
  if (!mlog) return;
  const r = m.an.resp?.tm, s = m.an.motion, v = x => (x == null ? '' : Math.round(x));
  if (!existsSync(mlogPath())) writeFileSync(mlogPath(), MLOG_COLS + '\n');
  appendFileSync(mlogPath(), [new Date().toISOString(), csvq(mlog), csvq(m.label), v(m.first), v(r?.complete), r?.bursts ?? '', v(m.last),
    s?.span ?? '', s?.moving ?? '', s?.beats ?? '', s?.frames ?? '', s?.median ?? '', s?.max ?? '', s?.stutters.length ?? '', s?.over100 ?? '', loadavg()[0].toFixed(2)].join(',') + '\n');
}
function mlogSummary() {
  if (!existsSync(mlogPath())) return `no rows yet in ${mlogPath()}`;
  const txt = readFileSync(mlogPath(), 'utf8'), by = {};
  for (const line of txt.trim().split('\n').slice(1)) { const c = parseCsv(line); (by[c[1]] ||= []).push(c); }
  const mean = (a, i) => { const xs = a.map(r => r[i]).filter(x => x !== '').map(Number).filter(Number.isFinite); return xs.length ? Math.round(xs.reduce((p, x) => p + x, 0) / xs.length) : '-'; };
  return `${mlogPath()}\n${txt}\nper label (means over whatever actions were logged: compare like with like row by row): ` + Object.entries(by).map(([k, a]) => `${k}: ${a.length} action${a.length > 1 ? 's' : ''}, motion ${mean(a, 7)} ms, moving ${mean(a, 8)} ms, beats ${mean(a, 9)}, complete ${mean(a, 4)} ms, stutters ${mean(a, 13)}`).join(' | ');
}
const csvq = x => `"${String(x).replace(/"/g, '""')}"`;
function parseCsv(line) { const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out; }
const loadNote = () => { const l = loadavg()[0], c = cpus().length; return `box load ${l.toFixed(1)} on ${c} CPUs${l > c * 1.5 ? ' (busy: first-change times run high; animation lengths are still true)' : ''}`; };

async function contactSheet(list, label) {
  const tiles = list.map(f => jpegjs.decode(f.jpeg, { useTArray: true }));
  const tw = tiles[0].width, th = tiles[0].height, cols = phone ? 4 : 2, rows = Math.ceil(tiles.length / cols);
  const pad = 6, out = new PNG({ width: cols * tw + (cols + 1) * pad, height: rows * th + (rows + 1) * pad });
  out.data.fill(40);
  tiles.forEach((t, k) => { const ox = pad + (k % cols) * (tw + pad), oy = pad + Math.floor(k / cols) * (th + pad);
    for (let y = 0; y < th; y++) { const src = y * tw * 4; const dst = ((oy + y) * out.width + ox) * 4; out.data.set(t.data.subarray(src, src + tw * 4), dst); } });
  const p = shotPath(label); writeFileSync(p, PNG.sync.write(out)); return p;
}
async function gridShot(label) {
  await page.evaluate(([w, h]) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.id = '__eyesgrid';
    s.setAttribute('style', `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:2147483647;pointer-events:none`);
    let g = '';
    for (let x = 0; x <= w; x += 50) g += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${x % 100 ? '#0ff5' : '#f0f9'}" stroke-width="1"/>` + (x % 100 ? '' : `<text x="${x + 2}" y="12" fill="#f0f" font-size="11" font-family="monospace">${x}</text>`);
    for (let y = 0; y <= h; y += 50) g += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${y % 100 ? '#0ff5' : '#f0f9'}" stroke-width="1"/>` + (y % 100 ? '' : `<text x="2" y="${y - 2}" fill="#f0f" font-size="11" font-family="monospace">${y}</text>`);
    s.innerHTML = g; document.body.appendChild(s);
  }, [vw, vh]);
  try { return await snap(label || 'grid'); } finally { await page.evaluate(() => document.getElementById('__eyesgrid')?.remove()); }
}

let idleTimer;
const touch = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => quit('idle 15 min'), 15 * 60 * 1000); };
async function quit(why) { try { rmSync(lockFile, { force: true }); } catch {} try { await ctx.close(); } catch {} console.log('stopped: ' + why); process.exit(0); }
process.on('SIGTERM', () => quit('SIGTERM')); process.on('SIGINT', () => quit('SIGINT'));
touch();

// the plain actions, as { label, pointer, fn }, shared by their own commands and by `watch <ms> <action…>`
function actionFor(c, args) {
  const [a, b, cc, d] = args;
  switch (c) {
    case 'click': { const x = num(a, 'x'), y = num(b, 'y'); return { label: `click ${x},${y}`, pointer: [x, y], fn: () => page.mouse.click(x, y) }; }
    case 'dblclick': { const x = num(a, 'x'), y = num(b, 'y'); return { label: `dblclick ${x},${y}`, pointer: [x, y], fn: () => page.mouse.dblclick(x, y) }; }
    case 'hover': { const x = num(a, 'x'), y = num(b, 'y'); return { label: `hover ${x},${y}`, pointer: [x, y], fn: () => page.mouse.move(x, y) }; } // one jump: a gliding pointer would hover everything on its way and blur the response
    case 'drag': { const [x1, y1, x2, y2] = [num(a, 'x1'), num(b, 'y1'), num(cc, 'x2'), num(d, 'y2')];
      return { label: `drag ${x1},${y1}→${x2},${y2}`, pointer: [x2, y2], fn: async () => { await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 12 }); await page.mouse.up(); } }; }
    case 'tap': { const x = num(a, 'x'), y = num(b, 'y'); return { label: `tap ${x},${y}`, pointer: [x, y], fn: () => (phone ? page.touchscreen.tap(x, y) : page.mouse.click(x, y)) }; }
    case 'press': return { label: `press ${a}`, pointer: null, fn: () => page.keyboard.press(a) };
    case 'type': { const t = args.join(' '); return { label: `type "${t.slice(0, 30)}"`, pointer: null, fn: () => page.keyboard.type(t, { delay: 40 }) }; }
    case 'scroll': return { label: `scroll ${a},${b}`, pointer: null, fn: () => page.mouse.wheel(Number(a || 0), Number(b || 0)) };
  }
  return null;
}
const sheetOf = async (list, n, label, from) => {
  const pick = list.length <= n ? list : Array.from({ length: n }, (_, k) => list[Math.round((k * (list.length - 1)) / (n - 1))]);
  return { p: await contactSheet(pick, label), pick, offs: pick.map(f => '+' + Math.round(f.t - from)).join(' ') };
};
const num = (v, n) => { const x = Number(v); if (!Number.isFinite(x)) throw new Error(`${n} must be a number`); return x; };
let queue = Promise.resolve();
http.createServer((req, res) => {
  let body = ''; req.on('data', c => (body += c));
  req.on('end', () => { queue = queue.then(async () => {
    let out = '', code = 200;
    try {
      const { cmd: c, args = [] } = JSON.parse(body || '{}'); touch();
      const note = c === 'ping' || c === 'stop' || c === 'quit' ? '' : await revive();
      const [a, b, cc, d] = args;
      const act1 = async (label, pointer, fn) => { const m = await measure(label, pointer, fn); return describe(m) + '\n' + (await snap(label.split(' ')[0])); };
      switch (c) {
        case 'ping': out = 'pong'; break;
        case 'shot': out = await snap(a); break;
        case 'grid': out = await gridShot(a); break;
        case 'zoom': { const [x, y, w, h] = [num(a, 'x'), num(b, 'y'), num(cc, 'w'), num(d, 'h')];
          const p = shotPath(args[4] || 'zoom'); await page.screenshot({ path: p, clip: { x, y, width: w, height: h }, scale: 'device' });
          if (!phone) { // 2× via a temporary zoomed context is costly; upscale the crop instead (nearest neighbour)
            const src = PNG.sync.read(readFileSync(p)), k = 2, o = new PNG({ width: src.width * k, height: src.height * k });
            for (let yy = 0; yy < o.height; yy++) for (let xx = 0; xx < o.width; xx++) { const si = (((yy / k) | 0) * src.width + ((xx / k) | 0)) * 4, di = (yy * o.width + xx) * 4; o.data[di] = src.data[si]; o.data[di + 1] = src.data[si + 1]; o.data[di + 2] = src.data[si + 2]; o.data[di + 3] = 255; }
            writeFileSync(p, PNG.sync.write(o)); }
          out = p; break; }
        case 'click': case 'dblclick': case 'hover': case 'drag': case 'tap': case 'press': case 'type': case 'scroll': {
          const A = actionFor(c, args); out = await act1(A.label, A.pointer, A.fn); break; }
        case 'move': { const x = num(a, 'x'), y = num(b, 'y'); await page.mouse.move(x, y); out = `pointer at ${x},${y}`; break; }
        case 'hold': { const x = num(a, 'x'), y = num(b, 'y'), ms = Number(cc || 650); let held = '';
          const m = await measure(`hold ${x},${y} ${ms}ms`, [x, y], async () => {
            if (phone) { const s = await ctx.newCDPSession(page); await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(ms); held = await snap('held'); await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
            else { await page.mouse.move(x, y); await page.mouse.down(); await sleep(ms); held = await snap('held'); await page.mouse.up(); } });
          out = describe(m) + `\nwhile held: ${held}\nafter release: ${await snap('released')}`; break; }
        case 'wait': { const ms = Math.min(num(a || 500, 'ms'), 60000); const t0 = Date.now(); await sleep(ms);
          const moved = frames.filter(f => f.t >= t0 && f.n > 0);
          if (!moved.length) out = `waited ${ms} ms · the screen stayed still`;
          else { let bx = null; for (const f of moved) bx = bx ? [Math.min(bx[0], f.box[0]), Math.min(bx[1], f.box[1]), Math.max(bx[2], f.box[2]), Math.max(bx[3], f.box[3])] : f.box;
            const pb = toPage(bx); out = `waited ${ms} ms · the screen moved: ${moved.length} frames between +${Math.round(moved[0].t - t0)} and +${Math.round(moved.at(-1).t - t0)} ms, x ${pb[0]}–${pb[2]}, y ${pb[1]}–${pb[3]} (frames idle shows it)`; 
            out += '\n' + motionLine(motionStats(moved)); }
          break; }
        case 'timing': out = lastAction ? describe(lastAction) + `\nframes that changed: ${lastAction.count} · input sent in ${lastAction.dispatch} ms · ${loadNote()}` : 'no action yet'; break;
        case 'frames': { const n = Math.max(2, Math.min(12, Number(a) || 8)); const idle = args.includes('idle');
          if (!lastAction && !idle) { out = 'no action yet'; break; }
          const from = idle ? lastSettle : lastAction.t0, to = idle ? Date.now() : lastAction.t0 + (lastAction.last ?? 0) + 60;
          const list = frames.filter(f => f.t >= from - (idle ? 0 : 5) && f.t <= to);
          if (list.length < 1) { out = idle ? 'nothing moved since the last action settled' : 'nothing moved after the last action'; break; }
          const pick = list.length <= n ? list : Array.from({ length: n }, (_, k) => list[Math.round((k * (list.length - 1)) / (n - 1))]);
          const p = await contactSheet(pick, idle ? 'idle-frames' : 'frames');
          out = `${p}\n${pick.length} of ${list.length} changed frames, left to right then down, ms after ${idle ? 'the last action settled' : 'the input'}: ${pick.map(f => '+' + Math.round(f.t - from)).join(' ')}\n${motionLine(motionStats(list))}`; break; }
        case 'watch': { // watch <ms> [action…]: record the screen for ms after the action (or from now), never waiting for settle
          const ms = Math.max(200, Math.min(num(a, 'ms'), 20000)); const rest = args.slice(1);
          const A = rest.length ? actionFor(rest[0], rest.slice(1)) : { label: 'watch (no action)', pointer: null, fn: async () => {} };
          if (!A) throw new Error(`watch takes an action: click dblclick hover drag tap press type scroll (or nothing, to just watch)`);
          const m = await measure(`${A.label} [watch ${ms} ms]`, A.pointer, A.fn, { fixed: ms });
          const list = frames.filter(f => f.t >= m.t0 - 5 && f.t <= m.end && f.n > 0);
          let sheet = 'nothing moved: no contact sheet';
          if (list.length) { const sh = await sheetOf(list, 12, 'watch', m.t0); sheet = `${sh.p}\n${sh.pick.length} of ${list.length} changed frames, ms after the input: ${sh.offs}`; }
          out = describe(m) + '\n' + sheet + '\nend: ' + (await snap('watch-end')); break; }
        case 'motion-log': {
          if (!a || a === 'show') { out = (mlog ? `logging as "${mlog}"\n` : 'not logging (motion-log <label> starts)\n') + mlogSummary(); break; }
          if (a === 'off') { out = `stopped logging (was "${mlog}") · ${mlogPath()}`; mlog = null; break; }
          mlog = args.join(' '); out = `logging every action's motion as "${mlog}" to ${mlogPath()}`; break; }
        case 'resize': { vw = num(a, 'w'); vh = num(b, 'h'); await page.setViewportSize({ width: vw, height: vh }); await startCast(); await sleep(400); out = `viewport ${vw}×${vh}\n` + (await snap('resized')); break; }
        case 'reload': { await page.reload({ waitUntil: 'load' }); await startCast(); await sleep(800); out = await snap('reloaded'); break; }
        case 'back': { await page.goBack({ waitUntil: 'load' }).catch(() => {}); await startCast(); await sleep(800); out = await snap('back'); break; }
        case 'errors': out = `${pageErrors} uncaught page error(s) so far`; break;
        case 'stop': case 'quit': res.end('closing the browser\n'); setTimeout(() => quit('stop'), 50); return;
        default: code = 400; out = `unknown command "${c}". Commands: shot grid zoom click dblclick hover move drag tap hold press type scroll wait watch timing frames motion-log resize reload back errors stop`;
      }
      out = note + out;
    } catch (e) { code = 500; out = 'error: ' + e.message.split('\n')[0] + (crashed ? ' (the tab crashed; your next command reopens it)' : ''); }
    res.statusCode = code; res.end(out + '\n');
  }); });
}).listen(port, '127.0.0.1', () => console.log(`eyes serving ${url} on ${port}`));
