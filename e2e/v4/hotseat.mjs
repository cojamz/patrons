// E2E: a full hot-seat game in a real browser. 1 person + 3 bots; the person clicks the first legal option each time.
// Fails on any console error or page error. Screenshots go to /tmp/patrons-shots/v4/.
//
// Server: uses $V4_URL if set (npm run check:v4 sets it to a `vite preview`). Otherwise it starts
// `npx vite` itself on the first free port from 5180 and stops it at the end.
import { chromium } from 'playwright';
import { TEXT_CLIP } from './lib/textclip.mjs';
import { LEGACY } from './lib/legacy.mjs';
import { TYPE_SCALE } from './lib/typescale.mjs';
import { answerChoice } from './lib/answer.mjs';
import { SHOP_SIZE } from '../../src/engine/v4/index.js';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '';
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const DESKTOP = { width: 1270, height: 700 };
const PHONE = { width: 400, height: 820 };
const LANDSCAPE = { width: 750, height: 340 };
const SHORT = { width: 1270, height: 560 };

let server = null;
let base = process.env.V4_URL;
if (!base) {
  // Our own dev server on a free port (never reuse whatever else is listening: it may be a stale build).
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5180;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) {
    await new Promise(r => setTimeout(r, 500));
    up = await fetch(base).then(r => r.ok, () => false);
  }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: DESKTOP });
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('response', r => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });

const shot = async (name, size) => {
  if (size) await page.setViewportSize(size);
  await page.waitForTimeout(size ? 250 : 50);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
  if (size && size.width <= 760) {
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (wide > 0) errors.push(`horizontal scroll of ${wide}px at ${size.width}px on ${name}`);
    await page.screenshot({ path: `${SHOTS}/${name}-full.png`, fullPage: true });
  }
  if (size) {
    await page.setViewportSize(DESKTOP);
    // back at the laptop size the column re-lays itself and the chairs slide (.35s) to their places: the region gate
    // read them mid-slide (1–20px off, the same --y, the transform still travelling). Wait until they stand.
    await chairsStand();
  }
};
// every chair's transform has reached the --y the column gave it (no slide in flight), then one more frame
async function chairsStand() {
  await page.waitForFunction(() => {
    // while the column shows (laptop), every chair has its --y (the screen sets it on resize; a phone size clears it)
    const rail = document.querySelector('.lt > .lt-snake');
    const column = !!(rail && rail.offsetHeight);
    return [...document.querySelectorAll('.lt > .lt-seat[data-pid]')].every(e => {
      const y = parseFloat(e.style.getPropertyValue('--y'));
      return Number.isNaN(y) ? !column : Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42 - y) < 0.5;
    });
  }, null, { timeout: 6000, polling: 100 }).catch(() => {});
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
}

