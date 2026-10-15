// v4-eyes: a screen-only browser that a tester drives from Bash. It hands back screenshots, coordinates and timings,
// never DOM, text or selectors, so the tester sees exactly what a person sees and feels what a person waits for.
//
//   node scripts/v4-eyes.mjs start <url> [--name <tester>] [--port 9520] [--device laptop|phone]
//   node scripts/v4-eyes.mjs <command> [args...]          (set EYES_PORT=<port> when not 9520)
//
// Commands (every action waits until the screen settles, up to 5 s, then prints how long that took and saves a shot):
//   shot [label]               the screen right now → PNG path (no waiting: catches things mid-motion)
//   grid [label]               the screen with a coordinate grid (lines every 50 px, numbers every 100) for aiming
//   zoom x y w h [label]       a 2× close-up of a region, like leaning in to read small print
//   click x y | dblclick x y | hover x y | move x y | drag x1 y1 x2 y2
//   tap x y | hold x y [ms]    touch on the phone (mouse on the laptop); hold = long-press, shot taken while held
//   press <key>                Enter, Escape, Tab, Shift+Tab, ArrowLeft, Space…
//   type <text>
//   scroll dx dy               mouse wheel at the pointer
//   wait ms                    sit and watch; says whether the screen moved meanwhile (bots playing, timers)
//   timing                     the last action again: ms to first visible change, ms until the screen stopped,
//                              where it changed, and input-to-paint from the browser's own event timing
//   frames [n] [idle]          a contact sheet of what the screen did after the last action (or, with "idle",
//                              while you were away since it settled), in order, with ms offsets: judge motion here
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
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, openSync } from 'node:fs';
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
  const port = Number(flag('port', process.env.EYES_PORT || 9520)), name = flag('name', 'tester'), device = flag('device', 'laptop');
  const url = argv[0];
  if (!url) { console.error('usage: v4-eyes.mjs start <url> [--name n] [--port p] [--device laptop|phone]'); process.exit(2); }
  const max = Number(process.env.EYES_MAX || 1), live = liveLocks();
  if (live.some(l => l.port === port)) { console.error(`port ${port} already has an eyes browser (pid ${live.find(l => l.port === port).pid}); stop it first`); process.exit(2); }
  if (live.length >= max) { console.error(`refused: ${live.length} eyes browser(s) already open (${live.map(l => `${l.name} on ${l.port}, pid ${l.pid}`).join('; ')}). The box takes ${max} at a time: stop one first (EYES_PORT=<port> node scripts/v4-eyes.mjs stop).`); process.exit(2); }
  const dir = join(ROOT, name); mkdirSync(dir, { recursive: true });
  const log = openSync(join(dir, 'server.log'), 'a');
  const child = spawn(process.execPath, [SELF, 'serve', url, '--name', name, '--port', String(port), '--device', device], { detached: true, stdio: ['ignore', log, log] });
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
const url = argv[0], port = Number(flag('port', 9520)), name = flag('name', 'tester'), device = flag('device', 'laptop');
const dir = join(ROOT, name); mkdirSync(dir, { recursive: true });
const lockFile = join(LOCKS, `${port}.json`);
mkdirSync(LOCKS, { recursive: true });
writeFileSync(lockFile, JSON.stringify({ pid: process.pid, port, name, device, url, since: new Date().toISOString() }));
const phone = device === 'phone';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(() => {
  // the browser's own Event Timing: input → next paint, per event (numbers only, read back below)
  window.__eyesEv = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__eyesEv.push([e.name, performance.timeOrigin + e.startTime, e.duration, e.processingStart - e.startTime, e.processingEnd - e.processingStart]); }
    if (window.__eyesEv.length > 300) window.__eyesEv.splice(0, 150); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
});
const page = await ctx.newPage();
let pageErrors = 0;
page.on('pageerror', () => pageErrors++);
let vw = phone ? 390 : 1270, vh = phone ? 664 : 700;

// ── screencast: every painted frame, diffed against the one before ──
let W = 0, H = 0, prev = null, cdp = null;
const frames = []; // { t, jpeg, n, box, changed } kept ~90 s, changed-only
let ambientLog = []; // { t, idx: Int32Array } small idle changes: pixels that move with nobody acting
let act = null;      // the action being measured
let lastSettle = 0, lastAction = null;
const ABS = 36;      // per-pixel RGB distance that counts as a change (above JPEG noise)

