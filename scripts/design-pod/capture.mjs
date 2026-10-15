// Design pod: capture the key states of the game screen at 1270×700, for critique against design/taste.md.
//   node scripts/design-pod/capture.mjs <outdir> [state ...] [--q "layout=b"] [--url http://127.0.0.1:5410] [--size 1270x700] [--x2]
// States: home setup place buy rival pick pay shophover seathover reckon summary round3 results (default: all).
// Each state is reached from a hand-made save (bots play every seat, P1 too, so P1 holds a real build), the way the
// e2e gates do it, then screenshotted. DOM access is fine here: this is the designer's camera, not a blind tester.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from '../../e2e/v4/lib/stamp.mjs';
import { stealSave } from '../../e2e/v4/lib/steal-save.mjs';
import { paySave } from '../../e2e/v4/lib/dialog-save.mjs';

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = k => { const i = argv.indexOf('--' + k); if (i < 0) return false; argv.splice(i, 1); return true; };
const query = flag('q', '');
const base = flag('url', process.env.V4_URL || 'http://127.0.0.1:5410');
const [W, H] = flag('size', '1270x700').split('x').map(Number);
const x2 = bool('x2');
const out = argv.shift();
if (!out) { console.error('usage: capture.mjs <outdir> [states] [--q layout=b]'); process.exit(2); }
mkdirSync(out, { recursive: true });
const ALL = ['home', 'setup', 'place', 'buy', 'rival', 'pick', 'pay', 'shophover', 'seathover', 'reckon', 'summary', 'round3', 'results'];
const want = argv.length ? argv : ALL;

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const play = (s, move) => { const next = applyMove(s, move); next.history = [...(s.history || []), [move.player, move.option]]; return next; };
/** Bots play every seat until `ready`; returns the save and the round-start snapshot (so the since-strip has a story). */
function playTo(seed, ready) {
  let s = createGame({ seats: SEATS, seed });
  s.build = buildStamp(); s.history = [];
  const rand = seededRandom(seed);
  let rs = s, r = s.round;
  for (let n = 0; n < 6000 && !ready(s) && !s.over; n++) { s = play(s, chooseBotMove(s, rand)); if (s.round !== r) { r = s.round; rs = s; } }
  if (!ready(s)) throw new Error(`seed ${seed}: never ready`);
  return {
    save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() },
    roundStart: { seed: s.seed, round: s.round, names: s.players.map(p => p.name).join('|'), state: rs },
  };
}
const mine = (s, kind) => s.pending && s.pending.player === 0 && s.pending.kind === kind;
const placedThisRound = s => Object.values(s.slots).filter(v => v === 0).length;
const SAVES = {
  setup: () => playTo(5, s => mine(s, 'setup')),
  place2: () => playTo(5, s => s.round === 2 && mine(s, 'place') && placedThisRound(s) >= 1),
  last2: () => playTo(5, s => s.round === 2 && mine(s, 'place') && s.players[0].left === 1),
  place3: () => playTo(5, s => s.round === 3 && mine(s, 'place') && placedThisRound(s) >= 2),
  last3: () => playTo(5, s => s.round === 3 && mine(s, 'place') && s.players[0].left === 1),
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: x2 ? 2 : 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const url = (extra = '') => `${base}/?intro=0${query ? '&' + query : ''}${extra}`;
const shot = async name => { await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };
const settle = (ms = 600) => page.waitForTimeout(ms);
async function load(pack, tries = 3) {
  try { await load1(pack); } catch (e) { if (tries <= 1) throw e; await settle(1500); await load(pack, tries - 1); }
}
async function load1(pack) {
  await page.goto(url());
  await page.evaluate(({ save, rs }) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('patrons.v4.local', JSON.stringify(save));
    if (rs) localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs));
    localStorage.setItem('patrons.v4.introSeen', '1');
  }, { save: pack.save || pack, rs: pack.roundStart || null });
  await page.goto(url());
  await page.click('[data-home="resume"]', { timeout: 60000 });
  await page.waitForSelector('.lt-shop .card', { timeout: 20000 });
  await settle(900);
}
async function placeAndAnswer() {
  const slot = await page.$('.slot.can .base');
  const bb = await slot.boundingBox();
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await settle(400);
  for (let k = 0; k < 10 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
    const o = await page.$('.prompt.choice button[data-option]:not([disabled]), .lt-seat [data-option]:not(.pass), .lt-wheel .slot.lit .base');
    if (o) await o.click({ force: true }).catch(() => {});
    await settle(300);
  }
}
async function passBuy() {
  const p = await page.$('.lt-prompt .pass[data-option]');
  if (p) await p.click().catch(() => {});
  await settle(300);
}

for (const st of want) {
  try {
    if (st === 'home') {
      await page.goto(url());
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem('patrons.v4.introSeen', '1'); });
      await page.goto(url()); await settle(800); await shot('home');
    } else if (st === 'setup') {
      await load(SAVES.setup()); await page.waitForSelector('.prompt.choice.setup', { timeout: 8000 }).catch(() => {}); await settle(500); await shot('setup');
    } else if (st === 'place') {
      await load(SAVES.place2()); await shot('place');
    } else if (st === 'shophover') {
      await load(SAVES.place2());
      const c = await page.$$('.lt-shop .card'); const bb = await c[2].boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await settle(700); await shot('shophover');
    } else if (st === 'seathover') {
      await load(SAVES.place2());
      const s = await page.$('.lt-seat[data-pid="2"] .cs-who, .lt-seat[data-pid="2"] .cs-leader');
      const bb = await s.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await settle(700); await shot('seathover');
    } else if (st === 'buy') {
      await load(SAVES.place2()); await placeAndAnswer(); await settle(500); await shot('buy');
    } else if (st === 'rival') {
      await load(SAVES.place2()); await placeAndAnswer(); await passBuy();
      await page.waitForSelector('.lt[data-bot="1"] .turn-card', { timeout: 8000 }).catch(() => {});
      await settle(250); await shot('rival');
    } else if (st === 'pick') {
      await load(stealSave('help')); await settle(400); await shot('pick');
    } else if (st === 'pay') {
      await load(paySave({ def: 'gold.prospector', res: { gold: 3, red: 2, blue: 2, green: 3 } }));
      await page.waitForSelector('.dialog.pay, .pay', { timeout: 6000 }).catch(() => {}); await settle(400); await shot('pay');
    } else if (st === 'reckon' || st === 'summary') {
      await load(SAVES.last2()); await placeAndAnswer(); await passBuy();
      await page.waitForSelector('.lt[data-phase="reckon"]', { timeout: 30000 });
      if (st === 'reckon') { await settle(2600); await shot('reckon'); }
      else { await page.waitForSelector('.dialog.roundend', { timeout: 40000 }).catch(() => {}); await settle(800); await shot('summary'); }
    } else if (st === 'round3') {
      await load(SAVES.place3()); await shot('round3');
    } else if (st === 'results') {
      await load(SAVES.last3()); await placeAndAnswer(); await passBuy();
      await page.waitForSelector('.lt[data-phase="reckon"]', { timeout: 30000 });
      for (let k = 0; k < 60 && !(await page.$('.lt[data-phase="over"]')); k++) {
        const b = await page.$('[data-next-round], .reck-skip');
        if (b) await b.click().catch(() => {});
        await settle(700);
      }
      await settle(800); await shot('results');
    }
  } catch (e) { console.error(`${st}: ${e.message}`); await shot(`${st}-fail`).catch(() => {}); }
}
if (errs.length) console.error('page errors:\n' + [...new Set(errs)].join('\n'));
await browser.close();
