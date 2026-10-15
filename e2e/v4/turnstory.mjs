// E2E: "what just happened" at 1270×700 (RC1 panel items 1–4). A resumed hot-seat game where P1 (the only person)
// ends round I's first pass, so the snake turns round on P1, and P1 holds Midas (on).
//  (t1) the order chips count the snake's double: P1 reads "now ×2" and no other seat reads NEXT;
//  (t2) the "since your last turn" strip lists the rivals' moves (one line per placement, each naming its player),
//       sits in the open, clear of the wheel and the shop, and a line opens that placement's card on hover;
//  (t3) after a placement, the turn card names the space actually taken (the engine's log is the truth);
//  (t4) the snake turnaround reads "Your turn again (snake order)", never "Extra turn";
//  (t5) the second placement gets its own card: its space, and nothing from the first;
//  (t6) the Midas switch shows its state ("Midas: on"), and its hover says what a click does;
//  (t7) the full log opens from the strip in one tap;
//  (t8) a space or member named in the strip, or in the log, opens its card on the board's hover layer (the space card,
//       the member card), beside the name, whole on screen, above the log drawer.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5310.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { snakeSave } from './lib/snake-save.mjs';

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
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
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
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.evaluate(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
  await page.reload();
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
      chips: Object.fromEntries([...document.querySelectorAll('.lt > .lt-seat')].filter(s => s.dataset.pid != null).map(s => { const c = s.querySelector('.cs-order'); return [s.dataset.pid, c ? { order: c.dataset.order, twice: c.dataset.twice === '1', text: c.textContent, title: c.title } : null]; })),
      card: document.querySelector('.turn-card')?.dataset.turnStory || null,
      strip: [...document.querySelectorAll('[data-since] [data-since-line]')].map(e => e.textContent),
      since: r('[data-since]'), wheel: r('.lt-wheel svg.wheel-paper') || r('.lt-wheel'), shop: r('.lt-shop'),
      sw: [...document.querySelectorAll('.lt-seat-0 .cs-switch')].map(e => ({ state: e.dataset.switch, text: e.textContent, title: e.title })),
      took, players: st ? st.players.map(p => p.name) : [],
    };
  });
  const settle = async () => {
    for (let k = 0; k < 12; k++) {
      await page.waitForTimeout(300);
      const c = page.locator('.prompt.choice button:not([disabled]), .pick-key:not([disabled]), .pick-rest-btn:not([disabled])').first();
      if (await c.count()) { await c.evaluate(el => el.click()).catch(() => {}); continue; } // a board pick's list keys may be visually hidden
      const pay = page.locator('.dialog.pay .btn.pri');
      if (await pay.count()) { await pay.click().catch(() => {}); continue; }
      break;
    }
    await page.waitForTimeout(300);
  };
  const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

  let v = await view();
  await page.screenshot({ path: `${SHOTS}/1-resumed.png` });
  // (t1)
  const me = v.chips['0'];
  if (!me || me.order !== 'now' || !me.twice || !/×2/.test(me.text) || !/snake order/.test(me.title)) fail(`P1's chip at the turnaround: ${JSON.stringify(me)}`, 't1');
  const nexts = Object.entries(v.chips).filter(([pid, c]) => pid !== '0' && c && c.order === 'next');
  if (nexts.length) fail(`another seat reads NEXT while P1 places twice: ${JSON.stringify(nexts)}`, 't1');
  // (t2)
  if (v.strip.length < 3) fail(`the strip lists ${v.strip.length} rival moves (want 3: P2, P3 and P4 placed before P1): ${JSON.stringify(v.strip)}`, 't2');
  for (const l of v.strip) if (!/^\s*P[234]\b/.test(l)) fail(`a strip line doesn't start with a rival's name: "${l}"`, 't2');
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
    await page.screenshot({ path: `${SHOTS}/name-${tag}-${kind}.png` });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
  };
  await nameCard('[data-since] [data-hover-name="space"]', 'space', 't8');
  await nameCard('[data-since] [data-hover-name="member"]', 'card', 't8');

  // (t3) the first placement of the double
  await page.locator('.lt-wheel .slot.can').first().click();
  await settle();
  v = await view();
  const first = v.took.at(-1);
  if (!first) fail('the save shows no placement by P1', 't3');
  else if (!v.card || !v.card.startsWith(`You took ${first}`)) fail(`after taking ${first} the turn card reads "${v.card}"`, 't3');
  // (t6) the switch, in the buy step
  const sw = v.sw[0];
  if (!sw || sw.state !== 'on' || sw.text !== 'Midas: on' || !/switch it off/.test(sw.title)) fail(`the Midas switch: ${JSON.stringify(v.sw)}`, 't6');
  await page.screenshot({ path: `${SHOTS}/3-first-placement.png` });
  await page.locator('.pass[data-option]').click();
  await page.waitForTimeout(700);
  v = await view();
  // (t4)
  if (!/^Your turn again \(snake order\)/.test(v.prompt) || /Extra turn/i.test(v.prompt)) fail(`the snake turnaround reads "${v.prompt}"`, 't4');
  if (!v.chips['0'] || v.chips['0'].twice) fail(`P1's chip on the second of two placements: ${JSON.stringify(v.chips['0'])}`, 't4');
  await page.screenshot({ path: `${SHOTS}/4-again.png` });
  // (t5) the second placement: its own card
  await page.locator('.lt-wheel .slot.can').first().click();
  await settle();
  v = await view();
  const second = v.took.at(-1);
  if (!second || second === first) fail(`no second placement in the save (${JSON.stringify(v.took)})`, 't5');
  else if (!v.card || !v.card.startsWith(`You took ${second}`)) fail(`after taking ${second} the turn card reads "${v.card}"`, 't5');
  else if (v.card.includes(first)) fail(`the second placement's card mentions the first space (${first}): "${v.card}"`, 't5');
  await page.screenshot({ path: `${SHOTS}/5-second-placement.png` });
  await page.locator('.pass[data-option]').click().catch(() => {});
  // the rivals play; back on P1 the strip has their moves
  await page.waitForFunction(() => document.querySelector('.lt')?.dataset.yours === '0', null, { timeout: 8000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector('.lt')?.dataset.yours === '1' && document.querySelector('[data-actor]')?.dataset.actor === '0', null, { timeout: 60000 }).catch(() => fail('never came back to P1', 'play'));
  await page.waitForTimeout(500);
  v = await view();
  if (!v.strip.length) fail('back on P1 after the rivals moved, the strip is empty', 't2');
  await page.screenshot({ path: `${SHOTS}/6-back.png` });
  // (t7)
  await page.click('[data-since] [data-open-log]');
  if (!(await page.waitForSelector('.lt-chron', { timeout: 3000 }).catch(() => null))) fail('the strip\'s Log button opened no log', 't7');
  else {
    await page.waitForTimeout(400);
    await nameCard('.lt-chron [data-hover-name="space"]', 'space', 't8-log');
    await nameCard('.lt-chron [data-hover-name="member"]', 'card', 't8-log');
  }
  console.log(`turnstory: chips ${JSON.stringify(me && me.text)}, strip ${v.strip.length} lines, placed ${first} then ${second}`);
  await page.close();
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
const ok = errors.length === 0;
console.log(ok ? 'PASS turnstory' : 'FAIL turnstory');
process.exit(ok ? 0 : 1);
