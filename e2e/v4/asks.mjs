import { browserPath } from './lib/browser.mjs';
// E2E: a member asking you something shows itself on your seat (blind testers, 2026-10-15: "usable members don't show
// themselves"; the house rule: a member you can act on now glows on your seat, and its card, right beside it, carries
// the control). Saved hot-seat games (e2e/v4/lib/asks-save.mjs), P1 the only person, 1270×700. Build-failing:
//  (a1) Big Spender's second buy: Big Spender is lit in your seat (warm ring, the only lit member on the table); its
//       card says what's happening and offers "Skip"; pressing Skip passes, and Big Spender keeps its second buy;
//  (a2) Straggler's move: Straggler is lit in your seat; its card says to pick a lit space and offers "Stay put";
//       pressing it ends the question with the minion where it was, Straggler unspent;
//  (a3) Translator's switch under its figure says what it is when pointed at (its name, on/off, its rule).
// Screenshots go to $V4_SHOTS (default /tmp/patrons-shots/v4/asks/).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { askSave } from './lib/asks-save.mjs';
import { seedSave } from './lib/seed.mjs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/asks`;
mkdirSync(SHOTS, { recursive: true });
const base = process.env.V4_URL || 'http://localhost:5180';
const fails = [];
const fail = (msg, step) => fails.push(`[${step}] ${msg}`);
const browser = await chromium.launch({ executablePath: browserPath });
const errors = [];

async function open(name) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  // the build's own stamp (a new game's), so the hand-made save resumes in this build
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
  const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
  const got = askSave(name);
  got.save.state.build = stamp;
  await seedSave(page, got.save);
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector('[data-cult="0"] .cs-member');
  await page.waitForTimeout(700);
  await page.mouse.move(4, 690);
  await page.waitForTimeout(250);
  return { ctx, page, ...got };
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state);
const lit = page => page.evaluate(() => [...document.querySelectorAll('.lt-cult-seat .cs-member.ready')].map(m => ({
  seat: m.closest('[data-cult]').dataset.cult, id: m.dataset.member, state: m.dataset.state || '',
  ring: /rgba?\(/.test(getComputedStyle(m.querySelector('.fig'), '::before').boxShadow || ''),
})));
async function hoverFig(page, id) {
  const f = await page.$(`[data-cult="0"] .cs-member[data-member="${id}"] .fig`);
  if (!f) return null;
  const b = await f.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.waitForFunction(() => !!document.querySelector('[data-tip-body] [data-card]'), null, { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const t = document.querySelector('[data-tip-body]');
    if (!t) return null;
    const s = t.querySelector('[data-skip]');
    return { ask: t.querySelector('[data-ask]')?.textContent || '', skip: s ? s.textContent : '', skipOption: s ? s.dataset.option : '' };
  });
}
async function pressSkip(page, step) {
  const btn = await page.$('[data-tip-body] [data-skip]');
  if (!btn) return false;
  const before = await saved(page);
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); // across the gap from the figure to its card
  await page.waitForTimeout(120);
  if (!(await page.$('[data-tip-body] [data-skip]'))) { fail('the member\'s card closed while the pointer moved onto its Skip button', step); return false; }
  await page.mouse.down(); await page.mouse.up();
  return page.waitForFunction(m => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves > m; } catch { return false; } }, before.moves, { timeout: 4000 }).then(() => true, () => false);
}

