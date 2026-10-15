// E2E: the action spaces, at 1270×700: the panels (the default since 2026-10-15, plate 1b with Cory's three text lines),
// on tables covering every sphere at rounds I, II and III, and the old sockets behind ?spaces=sockets.
//  (s0) the Lamplit stylesheet is in force (walnut table), whatever order the bundler loads CSS chunks in;
//  (s1) lit: during your placement every space you can take has the lit class, no other does, and no taken space you
//       can't join is lit (panels: the paper panel is lit exactly when its space is);
//  (s2) a click on a taken space shakes it and says "Taken by …" at the pointer;
//  (s3) a click on a space whose ring isn't open shakes it and says "Opens in round II/III";
//  (s4) after every placement, each space shows exactly its minions (the owner and anyone squatting there), and an
//       empty space shows none (the saved state at the same move count is the truth);
//  (s5) no flying ghost (a minion, a card, a "+N" of followers) outlives its flight;
//  (s6) every quadrant with a tiebreak prints it on its rim ("ties: red …"); a sphere with its own rule ("Whatever
//       you steal turns magenta…") gives it in its rim's hover card;
//  (s7) every word on the wheel is at least 12px on screen (the rim's text included), and a panel's gain at least 16px
//       (a verb in its place may step down, Cory: "cut words or step the size down");
//  (s8) the headline prompt fits: no ellipsis, nothing clipped, one line, while placing and while buying;
//  (s9) panels: the print is tidy: no two spaces' words or minions touch, nothing runs into the rim or the hub, each
//       space's print is centred in its own panel, and every line stays inside its panel (no clipping, no overflow).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5196.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/spaces';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5196;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

/** Round I (or `round`), P1 (the only person) to place, with at least two rival minions down; plenty of every color. */
function spaceSave(quadrants, round = 1) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let seed = 1; seed < 80; seed++) {
    let s = createGame({ seats, seed, ...(quadrants ? { quadrants } : {}) });
    s.build = buildStamp();
    const rand = seededRandom(seed);
    const ready = x => x.round === round && x.pending && x.pending.player === 0 && x.pending.kind === 'place' && Object.keys(x.slots).length >= 2;
    for (let n = 0; n < 3000 && !ready(s) && !(s.round > round) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s)) continue;
    for (const r of s.resources) s.players[0].res[r] = 6;
    return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
  }
  throw new Error('spaces: no seed reached P1 placing with rivals down');
}

