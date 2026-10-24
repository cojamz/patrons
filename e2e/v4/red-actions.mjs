// Focused real clicks: Red swaps can involve two rivals or the shop; Green copying Promote asks afresh.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';

const base = (process.env.V4_URL || 'http://localhost:5317').replace(/\/$/, '');
const out = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/red-actions`;
mkdirSync(out, { recursive: true });
const quads = ['gold', 'red', 'purple', 'echo'];
const stamp = buildStamp();
const seats = [{ name: 'You', kind: 'human' }, { name: 'Bo', kind: 'human' }, { name: 'Cy', kind: 'human' }];
const slot = (q, k) => `${quads.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;
const move = (s, id) => applyMove(s, { player: s.pending.player, option: id });
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const uid = (s, def, where) => {
  const found = (where === 'shop' ? s.shop : s.players[where].members).find(u => s.cards[u].def === def);
  if (found == null) throw new Error(`Missing ${def} in ${where}`);
  return found;
};
function fixture() {
  const s = createGame({ seats, seed: 53, quadrants: quads });
  Object.assign(s, { round: 2, queue: [], pending: null, slots: {}, squats: {}, order: [], log: [] });
  delete s.echo;
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  s.players.forEach(p => { p.res = Object.fromEntries(s.resources.map(r => [r, 0])); p.left = 5; });
  const deal = (def, where) => {
    const i = s.pile.findIndex(u => s.cards[u].def === def);
    if (i < 0) throw new Error(`Missing deck member ${def}`);
    (where === 'shop' ? s.shop : s.players[where].members).push(s.pile.splice(i, 1)[0]);
  };
  for (const [who, def] of [[0, 'red.recruiter'], [1, 'gold.prospector'], [2, 'echo.evergreen'], ['shop', 'red.host'], ['shop', 'red.twins'], ['shop', 'echo.muse'], ['shop', 'gold.banker']]) deal(def, who);
  return s;
}
function scenario(name) {
  let s = fixture();
  s.queue = (name === 'copy-promote' ? [1, 0, 0] : [0, 0]).map(p => ({ t: 'turn', p }));
  s = resume(s);
  let action = name === 'rival-swap' ? 'evenswap' : 'hireup';
  if (name === 'copy-promote') {
    s = move(s, `slot:${slot('red', 'hireup')}`);
    s = pass(move(s, `trade:${uid(s, 'gold.prospector', 1)}:${uid(s, 'echo.muse', 'shop')}`));
    action = 'encore';
  }
  s.build = stamp;
  const save = { config: { seats, speed: 'fast' }, state: s, undo: null, savedAt: Date.now() };
  let expected = move(s, `slot:${slot(name === 'copy-promote' ? 'echo' : 'red', action)}`);
  const picks = [];
  if (name === 'copy-promote') {
    const copy = expected.pending.options.find(o => o.value === slot('red', 'hireup'));
    if (!copy) throw new Error('Encore does not offer rival Promote');
    picks.push(copy.id); expected = move(expected, copy.id);
  }
  const a = name === 'rival-swap' ? uid(expected, 'gold.prospector', 1) : uid(expected, 'red.recruiter', 0);
  const b = name === 'rival-swap' ? uid(expected, 'echo.evergreen', 2) : uid(expected, 'red.host', 'shop');
  const pair = `trade:${a}:${b}`;
  if (!expected.pending.options.some(o => o.id === pair)) throw new Error(`${name}: missing swap ${pair}`);
  expected = move(expected, pair);
  if (expected.pending?.kind !== 'buy') throw new Error(`${name}: did not return to buying`);
  return { save, action: `slot:${slot(name === 'copy-promote' ? 'echo' : 'red', action)}`, picks, a, b, pair, expected };
}
const comparable = s => ({ players: s.players.map(p => ({ members: p.members, res: p.res, bonus: p.bonus })), shop: s.shop, cards: s.cards });
if (process.argv.includes('--fixtures-only')) {
  for (const name of ['rival-swap', 'promote', 'copy-promote']) { scenario(name); console.log(`${name}: fixture resolves to buying.`); }
  process.exit(0);
}
const browser = await chromium.launch({ executablePath: browserPath });
let currentPage, currentTag;
try {
  for (const [tag, options] of [['desktop', { viewport: { width: 1270, height: 700 } }], ['phone', devices['iPhone 13']]]) {
    for (const name of ['rival-swap', 'promote', 'copy-promote']) {
      // A fresh context prevents the previous local game’s auto-resume flag from bypassing Home.
      const ctx = await browser.newContext(options);
      const page = await ctx.newPage(); currentPage = page; currentTag = `${tag}-${name}`;
      page.setDefaultTimeout(10000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const test = scenario(name);
      await seedSave(page, test.save);
      await page.goto(`${base}/?intro=0&botDelay=50`);
      await page.locator('[data-home="resume"]').click();
      const hand = page.locator('[data-handoff]');
      if (await hand.isVisible()) await hand.click();
      const press = async id => {
        const el = page.locator(`[data-option=${JSON.stringify(id)}]:not([disabled]):not([aria-disabled="true"])`).first();
        await el.waitFor(); if (tag === 'phone') await el.tap(); else await el.click();
        const place = page.getByRole('button', { name: 'Place here', exact: true });
        if (await place.isVisible()) await place.click();
      };
      await press(test.action);
      for (const pick of test.picks) await press(pick);
      const card = page.locator('.gift-card[data-gift="trade"]');
      await card.waitFor();
      await page.locator(`.gift-card .gc-row[data-row="1"] [data-uid="${test.a}"]`).click();
      const choose = page.locator(`.gift-card .gc-row[data-row="2"] [data-option=${JSON.stringify(test.pair)}]:not([disabled])`);
      await choose.waitFor();
      await page.screenshot({ path: `${out}/${tag}-${name}-choice.png` });
      if (tag === 'phone') await choose.tap(); else await choose.click();
      await page.waitForFunction(expected => {
        try { const s = JSON.parse(localStorage.getItem('patrons.v4.local')).state;
          return s.pending?.kind === 'buy' && JSON.stringify({ players: s.players.map(p => ({ members: p.members, res: p.res, bonus: p.bonus })), shop: s.shop, cards: s.cards }) === JSON.stringify(expected);
        } catch { return false; }
      }, comparable(test.expected), { timeout: 15000 });
      await page.locator('.app.game[data-phase="buy"]:not([data-animating])').waitFor({ timeout: 15000 });
      await page.screenshot({ path: `${out}/${tag}-${name}-settled.png` });
      console.log(`${tag}: ${name}; exact owners, resources, cards, shop and restored buy phase.`);
      if (errors.length) throw new Error(`${tag}: ${errors.join('; ')}`);
      await ctx.close();
    }
  }
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: `${out}/${currentTag}-failure.png` });
    console.error((await currentPage.locator('body').innerText()).slice(-2000));
  }
  throw error;
} finally { await browser.close(); }
