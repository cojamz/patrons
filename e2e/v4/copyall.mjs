import { browserPath } from './lib/browser.mjs';
// E2E: Greatest Hits ("Copy all your spaces / from this round") at 1270×700, from a real round III where you took a
// mix of spaces, an Echo or Reprise among them. Cory's play (2026-10-16): "Copy all your spaces doesn't work quite
// right": a copy space you took was skipped without a word. The revised rule includes copy actions, which offer a
// fresh choice without revisiting an action in the same chain:
//  (c1) the hover lists every eligible action, including copies, and explains any protected/empty skips;
//  (c2) every space of yours it copies lights up on the wheel while it's under the pointer, and no other;
//  (c3) after you take it, the Chronicle carries the skip line, and every copied space is named there.
// Server: $V4_URL (a built preview). Shots: $V4_SHOTS/copyall (or $GH_SHOTS).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { contextFor } from '../../src/engine/v4/core.js';
import { ownPlan, skipWords } from '../../src/engine/v4/content/echo.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = process.env.GH_SHOTS || `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/copyall`;
mkdirSync(SHOTS, { recursive: true });
const base = (process.env.V4_URL || 'http://localhost:5532/').replace(/\/$/, '');
const QUADS = ['gold', 'red', 'purple', 'echo'];
const key = (q, k) => `${QUADS.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;
const GH = key('echo', 'eternity');
const COPIES = [key('echo', 'echo'), key('echo', 'refrain')];
// what you take in round III before Greatest Hits, first that's open (a copy space at least once)
const WANT = [key('echo', 'echo'), key('echo', 'refrain'), key('gold', 'steal'), key('red', 'hireup'), key('purple', 'windup'), key('red', 'turnout'), key('echo', 'hum'), key('gold', 'rush')];

/** Round III, P1 (the only person) to place their last minion, having taken a mix that includes a copy space. */
function copyAllSave() {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }];
  for (let seed = 1; seed < 200; seed++) {
    let s = createGame({ seats, seed, quadrants: QUADS });
    s.build = buildStamp();
    const rand = seededRandom(seed);
    for (let n = 0; n < 6000 && !s.over; n++) {
      const pend = s.pending;
      if (!pend) break;
      if (s.round === 3 && pend.player === 0) {
        if (pend.kind === 'place' && s.players[0].left === 1) break;
        if (pend.kind === 'place') {
          const k = WANT.find(w => pend.options.some(o => o.id === `slot:${w}`));
          s = applyMove(s, { player: 0, option: k ? `slot:${k}` : chooseBotMove(s, rand).option });
          continue;
        }
        if (pend.kind === 'buy') { s = applyMove(s, { player: 0, option: 'pass' }); continue; }
      }
      s = applyMove(s, chooseBotMove(s, rand));
    }
    const mine = Object.entries(s.slots).filter(([, p]) => p === 0).map(([k]) => k);
    const ok = s.round === 3 && s.pending?.kind === 'place' && s.pending.player === 0 && s.players[0].left === 1
      && s.pending.options.some(o => o.id === `slot:${GH}`) && mine.some(k => COPIES.includes(k)) && mine.length >= 4;
    if (!ok || ownPlan(contextFor(s), s.players[0]).take.length < 2) continue;
    return { seed, mine, save: { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() } };
  }
  throw new Error('copyall: no seed reached round III with a copy space among P1\'s and Greatest Hits open');
}

const fails = [];
const fail = (m, tag) => fails.push(`[${tag}] ${m}`);
const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
  const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
  const got = copyAllSave();
  got.save.state.build = stamp;
  await seedSave(page, got.save);
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector(`[data-slot="${GH}"]`);
  await page.waitForTimeout(900);
  const names = got.mine.map(k => { const [q, i] = k.split('-').map(Number); return quadrant(QUADS[q]).actions[i]; });
  const plan = ownPlan(contextFor(got.save.state), got.save.state.players[0]);
  const copied = plan.take.map(e => e.name);
  const skipped = plan.skip.map(x => x.e.name);
  const skipReason = skipWords(plan.skip);

  // (c1)(c2) the hover
  const box = await (await page.$(`[data-slot="${GH}"]`)).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const card = await page.waitForFunction(k => { const c = document.querySelector(`[data-space-card="${k}"]`); return c && c.querySelector('[data-copies-all]') ? c.innerText : null; }, GH, { timeout: 4000 }).then(h => h.jsonValue(), () => null);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/01-hover.png` });
  if (!card) fail('Greatest Hits\' hover has no "Copies" row', 'c1');
  else {
    const copiesRow = await page.evaluate(() => document.querySelector("[data-copies-all]")?.innerText || '');
    const skipRow = await page.evaluate(() => document.querySelector("[data-copies-skip]")?.innerText || '');
    for (const n of copied) if (!copiesRow.includes(n)) fail(`"Copies" doesn't name ${n}: "${copiesRow}"`, 'c1');
    for (const n of skipped) if (copiesRow.includes(n)) fail(`"Copies" names ineligible ${n}: "${copiesRow}"`, 'c1');
    for (const n of skipped) if (!skipRow.includes(n)) fail(`"Skips" doesn't name ${n}: "${skipRow}"`, 'c1');
    if (skipped.length && !skipRow.includes(skipReason)) fail(`"Skips" doesn't say why: "${skipRow}"`, 'c1');
  }
  const lit = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-slot].copy-target')].map(e => e.dataset.slot))].sort());
  const wantLit = [...new Set(plan.take.map(e => e.key.split('+')[0]))].sort();
  if (JSON.stringify(lit) !== JSON.stringify(wantLit)) fail(`lit ${JSON.stringify(lit)}, want your copyable spaces ${JSON.stringify(wantLit)}`, 'c2');

  // (c3) take it, answer its choices as a person would, then read the Chronicle
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(900);
  for (let k = 0; k < 48; k++) {
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.pending);
    if (!st || st.player !== 0 || st.kind !== 'choose') break;
    await page.screenshot({ path: `${SHOTS}/02-choice-${k + 1}.png` });
    await answerChoice(page, { timeout: 2000 });
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/03-after.png` });
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.log);
  const at = log.findIndex(l => /took Greatest Hits/.test(l));
  const after = at < 0 ? [] : log.slice(at);
  if (at < 0) fail('the game log never says P1 took Greatest Hits', 'c3');
  else {
    if (skipped.length && !after.some(l => l.includes(`skips ${skipReason}`))) fail(`no skip line after Greatest Hits: ${JSON.stringify(after.slice(0, 8))}`, 'c3');
    for (const n of copied) if (!after.some(l => new RegExp(`P1 cop(ied|ies) ${n}\\b`).test(l))) fail(`no "copied ${n}" line: ${JSON.stringify(after.slice(0, 10))}`, 'c3');
  }
  await page.click('.lt-menu .menu-glyph').catch(() => {});
  await page.click('.lt-menu .log-btn').catch(() => {});
  const chron = await page.waitForSelector('.lt-chron', { timeout: 4000 }).catch(() => null);
  if (chron) {
    const text = await page.evaluate(() => document.querySelector('.lt-chron').innerText);
    if (skipped.length && !text.includes(skipReason)) fail('the Chronicle doesn\'t carry the skip line', 'c3');
    await page.screenshot({ path: `${SHOTS}/04-chronicle.png` });
  } else fail('the Chronicle did not open', 'c3');
  console.log(`copyall: seed ${got.seed}, took ${names.map(a => a.name).join(', ')}; copies ${copied.join(', ')}; skips ${skipped.join(', ')}`);
  await ctx.close();
} finally { await browser.close(); }
if (errors.length) fail(errors.join(' | '), 'pageerror');
if (fails.length) { console.error(`copyall: ${fails.length} failure(s)\n${fails.join('\n')}`); process.exit(1); }
console.log('copyall: ok');
