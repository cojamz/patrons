// E2E: a full game on a phone (390×844, touch), at Normal pace, with build-failing assertions:
//  (a) every visible button / [role=button] / input has a hit box of at least 44×44 at every step
//      (wheel spaces are measured by their invisible hit circle);
//  (b) "Undo" is never visible while the seat to act isn't the human who made the move;
//  (c) consecutive bot steps are at least 600ms apart (in-page timestamps of each displayed move);
//  (d) no interactive element is clipped by its nearest overflow-hidden ancestor, and no text anywhere is cut off
//      (wider than its box, or sticking out of a clipping ancestor; lib/textclip.mjs);
//  (e) your own recruit visibly flies into your panel (a frame check);
//  (f) no two header items overlap (the header's rows stack cleanly); (f2) the game header is at most 96px tall;
//  (g) a choice panel never overlaps the compact shop, the buy row or the "More below" pill (a sheet must be opaque);
//  (h) the page never scrolls sideways: scrollWidth <= clientWidth and scrollX stays 0 after every tap;
//  (i) no hover card ever opens from a touch (or a synthetic hover after a tap);
//  (j) setup: the starting-resource chips are fully on screen without scrolling (iPhone 13, taps and clicks);
//  (l) paying: the suggested coins sit in the cost, a tap takes one back, a tap on your resource puts it in;
//  (m) reading a shop card never recruits it: a tap opens the card, and its Recruit button recruits;
//  (k) setup: the face-up members for sale are in the setup tray (its strip on screen, each card a swipe away at
//      most), and each opens its card on a tap.
// Server: $V4_URL if set, else starts `npx vite` on a free port from 5182.
import { chromium, devices } from 'playwright';
import { TEXT_CLIP } from './lib/textclip.mjs';
import { SHOP_SIZE } from '../../src/engine/v4/index.js';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/touch-e2e';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5182;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const fail = new Map(); // de-duplicated failures: message -> first step
const note = (msg, step) => { if (!fail.has(msg)) fail.set(msg, step); };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));

// in-page: timestamp every displayed move, with whether a bot made it
await page.addInitScript(() => {
  window.__steps = [];
  const watch = () => {
    const el = document.querySelector('.app.game');
    if (!el) { requestAnimationFrame(watch); return; }
    let prev = { moves: el.dataset.moves, bot: el.dataset.bot, round: (document.querySelector('header .round') || {}).textContent || '' };
    new MutationObserver(() => {
      const now = { moves: el.dataset.moves, bot: el.dataset.bot, round: (document.querySelector('header .round') || {}).textContent || '' };
      if (now.moves !== prev.moves) window.__steps.push({ t: performance.now(), byBot: prev.bot === '1', inRound: /Round/.test(prev.round) && /Round/.test(now.round), modal: !!document.querySelector('.roundend') });
      prev = now;
    }).observe(el, { attributes: true, attributeFilter: ['data-moves'] });
  };
  addEventListener('DOMContentLoaded', watch);
});

