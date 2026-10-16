import { browserPath } from './lib/browser.mjs';
// E2E layout gate (panel 7, laptop V): text you need is never cut off.
//  (l1) while you place, every compact shop card shows its whole name and whole list cost (no ellipsis, no clip);
//  (l2) every follower buy shows its whole label and price, while placing and while buying;
//  (l3) nothing makes the page scroll sideways;
//  (l4) a member whose color isn't on the table never prints that color as its cost;
//  (l5) no color rule for follower buys anywhere (they take anything);
//  (l6) the starting pick stands in your own chair, lit, whole and on screen, with no other pick panel (Cory,
//       2026-10-15: it replaces the panel at the column's foot, which he hunted for); round I's turn order is set
//       before the picks, so the chairs don't reshuffle after them (Cory: "it had us pick resources THEN it randomized
//       the order???").
//  (l7) live panel r1 (G4): every chair says how many members it has, whole and in view ("+N more" hid them, so "Most
//       members" couldn't be counted): its count equals the engine's, the figures and "+N" add up to it, the figures
//       stand in at most two rows inside the chair, overlapping nothing; a chair with no "each round" line shows at
//       least ten figures; the minions still to place stand in one column; an empty stack's ring stays visible;
//  (l8) keyboard: a rival's member figures are off the Tab path (their seat's head opens the card that lists them),
//       and the follower buys and "Done, no buy" wear a visible cream focus ring, never the lamp's gold of a lit tile.
// Checked at 1270×700, 900×700 (the "900px clipping") and 1100×700, from a saved game (e2e/v4/lib/rich-save.mjs).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5186.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';
import { answerChoice } from './lib/answer.mjs';
import { seedSave } from './lib/seed.mjs';
import { membersSave } from './lib/members-save.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/layout';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5186;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });

// elements whose text must be whole: cut means it overflows its own box or its nearest clipping ancestor
const CUT = sels => {
  const out = [];
  // an invisible hit-area helper (.hitbox: a 44px touch target around a small control) isn't text: measure without it
  const quiet = document.createElement('style');
  quiet.textContent = '.hitbox{display:none!important}';
  document.head.appendChild(quiet);
  const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  for (const sel of sels) for (const e of document.querySelectorAll(sel)) {
    if (!vis(e) || e.closest('[aria-hidden="true"]')) continue;
    const txt = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) { out.push(`${sel} "${txt}" overflows its box`); continue; }
    const b = e.getBoundingClientRect();
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (/(hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)) {
        const c = a.getBoundingClientRect();
        // a scroll box may hide things below the fold; sideways it may not
        const scrolls = /(auto|scroll)/.test(s.overflowY);
        if (b.left < c.left - 1 || b.right > c.right + 1 || (!scrolls && (b.top < c.top - 1 || b.bottom > c.bottom + 1))) out.push(`${sel} "${txt}" clipped by .${String(a.className).split(' ')[0]}`);
        break;
      }
    }
  }
  quiet.remove();
  return out;
};

