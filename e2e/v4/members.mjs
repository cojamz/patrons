// E2E: a player's members, clearly, and using one, obviously (Cory, 2026-10-15: the seat hover "should cleanly show a list
// of member ability/passives, if they've been activated … I still don't know how to activate a member / the UI for it").
// A saved hot-seat game (e2e/v4/lib/members-save.mjs): P1 holds eleven members of every kind on a Gold/Echo/Trading/
// Purple table and is about to place in round I. Build-failing assertions:
//  (m1) your seat card is your members: one row each with its whole ability (every word of the card's text, never cut:
//       no ellipsis, no clipping), no Followers / Has / Last moves rows, whole on screen (a long list scrolls inside);
//  (m2) a member you can use now is lit in your seat (Lottery Winner, Heiress); one already used reads
//       "used" (Speculator); one the engine would refuse now stays unlit (Pawnbroker, nothing to sell); switches show
//       their state (Midas on, Translator off) in the seat and in the seat card;
//  (m3) the lit member's hover has a "Use: +7 ●" button that works: the pointer can move onto it, a click uses it (gold
//       up by what it said, in the saved game), pieces fly, and it reads "used" in the seat, its hover and the seat card;
//  (m4) the seat card's own Use button works too (Heiress: +1 white per member);
//  (m5) the prompt names what you can use once, quietly, and only what would do something;
//  (m6) a rival's seat card lists their members with no Use buttons;
//  (m7) w2b #20: every seat's card opens right beside its seat (pointing at its leader or its name), level with it,
//       whole on screen; never docked away over the wheel;
//  (m8) w2b #19: a use worth nothing now (Safecracker, no rival holds 2 magenta) is never lit or named in the prompt;
//       its row and hover read a muted "Use: +0" with the reason;
//  (m9) w2b #21: a rival's use still in hand is marked on their seat (P2's Stunt Double, subdued); a seat no one can
//       steal from this round says "safe this round" (P3 lies low), in its seat and its card.
// Screenshots go to $V4_SHOTS (default /tmp/patrons-shots/v4/members/).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { membersSave, HAND } from './lib/members-save.mjs';
import { cardDef } from '../../src/engine/v4/index.js';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/members`;
mkdirSync(SHOTS, { recursive: true });
const base = process.env.V4_URL || 'http://localhost:5180';
const fails = [];
const fail = (msg, step) => fails.push(`[${step}] ${msg}`);

const { save, roundStart, uids } = membersSave();
const s0 = save.state;
const texts = Object.fromEntries(HAND.map(id => [id, cardDef(s0, uids[id]).text]));
// the words of a sentence, as the screen prints them: resource and follower words become marks, so compare the rest
const norm = t => String(t).replace(/(?<![A-Za-z])(gold|green|white|purple|red|blue|silver|yellow|magenta|any|followers?)(?![A-Za-z])/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state);
const away = async () => { await page.mouse.move(4, 690); await page.waitForTimeout(220); };
// dy: a seat's head is pointed at by its leader (its left end), where nothing else on the chair overlaps it
const pointAt = async (sel, dy = null) => {
  const el = await page.$(sel);
  if (!el) throw new Error(`nothing on screen matches ${sel}`);
  const b = await el.boundingBox();
  await page.mouse.move(dy == null ? b.x + b.width / 2 : b.x + Math.min(24, b.width / 2), b.y + (dy == null ? b.height / 2 : Math.min(dy, b.height / 2)), { steps: 4 });
};
const seatCard = pid => page.evaluate(id => {
  const L = document.querySelector('[data-hover-layer][data-open="1"]');
  const c = L && L.querySelector(`[data-seat-card="${id}"]`);
  if (!c) return null;
  const lb = L.getBoundingClientRect(), list = c.querySelector('.mu-list');
  return {
    text: c.innerText,
    inView: lb.top >= 0 && lb.bottom <= innerHeight + 0.5 && lb.left >= 0 && lb.right <= innerWidth + 0.5,
    scrolls: !!list && list.scrollHeight > list.clientHeight + 1 ? getComputedStyle(list).overflowY : 'fits',
    rows: [...c.querySelectorAll('[data-member-row]')].map(r => {
      const a = r.querySelector('[data-ability]'), st = getComputedStyle(a);
      return {
        id: r.dataset.memberRow, state: r.dataset.state || '', ability: a.textContent,
        cut: a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1 || st.textOverflow === 'ellipsis' || st.whiteSpace === 'nowrap' || st.webkitLineClamp !== 'none' && st.webkitLineClamp !== '',
        tag: (r.querySelector('.mu-tag') || {}).textContent || '', use: (r.querySelector('[data-use]') || {}).textContent || '',
        sw: (r.querySelector('[data-switch]') || {}).dataset?.switch || '',
        idle: !!r.querySelector('[data-use][data-idle]'), why: (r.querySelector('[data-use]') || {}).title || '',
      };
    }),
  };
}, pid);

try {
  // the build's own stamp (a new game's), so the hand-made save resumes in this build
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
  const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
  save.state.build = stamp; roundStart.state.build = stamp;
  // seeded before the app's own scripts run: leaving the running game saves it on the way out (saved.js, pagehide), so
  // a save written from the old page would be overwritten; once only (a flag in this tab's sessionStorage)
  await page.addInitScript(([v, rs]) => {
    if (sessionStorage.getItem('members-seeded')) return;
    localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs));
    sessionStorage.setItem('members-seeded', '1');
  }, [save, roundStart]);
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot.can');
  await page.waitForTimeout(600);
  await away();

  // (m2) the seat: lit, used, refused, switches
  const fig = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cult="0"] .cs-member')].map(m => [m.dataset.member, {
    state: m.dataset.state || '', lit: m.classList.contains('ready'), sw: (m.querySelector('[data-switch]') || {}).dataset?.switch || '',
  }])));
  for (const id of ['gold.jackpot', 'trading.heiress']) if (!fig[id] || !fig[id].lit || fig[id].state !== 'ready') fail(`${id} isn't lit in your seat though you can use it now: ${JSON.stringify(fig[id])}`, 'm2');
  if (!fig['gold.speculator'] || fig['gold.speculator'].state !== 'used' || fig['gold.speculator'].lit) fail(`Speculator (used) doesn't read used in your seat: ${JSON.stringify(fig['gold.speculator'])}`, 'm2');
  if (fig['trading.pawnbroker'] && fig['trading.pawnbroker'].lit) fail('Pawnbroker is lit, but using it now would do nothing (no loose followers)', 'm2');
  if (fig['thieves.bigscore'] && fig['thieves.bigscore'].lit) fail('Safecracker is lit, but using it now gives 0', 'm8');
  // (m9) a rival's loaded use, subdued; the seat that lies low says so
  const marks = await page.evaluate(() => ({
    stunt: (() => { const m = document.querySelector('[data-cult="1"] .cs-member[data-member="echo.hourglass"]'); return m ? { loaded: m.classList.contains('loaded'), ready: m.classList.contains('ready'), filter: getComputedStyle(m.querySelector('.sprite')).filter } : null; })(),
    pincher: (() => { const m = document.querySelector('[data-cult="1"] .cs-member[data-member="gold.thrift"]'); return m ? m.classList.contains('loaded') : null; })(),
    safe: [0, 1, 2, 3].map(id => !!document.querySelector(`[data-cult="${id}"] [data-safe]`) && /safe this round/.test(document.querySelector(`[data-cult="${id}"] [data-safe]`).textContent)),
  }));
  if (!marks.stunt || !marks.stunt.loaded || marks.stunt.ready || !/drop-shadow/.test(marks.stunt.filter)) fail(`P2's Stunt Double (a use in hand) isn't marked on P2's seat: ${JSON.stringify(marks.stunt)}`, 'm9');
  if (marks.pincher) fail('P2\'s Penny Pincher (no use) is marked as a use in hand', 'm9');
  if (JSON.stringify(marks.safe) !== JSON.stringify([false, false, true, false])) fail(`"safe this round" on seats ${JSON.stringify(marks.safe)} (want only P3's)`, 'm9');
  if (!fig['gold.midas'] || fig['gold.midas'].sw !== 'on') fail(`Midas's switch in your seat: ${JSON.stringify(fig['gold.midas'])}`, 'm2');
  if (fig['echo.translator'] && fig['echo.translator'].sw !== 'off') fail(`Translator's switch in your seat: ${JSON.stringify(fig['echo.translator'])}`, 'm2'); // it may be folded into "+N"
  const lit = await page.$$eval('.lt-cult-seat .cs-member.ready', els => els.map(e => e.closest('[data-cult]').dataset.cult));
  if (lit.some(c => c !== '0')) fail(`a rival's member is lit: seats ${lit.join(',')}`, 'm2');

  // (m5) the prompt
  const sub = await page.evaluate(() => document.querySelector('[data-prompt-sub]')?.textContent || '');
  if (!/\buse\b/.test(sub) || /Pawnbroker|Speculator|Safecracker/.test(sub)) fail(`the prompt's use line: "${sub}"`, 'm5');

  // (m1) your seat card
  await pointAt('[data-cult="0"] .cs-head', 14);
  await page.waitForTimeout(250);
  let sc = await seatCard(0);
  await page.screenshot({ path: `${SHOTS}/1-your-seat-card.png` });
  if (!sc) fail('hovering your seat opened no seat card', 'm1');
  else {
    if (/\b(Followers|Has|Last moves)\b/.test(sc.text)) fail(`the seat card still repeats the seat: "${(sc.text.match(/\b(Followers|Has|Last moves)\b/) || [])[0]}"`, 'm1');
    if (!sc.inView) fail('the seat card runs off the window', 'm1');
    if (sc.scrolls !== 'fits' && !/auto|scroll/.test(sc.scrolls)) fail(`the seat card's list overflows without scrolling (${sc.scrolls})`, 'm1');
    for (const id of HAND) {
      const r = sc.rows.find(x => x.id === id);
      if (!r) { fail(`${id} has no row in your seat card`, 'm1'); continue; }
      if (norm(r.ability) !== norm(texts[id])) fail(`${id}'s ability isn't its whole text: "${r.ability}" vs "${texts[id]}"`, 'm1');
      if (r.cut) fail(`${id}'s ability is cut off`, 'm1');
    }
    const row = id => sc.rows.find(x => x.id === id) || {};
    if (row('gold.speculator').state !== 'used' || row('gold.speculator').tag !== 'used') fail(`Speculator's row: ${JSON.stringify(row('gold.speculator'))}`, 'm1');
    if (!/^Use: \+7/.test(row('gold.jackpot').use)) fail(`Lottery Winner's row has no "Use: +7" button: ${JSON.stringify(row('gold.jackpot'))}`, 'm1');
    if (row('trading.pawnbroker').use) fail('Pawnbroker offers a Use button that would do nothing', 'm1');
    const zero = row('thieves.bigscore');
    if (zero.state !== 'idle' || zero.use !== 'Use: +0' || !zero.idle || !/magenta/.test(zero.why)) fail(`Safecracker (worth 0 now) in the seat card: ${JSON.stringify(zero)}`, 'm8');
    if (row('gold.midas').sw !== 'on' || row('echo.translator').sw !== 'off') fail(`switches in the seat card: Midas ${row('gold.midas').sw}, Translator ${row('echo.translator').sw}`, 'm1');
    if (row('gold.tycoon').tag !== 'scores at game end') fail(`Tycoon's tag: "${row('gold.tycoon').tag}"`, 'm1');
  }
  await away();

  // (m3) the lit member's hover: its Use button, reachable and working
  const before = await saved();
  const flown = () => page.evaluate(() => (window.__patronsPieces || 0) + (window.__patronsFlights || 0)); // flight.js, director.js
  const pieces0 = await flown();
  await pointAt('[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig');
  await page.waitForTimeout(300);
  const btn = await page.$('[data-tip-body] [data-use]');
  if (!btn) fail('the lit member\'s hover has no Use button', 'm3');
  else {
    const label = (await btn.textContent()).trim();
    if (!/^Use: \+7/.test(label)) fail(`the hover's button reads "${label}" (want "Use: +7 …")`, 'm3');
    await page.screenshot({ path: `${SHOTS}/2-member-hover.png` });
    const b = await btn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); // across the gap from the figure to the card
    await page.waitForTimeout(120);
    if (!(await page.$('[data-tip-body] [data-use]'))) fail('the member\'s hover closed while the pointer moved onto its Use button', 'm3');
    await page.mouse.down(); await page.mouse.up();
    await page.waitForFunction(m => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves > m; } catch { return false; } }, before.moves, { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/3-use-flight.png` });
    const after = await saved();
    const u = uids['gold.jackpot'];
    if (!after.cards[u].used) fail('clicking Use didn\'t use Lottery Winner', 'm3');
    if (after.players[0].res.gold - before.players[0].res.gold !== 7) fail(`Lottery Winner gave ${after.players[0].res.gold - before.players[0].res.gold} gold, its button said +7`, 'm3');
    await page.waitForFunction(n => (window.__patronsPieces || 0) + (window.__patronsFlights || 0) > n, pieces0, { timeout: 3000 }).catch(() => {});
    const pieces = await flown();
    if (!(pieces > pieces0)) fail('nothing flew when Lottery Winner was used', 'm3');
    await away();
    const st = await page.evaluate(() => { const m = document.querySelector('[data-cult="0"] .cs-member[data-member="gold.jackpot"]'); return m ? { state: m.dataset.state || '', lit: m.classList.contains('ready') } : null; });
    if (!st || st.state !== 'used' || st.lit) fail(`after use, Lottery Winner in your seat: ${JSON.stringify(st)}`, 'm3');
    await pointAt('[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig');
    await page.waitForTimeout(300);
    const hov = await page.evaluate(() => document.querySelector('[data-tip-body]')?.innerText || '');
    if (!/\bused\b/.test(hov) || /Use:/.test(hov)) fail(`after use, its hover reads: "${hov.replace(/\s+/g, ' ')}"`, 'm3');
    await away();
    await pointAt('[data-cult="0"] .cs-head', 14);
    await page.waitForTimeout(250);
    sc = await seatCard(0);
    const r = sc && sc.rows.find(x => x.id === 'gold.jackpot');
    if (!r || r.state !== 'used' || r.tag !== 'used' || r.use) fail(`after use, its seat card row: ${JSON.stringify(r)}`, 'm3');
    await page.screenshot({ path: `${SHOTS}/4-seat-card-after.png` });

    // (m4) the seat card's own button: Heiress, +1 white per member
    const hb = await page.$('[data-hover-layer][data-open="1"] [data-member-row="trading.heiress"] [data-use]');
    if (!hb) fail('Heiress\'s row in the seat card has no Use button', 'm4');
    else {
      const bb = await hb.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 10 });
      await page.waitForTimeout(120);
      if (!(await page.$('[data-hover-layer][data-open="1"] [data-seat-card="0"]'))) fail('the seat card closed while the pointer moved onto its Use button', 'm4');
      const s1 = await saved();
      await page.mouse.down(); await page.mouse.up();
      await page.waitForFunction(m => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves > m; } catch { return false; } }, s1.moves, { timeout: 4000 }).catch(() => {});
      const s2 = await saved();
      const n = s1.players[0].members.length;
      if (!s2.cards[uids['trading.heiress']].used || s2.players[0].res.white - s1.players[0].res.white !== n) fail(`Heiress from the seat card: used ${!!s2.cards[uids['trading.heiress']].used}, white +${s2.players[0].res.white - s1.players[0].res.white} (want +${n})`, 'm4');
    }
  }
  await away();

  // (m8) Safecracker's own hover: muted, with the reason
  await pointAt('[data-cult="0"] .cs-member[data-member="thieves.bigscore"] .fig');
  await page.waitForTimeout(300);
  const sh = await page.evaluate(() => { const b = document.querySelector('[data-tip-body] [data-use]'); const w = document.querySelector('[data-tip-body] [data-idle-why]'); return b ? { text: b.textContent.trim(), idle: b.dataset.idle === '1', bg: getComputedStyle(b).backgroundColor, why: w ? w.textContent : '' } : null; });
  if (!sh || !sh.idle || sh.text !== 'Use: +0' || !/rgba\(0, 0, 0, 0\)|transparent/.test(sh.bg) || !/Nothing to gain now: .*magenta/.test(sh.why)) fail(`Safecracker's hover (worth 0 now): ${JSON.stringify(sh)}`, 'm8');
  else await page.screenshot({ path: `${SHOTS}/6-use-worth-nothing.png` });
  await away();

  // (m7) every seat's card beside its seat, from its leader and from its name
  for (const pid of [0, 1, 2, 3]) {
    for (const part of ['.cs-leader', '.cs-who']) {
      await away();
      if (!(await page.$(`[data-cult="${pid}"] ${part}`))) { fail(`seat ${pid} has no ${part}`, 'm7'); continue; }
      await pointAt(`[data-cult="${pid}"] ${part}`);
      await page.waitForTimeout(250);
      const r = await page.evaluate(id => {
        const L = document.querySelector('[data-hover-layer][data-open="1"]');
        if (!L || !L.querySelector(`[data-seat-card="${id}"]`)) return null;
        const a = L.getBoundingClientRect(), s = document.querySelector(`[data-cult="${id}"]`).getBoundingClientRect();
        return { gap: Math.round(Math.max(a.left - s.right, s.left - a.right)), level: a.top <= s.bottom && a.bottom >= s.top, inView: a.top >= 0 && a.left >= 0 && a.bottom <= innerHeight + 0.5 && a.right <= innerWidth + 0.5 };
      }, pid);
      if (!r) { fail(`pointing at seat ${pid}'s ${part} opened no seat card`, 'm7'); continue; }
      if (r.gap < 0 || r.gap > 16 || !r.level) fail(`seat ${pid}'s card (from ${part}) isn't right beside the seat: ${JSON.stringify(r)}`, 'm7');
      if (!r.inView) fail(`seat ${pid}'s card runs off the window`, 'm7');
      if (pid === 2 && part === '.cs-leader') {
        const safe = await page.evaluate(() => document.querySelector('[data-hover-layer][data-open="1"] [data-safe]')?.textContent || '');
        if (!/this round/.test(safe)) fail(`P3's card doesn't say it's safe from steals this round: "${safe}"`, 'm9');
        await page.screenshot({ path: `${SHOTS}/7-beside-the-seat.png` });
      }
    }
  }
  await away();

  // (m6) a rival's card
  await pointAt('[data-cult="1"] .cs-head', 14);
  await page.waitForTimeout(250);
  const rc = await seatCard(1);
  await page.screenshot({ path: `${SHOTS}/5-rival-seat-card.png` });
  if (!rc) fail('hovering P2\'s seat opened no seat card', 'm6');
  else {
    for (const id of ['gold.thrift', 'echo.hourglass']) if (!rc.rows.some(x => x.id === id)) fail(`P2's seat card doesn't list ${id}`, 'm6');
    if (rc.rows.some(x => x.use)) fail('P2\'s seat card offers you a Use button', 'm6');
  }
  if (errors.length) fail(`page errors: ${errors.slice(0, 3).join(' | ')}`, 'page');
} catch (e) {
  fail(`crashed: ${e.message}`, 'run');
} finally {
  await browser.close();
}

if (fails.length) {
  console.error(`members: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log('members: ok (every ability in full; lit, used, worth-nothing and switch states; Use from the hover and the seat card; cards beside their seats; rival uses in hand and safe seats marked)');