async function audit(step) {
  const r = await page.evaluate(() => {
    const out = { small: [], clipped: [], undo: null };
    const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const label = e => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    for (const e of document.querySelectorAll('button, [role="button"], input, select')) {
      if (!vis(e) || e.closest('[aria-hidden="true"]')) continue;
      // a wheel space is measured by its invisible hit circle, an inline hover/tap word (Info.jsx Tip) by its hit box
      const box = (e.matches('.slot') ? e.querySelector('.hit') : e.querySelector(':scope > .hitbox') || e).getBoundingClientRect();
      if (box.width < 43.5 || box.height < 43.5) out.small.push(`${label(e) || e.className.baseVal || e.className} ${Math.round(box.width)}×${Math.round(box.height)}`);
      // clipped by the nearest ancestor that hides overflow?
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (/(hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)) {
          const c = a.getBoundingClientRect(), b = e.getBoundingClientRect();
          if (b.left < c.left - 1 || b.right > c.right + 1 || b.top < c.top - 1 || b.bottom > c.bottom + 1) out.clipped.push(`${label(e)} in .${String(a.className).split(' ')[0]}`);
          break;
        }
      }
    }
    // header rows never overlap each other
    const hdr = [...document.querySelectorAll('.lt-prompt .round, .lt-prompt [data-prompt], .lt-prompt .undo, .lt-prompt .menu-glyph, .lt-prompt .pr-actions')].filter(vis);
    for (let i = 0; i < hdr.length; i++) for (let j = i + 1; j < hdr.length; j++) {
      const a = hdr[i].getBoundingClientRect(), b = hdr[j].getBoundingClientRect();
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 1 && h > 1) out.overlap = out.overlap || [], out.overlap.push(`${String(hdr[i].className).split(' ')[0] || hdr[i].tagName} × ${String(hdr[j].className).split(' ')[0] || hdr[j].tagName}`);
    }

    // choice panels get their own space: never under/over the compact shop, the buy row or the "More below" pill
    // (a bottom sheet may cover them, but it must be opaque)
    const ch = document.querySelector('.prompt.choice:not(.setup)');
    if (ch && vis(ch)) {
      const cs = getComputedStyle(ch);
      if (cs.position === 'fixed') {
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const alpha = m ? (m[1].split(',')[3] ?? '1') : '0';
        if (Number(alpha) < 0.98) (out.choice = out.choice || []).push(`choice sheet is see-through (${cs.backgroundColor})`);
      } else {
        const others = ['.lt-shop .lt-cards', '.lt-shop .lt-rates', '.lt-seat-0', '.lt-seat-1', '.lt-seat-2', '.lt-seat-3'].map(s => document.querySelector(s)).filter(e => e && vis(e) && !e.closest('[aria-hidden="true"]'));
        const a = ch.getBoundingClientRect();
        for (const o of others) {
          const b = o.getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 1 && h > 1) (out.choice = out.choice || []).push(`choice panel overlaps .${String(o.className).split(' ')[0]} by ${Math.round(h)}px`);
        }
      }
    }
    const hb = document.querySelector('.app.game header.bar');
    out.hdrH = hb ? Math.round(hb.getBoundingClientRect().height) : 0;
    out.side = { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sx: scrollX };
    if (out.side.sw > out.side.cw) {
      const cls = e => (e.tagName.toLowerCase() + '.' + String(e.className && (e.className.baseVal ?? e.className)).split(' ')[0]);
      const lim = document.documentElement.clientWidth + 1; const wide = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > lim);
      const pseudo = [...document.querySelectorAll('body *')].filter(e => ['::before', '::after'].some(ps => { const st = getComputedStyle(e, ps); return st.content !== 'none' && st.position !== 'static'; })).length;
      out.side.who = wide.slice(-4).map(cls).join(' < ') + ` [sw ${out.side.sw} cw ${out.side.cw} iw ${innerWidth} vv ${visualViewport && visualViewport.width}x${visualViewport && visualViewport.scale} body ${document.body.scrollWidth}]`;
    }
    out.peek = [...document.querySelectorAll('[data-hover-layer][data-open="1"], .popover.hover')].some(vis);
    const u = [...document.querySelectorAll('.undo')].find(vis);
    const g = document.querySelector('.app.game');
    if (u && g) out.undo = { actor: g.dataset.actor, bot: g.dataset.bot };
    return out;
  });
  for (const x of await page.evaluate(TEXT_CLIP)) note(`(d) text cut: ${x}`, step);
  for (const x of r.small) note(`(a) under 44px: ${x}`, step);
  for (const x of r.clipped) note(`(d) clipped: ${x}`, step);
  for (const x of r.overlap || []) note(`(f) header rows overlap: ${x}`, step);
  for (const x of r.choice || []) note(`(g) ${x}`, step);
  if (r.side.sw > r.side.cw) note(`(h) the page is wider than the screen (${r.side.who})`, step);
  if (r.side.sx !== 0) note(`(h) the page scrolled sideways (scrollX ${r.side.sx})`, step);
  if (r.hdrH > 96) note(`(f2) the phone header is ${r.hdrH}px tall (max 96)`, step);
  if (r.peek) note('(i) a hover card opened on a touch screen', step);
  if (r.undo && (r.undo.bot === '1' || r.undo.actor !== '0')) note(`(b) Undo visible while seat ${r.undo.actor} (${r.undo.bot === '1' ? 'bot' : 'person'}) is to act`, step);
}