for (const size of [{ width: 1270, height: 700 }, { width: 900, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height}`;
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  const check = async (step, sels) => {
    const cut = await page.evaluate(CUT, sels);
    for (const c of cut) errors.push(`[${tag} ${step}] ${c}`);
    const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (side > 0) errors.push(`[${tag} ${step}] (l3) the page scrolls sideways by ${side}px`);
    if (cut.length) await page.screenshot({ path: `${SHOTS}/${tag}-${step}-cut.png` });
    // (l5) follower buys take anything (Cory, 2026-10-14): no color rule anywhere on the table
    const rule = await page.evaluate(() => (document.body.innerText.match(/\d\+ colors|counts as any colou?r|at least \d colou?rs/i) || [])[0]);
    if (rule) errors.push(`[${tag} ${step}] (l5) the table still shows a color rule: "${rule}"`);
  };
  try {
    await seedSave(page, richSave()); // before the app runs (lib/seed.mjs)
    await page.goto(`${base}/`);
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt-shop .card');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/${tag}-place.png` });
    await check('place', ['.lt-shop .card .nm', '.lt-shop .card .ft', '.lt-shop .card .lt-cost', '.lt-shop .lt-rate b', '.lt-shop .lt-rate']);
    // (l4) the classic table has no magenta: a magenta-leaning guest's cost reads in "any"
    const res = await page.evaluate(() => [...document.querySelectorAll('.lt-seat[data-pid="0"] [data-res]')].map(e => e.getAttribute('title') || e.textContent));
    // a cost is drawn as shapes: its words are in its label
    const costs = await page.$$eval('.lt-shop .card .lt-cost', els => els.map(e => e.getAttribute('aria-label') || e.textContent));
    for (const c of costs) for (const color of ['magenta', 'purple', 'silver', 'white', 'yellow']) if (c.includes(color)) errors.push(`[${tag}] (l4) a cost names ${color}, which isn't on this table: "${c}" (${res.join(',')})`);
    // place, answer any question, then the buy step
    const slot = await page.$('.slot.can .base');
    const bb = await slot.boundingBox();
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(300);
    for (let k = 0; k < 16 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
      // a choice is answered where it's asked: a button, or on the board (a rival's seat or stack: lib/answer.mjs);
      // only while one is open, so a placement still landing never gets a second click on the table
      // (never Pass, a buy or another space: the step can turn to the buy step between the check and the click)
      if (await page.$('.lt[data-phase="choose"][data-yours="1"], .lt[data-phase="pay"][data-yours="1"]')) await answerChoice(page, { avoid: ['pass', 'card:', 'tier:', 'slot:', 'release:'] });
      await page.waitForTimeout(250);
    }
    await page.waitForSelector('.lt[data-phase="buy"][data-yours="1"]', { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/${tag}-buy.png` });
    await check('buy', ['.lt-shop .lt-rate b', '.lt-shop .lt-rate', '.lt-shop .card .nm']);
    // (l8) the follower buys and "Done, no buy" show keyboard focus: a cream ring, not the lamp's gold a lit tile wears
    // (a key pressed first, so the browser treats the focus as the keyboard's)
    const rings = [];
    const nFocus = await page.$$eval('.lt-rates .lt-rate[data-option], .lt-rates .lt-done:not(.idle)', els => els.length);
    for (let i = 0; i < nFocus; i++) {
      await page.keyboard.press('Shift');
      rings.push(await page.evaluate(i => {
        const e = document.querySelectorAll('.lt-rates .lt-rate[data-option], .lt-rates .lt-done:not(.idle)')[i];
        e.focus();
        const st = getComputedStyle(e), ok = e.matches(':focus-visible');
        const c = (st.outlineColor.match(/[\d.]+/g) || []).map(Number);
        return { what: e.dataset.option || e.textContent.trim(), ok, style: st.outlineStyle, w: parseFloat(st.outlineWidth), light: c.length >= 3 && Math.min(c[0], c[1], c[2]) > 225 && (c[3] ?? 1) > 0.8 };
      }, i));
    }
    if (!rings.length) errors.push(`[${tag} buy] (l8) no follower buy to focus`);
    for (const r of rings) if (!r.ok || r.style === 'none' || r.w < 2 || !r.light) errors.push(`[${tag} buy] (l8) "${r.what}" shows no cream focus ring (${r.style} ${r.w}px, focus-visible ${r.ok})`);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
  } catch (e) {
    errors.push(`[${tag}] run: ${e.message}`);
    await page.screenshot({ path: `${SHOTS}/${tag}-fail.png` }).catch(() => {});
  }
  await ctx.close();
}

// (l6) the starting pick stands in your own chair, lit (Cory, 2026-10-15: "I looked around for 10s before I realized
// that's what I needed to do. It could just show it IN the player card"): all of it inside your chair and on screen,
// no other pick panel on screen, and round I's turn order already set when you pick (the chairs don't reshuffle after)
for (const size of [{ width: 1270, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height}`;
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag} setup] pageerror: ${e.message}`));
  try {
    await page.goto(`${base}/?botDelay=20&intro=0`);
    await page.click('[data-home="local"]');
    await page.click('[data-start]');
    await page.waitForSelector('.lt > .lt-seat.mine .cs-setup [data-option]', { timeout: 20000 });
    await page.waitForTimeout(700);
    const order0 = await page.$$eval('.lt > .lt-seat[data-pid]', els => els.map(e => [Number(e.dataset.pid), Math.round(e.getBoundingClientRect().top)]).sort((x, y) => x[1] - y[1]).map(x => x[0]).join());
    const r = await page.evaluate(() => {
      const seat = document.querySelector('.lt > .lt-seat.mine').getBoundingClientRect();
      const toks = [...document.querySelectorAll('.lt > .lt-seat.mine .cs-setup [data-option]')].map(e => ({ b: e.getBoundingClientRect(), lit: /rgba?\(/.test(getComputedStyle(e).boxShadow), whole: [...e.querySelectorAll('.tk-name')].every(n => n.scrollWidth <= n.clientWidth + 1) && e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1 && [...e.children].every(c => { const cb = c.getBoundingClientRect(), eb = e.getBoundingClientRect(); return cb.top >= eb.top - 0.5 && cb.bottom <= eb.bottom + 0.5; }) }));
      const vis = e => { const st = getComputedStyle(e); const b = e.getBoundingClientRect(); return st.display !== 'none' && st.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
      return {
        n: toks.length, inSeat: toks.every(t => t.b.left >= seat.left && t.b.right <= seat.right && t.b.top >= seat.top && t.b.bottom <= seat.bottom),
        onScreen: toks.every(t => t.b.left >= 0 && t.b.top >= 0 && t.b.right <= innerWidth && t.b.bottom <= innerHeight),
        lit: toks.every(t => t.lit), whole: toks.every(t => t.whole), big: toks.every(t => t.b.height >= 24),
        panel: [...document.querySelectorAll('.prompt.choice.setup')].filter(vis).length,
      };
    });
    if (r.n !== 4) errors.push(`[${tag} setup] (l6) your chair offers ${r.n} starting picks, not 4`);
    if (!r.inSeat) errors.push(`[${tag} setup] (l6) the starting pick runs out of your chair`);
    if (!r.onScreen) errors.push(`[${tag} setup] (l6) the starting pick runs off the window`);
    if (!r.lit) errors.push(`[${tag} setup] (l6) the starting pick isn't lit`);
    if (!r.whole) errors.push(`[${tag} setup] (l6) a starting pick's word is cut`);
    if (!r.big) errors.push(`[${tag} setup] (l6) the starting picks are under 24px tall`);
    if (r.panel) errors.push(`[${tag} setup] (l6) a second pick panel still shows outside your chair`);
    await page.screenshot({ path: `${SHOTS}/${tag}-setup.png` });
    // pick both, then round I: the chairs keep the order they showed during the picks
    for (let k = 0; k < 2; k++) {
      await page.waitForSelector('.lt > .lt-seat.mine .cs-setup [data-option]', { timeout: 20000 });
      await page.click('.lt > .lt-seat.mine .cs-setup [data-option]');
      await page.waitForTimeout(800);
    }
    await page.waitForSelector('.lt[data-round="1"]', { timeout: 20000 });
    await page.waitForTimeout(1200);
    const order1 = await page.$$eval('.lt > .lt-seat[data-pid]', els => els.map(e => [Number(e.dataset.pid), Math.round(e.getBoundingClientRect().top)]).sort((x, y) => x[1] - y[1]).map(x => x[0]).join());
    if (order0 !== order1) errors.push(`[${tag} setup] (l6) the chairs reshuffled after the starting picks (${order0} then ${order1}): round I's order is set before the picks`);
  } catch (e) {
    errors.push(`[${tag} setup] run: ${e.message}`);
    await page.screenshot({ path: `${SHOTS}/${tag}-setup-fail.png` }).catch(() => {});
  }
  await ctx.close();
}