let ok = false;
const carried = { flights: 0, ticks: 0 }; // motion counters live in the page: keep them across reloads
const carry = async () => { const c = await page.evaluate(() => [window.__patronsFlights || 0, window.__patronsTicks || 0]).catch(() => [0, 0]); carried.flights += c[0]; carried.ticks += c[1]; };
try {
  await page.goto(`${base}/?botDelay=30`);
  await page.waitForSelector('[data-home="local"]');
  await shot('01-home');
  await shot('01-home-phone', PHONE);
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await shot('02-setup');
  // Pick your emoji (Cory, 2026-10-14): seat 1's button opens a grid of all 20 pixel emojis; pick the Wizard. Every
  // seat shows one, none twice; in the game the Wizard is on your leader's robe (checked below).
  const PICK = 'wizard';
  {
    await page.click('[data-seat-row="0"] [data-emoji-btn]');
    await page.waitForSelector('[data-emoji-grid]');
    const cells = await page.$$eval('[data-emoji-grid] [data-pick] svg rect', els => els.length);
    const n = await page.$$eval('[data-emoji-grid] [data-pick]', els => els.length);
    if (n !== 20 || cells < 20 * 10) errors.push(`emoji picker: ${n} emojis (want 20), drawn with ${cells} pixels`);
    await shot('02-setup-emoji');
    await page.click(`[data-emoji-grid] [data-pick="${PICK}"]`);
    await page.waitForSelector('[data-emoji-grid]', { state: 'detached', timeout: 2000 }).catch(() => errors.push('the emoji picker stayed open after a pick'));
    const faces = await page.$$eval('[data-seat-row]', rows => rows.map(r => { const e = r.querySelector('[data-emoji-btn], [data-emoji-face]'); return e ? (e.getAttribute('data-emoji-btn') ?? e.getAttribute('data-emoji-face')) : ''; }));
    if (faces[0] !== PICK) errors.push(`setup: seat 1 shows "${faces[0]}" after picking ${PICK}`);
    const worn = faces.filter(Boolean);
    if (worn.length !== faces.length || new Set(worn).size !== worn.length) errors.push(`setup: every seat should wear its own emoji: ${JSON.stringify(faces)}`);
  }
  for (const x of await page.evaluate(TYPE_SCALE)) errors.push(`setup: off the type scale (11/14/18/36): ${x}`);
  await page.click('[data-start]');
  // The intro (src/v4/Intro.jsx): this browser's first game shows it once, over the table; one tap on Skip ends it
  {
    const shown = await page.waitForSelector('[data-intro]', { timeout: 4000 }).catch(() => null);
    if (!shown) errors.push('the intro did not appear on the first game start');
    else {
      await page.waitForTimeout(700);
      await shot('02a-intro');
      const t = Date.now();
      await page.click('[data-intro-skip]');
      const gone = await page.waitForSelector('[data-intro]', { state: 'detached', timeout: 1500 }).then(() => true, () => false);
      if (!gone) errors.push('one tap on Skip did not dismiss the intro');
      else if (Date.now() - t > 1000) errors.push(`the intro took ${Date.now() - t}ms to go after Skip`);
    }
  }
  await page.waitForSelector('.lt-seat[data-pid]');
  {
    const leaders = await page.$$eval('.lt-seat[data-pid] [data-leader] svg[data-emoji]', els => els.map(e => [e.closest('.lt-seat').getAttribute('data-pid'), e.getAttribute('data-emoji')]));
    const mine = leaders.find(([pid]) => pid === '0');
    if (!mine || mine[1] !== PICK) errors.push(`your leader wears "${mine && mine[1]}", not the ${PICK} you picked`);
    const all = leaders.map(([, e]) => e);
    if (leaders.length < 2 || all.some(e => !e) || new Set(all).size !== all.length) errors.push(`each cult leader should wear its own emoji: ${JSON.stringify(leaders)}`);
  }
  // How to play lives behind the one menu glyph
  await page.click('.lt-menu .menu-glyph');
  await page.click('.lt-menu .rules-btn');
  await page.waitForSelector('.rules-body');
  await page.waitForTimeout(400);
  await shot('02-how-to-play');
  await shot('02-how-to-play-phone', PHONE);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.rules-body', { state: 'detached' });

  // Setup: what's for sale decides the starting picks, so every face-up member is on screen (no scrolling)
  {
    await page.waitForSelector('.prompt.choice.setup');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.lt-shop .card')];
      const vis = e => { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden' || e.closest('[aria-hidden="true"]')) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.left >= -0.5 && b.top >= -0.5 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5; };
      return { n: cards.length, shown: cards.filter(vis).length, named: cards.filter(c => (c.querySelector('.nm') || {}).textContent).length };
    });
    if (r.n !== SHOP_SIZE || r.shown !== SHOP_SIZE || r.named !== SHOP_SIZE) { errors.push(`setup: ${r.shown} of ${r.n} shop members fully on screen at 1270×700 (want ${SHOP_SIZE})`); await shot('zz-setup-shop'); }
    await shot('02b-setup-shop');
  }
  const seen = new Set();
  let facingSeen = null;
  let lastClipCheck = null;
  const stories = new Set(); // the one-line turn stories seen by the board
  let regionBoxes = null; const phasesSeen = new Set(); // fixed regions, compared across phases
  const t0 = Date.now();
  let clicks = 0;
  while (!(await page.$('.results'))) {
    if (Date.now() - t0 > 240000) throw new Error('game did not finish in 4 minutes');
    if (await page.$('[data-intro]')) { errors.push('the intro showed again mid-game (resume or reload)'); await page.click('[data-intro-skip]').catch(() => {}); }
    const hand = await page.$('[data-handoff]');
    if (hand) { await hand.click(); continue; }
    const next = await page.$('[data-next-round]');
    // Once: a reload on the final scoring card (the game is over, its results not yet shown) reopens that card (the
    // Reckoning may replay first), and the save is kept until the results are on screen (resume-edge.mjs: rounds I/II).
    if (next && !seen.has('reload-final') && await page.$eval('[data-next-round]', e => /See results/.test(e.textContent)).catch(() => false)) {
      seen.add('reload-final');
      const keys0 = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('patrons.v4.')).sort());
      if (!keys0.includes('patrons.v4.local')) errors.push(`final scoring card: the save is gone before the results (${keys0.join(', ')})`);
      await carry(); await page.reload();
      await page.waitForSelector('.lt-reckon, [data-next-round]', { timeout: 8000 }).catch(() => errors.push('reload on the final scoring card did not reopen it'));
      if (await page.$('.results')) errors.push('reload on the final scoring card skipped it to the results');
      await shot('08-after-reload-final');
      continue;
    }
    if (next) {
      const r = await page.$eval('.roundend h2', e => e.textContent).catch(() => 'x');
      if (!seen.has(r)) { seen.add(r); await page.waitForTimeout(800); await shot(`04-${r.replace(/\W+/g, '_')}`); if (/II /.test(r + ' ')) await shot(`04-${r.replace(/\W+/g, '_')}-phone`, PHONE); }
      await next.click();
      continue;
    }
    // the furniture never moves: every region keeps its box from phase to phase (only the lamp moves), and every
    // open space prints its effect, readable without hovering (≥11px)
    {
      const r = await page.evaluate(() => {
        const vp = innerWidth + 'x' + innerHeight;
        const regions = Object.fromEntries(['prompt', 'wheel', 'shop', 'seat-0', 'seat-1', 'seat-2', 'seat-3'].map(k => { const e = document.querySelector(`.lt [data-region="${k}"]`); if (!e) return [k, null]; const b = e.getBoundingClientRect(); return [k, [b.left, b.top, b.width, b.height].map(Math.round).join(',')]; }));
        const phase = (document.querySelector('.app.game') || {}).dataset?.phase;
        const round = (document.querySelector('.app.game') || {}).dataset?.round;
        const bad = [];
        for (const sl of document.querySelectorAll('.lt .slot.open')) {
          const y = sl.querySelector('[data-yield]');
          const fs = y ? parseFloat(getComputedStyle(y).fontSize) : 0;
          if (!y || !y.textContent.trim() && !y.querySelector('.pip')) bad.push(`${sl.dataset.slot}: no effect printed`);
          else if (fs < 11) bad.push(`${sl.dataset.slot}: effect at ${fs}px`);
        }
        // how the column stood: each chair's --y, its transform, height and fractional top, and the column's height
        const column = [...document.querySelectorAll('.lt > .lt-seat[data-pid]')].map(e => `${e.dataset.region} y${e.style.getPropertyValue('--y')} t${new DOMMatrixReadOnly(getComputedStyle(e).transform).m42} h${e.getBoundingClientRect().height.toFixed(1)} top${e.getBoundingClientRect().top.toFixed(1)}`).join(', ') + ` | column ${document.querySelector('.lt > .lt-snake')?.getBoundingClientRect().height.toFixed(1)}`;
        return { vp, regions, phase, round, bad, column };
      });
      if (r.vp === '1270x700' && r.phase && !['over', 'reckon'].includes(r.phase)) {
        if (!regionBoxes) regionBoxes = { ...r.regions, phase: r.phase, round: r.round, column: r.column };
        // the chairs stand in the round's turn order (Cory, 2026-10-15: "position IS order"): a new round may re-sort
        // them, so their boxes are re-read at each round start; within a round, and for every other region, never
        if (r.round !== regionBoxes.round) {
          // let the re-sort finish (a .35s slide), then take the chairs' new places as this round's baseline. Waiting a
          // fixed 900ms measured mid-slide on a loaded box (the slide's frames lag), which read as chairs moving 3–9px
          // within the round: wait until every chair stands where the column put it (its transform reached --y)
          await page.waitForTimeout(400);
          await chairsStand();
          const now = await page.evaluate(() => Object.fromEntries(['seat-0', 'seat-1', 'seat-2', 'seat-3'].map(k => { const e = document.querySelector(`.lt [data-region="${k}"]`); if (!e) return [k, null]; const b = e.getBoundingClientRect(); return [k, [b.left, b.top, b.width, b.height].map(Math.round).join(',')]; })));
          for (const k of Object.keys(now)) { regionBoxes[k] = now[k]; r.regions[k] = now[k]; }
          regionBoxes.round = r.round;
          regionBoxes.column = await page.evaluate(() => [...document.querySelectorAll('.lt > .lt-seat[data-pid]')].map(e => `${e.dataset.region} y${e.style.getPropertyValue('--y')} t${new DOMMatrixReadOnly(getComputedStyle(e).transform).m42} h${e.getBoundingClientRect().height.toFixed(1)} top${e.getBoundingClientRect().top.toFixed(1)}`).join(', ') + ` | column ${document.querySelector('.lt > .lt-snake')?.getBoundingClientRect().height.toFixed(1)}`);
        }
        for (const k of Object.keys(r.regions)) if (r.regions[k] !== regionBoxes[k]) { const m = `the ${k} region moved between ${regionBoxes.phase} and ${r.phase} (${regionBoxes[k]} -> ${r.regions[k]})${/^seat/.test(k) ? ` [was ${regionBoxes.column}; now ${r.column}]` : ''}`; if (!errors.includes(m)) { errors.push(m); await shot('zz-region-moved'); } }
        phasesSeen.add(r.phase);
      }
      for (const b of r.bad) { const m = `space not readable without hover: ${b}`; if (!errors.includes(m)) errors.push(m); }
    }
    // no text anywhere is cut off (1270×700), checked once per step
    const movesNow = await page.$eval('.app.game', e => e.dataset.moves).catch(() => null);
    if (movesNow !== lastClipCheck) {
      lastClipCheck = movesNow;
      for (const x of await page.evaluate(TEXT_CLIP)) { const m = `text cut: ${x}`; if (!errors.includes(m)) { errors.push(m); await shot(`zz-text-cut-${errors.length}`); } }
      // two drawn marks only, the dot and the follower; every other symbol is a word (lib/legacy.mjs, design pod)
      for (const x of await page.evaluate(LEGACY)) { const m = `legacy symbol: ${x}`; if (!errors.includes(m)) { errors.push(m); await shot(`zz-legacy-${errors.length}`); } }
      // every word on one of the table's four sizes (lib/typescale.mjs; design pod: the screens drifted to 12–25px)
      for (const x of await page.evaluate(TYPE_SCALE)) { const m = `off the type scale (11/14/18/36): ${x}`; if (!errors.includes(m)) errors.push(m); }
    }
    // the turn card carries its whole line in data-turn-story (UI-A); the older screen had a .caption
    const cap = await page.evaluate(() => { const t = document.querySelector('[data-turn-story]'); if (t) return t.getAttribute('data-turn-story'); const c = document.querySelector('.caption'); return c ? c.textContent : null; }).catch(() => null);
    if (cap) stories.add(cap);
    // the board never turns by itself (this run never spins it): its rotation stays put from step to step
    const facingNow = await page.$eval('.lt-wheel g.wheel', e => e.getAttribute('transform')).catch(() => null);
    if (facingNow && !facingSeen) facingSeen = facingNow;
    if (facingNow && facingSeen && facingNow !== facingSeen) { errors.push(`the board turned by itself (${facingSeen} -> ${facingNow})`); facingSeen = facingNow; }
    // a choice panel has its own space: never over the shop's cards, the follower buys or a cult
    if (await page.$('.prompt.choice:not(.setup)')) {
      const bad = await page.evaluate(() => {
        const vis = e => { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        const ch = document.querySelector('.prompt.choice:not(.setup)'); if (!ch || !vis(ch)) return [];
        const a = ch.getBoundingClientRect(); const out = [];
        for (const sel of ['.lt-shop .lt-cards', '.lt-shop .lt-rates', '.lt-seat-0', '.lt-seat-1', '.lt-seat-2', '.lt-seat-3']) {
          const o = document.querySelector(sel); if (!o || !vis(o) || o.closest('[aria-hidden="true"]')) continue;
          const b = o.getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 1 && h > 1) out.push(`choice panel overlaps ${sel} by ${Math.round(h)}px`);
        }
        return out;
      });
      for (const b of bad) if (!errors.includes(b)) { errors.push(b); await shot('zz-choice-overlap'); }
    }
    // the side column's parts never overlap each other (the compact shop once slid under the buy row)
    {
      const bad = await page.evaluate(() => {
        const vis = e => { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        // the fixed regions never overlap each other, and a question note never covers the shop or the buy row
        const els = ['.lt-prompt', '.lt-wheel', '.lt-shop', '.lt-seat-0', '.lt-seat-1', '.lt-seat-2', '.lt-seat-3', '.lt-wheel > .prompt.choice', '.lt-shop .lt-rates'].map(s => [s, document.querySelector(s)]).filter(([, e]) => e && vis(e) && !e.closest('[aria-hidden="true"]'));
        const nested = (a, b) => a.contains(b) || b.contains(a);
        // chairs mid-slide (a new round's re-sort passes them through each other) are measured once they stand
        const sliding = e => { if (!e.matches('.lt-seat')) return false; const y = parseFloat(e.style.getPropertyValue('--y')); return !Number.isNaN(y) && Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42 - y) >= 0.5; };
        const out = [];
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
          if (nested(els[i][1], els[j][1]) || sliding(els[i][1]) || sliding(els[j][1])) continue;
          const a = els[i][1].getBoundingClientRect(), b = els[j][1].getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 1 && h > 1) out.push(`${els[i][0]} overlaps ${els[j][0]} by ${Math.round(h)}px`);
        }
        return out;
      });
      for (const b of bad) if (!errors.includes(b)) { errors.push(b); await shot('zz-side-overlap'); }
    }
    const kind = await page.evaluate(() => {
      const el = document.querySelector('[data-option]:not([disabled])');
      return el ? el.getAttribute('data-option').split(':')[0] : null;
    });
    if (!kind) { await page.waitForTimeout(30); continue; }
    const round = await page.$eval('header .round', e => e.textContent).catch(() => '');
    const tag = `${kind}@${round.split(' ·')[0]}`;
    if (!seen.has(tag) && ['slot', 'card', 'color', 'tier', 'pass', 'pay'].includes(kind)) {
      seen.add(tag);
      const name = `03-${String(seen.size).padStart(2, '0')}-${tag.replace(/[^a-z0-9@]+/gi, '_')}`;
      await shot(name);
      if (kind === 'card' && /II/.test(round) && !seen.has('short')) { seen.add('short'); await shot(`${name}-short`, SHORT); await shot(`${name}-landscape`, LANDSCAPE); }
      if (seen.size === 2 || kind === 'pay' || (kind === 'color' && /Setup/.test(round)) || (/III/.test(round) && !seen.has('phone3') && seen.add('phone3'))) await shot(`${name}-phone`, PHONE);
    }
    // Once: the space card on hover and a member chip's popover.
    if (kind === 'slot' && /II/.test(round) && !seen.has('peek')) {
      seen.add('peek');
      const base = await page.$('.slot.can .base');
      const bb = base && await base.boundingBox();
      if (bb) {
        await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(250);
        if (!(await page.$('[data-hover-card="space"]'))) errors.push('hovering a space did not show its card');
        await shot('07-space-card');
      }
      // a member in a cult (a figure at the table) opens its card
      const chip = await page.$('.lt-seat [data-member] .fig, .lt-seat .lt-member .fig');
      if (chip) {
        await chip.click(); await page.waitForTimeout(250); await shot('07-chip-popover');
        if (!(await page.$('.popover [data-card], .popover .card-face'))) errors.push('a member figure did not open its card');
        await page.keyboard.press('Escape');
      }
      // tapping a taken space explains itself on the space, and leaves the turn prompt alone
      const takenHit = await page.$('.slot:has(.worker):not(.can) .hit');
      const tb = takenHit && await takenHit.boundingBox();
      if (tb) {
        const before = await page.$eval('[data-prompt]', e => e.textContent);
        await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
        await page.waitForTimeout(200);
        const after = await page.$eval('[data-prompt]', e => e.textContent);
        if (before !== after) errors.push(`clicking a taken space changed the prompt ("${before}" -> "${after}")`);
        // a click hides the hover card (tester S); hovering shows it, which the check above covers
        if (await page.$('.lt-note.pinned[data-hover-card="space"]')) errors.push('clicking a taken space pinned a card on desktop');
        await page.keyboard.press('Escape');
      }
      await page.mouse.move(5, 5);
      continue;
    }
    // Once: undo a placement, then reload mid-game and resume, then browser Back and resume again.
    // Once: the first starting pick can be taken back (a double tap no longer commits it for good).
    if (!seen.has('undo-pick') && await page.$('.undo:has-text("pick")')) {
      seen.add('undo-pick');
      await page.click('.undo:has-text("pick")');
      await page.waitForTimeout(200);
      const p = await page.$eval('.prompt.choice p', e => e.textContent).catch(() => '');
      if (!/1 of 2/.test(p)) errors.push(`undoing the first starting pick did not reopen it ("${p}")`);
      continue;
    }
    if (!seen.has('undo') && await page.$('.undo:not(:has-text("pick"))')) {
      seen.add('undo');
      const before = await page.$$eval('.slot .worker', e => e.length);
      await shot('05-undo-offered');
      await page.click('.undo:not(:has-text("pick"))');
      // the worker leaves as the table shows the undone step: wait for it (up to 3s) rather than a fixed 150ms, which
      // a loaded box missed (the undo landed ~200ms later; QA trace, 2026-10-15)
      await page.waitForFunction(b => document.querySelectorAll('.slot .worker').length === b - 1, before, { timeout: 3000, polling: 50 }).catch(() => {});
      const after = await page.$$eval('.slot .worker', e => e.length);
      if (after !== before - 1) errors.push(`undo did not take the worker back (${before} -> ${after})`);
      // a click on the exact center of a glowing space places there (the dot and label never eat it)
      const base = await page.$('.slot.can .base');
      const bb = base && await base.boundingBox();
      if (bb) {
        await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
        await page.waitForFunction(a => document.querySelectorAll('.slot .worker').length === a + 1, after, { timeout: 3000, polling: 50 }).catch(() => {});
        const again = await page.$$eval('.slot .worker', e => e.length);
        if (again !== after + 1) errors.push(`center click after undo did not place (${after} -> ${again})`);
        // the "Placement undone" note goes with the step it was about: the pill now tracks the real prompt
        const pill = await page.$eval('[data-prompt]', e => e.textContent).catch(() => '');
        if (/undone/i.test(pill)) errors.push(`after undo and a new placement the pill still says "${pill}"`);
      }
      continue;
    }
    if (seen.has('undo') && !seen.has('reload') && /II/.test(round)) {
      seen.add('reload');
      const f0 = await page.$eval('.lt-seat[data-pid="0"] [data-followers]', e => e.dataset.followers);
      await carry(); await page.reload();
      // a reload mid-game goes straight back into it
      await page.waitForSelector('.lt-seat[data-pid]', { timeout: 8000 }).catch(() => errors.push('reload did not reopen the game'));
      await shot('06-after-reload');
      const f1 = await page.$eval('.lt-seat[data-pid="0"] [data-followers]', e => e.dataset.followers);
      if (f0 !== f1) errors.push(`resume changed P1's followers (${f0} -> ${f1})`);
      // browser Back mid-game (an edge swipe on a phone) asks first: "Keep playing" stays put, "Leave" goes home
      const leaveAsk = '[role="alertdialog"][aria-label="Leave this game?"]';
      await page.goBack();
      if (!(await page.waitForSelector(leaveAsk, { timeout: 5000 }).catch(() => null))) errors.push('browser Back mid-game did not ask before leaving');
      else {
        if (!(await page.$('.lt-seat[data-pid]'))) errors.push('browser Back left the game before the player answered');
        await page.click(`${leaveAsk} >> text=Keep playing`);
        await page.waitForSelector(leaveAsk, { state: 'detached', timeout: 5000 }).catch(() => errors.push('"Keep playing" did not close the Leave question'));
        const f2 = await page.$eval('.lt-seat[data-pid="0"] [data-followers]', e => e.dataset.followers).catch(() => null);
        if (f2 !== f1) errors.push(`"Keep playing" after Back changed the game (P1 followers ${f1} -> ${f2})`);
        await page.goBack();
        await page.waitForSelector(leaveAsk, { timeout: 5000 }).catch(() => errors.push('a second Back did not ask again'));
        await page.click(`${leaveAsk} [data-confirm]`).catch(() => errors.push('no Leave button on the Leave question'));
      }
      await page.waitForSelector('[data-home="resume"]', { timeout: 5000 }).catch(() => errors.push('Leave after browser Back did not return home'));
      await page.click('[data-home="resume"]');
      await page.waitForSelector('.lt-seat[data-pid]');
      facingSeen = null; // a reopened game starts facing its default quadrant
      continue;
    }
    // Once, near the end: a reload in round III (bots and you mid-round) must reopen the same game, and the
    // save must still be there (a reload once erased a hot-seat game, leaving only the round-start snapshot).
    if (seen.has('reload') && !seen.has('reload-end') && /III|\(last\)/.test(round) && kind === 'slot') {
      seen.add('reload-end');
      const keys0 = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('patrons.v4.')).sort());
      if (!keys0.includes('patrons.v4.local')) errors.push(`round III: no main save in storage (${keys0.join(', ')})`);
      await carry(); await page.reload();
      await page.waitForSelector('.lt-seat[data-pid], .results', { timeout: 8000 }).catch(() => errors.push('reload in round III did not reopen the game'));
      const r3 = await page.$eval('header .round', e => e.textContent).catch(() => '');
      if (!/III|Final/.test(r3)) errors.push(`reload in round III reopened at "${r3}"`);
      await shot('06-after-reload-round3');
      continue;
    }
    // the first answer in page order, as a person would give it (lib/answer.mjs: board picks, pairs, the pay sheet's
    // suggested way; never a toggle, which would loop, or Back)
    const did = await answerChoice(page);
    if (did) clicks++;
    await page.waitForTimeout(did ? 20 : 30);
  }
  await page.waitForTimeout(200);
  await shot('09-results');
  // the results use the phone's whole width (they sat in one 117px column of the phone grid: detail designer, 10:55)
  await page.setViewportSize(PHONE); await page.waitForTimeout(250);
  const resW = await page.$eval('.results', e => e.getBoundingClientRect().width).catch(() => 0);
  if (resW < PHONE.width * 0.8) errors.push(`results: ${Math.round(resW)}px wide on a ${PHONE.width}px phone`);
  await shot('09-results-phone', PHONE);
  for (const x of await page.evaluate(TYPE_SCALE)) errors.push(`results: off the type scale (11/14/18/36): ${x}`);
  const winner = await page.$eval('.results .win', e => e.textContent);
  const resultsFace = await page.$eval('.results [data-who="0"] svg[data-emoji]', e => e.getAttribute('data-emoji')).catch(() => null);
  if (resultsFace !== PICK) errors.push(`results: seat 1 shows "${resultsFace}", not the ${PICK} they picked`);
  // the results are on screen: now (and only now) the save is gone
  await page.waitForTimeout(300);
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k === 'patrons.v4.local' || k === 'patrons.v4.roundStart'));
  if (left.length) errors.push(`results shown but the finished game is still saved (${left.join(', ')})`);
  const flights = carried.flights + await page.evaluate(() => window.__patronsFlights || 0);
  const ticks = carried.ticks + await page.evaluate(() => window.__patronsTicks || 0);
  console.log(`motion: ${flights} flights (cards and workers), ${ticks} number count-ups`);
  if (!ticks) errors.push('no numbers counted up');
  if (!flights) errors.push('no card or worker flights ran');
  for (const ph of ['place', 'buy']) if (!phasesSeen.has(ph)) errors.push(`never compared regions in the ${ph} phase`);
  // every turn is told by the board in plain words: rivals' and your own
  const told = [...stories].filter(t => / took .+ · /.test(t));
  console.log(`turn stories: ${told.length} (e.g. "${told[0] || ''}")`);
  if (told.length < 5) errors.push(`only ${told.length} turn stories by the board`);
  if (!told.some(t => t.startsWith('You took'))) errors.push('your own turns were never told ("You took …")');
  for (const why of ['undo', 'undo-pick', 'reload', 'reload-end', 'reload-final']) if (!seen.has(why)) errors.push(`never exercised ${why}`);
  console.log(`finished after ${clicks} clicks: ${winner}`);
  // Play again returns to a fresh game.
  await page.click('[data-play-again]');
  await page.waitForSelector('.lt-seat[data-pid]');
  if (await page.$('.results')) throw new Error('Play again did not start a new game');
  if (!(await page.$(`.lt-seat[data-pid="0"] [data-leader] svg[data-emoji="${PICK}"]`))) errors.push(`Play again dropped your ${PICK}`);
  await page.waitForTimeout(500);
  if (await page.$('[data-intro]')) errors.push('the intro showed again on a second game');
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  await page.screenshot({ path: `${SHOTS}/zz-failure.png` }).catch(() => {});
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS hotseat' : 'FAIL hotseat');
process.exit(ok ? 0 : 1);
