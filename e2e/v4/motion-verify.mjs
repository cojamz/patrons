import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const repo = process.env.V4_REPO || process.cwd();
const require = createRequire(`${repo}/package.json`);
const { chromium } = require('playwright');
const load = p => import(pathToFileURL(`${repo}/${p}`).href);
const { buildStamp } = await load('e2e/v4/lib/stamp.mjs');
const { sceneQ, spaceOf } = await load('src/test/engine/v4/cards-helpers.js');
const { applyMove } = await load('src/engine/v4/index.js');
const { seedSave } = await load('e2e/v4/lib/seed.mjs');
const { browserPath } = await load('e2e/v4/lib/browser.mjs');
const shots = process.env.V4_SHOTS || '/tmp/patrons-motion-verify';
mkdirSync(shots, { recursive: true });
const move = (s, option) => applyMove(s, { player: s.pending.player, option }, { effects: true });
const take = (s, name) => move(s, `slot:${spaceOf(s, name)}`);
function saveOf(state) {
  state.players[0].kind = 'human'; state.players[1].kind = 'bot'; state.build = buildStamp();
  return { config: { seats: state.players.map(p => ({ name: p.name, kind: p.kind })), speed: 'normal', quadrants: state.quadrants }, state, undo: null, savedAt: Date.now() };
}
// Red's swap across two cults (since the 2026-10-18 Red rework: round I Even Swap, any two members of equal cost):
// your Host for the rival's Panel
let swap = sceneQ({ quadrants: ['gold', 'red'], round: 1, members: [['red.twins', 'red.host'], ['gold.banker', 'red.panel']] });
swap = take(swap, 'Even Swap');
const [host, panel] = [swap.players[0].members[1], swap.players[1].members[1]];
const trade = swap.pending.options.find(o => o.id === `trade:${host}:${panel}`);
assert(trade, 'fixture has the legal cross-cult swap');
const swapped = move(swap, trade.id);
const expectedSwap = swapped.players.map(p => p.members);
// Help Yourself steals 1 × round (round III: 3); stolen resources keep their colors and the space adds its own +1
// magenta (Cory, 2026-10-19)
let steal = sceneQ({ quadrants: ['gold', 'silver', 'thieves'], round: 3, res: [{}, { gold: 1, silver: 2 }] });
steal = take(steal, 'Help Yourself');
steal = move(steal, 'take:1:gold');
steal = move(steal, 'take:1:silver');
const stolen = move(steal, 'take:1:silver');
assert.deepEqual(stolen.players[0].res, { gold: 1, silver: 2, magenta: 1 });
const takes = stolen.effects.filter(e => e.type === 'transfer' && e.from.pid === 1 && e.to.pid === 0);
assert.deepEqual(takes.map(e => `${e.what.n} ${e.what.r}`).sort(), ['1 gold', '2 silver']);
const scenarios = [{ name: 'swap', state: swap, option: trade.id, expected: expectedSwap }, { name: 'magenta', state: steal, option: 'take:1:silver', expected: stolen.players.map(p => p.res) }];
if (process.env.V4_PREP_ONLY) { console.log('Prepared real-engine fixtures:', scenarios.map(s => ({ name: s.name, option: s.option }))); process.exit(0); }
assert(process.env.V4_URL, 'V4_URL required for immutable built game');
const browser = await chromium.launch({ executablePath: browserPath });
try {
  // the 390px phone pass runs only with V4_PHONE=1 (phone is out of scope, Cory 2026-10-20)
  for (const scenario of scenarios) for (const width of (scenario.name === 'swap' && process.env.V4_PHONE ? [1270, 390] : [1270])) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 }, ...(width === 390 ? { isMobile: true, hasTouch: true } : {}) });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.__motionAudit = [];
      const seen = new WeakSet(), original = Element.prototype.animate;
      Element.prototype.animate = function(frames, options) {
        if (this.matches?.('.piece-flight.ghost-layer') && Array.isArray(frames) && frames.some(f => f.transform) ) {
          seen.add(this);
          window.__motionAudit.push({ className: this.className, left: parseFloat(this.style.left), top: parseFloat(this.style.top), frames, text: this.textContent });
        }
        return original.call(this, frames, options);
      };
    });
    await seedSave(page, saveOf(structuredClone(scenario.state)), { clear: true });
    await page.goto(`${process.env.V4_URL.replace(/\/$/, '')}/?intro=0&speed=steady&botDelay=10000`);
    await page.locator('[data-home="resume"]').click();
    await page.locator('.app.game').waitFor();
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__motionAudit.length = 0; });
    // Exact option, not screen text; the same engine choice may appear in more than one responsive surface.
    if(scenario.option.startsWith('trade:')) await page.locator(`[data-option="@pick:${scenario.option.split(':')[1]}"]`).filter({visible:true}).first().click();
    const button = page.locator(`[data-option="${scenario.option}"]`).filter({ visible: true }).first();
    await button.click();
    // A render can be delayed: absence before the chain starts is not completion.
    await page.locator('.app.game[data-chain="1"]').waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForTimeout(240);
    await page.screenshot({ path: `${shots}/${scenario.name}-${width}-in-flight.png`, fullPage: true });
    await page.waitForFunction(() => !document.querySelector('.app.game[data-chain="1"]'), null, { timeout: 10000 });
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window.__motionAudit);writeFileSync(`${shots}/${scenario.name}-${width}-events.json`,JSON.stringify(events,null,2));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state);
    if (scenario.name === 'swap') {
      assert.deepEqual(saved.players.map(p => p.members), scenario.expected, 'both swap members reach correct engine owners');
      // The hub's small translateY hop is an acknowledgement, not another travel leg.
      const flights = events.filter(e => e.className.includes('piece-member') && /\bpath-(arc|cross)\b/.test(e.className));
      assert.equal(flights.length, 4, 'two incoming + two outgoing member flight legs');
      assert.equal(flights[2].top, flights[3].top, 'members leave hub side by side');
      assert.equal(Math.abs(flights[2].left - flights[3].left), 68, 'hub stops separated clearly');
      for (const p of saved.players) for (const uid of p.members) {
        assert(await page.locator(`.lt-cult-seat[data-seat="${p.id}"] .cs-member[data-uids~="${uid}"]`).count(), `member ${uid} visible in new owner ${p.id} seat`);
      }
    } else {
      assert.deepEqual(saved.players.map(p => p.res), scenario.expected, 'resource totals match real engine');
      const flights = events.filter(e => e.className.includes('piece-res'));
      assert.equal(flights.length, 3, 'three stolen units fly once each');
      assert(flights.every(e => e.className.includes('path-line') && !e.className.includes('pay')), 'direct steals; no duplicate payment or gain arcs');
    }
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow');
    await page.screenshot({ path: `${shots}/${scenario.name}-${width}-landed.png`, fullPage: true });
    writeFileSync(`${shots}/${scenario.name}-${width}.json`, JSON.stringify(events, null, 2));
    console.log(`PASS ${scenario.name} ${width}: engine totals/owners, flight count/path, chain idle, no page errors/overflow`);
    await context.close();
  }
} finally { await browser.close(); }