// (l7, l8) the chairs' members, countable at a glance, and the keyboard's path past them (members-save: you hold 10
// members, P4 13; P3 lies low and holds none)
for (const size of [{ width: 1270, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height} seats`;
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  try {
    const { save } = membersSave();
    await seedSave(page, save);
    await page.goto(`${base}/?botDelay=300&intro=0`);
    await page.waitForSelector('.lt-wheel, [data-home="resume"]');
    if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt > .lt-seat .cs-crowd');
    await page.mouse.move(640, 695);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/${tag.replace(' ', '-')}.png` });
    const seats = await page.evaluate(() => [...document.querySelectorAll('.lt > .lt-seat > .lt-cult-seat')].map(seat => {
      const r = e => e.getBoundingClientRect();
      const box = r(seat.parentElement);
      const count = seat.querySelector('.cs-count');
      // (each figure's own box: its sprite breathes and hops a pixel or two inside it)
      const figs = [...seat.querySelectorAll('.cs-figs > .cs-member')].map(r);
      const more = seat.querySelector('.cs-more');
      const build = seat.querySelector(':scope > .cs-build');
      const over = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      const parts = [...figs, ...(more ? [r(more)] : []), ...(count ? [r(count)] : []), ...(build ? [r(build)] : [])];
      let clash = 0;
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (over(parts[i], parts[j])) clash++;
      // (rows by layout, not paint: a lit member lifts 2px and the crowd breathes)
      const rows = new Set([...seat.querySelectorAll('.cs-figs > .cs-member, .cs-figs > .cs-more')].map(m => m.offsetTop)).size;
      const inside = parts.every(b => b.left >= box.left - 0.5 && b.right <= box.right + 0.5 && b.top >= box.top - 0.5 && b.bottom <= box.bottom + 0.5);
      const mins = [...seat.querySelectorAll('.cs-minions .cs-min')].map(e => Math.round(r(e).left + r(e).width / 2));
      const zero = [...seat.querySelectorAll('.cs-stack.zero')].map(e => parseFloat(getComputedStyle(e).opacity));
      const accessible = seat.getAttribute('aria-label') || '';
      return {
        pid: Number(seat.dataset.seat), countRemoved: !count, accessible,
        figs: figs.length, groups: seat.querySelectorAll('.cs-member').length, more: more ? Number(more.dataset.more) : 0,
        n: [...seat.querySelectorAll('.cs-member')].reduce((s, m) => s + m.dataset.uids.split(' ').length, 0) + (more ? Number(more.dataset.more) : 0),
        clash, rows, inside, built: !!build, cols: new Set(mins).size, zero: zero.length ? Math.min(...zero) : 1,
        rivalTabs: seat.closest('.mine') ? 0 : [...seat.querySelectorAll('.cs-member .fig')].filter(f => f.tabIndex >= 0).length,
      };
    }));
    for (const x of seats) {
      const want = save.state.players[x.pid].members.length;
      if (!x.countRemoved) errors.push(`[${tag}] (l7) P${x.pid + 1}'s retired member-count label still occupies the crowd`);
      if (!x.accessible.includes(`${want} member`)) errors.push(`[${tag}] (l7) P${x.pid + 1}'s accessible count misses ${want} members`);
      if (x.n !== want) errors.push(`[${tag}] (l7) P${x.pid + 1}'s figures and "+N" add up to ${x.n}, not ${want}`);
      if (x.clash) errors.push(`[${tag}] (l7) P${x.pid + 1}'s count, figures, "+N" and "each round" overlap (${x.clash} pair(s))`);
      if (x.rows > 2) errors.push(`[${tag}] (l7) P${x.pid + 1}'s figures stand in ${x.rows} rows`);
      if (!x.inside) errors.push(`[${tag}] (l7) P${x.pid + 1}'s members run out of the chair`);
      if (!x.built && want >= 10 && x.figs < 10) errors.push(`[${tag}] (l7) P${x.pid + 1}'s chair, with room, shows only ${x.figs} of ${want} members`);
      if (x.cols > 1) errors.push(`[${tag}] (l7) P${x.pid + 1}'s minions stand in ${x.cols} columns, not one`);
      if (x.zero < 0.55) errors.push(`[${tag}] (l7) P${x.pid + 1}'s empty stacks fade to ${x.zero} (their rings vanish on purple and magenta)`);
      if (x.rivalTabs) errors.push(`[${tag}] (l8) P${x.pid + 1}'s ${x.rivalTabs} member figure(s) are on the Tab path`);
    }
    if (seats.length !== 4) errors.push(`[${tag}] (l7) ${seats.length} chairs on screen`);
  } catch (e) {
    errors.push(`[${tag}] run: ${e.message}`);
    await page.screenshot({ path: `${SHOTS}/${tag.replace(' ', '-')}-fail.png` }).catch(() => {});
  }
  await ctx.close();
}

await browser.close();
if (server) server.kill();
if (errors.length) console.error([...new Set(errors)].join('\n'));
console.log(errors.length ? 'FAIL layout' : 'PASS layout');
process.exit(errors.length ? 1 : 0);
