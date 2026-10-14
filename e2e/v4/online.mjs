// E2E: a 3-person online game, with the things friends actually do.
//   Hana hosts on a laptop. Gus joins by typing the code. Pia opens the invite link (a phone, when contexts allow).
//   Mid-game: Gus reloads; Pia closes her tab, so Hana gets "Pia left — let a bot play for them" and taps it; Pia
//   reopens the link and has her seat back; Hana reloads, so the host role moves to Gus and back she comes as a guest.
//   Everyone clicks the first legal option on their turn, through to final results, and all three must agree.
// Transport: BroadcastChannel tabs of one browser (default, the gate), or a Firebase RTDB emulator with V4_RTDB=host:port
// (separate browser contexts, so each person has their own storage; Pia is an iPhone 13). Fails on any console error.
// Server: $V4_URL if set, else starts `npx vite --port 5181` itself.
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '';
mkdirSync(SHOTS, { recursive: true });
const RTDB = process.env.V4_RTDB || '';
const tag = RTDB ? 'firebase-emulator' : 'broadcast';
let server = null;
let base = process.env.V4_URL;
if (!base) {
  base = 'http://localhost:5181';
  server = spawn('npx', ['vite', '--port', '5181', '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const log = (...a) => console.log(`[online ${tag}]`, ...a);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const laptop = { viewport: { width: 1270, height: 700 } };
// BroadcastChannel/IndexedDB only reach tabs of one context; over Firebase every person gets their own context
const shared = RTDB ? null : await browser.newContext(laptop);
const ctxFor = async opts => shared || browser.newContext(opts);
const ctxs = { hana: await ctxFor(laptop), gus: await ctxFor(laptop), pia: await ctxFor(RTDB ? { ...devices['iPhone 13'] } : laptop) };
const watch = (page, who) => {
  page.on('console', m => { if (m.type() === 'error') errors.push(`${who} console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${who} pageerror: ${e.message}`));
  if (process.env.V4_DEBUG) {
    page.on('console', m => console.log(`  ${who} ${m.type()}: ${m.text().slice(0, 300)}`));
    page.on('framenavigated', f => { if (f === page.mainFrame()) console.log(`  ${who} nav ${f.url()}`); });
  }
  return page;
};
const params = `${RTDB ? `rtdb=${RTDB}` : 'transport=broadcast'}&botDelay=30&subAfter=1500&intro=0`; // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
const url = `${base}/?${params}`;
const pages = { hana: watch(await ctxs.hana.newPage(), 'hana'), gus: watch(await ctxs.gus.newPage(), 'gus'), pia: null };

async function stepFirstOption(page) {
  if (!page || page.isClosed()) return false;
  const next = await page.$('[data-next-round]');
  if (next) { await next.click().catch(() => {}); return true; }
  // touch (and online) placement asks to confirm: "Place here"
  const place = await page.$('[data-place]');
  if (place) { try { await place.click({ timeout: 1500 }); return true; } catch { /* fall through */ } }
  const els = await page.$$('[data-option]:not([disabled])');
  for (const el of els) {
    const id = await el.getAttribute('data-option').catch(() => null);
    if (!id || id.startsWith('toggle:') || id === 'back') continue;
    try { await el.click({ timeout: 1500 }); return true; } catch { /* try the next */ }
  }
  return false;
}
const moves = page => page.evaluate(() => { try { return JSON.parse(window.patronsRecord()).moves?.length ?? 0; } catch { return 0; } }).catch(() => 0);
// plays every open page until `done()` (or the results), at most `ms`
async function playUntil(done, ms, what) {
  const t0 = Date.now();
  while (!(await done())) {
    if (Date.now() - t0 > ms) throw new Error(`timed out playing until ${what}`);
    let any = false;
    for (const p of Object.values(pages)) any = (await stepFirstOption(p)) || any;
    if (!any) await pages.hana.waitForTimeout(40);
  }
}
const atResults = async () => {
  for (const p of Object.values(pages)) if (!p || p.isClosed() || !(await p.$('.results'))) return false;
  return true;
};
const seatOf = async page => page.evaluate(() => { const r = JSON.parse(window.patronsRecord() || '{}'); return r.seats?.length ?? 0; }).catch(() => 0);

let ok = false;
try {
  // Hana hosts
  await pages.hana.goto(url);
  await pages.hana.fill('input[placeholder="Name"]', 'Hana');
  await pages.hana.click('text=Host online game');
  await pages.hana.waitForSelector('.code');
  const code = (await pages.hana.$eval('.code', e => e.firstChild.textContent)).trim();
  const invite = await pages.hana.$eval('[data-invite]', e => e.value);
  if (!invite.includes(`join=${code}`) || !invite.includes(RTDB ? 'rtdb=' : 'transport=broadcast')) throw new Error(`bad invite link: ${invite}`);
  log('room', code, invite);

  // Gus types the code
  await pages.gus.goto(url);
  await pages.gus.fill('input[placeholder="Name"]', 'Gus');
  await pages.gus.fill('input[aria-label="Room code"]', code);
  await pages.gus.click('text=Join with code');
  await pages.gus.waitForSelector('.code');

  // Pia opens the invite link: the code is already filled in
  pages.pia = watch(await ctxs.pia.newPage(), 'pia');
  await pages.pia.goto(`${invite}&intro=0`);
  await pages.pia.waitForSelector('input[aria-label="Room code"]');
  const filled = await pages.pia.$eval('input[aria-label="Room code"]', e => e.value);
  if (filled !== code) throw new Error(`invite link didn't fill the code: "${filled}"`);
  await pages.pia.fill('input[placeholder="Name"]', 'Pia');
  await pages.pia.click('text=Join with code');
  await pages.pia.waitForSelector('.code');

  await pages.hana.waitForFunction(() => document.querySelectorAll('.seats li').length === 3 && document.querySelectorAll('.seats [data-presence="here"]').length === 3, null, { timeout: 15000 });
  await pages.hana.screenshot({ path: `${SHOTS}/online-lobby.png` });
  await pages.pia.screenshot({ path: `${SHOTS}/online-lobby-guest.png` });
  await pages.hana.click('text=Start game');
  await Promise.all(Object.values(pages).map(p => p.waitForSelector('.players', { timeout: 20000 })));
  log('started');

  // Gus reloads mid-game: same tab, same seat
  await playUntil(async () => (await moves(pages.hana)) >= 8, 60000, 'a few moves');
  await pages.gus.reload();
  await pages.gus.waitForSelector('.players', { timeout: 20000 });
  log('gus reloaded');
  await pages.gus.screenshot({ path: `${SHOTS}/online-guest.png` });

  // Pia closes her tab. After a moment Hana is offered a bot for her, and taps it
  await playUntil(async () => (await moves(pages.hana)) >= 20, 60000, 'more moves');
  // (BroadcastChannel has no server to notice a dead tab: the page announces it on pagehide, so leave the page first)
  await pages.pia.goto('about:blank');
  await pages.pia.close();
  pages.pia = null;
  if (process.env.V4_DEBUG) {
    await pages.hana.waitForTimeout(2500);
    console.log('room players after Pia left:', await pages.hana.evaluate(() => new Promise(res => {
      const rq = indexedDB.open('patrons-bt');
      rq.onsuccess = () => { const g = rq.result.transaction('kv').objectStore('kv').get('patrons-bt:patrons-v4'); g.onsuccess = () => { const r = Object.values(g.result.data.v3rooms).find(x => x.game === 'v4' && x.status === 'playing'); res(JSON.stringify({ players: r.players, seats: r.seats })); }; };
    })));
  }
  await pages.hana.waitForSelector('[data-online-sub="2"]', { timeout: 20000 });
  await pages.hana.screenshot({ path: `${SHOTS}/online-left-offer.png` });
  const before = await moves(pages.hana);
  await pages.hana.click('[data-online-sub="2"]');
  await pages.hana.waitForSelector('[data-online="sub"][data-seat="2"]', { timeout: 10000 });
  log('bot standing in for pia at move', before);
  // the game goes on without her (the bot plays her turns)
  await playUntil(async () => (await moves(pages.hana)) >= before + 25, 90000, 'play past Pia’s turns');
  const piaMoves = await pages.hana.evaluate(n => JSON.parse(window.patronsRecord()).moves.slice(n).filter(([p]) => p === 2).length, before);
  if (!piaMoves) throw new Error('no move was played for Pia after the takeover');

  // Pia reopens the invite link: straight back into her seat, the bot steps aside
  pages.pia = watch(await ctxs.pia.newPage(), 'pia');
  await pages.pia.goto(`${invite}&intro=0`);
  await pages.pia.waitForSelector('.players', { timeout: 20000 });
  // the bot has stepped aside: when it's Pia's turn the table waits for her (a bot would move within ~30 ms)
  {
    const t0 = Date.now();
    while (!(await pages.pia.$('[data-option]:not([disabled])'))) {
      if (Date.now() - t0 > 60000) throw new Error('Pia never got a turn after coming back');
      const a = await stepFirstOption(pages.hana), b = await stepFirstOption(pages.gus);
      if (!a && !b) await pages.hana.waitForTimeout(40);
    }
    const n = await moves(pages.hana);
    await pages.hana.waitForTimeout(1500);
    if ((await moves(pages.hana)) !== n) throw new Error('a bot kept playing Pia’s seat after she came back');
  }
  const piaYou = await pages.pia.$eval('.players', e => e.textContent).catch(() => '');
  if (!/you/i.test(piaYou)) throw new Error('Pia rejoined but no seat shows as hers');
  await pages.pia.screenshot({ path: `${SHOTS}/online-rejoined-phone.png` });
  log('pia back');

  // Hana (the host) reloads: Gus takes over as host while she's gone, and she comes back as a guest
  await playUntil(async () => (await moves(pages.hana)) >= before + 35, 60000, 'a few more moves');
  await pages.hana.reload();
  await pages.hana.waitForSelector('.players', { timeout: 20000 });
  log('hana reloaded');

  await playUntil(atResults, 240000, 'final results');
  const wins = await Promise.all(Object.values(pages).map(p => p.$eval('.results .win', e => e.textContent)));
  if (new Set(wins).size !== 1) throw new Error(`players disagree on the result: ${JSON.stringify(wins)}`);
  if ((await seatOf(pages.pia)) !== 3) throw new Error('record has the wrong seat count');
  await pages.gus.screenshot({ path: `${SHOTS}/online-results.png` });
  log(`game finished: ${wins[0]}`);
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  for (const [who, pg] of Object.entries(pages)) {
    if (!pg || pg.isClosed()) continue;
    errors.push(`${who} options: ${JSON.stringify(await pg.$$eval('[data-option]', els => els.map(e => e.getAttribute('data-option') + (e.disabled ? '(off)' : ''))).catch(() => '-'))}`);
    errors.push(`${who} prompt: ${await pg.$eval('[data-prompt]', e => e.textContent).catch(() => '-')} | bar: ${await pg.$eval('[data-online-bar]', e => e.textContent).catch(() => '-')}`);
    await pg.screenshot({ path: `${SHOTS}/zz-online-${who}-failure.png` }).catch(() => {});
  }
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? `PASS online (${tag})` : `FAIL online (${tag})`);
process.exit(ok ? 0 : 1);
