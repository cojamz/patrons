import { browserPath } from './lib/browser.mjs';
// E2E: Squatter onto a rival's Greatest Hits copies every action with your minion (Cory's v0.9.1 playtest, Oct 27:
// "using squatter on greatest hits didnt seem to work… players actions werent copied"). Round III, you took two
// spaces, a rival took Greatest Hits; you join it with Squatter on the wheel and answer its "copy which next?".
// Server: $V4_URL (a built preview). Shots: $V4_SHOTS/squat-hits.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/squat-hits`;
mkdirSync(SHOTS, { recursive: true });
const base = (process.env.V4_URL || 'http://localhost:5532/').replace(/\/$/, '');
const QUADS = ['gold', 'red', 'market', 'echo'];
const key = (q, k) => `${QUADS.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;
const GH = key('echo', 'eternity');

function squatSave(stamp) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }];
  let s = createGame({ seats, seed: 7, quadrants: QUADS });
  s.build = stamp;
  Object.assign(s, { round: 3, slots: {}, squats: {}, order: [], pending: null });
  delete s.echo;
  s.players.forEach(p => { p.res = Object.fromEntries(s.resources.map(r => [r, 0])); p.left = 3; p.members = []; });
  const uid = Math.max(...Object.keys(s.cards).map(Number)) + 1;
  s.cards[uid] = { uid, def: 'benders.squatter' };
  s.players[0].members.push(uid);
  s.queue = [0, 1, 0, 0, 1].map(p => ({ t: 'turn', p }));
  s = resume(s);
  const mv = (p, option) => { s = applyMove(s, { player: p, option }); while (s.pending?.player === p && s.pending.kind === 'buy') s = applyMove(s, { player: p, option: 'pass' }); };
  mv(0, `slot:${key('gold', 'rush')}`);
  mv(1, `slot:${GH}`);
  mv(0, `slot:${key('echo', 'chant')}`);
  return s;
}

const fails = [];
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
  const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
  const save = squatSave(stamp);
  if (!(save.pending?.player === 0 && save.pending.options.some(o => o.id === `squat:${GH}`))) throw new Error('squat-hits: setup never offered joining Greatest Hits');
  await seedSave(page, { config: { seats: [{ kind: 'human', name: 'P1' }, { kind: 'bot', name: 'P2' }], speed: 'normal' }, state: save, undo: null, savedAt: Date.now() });
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector(`[data-slot="${GH}"]`);
  await page.waitForTimeout(900);
  const before = save.players[0].res;
  await page.screenshot({ path: `${SHOTS}/01-before.png` });
  const box = await (await page.$(`[data-slot="${GH}"]`)).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/02-hover.png` });
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(800);
  // a pinned card asks to confirm the join
  const join = await page.$('[data-place^="squat:"]');
  if (join) await join.click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.players[0].left === 0, null, { timeout: 5000 }).catch(() => fails.push('the join never landed'));
  await page.waitForTimeout(600);
  for (let k = 0; k < 12; k++) {
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.pending);
    if (!st || st.player !== 0 || st.kind !== 'choose') break;
    await page.screenshot({ path: `${SHOTS}/03-choice-${k + 1}.png` });
    await answerChoice(page, { timeout: 2000 });
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/04-after.png` });
  const end = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state);
  const log = end.log.slice(end.log.findIndex(l => /P1 joined P2 on Greatest Hits/.test(l)));
  console.log(JSON.stringify(log.slice(0, 10)), JSON.stringify(end.players[0].res), JSON.stringify(before));
  for (const n of ['Golden Years', 'Build Up']) if (!log.some(l => l.startsWith(`P1 copied ${n}`))) fails.push(`no "P1 copied ${n}" after joining Greatest Hits`);
  if (errors.length) fails.push(errors.join(' | '));
  await ctx.close();
} finally { await browser.close(); }
if (fails.length) { console.error(`squat-hits: ${fails.length} failure(s)\n${fails.join('\n')}`); process.exit(1); }
console.log('squat-hits: ok');
