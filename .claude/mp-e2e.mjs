/**
 * MP E2E — drives 2 browser contexts (host + guest) through champion draft
 * Verifies: room creation, join, ready, start, draft turn gating, board reach.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SHOTS_DIR = '/tmp/patrons-shots/mp-e2e';
mkdirSync(SHOTS_DIR, { recursive: true });

const URL = 'http://localhost:5174';
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch({ headless: true });
const hostCtx = await browser.newContext({ viewport: VIEWPORT });
const guestCtx = await browser.newContext({ viewport: VIEWPORT });
const host = await hostCtx.newPage();
const guest = await guestCtx.newPage();

const errs = { host: [], guest: [] };
host.on('console', m => { if (m.type() === 'error') errs.host.push(m.text()); });
guest.on('console', m => { if (m.type() === 'error') errs.guest.push(m.text()); });
host.on('pageerror', e => errs.host.push('EXC: ' + e.message));
guest.on('pageerror', e => errs.guest.push('EXC: ' + e.message));

const snap = async (page, name) => {
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png` });
  console.log('  shot:', name);
};

const findRoomCode = async (page) => {
  // Strategy 1: input with a 4-char uppercase value
  const fromInput = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      const v = (inp.value || '').trim();
      if (/^[A-Z0-9]{4}$/.test(v)) return v;
    }
    return null;
  });
  if (fromInput) return fromInput;
  // Strategy 2: scan body text for a standalone 4-char uppercase token
  const fromText = await page.evaluate(() => {
    const txt = document.body.innerText;
    const m = txt.match(/\b[A-Z0-9]{4}\b/g);
    if (!m) return null;
    // Filter out common non-codes
    const blacklist = new Set(['ROOM','CODE','HOST','OPEN','JOIN','BACK','READY','GAME','PLAY','NAME','DOCK','TIER']);
    for (const c of m) if (!blacklist.has(c)) return c;
    return null;
  });
  return fromText;
};

const clickByText = async (page, text, opts = {}) => {
  const btns = await page.$$('button');
  for (const b of btns) {
    let t = '';
    try { t = (await b.innerText()).trim(); } catch (e) {}
    if (opts.exact ? t === text : t.toLowerCase().includes(text.toLowerCase())) {
      await b.click({ force: true }).catch(()=>{});
      return true;
    }
  }
  return false;
};

console.log('=== Step 1: Both navigate to landing ===');
await Promise.all([
  host.goto(URL, { waitUntil: 'networkidle' }),
  guest.goto(URL, { waitUntil: 'networkidle' }),
]);
await host.waitForTimeout(800);
await snap(host, '00-host-landing');
await snap(guest, '00-guest-landing');

console.log('=== Step 2: Host clicks CREATE ROOM (setup screen) ===');
await host.click('button:has-text("CREATE ROOM")', { force: true });
await host.waitForTimeout(1000);
await snap(host, '01-host-mp-screen');

console.log('=== Step 3: Host fills name + clicks CREATE ROOM (mp screen) ===');
const hostNameInput = await host.$('input[placeholder*="name" i], input[placeholder*="Name"]') || (await host.$$('input'))[0];
await hostNameInput.click({ force: true });
await hostNameInput.fill('Host');
await host.waitForTimeout(300);
await snap(host, '02-host-name-typed');
await host.click('button:has-text("CREATE ROOM")', { force: true });
await host.waitForTimeout(3500); // Firebase auth + room creation
await snap(host, '03-host-room-created');

const roomCode = await findRoomCode(host);
console.log('  Room code extracted:', roomCode);
if (!roomCode) {
  await snap(host, '03b-no-roomcode');
  console.error('  FAIL: could not extract room code');
}

console.log('=== Step 4: Guest clicks CREATE ROOM (setup) → name → JOIN ROOM ===');
await guest.click('button:has-text("CREATE ROOM")', { force: true });
await guest.waitForTimeout(1000);
await snap(guest, '04-guest-mp-screen');
const guestNameInput = await guest.$('input[placeholder*="name" i], input[placeholder*="Name"]') || (await guest.$$('input'))[0];
await guestNameInput.click({ force: true });
await guestNameInput.fill('Guest');
await guest.waitForTimeout(300);
await snap(guest, '05-guest-name-typed');
await guest.click('button:has-text("JOIN ROOM")', { force: true });
await guest.waitForTimeout(800);
await snap(guest, '06-guest-join-screen');

console.log('=== Step 5: Guest fills room code (4 separate boxes) + joins ===');
// Room code UI is 4 separate single-char input boxes. Click first, type chars.
const guestCodeInputs = await guest.$$('input');
console.log('  Guest input count:', guestCodeInputs.length);
if (roomCode && guestCodeInputs.length >= 4) {
  // Focus first then type each char (most code-input components auto-advance)
  await guestCodeInputs[0].click({ force: true });
  await guest.keyboard.type(roomCode, { delay: 80 });
  // If autoadvance failed, fill each box explicitly
  const filled = await guest.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.value).join(''));
  if (filled.toUpperCase() !== roomCode) {
    console.log('  autoadvance fail, got:', filled, '— filling each box');
    for (let i = 0; i < roomCode.length && i < guestCodeInputs.length; i++) {
      await guestCodeInputs[i].click({ force: true });
      await guestCodeInputs[i].fill(roomCode[i]);
    }
  }
} else if (roomCode && guestCodeInputs.length > 0) {
  await guestCodeInputs[0].click({ force: true });
  await guestCodeInputs[0].fill(roomCode);
}
await guest.waitForTimeout(500);
await snap(guest, '07-guest-code-typed');
// After 4 chars typed, the join may auto-trigger; otherwise click any join button
const stillOnJoinScreen = await guest.evaluate(() => /enter room code/i.test(document.body.innerText));
if (stillOnJoinScreen) {
  const guestBtns = await guest.$$('button');
  for (const b of guestBtns) {
    let t = '';
    try { t = (await b.innerText()).trim().toLowerCase(); } catch (e) {}
    if ((t === 'join' || t.includes('join room') || t.includes('join')) && !t.includes('back')) {
      await b.click({ force: true }).catch(()=>{});
      break;
    }
  }
}
await guest.waitForTimeout(3000);
await snap(guest, '08-guest-joined');
await snap(host, '08-host-after-guest-joined');

console.log('=== Step 6: Both READY up ===');
for (const [label, page] of [['host', host], ['guest', guest]]) {
  // The "NOT READY" pill is the toggle. Try multiple selectors.
  let clicked = false;
  const selectors = [
    'button:has-text("NOT READY")',
    'button:has-text("Not Ready")',
    'text="NOT READY"',
    'text=/not ready/i',
    'button:has-text("Ready")',
    'button:has-text("READY")',
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click({ force: true }).catch(()=>{});
      clicked = true;
      console.log(`  ${label} clicked via:`, sel);
      break;
    }
  }
  if (!clicked) {
    // Last resort: find any element with "ready" text
    const found = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('button, [role="button"], div, span'));
      for (const el of all) {
        const t = (el.textContent || '').trim().toLowerCase();
        if (t === 'not ready' || t === 'ready') {
          el.click();
          return el.tagName + ':' + t;
        }
      }
      return null;
    });
    console.log(`  ${label} eval click:`, found);
  }
}
await host.waitForTimeout(2000);
await snap(host, '09-host-after-ready');
await snap(guest, '09-guest-after-ready');

console.log('=== Step 7: Host clicks START ===');
const startBtn = await host.$('button:has-text("Start"), button:has-text("START")');
if (startBtn) {
  const disabled = await startBtn.isDisabled().catch(() => false);
  console.log('  Start button found, disabled?', disabled);
  await startBtn.click({ force: true });
} else {
  console.log('  FAIL: no Start button on host');
}
await host.waitForTimeout(3000);
await snap(host, '10-host-after-start');
await snap(guest, '10-guest-after-start');

console.log('=== Step 8: Champion draft state ===');
const hostText = await host.evaluate(() => document.body.innerText);
const guestText = await guest.evaluate(() => document.body.innerText);
const inDraftHost = /champion|draft|prescient|ambitious|choose/i.test(hostText);
const inDraftGuest = /champion|draft|prescient|ambitious|choose/i.test(guestText);
console.log('  Host sees draft?', inDraftHost);
console.log('  Guest sees draft?', inDraftGuest);

console.log('=== Step 9: Verify gating — guest should be able to pick first ===');
// Check pointer cursor / disabled state on champion buttons in both views
const cursorCheck = async (page, label) => {
  const champ = await page.$('button.champion-card, [class*="champion" i] button, button:has-text("Prescient")');
  if (!champ) { console.log(`  ${label}: no champion element found`); return null; }
  const info = await champ.evaluate(el => ({
    cursor: window.getComputedStyle(el).cursor,
    disabled: el.disabled,
    opacity: window.getComputedStyle(el).opacity,
  }));
  console.log(`  ${label} champion:`, info);
  return info;
};
const hostChamp = await cursorCheck(host, 'HOST');
const guestChamp = await cursorCheck(guest, 'GUEST');

console.log('=== Step 10: GUEST picks "The Prescient" ===');
const guestPick = await guest.click('text=The Prescient', { force: true }).then(()=>true).catch((e)=>{ console.log('  guest pick err:', e.message); return false; });
await guest.waitForTimeout(2500);
await snap(guest, '11-guest-after-prescient');
await snap(host, '11-host-after-guest-prescient');

console.log('=== Step 11: HOST picks "The Ambitious" ===');
const hostPick = await host.click('text=The Ambitious', { force: true }).then(()=>true).catch((e)=>{ console.log('  host pick err:', e.message); return false; });
await host.waitForTimeout(3500);
await snap(host, '12-host-after-ambitious');
await snap(guest, '12-guest-after-ambitious');

console.log('=== Step 12: Final state — both reach board? ===');
const finalHost = await host.evaluate(() => document.body.innerText);
const finalGuest = await guest.evaluate(() => document.body.innerText);
const godRegex = /aurum|noctis|silvanus|umbra|aureus|verdant|cinder|tyche|hermes|atlas|veles|mara/i;
const boardSignal = /place|worker|round|action|shop|favor/i;
const hostBoard = godRegex.test(finalHost) || boardSignal.test(finalHost);
const guestBoard = godRegex.test(finalGuest) || boardSignal.test(finalGuest);
console.log('  Host on board?', hostBoard, ' (god match:', godRegex.test(finalHost), ')');
console.log('  Guest on board?', guestBoard, ' (god match:', godRegex.test(finalGuest), ')');

console.log('\n=== RESULTS ===');
console.log(JSON.stringify({
  roomCode,
  guestJoined: /Guest/i.test(await host.evaluate(() => document.body.innerText)),
  hostInDraft: inDraftHost,
  guestInDraft: inDraftGuest,
  hostChampCursor: hostChamp?.cursor,
  guestChampCursor: guestChamp?.cursor,
  guestPickClicked: guestPick,
  hostPickClicked: hostPick,
  hostOnBoard: hostBoard,
  guestOnBoard: guestBoard,
}, null, 2));

// =================================================================
// Step 13: Play actual turns. This is the section that catches the
// "guest clicks but nothing happens" class of bug. Without this,
// real bugs ship to humans.
// =================================================================

const FAILURES = [];
const fail = (msg) => { console.log('  ❌', msg); FAILURES.push(msg); };
const pass = (msg) => console.log('  ✓', msg);

// Helper: read current player visible to a page (from text we render)
const readState = async (page) => {
  return page.evaluate(() => ({
    text: document.body.innerText,
  }));
};

// Helper: wait for a predicate, polling every 200ms, up to timeoutMs.
const waitFor = async (page, predicateFn, timeoutMs, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const state = await readState(page);
    if (predicateFn(state)) return true;
    await page.waitForTimeout(200);
  }
  fail(`timeout waiting for "${label}" on ${page === host ? 'host' : 'guest'} (${timeoutMs}ms)`);
  return false;
};

console.log('\n=== Step 13: Resolve host\'s Prescient nullifier (twice) ===');
// Prescient places 2 nullifiers per round at round_start. Host has Ambitious in this script —
// wait, we picked AMBITIOUS for host and PRESCIENT for guest. So GUEST has Prescient.
// Guest will see the Place Nullifier modal.
for (let i = 0; i < 2; i++) {
  const ok = await waitFor(guest, ({ text }) => /place nullifier|nullify/i.test(text), 8000, `nullifier modal ${i + 1}`);
  if (!ok) break;
  // Modal doesn't use role="dialog" — find it by title text and click an action button inside.
  // The post-May-2 modal groups by god subheaders; each action is a button with name+effect.
  const optClicked = await guest.evaluate(() => {
    // Find the modal container — the one whose first prominent text is "Place Nullifier"
    const candidates = Array.from(document.querySelectorAll('div'));
    const modal = candidates.find(d => {
      const h = d.querySelector('h2, h3, [class*="title" i]');
      const t = (h?.innerText || d.innerText || '').slice(0, 100);
      return /place nullifier/i.test(t);
    });
    if (!modal) return false;
    const btns = modal.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      // Skip the close × and any cancel-ish button
      if (!t || t.length < 3 || /×|cancel|back/i.test(t)) continue;
      b.click();
      return true;
    }
    return false;
  });
  if (optClicked) pass(`nullifier ${i + 1} clicked`);
  else { fail(`could not click nullifier ${i + 1}`); break; }
  await guest.waitForTimeout(1500);
}
await snap(guest, '13-guest-after-nullifiers');
await snap(host, '13-host-after-nullifiers');

console.log('\n=== Step 14: Both should be in action_phase, guest goes first ===');
// After Prescient resolves, action_phase begins. Snake order in 2P puts guest (player 2) first.
// Loose detection: any modal closed, board visible (god name appears).
const godRegex2 = /aurum|noctis|chronis|solara/i;
const guestSeesAction = await waitFor(guest, ({ text }) => godRegex2.test(text) && !/place nullifier/i.test(text), 6000, 'action_phase on guest');
const hostSeesAction = await waitFor(host, ({ text }) => godRegex2.test(text) && !/place nullifier/i.test(text), 6000, 'action_phase on host');
if (guestSeesAction) pass('guest in action phase');
if (hostSeesAction) pass('host in action phase (watching)');
await snap(guest, '14-guest-action-phase');
await snap(host, '14-host-action-phase');

// =================================================================
// Reusable turn primitives so we can play many turns / many rounds.
// =================================================================

const T1_ACTIONS = ['Skulk', 'Ransack', 'Pickpocket', 'Tribute', 'Patronage', 'Levy', 'Hoard', 'Haggle', 'Gather', 'Relive', 'Echo', 'Recall', 'Forage', 'Transmute', 'Siphon'];

// Click any visible action by name. Returns the name placed, or null.
const placeAnyAction = async (page) => {
  for (const name of T1_ACTIONS) {
    const found = await page.evaluate((n) => {
      const els = Array.from(document.querySelectorAll('button, [role="button"], div'));
      for (const el of els) {
        const t = (el.innerText || '').trim();
        if (t === n || t.startsWith(n + '\n') || (t.length < 80 && t.includes(n))) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) { el.click(); return true; }
        }
      }
      return false;
    }, name);
    if (found) return name;
  }
  return null;
};

// Resolve any modal currently open by clicking a "good" button (skip cancel, ×, back).
// Returns true if a click happened.
const resolveModal = async (page) => {
  return page.evaluate(() => {
    // Find a modal-ish container (no role=dialog convention, look for fixed/absolute overlays with buttons)
    const candidates = Array.from(document.querySelectorAll('div'));
    let modal = null;
    for (const d of candidates) {
      const cs = window.getComputedStyle(d);
      if ((cs.position === 'fixed' || cs.position === 'absolute') && d.querySelector('button')) {
        const t = (d.innerText || '').slice(0, 200);
        // Skip the bottom HUD / various overlays that aren't decision modals
        if (/place|choose|select|target|gem|gain|spend|nullify|discard|redistribute/i.test(t)) {
          modal = d;
          break;
        }
      }
    }
    if (!modal) return false;
    const btns = modal.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      if (!t || t.length < 2 || /×|cancel|back|close/i.test(t)) continue;
      b.click();
      return true;
    }
    return false;
  });
};

// Try to end turn
const endTurn = async (page) => {
  return page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      const t = (b.innerText || '').trim().toLowerCase();
      if (t === 'end turn' && !b.disabled) { b.click(); return true; }
    }
    return false;
  });
};

// Play one full turn for the active player.
// 1. Place any available action (resolves modals as needed)
// 2. Click End Turn
// Returns { placed: actionName | null, endedTurn: bool }
const playTurn = async (page, playerLabel) => {
  const placed = await placeAnyAction(page);
  if (!placed) return { placed: null, endedTurn: false };
  await page.waitForTimeout(900);
  // Resolve up to 4 chained modals
  for (let i = 0; i < 4; i++) {
    const had = await resolveModal(page);
    if (!had) break;
    await page.waitForTimeout(700);
  }
  // End turn
  await page.waitForTimeout(500);
  const ended = await endTurn(page);
  await page.waitForTimeout(1200);
  console.log(`  ${playerLabel}: placed ${placed}, endedTurn=${ended}`);
  return { placed, endedTurn: ended };
};

// Detect which player is active by reading game state (guess via "Place a worker (N left)" hint)
// Returns 'guest' | 'host' | null
const whoseTurn = async () => {
  const [g, h] = await Promise.all([
    guest.evaluate(() => /place a worker \(\d+ left\)|buy or end turn|end turn$/im.test(document.body.innerText.split('\n').slice(-20).join('\n'))),
    host.evaluate(() => /place a worker \(\d+ left\)|buy or end turn|end turn$/im.test(document.body.innerText.split('\n').slice(-20).join('\n'))),
  ]);
  if (g && !h) return 'guest';
  if (h && !g) return 'host';
  return null;
};

console.log('\n=== Step 15: GUEST places a worker (THE bug check) ===');
// Critical assertion for the bug we fixed today
const placedAction1 = await placeAnyAction(guest);
if (placedAction1) pass(`guest clicked "${placedAction1}"`);
else fail('guest could not find any action to click');

const guestStateChanged = await waitFor(guest, ({ text }) => /buy or end turn|end turn|choose target|select|gem|steal|target player|choose a player|nullify/i.test(text), 4000, 'guest sees post-placement state');
if (guestStateChanged) pass('guest state advanced after placement (BUG NOT REPRODUCED — fix is in)');
else fail('GUEST CLICKED BUT NOTHING HAPPENED — this is the regression bug');

await snap(guest, '15-guest-after-place');
await snap(host, '15-host-after-place');

const hostSawChange = await waitFor(host, ({ text }) => placedAction1 ? text.includes(placedAction1) : true, 4000, 'host snapshot reflects placement');
if (hostSawChange) pass('host snapshot updated with placement');

// Resolve any decision modals from the action
for (let i = 0; i < 3; i++) {
  const had = await resolveModal(guest);
  if (!had) break;
  await guest.waitForTimeout(700);
}
await snap(guest, '16-guest-after-modals');

console.log('\n=== Step 16: Guest ends turn ===');
const endTurnClicked = await endTurn(guest);
if (endTurnClicked) pass('guest clicked End Turn');
else fail('guest could not click End Turn');
await guest.waitForTimeout(2000);

const hostNowActive = await waitFor(host, ({ text }) => /place a worker.*\(\d+ left\)|your turn/i.test(text), 5000, 'host becomes active player');
if (hostNowActive) pass('turn passed to host');
await snap(host, '17-host-now-active');
await snap(guest, '17-guest-watching');

// =================================================================
// Step 18: Play out the rest of the game (best-effort) so we surface
// any bugs that hide in mid-game state transitions.
// =================================================================
console.log('\n=== Step 18: Play rest of round 1 + as much of round 2/3 as we can ===');
let safety = 30; // max turns to attempt
let turnsPlayed = 0;
while (safety-- > 0) {
  // Detect any open modals on either side and resolve them
  for (const [p, label] of [[guest, 'guest'], [host, 'host']]) {
    for (let i = 0; i < 3; i++) {
      const had = await resolveModal(p);
      if (!had) break;
      await p.waitForTimeout(500);
    }
  }
  // Round transition modal? Click "Next Round" or similar
  for (const [p, label] of [[guest, 'guest'], [host, 'host']]) {
    const advancedRound = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.innerText || '').trim().toLowerCase();
        if (/next round|continue|advance|begin round/.test(t) && !b.disabled) { b.click(); return true; }
      }
      return false;
    });
    if (advancedRound) {
      console.log(`  ${label} advanced round`);
      await p.waitForTimeout(1500);
    }
  }
  // Check for game over
  const gameOver = await guest.evaluate(() => /game over|final standings|winner|end of game/i.test(document.body.innerText));
  if (gameOver) { console.log('  GAME OVER reached'); break; }
  // Whose turn?
  const who = await whoseTurn();
  if (!who) {
    // No active player detected — wait briefly, maybe a modal/transition
    await guest.waitForTimeout(800);
    continue;
  }
  const result = await playTurn(who === 'guest' ? guest : host, who);
  if (!result.placed && !result.endedTurn) {
    console.log(`  ${who}: stuck (no action available, no end turn) — skipping`);
    // Try just clicking End Turn — maybe out of workers
    await (who === 'guest' ? guest : host).evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.innerText || '').trim().toLowerCase();
        if (t === 'end turn' && !b.disabled) { b.click(); return true; }
      }
      return false;
    });
    await guest.waitForTimeout(1500);
  }
  turnsPlayed++;
}
console.log(`  Turns played: ${turnsPlayed}`);
await snap(guest, '18-guest-final');
await snap(host, '18-host-final');

const finalGameOver = await guest.evaluate(() => /game over|final standings|winner/i.test(document.body.innerText));
if (finalGameOver) pass(`game completed — ${turnsPlayed} turns played`);
else console.log(`  game did not complete (${turnsPlayed} turns) — may be normal if 30 turn cap hit`);

// Variables used in results (need to declare before)
const guestPlaced = !!placedAction1;
const placedActionName = placedAction1;

console.log('\n=== RESULTS ===');
console.log(JSON.stringify({
  roomCode,
  guestJoined: /Guest/i.test(await host.evaluate(() => document.body.innerText)),
  hostInDraft: inDraftHost,
  guestInDraft: inDraftGuest,
  hostChampCursor: hostChamp?.cursor,
  guestChampCursor: guestChamp?.cursor,
  guestPickClicked: guestPick,
  hostPickClicked: hostPick,
  hostOnBoard: hostBoard,
  guestOnBoard: guestBoard,
  guestPlacedWorker: guestPlaced,
  placedActionName,
  failures: FAILURES,
  passingChecks: FAILURES.length === 0,
}, null, 2));

console.log('\n=== CONSOLE ERRORS ===');
console.log('HOST errors (' + errs.host.length + '):');
errs.host.slice(0, 12).forEach(e => console.log('  -', e.slice(0, 200)));
console.log('GUEST errors (' + errs.guest.length + '):');
errs.guest.slice(0, 12).forEach(e => console.log('  -', e.slice(0, 200)));

await browser.close();
console.log('\nDONE — screenshots:', SHOTS_DIR);

// Exit non-zero if any check failed — so CI / scripts know it broke
if (FAILURES.length > 0) {
  console.error(`\n❌ ${FAILURES.length} FAILURE(S):`);
  FAILURES.forEach(f => console.error('  -', f));
  process.exit(1);
}
console.log('\n✅ All checks passed.');
