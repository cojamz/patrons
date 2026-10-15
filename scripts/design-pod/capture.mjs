// Design pod: capture the key states of the game screen at 1270×700, for critique against design/taste.md.
//   node scripts/design-pod/capture.mjs <outdir> [state ...] [--q "layout=b"] [--url http://127.0.0.1:5410] [--size 1270x700] [--x2]
// States: home setup place buy rival pick pay shophover seathover reckon summary round3 results (default: all).
// Each state is reached from a hand-made save (bots play every seat, P1 too, so P1 holds a real build), the way the
// e2e gates do it, then screenshotted. DOM access is fine here: this is the designer's camera, not a blind tester.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from '../../e2e/v4/lib/stamp.mjs';
import { stealSave } from '../../e2e/v4/lib/steal-save.mjs';
import { paySave } from '../../e2e/v4/lib/dialog-save.mjs';
import { membersSave } from '../../e2e/v4/lib/members-save.mjs';
import { TEXT_CLIP } from '../../e2e/v4/lib/textclip.mjs';

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = k => { const i = argv.indexOf('--' + k); if (i < 0) return false; argv.splice(i, 1); return true; };
const query = flag('q', '');
const TABLE = (v => (v ? v.split(',') : undefined))(flag('table', ''));
const SEED = Number(flag('seed', 5));
// --strip <name>: drop a dev stylesheet (e.g. layout.css, to photograph the old composition); --css <file>: add one
const strip = flag('strip', ''), extraCss = flag('css', '');
const base = flag('url', process.env.V4_URL || 'http://127.0.0.1:5410');
const [W, H] = flag('size', '1270x700').split('x').map(Number);
const x2 = bool('x2');
const out = argv.shift();
if (!out) { console.error('usage: capture.mjs <outdir> [states] [--q layout=b]'); process.exit(2); }
mkdirSync(out, { recursive: true });
const ALL = ['home', 'setup', 'place', 'buy', 'rival', 'pick', 'pay', 'shophover', 'seathover', 'reckon', 'summary', 'round3', 'buy3', 'results'];
const want = argv.length ? argv : ALL;

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const play = (s, move) => { const next = applyMove(s, move); next.history = [...(s.history || []), [move.player, move.option]]; return next; };
/** Bots play every seat until `ready`; returns the save and the round-start snapshot (so the since-strip has a story). */
function playTo(seed, ready) {
  let s = createGame({ seats: SEATS, seed, ...(TABLE ? { quadrants: TABLE } : {}) });
  s.build = buildStamp(); s.history = [];
  const rand = seededRandom(seed);
  let rs = s, r = s.round;
  for (let n = 0; n < 6000 && !ready(s) && !s.over; n++) { s = play(s, chooseBotMove(s, rand)); if (s.round !== r) { r = s.round; rs = s; } }
  if (!ready(s)) throw new Error(`seed ${seed}: never ready`);
  return {
    save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', ...(TABLE ? { quadrants: TABLE } : {}) }, state: s, undo: null, savedAt: Date.now() },
    roundStart: { seed: s.seed, round: s.round, names: s.players.map(p => p.name).join('|'), state: rs },
  };
}
const mine = (s, kind) => s.pending && s.pending.player === 0 && s.pending.kind === kind;
const placedThisRound = s => Object.values(s.slots).filter(v => v === 0).length;
const SAVES = {
  setup: () => playTo(SEED, s => mine(s, 'setup')),
  place2: () => playTo(SEED, s => s.round === 2 && mine(s, 'place') && placedThisRound(s) >= 1),
  last2: () => playTo(SEED, s => s.round === 2 && mine(s, 'place') && s.players[0].left === 1),
  place3: () => playTo(SEED, s => s.round === 3 && mine(s, 'place') && placedThisRound(s) >= 2),
  last3: () => playTo(SEED, s => s.round === 3 && mine(s, 'place') && s.players[0].left === 1),
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// every state gets a fresh context (empty storage): the app saves the game it's leaving (save-on-leave), so a shared page
// would overwrite the next state's save with the last one's
let ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: x2 ? 2 : 1 });
let page = await ctx.newPage();
async function freshPage() {
  await ctx.close().catch(() => {});
  ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: x2 ? 2 : 1 });
  page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
}
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const url = (extra = '') => `${base}/?intro=0${query ? '&' + query : ''}${extra}`;
async function restyle() {
  if (!strip && !extraCss) return;
  await page.evaluate(({ strip, css }) => {
    if (strip) for (const el of document.querySelectorAll(`style[data-vite-dev-id$="${strip}"]`)) el.remove();
    if (css && !document.getElementById('pod-css')) { const st = document.createElement('style'); st.id = 'pod-css'; st.textContent = css; document.head.appendChild(st); }
  }, { strip, css: extraCss ? readFileSync(extraCss, 'utf8') : '' });
  await page.waitForTimeout(300);
}
const boxes = bool('boxes'), probe = bool('probe');
const shot = async name => {
  await restyle(); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`);
  if (probe) console.log(name, JSON.stringify(await page.evaluate(() => {
    const sec = document.querySelector('.lt > .lt-since'), l = sec && sec.querySelector('.since-list');
    if (!l) return null;
    const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
    return { sec: r(sec), max: getComputedStyle(sec).maxHeight, list: r(l), folded: sec.dataset.folded || 0, card: !!document.querySelector('.lt > .turn-card'), rows: [...l.children].map(e => [...r(e), e.style.visibility || "", e.className]) };
  })));
  if (boxes) console.log(await page.evaluate(() => ['.lt > .lt-shop', '.lt-rates', '.lt-shop-main', '.lt-shop-head', '.lt-shop-body', '.lt-deck', '.lt-shop .lt-card:last-child', '.lt > .lt-prompt'].map(sel => { const e = document.querySelector(sel); if (!e) return `${sel}: none`; const b = e.getBoundingClientRect(); return `${sel} y${Math.round(b.top)}–${Math.round(b.bottom)} x${Math.round(b.left)} w${Math.round(b.width)}`; }).join('\n')));
};
const settle = (ms = 600) => page.waitForTimeout(ms);
async function load(pack, tries = 3) {
  try { await load1(pack); } catch (e) { if (tries <= 1) throw e; await settle(1500); await load(pack, tries - 1); }
}
async function load1(pack) {
  await freshPage();
  // the save goes in before the app's own scripts run (as e2e/v4/lib/seed.mjs does); a dev server accepts a save whose
  // rules shape matches (record.js), so the node-made stamp is fine
  await page.addInitScript(({ save, rs }) => {
    if (sessionStorage.getItem('pod.seeded')) return;
    sessionStorage.setItem('pod.seeded', '1');
    localStorage.setItem('patrons.v4.local', JSON.stringify(save));
    if (rs) localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs));
    localStorage.setItem('patrons.v4.introSeen', '1');
  }, { save: pack.save || pack, rs: pack.roundStart || null });
  await page.goto(url());
  await page.click('[data-home="resume"]', { timeout: 60000 });
  await page.waitForSelector('.lt-shop .card', { timeout: 20000 });
  await restyle();
  await page.mouse.move(4, H - 4); // park the pointer on the table's edge: no stray hover in the shot
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
async function park() { await page.mouse.move(4, H - 4); await settle(200); }
async function passBuy() {
  const p = await page.$('.lt-prompt .pass[data-option]');
  if (p) await p.click().catch(() => {});
  await settle(300);
}

for (const st of want) {
  try {
    if (st === 'home') {
      await freshPage();
      await page.addInitScript(() => localStorage.setItem('patrons.v4.introSeen', '1'));
      await page.goto(url()); await page.waitForSelector('[data-home]', { timeout: 90000 }); await settle(800); await shot('home');
    } else if (st === 'homelast') {
      // home after a finished game: the last game's results are kept (saved.js LAST), no game to resume
      let s = SAVES.last3().save.state;
      const rand = seededRandom(SEED);
      for (let n = 0; n < 4000 && !s.over; n++) s = play(s, chooseBotMove(s, rand));
      await freshPage();
      await page.addInitScript(v => { localStorage.setItem('patrons.v4.introSeen', '1'); localStorage.setItem('patrons.v4.last', JSON.stringify(v)); }, { config: { seats: SEATS }, state: s, finishedAt: Date.now() });
      await page.goto(url()); await page.waitForSelector('[data-home]', { timeout: 90000 }); await settle(800); await shot('homelast');
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
      await load(SAVES.place2()); await placeAndAnswer(); await park(); await settle(500); await shot('buy');
    } else if (st === 'rival') {
      await load(SAVES.place2()); await placeAndAnswer(); await passBuy();
      await page.waitForSelector('.lt[data-bot="1"] .turn-card', { timeout: 8000 }).catch(() => {});
      await settle(250); await shot('rival');
    } else if (st === 'pick') {
      await load(stealSave('help')); await settle(400); await shot('pick');
    } else if (st === 'gift') {
      await load(stealSave('kickback')); await settle(400); await shot('gift');
    } else if (st === 'pay') {
      await load(paySave({ def: 'gold.prospector', res: { gold: 3, red: 2, blue: 2, green: 3 } }));
      await page.waitForSelector('.dialog.pay, .pay', { timeout: 6000 }).catch(() => {}); await settle(400); await shot('pay');
    } else if (st === 'reckon' || st === 'summary') {
      await load(SAVES.last2()); await placeAndAnswer(); await passBuy();
      await page.waitForSelector('.lt[data-phase="reckon"]', { timeout: 30000 });
      if (st === 'reckon') { await settle(2600); await shot('reckon'); }
      else { await page.waitForSelector('.dialog.roundend', { timeout: 40000 }).catch(() => {}); await settle(800); await shot('summary'); }
    } else if (st === 'overlap') {
      // the turn card never covers the story of the turns, through a run of rivals' turns (sampled every 150ms)
      await load(SAVES.place2()); await placeAndAnswer(); await passBuy();
      let worst = 0, n = 0, halfRows = 0;
      for (let k = 0; k < 60; k++) {
        await page.waitForTimeout(150);
        const o = await page.evaluate(() => { const c = document.querySelector('.turn-card'), s = document.querySelector('.lt > .lt-since'); if (!c || !s) return null; const a = c.getBoundingClientRect(), b = s.getBoundingClientRect(); return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * (Math.min(a.right, b.right) > Math.max(a.left, b.left) ? 1 : 0); });
        if (o != null) { n++; if (o > worst) { worst = o; await shot('overlap'); } }
        const half = await page.evaluate(() => { const l = document.querySelector('.lt-since .since-list'); if (!l) return 0; const b = l.getBoundingClientRect(); return [...l.children].filter(r => { const a = r.getBoundingClientRect(); return a.height && (a.top < b.top - 1 || a.bottom > b.bottom + 1); }).length; });
        if (half) { halfRows = Math.max(halfRows, half); await shot('halfrow'); }
      }
      console.log(`overlap: ${n} samples with a turn card, worst overlap ${Math.round(worst)}px, half-cut strip rows ${halfRows}`);
    } else if (st === 'nudge') {
      // the buy step, then a click on an open space: the header's nudge ("You've placed this turn — …") with Pass beside it
      await load(SAVES.place2()); await placeAndAnswer(); await park();
      const sp = await page.$('.lt-wheel .slot.open:not(.taken) .base, .lt-wheel .slot:not(.taken):not(.locked) .base');
      const bb = sp && await sp.boundingBox(); if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await settle(250); await shot('nudge');
      console.log('textclip:', JSON.stringify(await page.evaluate(TEXT_CLIP)));
      console.log(await page.evaluate(() => [...document.querySelectorAll('.lt-prompt .status > *')].map(e => { const r = e.getBoundingClientRect(); return `${e.className.split(' ')[0] || e.tagName}: ${Math.round(r.left)}–${Math.round(r.right)} sw${e.scrollWidth} cw${e.clientWidth} ws:${getComputedStyle(e).whiteSpace}`; }).join('\n') + `\ncell ${Math.round(document.querySelector('.lt-prompt').getBoundingClientRect().right)}`));
    } else if (st === 'members') {
      // your seat full of members, some ready to use (e2e/v4/lib/members-save.mjs)
      const m = membersSave(); await load(m.save ? m : { save: m.save || m, roundStart: m.roundStart }); await shot('members');
      const ready = await page.$('.lt-seat[data-pid="0"] .cs-member[data-state="ready"] .fig');
      if (ready) { const bb = await ready.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await settle(600); await shot('members-hover'); }
    } else if (st === 'buy3') {
      await load(SAVES.place3()); await placeAndAnswer(); await park(); await settle(500); await shot('buy3');
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
