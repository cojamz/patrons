// E2E: a full hot-seat game in a real browser. 1 person + 3 bots; the person clicks the first legal option each time.
// Fails on any console error or page error. Screenshots go to /tmp/patrons-shots/v4/.
//
// Server: uses $V4_URL if set (npm run check:v4 sets it to a `vite preview`). Otherwise it starts
// `npx vite` itself on the first free port from 5180 and stops it at the end.
import { chromium } from 'playwright';
import { TEXT_CLIP } from './lib/textclip.mjs';
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
  if (size) await page.setViewportSize(DESKTOP);
};

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
  await page.click('[data-start]');
  await page.waitForSelector('.players');
  await page.click('text=How to play');
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
      const cards = [...document.querySelectorAll('.shop-panel.compact .card')];
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
  const t0 = Date.now();
  let clicks = 0;
  while (!(await page.$('.results'))) {
    if (Date.now() - t0 > 240000) throw new Error('game did not finish in 4 minutes');
    const hand = await page.$('[data-handoff]');
    if (hand) { await hand.click(); continue; }
    const next = await page.$('[data-next-round]');
    // Once: a reload on the final scoring card (the game is over, its results not yet shown) reopens it, and the
    // save is kept until the results are on screen.
    if (next && !seen.has('reload-final') && await page.$eval('.roundend', e => /End-game bonuses come next/.test(e.textContent)).catch(() => false)) {
      seen.add('reload-final');
      const keys0 = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('patrons.v4.')).sort());
      if (!keys0.includes('patrons.v4.local')) errors.push(`final scoring card: the save is gone before the results (${keys0.join(', ')})`);
      await carry(); await page.reload();
      await page.waitForSelector('.results', { timeout: 8000 }).catch(() => errors.push('reload on the final scoring card did not reopen the finished game'));
      await shot('08-after-reload-final');
      continue;
    }
    if (next) {
      const r = await page.$eval('.roundend h2', e => e.textContent).catch(() => 'x');
      if (!seen.has(r)) { seen.add(r); await page.waitForTimeout(800); await shot(`04-${r.replace(/\W+/g, '_')}`); if (/II /.test(r + ' ')) await shot(`04-${r.replace(/\W+/g, '_')}-phone`, PHONE); }
      await next.click();
      continue;
    }
    // no text anywhere is cut off (1270×700), checked once per step
    const movesNow = await page.$eval('.app.game', e => e.dataset.moves).catch(() => null);
    if (movesNow !== lastClipCheck) {
      lastClipCheck = movesNow;
      for (const x of await page.evaluate(TEXT_CLIP)) { const m = `text cut: ${x}`; if (!errors.includes(m)) { errors.push(m); await shot(`zz-text-cut-${errors.length}`); } }
    }
    const cap = await page.$eval('.caption', e => e.textContent).catch(() => null);
    if (cap) stories.add(cap);
    const facingNow = await page.$eval('.qtab.on', e => e.textContent).catch(() => null);
    if (facingNow && !facingSeen) facingSeen = facingNow;
    if (facingNow && facingSeen && facingNow !== facingSeen) { errors.push(`the board turned by itself (${facingSeen} -> ${facingNow})`); facingSeen = facingNow; }
    // a choice panel has its own space: never over the compact shop, the buy row or the "More below" pill
    if (await page.$('.prompt.choice:not(.setup)')) {
      const bad = await page.evaluate(() => {
        const vis = e => { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        const ch = document.querySelector('.prompt.choice:not(.setup)'); if (!ch || !vis(ch)) return [];
        const a = ch.getBoundingClientRect(); const out = [];
        for (const sel of ['.shop-panel.compact', '.fbuy', '.more-hint']) {
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
        const els = ['.side .side-scroll', '.side .shop-panel.compact', '.side .fbuy', '.side .prompt.choice'].map(s => [s, document.querySelector(s)]).filter(([, e]) => e && vis(e) && !e.closest('[aria-hidden="true"]') && !e.closest('.buy-view'));
        const out = [];
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
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
        if (!(await page.$('.peek'))) errors.push('hovering a space did not show its card');
        await shot('07-space-card');
      }
      const chip = await page.$('.pl .chip');
      if (chip) {
        await chip.click(); await page.waitForTimeout(250); await shot('07-chip-popover');
        if (!(await page.$('.popover'))) errors.push('member chip did not open its card');
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
        if (await page.$('.peek.pinned')) errors.push('clicking a taken space pinned a card on desktop');
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
      await page.waitForTimeout(150);
      const after = await page.$$eval('.slot .worker', e => e.length);
      if (after !== before - 1) errors.push(`undo did not take the worker back (${before} -> ${after})`);
      // a click on the exact center of a glowing space places there (the dot and label never eat it)
      const base = await page.$('.slot.can .base');
      const bb = base && await base.boundingBox();
      if (bb) {
        await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
        await page.waitForTimeout(250);
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
      const f0 = await page.$eval('.pl[data-pid="0"] .fol .num', e => e.childNodes[0].textContent);
      await carry(); await page.reload();
      // a reload mid-game goes straight back into it
      await page.waitForSelector('.players', { timeout: 8000 }).catch(() => errors.push('reload did not reopen the game'));
      await shot('06-after-reload');
      const f1 = await page.$eval('.pl[data-pid="0"] .fol .num', e => e.childNodes[0].textContent);
      if (f0 !== f1) errors.push(`resume changed P1's followers (${f0} -> ${f1})`);
      await page.goBack();
      await page.waitForSelector('[data-home="resume"]', { timeout: 5000 }).catch(() => errors.push('browser Back did not return home'));
      await page.click('[data-home="resume"]');
      await page.waitForSelector('.players');
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
      await page.waitForSelector('.players, .results', { timeout: 8000 }).catch(() => errors.push('reload in round III did not reopen the game'));
      const r3 = await page.$eval('header .round', e => e.textContent).catch(() => '');
      if (!/III|Final/.test(r3)) errors.push(`reload in round III reopened at "${r3}"`);
      await shot('06-after-reload-round3');
      continue;
    }
    // the first legal option in page order (skip on/off toggles, which would loop)
    const els = await page.$$('[data-option]:not([disabled])');
    let clicked = false;
    for (const el of els) {
      const id = await el.getAttribute('data-option').catch(() => null);
      if (!id || id.startsWith('toggle:') || id === 'back') continue; // pay: confirm the default
      try { await el.click({ timeout: 1500 }); clicked = true; clicks++; break; } catch { /* covered, moved or detached; try the next */ }
    }
    if (!clicked) await page.waitForTimeout(30);
    else await page.waitForTimeout(20);
  }
  await page.waitForTimeout(200);
  await shot('09-results');
  await shot('09-results-phone', PHONE);
  const winner = await page.$eval('.results .win', e => e.textContent);
  // the results are on screen: now (and only now) the save is gone
  await page.waitForTimeout(300);
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k === 'patrons.v4.local' || k === 'patrons.v4.roundStart'));
  if (left.length) errors.push(`results shown but the finished game is still saved (${left.join(', ')})`);
  const flights = carried.flights + await page.evaluate(() => window.__patronsFlights || 0);
  const ticks = carried.ticks + await page.evaluate(() => window.__patronsTicks || 0);
  console.log(`motion: ${flights} flights (cards and workers), ${ticks} number count-ups`);
  if (!ticks) errors.push('no numbers counted up');
  if (!flights) errors.push('no card or worker flights ran');
  // every turn is told by the board in plain words: rivals' and your own
  const told = [...stories].filter(t => / took .+ · /.test(t));
  console.log(`turn stories: ${told.length} (e.g. "${told[0] || ''}")`);
  if (told.length < 8) errors.push(`only ${told.length} turn stories by the board`);
  if (!told.some(t => t.startsWith('You took'))) errors.push('your own turns were never told ("You took …")');
  for (const why of ['undo', 'undo-pick', 'reload', 'reload-end', 'reload-final']) if (!seen.has(why)) errors.push(`never exercised ${why}`);
  console.log(`finished after ${clicks} clicks: ${winner}`);
  // Play again returns to a fresh game.
  await page.click('[data-play-again]');
  await page.waitForSelector('.players');
  if (await page.$('.results')) throw new Error('Play again did not start a new game');
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