const errors = [];
const notes = []; // known and reported, not failing
const fail = (m, tag) => { const msg = tag ? `${tag} ${m}` : m; if (!errors.includes(msg)) errors.push(msg); };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// in-page: every flying ghost's life (born → removed), and every class the spaces wear (to catch a shake)
const WATCH = () => {
  window.__sp = { ghosts: [], shakes: [] };
  const born = new Map();
  new MutationObserver(ms => {
    const now = performance.now();
    for (const m of ms) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('ghost-layer')) born.set(n, { at: now, cls: n.className });
        for (const n of m.removedNodes) if (born.has(n)) { const b = born.get(n); window.__sp.ghosts.push({ cls: b.cls, ms: now - b.at }); born.delete(n); }
      } else if (m.attributeName === 'class' && m.target.classList && m.target.classList.contains('shake')) {
        window.__sp.shakes.push(m.target.dataset.slot || m.target.dataset.cell || '?');
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  // a ghost still on screen long after any flight would have ended
  setInterval(() => {
    const now = performance.now();
    for (const [n, b] of born) if (now - b.at > 2500 && !b.flagged && n.isConnected) { b.flagged = true; window.__sp.ghosts.push({ cls: b.cls, ms: now - b.at, alive: true }); }
  }, 250);
};

// ---------- the in-page checks ----------
const LIT = () => {
  const out = [];
  const slots = [...document.querySelectorAll('.lt-wheel .slot[data-slot]')];
  for (const s of slots) {
    const can = s.hasAttribute('data-option'), lit = s.classList.contains('lit');
    if (can && !lit) out.push(`${s.dataset.slot} can be taken but isn't lit`);
    if (!can && lit) out.push(`${s.dataset.slot} is lit but can't be taken`);
    if (s.classList.contains('taken') && !can && lit) out.push(`${s.dataset.slot} is taken and lit`);
    const cell = document.querySelector(`.lt-wheel [data-cell="${s.dataset.slot}"]`);
    if (cell && cell.classList.contains('lit') !== lit) out.push(`${s.dataset.slot}: its printed cell is ${cell.classList.contains('lit') ? '' : 'not '}lit`);
  }
  return { out, lit: slots.filter(s => s.classList.contains('lit')).length, can: slots.filter(s => s.hasAttribute('data-option')).length };
};
const MINIONS = () => {
  let save = null;
  try { save = JSON.parse(localStorage.getItem('patrons.v4.local')); } catch { /* none */ }
  const st = save && save.state;
  const root = document.querySelector('.lt');
  if (!st || !root || String(st.moves) !== root.dataset.moves) return null; // not settled on the same move yet
  const out = [];
  let taken = 0;
  for (const s of document.querySelectorAll('.lt-wheel .slot[data-slot]')) {
    const key = s.dataset.slot;
    const want = st.slots[key] === undefined ? [] : [st.slots[key], ...((st.squats && st.squats[key]) || [])];
    const have = [...s.querySelectorAll('.worker[data-seat]')].map(w => Number(w.dataset.seat));
    if (want.length) taken++;
    if (JSON.stringify([...want].sort()) !== JSON.stringify([...have].sort())) out.push(`${key}: shows minions [${have}] but holds [${want}] (move ${st.moves})`);
    for (const w of s.querySelectorAll('.worker')) { const r = w.getBoundingClientRect(); if (want.length && (!r.width || !r.height)) out.push(`${key}: a minion has no size`); }
  }
  return { out, taken, moves: st.moves };
};
const RIM = () => {
  const out = [];
  for (const t of document.querySelectorAll('.lt-wheel [data-rim-text]')) out.push({ qid: t.dataset.plaque, text: t.textContent });
  return out;
};
const FLOOR = () => {
  const out = [];
  const stage = document.querySelector('.lt-wheel .stage');
  const k = stage.getBoundingClientRect().width / 452;
  const visible = e => { for (let a = e; a && a !== stage; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden') return false; } return true; };
  for (const e of stage.querySelectorAll('*')) {
    if (e instanceof SVGElement) continue;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!visible(e)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 11.95) out.push(`"${e.textContent.trim().slice(0, 24)}" at ${fs}px`);
  }
  // a panel's gain is its hero: its number at least 16px (a verb in its place may step down, never below 12)
  for (const e of stage.querySelectorAll('[data-spaces="panels"] .slot .face .main:not(.verb)')) {
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 15.95) out.push(`gain "${e.textContent.trim()}" at ${fs}px`);
  }
  for (const t of stage.querySelectorAll('[data-rim-text]')) {
    const px = Number(t.getAttribute('font-size')) * k;
    if (px < 11.95) out.push(`rim "${t.textContent.slice(0, 24)}" at ${px.toFixed(1)}px`);
  }
  return out;
};
const PROMPT = () => {
  const out = [];
  const say = document.querySelector('.lt-prompt [data-prompt]');
  if (!say) return ['no prompt'];
  const text = say.textContent.trim();
  if (/…|\.\.\.$/.test(text)) out.push(`the headline ends in an ellipsis: "${text}"`);
  const box = say.querySelector('.say-text') || say;
  if (box.scrollWidth > box.clientWidth + 1 || box.scrollHeight > box.clientHeight + 1) out.push(`the headline overflows its box: "${text}"`);
  const fs = parseFloat(getComputedStyle(box).fontSize);
  const r = document.createRange(); r.selectNodeContents(box);
  const lines = new Set([...r.getClientRects()].filter(x => x.width > 1).map(x => Math.round(x.top / (fs * 0.6))));
  if (lines.size > 1) out.push(`the headline wraps to ${lines.size} lines: "${text}"`);
  const b = r.getBoundingClientRect();
  if (b.top < 0 || b.right > innerWidth || b.left < 0) out.push(`the headline runs off screen: "${text}"`);
  // every line of the prompt (the question, the steps or details, the ranking) sits inside the prompt's region
  const region = document.querySelector('.lt-prompt').getBoundingClientRect();
  for (const row of document.querySelectorAll('.lt-prompt > .bar-row')) {
    const rb = row.getBoundingClientRect();
    if (rb.height && (rb.top < region.top - 1 || rb.bottom > region.bottom + 1)) out.push(`a prompt line (${row.className}) spills out of the prompt region by ${Math.max(region.top - rb.top, rb.bottom - region.bottom).toFixed(1)}px`);
  }
  const sub = document.querySelector('[data-prompt-sub]');
  if (sub && (sub.scrollWidth > sub.clientWidth + 1 || /…$/.test(sub.textContent))) out.push(`the sub-line is cut: "${sub.textContent}"`);
  return out;
};
const INSIDE = () => {
  // panels: the print stays tidy: no two spaces' words or minions touch; nothing crosses into the rim or the hub; each
  // space's print is centred in its own panel, and every line's ink stays inside that panel's paper.
  const out = [];
  const stage = document.querySelector('.lt-wheel .stage');
  const sb = stage.getBoundingClientRect();
  const k = sb.width / 452, cx = sb.left + 226 * k, cy = sb.top + 226 * k;
  const hub = Number(document.querySelector('.lt-wheel svg .hub').getAttribute('r')) * k, rim = 180 * k;
  const all = [];
  for (const s of document.querySelectorAll('.lt-wheel .slot[data-slot]')) {
    const key = s.dataset.slot;
    const boxes = [];
    // a line's ink, not its line box: the font's ascent/descent padding (about a quarter above, a sixth below) is air
    for (const el of s.querySelectorAll('.face .nm, .face .yl, .face .note')) {
      const r = document.createRange(); r.selectNodeContents(el);
      for (const x of r.getClientRects()) if (x.width > 2 && x.height > 2) boxes.push({ what: el.className, x: { left: x.left, right: x.right, top: x.top + x.height * 0.25, bottom: x.bottom - x.height * 0.16 } });
    }
    for (const el of s.querySelectorAll('.face .ico svg, .face .worker svg')) { const x = el.getBoundingClientRect(); boxes.push({ what: el.closest('.ico') ? 'stamp' : 'minion', x: { left: x.left + 1, right: x.right - 1, top: x.top + 1, bottom: x.bottom - 1 } }); }
    if (!boxes.length) continue;
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    for (const { what, x } of boxes) {
      L = Math.min(L, x.left); T = Math.min(T, x.top); R = Math.max(R, x.right); B = Math.max(B, x.bottom);
      for (const [px, py] of [[x.left + 1, x.top + 1], [x.right - 1, x.top + 1], [x.left + 1, x.bottom - 1], [x.right - 1, x.bottom - 1]]) {
        const d = Math.hypot(px - cx, py - cy);
        if (d > rim + 2) { out.push(`${key} ${what} runs ${(d - rim).toFixed(0)}px into the rim`); break; }
        if (d < hub - 2) { out.push(`${key} ${what} runs ${(hub - d).toFixed(0)}px into the hub`); break; }
      }
      all.push({ key, what, x });
    }
    const mid = document.elementsFromPoint((L + R) / 2, (T + B) / 2).find(e => e.matches && e.matches('[data-cell] .wash'));
    if (!mid || mid.closest('[data-cell]').dataset.cell !== key) out.push(`${key}'s print is centred ${mid ? `in ${mid.closest('[data-cell]').dataset.cell}` : 'off its cell'}`);
    // every corner of every line's ink inside its own panel's paper (Cory's screenshot: "Your Call" ran past its edge)
    const wash = document.querySelector(`.lt-wheel [data-cell="${key}"] .wash`);
    if (wash) {
      const inv = wash.getScreenCTM().inverse();
      const svg = wash.ownerSVGElement;
      const inside = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return wash.isPointInFill(p.matrixTransform(inv)); };
      for (const { what, x } of boxes) {
        const corners = [[x.left + 1, x.top + 1], [x.right - 1, x.top + 1], [x.left + 1, x.bottom - 1], [x.right - 1, x.bottom - 1]];
        if (!corners.every(([px, py]) => inside(px, py))) out.push(`${key} ${what} runs past its panel's edge`);
      }
    }
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    if (a.key === b.key) continue;
    const ox = Math.min(a.x.right, b.x.right) - Math.max(a.x.left, b.x.left), oy = Math.min(a.x.bottom, b.x.bottom) - Math.max(a.x.top, b.x.top);
    if (ox > 1 && oy > 1) out.push(`${a.key} ${a.what} touches ${b.key} ${b.what} (${ox.toFixed(0)}×${oy.toFixed(0)}px)`);
  }
  return [...new Set(out)];
};

