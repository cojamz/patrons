// E2E: a 3-person online game, with the things friends actually do.
//   Hana hosts on a laptop. Gus joins by typing the code. Pia opens the invite link (a laptop; an iPhone 13 over
//   Firebase with V4_PHONE=1).
//   Mid-game: Gus reloads, then swipes Back (it must ask, not leave); Pia closes her tab, so Hana gets "Pia left — let a
//   bot play for them" and taps it; Pia reopens the link and has her seat back; Hana reloads, so the host role moves
//   to Gus and back she comes as a guest. Everyone clicks the first legal option on their turn, through to final
//   results, and all three must agree. Fails on any console error.
// Guards (quiet-w3-44e22bd: eaten clicks and a choice that stalled): every click on a lit wheel space, or on its "Place
//   here", must change the table within 1.5s (measured in the page, from the click to the commit that answers it), and
//   the prompt of every choice in front of a person must say something (never empty, never "-"). The driver plays like a
//   person: it waits for its own move to land before clicking again, and doesn't press within 450ms of a new step (the
//   UI's double-tap lock).
// Transport: a Firebase RTDB emulator whenever this box can run one (java + the emulator jar, cached in
//   ~/.cache/patrons; or V4_RTDB=host:port for one already running). Each person then has their own browser context,
//   so their own storage, which is where rejoin ids live. Otherwise (V4_NO_EMU=1, or no java) BroadcastChannel tabs
//   of one browser context, which share localStorage: the rejoin is weaker there, and the run says so.
// Server: $V4_URL if set, else starts `npx vite --port 5181` itself.
import { chromium, devices } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, renameSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '';
mkdirSync(SHOTS, { recursive: true });

