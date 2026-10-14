// E2E: a full hot-seat game in a real browser. 1 person + 3 bots; the person clicks the first legal option each time.
// Fails on any console error or page error. Screenshots go to /tmp/patrons-shots/v4/.
//
// Server: uses $V4_URL if set (npm run check:v4 sets it to a `vite preview`). Otherwise it starts
// `npx vite` itself on the first free port from 5180 and stops it at the end.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';

const SHOTS = '/tmp/patrons-shots/v4';
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const DESKTOP = { width: 1270, height: 700 };
const PHONE = { width: 400, height: 820 };

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
  if (size && size.width <= 420) {
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (wide > 0) errors.push(`horizontal scroll of ${wide}px at ${size.width}px on ${name}`);
    await page.screenshot({ path: `${SHOTS}/${name}-full.png`, fullPage: true });
  }
  if (size) await page.setViewportSize(DESKTOP);
};

let ok = false;
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

  const seen = new Set();
  const t0 = Date.now();
  let clicks = 0;
  while (!(await page.$('.results'))) {
    if (Date.now() - t0 > 240000) throw new Error('game did not finish in 4 minutes');
    const hand = await page.$('[data-handoff]');
    if (hand) { await hand.click(); continue; }
    const next = await page.$('[data-next-round]');
    if (next) {
      const r = await page.$eval('.roundend h2', e => e.textContent).catch(() => 'x');
      if (!seen.has(r)) { seen.add(r); await page.waitForTimeout(800); await shot(`04-${r.replace(/\W+/g, '_')}`); if (/II /.test(r + ' ')) await shot(`04-${r.replace(/\W+/g, '_')}-phone`, PHONE); }
      await next.click();
      continue;
    }
    const kind = await page.evaluate(() => {
      const el = document.querySelector('[data-option]:not([disabled])');
      return el ? el.getAttribute('data-option').split(':')[0] : null;
    });
    if (!kind) { await page.waitForTimeout(30); continue; }
    const round = await page.$eval('.status .round', e => e.textContent).catch(() => '');
    const tag = `${kind}@${round.split(' ·')[0]}`;
    if (!seen.has(tag) && ['slot', 'card', 'color', 'tier', 'pass', 'pay'].includes(kind)) {
      seen.add(tag);
      const name = `03-${String(seen.size).padStart(2, '0')}-${tag.replace(/[^a-z0-9@]+/gi, '_')}`;
      await shot(name);
      if (seen.size === 2 || kind === 'pay' || (kind === 'color' && /Setup/.test(round)) || (/III/.test(round) && !seen.has('phone3') && seen.add('phone3'))) await shot(`${name}-phone`, PHONE);
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
