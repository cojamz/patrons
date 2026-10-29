import { browserPath, launchBrowser } from './lib/browser.mjs';
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
//  (m7) w2b #20, w3a A8: every seat's card opens right next to what's pointed at (its leader, its name), level with
//       it, whole on screen; never docked away over the wheel;
//  (m8) w2b #19, w4b #20: a use worth nothing now (Safecracker, no rival holds 2 magenta) is never lit or named in the
//       prompt, and has no button anywhere: its row says "nothing to gain now", its hover says why;
//  (m10) w2a #1, #44, #45, #16: a use's result shows at the member (even +0) and the prompt drops it at once; a usable
//       member has a warm ring and a small lift; its card opens beside your seat; a 13-member seat card scrolls on screen.
//  (m11) a click always acts on what's under the pointer, at once: with your seat's or your member's card open, a
//       click on a lit space (the one under the card, if any) reaches the space, the card is gone the next frame, and
//       the minion lands.
//  (m12) w3b #47: leaving the member downward on the way to its card doesn't close it;
//  (m13) w3b #39/#47, A30: the follower total opens a breakdown adding up to it; a seat's body and resources open its card;
//       a rival's card says what it could buy now; one card on screen at a time.
//  (m14) w4b #2: one move onto a seat, its body or its follower number, and no more, opens its card within 150ms.
//  (m9) w2b #21: a rival's use still in hand is marked on their seat (P2's Raider, subdued); a seat no one can
//       steal from this round shows the "safe this round" shield, named in its hover (P3 lies low), and says so in its card.
// Screenshots go to $V4_SHOTS (default /tmp/patrons-shots/v4/members/).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { membersSave, HAND } from './lib/members-save.mjs';
import { cardDef, memberCount } from '../../src/engine/v4/index.js';
import { seedSave } from './lib/seed.mjs';
import { HOVER_DELAY_MS } from '../../src/v4/game/hoverDelay.js';

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