function diff(a, b) {
  const n = W * H, idx = []; let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const d = Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2]);
    if (d > ABS) { idx.push(i); const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
  return { idx, box: idx.length ? [minx, miny, maxx, maxy] : null };
}
let ambientMask = null;
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
    let n = d.idx.length, box = d.box;
    const mask = act ? act.mask : ambientMask;
    if (mask) { let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1; n = 0;
      for (const i of d.idx) if (!mask[i]) { n++; const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      box = n ? [minx, miny, maxx, maxy] : null; }
    if (n < 6) return; // only idle shimmer changed
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

async function measure(label, pointer, fn, { cap = 5000, quiet = 450, noResponse = 1500 } = {}) {
  const t0 = Date.now();
  act = { label, pointer, t0, first: null, last: null, count: 0, area: 0, box: null, mask: buildAmbient(t0) };
  ambientMask = act.mask;
  await fn();
  const tIn = Date.now();
  for (;;) {
    await sleep(40);
    const now = Date.now();
    if (act.first == null && now - t0 > noResponse) break;
    if (act.first != null && now - (t0 + act.last) >= quiet && now - tIn > 150) break;
    if (now - t0 > cap) { act.capped = true; break; }
  }
  let ev = [];
  try { ev = await page.evaluate(t => (window.__eyesEv || []).filter(e => e[1] >= t - 30), t0); } catch {}
  const m = act; act = null; lastSettle = Date.now(); m.events = ev; m.dispatch = tIn - t0; lastAction = m;
  return m;
}
function describe(m, { brief = false } = {}) {
  const pct = W && H ? (m.box ? ((m.box[2] - m.box[0] + 1) * (m.box[3] - m.box[1] + 1)) / (W * H) * 100 : 0) : 0;
  const b = toPage(m.box);
  const parts = [`${m.label}`];
  if (m.first == null) parts.push('NO VISIBLE CHANGE within 1.5 s');
  else {
    parts.push(`first change ${Math.round(m.first)} ms`);
    parts.push(m.capped ? `still moving after ${Math.round((Date.now() - m.t0) / 1000)} s` : `settled ${Math.round(m.last)} ms`);
    parts.push(`changed x ${b[0]}–${b[2]}, y ${b[1]}–${b[3]} (${pct < 1 ? pct.toFixed(1) : Math.round(pct)}% of the screen)`);
    if (m.pointer) { const [px, py] = m.pointer; const dx = Math.max(b[0] - px, 0, px - b[2]), dy = Math.max(b[1] - py, 0, py - b[3]);
      const dist = Math.round(Math.hypot(dx, dy)); parts.push(dist === 0 ? 'around the pointer' : `nearest change ${dist} px from the pointer`); }
  }
  const evs = m.events.filter(e => /pointer|mouse|click|key|touch/.test(e[0]));
  if (evs.length) { const worst = evs.reduce((a, e) => (e[2] > a[2] ? e : a)); parts.push(`input→paint ${Math.round(worst[2])} ms (${worst[0]}, handler ${Math.round(worst[4])} ms)`); }
  else if (!brief) parts.push('input→paint under 16 ms or no input event');
  const flags = [];
  if (m.first != null && m.first > 100) flags.push('SLOW TO RESPOND (>100 ms)');
  if (m.first != null && !m.capped && m.last > 1000) flags.push('LONG TO SETTLE (>1 s)');
  return parts.join(' · ') + (flags.length ? ' · ' + flags.join(' · ') : '');
}
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
async function quit(why) { try { rmSync(lockFile, { force: true }); } catch {} try { await browser.close(); } catch {} console.log('stopped: ' + why); process.exit(0); }
process.on('SIGTERM', () => quit('SIGTERM')); process.on('SIGINT', () => quit('SIGINT'));
touch();

const num = (v, n) => { const x = Number(v); if (!Number.isFinite(x)) throw new Error(`${n} must be a number`); return x; };
let queue = Promise.resolve();
http.createServer((req, res) => {
  let body = ''; req.on('data', c => (body += c));
  req.on('end', () => { queue = queue.then(async () => {
    let out = '', code = 200;
    try {
      const { cmd: c, args = [] } = JSON.parse(body || '{}'); touch();
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
        case 'click': { const x = num(a, 'x'), y = num(b, 'y'); out = await act1(`click ${x},${y}`, [x, y], () => page.mouse.click(x, y)); break; }
        case 'dblclick': { const x = num(a, 'x'), y = num(b, 'y'); out = await act1(`dblclick ${x},${y}`, [x, y], () => page.mouse.dblclick(x, y)); break; }
        case 'hover': { const x = num(a, 'x'), y = num(b, 'y'); out = await act1(`hover ${x},${y}`, [x, y], () => page.mouse.move(x, y, { steps: 4 })); break; }
        case 'move': { const x = num(a, 'x'), y = num(b, 'y'); await page.mouse.move(x, y); out = `pointer at ${x},${y}`; break; }
        case 'drag': { const [x1, y1, x2, y2] = [num(a, 'x1'), num(b, 'y1'), num(cc, 'x2'), num(d, 'y2')];
          out = await act1(`drag ${x1},${y1}→${x2},${y2}`, [x2, y2], async () => { await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 12 }); await page.mouse.up(); }); break; }
        case 'tap': { const x = num(a, 'x'), y = num(b, 'y'); out = await act1(`tap ${x},${y}`, [x, y], () => (phone ? page.touchscreen.tap(x, y) : page.mouse.click(x, y))); break; }
        case 'hold': { const x = num(a, 'x'), y = num(b, 'y'), ms = Number(cc || 650); let held = '';
          const m = await measure(`hold ${x},${y} ${ms}ms`, [x, y], async () => {
            if (phone) { const s = await ctx.newCDPSession(page); await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(ms); held = await snap('held'); await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
            else { await page.mouse.move(x, y); await page.mouse.down(); await sleep(ms); held = await snap('held'); await page.mouse.up(); } });
          out = describe(m) + `\nwhile held: ${held}\nafter release: ${await snap('released')}`; break; }
        case 'press': out = await act1(`press ${a}`, null, () => page.keyboard.press(a)); break;
        case 'type': { const t = args.join(' '); out = await act1(`type "${t.slice(0, 30)}"`, null, () => page.keyboard.type(t, { delay: 40 })); break; }
        case 'scroll': out = await act1(`scroll ${a},${b}`, null, () => page.mouse.wheel(Number(a || 0), Number(b || 0))); break;
        case 'wait': { const ms = Math.min(num(a || 500, 'ms'), 60000); const t0 = Date.now(); await sleep(ms);
          const moved = frames.filter(f => f.t >= t0 && f.n > 0);
          if (!moved.length) out = `waited ${ms} ms · the screen stayed still`;
          else { let bx = null; for (const f of moved) bx = bx ? [Math.min(bx[0], f.box[0]), Math.min(bx[1], f.box[1]), Math.max(bx[2], f.box[2]), Math.max(bx[3], f.box[3])] : f.box;
            const pb = toPage(bx); out = `waited ${ms} ms · the screen moved: ${moved.length} frames between +${Math.round(moved[0].t - t0)} and +${Math.round(moved.at(-1).t - t0)} ms, x ${pb[0]}–${pb[2]}, y ${pb[1]}–${pb[3]} (frames idle shows it)`; }
          break; }
        case 'timing': out = lastAction ? describe(lastAction) + `\nframes that changed: ${lastAction.count} · input sent in ${lastAction.dispatch} ms · ${loadNote()}` : 'no action yet'; break;
        case 'frames': { const n = Math.max(2, Math.min(12, Number(a) || 8)); const idle = args.includes('idle');
          if (!lastAction && !idle) { out = 'no action yet'; break; }
          const from = idle ? lastSettle : lastAction.t0, to = idle ? Date.now() : lastAction.t0 + (lastAction.last ?? 0) + 60;
          const list = frames.filter(f => f.t >= from - (idle ? 0 : 5) && f.t <= to);
          if (list.length < 1) { out = idle ? 'nothing moved since the last action settled' : 'nothing moved after the last action'; break; }
          const pick = list.length <= n ? list : Array.from({ length: n }, (_, k) => list[Math.round((k * (list.length - 1)) / (n - 1))]);
          const p = await contactSheet(pick, idle ? 'idle-frames' : 'frames');
          out = `${p}\n${pick.length} of ${list.length} changed frames, left to right then down, ms after ${idle ? 'the last action settled' : 'the input'}: ${pick.map(f => '+' + Math.round(f.t - from)).join(' ')}`; break; }
        case 'resize': { vw = num(a, 'w'); vh = num(b, 'h'); await page.setViewportSize({ width: vw, height: vh }); await startCast(); await sleep(400); out = `viewport ${vw}×${vh}\n` + (await snap('resized')); break; }
        case 'reload': { await page.reload({ waitUntil: 'load' }); await startCast(); await sleep(800); out = await snap('reloaded'); break; }
        case 'back': { await page.goBack({ waitUntil: 'load' }).catch(() => {}); await startCast(); await sleep(800); out = await snap('back'); break; }
        case 'errors': out = `${pageErrors} uncaught page error(s) so far`; break;
        case 'stop': case 'quit': res.end('closing the browser\n'); setTimeout(() => quit('stop'), 50); return;
        default: code = 400; out = `unknown command "${c}". Commands: shot grid zoom click dblclick hover move drag tap hold press type scroll wait timing frames resize reload back errors stop`;
      }
    } catch (e) { code = 500; out = 'error: ' + e.message.split('\n')[0]; }
    res.statusCode = code; res.end(out + '\n');
  }); });
}).listen(port, '127.0.0.1', () => console.log(`eyes serving ${url} on ${port}`));