// three tables cover every sphere (Classic; red/yellow/market/thieves; purple/silver/trading/echo)
const OTHER = ['purple', 'silver', 'trading', 'echo'], TB = ['red', 'yellow', 'market', 'thieves'];
const passes = [
  { look: 'panels', quadrants: null, play: true },
  { look: 'panels', quadrants: TB, play: false },
  { look: 'panels', quadrants: OTHER, play: false },
  // rounds II and III: more rings open, the busiest the wheel gets
  { look: 'panels', quadrants: null, play: false, round: 2 },
  { look: 'panels', quadrants: OTHER, play: false, round: 2 },
  { look: 'panels', quadrants: null, play: false, round: 3 },
  { look: 'panels', quadrants: TB, play: false, round: 3 },
  { look: 'panels', quadrants: OTHER, play: false, round: 3 },
  // the old look, until Cory has played the new one
  { look: 'sockets', quadrants: null, play: true },
  { look: 'sockets', quadrants: null, play: false, round: 3 },
];
const totals = {};
try {
  for (const pass of passes) {
    const tag = `[${pass.look}${pass.quadrants ? ' ' + pass.quadrants.join('/') : ''}${pass.round ? ` round ${pass.round}` : ''}]`;
    const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    page.on('pageerror', e => fail(`pageerror: ${e.message}`, tag));
    page.on('console', m => { if (m.type() === 'error') fail(`console: ${m.text()}`, tag); });
    await page.addInitScript(WATCH);
    const shot = n => page.screenshot({ path: `${SHOTS}/${pass.look}${pass.quadrants ? `-${pass.quadrants[0]}` : ''}${pass.round ? `-r${pass.round}` : ''}-${n}.png` }).catch(() => {});
    const q = `?botDelay=${pass.play ? 200 : 40}${pass.look === 'sockets' ? '&spaces=sockets' : ''}`;
    await page.goto(`${base}/${q}`);
    await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), spaceSave(pass.quadrants, pass.round || 1));
    await page.reload();
    await page.click('[data-home="resume"]');
    await page.waitForTimeout(400);
    { const skip = await page.$('[data-intro-skip]'); if (skip) await skip.click(); }
    await page.waitForSelector('.lt[data-yours="1"][data-phase="place"] .lt-wheel .slot[data-option]', { timeout: 15000 });
    await page.waitForTimeout(700);
    const look = await page.$eval('.lt-wheel .wheel-wrap', e => e.dataset.spaces);
    if (look !== pass.look) fail(`the wheel wears "${look}"`, tag);
    // (s0) the Lamplit stylesheet wins over the base one (a bundling change once loaded v4.css after lamp.css: the
    // walnut went teal and the wheel's layout fell apart)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    if (bg !== 'rgb(29, 22, 17)') fail(`(s0) the table isn't walnut (body ${bg}): the base stylesheet is winning over lamp.css`, tag);
    await shot('place');

    // (s1) lit, (s6) tiebreaks, (s7) 12px, (s8) prompt, (s9) inside the cells
    const lit = await page.evaluate(LIT);
    lit.out.forEach(m => fail(`(s1) ${m}`, tag));
    if (!lit.lit) fail('(s1) nothing is lit during your placement', tag);
    for (const r of await page.evaluate(RIM)) {
      const tb = quadrant(r.qid).scoring.tiebreak;
      if (tb && !r.text.includes(`ties: ${tb.unit.split(' ')[0]}`)) fail(`(s6) ${r.qid}'s rim doesn't print its tiebreak ("${tb.text}"): "${r.text}"`, tag);
    }
    // (s6) a sphere with its own rule says it in the rim's hover card
    for (const qid of pass.quadrants || []) {
      // its closing "Most … at round end wins." is the card's own prize line, said once at the top (design pod, 2026-10-15)
      const rule = (quadrant(qid).rule || '').replace(/\s*Most [^.]*\bat round end wins\.\s*$/i, '').trim();
      if (!rule) continue;
      const at = await page.evaluate(q => {
        const t = document.querySelector(`.lt-wheel [data-plaque="${q}"]`);
        const p = t.getStartPositionOfChar(3), m = t.getScreenCTM();
        return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
      }, qid);
      await page.mouse.move(at.x, at.y);
      const said = await page.waitForSelector(`[data-sphere-rule="${qid}"]`, { timeout: 2500 }).then(e => e.textContent(), () => '');
      if (said !== rule) fail(`(s6) ${qid}'s rim hover doesn't give its rule ("${rule}"): "${said}"`, tag);
      await page.mouse.move(4, 4);
      await page.waitForTimeout(300);
    }
    (await page.evaluate(FLOOR)).forEach(m => fail(`(s7) ${m}`, tag));
    (await page.evaluate(PROMPT)).forEach(m => fail(`(s8) placing: ${m}`, tag));
    if (pass.look === 'panels') (await page.evaluate(INSIDE)).forEach(m => fail(`(s9) ${m}`, tag));

    // (s2) a taken space: shake + "Taken by …" at the pointer
    const taken = await page.$('.lt-wheel .slot.taken:not([data-option])');
    if (!taken) fail('(s2) no taken space to click', tag);
    else {
      const key = await taken.getAttribute('data-slot');
      const b = await taken.boundingBox();
      const at = { x: b.x + b.width / 2 + 5, y: b.y + b.height / 2 + 3 };
      await page.mouse.click(at.x, at.y);
      const note = await page.waitForSelector('[data-deny-note]', { timeout: 1500 }).catch(() => null);
      const text = note ? await note.textContent() : '';
      if (!/^Taken by (you|P\d)$/.test(text)) fail(`(s2) a click on taken ${key} said "${text || 'nothing'}"`, tag);
      if (note) { const r = await note.boundingBox(); if (Math.hypot(r.x - at.x, r.y + r.height - at.y) > 70) fail(`(s2) the note is ${Math.round(Math.hypot(r.x - at.x, r.y + r.height - at.y))}px from the pointer`, tag); }
      const shook = await page.evaluate(k => window.__sp.shakes.includes(k), key);
      if (!shook) fail(`(s2) taken ${key} didn't shake`, tag);
      await shot('deny-taken');
      await page.waitForTimeout(1900);
    }
    // (s3) a space not open yet: shake + "Opens in round …"
    const locked = await page.$('.lt-wheel .slot.locked');
    if (locked) {
      const key = await locked.getAttribute('data-slot');
      const b = await locked.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      const note = await page.waitForSelector('[data-deny-note]', { timeout: 1500 }).catch(() => null);
      const text = note ? await note.textContent() : '';
      if (!/^Opens in round (II|III)$/.test(text)) fail(`(s3) a click on locked ${key} said "${text || 'nothing'}"`, tag);
      if (!(await page.evaluate(k => window.__sp.shakes.includes(k), key))) fail(`(s3) locked ${key} didn't shake`, tag);
      await shot('deny-locked');
    } else if (!pass.round || pass.round < 3) fail('(s3) no locked space before round III', tag);
    await page.mouse.move(4, 4);

    // play round I out: my placements (lit checked each time), the buys (prompt checked), the minions after every move
    let checks = 0, placed = 0, buys = 0;
    const counts = new Set();
    if (pass.play) {
      const t0 = Date.now();
      let lastMoves = -1;
      while (Date.now() - t0 < 120000 && !(await page.$('.lt-reckon, [data-next-round]'))) {
        const m = await page.evaluate(MINIONS);
        if (m && m.moves !== lastMoves) { lastMoves = m.moves; checks++; counts.add(m.taken); m.out.forEach(x => fail(`(s4) ${x}`, tag)); }
        const phase = await page.$eval('.lt', e => (e.dataset.yours === '1' ? e.dataset.phase : '')).catch(() => '');
        if (phase === 'place') {
          await page.waitForTimeout(250);
          const l = await page.evaluate(LIT);
          l.out.forEach(x => fail(`(s1) ${x}`, tag));
          (await page.evaluate(PROMPT)).forEach(x => fail(`(s8) placing: ${x}`, tag));
          const slot = await page.$('.lt-wheel .slot.lit .base');
          // (the wheel may redraw between the query and the measure: then the next pass of the loop tries again)
          const bb = slot && (await slot.boundingBox().catch(() => null));
          if (bb) { await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); placed++; await page.mouse.move(4, 4); }
          await page.waitForTimeout(300);
        } else if (phase === 'choose' || phase === 'setup') {
          const o = await page.$('.prompt.choice button[data-option]:not([disabled])');
          if (o) await o.click().catch(() => {});
          await page.waitForTimeout(250);
        } else if (phase === 'buy') {
          await page.waitForTimeout(300);
          (await page.evaluate(PROMPT)).forEach(x => fail(`(s8) buying: ${x}`, tag));
          if (!buys) await shot('buy');
          buys++;
          await page.click('[data-option="pass"]').catch(() => {});
          await page.waitForTimeout(250);
        } else await page.waitForTimeout(120);
      }
      if (placed < 2) fail(`(s4) only ${placed} placements were made`, tag);
      if (checks < 4) fail(`(s4) the minions were checked at only ${checks} moves`, tag);
      await shot('round-end');
    }
    // (s5) the ghosts: none outlived its flight
    await page.waitForTimeout(pass.play ? 2600 : 300);
    const ghosts = await page.evaluate(() => window.__sp.ghosts);
    const stuck = ghosts.filter(g => g.alive || g.ms > 2500);
    stuck.forEach(g => fail(`(s5) a ${g.cls.replace(' ghost-layer', '')} ghost stayed ${Math.round(g.ms)}ms${g.alive ? ' (still on screen)' : ''}`, tag));
    totals[tag] = `${lit.lit} lit, ${checks} minion checks (${[...counts].sort((a, b) => a - b).join('/')} taken), ${placed} placed, ${buys} buys, ${ghosts.length} ghosts (longest ${Math.round(Math.max(0, ...ghosts.map(g => g.ms)))}ms)`;
    await page.close();
  }
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (server) server.kill();
for (const [k, v] of Object.entries(totals)) console.log(`spaces ${k}: ${v}`);
if (notes.length) console.log(`known (not gated):\n${notes.join('\n')}`);
if (errors.length) console.error(errors.join('\n'));
const ok = errors.length === 0;
console.log(ok ? 'PASS spaces' : 'FAIL spaces');
process.exit(ok ? 0 : 1);
