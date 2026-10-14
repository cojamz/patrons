// E2E: every game-meaningful element explains itself (Cory, 2026-10-14: every UI element has a hover with more info,
// long-press/tap on phone), and followers are never a star. Build-failing assertions, at several steps of a real
// hot-seat game (1 person + 3 bots):
//  (a) every visible game element (seats, shop cards, resources, members, leaders/minions, follower marks, badges,
//      follower buys, spaces, contest rules, resource symbols) carries hover info: a title, a hover/tap card
//      (data-tip / aria-haspopup), or (spaces) the board's own space card;
//  (b) hovering a shop card and a board space shows a card; on a touch screen a long-press on a titled element
//      shows its title (the hover's touch twin);
//  (c) no "★" anywhere in the rendered game (followers are the little-person mark);
//  (d) hover cards open within 100ms (p95) and never flicker while sweeping a ring of spaces;
//  (e) a cult member hops when its own trace line appears in the log.
// Screenshots go to $V4_SHOTS (default /tmp/patrons-shots/v4/info/).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/info`;
mkdirSync(SHOTS, { recursive: true });
const base = process.env.V4_URL || 'http://localhost:5180';
const fails = [];
const fail = (msg, step) => fails.push(`[${step}] ${msg}`);

// game-meaningful elements, old and new screen (whatever is on screen is audited)
const GAME = [
  '[data-region] [data-uid]', '.shop [data-uid]', '.lt-rs', '[data-cult] .cs-head', '.lt-stack', '.res > .r', '.you-strip .r', '.lt-member .fig', '.chip[data-g]',
  '[data-leader-ring]', '.workers', '.fol-mark', '.follower', '.badge-mark', '.lt-rate', '.fb', '.slot',
  '[data-plaque] .plaque-face', '.contest-tip', '[data-cult] [data-member] .fig', '.res-glyph', '.pip', '.card-name', '.term',
].join(',');

