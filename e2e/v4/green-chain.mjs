// A real browser must re-choose after Encore copies Reprise, then return to buying.
// The same pending nested choice resumes after reload; desktop and phone use actual clicks/taps.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
import { takeCard } from './lib/take.mjs';

const base = (process.env.V4_URL || 'http://localhost:5317').replace(/\/$/, '');
const out = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/green-chain`;
mkdirSync(out, { recursive: true });
const quads = ['gold', 'red', 'purple', 'echo'];
const stamp = buildStamp();
const slot = (q, k) => `${quads.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;
const move = (s, id) => applyMove(s, { player: s.pending.player, option: id });
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const pick = (s, key) => {
  const o = s.pending.options.find(o => o.kind === 'space' && o.value === key);
  if (!o) throw new Error(`Expected ${key} in ${JSON.stringify(s.pending)}`);
  return move(s, o.id);
};
function fixture() {
  const seats = [{ name: 'You', kind: 'human' }, { name: 'Rival', kind: 'human' }];
  let s = createGame({ seats, seed: 53, quadrants: quads });
  Object.assign(s, { round: 3, queue: [], pending: null, slots: {}, squats: {}, order: [], log: [] });
  delete s.echo;
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  s.players.forEach(p => { p.res = Object.fromEntries(s.resources.map(r => [r, 0])); p.left = 5; });
  for (const [pid, id] of [[0, 'echo.ensemble'], [0, 'echo.tuningfork'], [1, 'echo.muse']]) {
    s.players[pid].members.push(takeCard(s, id));
  }
  s.shop = s.pile.splice(0, 8);
  s.queue = [1, 0, 0, 1, 0, 0].map(p => ({ t: 'turn', p }));
  s = resume(s);
  s = pass(move(s, `slot:${slot('echo', 'chant')}`));
  s = pass(move(s, `slot:${slot('gold', 'rush')}`));
  s = pass(move(s, `slot:${slot('gold', 'discount')}`));
  s = pass(pick(move(s, `slot:${slot('echo', 'refrain')}`), slot('echo', 'chant')));
  s.build = stamp;
  return { config: { seats, speed: 'fast' }, state: s, undo: null, savedAt: Date.now() };
}

const browser = await chromium.launch({ executablePath: browserPath });
let currentPage, currentTag;
try {
  // the phone pass runs only with V4_PHONE=1 (phone is out of scope, Cory 2026-10-20)
  for (const [tag, options] of [['desktop', { viewport: { width: 1270, height: 700 } }], ...(process.env.V4_PHONE ? [['phone', devices['iPhone 13']]] : [])]) {
    const ctx = await browser.newContext(options);
    const page = await ctx.newPage();
    currentPage = page; currentTag = tag;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const save = fixture();
    let expected = move(save.state, `slot:${slot('echo', 'encore')}`);
    const first = expected.pending.options.find(o => o.value === slot('echo', 'refrain')).id;
    expected = move(expected, first);
    const second = expected.pending.options.find(o => o.value === slot('gold', 'rush')).id;
    expected = move(expected, second);
    if (expected.pending?.kind !== 'buy') throw new Error('Engine failed to return to buying');
    await seedSave(page, save);
    const open = async () => {
      await page.goto(`${base}/?intro=0&botDelay=50`);
      const resumeButton = page.locator('[data-home="resume"]');
      await resumeButton.waitFor(); await resumeButton.click();
      const hand = page.locator('[data-handoff]');
      if (await hand.isVisible()) await hand.click();
      await page.locator('.lt-wheel').waitFor();
    };
    const press = async id => {
      const el = page.locator(`[data-option=${JSON.stringify(id)}]:not([disabled]):not([aria-disabled="true"])`).first();
      await el.waitFor();
      if (tag === 'phone') await el.tap(); else await el.click();
      const confirm = page.locator('[data-place]');
      if (await confirm.isVisible()) await confirm.tap();
    };
    await open();
    await press(`slot:${slot('echo', 'encore')}`);
    // Touch placement can first open an action card with a confirmation button.
    const place = page.getByRole('button', { name: 'Place here', exact: true });
    if (await place.isVisible()) await place.click();
    await press(first);
    await page.locator(`[data-option=${JSON.stringify(second)}]`).first().waitFor();
    await page.screenshot({ path: `${out}/${tag}-fresh-choice.png` });
    // Save flushes on pagehide: reload the live nested choice, never reseed it.
    await page.reload();
    // A reload in the same tab resumes by itself (App.jsx: sessionStorage patrons.v4.inGame), so the home's Resume
    // shows for at most a frame; press it only if it is still there, then require the game back.
    const again = page.locator('[data-home="resume"]');
    if (await again.isVisible()) await again.click({ timeout: 1500 }).catch(() => {});
    await page.locator('.lt-wheel').waitFor();
    const hand = page.locator('[data-handoff]');
    if (await hand.isVisible()) await hand.click();
    await press(second);
    await page.waitForFunction(expected => {
      try {
        const s = JSON.parse(localStorage.getItem('patrons.v4.local')).state;
        return s.pending?.kind === 'buy' && JSON.stringify(s.players.map(p => [p.res, p.bonus])) === JSON.stringify(expected);
      } catch { return false; }
    }, expected.players.map(p => [p.res, p.bonus]), { timeout: 20000 });
    // Engine state settles before its presentation. Verify that the legal buy controls
    // actually return after the last flight, rather than photographing a stale choice.
    const close = page.getByRole('button', { name: 'Close', exact: true });
    if (await close.isVisible()) await close.click();
    const handAfter = page.locator('[data-handoff]');
    if (await handAfter.isVisible()) await handAfter.click();
    await page.locator('.app.game[data-phase="buy"]:not([data-animating])').waitFor({ timeout: 20000 });
    await page.locator('[data-option="pass"]:not([aria-disabled="true"])').first().waitFor();
    await page.screenshot({ path: `${out}/${tag}-settled.png` });
    if (errors.length) throw new Error(`${tag}: ${errors.join('; ')}`);
    console.log(`${tag}: Encore → Reprise → own Golden Years; fresh choice, reload, exact gains, buying restored; no page errors.`);
    await ctx.close();
  }
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: `${out}/${currentTag}-failure.png` });
    console.error((await currentPage.locator('body').innerText()).slice(-3500));
  }
  throw error;
} finally { await browser.close(); }
