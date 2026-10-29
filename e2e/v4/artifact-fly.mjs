// A picked artifact flies from the wheel's list to its picker's seat (Cory, Oct 29), a rival's and your own: a flight
// leaves while the seat's tile waits unseen, and the tile shows once it lands.
import { mkdirSync } from 'node:fs';
import { browserPath, launchBrowser } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame } from '../../src/engine/v4/index.js';
const base = process.env.V4_URL || 'http://localhost:5335', out = process.env.V4_SHOTS || '/tmp/cults-artifact-fly';
const speed = process.env.SPEED || 'steady';
mkdirSync(out, { recursive: true });
const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const s = createGame({ seats, quadrants: ['red', 'purple', 'echo', 'market'], seed: 11 });
s.build = buildStamp();
const browser = await launchBrowser({ executablePath: browserPath });
let fail = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } }), p = await ctx.newPage();
  p.setDefaultTimeout(20000);
  await seedSave(p, { config: { seats, speed }, state: s, undo: null, savedAt: Date.now() });
  await p.goto(`${base}/?intro=0&speed=${speed}`);
  await p.locator('[data-home="resume"]').click();
  const hand = p.locator('[data-handoff]'); if (await hand.isVisible().catch(() => false)) await hand.click();
  // the bots pick until it's yours (a mid-flight shot of the first rival's), then yours
  let shot = 0;
  const grab = async name => { for (let i = 0; i < 40; i++) { if (await p.locator('.artifact-flight').count()) { await p.waitForTimeout(Number(process.env.MID || 90)); await p.screenshot({ path: `${out}/${name}.png` }); return true; } await p.waitForTimeout(15); } return false; };
  if (s.pending.player !== 0 && await grab('rival-flight')) shot++;
  const mine = p.locator('[data-art-draft].mine li.open button').first();
  await mine.waitFor();
  await p.locator('.app.game:not([data-animating])').waitFor();
  await mine.click();
  if (await grab('my-flight')) shot++;
  if (await grab('rival-flight-2')) shot++;
  await p.locator('.cs-artifact').first().waitFor();
  await p.waitForFunction(() => document.querySelectorAll('.cs-artifact').length === 4, null, { timeout: 30000 });
  await p.locator('.app.game:not([data-animating])').waitFor();
  await p.waitForTimeout(600);
  const n = await p.evaluate(() => window.__artifactFlights || 0);
  const hidden = await p.evaluate(() => [...document.querySelectorAll('.cs-artifact .art-tile')].filter(e => getComputedStyle(e).opacity !== '1').length);
  await p.screenshot({ path: `${out}/after.png` });
  console.log(`artifact flights: ${n} (4 picks), mid-flight shots ${shot}, seat tiles still hidden after: ${hidden}`);
  if (n < 4) { console.error('FAIL: a pick did not fly'); fail = 1; }
  if (hidden) { console.error('FAIL: a seat tile stayed hidden'); fail = 1; }
  await ctx.close();
} finally { await browser.close(); }
process.exit(fail);