// (h)(i)(j) on an iPhone 13 profile, the way the foreman's peek drives it: mouse-style clicks on a touch screen.
async function setupPhase() {
  const c2 = await browser.newContext({ ...devices['iPhone 13'] });
  const p2 = await c2.newPage();
  p2.on('pageerror', e => errors.push(`pageerror (setup phase): ${e.message}`));
  const look = async step => {
    const r = await p2.evaluate(() => {
      const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const chips = [...document.querySelectorAll('.prompt.choice.setup [data-option]')].filter(vis).map(e => e.getBoundingClientRect());
      return {
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sx: scrollX,
        peek: [...document.querySelectorAll('[data-hover-layer][data-open="1"]')].some(vis),
        chips: chips.length, off: chips.filter(b => b.left < -0.5 || b.right > innerWidth + 0.5 || b.top < -0.5 || b.bottom > innerHeight + 0.5).length,
      };
    });
    if (r.sw > r.cw) note(`(h) iPhone 13: the page is ${r.sw - r.cw}px wider than the screen`, step);
    if (r.sx !== 0) note(`(h) iPhone 13: the page scrolled sideways (scrollX ${r.sx})`, step);
    if (r.peek) note('(i) iPhone 13: a hover card opened after a tap', step);
    for (const x of await p2.evaluate(TEXT_CLIP)) note(`(d) iPhone 13 text cut: ${x}`, step);
    return r;
  };
  try {
    for (const how of ['click', 'tap']) {
      await p2.goto(`${base}/?botDelay=40&intro=0`); // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
      await p2.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await p2.goto(`${base}/?botDelay=40&intro=0`);
      const go = async sel => { const el = await p2.waitForSelector(sel); if (how === 'tap') { await el.scrollIntoViewIfNeeded(); await el.tap(); } else await el.click(); };
      await go('[data-home="local"]');
      await go('[data-start]');
      await p2.waitForSelector('.prompt.choice.setup [data-option]');
      await p2.waitForTimeout(500); // the tray's slide-up
      // the face-up members ride in the setup tray: the strip is on screen, every card is reachable in it (a swipe at
      // most) and each opens in full on a tap
      {
        const r = await p2.evaluate(() => {
          const strip = document.querySelector('.for-sale .fs-strip');
          const b = strip && strip.getBoundingClientRect();
          return { n: document.querySelectorAll('.for-sale .fs-card').length, on: !!b && b.top >= -0.5 && b.bottom <= innerHeight + 0.5 && b.left >= -0.5 && b.right <= innerWidth + 0.5 };
        });
        if (r.n !== SHOP_SIZE) note(`(k) iPhone 13 (${how}): ${r.n} members for sale in the setup tray (want ${SHOP_SIZE})`, 'setup');
        if (!r.on) note(`(k) iPhone 13 (${how}): the setup tray's shop strip is not fully on screen`, 'setup');
        if (how === 'tap') {
          for (let c = 0; c < r.n; c++) {
            const el = (await p2.$$('.for-sale .fs-card'))[c];
            // swipe the strip to the card (the strip scrolls sideways; the sheet itself doesn't move)
            await el.evaluate(e => { const strip = e.closest('.fs-strip'); const sb = strip.getBoundingClientRect(), b = e.getBoundingClientRect(); strip.scrollBy({ left: b.left < sb.left ? b.left - sb.left : b.right > sb.right ? b.right - sb.right : 0, behavior: 'instant' }); });
            await p2.waitForTimeout(200);
            const box = await el.boundingBox();
            if (!box || box.x < -0.5 || box.x + box.width > 390.5) { note(`(k) iPhone 13: member ${c + 1} for sale can't be scrolled into view`, 'setup'); continue; }
            const name = await el.$eval('b', e => e.textContent);
            await el.tap();
            await p2.waitForTimeout(350);
            const pop = await p2.$eval('.popover', e => e.textContent).catch(() => '');
            if (!pop.includes(name) || pop.length < name.length + 6) note(`(k) iPhone 13: tapping "${name}" for sale did not open its card ("${pop.slice(0, 40)}")`, 'setup');
            if (c === 0) await p2.screenshot({ path: `${SHOTS}/setup-sale-card.png` });
            const close = await p2.$('.popover .sheet-close');
            if (close) await close.tap(); else await p2.keyboard.press('Escape');
            await p2.waitForTimeout(250);
          }
          await p2.evaluate(() => { const s = document.querySelector('.for-sale .fs-strip'); if (s) s.scrollLeft = 0; });
        }
      }
      for (let k = 0; k < 2; k++) {
        const r = await look(`setup ${how} pick ${k + 1}`);
        if (!r.chips) note(`(j) iPhone 13 (${how}): no starting-resource chips showing`, `pick ${k + 1}`);
        if (r.off) note(`(j) iPhone 13 (${how}): ${r.off} of ${r.chips} starting-resource chips are off screen`, `pick ${k + 1}`);
        await p2.screenshot({ path: `${SHOTS}/setup-${how}-${k + 1}.png` });
        const chip = await p2.$('.prompt.choice.setup [data-option]:not([disabled])');
        if (!chip) break;
        if (how === 'tap') await chip.tap(); else await chip.click();
        await p2.waitForTimeout(450);
        await look(`setup ${how} after pick ${k + 1}`);
      }
    }
  } catch (e) { errors.push(`setup phase: ${e.message}`); await p2.screenshot({ path: `${SHOTS}/zz-setup-phase.png` }).catch(() => {}); }
  await c2.close();
}