async function audit(page, step) {
  const r = await page.evaluate(sel => {
    const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const explains = e => {
      if ((e.getAttribute('title') || '').trim()) return true;
      if (e.matches('[data-tip], [aria-haspopup]')) return true;
      if (e.querySelector(':scope > title')) return true; // an SVG symbol with its own <title>
      if (e.matches('.slot')) return true; // the board's space card (checked by hovering below)
      // a symbol inside something that explains itself (a pip in a titled cost) is covered by its parent
      const up = e.parentElement && e.parentElement.closest('[title], [data-tip], [aria-haspopup]');
      return !!(up && up.contains(e) && e.matches('.pip, .res-glyph, .follower, .fol-mark, .badge-mark'));
    };
    const miss = [];
    let n = 0;
    for (const e of document.querySelectorAll(sel)) {
      if (!vis(e) || e.closest('[aria-hidden="true"]')) continue;
      n++;
      if (!explains(e)) miss.push(`${e.tagName.toLowerCase()}.${String(e.className && (e.className.baseVal ?? e.className)).split(' ').filter(Boolean).join('.')} "${(e.textContent || '').trim().slice(0, 24)}"`);
    }
    return { n, miss: [...new Set(miss)].slice(0, 12), star: document.body.innerText.includes('★') };
  }, GAME);
  if (r.n < 5) fail(`only ${r.n} game elements found (the selectors no longer match the screen?)`, step);
  for (const m of r.miss) fail(`(a) no hover info: ${m}`, step);
  if (r.star) fail('(c) a "★" is on screen', step);
  return r.n;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(`${base}/?botDelay=20&intro=0`); // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
  await page.waitForSelector('[data-home="local"]');
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await page.click('[data-start]');
  await page.waitForSelector('[data-option]', { timeout: 20000 });
  await audit(page, 'setup');
  await page.screenshot({ path: `${SHOTS}/01-setup.png` });

  // play: the first legal option each time; audit at my first placement, my first buy and a round-II placement
  const seen = new Set();
  for (let k = 0; k < 400 && seen.size < 3; k++) {
    const next = page.locator('[data-next-round]');
    if (await next.count()) { await next.first().click().catch(() => {}); await page.waitForTimeout(150); continue; }
    const hand = page.locator('[data-handoff]');
    if (await hand.count()) { await hand.first().click().catch(() => {}); continue; }
    const kind = await page.evaluate(() => {
      const g = document.querySelector('.app.game');
      const round = [...document.querySelectorAll('header .round, [data-region="prompt"], .lt-prompt, .rnd, [data-round]')].map(e => e.textContent).join(' ');
      const place = !!document.querySelector('.slot.can, .slot[data-option]');
      const buy = !!document.querySelector('[data-option^="card:"], [data-option^="tier:"], [data-option="pass"]');
      return { place, buy, r2: /Round II\b/.test(round), moves: g && g.dataset.moves };
    });
    const step = kind.place ? (kind.r2 ? 'place-r2' : 'place') : kind.buy ? 'buy' : null;
    if (step && !seen.has(step) && (step !== 'place-r2' || seen.has('place'))) {
      seen.add(step);
      await audit(page, step);
      await page.screenshot({ path: `${SHOTS}/0${seen.size + 1}-${step}.png` });
      if (step === 'place') {
        // (b) hover a board space and a shop card: each shows a card
        const slot = page.locator('.slot.can').first();
        await slot.hover();
        await page.waitForTimeout(500);
        if (!(await page.locator('.peek, [data-hover-card="space"], [data-space-card]').count())) fail('(b) hovering a space shows no card', step);
        await page.screenshot({ path: `${SHOTS}/02b-hover-space.png` });
        await page.mouse.move(5, 5);
        const card = page.locator('[data-region] [data-uid], .shop [data-uid]').first();
        if (await card.count()) {
          await card.hover();
          await page.waitForTimeout(600);
          const shown = await page.evaluate(() => [...document.querySelectorAll('.popover, [data-hover-card]')].some(e => e.getBoundingClientRect().width > 0) || !!document.querySelector('.card-face'));
          if (!shown) fail('(b) hovering a shop card shows no card', step);
          await page.screenshot({ path: `${SHOTS}/02c-hover-card.png` });
          await page.mouse.move(5, 5);
          await page.waitForTimeout(300);
        }
      }
    }
    const opt = page.locator('.slot.can, [data-option]:not([aria-disabled="true"])').first();
    if (await opt.count()) { await opt.click({ timeout: 2000 }).catch(() => {}); }
    await page.waitForTimeout(80);
  }
  if (seen.size < 3) fail(`only reached ${[...seen].join(', ') || 'no'} steps`, 'play');

  // (d) hover speed (Cory: instant and seamless): p95 from the pointer arriving to a visible card < 100ms, and no
  // close/reopen flicker while sweeping across a ring of spaces. Measured on the Lamplit hover layer with the real
  // wheel and shop (the ?lab=b page of this build) until the game screen mounts it.
  {
    const lab = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    lab.on('pageerror', e => errors.push(`lab pageerror: ${e.message}`));
    await lab.goto(`${base}/?lab=b&phase=place`);
    await lab.waitForSelector('[data-hover-layer]');
    await lab.waitForTimeout(800); // idle warm-up of the dry runs
    await lab.evaluate(() => {
      const visible = () => [...document.querySelectorAll('[data-hover-layer][data-open="1"], .peek')].some(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.left > -1000 && getComputedStyle(e).opacity !== '0'; });
      window.__hov = { lat: [], flips: 0, was: false, sweeping: false };
      let t0 = null;
      addEventListener('pointerover', e => { if (e.target.closest && e.target.closest('[data-slot], [data-uid]') && !visible()) t0 = performance.now(); }, true);
      const tick = () => {
        const v = visible();
        if (v && t0 != null) { window.__hov.lat.push(performance.now() - t0); t0 = null; }
        if (window.__hov.sweeping && window.__hov.was && !v) window.__hov.flips++;
        window.__hov.was = v;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const centers = async sel => lab.$$eval(sel, els => els.map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }));
    const spaces = await centers('[data-slot] .base');
    const cards = await centers('[data-region="shop"] [data-uid]');
    // separate arrivals: move away, then onto a target, wait for its card. A shared, loaded box can stall one run;
    // a real slowdown fails both, so the better of two runs counts (both are reported).
    const measure = async () => {
      await lab.evaluate(() => { window.__hov.lat = []; });
      for (const [x, y] of [...spaces.slice(0, 14), ...cards.slice(0, 10), ...spaces.slice(14, 20)]) {
        await lab.mouse.move(4, 690);
        await lab.waitForTimeout(220);
        await lab.mouse.move(x, y, { steps: 2 });
        await lab.waitForTimeout(160);
      }
      const lat = (await lab.evaluate(() => window.__hov.lat)).sort((a, b) => a - b);
      return { lat, p95: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : Infinity };
    };
    let run = await measure();
    const first = run.p95;
    if (!(run.p95 < 100)) { const again = await measure(); if (again.p95 < run.p95) run = again; }
    const { lat, p95 } = run;
    if (lat.length < 20) fail(`(d) only ${lat.length} hover cards opened out of ${Math.min(20, spaces.length) + Math.min(10, cards.length)} arrivals`, 'hover');
    if (!(p95 < 100)) fail(`(d) hover card p95 ${Math.round(p95)}ms, first run ${Math.round(first)}ms (want < 100ms; samples ${lat.map(Math.round).join(',')})`, 'hover');
    // sweep: across the outer ring's spaces in order, never leaving the ring; the card must never close in between
    // the outer ring: the spaces farthest from the wheel's centre, in angle order
    const all = await lab.$$eval('[data-slot] .base', els => els.map(e => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }));
    const cx = all.reduce((t, o) => t + o.x, 0) / all.length, cy = all.reduce((t, o) => t + o.y, 0) / all.length;
    const far = Math.max(...all.map(o => Math.hypot(o.x - cx, o.y - cy)));
    const ring = all.filter(o => Math.hypot(o.x - cx, o.y - cy) > far * 0.85).sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    if (ring.length < 6) fail(`(d) found only ${ring.length} outer spaces to sweep`, 'hover');
    await lab.mouse.move(ring[0].x, ring[0].y);
    await lab.waitForTimeout(200);
    await lab.evaluate(() => { window.__hov.sweeping = true; window.__hov.flips = 0; });
    for (const o of ring.slice(1, 9)) { await lab.mouse.move(o.x, o.y, { steps: 6 }); await lab.waitForTimeout(90); }
    const flips = await lab.evaluate(() => { window.__hov.sweeping = false; return window.__hov.flips; });
    if (flips) fail(`(d) the hover card closed and reopened ${flips} time(s) while sweeping across ${Math.min(8, ring.length - 1)} spaces`, 'hover');
    await lab.screenshot({ path: `${SHOTS}/04-hover-sweep.png` });
    console.log(`info.mjs: hover p95 ${Math.round(p95)}ms over ${lat.length} cards${first !== p95 ? ` (first run ${Math.round(first)}ms)` : ''}; ${flips} flickers in the sweep`);
    await lab.close();
  }

  // (e) living cults: a member reacts (hops) when its own trace line appears ("Wren's Banker: +1 gold.")
  {
    const lab = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    lab.on('pageerror', e => errors.push(`lab pageerror: ${e.message}`));
    await lab.goto(`${base}/?lab=b&phase=place&react=1`);
    const who = await lab.waitForFunction(() => document.documentElement.dataset.reactMember, null, { timeout: 5000 }).then(h => h.jsonValue()).catch(() => null);
    if (!who) fail('(e) the lab never wrote a trace line', 'cults');
    else {
      const [pid, def] = who.split(':');
      const hop = await lab.waitForSelector(`[data-cult="${pid}"] [data-member="${def}"][data-react]`, { timeout: 1500 }).catch(() => null);
      if (!hop) fail(`(e) ${def} did not react to its trace line`, 'cults');
      else {
        const anim = await hop.evaluate(e => getComputedStyle(e.querySelector('.fig')).animationName);
        if (!/cult-hop/.test(anim)) fail(`(e) ${def} is marked but doesn't move (animation ${anim})`, 'cults');
        await lab.screenshot({ path: `${SHOTS}/06-member-reacts.png` });
      }
    }
    await lab.close();
  }

  // (b) touch: a long-press on a titled element shows its title
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const phone = await ctx.newPage();
  phone.on('pageerror', e => errors.push(`phone pageerror: ${e.message}`));
  await phone.goto(`${base}/?botDelay=20&intro=0`);
  await phone.waitForSelector('[data-home="local"]');
  await phone.tap('[data-home="local"]');
  await phone.waitForSelector('[data-start]');
  await phone.tap('[data-start]');
  await phone.waitForSelector('[data-option]', { timeout: 20000 });
  await audit(phone, 'phone-setup');
  const target = await phone.evaluate(() => {
    // a titled element that is really on top at its centre (not under an overlay such as the intro)
    const e = [...document.querySelectorAll('.app.game [title]')].find(x => {
      const b = x.getBoundingClientRect();
      if (!(b.width > 8 && b.height > 8 && b.top > 0 && b.bottom < innerHeight) || x.closest('button, [role="button"], [data-option]')) return false;
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return !!top && x.contains(top);
    });
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, title: e.getAttribute('title') };
  });
  if (!target) fail('(b) no titled element to long-press on the phone', 'phone');
  else {
    const cdp = await ctx.newCDPSession(phone);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await touch('touchStart', [{ x: target.x, y: target.y }]);
    await phone.waitForTimeout(700);
    const bubble = await phone.locator('[data-touch-tip]').textContent().catch(() => null);
    await touch('touchEnd', []);
    if (!bubble || !bubble.includes(target.title.slice(0, 10))) fail(`(b) long-press showed ${JSON.stringify(bubble)}, not the title ${JSON.stringify(target.title)}`, 'phone');
    await phone.screenshot({ path: `${SHOTS}/05-phone-longpress.png` });
  }
  await ctx.close();
} catch (e) {
  fails.push(`crashed: ${e && e.stack || e}`);
} finally {
  await browser.close();
}
for (const e of errors) fails.push(e);
if (fails.length) { console.error(`info.mjs: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log('info.mjs: every game element explains itself; no stars');
