import { browserPath } from '../e2e/v4/lib/browser.mjs';
// The faces lab's eyes: screenshot one action-space face (src/v4/game/faces/<face>.jsx) at 1270×700.
//   node scripts/v4-faces.mjs <face> <outDir>
// Saves <outDir>/<face>-grid1.png (every action of the classic table, lit / taken / locked), <face>-grid2.png (the
// hard ones: Echo, Thieves, Trading, Market), <face>-wheel.png (both live wheels in round III) and <face>-page.png
// (the first 1270×700 of the lab). Prints any page errors.
// Server: $FACES_URL if set (e.g. a dev server you keep running), else its own `vite` dev server on the first free
// port from 5350 (it serves the live tree, so a face file's edits show on the next run), stopped at the end.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const [face, outArg] = process.argv.slice(2);
if (!face) { console.error('usage: node scripts/v4-faces.mjs <face> <outDir>'); process.exit(2); }
const out = resolve(outArg || `/tmp/patrons-shots/faces/${face}`);
mkdirSync(out, { recursive: true });

const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, '127.0.0.1'); });
let server = null;
let base = process.env.FACES_URL;
if (!base) {
  let port = 5350;
  while (!(await free(port))) port++;
  base = `http://127.0.0.1:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 80 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base, { signal: AbortSignal.timeout(3000) }).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error(`vite did not start on ${port}`); process.exit(1); }
  console.log(`dev server: ${base}`);
}

const browser = await chromium.launch({ executablePath: browserPath });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = `${base}/?lab=faces&face=${encodeURIComponent(face)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.lab-faces', { timeout: 30000 });
  await page.waitForSelector('[data-faces-ready="1"]', { timeout: 30000 }).catch(() => errors.push(`face "${face}" never loaded (is src/v4/game/faces/${face}.jsx there?)`));
  await page.waitForSelector('#wheel .slot', { timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${face}-page.png` });
  for (const id of ['grid1', 'grid2', 'wheel']) {
    const el = await page.$(`#${id}`);
    if (el) { await el.screenshot({ path: `${out}/${face}-${id}.png` }); console.log(`${out}/${face}-${id}.png`); }
  }
  console.log(`lab: ${url}`);
} catch (e) {
  errors.unshift(String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) { console.log(`page errors (${errors.length}):\n  ${[...new Set(errors)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
