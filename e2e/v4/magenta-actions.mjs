// Focused real desktop/phone actions. Hand-made saved scenes avoid playing whole games.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { freeCard } from './lib/deal.mjs';
import { createGame, applyMove, quadrant, followers } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';

const base = (process.env.V4_URL || 'http://localhost:5338').replace(/\/$/, '');
const out = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/magenta-actions`;
mkdirSync(out, { recursive: true });
const seats = ['You', 'Bo', 'Cy', 'Di'].map(name => ({ name, kind: 'human' }));
const quads = ['thieves', 'red', 'gold', 'echo'];
const key = k => `0-${quadrant('thieves').actions.findIndex(a => a.key === k)}`;
const cmp = s => ({ players: s.players.map(p => ({ res: p.res, members: p.members, bonus: p.bonus, hideout: p.hideout })), cards: s.cards, shop: s.shop, pending: s.pending });
const assert = (ok, message) => { if (!ok) throw Error(message); };
const move = (s, id) => {
  assert(s.pending?.options.some(o => o.id === id), `Missing legal ${id}: ${JSON.stringify(s.pending)}`);
  return applyMove(s, { player: s.pending.player, option: id });
};
function fixture(name) {
  let s = createGame({ seats, seed: 53, quadrants: quads });
  const round = name === 'scaling-resume' || name === 'heist' ? 3 : 2;
  Object.assign(s, { round, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }], pending: null, slots: {}, squats: {}, order: [0, 0], log: [] });
  delete s.echo;
  s.players.forEach(p => { p.res = Object.fromEntries(s.resources.map(r => [r, 0])); p.left = 5; });
  s.players[1].res.gold = 9;
  s.players[1].res.red = 4;
  s.players[2].res.red = 6;
  const deal = (def, who) => {
    const u = freeCard(s, def);
    s.shop = s.shop.filter(v => v !== u); s.pile = s.pile.filter(v => v !== u);
    s.players[who].members.push(u);
    return u;
  };
  let action, picks, member;
  if (name === 'scaling-resume') {
    action = 'pickpocket'; picks = ['take:1:gold', 'take:1:red', 'take:1:gold'];
  } else if (name === 'occupied') {
    action = 'tipoff'; picks = ['take:1:gold', 'take:1:gold', 'take:1:gold'];
    s.slots = { [key('pickpocket')]: 1, [key('hideout')]: 2, [key('ransom')]: 1 };
    // Three occupied actions, even with a second minion sharing one: never count workers or the new placement.
    s.squats = { [key('hideout')]: [1] };
  } else if (name === 'safe') {
    action = 'hideout'; picks = ['take:1:gold', 'take:1:gold'];
    s.players[2].hideout = round;
  } else if (name.startsWith('half-')) {
    action = 'rob'; picks = [name === 'half-small' ? 'take:1:red' : 'take:1:gold'];
    s.players[2].res.gold = 1;
    deal('thieves.watchdog', 3); s.players[3].res.gold = 40;
  } else if (name === 'ransom') {
    action = 'ransom'; member = deal('red.loyalists', 1);
    // Loyalists costs 5; the old <=4 ceiling would wrongly hide it.
    s.players[1].res.red = 0;
    picks = [`card:${member}`, 'pay'];
  } else if (name === 'heist') {
    action = 'heist'; member = deal('thieves.crew', 1); picks = [`card:${member}`];
  } else throw Error(`Unknown scene ${name}`);
  s = resume(s); s.build = buildStamp();
  const initial = s;
  const placed = move(s, `slot:${key(action)}`);
  let expected = placed;
  for (const id of picks) expected = move(expected, id);
  assert(expected.pending?.kind === 'buy', `${name}: did not restore buying`);
  assert(expected.players[0].res.magenta === 1, `${name}: each action gives exactly 1 inherent Magenta`);
  const own = expected.players[0], victim = expected.players[1];
  if (name === 'scaling-resume') {
    assert(own.res.gold === 2 && own.res.red === 1 && own.bonus - initial.players[0].bonus === 3 && victim.res.gold === 7 && victim.res.red === 3, 'Round III must steal 3 original colors and grant 3 followers');
  } else if (name === 'occupied') {
    assert(own.res.gold === 3 && victim.res.gold === 6, 'Occupied Magenta actions must count once, excluding the new placement');
  } else if (name === 'safe') {
    assert(own.res.gold === 2 && own.hideout === round && expected.players[2].res.red === 6, 'Lie Low must steal round resources and protect the actor');
    assert(!placed.pending.options.some(o => o.target?.pid === 2), 'Protected rival must not be offered');
  } else if (name.startsWith('half-')) {
    const color = name === 'half-small' ? 'red' : 'gold', n = color === 'red' ? 2 : 4;
    assert(own.res[color] === n && victim.res[color] === initial.players[1].res[color] - n, 'Half-stack transfer must round down and keep its color');
    assert(!placed.pending.options.some(o => o.target?.pid === 3 || o.id === 'take:2:gold'), 'Protected rivals and one-resource piles must not be offered');
    const offered = placed.pending.options.find(o => o.id === picks[0]);
    assert(offered.take === n, `Half-stack option must name the full ${n}-resource transfer`);
  } else if (name === 'ransom') {
    assert(own.res.gold === 5 && victim.res.gold === 4 && victim.members.includes(member), 'Ransom payment must preserve colors and ownership');
  } else if (name === 'heist') {
    assert(own.members.includes(member) && !victim.members.includes(member) && victim.members.length === 0, 'Poach must transfer the member without a replacement');
  }
  return { name, save: { config: { seats, speed: 'quick' }, state: initial, undo: null, savedAt: Date.now() }, action: `slot:${key(action)}`, picks, placed, expected };
}
const names = ['scaling-resume', 'occupied', 'safe', 'half-small', 'half-large', 'ransom', 'heist']
  .filter(name => !process.env.V4_SCENES || process.env.V4_SCENES.split(',').includes(name));
assert(names.length, 'V4_SCENES did not match a known scene');
if (process.argv.includes('--fixtures-only')) {
  for (const name of names) { fixture(name); console.log(`${name}: independent transfer/bonus/protection assertions pass.`); }
  process.exit(0);
}
const browser = await chromium.launch({ executablePath: browserPath });
let page, tag;
try {
  for (const [size, opts] of [['desktop', { viewport: { width: 1270, height: 700 } }], ['phone', devices['iPhone 13']]]) {
    for (const name of names) {
      tag = `${size}-${name}`;
      const ctx = await browser.newContext(opts); page = await ctx.newPage(); page.setDefaultTimeout(12000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        window.__magentaFlights = [];
        addEventListener('DOMContentLoaded', () => new MutationObserver(ms => {
          for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('ghost-layer')) {
            const x = parseFloat(n.style.left) + parseFloat(n.style.width) / 2;
            const y = parseFloat(n.style.top) + parseFloat(n.style.height) / 2;
            const sources = [...document.querySelectorAll('.lt-seat .cs-stack, .gift-card .gc-stack')].filter(el => {
              const b = el.getBoundingClientRect(); return Math.hypot(x - b.left - b.width / 2, y - b.top - b.height / 2) < 5;
            }).map(el => `${el.dataset.pid ?? el.closest('[data-pid]')?.dataset.pid}:${el.dataset.res}`);
            window.__magentaFlights.push({ className: n.className, sources, colorTurn: !!n.querySelector('.path-turn') });
          }
        }).observe(document.body, { childList: true, subtree: true }));
      });
      const t = fixture(name);
      await seedSave(page, t.save); await page.goto(`${base}/?intro=0&speed=quick`);
      const enter = async () => {
        await page.locator('[data-home="resume"], .app.game').first().waitFor();
        const resume = page.locator('[data-home="resume"]');
        if (await resume.isVisible()) await resume.click();
        const handoff = page.locator('[data-handoff]'); if (await handoff.isVisible()) await handoff.click();
        await page.locator('.app.game:not([data-animating])').waitFor();
      };
      await enter();
      const press = async id => {
        await page.locator('.app.game:not([data-animating])').waitFor();
        // Touch hover confirmation is briefly guarded after layout/phase changes.
        if (size === 'phone') await page.waitForTimeout(450);
        const selector = `[data-option=${JSON.stringify(id)}]:not([disabled]):not([aria-disabled="true"])`;
        const el = page.locator(selector).first(); await el.waitFor();
        if (size === 'phone') await el.tap(); else await el.click();
        const place = page.getByRole('button', { name: 'Place here', exact: true });
        if (await place.isVisible()) await place.click();
      };
      await press(t.action);
      await page.locator('.app.game:not([data-animating])').waitFor();
      await page.locator(`[data-option=${JSON.stringify(t.picks[0])}]:not([disabled])`).first().waitFor();
      await page.screenshot({ path: `${out}/${tag}-choice.png` });
      if (name.startsWith('half-')) {
        const chosen = page.locator(`.gc-stack[data-option=${JSON.stringify(t.picks[0])}]`);
        await chosen.waitFor();
        assert(new RegExp(`Take ${name === 'half-small' ? 2 : 4} `).test(await chosen.getAttribute('aria-label')), `${tag}: half choice hides amount`);
      }
      for (const [i, id] of t.picks.entries()) {
        await press(id);
        if (name === 'scaling-resume' && i === 0) {
          // Resume the actual saved partial selection, not a reseeded approximation.
          await page.reload(); await enter();
          await page.locator('[data-option="take:1:red"]:not([disabled])').first().waitFor();
        }
        if (name === 'ransom' && i === 0) {
          const handoff = page.locator('[data-handoff]'); if (await handoff.isVisible()) await handoff.click();
        }
      }
      await page.waitForFunction(want => {
        try { const s = JSON.parse(localStorage.getItem('patrons.v4.local')).state;
          return JSON.stringify({ players: s.players.map(p => ({ res: p.res, members: p.members, bonus: p.bonus, hideout: p.hideout })), cards: s.cards, shop: s.shop, pending: s.pending }) === JSON.stringify(want);
        } catch { return false; }
      }, cmp(t.expected));
      await page.locator('.app.game[data-phase="buy"]:not([data-animating])').waitFor({ timeout: 18000 });
      const shown = await page.locator('.lt-seat[data-pid="0"] .cs-total').getAttribute('data-followers');
      assert(Number(shown) === followers(t.expected, t.expected.players[0]), `${tag}: displayed followers differ`);
      const flights = await page.evaluate(() => window.__magentaFlights);
      assert(flights.length > 0, `${tag}: no visible motion`);
      assert(!flights.some(f => f.colorTurn), `${tag}: theft still changes color in flight`);
      if (name !== 'heist') {
        const color = name === 'half-small' ? 'red' : 'gold';
        assert(flights.some(f => /piece-res|pick-flight/.test(f.className) && f.sources.includes(`1:${color}`)), `${tag}: resource motion never starts at the chosen rival pile`);
      }
      assert(!await page.evaluate(() => document.body.scrollWidth > innerWidth + 1), `${tag}: horizontal overflow`);
      assert(!errors.length, `${tag}: ${errors.join('; ')}`);
      await page.screenshot({ path: `${out}/${tag}-settled.png` });
      console.log(`${tag}: exact state and independently checked colors/counts; restored buying; ${flights.length} motion pieces; no errors/overflow.`);
      await ctx.close();
    }
  }
} catch (error) {
  if (page && !page.isClosed()) {
    await page.screenshot({ path: `${out}/${tag}-failure.png` });
    console.error((await page.locator('body').innerText()).slice(-2200));
  }
  throw error;
} finally { await browser.close(); }
