// A deterministic filmstrip of one move's chain: Playwright's fake clock drives every timer, rAF and performance.now,
// and each Web Animation is seeked to the same virtual time before each screenshot. The box's load can't bend it.
//   node film.mjs <base url> <outdir> [speed=steady] [seed=4] [spaceRegex] [ms=1600] [step=40] [round=2] [after=place|rival]
// after=rival: plays your move instantly (skip), then films the next rival's whole turn. after=buy: films your recruit;
// after=rate: films a follower buy (the 10-for-10 if you can).
import { chromium } from '/home/user/patrons/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove } from '/home/user/patrons/src/engine/v4/index.js';
import { seededRandom } from '/home/user/patrons/src/engine/v4/rng.js';
import { buildStamp } from '/home/user/patrons/e2e/v4/lib/stamp.mjs';

const [base, outdir, speed = 'steady', seedArg = '4', spaceRe = '', msArg = '1600', stepArg = '40', roundArg = '2', mode = 'place'] = process.argv.slice(2);
mkdirSync(outdir, { recursive: true });
const seed = Number(seedArg), wantRound = Number(roundArg), MS = Number(msArg), STEP = Number(stepArg);

function save() {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  const last = st => !process.env.RECKON || !st.queue.some(t => t.t === 'turn'); // RECKON=1: your placement is the round's last
  for (let n = 0; n < 3000 && !(s.round === wantRound && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && last(s)); n++) s = applyMove(s, chooseBotMove(s, rand));
  for (const r of s.resources) s.players[0].res[r] = Math.max(s.players[0].res[r] || 0, 5);
  for (const p of s.players.slice(1)) for (const r of s.resources) p.res[r] = Math.max(p.res[r] || 0, 3);
  return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 } });
const p = await ctx.newPage();
if (process.env.REDUCED) await p.emulateMedia({ reducedMotion: 'reduce' });
await p.addInitScript(() => {
  const list = (window.__fa = []);
  const orig = Element.prototype.animate;
  Element.prototype.animate = function (k, o) {
    const a = orig.call(this, k, o);
    const opt = typeof o === 'number' ? { duration: o } : (o || {});
    list.push({ a, born: performance.now(), total: (opt.delay || 0) + (Number(opt.duration) || 0) * (opt.iterations === Infinity ? 1 : (opt.iterations || 1)), loop: opt.iterations === Infinity });
    return a;
  };
  window.__sync = () => {
    const now = performance.now();
    for (const x of list) {
      if (x.done) continue;
      const t = now - x.born;
      try {
        if (!x.loop && t >= x.total) { x.a.finish(); x.done = true; }
        else { x.a.pause(); x.a.currentTime = x.loop ? t % Math.max(1, x.total) : t; }
      } catch { x.done = true; }
    }
  };
});
await p.clock.install();
await p.goto(`${base}/?intro=0&speed=${speed}`, { timeout: 90000 });
await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save());
await p.reload({ timeout: 90000 });
await (await p.waitForSelector('[data-home="resume"]', { timeout: 90000 })).click();
await p.waitForSelector('.slot.can .base', { timeout: 90000 });
await p.waitForTimeout(1500);
await p.clock.pauseAt(Date.now() + 1000);
await p.clock.runFor(1000);
await p.evaluate(() => window.__sync());

const target = await p.evaluateHandle(src => {
  const all = [...document.querySelectorAll('.slot.can')];
  return (src && all.find(e => new RegExp(src, 'i').test(e.getAttribute('aria-label') || ''))) || all[0];
}, spaceRe);
const label = await target.evaluate(e => e.getAttribute('aria-label'));
const bb = await (await target.asElement().$('.base')).boundingBox();
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await p.clock.runFor(200);
const frames = [];
const answered = [];
const shoot = async (tag, t) => {
  if (process.env.SKIPAT && t === Number(process.env.SKIPAT)) { await p.keyboard.press('Space'); await p.clock.runFor(16); }
  await p.evaluate(() => window.__sync()); const f = `${outdir}/${tag}${String(t).padStart(5, '0')}.png`; await p.screenshot({ path: f }); frames.push(f);
  // ANSWER=1: answer your own choices as they come (the first live option on the board), and note when
  if (process.env.ANSWER) {
    const opt = await p.evaluateHandle(() => document.querySelector('.lt[data-yours="1"][data-phase="choose"]') && ([...document.querySelectorAll('[data-option]:not([disabled])')].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('.menu, .lt-shop, .lt-rates') && !/^pass$|^tier:/.test(e.dataset.option); }) || null));
    if (await opt.evaluate(e => !!e)) { answered.push({ t, option: await opt.evaluate(e => e.dataset.option) }); await opt.asElement().click(); }
  }
};
await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
if (mode === 'rival') {
  // land your chain at once, answer your choices, pass your buy, then film from the next rival's first motion
  for (let k = 0; k < 40; k++) {
    await p.clock.runFor(100);
    const pass = await p.$('.lt[data-yours="1"][data-phase="buy"] [data-option="pass"]');
    if (pass) { await pass.click(); break; }
    const opt = await p.evaluateHandle(() => document.querySelector('.lt[data-yours="1"][data-phase="choose"]') && ([...document.querySelectorAll('[data-option]:not([disabled])')].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('.menu, .lt-shop, .lt-rates') && !/^pass$|^tier:/.test(e.dataset.option); }) || null));
    if (await opt.evaluate(e => !!e)) await opt.asElement().click();
  }
  if (!process.env.RECKON) await p.keyboard.press('Space');
  await p.clock.runFor(50);
}
if (mode === 'buy' || mode === 'rate') {
  // land your placement at once, answer choices, then recruit the first card you can afford (or buy followers)
  for (let k = 0; k < 40; k++) {
    await p.clock.runFor(100);
    if (await p.$('.lt[data-yours="1"][data-phase="buy"]')) break;
    const opt = await p.evaluateHandle(() => document.querySelector('.lt[data-yours="1"][data-phase="choose"]') && ([...document.querySelectorAll('[data-option]:not([disabled])')].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('.menu, .lt-shop, .lt-rates') && !/^pass$|^tier:/.test(e.dataset.option); }) || null));
    if (await opt.evaluate(e => !!e)) await opt.asElement().click();
  }
  await p.keyboard.press('Space');
  await p.clock.runFor(300);
  const pick = mode === 'rate' ? await p.$('[data-option^="tier:"]:has-text("10")') || await p.$('[data-option^="tier:"]') : await p.$('.lt-shop .card.can[data-option]');
  await pick.click();
  for (let k = 0; k < 10; k++) {
    await p.clock.runFor(60);
    const btn = (await p.$('.dialog.pay .btn.pri[data-option]')) || (await p.$('button.btn.pri:has-text("Pay")')) || (await p.$('button:has-text("Pay ")'));
    if (btn) { await btn.click(); break; }
    if (!(await p.$('.lt[data-yours="1"][data-phase="pay"]'))) break;
  }
}
for (let t = 0; t <= MS; t += STEP) { await shoot(mode === 'rival' ? 'r' : mode === 'buy' ? 'b' : mode === 'rate' ? 'q' : 'f', t); await p.clock.runFor(STEP); }
writeFileSync(`${outdir}/meta.json`, JSON.stringify({ label, speed, seed, step: STEP, frames: frames.length, mode, answered }, null, 1));
console.log('space:', label, 'frames:', frames.length);
await ctx.close();
await b.close();