let ok = false;
let sawFlight = null;
try {
  await setupPhase();
  await page.goto(`${base}/?intro=0`);
  await page.waitForSelector('[data-home="local"]');
  await audit('home');
  await page.tap('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await audit('setup');
  const start = await page.$('[data-start]'); await start.scrollIntoViewIfNeeded(); await start.tap();
  await page.waitForSelector('.lt-seat[data-pid]');

  const t0 = Date.now();
  let steps = 0, lastMoves = null;
  while (!(await page.$('.results'))) {
    if (Date.now() - t0 > 540000) throw new Error("game did not finish in 9 minutes");
    const moves = await page.$eval('.app.game', e => e.dataset.moves).catch(() => null);
    if (moves !== lastMoves) { lastMoves = moves; steps++; await audit(`step ${steps}`); }
    const next = await page.$('[data-next-round]');
    if (next) { await audit(`round card ${steps}`); await next.tap(); continue; }
    const place = await page.$('[data-place]');
    if (place) { await place.tap().catch(() => {}); await page.waitForTimeout(450); continue; }
    // your own recruit: buy the first affordable card once and watch it fly
    const card = sawFlight === null ? await page.$('.lt-shop .card.can[data-option]') : null;
    if (card && await page.$('.lt-prompt .pass[data-option]')) {
      await card.scrollIntoViewIfNeeded().catch(() => {});
      await card.tap().catch(() => {});
      // (m) reading a card never recruits it: the tap opens the card, its Recruit button recruits
      const recruit = await page.waitForSelector('[data-recruit]', { timeout: 3000 }).catch(() => null);
      if (!recruit) note('(m) tapping an affordable shop card showed no Recruit button', 'buy');
      if (await page.$('.dialog.pay')) note('(m) tapping a shop card went straight to paying (reading a card must not recruit it)', 'buy');
      if (recruit) await recruit.tap().catch(() => {});
      await page.waitForSelector('.dialog.pay', { timeout: 3000 }).catch(() => {});
      await audit(`pay ${steps}`);
      // (l) paying is tactile: the suggested coins sit in the cost ("Paid in full"); tapping one takes it back,
      // tapping that color in your resources puts it back in; no steppers
      if (await page.$('.dialog.pay')) {
        const st = () => page.$eval('[data-pay-status]', e => e.textContent).catch(() => '');
        if (await page.$('.dialog.pay .stepper')) note('(l) the pay sheet still has steppers', 'pay');
        if (!/Paid in full/.test(await st())) note(`(l) the suggested payment isn't shown as paid ("${await st()}")`, 'pay');
        const coin = await page.$('.dialog.pay [data-pay-coin]');
        if (!coin) note('(l) no coins in the cost', 'pay');
        else {
          const color = await coin.getAttribute('data-pay-coin');
          await coin.tap(); await page.waitForTimeout(150);
          if (!/more to pay/.test(await st())) note(`(l) taking a coin back didn't open its slot ("${await st()}")`, 'pay');
          if (!(await page.$('.dialog.pay .btn.pri[disabled]'))) note('(l) Confirm stayed live with a coin missing', 'pay');
          await (await page.$(`.dialog.pay [data-pay-add="${color}"]`)).tap(); await page.waitForTimeout(150);
          if (!/Paid in full/.test(await st())) note(`(l) tapping ${color} back in didn't pay the cost ("${await st()}")`, 'pay');
          await page.screenshot({ path: `${SHOTS}/pay-sheet.png` });
        }
      }
      const confirm = await page.$('.dialog.pay .btn.pri[data-option]');
      if (confirm) {
        await page.waitForTimeout(450);
        await confirm.tap();
        sawFlight = false;
        for (let f = 0; f < 12 && !sawFlight; f++) {
          sawFlight = await page.evaluate(() => {
            const g = document.querySelector('.flight'); const me = document.querySelector('.lt-seat[data-pid="0"]');
            if (!g || !me) return false;
            return true;
          });
          if (sawFlight) await page.screenshot({ path: `${SHOTS}/recruit-flight.png` });
          await page.waitForTimeout(30);
        }
      }
      continue;
    }
    const els = await page.$$('[data-option]:not([disabled])');
    let tapped = false;
    for (const el of els) {
      const id = await el.getAttribute('data-option').catch(() => null);
      // shop cards open a sheet on touch (recruiting is the path above), so the plain tapper leaves them be
      if (!id || id.startsWith('toggle:') || id === 'back' || id.startsWith('card:')) continue;
      try { await el.scrollIntoViewIfNeeded(); await el.tap({ timeout: 1500 }); tapped = true; break; } catch { /* moved; next */ }
    }
    await page.waitForTimeout(tapped ? 450 : 60);
  }
  await audit('results');
  await page.screenshot({ path: `${SHOTS}/results.png` });

  // (c) bot pacing: consecutive bot steps during rounds at least 600ms apart (round cards excluded)
  const st = await page.evaluate(() => window.__steps || []);
  let short = 0, worst = Infinity, pairs = 0;
  for (let i = 1; i < st.length; i++) {
    if (!st[i].byBot || !st[i - 1].byBot || !st[i].inRound || !st[i - 1].inRound || st[i].modal || st[i - 1].modal) continue;
    pairs++;
    const gap = st[i].t - st[i - 1].t;
    worst = Math.min(worst, gap);
    if (gap < 570) short++;
  }
  console.log(`bot steps measured: ${pairs} pairs, shortest gap ${Math.round(worst)}ms`);
  if (pairs < 10) note('(c) too few bot steps measured', 'end');
  if (short) note(`(c) ${short} bot steps under 600ms apart (shortest ${Math.round(worst)}ms)`, 'end');
  if (sawFlight === false) note('(e) your recruit did not fly into your panel', 'buy');
  if (sawFlight === null) note('(e) never got to recruit a member', 'buy');
  ok = errors.length === 0 && fail.size === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  await page.screenshot({ path: `${SHOTS}/zz-failure.png` }).catch(() => {});
} finally {
  await browser.close();
  if (server) server.kill();
}
for (const [m, s] of fail) console.error(`${m}   [first at ${s}]`);
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS touch' : 'FAIL touch');
process.exit(ok ? 0 : 1);