// ---- the RTDB emulator (real Firebase SDK and the repo's database rules, on localhost) ----
const EMU_VERSION = '4.11.2';
const EMU_NS = 'cornycolonies-default-rtdb';
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); s.on('error', rej); });
async function startEmulator() {
  if (process.env.V4_RTDB) return { host: process.env.V4_RTDB, stop() {} };
  if (process.env.V4_NO_EMU) return null;
  if (spawnSync('java', ['-version'], { stdio: 'ignore' }).status !== 0) return null;
  const jar = process.env.V4_RTDB_JAR || `${homedir()}/.cache/patrons/firebase-database-emulator-v${EMU_VERSION}.jar`;
  if (!existsSync(jar)) {
    mkdirSync(jar.slice(0, jar.lastIndexOf('/')), { recursive: true });
    const url = `https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v${EMU_VERSION}.jar`;
    const r = spawnSync('curl', ['-sSfL', '--max-time', '180', '-o', `${jar}.part`, url], { stdio: 'ignore' });
    if (r.status !== 0) return null;
    renameSync(`${jar}.part`, jar);
  }
  const port = await freePort();
  const proc = spawn('java', ['-jar', jar, '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
  const stop = () => { try { proc.kill('SIGKILL'); } catch { /* gone */ } };
  const at = `http://127.0.0.1:${port}`;
  for (let k = 0; k < 120; k++) {
    await new Promise(r => setTimeout(r, 500));
    if (await fetch(`${at}/.json?ns=${EMU_NS}`).then(r => r.status < 500, () => false)) {
      const rules = readFileSync(new URL('../../database.rules.json', import.meta.url), 'utf8');
      const put = await fetch(`${at}/.settings/rules.json?ns=${EMU_NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: rules }).then(r => r.ok, () => false);
      if (put) return { host: `127.0.0.1:${port}`, stop };
    }
  }
  stop();
  return null;
}
const emu = await startEmulator();
const RTDB = emu ? emu.host : '';
const tag = RTDB ? 'firebase-emulator' : 'broadcast';
if (!RTDB) console.log('[online broadcast] no RTDB emulator here: three tabs of one browser share storage, so the rejoin check is weaker');

let server = null;
let base = process.env.V4_URL;
if (!base) {
  base = 'http://localhost:5181';
  server = spawn('npx', ['vite', '--port', '5181', '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); emu?.stop(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const log = (...a) => console.log(`[online ${tag}]`, ...a);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const laptop = { viewport: { width: 1270, height: 700 } };
// BroadcastChannel/IndexedDB only reach tabs of one context; over Firebase every person gets their own context
const shared = RTDB ? null : await browser.newContext(laptop);
const ctxFor = async opts => shared || browser.newContext(opts);
// everyone on a laptop by default: phone is out of scope for v0.2 (Cory: laptops only). V4_PHONE=1 puts Pia on an
// iPhone 13 (over Firebase), as touch.mjs and motion.mjs opt in
const PHONE = !!process.env.V4_PHONE && !!RTDB;
const ctxs = { hana: await ctxFor(laptop), gus: await ctxFor(laptop), pia: await ctxFor(PHONE ? { ...devices['iPhone 13'] } : laptop) };
// In every page: each click on a lit wheel space (or a space's "Place here") is timed from its own timestamp to the first
// DOM commit that changes what the person sees (the move count, a confirm card, the space lit as chosen, the live
// options, an error, the prompt, a note at the pointer). A MutationObserver, so a background tab is timed too.
// Frame-honest, as snappy.mjs: a loaded box paints less often (three software-rastered pages on a box at load 25 drew
// 2–3 frames a second), so the limit allows two of the page's own frames on top of 1.5s: the median rAF interval over
// the second before the click (~17ms on a quiet box, where the 1.5s bites as it is).
const LIT_LIMIT = 1500;
const LIT_CLICKS = () => {
  const frames = [];
  let last = null;
  const tick = t => { if (last != null) { frames.push([t, t - last]); if (frames.length > 40) frames.shift(); } last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const boxFrame = at => { const xs = frames.filter(([t]) => at - t < 1000).map(([, d]) => d).sort((a, b) => a - b); return xs.length ? xs[Math.floor(xs.length / 2)] : 17; };
  const look = () => {
    const g = document.querySelector('.app.game');
    const t = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    const place = document.querySelector('[data-place]');
    return [g && g.dataset.moves, !!document.querySelector('[data-next-round]'), place ? place.getAttribute('data-place') : '',
      [...document.querySelectorAll('.lt-wheel [data-slot].sel, .lt-wheel [data-cell].sel')].map(e => e.getAttribute('data-slot') || e.getAttribute('data-cell')).sort().join(','),
      [...document.querySelectorAll('[data-option]:not([disabled])')].map(e => e.getAttribute('data-option')).sort().join(' '),
      t('.error'), t('[data-prompt]'), t('.deny-note')].join('|');
  };
  window.__litClicks = [];
  addEventListener('click', e => {
    const el = e.target && e.target.closest && e.target.closest('.lt-wheel [data-slot][data-option], .lt-wheel .pcell.lit, [data-place]');
    if (!el) return;
    const id = el.getAttribute('data-option') || (el.hasAttribute('data-place') ? `Place here (${el.getAttribute('data-place')})` : `cell ${el.getAttribute('data-cell')}`);
    const rec = { id, t: e.timeStamp, before: look(), ms: null, frame: Math.round(boxFrame(e.timeStamp)) };
    window.__litClicks.push(rec);
    const done = () => { rec.ms = Math.round(performance.now() - rec.t); mo.disconnect(); };
    const mo = new MutationObserver(() => { if (rec.ms == null && look() !== rec.before) done(); });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    setTimeout(() => { if (rec.ms == null) { if (look() !== rec.before) done(); else mo.disconnect(); } }, 8000);
  }, true);
};
for (const c of new Set(Object.values(ctxs))) await c.addInitScript(LIT_CLICKS);
const T0 = Date.now();
const trail = []; // the driver's last moves, for the failure report
const act = (who, what) => { trail.push(`${((Date.now() - T0) / 1000).toFixed(1)}s ${who}: ${what}`); if (trail.length > 50) trail.shift(); };
const watch = (page, who) => {
  page.on('console', m => { if (m.type() === 'error') errors.push(`${who} console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${who} pageerror: ${e.message}`));
  if (process.env.V4_DEBUG) {
    page.on('console', m => console.log(`  ${who} ${m.type()}: ${m.text().slice(0, 300)}`));
    page.on('framenavigated', f => { if (f === page.mainFrame()) console.log(`  ${who} nav ${f.url()}`); });
  }
  return page;
};
// the game screen's root (stable across UI reworks; seat panels come and go)
const GAME = '.app.game';
const params = `${RTDB ? `rtdb=${RTDB}` : 'transport=broadcast'}&botDelay=30&subAfter=1500&intro=0`; // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
const url = `${base}/?${params}`;
const pages = { hana: watch(await ctxs.hana.newPage(), 'hana'), gus: watch(await ctxs.gus.newPage(), 'gus'), pia: null };

// Clicks the first legal option (choice panels first). The same option id can show in two places (a choice panel and
// the shop row), and the UI keeps changing, so if a click leaves the page where it was, the next try starts further down.
const stuck = new Map(); // page -> { key, tries }
const nameOf = page => Object.keys(pages).find(k => pages[k] === page) || '?';
// The words a person reads for the choice in front of them: the headline ([data-prompt]), or, for a choice picked on the
// board, the caption docked in its place (it has no [data-prompt]), the panel's question, and the line under them.
const choiceWords = page => page.evaluate(() => {
  const g = document.querySelector('.app.game');
  const t = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  return { mine: !!g && g.dataset.yours === '1' && ['choose', 'setup'].includes(g.dataset.phase), phase: g && g.dataset.phase,
    head: t('[data-prompt]'), caption: t('.prompt.choice.seat-pick .pick-cap'), panel: t('.prompt.choice:not(.seat-pick):not(.watching) > p'), sub: t('[data-prompt-sub]') };
}).catch(() => null);
const blank = s => s != null && (!s || /^[-–—\s]*$/.test(s));
// every timed click on a lit space (LIT_CLICKS) must have changed the table within 1.5s
const litSeen = new Map(); // page -> how many of its records were checked
async function checkLitClicks(page) {
  if (!page || page.isClosed()) return;
  const recs = await page.evaluate(() => (window.__litClicks || []).map(r => ({ id: r.id, ms: r.ms, frame: r.frame, age: Math.round(performance.now() - r.t) }))).catch(() => null);
  if (!recs) return;
  if (recs.length < (litSeen.get(page) || 0)) litSeen.set(page, 0); // a reload: a new page's records
  let k = litSeen.get(page) || 0;
  for (; k < recs.length; k++) {
    const r = recs[k];
    const limit = LIT_LIMIT + 2 * (r.frame || 17);
    if (r.ms == null && r.age <= limit) break; // still within its time
    if (r.ms == null || r.ms > limit) throw new Error(`${nameOf(page)}: a click on the lit space ${r.id} ${r.ms == null ? 'changed nothing on the table' : `took ${r.ms}ms to change the table`} (want ≤ ${LIT_LIMIT}ms + 2 box frames of ${r.frame}ms)`);
  }
  litSeen.set(page, k);
}
// A press where a person would press: Playwright's click, else (it waits for two frames with the element standing still,
// which a page drawing 2–3 frames a second while a card rises in can miss for seconds) the mouse at the element's middle,
// when that point hits it (a hit-test, as a person's click would). Returns how it pressed, or null.
async function pressLikeAPerson(page, el, timeout = 2500) {
  try { await el.click({ timeout }); return 'click'; } catch { /* not steady yet: press where it stands */ }
  const at = await el.evaluate(e => {
    if (!e.isConnected) return null;
    const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return hit && (hit === e || e.contains(hit)) ? { x, y } : null;
  }).catch(() => null);
  if (!at) return null;
  await page.mouse.click(at.x, at.y).catch(() => {});
  return 'pressed at its middle';
}
const seen = new Map(); // page -> { key, at, waiting }: when this step appeared, and since when a move of ours is on its way
const lastSaid = new Map(); // who -> what the driver last decided for that page, and when (for the failure report)
async function stepFirstOption(page) {
  if (!page || page.isClosed()) return false;
  const who = nameOf(page);
  const t0 = Date.now();
  const r = await stepOn(page, who);
  lastSaid.set(who, `${r.why} (${Date.now() - t0}ms, at ${((Date.now() - T0) / 1000).toFixed(1)}s)`);
  return r.acted;
}
async function stepOn(page, who) {
  const no = why => ({ acted: false, why }), yes = why => ({ acted: true, why });
  await checkLitClicks(page);
  // tabs of one context: only the front tab is "visible" (its animations and pacing run); bring each to the front
  if (shared) await page.bringToFront().catch(() => {});
  const next = await page.$('[data-next-round]');
  if (next) { await next.click().catch(() => {}); act(who, 'next round'); return yes('next round'); }
  // touch (and online) placement asks to confirm: "Place here"
  const place = await page.$('[data-place]');
  if (place) {
    const id = await place.getAttribute('data-place').catch(() => '?');
    const how = await pressLikeAPerson(page, place);
    act(who, `Place here (${id})${how === 'click' ? '' : how ? ` (${how})` : ': nothing under the pointer would take it'}`);
    if (how) return yes('Place here');
  }
  // The answer a person would give (lib/answer.mjs: board picks, pairs, the pay sheet), the choice panel's (or
  // dialog's) own answers first. A step whose last click changed nothing tries the next answer (skip), and when every
  // real click is refused (usually a hover card left open under the pointer) the option is pressed directly: this e2e
  // tests the online flow; the UI e2e test hit-testing.
  if (!(await page.$('[data-option]:not([disabled])'))) return no('nothing to answer');
  const now = await page.evaluate(() => ({
    key: `${document.querySelector('.app.game')?.dataset.moves}|${document.querySelector('.app.game')?.dataset.phase}|${document.querySelector('[data-prompt]')?.textContent}`,
    // a space lit as chosen with no confirm up: our move is on its way to the host and back (Wheel: sent / Place here)
    flying: !!document.querySelector('.lt-wheel [data-slot].sel, .lt-wheel [data-cell].sel') && !document.querySelector('[data-place]') && !document.querySelector('.error'),
  })).catch(() => ({ key: '', flying: false }));
  const s = seen.get(page);
  if (!s || s.key !== now.key) seen.set(page, { key: now.key, at: Date.now(), waiting: null });
  const sn = seen.get(page);
  // like a person: wait for your own move to land, and don't press within 450ms of a new step
  // (a move that goes out and gets no answer says so within 8s: "No answer yet". A space still lit as chosen after 20s
  // with nothing said is a confirm that never sent its move: an eaten click)
  if (now.flying) {
    sn.waiting ??= Date.now();
    if (Date.now() - sn.waiting < 20000) return no('waiting for our move to land');
    throw new Error(`${who}: a space has stood lit as chosen for 20s, with no move made and nothing said (a confirm that never went out)`);
  } else sn.waiting = null;
  if (Date.now() - sn.at < 450) return no(`a new step (${now.key.slice(0, 60)})`);
  const words = await choiceWords(page);
  if (words && words.mine) {
    const shown = [words.head, words.caption, words.panel].filter(x => x != null);
    if (!shown.length || shown.every(blank) || [words.head, words.caption, words.panel, words.sub].some(blank)) {
      throw new Error(`${who}: a ${words.phase} prompt says nothing: ${JSON.stringify(words)}`);
    }
  }
  const st = stuck.get(page);
  const skip = st && st.key === now.key ? st.tries : 0;
  stuck.set(page, { key: now.key, tries: skip + 1 });
  // (4s a click: on a starved page Playwright's click can take seconds to report back, and a click reported as failed
  // that did land would be followed by a second one on the next answer)
  const res = await answerChoice(page, { panelFirst: true, skip, domFallback: true, timeout: 4000 });
  if (res) act(who, `${res.kind} ${res.id}${skip ? ` (skip ${skip})` : ''}`);
  return res ? yes(`answered ${res.id}`) : no('no answer took the click');
}
const moves = page => page.evaluate(() => { try { return JSON.parse(window.patronsRecord()).moves?.length ?? 0; } catch { return 0; } }).catch(() => 0);
// plays every open page until `done()` (or the results), at most `ms`
// Each person plays at their own pace, side by side (one loop each), as people do: one slow page (a click Playwright waits
// on for seconds while a starved page draws 2–3 frames a second) never holds up the others' turns.
async function playUntil(done, ms, what) {
  const t0 = Date.now();
  let over = false, failure = null;
  const nap = n => new Promise(r => setTimeout(r, n));
  const loop = async who => {
    while (!over) {
      const p = pages[who];
      const acted = p && !p.isClosed() ? await stepFirstOption(p).catch(e => { if (!p.isClosed()) { failure ||= e; over = true; } return false; }) : false;
      if (!acted) await nap(60);
    }
  };
  const loops = Object.keys(pages).map(loop);
  try {
    while (!failure && !(await done())) {
      if (Date.now() - t0 > ms) throw new Error(`timed out playing until ${what}`);
      await nap(100);
    }
  } finally { over = true; await Promise.all(loops); }
  if (failure) throw failure;
  for (const p of Object.values(pages)) await checkLitClicks(p);
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
  // Pick your emoji in the lobby, one per table: Hana takes a free one; Gus sees it taken and takes another.
  // (Everyone already got a random free one on joining, so which are free changes run to run.)
  const FREE = '[data-emoji-grid] [data-pick]:not([disabled]):not([aria-checked="true"])';
  await pages.hana.click('.seats [data-emoji-btn]');
  const hanaPick = await pages.hana.$eval(FREE, e => e.getAttribute('data-pick'));
  await pages.hana.click(`[data-emoji-grid] [data-pick="${hanaPick}"]`);
  await pages.gus.waitForFunction(p => document.querySelector(`.seats [data-emoji-face="${p}"]`), hanaPick, { timeout: 15000 });
  await pages.gus.click('.seats [data-emoji-btn]');
  if (!(await pages.gus.$(`[data-emoji-grid] [data-pick="${hanaPick}"][disabled]`))) throw new Error(`Gus could pick the ${hanaPick} Hana holds`);
  const gusPick = await pages.gus.$eval(FREE, e => e.getAttribute('data-pick'));
  await pages.gus.click(`[data-emoji-grid] [data-pick="${gusPick}"]`);
  await pages.hana.waitForFunction(p => document.querySelector(`.seats [data-emoji-face="${p}"]`), gusPick, { timeout: 15000 });
  log('emojis picked', hanaPick, gusPick);
  await pages.hana.screenshot({ path: `${SHOTS}/online-lobby.png` });
  await pages.pia.screenshot({ path: `${SHOTS}/online-lobby-guest.png` });
  await pages.hana.click('text=Start game');
  await Promise.all(Object.values(pages).map(p => p.waitForSelector(GAME, { timeout: 20000 })));
  log('started');
  // the picks are on the leaders, the same on every screen
  for (const [who, pg] of Object.entries(pages)) {
    await pg.waitForSelector('.lt-seat[data-pid] [data-leader] svg[data-emoji]', { timeout: 20000 });
    const worn = await pg.$$eval('.lt-seat[data-pid] [data-leader] svg[data-emoji]', els => Object.fromEntries(els.map(e => [e.closest('.lt-seat').getAttribute('data-pid'), e.getAttribute('data-emoji')])));
    if (worn['0'] !== hanaPick || worn['1'] !== gusPick || !worn['2'] || new Set(Object.values(worn)).size !== 3) throw new Error(`${who} sees the leaders wearing ${JSON.stringify(worn)} (want Hana ${hanaPick}, Gus ${gusPick}, Pia her own)`);
  }

  // Gus reloads mid-game: same tab, same seat
  await playUntil(async () => (await moves(pages.hana)) >= 8, 60000, 'a few moves');
  await pages.gus.reload();
  await pages.gus.waitForSelector(GAME, { timeout: 20000 });
  log('gus reloaded');
  // Back (an iPhone edge swipe) mid-game must ask, not leave: still in the game, seat still his, the confirm is up
  await pages.gus.evaluate(() => history.back());
  await pages.gus.waitForSelector('[role="alertdialog"][aria-label="Leave this game?"]', { timeout: 10000 });
  if (!(await pages.gus.$(GAME))) throw new Error('Back left the game');
  if (!(await pages.gus.evaluate(() => sessionStorage.getItem('patrons.v4.online')))) throw new Error('Back dropped the saved seat');
  await pages.gus.click('[role="alertdialog"] >> text=Keep playing');
  await pages.gus.waitForSelector('[role="alertdialog"][aria-label="Leave this game?"]', { state: 'detached', timeout: 10000 });
  log('gus pressed Back: asked, kept his seat');
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
  await pages.pia.waitForSelector(GAME, { timeout: 20000 });
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
  const piaYou = await pages.pia.$eval(GAME, e => e.textContent).catch(() => '');
  if (!/you/i.test(piaYou)) throw new Error('Pia rejoined but no seat shows as hers');
  await pages.pia.screenshot({ path: `${SHOTS}/online-rejoined-phone.png` });
  log('pia back');

  // Hana (the host) reloads: Gus takes over as host while she's gone, and she comes back as a guest
  await playUntil(async () => (await moves(pages.hana)) >= before + 35, 60000, 'a few more moves');
  await pages.hana.reload();
  await pages.hana.waitForSelector(GAME, { timeout: 20000 });
  log('hana reloaded');

  await playUntil(atResults, 240000, 'final results');
  // the same winners and score on every device (each says "You win" on the winner's own screen, so compare the seats)
  const wins = await Promise.all(Object.values(pages).map(p => p.$eval('.results .win', e => ({ winners: e.dataset.winners, top: e.dataset.top, text: e.textContent }))));
  if (wins.some(w => !w.winners || !w.top) || new Set(wins.map(w => `${w.winners}|${w.top}`)).size !== 1) throw new Error(`players disagree on the result: ${JSON.stringify(wins)}`);
  if ((await seatOf(pages.pia)) !== 3) throw new Error('record has the wrong seat count');
  // the last clicks have had their 1.5s
  await pages.hana.waitForTimeout(1600);
  for (const p of Object.values(pages)) await checkLitClicks(p);
  await pages.gus.screenshot({ path: `${SHOTS}/online-results.png` });
  log(`game finished: ${wins[0].text}`);
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  for (const [who, pg] of Object.entries(pages)) {
    if (!pg || pg.isClosed()) continue;
    errors.push(`${who} options: ${JSON.stringify(await pg.$$eval('[data-option]', els => els.map(e => e.getAttribute('data-option') + (e.disabled ? '(off)' : ''))).catch(() => '-'))}`);
    const w = await choiceWords(pg);
    errors.push(`${who} prompt: ${w ? [w.head ?? '(no [data-prompt])', w.caption && `caption: ${w.caption}`, w.panel && `panel: ${w.panel}`, w.sub && `sub: ${w.sub}`].filter(Boolean).join(' | ') : '?'} | bar: ${await pg.$eval('[data-online-bar]', e => e.textContent).catch(() => '(none)')}`);
    errors.push(`${who} table: ${JSON.stringify(await pg.evaluate(() => ({ moves: document.querySelector('.app.game')?.dataset.moves, phase: document.querySelector('.app.game')?.dataset.phase, place: document.querySelector('[data-place]')?.getAttribute('data-place') || null, sel: [...document.querySelectorAll('.lt-wheel .sel')].map(e => e.getAttribute('data-slot') || e.getAttribute('data-cell')), error: document.querySelector('.error')?.textContent || null, lastClicks: (window.__litClicks || []).slice(-4).map(r => `${r.id}: ${r.ms == null ? 'no change' : `${r.ms}ms`}`) })).catch(() => null))}`);
    await pg.screenshot({ path: `${SHOTS}/zz-online-${who}-failure.png` }).catch(() => {});
  }
} finally {
  await browser.close();
  if (server) server.kill();
  emu?.stop();
}
if (errors.length) console.error([...errors, 'driver, last decision per person:', ...[...lastSaid].map(([w, d]) => `  ${w}: ${d}`), 'driver, last moves:', ...trail.map(l => `  ${l}`)].join('\n'));
console.log(ok ? `PASS online (${tag})` : `FAIL online (${tag})`);
process.exit(ok ? 0 : 1);
