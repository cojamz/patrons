import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E Peek gate (Cory, 2026-10-23, live playtest: "with peek, player loses the ability to see the current shop" and
// "player should still be able to see Peek card they can't afford when recruiting"), at laptop size (1270×700).
//  (k1) Ordering Peek's 4: the whole shop stays on screen beside them; the 4 are lit and tagged "pile", the shop isn't lit.
//  (k2) Recruiting after Peek: all 4 stay beside the shop; the ones you can pay for are lit, the others recede.
//  (k3) Nothing runs off the bottom of the window.
//  (k4) Ordering Peek's 4, with or without the "affordable" toggle: every shop member steps well back (Mike's playtest, 2026-10-26).
//  (k5-k7) A click numbers a card, a second click un-numbers it, a drag sets the order, Done sends it (Cory, Oct 29).
// Saves: e2e/v4/lib/peek-save.mjs. Server: $V4_URL if set, else its own `npx vite` on a free port from 5405.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { peekSave } from './lib/peek-save.mjs';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/peek';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5405;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 120 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}
const errors = [];
const browser = await launchBrowser({ executablePath: browserPath });

async function open(tag, save, { fade = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  await seedSave(page, save);
  if (fade) await page.addInitScript(() => { try { localStorage.setItem('patrons.v4.shopFade', 'on'); } catch { /* blocked: the check below says so */ } });
  await page.goto(`${base}/?intro=0`, { timeout: 90000 });
  await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-card.lit', { timeout: 60000 });
  await page.mouse.move(640, 695);
  await page.waitForTimeout(600);
  return { ctx, page };
}
const cards = page => page.$$eval('.lt-shop .lt-card[data-uid]', els => els.map(e => {
  const r = e.getBoundingClientRect();
  return { uid: e.dataset.uid, lit: e.classList.contains('lit'), recede: e.classList.contains('recede'), pile: !!e.closest('.lt-pile-row') || !!e.querySelector('.from-pile'), bottom: r.bottom, opacity: Number(getComputedStyle(e).opacity) };
}));

try {
  for (const [stage, extraShop] of [['order', 0], ['order', 2], ['buy', 0], ['buy', 2]]) {
    const save = peekSave({ stage });
    // round III's shop of 8: two more face up
    if (extraShop) save.state.shop.push(...save.state.pile.splice(10, extraShop));
    const st = save.state;
    const tag = `${stage}-${st.shop.length}`;
    // the "affordable" toggle on for the round III shop (Mike's playtest, 2026-10-26: it kept the shop lit beside Peek's 4)
    const { ctx, page } = await open(tag, save, { fade: !!extraShop });
    const shown = await cards(page);
    const top4 = st.pile.slice(0, 4).map(String);
    for (const u of st.shop.map(String)) if (!shown.some(c => c.uid === u)) errors.push(`(k1/k2 ${tag}) shop member ${u} is not on screen`);
    for (const u of top4) {
      const c = shown.find(x => x.uid === u);
      if (!c) { errors.push(`(${tag}) peeked member ${u} is not on screen`); continue; }
      if (!c.pile) errors.push(`(${tag}) peeked member ${u} is neither in the "Top of the pile" row nor tagged "pile"`);
    }
    const lit = shown.filter(c => c.lit).map(c => c.uid).sort();
    if (stage === 'order') {
      if (lit.join() !== [...top4].sort().join()) errors.push(`(k1 ${tag}) lit ${lit.join(' ')}, want the peeked ${top4.join(' ')}`);
      // (k4) only the 4 read as clickable: every shop member steps well back, affordable or not, toggle or not
      await page.waitForTimeout(300);
      const again = await cards(page);
      for (const c of again) if (!top4.includes(c.uid) && c.opacity > 0.5) errors.push(`(k4 ${tag}) shop member ${c.uid} stays bright (opacity ${c.opacity}) beside Peek's 4`);
    } else {
      const can = st.pending.options.filter(o => o.kind === 'card' && o.fromPile).map(o => String(o.uid));
      const cant = top4.filter(u => !can.includes(u));
      if (!cant.length) errors.push(`(k2 ${tag}) the save has no peeked member out of reach`);
      for (const u of cant) if (!shown.find(c => c.uid === u)?.recede) errors.push(`(k2 ${tag}) peeked member ${u} you can't pay for doesn't recede`);
      for (const u of can) if (!shown.find(c => c.uid === u)?.lit) errors.push(`(k2 ${tag}) peeked member ${u} you can pay for isn't lit`);
    }
    // (k5) the row (Cory, playtest Oct 28): a click numbers the card at once, "Keep this order" finishes the order,
    // and the same 4 stay in the row, numbered 1-4, for the recruit
    if (stage === 'order' && !extraShop) {
      const t0 = Date.now();
      await page.click('.lt-pile-row .lt-card.lit >> nth=1');
      await page.waitForSelector('.lt-pile-row .pr-slot', { timeout: 2000 }).catch(() => errors.push(`(k5 ${tag}) a click in the row numbered nothing`));
      const took = Date.now() - t0;
      if (took > 600) errors.push(`(k5 ${tag}) the first number took ${took}ms`);
      // (k6) a click on a numbered card takes its number back (Cory, Oct 29: "click again during peek to unassign")
      await page.click('.lt-pile-row .lt-card.lit >> nth=0');
      if (await page.$$eval('.lt-pile-row .pr-slot', els => els.length)) errors.push(`(k6 ${tag}) a second click on a numbered card kept its number`);
      // (k7) a drag sets the order (Cory, Oct 29: "peek interaction should include drag to reshuffle"): the 4th to the top
      const rowUids = () => page.$$eval('.lt-pile-row .lt-card', els => els.map(e => e.dataset.uid));
      const before = await rowUids();
      const box = i => page.locator('.lt-pile-row .lt-card').nth(i).boundingBox();
      const [b3, b0] = [await box(3), await box(0)];
      await page.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2);
      await page.mouse.down();
      for (let k = 1; k <= 8; k++) await page.mouse.move(b3.x + b3.width / 2 + (b0.x - b3.x) * k / 8, b3.y + b3.height / 2);
      await page.mouse.up();
      const want = [before[3], ...before.slice(0, 3)];
      const after = await rowUids();
      if (after.join() !== want.join()) errors.push(`(k7 ${tag}) after dragging the 4th to the top the row reads ${after.join(' ')}, want ${want.join(' ')}`);
      await page.click('.lt-pile-row .pr-keep');
      await page.waitForSelector('.lt-pile-row[data-pile-row="recruit"]', { timeout: 4000 }).catch(() => errors.push(`(k5 ${tag}) Done didn't finish the order`));
      const n = await page.$$eval('.lt-pile-row .pr-slot', els => els.map(e => e.textContent).join(''));
      if (n !== '1234') errors.push(`(k5 ${tag}) the row reads ${n || 'nothing'} after the order, want 1234`);
      const final = await rowUids();
      if (final.join() !== want.join()) errors.push(`(k7 ${tag}) the pile came back ${final.join(' ')}, want the dragged order ${want.join(' ')}`);
    }
    const low = shown.filter(c => c.bottom > 700);
    if (low.length) errors.push(`(k3 ${tag}) ${low.length} card(s) run off the bottom`);
    await page.screenshot({ path: `${SHOTS}/${tag}.png` });
    await ctx.close();
  }
} catch (e) { errors.push(`crashed: ${e.stack || e.message}`); }
await browser.close();
if (server) server.kill();
if (errors.length) { console.error('PEEK GATE FAILED\n' + errors.map(e => '  ' + e).join('\n')); process.exit(1); }
console.log('peek gate passed (4 tables)');
