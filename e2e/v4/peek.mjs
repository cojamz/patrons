import { browserPath } from './lib/browser.mjs';
// E2E Peek gate (Cory, 2026-10-23, live playtest: "with peek, player loses the ability to see the current shop" and
// "player should still be able to see Peek card they can't afford when recruiting"), at laptop size (1270×700).
//  (k1) Ordering Peek's 4: the whole shop stays on screen beside them; the 4 are lit and tagged "pile", the shop isn't lit.
//  (k2) Recruiting after Peek: all 4 stay beside the shop; the ones you can pay for are lit, the others recede.
//  (k3) Nothing runs off the bottom of the window.
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
const browser = await chromium.launch({ executablePath: browserPath });

async function open(tag, save) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  await seedSave(page, save);
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
  return { uid: e.dataset.uid, lit: e.classList.contains('lit'), recede: e.classList.contains('recede'), pile: !!e.querySelector('.from-pile'), bottom: r.bottom };
}));

try {
  for (const [stage, extraShop] of [['order', 0], ['order', 2], ['buy', 0], ['buy', 2]]) {
    const save = peekSave({ stage });
    // round III's shop of 8: two more face up
    if (extraShop) save.state.shop.push(...save.state.pile.splice(10, extraShop));
    const st = save.state;
    const tag = `${stage}-${st.shop.length}`;
    const { ctx, page } = await open(tag, save);
    const shown = await cards(page);
    const top4 = st.pile.slice(0, 4).map(String);
    for (const u of st.shop.map(String)) if (!shown.some(c => c.uid === u)) errors.push(`(k1/k2 ${tag}) shop member ${u} is not on screen`);
    for (const u of top4) {
      const c = shown.find(x => x.uid === u);
      if (!c) { errors.push(`(${tag}) peeked member ${u} is not on screen`); continue; }
      if (!c.pile) errors.push(`(${tag}) peeked member ${u} has no "pile" tag`);
    }
    const lit = shown.filter(c => c.lit).map(c => c.uid).sort();
    if (stage === 'order') {
      if (lit.join() !== [...top4].sort().join()) errors.push(`(k1 ${tag}) lit ${lit.join(' ')}, want the peeked ${top4.join(' ')}`);
    } else {
      const can = st.pending.options.filter(o => o.kind === 'card' && o.fromPile).map(o => String(o.uid));
      const cant = top4.filter(u => !can.includes(u));
      if (!cant.length) errors.push(`(k2 ${tag}) the save has no peeked member out of reach`);
      for (const u of cant) if (!shown.find(c => c.uid === u)?.recede) errors.push(`(k2 ${tag}) peeked member ${u} you can't pay for doesn't recede`);
      for (const u of can) if (!shown.find(c => c.uid === u)?.lit) errors.push(`(k2 ${tag}) peeked member ${u} you can pay for isn't lit`);
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
