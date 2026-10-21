import { browserPath } from './lib/browser.mjs';
// E2E: the game's sounds (src/v4/sound.js; Cory, 2026-10-15: a click when you place a minion, coins as resources
// land, a fanfare for the round winner, a little voice when followers join; a mute toggle).
//  (s1) from a save at P1's last placement of round I, played to the round's summary, the game asks for every sound:
//       place, coin, follower and fanfare;
//  (s2) the ☰ menu's "Sound on" turns it off; then the game asks for no sound at all, and "Sound off" survives a reload;
//  (s3) no page error, and no click waits on a sound (the snappy gate measures click times; this checks nothing throws).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5296.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { lateSave } from './lib/late-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { actionAt } from '../../src/engine/v4/index.js';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/sound';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5296;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: browserPath, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
const asked = () => page.evaluate(() => ({ ...(window.__patronsSounds || {}) }));
const playTo = async (done, ms) => {
  const t0 = Date.now();
  while (!(await done()) && Date.now() - t0 < ms) {
    // your placement takes the space that gains you resources (its printed text starts "+N color")
    const o = await page.$('.slot.can[aria-label*=": +"]') || await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
    if (o) await o.click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(60);
  }
};

let ok = false;
try {
  // a save whose last placement can gain you resources (a space whose text starts "+N"): with P1 placing last, nothing
  // else lands a coin before the summary (the round's prizes are followers)
  let save = null;
  for (let seed = 21; seed < 80 && !save; seed++) {
    const sv = lateSave(seed, 1), st = sv.state;
    if (st.pending.options.some(o => { const m = /^slot:(\d+)-(\d+)$/.exec(o.id); return m && /^\+\d/.test(actionAt(st, +m[1], +m[2]).text); })) save = sv;
  }
  if (!save) throw new Error('no late save with a gain space open');
  await seedSave(page, save);
  await page.goto(`${base}/?botDelay=40&intro=0&speed=quick`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot');
  // (s1) to the round's summary; the Reckoning plays (no Skip), so its fanfare sounds
  await playTo(() => page.$('[data-next-round]'), 90000);
  if (!(await page.$('[data-next-round]'))) throw new Error('round I never reached its summary');
  const a = await asked();
  for (const k of ['place', 'coin', 'follower', 'fanfare']) if (!a[k]) errors.push(`(s1) the game never asked for "${k}" (${JSON.stringify(a)})`);
  await page.screenshot({ path: `${SHOTS}/s1-summary.png` }).catch(() => {});

  // (s2) the menu turns it off
  await page.click('[data-next-round]');
  await page.click('.menu-glyph').catch(() => {});
  const btn = await page.waitForSelector('[data-sound]', { timeout: 3000 }).catch(() => null);
  if (!btn) errors.push('(s2) no sound toggle in the ☰ menu');
  else {
    await page.screenshot({ path: `${SHOTS}/s2-menu.png` }).catch(() => {});
    await btn.click();
    if ((await btn.getAttribute('data-sound')) !== 'off') errors.push('(s2) the toggle did not turn sound off');
    await page.keyboard.press('Escape');
    const before = await asked();
    await playTo(async () => (await page.evaluate(() => Object.values(window.__patronsSounds || {}).reduce((x, y) => x + y, 0))) > Object.values(before).reduce((x, y) => x + y, 0), 6000);
    const after = await asked();
    if (JSON.stringify(after) !== JSON.stringify(before)) errors.push(`(s2) muted, the game still asked for sounds (${JSON.stringify(before)} → ${JSON.stringify(after)})`);
    const kept = await page.evaluate(() => localStorage.getItem('patrons.v4.sound'));
    if (kept !== 'off') errors.push(`(s2) "Sound off" was not kept (${kept})`);
  }
  console.log(`sound: asked ${JSON.stringify(a)}`);
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  await page.screenshot({ path: `${SHOTS}/zz-failure.png` }).catch(() => {});
}
await browser.close();
if (server) server.kill();
if (!ok) { console.error(`sound: FAIL\n  ${errors.join('\n  ')}`); process.exit(1); }
console.log('sound: OK');