const browser = await launchBrowser({ executablePath: browserPath });
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
  await seedSave(page, save, { roundStart }); // before the app runs, once per tab (lib/seed.mjs)
  await page.goto(`${base}/?botDelay=300&intro=0`);
  await page.waitForSelector('.lt-wheel, [data-home="resume"]');
  if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot.can');
  await page.waitForTimeout(600);
  await away();

  // (m2) the seat: lit, used, refused, switches
  const fig = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cult="0"] .cs-member')].map(m => [m.dataset.member, {
    state: m.dataset.state || '', lit: m.classList.contains('ready'), sw: (m.querySelector('[data-switch]') || {}).dataset?.switch || '',
    // w2a #44: a warm ring and a small lift, not a faint glow
    ring: /rgba?\(/.test(getComputedStyle(m.querySelector('.fig'), '::before').boxShadow || ''), lift: getComputedStyle(m.querySelector('.fig')).transform,
  }])));
  for (const id of ['gold.jackpot', 'trading.heiress']) if (fig[id] && (!fig[id].ring || !/matrix\(1, 0, 0, 1, 0, -\d/.test(fig[id].lift))) fail(`${id} is lit without its warm ring and lift: ${JSON.stringify(fig[id])}`, 'm2');
  for (const id of ['gold.jackpot', 'trading.heiress']) if (!fig[id] || !fig[id].lit || fig[id].state !== 'ready') fail(`${id} isn't lit in your seat though you can use it now: ${JSON.stringify(fig[id])}`, 'm2');
  // (the row shows as many figures as fit: a used member or a switch may be folded into "+N"; the seat card lists them)
  if (fig['gold.speculator'] && (fig['gold.speculator'].state !== 'used' || fig['gold.speculator'].lit)) fail(`Speculator (used) doesn't read used in your seat: ${JSON.stringify(fig['gold.speculator'])}`, 'm2');
  if (fig['trading.pawnbroker'] && fig['trading.pawnbroker'].lit) fail('Pawnbroker is lit, but using it now would do nothing (no loose followers)', 'm2');
  if (fig['thieves.bigscore'] && fig['thieves.bigscore'].lit) fail('Safecracker is lit, but using it now gives 0', 'm8');
  // (m9) a rival's loaded use, subdued; the seat that lies low says so
  const marks = await page.evaluate(() => ({
    stunt: (() => { const m = document.querySelector('[data-cult="1"] .cs-member[data-member="trading.raider"]'); return m ? { loaded: m.classList.contains('loaded'), ready: m.classList.contains('ready'), filter: getComputedStyle(m.querySelector('.sprite')).filter } : null; })(),
    pincher: (() => { const m = document.querySelector('[data-cult="1"] .cs-member[data-member="gold.thrift"]'); return m ? m.classList.contains('loaded') : null; })(),
    safe: [0, 1, 2, 3].map(id => !!document.querySelector(`[data-cult="${id}"] [data-safe]`) && /safe this round/i.test(document.querySelector(`[data-cult="${id}"] [data-safe]`).getAttribute('aria-label') + ' ' + document.querySelector(`[data-cult="${id}"] [data-safe]`).title)),
  }));
  if (!marks.stunt || !marks.stunt.loaded || marks.stunt.ready || !/drop-shadow/.test(marks.stunt.filter)) fail(`P2's Raider (a use in hand) isn't marked on P2's seat: ${JSON.stringify(marks.stunt)}`, 'm9');
  if (marks.pincher) fail('P2\'s Penny Pincher (no use) is marked as a use in hand', 'm9');
  if (JSON.stringify(marks.safe) !== JSON.stringify([false, false, true, false])) fail(`"safe this round" on seats ${JSON.stringify(marks.safe)} (want only P3's)`, 'm9');
  if (fig['gold.midas'] && fig['gold.midas'].sw !== 'on') fail(`Midas's switch in your seat: ${JSON.stringify(fig['gold.midas'])}`, 'm2');
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
    // w4b #20: no button that does nothing; the quiet state says so, the reason in its hover
    if (zero.state !== 'idle' || zero.use || zero.tag !== 'nothing to gain now') fail(`Safecracker (worth 0 now) in the seat card: ${JSON.stringify(zero)}`, 'm8');
    if (row('gold.midas').sw !== 'on' || row('echo.translator').sw !== 'off') fail(`switches in the seat card: Midas ${row('gold.midas').sw}, Translator ${row('echo.translator').sw}`, 'm1');
    // a game-end scorer carries no tag since faee2109 (the hover lists drop "scores at game end"/"pays at round start":
    // the ability says it); its whole ability names the game end instead
    if (row('gold.tycoon').tag || !/game end/i.test(row('gold.tycoon').ability || '')) fail(`Tycoon's row: tag "${row('gold.tycoon').tag}", ability "${row('gold.tycoon').ability}"`, 'm1');
  }
  await away();

  // (m3) the lit member's hover: its Use button, reachable and working
  const before = await saved();
  const flown = () => page.evaluate(() => (window.__patronsPieces || 0) + (window.__patronsFlights || 0)); // flight.js, director.js
  const pieces0 = await flown();
  await pointAt('[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig');
  await page.waitForTimeout(300);
  const btn = await page.waitForSelector('[data-tip-body] [data-use]', { timeout: 1500 }).catch(() => null);
  if (!btn) fail('the lit member\'s hover has no Use button', 'm3');
  else {
    const label = (await btn.textContent()).trim();
    // w3a A8 (Cory: "hovers open right next to what you point at"): the member's card sits right next to the member,
    // level with it, and doesn't cover the member itself
    // w4a #36: and it opens above or below the row, never over the members beside it
    const near = await page.evaluate(() => {
      const t = document.querySelector('[data-tip-body]').closest('.popover').getBoundingClientRect(), f = document.querySelector('[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig').getBoundingClientRect();
      const ov = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const others = [...document.querySelectorAll('[data-cult="0"] .cs-member .fig')].map(e => e.getBoundingClientRect()).filter(r => Math.abs(r.left - f.left) > 2);
      return { gap: Math.round(Math.max(t.left - f.right, f.left - t.right, t.top - f.bottom, f.top - t.bottom)), over: ov(t, f), neighbours: others.reduce((s2, r) => s2 + ov(t, r), 0) };
    });
    if (near.gap > 16 || near.over > 0) fail(`the member's card isn't right next to the member: ${JSON.stringify(near)}`, 'm3');
    // (covering the members beside it is fine: Cory, 2026-10-21, "eh delete that one" about moving the card off a second row)
    if (!/^Use: \+7/.test(label)) fail(`the hover's button reads "${label}" (want "Use: +7 …")`, 'm3');
    await page.screenshot({ path: `${SHOTS}/2-member-hover.png` });
    const b = await btn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); // across the gap from the figure to the card
    await page.waitForTimeout(120);
    if (!(await page.$('[data-tip-body] [data-use]'))) fail('the member\'s hover closed while the pointer moved onto its Use button', 'm3');
    await page.mouse.down(); await page.mouse.up();
    await page.waitForFunction(m => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves > m; } catch { return false; } }, before.moves, { timeout: 4000 }).catch(() => {});
    // w2a #1: the result shows at the member, and the prompt stops naming it at once
    const shown = await page.waitForFunction(() => document.querySelector('[data-cult="0"] [data-use-result]')?.dataset.useResult || null, null, { timeout: 1500 }).then(h => h.jsonValue(), () => null);
    if (shown !== '+7 gold') fail(`the use's result at the member reads ${JSON.stringify(shown)} (want "+7 gold")`, 'm3');
    // the use plays out whole before the view moves on (decisions 2026-10-15 22:40: a chain's view holds until it ends),
    // then the prompt stops naming it
    await page.waitForFunction(() => !document.querySelector('.app.game[data-chain="1"]'), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(120);
    const sub2 = await page.evaluate(() => document.querySelector('[data-prompt-sub]')?.textContent || '');
    if (/Lottery Winner/.test(sub2)) fail(`after the use the prompt still names it: "${sub2}"`, 'm3');
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
    await page.waitForFunction(() => (document.querySelector('[data-tip-body]')?.innerText || '').length > 0, null, { timeout: 1500 }).catch(() => {});
    const hov = await page.evaluate(() => document.querySelector('[data-tip-body]')?.innerText || '');
    if (!/\bused\b/i.test(hov) || /Use:/.test(hov)) fail(`after use, its hover reads: "${hov.replace(/\s+/g, ' ')}"`, 'm3');
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
      // members as the game counts them: a member worth 2 followers counts as 2 (Chefs, Twins, and Heiress herself)
      const n = memberCount(s1, s1.players[0]);
      if (!s2.cards[uids['trading.heiress']].used || s2.players[0].res.white - s1.players[0].res.white !== n) fail(`Heiress from the seat card: used ${!!s2.cards[uids['trading.heiress']].used}, white +${s2.players[0].res.white - s1.players[0].res.white} (want +${n})`, 'm4');
    }
  }
  await away();

  // (m8) Safecracker's own hover: muted, with the reason
  await pointAt('[data-cult="0"] .cs-member[data-member="thieves.bigscore"] .fig');
  await page.waitForTimeout(300);
  await page.waitForFunction(() => !!document.querySelector('[data-tip-body] [data-card]'), null, { timeout: 1500 }).catch(() => {});
  const sh = await page.evaluate(() => { const w = document.querySelector('[data-tip-body] [data-idle-why]'); return { card: !!document.querySelector('[data-tip-body] [data-card]'), button: !!document.querySelector('[data-tip-body] [data-use]'), why: w ? w.textContent : '' }; });
  if (!sh.card || sh.button || !/Nothing to gain now: .*magenta/.test(sh.why)) fail(`Safecracker's hover (worth 0 now) must say why and offer no button: ${JSON.stringify(sh)}`, 'm8');
  else await page.screenshot({ path: `${SHOTS}/6-use-worth-nothing.png` });
  await away();

  // (m7) every seat's card beside its seat, from its leader and from its name
  for (const pid of [0, 1, 2, 3]) {
    for (const part of ['.cs-leader', '.cs-who']) {
      await away();
      if (!(await page.$(`[data-cult="${pid}"] ${part}`))) { fail(`seat ${pid} has no ${part}`, 'm7'); continue; }
      await pointAt(`[data-cult="${pid}"] ${part}`);
      await page.waitForTimeout(250);
      const r = await page.evaluate(([id, sel]) => {
        const L = document.querySelector('[data-hover-layer][data-open="1"]');
        if (!L || !L.querySelector(`[data-seat-card="${id}"]`)) return null;
        // right next to the part pointed at (w3a A8), not the seat's far edge
        const a = L.getBoundingClientRect(), s = document.querySelector(`[data-cult="${id}"] ${sel}`).getBoundingClientRect();
        const list = L.querySelector('.mu-list');
        return { gap: Math.round(Math.max(a.left - s.right, s.left - a.right)), level: a.top <= s.bottom + 24 && a.bottom >= s.top - 24, inView: a.top >= 0 && a.left >= 0 && a.bottom <= innerHeight + 0.5 && a.right <= innerWidth + 0.5,
          scroll: list && list.scrollHeight > list.clientHeight + 1 ? getComputedStyle(list).overflowY : 'fits', rows: L.querySelectorAll('[data-member-row]').length };
      }, [pid, part]);
      if (!r) {
        const seen = await page.evaluate(([id, sel]) => { const L = document.querySelector('[data-hover-layer]'); const t = document.querySelector(`[data-cult="${id}"] ${sel}`).getBoundingClientRect(); const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return `layer open=${L.dataset.open} card=${L.querySelector('[data-hover-card]')?.dataset.hoverCard || '-'}/${L.querySelector('[data-seat-card]')?.dataset.seatCard ?? '-'}; under=${e ? `${e.tagName}.${e.className?.baseVal ?? e.className}` : 'none'}`; }, [pid, part]);
        fail(`pointing at seat ${pid}'s ${part} opened no seat card (${seen})`, 'm7'); continue;
      }
      if (r.gap < 0 || r.gap > 16 || !r.level) fail(`seat ${pid}'s card (from ${part}) isn't right next to it: ${JSON.stringify(r)}`, 'm7');
      if (!r.inView) fail(`seat ${pid}'s card runs off the window`, 'm7');
      if (r.scroll !== 'fits' && !/auto|scroll/.test(r.scroll)) fail(`seat ${pid}'s long list overflows without scrolling`, 'm7');
      if (pid === 3 && part === '.cs-leader') await page.screenshot({ path: `${SHOTS}/8-thirteen-members.png` });
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
    for (const id of ['gold.thrift', 'trading.raider']) if (!rc.rows.some(x => x.id === id)) fail(`P2's seat card doesn't list ${id}`, 'm6');
    if (rc.rows.some(x => x.use)) fail('P2\'s seat card offers you a Use button', 'm6');
  }
  // (m11) a click always acts on what's under the pointer, at once, hover card or not: open a card (your seat's, your
  // member's), then click a lit space, the one the card stands over if there is one; the press must reach the space,
  // the card must be gone by the next frame, and the minion must land
  for (const kind of ['seat', 'member']) {
    const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
    const pg = await ctx.newPage();
    await pg.addInitScript(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
    await pg.goto(`${base}/?botDelay=300&intro=0`);
    await pg.waitForSelector('.lt-wheel, [data-home="resume"]');
    if (!(await pg.$('.lt-wheel'))) await pg.click('[data-home="resume"]');
    await pg.waitForSelector('.lt-wheel .slot.can');
    await pg.waitForTimeout(600);
    const from = kind === 'seat' ? '[data-cult="0"] .cs-leader' : '[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig';
    const fb = await (await pg.$(from)).boundingBox();
    await pg.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 4 });
    await pg.waitForTimeout(350);
    const plan = await pg.evaluate(k => {
      const card = k === 'seat' ? document.querySelector('[data-hover-layer][data-open="1"]') : document.querySelector('[data-tip-body]')?.closest('.popover');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      const slots = [...document.querySelectorAll('.lt-wheel .slot.can .base')].map(e => { const b = e.getBoundingClientRect(); return { key: e.closest('[data-slot]').dataset.slot, x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      // a space under the card's surface, not under one of its buttons (a visible button takes its own click)
      const ctrls = [...card.querySelectorAll('button, [role="switch"]')].map(e => e.getBoundingClientRect());
      const onCtrl = t => ctrls.some(c => t.x >= c.left - 24 && t.x <= c.right + 24 && t.y >= c.top - 24 && t.y <= c.bottom + 24);
      const under = slots.filter(t => t.x > r.left + 4 && t.x < r.right - 4 && t.y > r.top + 4 && t.y < r.bottom - 4 && !onCtrl(t));
      const near = slots.filter(t => !onCtrl(t)).sort((a, b) => Math.hypot(a.x - r.right, a.y - r.top) - Math.hypot(b.x - r.right, b.y - r.top));
      window.__clicks = [];
      addEventListener('pointerdown', () => { requestAnimationFrame(() => { const open = k === 'seat' ? document.querySelector('[data-hover-layer][data-open="1"] [data-seat-card]') : document.querySelector('[data-tip-body]'); const L = document.querySelector('[data-hover-layer]'); window.__clicks.push({ t: 'frame', open: !!open, saw: `layer ${L.dataset.open}/${L.querySelector('[data-hover-card]')?.dataset.hoverCard || '-'}, tips ${document.querySelectorAll('[data-tip-body]').length}` }); }); }, true);
      document.addEventListener('click', e => { window.__clicks.push({ t: 'click', slot: e.target.closest?.('[data-slot]')?.dataset.slot || null, on: (e.target.className?.baseVal ?? e.target.className ?? '').toString().slice(0, 40) }); });
      return { target: under[0] || near[0], covered: !!under[0], moves: Number(document.querySelector('.lt[data-moves]')?.dataset.moves) };
    }, kind);
    if (!plan) { fail(`no ${kind} card opened to test a click past it`, 'm11'); await ctx.close(); continue; }
    await pg.mouse.move(plan.target.x, plan.target.y);
    await pg.mouse.down(); await pg.mouse.up();
    // the first frame after the press, whenever the (busy) machine draws it
    await pg.waitForFunction(() => window.__clicks.some(x => x.t === 'frame'), null, { timeout: 2000 }).catch(() => {});
    const log = await pg.evaluate(() => window.__clicks);
    const click = log.find(x => x.t === 'click'), frame = log.find(x => x.t === 'frame');
    if (!click || click.slot !== plan.target.key) fail(`with your ${kind} card open, a click on space ${plan.target.key}${plan.covered ? ' (under the card)' : ''} landed on ${click ? `"${click.on}"` : 'nothing'}`, 'm11');
    if (!frame || frame.open) fail(`with your ${kind} card open, the card was still up the frame after the press (space ${plan.target.key}${plan.covered ? ', under the card' : ''}; ${frame ? frame.saw : 'no frame'})`, 'm11');
    const landed = await pg.waitForFunction(m => Number(document.querySelector('.lt[data-moves]')?.dataset.moves) > m, plan.moves, { timeout: 5000 }).then(() => true, () => false);
    if (!landed) fail(`with your ${kind} card open, the click on space ${plan.target.key} placed no minion`, 'm11');
    await ctx.close();
  }

  // (m12) w3b #47: leaving the member by the "wrong" route (down first, then over to its card) still finds it open
  {
    const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
    const pg = await ctx.newPage();
    await pg.addInitScript(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
    await pg.goto(`${base}/?botDelay=300&intro=0`);
    await pg.waitForSelector('.lt-wheel, [data-home="resume"]');
    if (!(await pg.$('.lt-wheel'))) await pg.click('[data-home="resume"]');
    await pg.waitForSelector('.lt-wheel .slot.can');
    await pg.waitForTimeout(600);
    const fb = await (await pg.$('[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig')).boundingBox();
    // w4a #36: from one member's card, one move along the row opens the next member's card
    await pg.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 4 });
    await pg.waitForTimeout(350);
    const nb = await pg.evaluate(f => {
      const figs = [...document.querySelectorAll('[data-cult="0"] .cs-member .fig')].map(e => ({ id: e.closest('[data-member]').dataset.member, r: e.getBoundingClientRect() }));
      const next = figs.filter(x => x.r.left > f.x + f.width - 2 && Math.abs(x.r.top - f.y) < 8).sort((a, b) => a.r.left - b.r.left)[0];
      return next ? { id: next.id, x: next.r.left + next.r.width / 2, y: next.r.top + next.r.height / 2 } : null;
    }, fb);
    if (nb) {
      await pg.mouse.move(nb.x, nb.y);
      const opened = await pg.waitForFunction(id => !!document.querySelector(`[data-tip-body] [data-card="${id}"]`), nb.id, { timeout: 600 }).then(() => true, () => false);
      if (!opened) fail(`moving from Lottery Winner to the member beside it (${nb.id}) didn't open its card`, 'm12');
      await pg.mouse.move(4, 690); await pg.waitForTimeout(400);
    }
    await pg.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 4 });
    await pg.waitForTimeout(350);
    const bb = await (await pg.waitForSelector('[data-tip-body] [data-use]', { timeout: 1500 }).catch(() => null))?.boundingBox();
    if (!bb) fail('no Use button on the member\'s card to reach by a detour', 'm12');
    else {
      await pg.mouse.move(fb.x + fb.width / 2, fb.y + fb.height + 18, { steps: 2 }); // down, out of the figure, away from the card
      await pg.waitForTimeout(90);
      await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 5 });
      await pg.waitForTimeout(120);
      if (!(await pg.$('[data-tip-body] [data-use]'))) fail('the member\'s card closed when the pointer left it downward on its way to "Use"', 'm12');
    }
    await ctx.close();
  }

  // (m13) w3b #39, #47, A30: the follower total opens where those followers came from, adding up to it; a seat's body and
  // resource row open its card; a rival's card says what it could buy now; one card on screen at a time
  await away();
  await pointAt('[data-cult="0"] .cs-total');
  await page.waitForTimeout(250);
  const fc = await page.evaluate(() => {
    const L = document.querySelector('[data-hover-layer][data-open="1"]');
    const c = L && L.querySelector('[data-followers-card="0"]');
    if (!c) return null;
    const total = Number(c.querySelector('[data-total]').dataset.total);
    const sum = [...c.querySelectorAll('[data-fol-row] b')].reduce((t, b) => t + Number(b.textContent.replace('−', '-').replace('+', '')), 0);
    const a = L.getBoundingClientRect(), t = document.querySelector('[data-cult="0"] .cs-total').getBoundingClientRect();
    return { total, sum, seat: Number(document.querySelector('[data-cult="0"] .cs-total').dataset.followers), gap: Math.round(Math.max(a.left - t.right, t.left - a.right, a.top - t.bottom, t.top - a.bottom)) };
  });
  if (!fc) fail(`hovering your follower total opened no breakdown (${await page.evaluate(() => { const L = document.querySelector('[data-hover-layer]'); const t = document.querySelector('[data-cult="0"] .cs-total').getBoundingClientRect(); const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return `layer ${L.dataset.open}/${L.querySelector('[data-hover-card]')?.dataset.hoverCard || '-'}, tips ${document.querySelectorAll('[data-tip-body]').length}, under ${e?.tagName}.${(e?.className?.baseVal ?? e?.className ?? '').toString().slice(0, 30)}`; })})`, 'm13');
  else if (fc.total !== fc.seat || fc.sum !== fc.total || fc.gap > 16) fail(`the follower breakdown: ${JSON.stringify(fc)} (rows must add up to the seat's total, next to it)`, 'm13');
  else await page.screenshot({ path: `${SHOTS}/9-followers.png` });
  for (const part of ['.cs-foot', '.cs-crowd']) {
    await away();
    if (!(await page.$(`[data-cult="1"] ${part}`))) continue;
    const pb = await (await page.$(`[data-cult="1"] ${part}`)).boundingBox();
    // its empty edge, not a member figure (a figure opens its own card)
    await page.mouse.move(pb.x + pb.width - 6, pb.y + pb.height / 2, { steps: 3 });
    await page.waitForTimeout(250);
    const sc2 = await seatCard(1);
    if (!sc2) fail(`hovering P2's ${part} opened no seat card`, 'm13');
    else if (part === '.cs-foot') {
      // a rival's card says the resources they hold (Cory, Oct 29: it replaced "Holding N · could recruit about N")
      const res = await page.evaluate(() => document.querySelector('[data-hover-layer][data-open="1"] [data-rival-num="res"] .num')?.textContent || '');
      const want = s0.resources.reduce((t, r) => t + (s0.players[1].res[r] || 0), 0);
      if (Number(res) !== want) fail(`P2's card says resources "${res}" (want ${want})`, 'm13');
    }
  }
  await away();
  await pointAt('[data-cult="3"] .cs-leader');
  await page.waitForTimeout(250);
  if (await page.$('[data-cult="3"] .cs-turn')) {
    await pointAt('[data-cult="3"] .cs-turn');
    await page.waitForTimeout(400);
    // cards up (fading in counts): the hover layer when it holds a card, and every other card on the page's top level
    const cards = await page.evaluate(() => (document.querySelector('[data-hover-layer][data-open="1"]') ? 1 : 0)
      + [...document.querySelectorAll('body > .popover:not([data-hover-layer])')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.left > -1000; }).length);
    if (cards !== 1) fail(`${cards} cards on screen at once after pointing from P4's seat to its turn words (want 1)`, 'm13');
  }

  // (m14) w4b #2: a seat's card always opens for a pointer that simply comes to rest on it: one move onto a seat (its
  // name, its body) or onto its follower number, nothing after, opens its card within 150ms, even right after
  // another seat's card (one with Use buttons) was up
  {
    const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
    const pg = await ctx.newPage();
    await pg.addInitScript(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
    await pg.goto(`${base}/?botDelay=300&intro=0`);
    await pg.waitForSelector('.lt-wheel, [data-home="resume"]');
    if (!(await pg.$('.lt-wheel'))) await pg.click('[data-home="resume"]');
    await pg.waitForSelector('.lt-wheel .slot.can');
    await pg.waitForTimeout(600);
    const centre = async sel => { const b = await (await pg.$(sel)).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    const cases = [
      ['your seat card first, then P3\'s name', '[data-cult="0"] .cs-leader', '[data-cult="2"] .cs-who', 'seat', 2],
      ['P3\'s follower number', null, '[data-cult="2"] .cs-total', 'followers', 2],
      ['P2\'s resource row', null, '[data-cult="1"] .cs-foot', 'seat', 1],
      ['your own name', null, '[data-cult="0"] .cs-who', 'seat', 0],
    ];
    for (const [what, first, sel, kind, pid] of cases) {
      await pg.mouse.move(640, 690); await pg.waitForTimeout(300);
      if (first) { const f = await centre(first); await pg.mouse.move(f.x, f.y, { steps: 3 }); await pg.waitForTimeout(400); }
      const t = await centre(sel);
      // timed in the page, from the pointer's arrival to the card in the page (the test driver's round trips aside)
      await pg.evaluate(([k, id]) => {
        window.__m14 = { at: null, open: null };
        addEventListener('pointerover', () => { if (window.__m14.at == null) window.__m14.at = performance.now(); }, { capture: true, once: true });
        const L = document.querySelector('[data-hover-layer]');
        const mo = new MutationObserver(() => {
          if (window.__m14.open == null && L.dataset.open === '1' && L.querySelector(`[data-${k === 'seat' ? 'seat' : 'followers'}-card="${id}"]`)) { window.__m14.open = performance.now(); mo.disconnect(); }
        });
        mo.observe(L, { attributes: true, childList: true, subtree: true });
      }, [kind, pid]);
      await pg.mouse.move(t.x, t.y); // one move, then the pointer rests
      await pg.waitForFunction(() => window.__m14.open != null, null, { timeout: 1500 }).catch(() => {});
      const m = await pg.evaluate(() => window.__m14);
      // from the end of the hover wait (HOVER_DELAY_MS, Cory 2026-10-15; e971f156), as the other hover gates time it
      const dt = m.open != null && m.at != null ? Math.round(m.open - m.at - HOVER_DELAY_MS) : null;
      if (dt == null) fail(`a single move onto ${what} opened nothing`, 'm14');
      else if (dt > 150) fail(`a single move onto ${what} took ${dt}ms past the hover wait to open its card (want ≤ 150ms)`, 'm14');
    }
    await ctx.close();
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