try {
  // (a1) Big Spender's second buy, and (a3) Translator's switch, on the same table
  {
    const { ctx, page, uids } = await open('bigspender');
    const on = await lit(page);
    await page.screenshot({ path: `${SHOTS}/a1-big-spender-seat.png` });
    const big = on.find(x => x.id === 'benders.bigspender');
    if (!big || big.seat !== '0' || big.state !== 'ready' || !big.ring) fail(`Big Spender isn't lit in your seat during its second buy: ${JSON.stringify(on)}`, 'a1');
    if (on.some(x => x.id !== 'benders.bigspender')) fail(`other members are lit too: ${JSON.stringify(on)}`, 'a1');
    const card = await hoverFig(page, 'benders.bigspender');
    await page.screenshot({ path: `${SHOTS}/a1-big-spender-card.png` });
    if (!card || !/recruiting again/i.test(card.ask) || !/^Skip/.test(card.skip) || card.skipOption !== 'pass') fail(`Big Spender's card during its second buy: ${JSON.stringify(card)}`, 'a1');
    else {
      if (!(await pressSkip(page, 'a1'))) fail('pressing Skip on Big Spender\'s card did nothing', 'a1');
      const s = await saved(page);
      const c = s.cards[uids.big];
      if (c.spent && c.spent.extraBuy === s.round) fail('Skip spent Big Spender\'s second buy (a pass keeps it for a later turn)', 'a1');
      if (s.pending && s.pending.player === 0 && s.pending.kind === 'buy' && s.pending.extra) fail('after Skip the second buy is still waiting', 'a1');
      const after = await lit(page);
      if (after.some(x => x.id === 'benders.bigspender')) fail('Big Spender is still lit after Skip', 'a1');
    }
    await ctx.close();
  }
  {
    const { ctx, page } = await open('bigspender');
    const sw = await page.$('[data-cult="0"] .cs-member[data-member="echo.translator"] .mu-sw-tip');
    if (!sw) fail('Translator\'s switch in your seat has no hover of its own', 'a3');
    else {
      const b = await sw.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
      const text = await page.waitForFunction(() => document.querySelector('[data-tip-body] [data-switch-card]')?.innerText || null, null, { timeout: 1500 }).then(h => h.jsonValue(), () => null);
      await page.screenshot({ path: `${SHOTS}/a3-translator-switch.png` });
      if (!text || !/Translator is off/.test(text) || !/copy/i.test(text) || !/switch it on/i.test(text)) fail(`pointing at Translator's switch: ${JSON.stringify(text)}`, 'a3');
    }
    await ctx.close();
  }
  // (a2) Straggler's move
  {
    const { ctx, page, uids } = await open('straggler');
    const on = await lit(page);
    await page.screenshot({ path: `${SHOTS}/a2-straggler-seat.png` });
    const st = on.find(x => x.id === 'benders.straggler');
    if (!st || st.seat !== '0' || st.state !== 'ready' || !st.ring) fail(`Straggler isn't lit in your seat while it asks: ${JSON.stringify(on)}`, 'a2');
    const card = await hoverFig(page, 'benders.straggler');
    await page.screenshot({ path: `${SHOTS}/a2-straggler-card.png` });
    if (!card || !/lit space/i.test(card.ask) || card.skip !== 'Stay put' || card.skipOption !== 'no') fail(`Straggler's card while it asks: ${JSON.stringify(card)}`, 'a2');
    else {
      const before = await saved(page);
      if (!(await pressSkip(page, 'a2'))) fail('pressing "Stay put" on Straggler\'s card did nothing', 'a2');
      const s = await saved(page);
      if (s.cards[uids.st].usedRound === s.round) fail('"Stay put" spent Straggler', 'a2');
      // (the round may end right after, clearing the board: the engine's log says whether a minion moved)
      if (s.log.slice(before.log.length).some(l => /Straggler moves/.test(typeof l === 'string' ? l : JSON.stringify(l)))) fail('"Stay put" moved your minion', 'a2');
      if (s.pending && s.pending.player === 0 && s.pending.kind === 'choose' && /^Straggler:/.test(s.pending.prompt)) fail('Straggler still asks after "Stay put"', 'a2');
    }
    await ctx.close();
  }
} catch (e) {
  fails.push(`run: ${e.stack || e.message}`);
}
await browser.close();
for (const e of errors) fails.push(`page error: ${e}`);
for (const f of fails) console.log(`  ✗ ${f}`);
console.log(fails.length ? `FAIL asks (${fails.length})` : 'PASS asks');
process.exit(fails.length ? 1 : 0);
