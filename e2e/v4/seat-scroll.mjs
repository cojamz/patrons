// A long cult's member list scrolls (Cory, playtest Oct 28: "i cant scroll the list of members on the hover over when it
// gets long"): a 14-member seat's card opens at 1270x700, and the mouse wheel scrolls its list from the seat itself and
// from the list, the card staying open while it scrolls.
import { chromium } from 'playwright';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { resume } from '../../src/engine/v4/core.js';
const base = process.env.V4_URL || 'http://localhost:5331';
const SEATS = [{ name: 'You', kind: 'human' }, ...['Bo', 'Cy', 'Di'].map(name => ({ name, kind: 'bot' }))];
let s = createGame({ seats: SEATS, seed: 3, quadrants: ['market', 'gold', 'red', 'echo'] });
const rand = seededRandom(3);
for (let n = 0; n < 4000 && !(s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
while (s.players[1].members.length < 14 && s.pile.length) s.players[1].members.push(s.pile.shift());
resume(s); s.build = buildStamp();
const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const page = await (await browser.newContext({ viewport: { width: 1270, height: 700 } })).newPage();
  page.on('pageerror', e => errors.push(e.message));
  await seedSave(page, { config: { seats: SEATS, speed: 'normal' }, state: s, undo: null, savedAt: Date.now() });
  await page.goto(`${base}/?intro=0`);
  await page.click('[data-home="resume"]');
  const hand = page.locator('[data-handoff]'); if (await hand.isVisible().catch(() => false)) await hand.click();
  const count = page.getByText(/^14 members$/);
  await count.waitFor();
  const b = await count.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const list = page.locator('.lt-hover.on .mu-list');
  await list.waitFor({ timeout: 5000 });
  const m = () => list.evaluate(l => ({ sh: l.scrollHeight, ch: l.clientHeight, top: l.scrollTop })).catch(() => null);
  const a = await m();
  if (!a || a.sh <= a.ch) errors.push(`the 14-member list should overflow its card: ${JSON.stringify(a)}`);
  await page.mouse.wheel(0, 200); await page.waitForTimeout(250);
  const fromSeat = await m();
  if (!fromSeat || fromSeat.top <= 0) errors.push(`the wheel on the seat didn't scroll the list: ${JSON.stringify(fromSeat)}`);
  const r = await list.boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 10 });
  await page.waitForTimeout(150);
  const rest = await m();
  if (!rest) errors.push('moving onto the list closed the card');
  // scrolling on and on: the card stays the whole time, whatever lies under it
  for (let k = 0; k < 4; k++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(350); }
  const fromList = await m();
  if (!fromList || !rest || fromList.top <= rest.top) errors.push(`the wheel on the list didn't scroll it: ${JSON.stringify({ rest, fromList })}`);
} finally { await browser.close(); }
if (errors.length) { console.error(errors.join('\n')); console.log('FAIL seat-scroll'); process.exit(1); }
console.log('seat-scroll gate passed');
