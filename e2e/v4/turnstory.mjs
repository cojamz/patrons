import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E: "what just happened" at 1270×700 (RC1 panel items 1–4). A resumed hot-seat game where P1 (the only person)
// ends round I's first pass, so the snake turns round on P1, and P1 holds Midas (on).
//  (t1) the seats' turn words count the snake's double (Cory, 2026-10-16: the rail is gone, the seats say the turns):
//       P1's seat reads "two turns in a row" and no other seat reads "next" (the explanation, naming the snake
//       order, is its hover card's label, not a native title);
//  (t2) the "since your last turn" strip accounts for the rivals' moves (one line per placement, each naming its player,
//       or folded into "N earlier" when the turn card takes the room; whole lines only),
//       sits in the open, clear of the wheel and the shop, and a line opens that placement's card on hover;
//       whole lines only is watched every frame of the run: no line (or the "N earlier" line) may show in part, cut by
//       the strip's top or foot, for 3 frames running (a fold lands within a frame; a sliver that stays is the bug);
//  (t2b) the same on a full strip over a tall pinned card: a ring-II resume on a table of long, two-line stories
//       (silver, trading, thieves, red), at 1270×700 and 1100×700, with the turn card up under the strip;
//  (t3) after a placement, the turn card names the space actually taken (the engine's log is the truth);
//  (t4) the snake turnaround reads "Your turn again (snake order)", never "Extra turn";
//  (t5) the second placement gets its own card: its space, and nothing from the first;
//  (t6) the Midas switch shows its state (on), and its hover says so and what a click does (its label: since blind
//       panel 1 the seat's switch opens a hover card instead of a native title, and the label is that card's label);
//  (t7) the full log opens from the strip in one tap;
//  (t8) a space or member named in the strip, or in the log, opens its card on the board's hover layer (the space card,
//       the member card), beside the name, whole on screen, above the log drawer.
//  (t9) Cory, 2026-10-16: "pass is hard to find" and "the turn-order rail is confusing". In your buy step a "Done, no
//       buy" button stands in the shop column directly under the shop's grid of buys (follower buys and members, one
//       grid since v0.8.2), visible and enabled, and it's the one
//       way to pass on a laptop (no second Pass in the headline); the rail is gone (nothing drawn in the chairs' gutter);
//       during a rival's turn no rival seat reads anything (Cory, 2026-10-15: "next" dropped), and
//       your seat reads "your turn next" / "your turn in N", N the turns before yours in the engine's queue.
//  (t10) wave-2 testers A#3, B#46: what you got on a rival's turn (Silversmith, "everyone else +1") is on the strip's
//       line for that turn, naming each member that paid it.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5310.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { snakeSave } from './lib/snake-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { stripSave, giftSave } from './lib/strip-save.mjs';
import { defById } from '../../src/engine/v4/index.js';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/turnstory';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5310;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const fail = (msg, tag) => errors.push(`[${tag}] ${msg}`);
const browser = await launchBrowser({ executablePath: browserPath });
// (t2) whole lines, every frame: a line of the strip (a story or the "N earlier" line) that is drawn and cut by the
// list's top or foot is a part-line; the longest run of frames one stays is kept, with what it was
async function watchStrip(page) {
  await page.addInitScript(() => {
    const W = window.__strip = { run: 0, worst: 0, what: '', frames: 0, cardFrames: 0, foldFrames: 0 };
    const tick = () => {
      const l = document.querySelector('[data-since] .since-list');
      let part = null;
      if (l) {
        W.frames++;
        if (document.querySelector('.lt > .turn-card')) W.cardFrames++;
        if (l.querySelector('.since-more')) W.foldFrames++;
        const b = l.getBoundingClientRect();
        for (const x of l.children) {
          const a = x.getBoundingClientRect();
          if (!a.height || getComputedStyle(x).visibility === 'hidden') continue;
          if (a.top < b.top - 1 || a.bottom > b.bottom + 1) { part = `"${x.textContent.slice(0, 50)}" at ${Math.round(a.top)}–${Math.round(a.bottom)}, list ${Math.round(b.top)}–${Math.round(b.bottom)}, ${innerWidth}px${document.querySelector('.lt > .turn-card') ? ', card up' : ''}`; break; }
        }
      }
      W.run = part ? W.run + 1 : 0;
      if (W.run > W.worst) { W.worst = W.run; W.what = part; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
const stripFrames = (page, tag) => page.evaluate(() => window.__strip).then(W => {
  if (W && W.worst >= 3) fail(`a strip line showed only in part for ${W.worst} frames running: ${W.what}`, tag);
  return W;
}).catch(() => null);
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  await watchStrip(page);
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const { save, roundStart } = snakeSave();
  // the build's own stamp (a new game's), so the hand-made save resumes in this build
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
  const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
  save.state.build = stamp; roundStart.state.build = stamp;
  // the save goes in before the app's own scripts run (a running game saves itself as its page goes, which would
  // write over a save put in from the page), once: later reloads keep whatever the game has become
  await seedSave(page, save, { roundStart }); // before the app runs, once per tab (lib/seed.mjs)
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot.can');
  await page.waitForTimeout(600);
  const view = () => page.evaluate(() => {
    let st = null;
    try { st = JSON.parse(localStorage.getItem('patrons.v4.local')).state; } catch { /* none */ }
    const took = st ? st.log.filter(l => /^P1 took .+ \(\w+\)\.$/.test(l)).map(l => l.match(/^P1 took (.+) \(\w+\)\.$/)[1]) : [];
    const r = sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom }; };
    return {
      prompt: document.querySelector('[data-prompt]')?.innerText || '',
      chips: Object.fromEntries([...document.querySelectorAll('.lt > .lt-seat')].filter(s => s.dataset.pid != null).map(s => { const c = s.querySelector('.cs-turn'); return [s.dataset.pid, c ? { order: c.dataset.turn, text: c.textContent, title: c.title || c.getAttribute('aria-label') || '' } : null]; })),
      card: document.querySelector('.turn-card')?.dataset.turnStory || null,
      cardBox: r('.turn-card'),
      strip: [...document.querySelectorAll('[data-since] [data-since-line]')].map(e => e.textContent),
      // moves the strip folded into "N earlier… open the log" (whole lines only: it folds the oldest rather than show half
      // a line, design pod 08:50), and any line it shows only in part
      folded: Number((document.querySelector('[data-since] .since-more')?.textContent.match(/\d+/) || [0])[0]),
      partial: (() => { const l = document.querySelector('[data-since] .since-list'); if (!l) return 0; const b = l.getBoundingClientRect(); return [...l.children].filter(x => { const a = x.getBoundingClientRect(); return a.height && (a.top < b.top - 1 || a.bottom > b.bottom + 1); }).length; })(),
      since: r('[data-since]'), wheel: r('.lt-wheel svg.wheel-paper') || r('.lt-wheel'), shop: r('.lt-shop'),
      sw: [...document.querySelectorAll('.lt-seat-0 [data-switch]')].map(e => ({ state: e.dataset.switch, text: e.textContent.trim(), title: e.getAttribute('aria-label') || e.title })),
      took, players: st ? st.players.map(p => p.name) : [],
    };
  });
  const cardNow = () => page.evaluate(() => document.querySelector('.turn-card')?.dataset.turnStory || null);
  // `before`: the turn card's text before the placement. The card arrives as the turn's closing beat (about 1s after
  // a placement, under the motion choreography), so settle waits for it to change, up to 3s, rather than a fixed delay.
  const settle = async (before = undefined) => {
    // answer what the placement asks (a choice, a board pick, a payment) until the buy step, or the turn moves on
    for (let k = 0; k < 40; k++) {
      await page.waitForTimeout(250);
      const ph = await page.evaluate(() => { const l = document.querySelector('.lt'); return l ? `${l.dataset.phase}:${l.dataset.yours}` : ''; });
      if (ph === 'buy:1' || ph.endsWith(':0')) break;
      // a choice: its first answer, wherever the table offers it (a list, a key, a seat on the board)
      if (ph.startsWith('choose')) { await page.evaluate(() => { const o = [...document.querySelectorAll('[data-option]')].find(e => !/^(slot|squat|use|toggle):/.test(e.dataset.option) && !e.disabled && e.getAttribute('aria-disabled') !== 'true'); if (o) o.click(); }); continue; }
      const pay = page.locator('.dialog.pay .btn.pri');
      if (ph.startsWith('pay') && await pay.count()) { await pay.click().catch(() => {}); continue; }
    }
    if (before !== undefined) await page.waitForFunction(b => { const t = document.querySelector('.turn-card')?.dataset.turnStory || null; return !!t && t !== b; }, before, { timeout: 3000 }).catch(() => {});
    else await page.waitForTimeout(300);
  };
  const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

  let v = await view();
  await page.screenshot({ path: `${SHOTS}/1-resumed.png` });
  // (t1)
  const me = v.chips['0'];
  // your seat says "again" (w3b #42: "twice" alone took a decode), its hover the snake order
  if (!me || me.order !== 'now' || me.text !== 'two turns in a row' || !/snake order/.test(me.title)) fail(`P1's turn words at the turnaround: ${JSON.stringify(me)}`, 't1');
  const nexts = Object.entries(v.chips).filter(([pid, c]) => pid !== '0' && c && c.order === 'next');
  if (nexts.length) fail(`another seat reads "next" while P1 places twice: ${JSON.stringify(nexts)}`, 't1');
  // (t2)
  // every rival move since yours is accounted for: on a line, or folded into "N earlier" when the turn card takes the room
  if (v.strip.length + v.folded < 3) fail(`the strip accounts for ${v.strip.length} rival moves + ${v.folded} folded (want 3: P2, P3 and P4 placed before P1): ${JSON.stringify(v.strip)}`, 't2');
  if (v.strip.length < 1) fail('the strip shows no rival move at all', 't2');
  if (v.partial) fail(`the strip shows ${v.partial} line(s) only in part (it should fold whole lines)`, 't2');
  for (const l of v.strip) if (!/^\s*P[234]\b/.test(l)) fail(`a strip line doesn't start with a rival's name: "${l}"`, 't2');
  const words = await page.evaluate(() => [...document.querySelectorAll('[data-since] .since-row')].map(r => !!r.querySelector('.sp-words')));
  if (words.some(w => !w)) fail(`a strip line names its space without the space's board words: ${JSON.stringify(words)}`, 't2');
  if (!v.since) fail('no "since your last turn" strip on the board', 't2');
  else {
    if (overlap(v.since, v.wheel)) fail(`the strip overlaps the wheel: ${JSON.stringify(v.since)} vs ${JSON.stringify(v.wheel)}`, 't2');
    if (overlap(v.since, v.shop)) fail(`the strip overlaps the shop: ${JSON.stringify(v.since)} vs ${JSON.stringify(v.shop)}`, 't2');
    if (v.since.x < 0 || v.since.r > 1270 || v.since.y < 0 || v.since.b > 700) fail(`the strip runs off the screen: ${JSON.stringify(v.since)}`, 't2');
  }
  const line = page.locator('[data-since-line]').first();
  if (await line.count()) {
    await line.hover();
    const card = await page.waitForSelector('[data-since-card]', { timeout: 2000 }).catch(() => null);
    if (!card) fail('hovering a strip line opens no card', 't2');
    else if (!/ took | joined /.test(await card.innerText())) fail(`the strip's card names no space: "${await card.innerText()}"`, 't2');
    await page.screenshot({ path: `${SHOTS}/2-strip-card.png` });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
  }
  // (t8) names in the strip open their cards
  const nameCard = async (sel, kind, tag) => {
    const n = page.locator(sel).first();
    await n.waitFor({ timeout: 3000 }).catch(() => {});
    if (!(await n.count())) { fail(`no ${kind} name to hover (${sel})`, tag); return; }
    await n.hover();
    const ok = await page.waitForFunction(k => { const c = document.querySelector(`[data-hover-layer][data-open="1"] [data-hover-card="${k}"]`); return !!c && c.getBoundingClientRect().width > 0; }, kind, { timeout: 2500 }).catch(() => null);
    if (!ok) { fail(`hovering the ${kind} name "${await n.innerText()}" opened no ${kind} card`, tag); return; }
    const r = await page.evaluate(([s2]) => {
      const L = document.querySelector('[data-hover-layer]'), b = L.getBoundingClientRect(), a = document.querySelector(s2).getBoundingClientRect();
      const back = document.querySelector('.lt-drawer-back');
      return { on: b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight, near: Math.hypot((b.left + b.right) / 2 - (a.left + a.right) / 2, (b.top + b.bottom) / 2 - (a.top + a.bottom) / 2), z: Number(getComputedStyle(L).zIndex) || 0, under: back ? Number(getComputedStyle(back).zIndex) || 0 : -1 };
    }, [sel]);
    if (!r.on) fail(`the ${kind} card from the name runs off the screen`, tag);
    if (r.near > 420) fail(`the ${kind} card opened ${Math.round(r.near)}px from its name`, tag);
    if (r.under >= 0 && r.z <= r.under) fail(`the ${kind} card (z ${r.z}) sits under the log drawer (z ${r.under})`, tag);
    // a space named off the wheel lights where it is on the wheel while it's pointed at
    if (kind === 'space' && !(await page.evaluate(([s2]) => { const k = document.querySelector(s2).dataset.nameTarget; return !!document.querySelector(`[data-slot="${k}"].hn-locate`); }, [sel]))) fail(`hovering the space name lit nothing on the wheel`, tag);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${SHOTS}/name-${tag}-${kind}.png` });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
  };
  await nameCard('[data-since] [data-hover-name="space"]', 'space', 't8');
  await nameCard('[data-since] [data-hover-name="member"]', 'card', 't8');
  // (t7) the log, one tap from the strip; (t8) its names open their cards too, above the drawer
  await page.click('[data-since] [data-open-log]');
  if (!(await page.waitForSelector('.lt-chron', { timeout: 3000 }).catch(() => null))) fail('the strip\'s Log button opened no log', 't7');
  else {
    await page.waitForTimeout(400);
    await nameCard('.lt-chron [data-hover-name="space"]', 'space', 't8-log');
    await nameCard('.lt-chron [data-hover-name="member"]', 'card', 't8-log');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.lt-chron', { state: 'detached', timeout: 3000 }).catch(() => fail('the log did not close on Escape', 't7'));
  }

  // (t3) the first placement of the double
  { const before = await cardNow(); await page.locator('.lt-wheel .slot.can').first().click(); await settle(before); }
  v = await view();
  const first = v.took.at(-1);
  if (!first) fail('the save shows no placement by P1', 't3');
  else if (!v.card || !v.card.startsWith(`You took ${first}`)) fail(`after taking ${first} the turn card reads "${v.card}"`, 't3');
  if (v.cardBox && (v.cardBox.b > 700 || v.cardBox.y < 0)) fail(`the turn card runs off the screen: ${JSON.stringify(v.cardBox)}`, 't3');
  // (t6) the switch, in the buy step
  const sw = v.sw[0];
  if (!sw || sw.state !== 'on' || !/\bon$/.test(sw.text) || !/Midas is on/.test(sw.title) || !/switch it off/.test(sw.title)) fail(`the Midas switch: ${JSON.stringify(v.sw)}`, 't6');
  await page.screenshot({ path: `${SHOTS}/3-first-placement.png` });
  // (t9) "Done, no recruit" under the follower buys, in your buy step
  {
    const d = await page.evaluate(() => {
      const l = document.querySelector('.lt'), btn = document.querySelector('.lt-shop .lt-rates [data-option="pass"]');
      // the follower buys are cards in the one shop grid since v0.8.2 (Cory, 2026-10-19), so "under the buys" is under
      // that grid: the follower buys head it and the members follow
      const grid = document.querySelector('.lt-shop .lt-cards'), shop = document.querySelector('.lt-shop');
      const vis = e => { if (!e) return false; const c = getComputedStyle(e); const b = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.5 && b.width > 0 && b.height > 0; };
      const r = e => (e ? e.getBoundingClientRect().toJSON() : null);
      return { phase: `${l?.dataset.phase}:${l?.dataset.yours}`, vis: vis(btn), text: btn?.textContent.trim() || null, disabled: !!btn?.disabled, btn: r(btn), grid: r(grid), shop: r(shop),
        others: [...document.querySelectorAll('[data-option="pass"]')].filter(e => e !== btn && vis(e)).length,
        rail: [...document.querySelectorAll('.lt > .lt-snake *, .lt > .lt-seat .cs-order')].filter(vis).length };
    });
    if (d.phase !== 'buy:1') fail(`(t9) expected your buy step after the first placement, the table is at ${d.phase}`, 't9');
    else {
      if (!d.vis || d.disabled || d.text !== 'Done, no recruit') fail(`(t9) no visible, enabled "Done, no recruit" in the shop column in your buy step: ${JSON.stringify(d)}`, 't9');
      else {
        const under = d.btn.top >= d.grid.bottom - 1 && d.btn.top - d.grid.bottom <= 16 && d.btn.left >= d.grid.left - 1 && d.btn.right <= d.grid.right + 1;
        if (!under) fail(`(t9) "Done, no recruit" isn't directly under the shop's buys: button ${JSON.stringify(d.btn)}, buys ${JSON.stringify(d.grid)}`, 't9');
        if (d.btn.bottom > 700 || d.btn.left < d.shop.left - 1 || d.btn.right > d.shop.right + 1) fail(`(t9) "Done, no recruit" sits outside the shop column or off screen: ${JSON.stringify(d.btn)} in ${JSON.stringify(d.shop)}`, 't9');
      }
      if (d.others) fail(`(t9) ${d.others} other pass button(s) on screen beside the shop's "Done, no recruit"`, 't9');
    }
    if (d.rail) fail(`(t9) the turn-order rail still draws ${d.rail} thing(s)`, 't9');
    // (t9b) Cory, 2026-10-15: a follower buy's hover never covers "Done, no recruit"
    for (const key of ['small', 'mid', 'big', 'top']) {
      const rate = page.locator(`.lt-shop .lt-rate[data-rate="${key}"]`);
      if (!(await rate.count())) continue;
      await rate.hover(); await page.waitForTimeout(450);
      const hit = await page.evaluate(() => {
        const b = document.querySelector('.lt-shop .lt-rates .lt-done')?.getBoundingClientRect(), c = document.querySelector('.popover')?.getBoundingClientRect();
        return b && c && c.width > 0 && !(c.right <= b.left || c.left >= b.right || c.bottom <= b.top || c.top >= b.bottom) ? { b: b.toJSON(), c: c.toJSON() } : null;
      });
      if (hit) fail(`(t9b) the ${key} follower buy's hover covers "Done, no recruit": ${JSON.stringify(hit)}`, 't9');
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(250);
  }
  await page.locator('.lt-shop [data-option="pass"]').click();
  await page.waitForTimeout(700);
  // (t9c) Cory, 2026-10-15: "Done, no recruit" is there only in the buy step
  {
    const shown = await page.evaluate(() => { const e = document.querySelector('.lt-shop .lt-rates .lt-done'); const l = document.querySelector('.lt'); return { phase: l?.dataset.phase, vis: !!e && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' }; });
    if (shown.phase !== 'buy' && shown.vis) fail(`(t9c) "Done, no recruit" shows outside the buy step (${shown.phase})`, 't9');
  }
  v = await view();
  // (t4)
  if (!/^Your turn again \(snake order\)/.test(v.prompt) || /Extra turn/i.test(v.prompt)) fail(`the snake turnaround reads "${v.prompt}"`, 't4');
  if (!v.chips['0'] || v.chips['0'].text !== 'your turn') fail(`P1's turn words on the second of two placements: ${JSON.stringify(v.chips['0'])}`, 't4');
  await page.screenshot({ path: `${SHOTS}/4-again.png` });
  // (t5) the second placement: its own card
  { const before = await cardNow(); await page.locator('.lt-wheel .slot.can').first().click(); await settle(before); }
  v = await view();
  const second = v.took.at(-1);
  if (!second || second === first) fail(`no second placement in the save (${JSON.stringify(v.took)})`, 't5');
  else if (!v.card || !v.card.startsWith(`You took ${second}`)) fail(`after taking ${second} the turn card reads "${v.card}"`, 't5');
  else if (v.card.includes(first)) fail(`the second placement's card mentions the first space (${first}): "${v.card}"`, 't5');
  await page.screenshot({ path: `${SHOTS}/5-second-placement.png` });
  await page.locator('.lt-shop [data-option="pass"]').click().catch(() => {});
  // the rivals play; back on P1 the strip has their moves
  await page.waitForFunction(() => document.querySelector('.lt')?.dataset.yours === '0', null, { timeout: 8000 }).catch(() => {});
  // (t9) during a rival's turn: no rival seat says anything (Cory dropped "next"), "your turn in N" on yours (read when the
  // screen has caught up with the save: the chain may still be telling the last move)
  {
    let t9 = null, ok = false;
    for (let k = 0; k < 40 && !ok; k++) {
      t9 = await page.evaluate(() => {
        let st = null;
        try { st = JSON.parse(localStorage.getItem('patrons.v4.local')).state; } catch { /* none */ }
        const l = document.querySelector('.lt');
        const words = Object.fromEntries([...document.querySelectorAll('.lt > .lt-seat[data-pid]')].map(s => { const c = s.querySelector('.cs-turn'); return [s.dataset.pid, c && getComputedStyle(c).visibility !== 'hidden' ? c.textContent.trim() : null]; }));
        const ahead = st ? [...(st.current != null ? [st.current] : []), ...st.queue.filter(t => t.t === 'turn').map(t => t.p)] : [];
        return { caught: !!st && Number(l?.dataset.moves) === st.moves && l?.dataset.phase !== 'reckon', yours: l?.dataset.yours, current: st ? st.current : null, ahead, words };
      });
      ok = t9.caught && t9.yours === '0' && t9.current != null && t9.current !== 0;
      if (!ok) await page.waitForTimeout(150);
    }
    if (!ok) fail(`(t9) never caught a rival's turn with the screen caught up: ${JSON.stringify(t9)}`, 't9');
    else {
      const k = t9.ahead.indexOf(0);
      const wantMine = k < 0 ? 'done this round' : k === 1 ? 'your turn next' : `your turn in ${k}`;
      if (t9.words['0'] !== wantMine) fail(`(t9) your seat reads ${JSON.stringify(t9.words['0'])} during a rival's turn (want "${wantMine}"; queue ${JSON.stringify(t9.ahead)})`, 't9');
      for (const [pid, w] of Object.entries(t9.words)) {
        if (pid === '0') continue;
        if (w !== null) fail(`(t9) P${Number(pid) + 1}'s seat reads ${JSON.stringify(w)} (want nothing: Cory dropped "next"; queue ${JSON.stringify(t9.ahead)})`, 't9');
      }
      await page.screenshot({ path: `${SHOTS}/5b-rival-turn.png` });
    }
  }
  await page.waitForFunction(() => document.querySelector('.lt')?.dataset.yours === '1' && document.querySelector('[data-actor]')?.dataset.actor === '0', null, { timeout: 150000 }).catch(() => fail('never came back to P1', 'play'));
  await page.waitForTimeout(500);
  v = await view();
  if (!v.strip.length) fail('back on P1 after the rivals moved, the strip is empty', 't2');
  await page.screenshot({ path: `${SHOTS}/6-back.png` });
  const W = await stripFrames(page, 't2');
  console.log(`turnstory: chips ${JSON.stringify(me && me.text)}, strip ${v.strip.length} lines, placed ${first} then ${second}; strip watched ${W ? W.frames : 0} frames (${W ? W.cardFrames : 0} with a card up, ${W ? W.foldFrames : 0} folded)`);
  await page.close();
  // (t2b) a full strip over a tall pinned card, at two laptop widths
  const full = stripSave();
  full.save.state.build = stamp; full.roundStart.state.build = stamp;
  for (const width of [1270, 1100]) {
    const tag = `t2b ${width}`;
    const p2 = await browser.newPage({ viewport: { width, height: 700 } });
    p2.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
    await watchStrip(p2);
    await seedSave(p2, full.save, { roundStart: full.roundStart });
    await p2.goto(`${base}/?botDelay=300&intro=0`);
    await p2.click('[data-home="resume"]', { timeout: 30000 });
    await p2.waitForSelector('.lt-wheel .slot.can');
    // the resumed turn's card comes up under the strip; then the strip has settled with it
    if (!(await p2.waitForSelector('.lt > .turn-card', { timeout: 6000 }).catch(() => null))) fail('no turn card came up on the resumed round-II turn', tag);
    await p2.waitForTimeout(800);
    const s2 = await p2.evaluate(() => {
      const l = document.querySelector('[data-since] .since-list'), card = document.querySelector('.lt > .turn-card');
      if (!l) return null;
      const b = l.getBoundingClientRect();
      return { lines: l.querySelectorAll('[data-since-line]').length, folded: Number((l.querySelector('.since-more')?.textContent.match(/\d+/) || [0])[0]),
        part: [...l.children].filter(x => { const a = x.getBoundingClientRect(); return a.height && getComputedStyle(x).visibility !== 'hidden' && (a.top < b.top - 1 || a.bottom > b.bottom + 1); }).map(x => x.textContent.slice(0, 50)),
        cover: card ? Math.max(0, b.bottom - card.getBoundingClientRect().top) : 0 };
    });
    await p2.screenshot({ path: `${SHOTS}/7-full-strip-${width}.png` });
    if (!s2) fail('the resumed round-II turn shows no strip', tag);
    else {
      if (s2.part.length) fail(`with the turn card up, the strip shows ${s2.part.length} line(s) only in part: ${JSON.stringify(s2.part)}`, tag);
      if (s2.lines < 1) fail('the full strip shows no whole line at all', tag);
      if (s2.cover > 1) fail(`the turn card covers the strip's foot by ${Math.round(s2.cover)}px`, tag);
      if (!s2.folded) console.log(`turnstory ${tag}: note, the strip fit without folding (${s2.lines} lines), so the fold went unexercised here`);
    }
    const W2 = await stripFrames(p2, tag);
    console.log(`turnstory ${tag}: ${s2 ? s2.lines : 0} whole lines + ${s2 ? s2.folded : 0} folded with the card up; strip watched ${W2 ? W2.frames : 0} frames, longest part-line run ${W2 ? W2.worst : '?'}`);
    await p2.close();
  }
  // (t10) what you got on a rival's turn is named, with its cause (wave-2 testers A#3, B#46: "my silver went 3→9
  // between turns with no 'you +N' line in the strip"): P1 holds Silversmith on a Silver table; the newest rival turn
  // paid P1. The strip's newest line says "you +N" (each amount beside its dot) and names each member that paid it.
  {
    const tag = 't10';
    const g = giftSave({ newest: true });
    g.save.state.build = stamp; g.roundStart.state.build = stamp;
    const p3 = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    p3.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
    await seedSave(p3, g.save, { roundStart: g.roundStart });
    await p3.goto(`${base}/?botDelay=300&intro=0`);
    await p3.click('[data-home="resume"]', { timeout: 30000 });
    await p3.waitForSelector('.lt-wheel .slot.can');
    await p3.waitForTimeout(800);
    const line = await p3.$$eval('[data-since] .since-row', els => (els.length ? els[els.length - 1].textContent.replace(/\s+/g, ' ').trim() : ''));
    // and it is in sight: on the strip's newest line, or (when the turn card takes the strip's room) on the card
    // (the card's text is its data-turn-story: its amounts draw as dots; it shows its first four lines)
    const seen = await p3.evaluate(() => [...document.querySelectorAll('[data-since] .since-row, .turn-card')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && r.height && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden' && r.top >= 0 && r.bottom <= innerHeight;
    }).map(e => (e.dataset.turnStory ? e.dataset.turnStory.split(' · ').slice(0, 5).join(' · ') : e.textContent.replace(/\s+/g, ' ').trim())).filter(t => /\byou \+\d/.test(t)));
    if (!seen.length) fail('what you got shows nowhere in sight (strip line or turn card)', tag);
    const want = Object.entries(g.newest.res).map(([r, n]) => `+${n} ${r}`);
    const names = g.newest.members.map(d => defById(d).name);
    if (!/\byou \+\d/.test(line)) fail(`the strip's newest line never says what you got: "${line}"`, tag);
    for (const n of names) if (!line.includes(n)) fail(`the strip's newest line doesn't name ${n}, which paid you: "${line}"`, tag);
    await p3.mouse.move(640, 695);
    await p3.screenshot({ path: `${SHOTS}/10-gift-line.png` });
    console.log(`turnstory ${tag}: in sight "${seen[0] || ''}"; newest line "${line}" (want ${want.join(' ')} from ${names.join(', ') || 'the space'})`);
    await p3.close();
  }
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
const ok = errors.length === 0;
console.log(ok ? 'PASS turnstory' : 'FAIL turnstory');
process.exit(ok ? 0 : 1);
