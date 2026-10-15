// E2E: every game-meaningful element explains itself (Cory, 2026-10-14: every UI element has a hover with more info,
// long-press/tap on phone), and followers are never a star. Build-failing assertions, at several steps of a real
// hot-seat game (1 person + 3 bots):
//  (a) every visible game element (seats, shop cards, resources, members, leaders/minions, follower marks,
//      follower buys, spaces, contest rules, resource symbols) carries hover info: a title, a hover/tap card
//      (data-tip / aria-haspopup), or (spaces) the board's own space card;
//  (b) hovering a shop card and a board space shows a card; on a touch screen a long-press on a titled element
//      shows its title (the hover's touch twin);
//  (c) no "★" anywhere in the rendered game (followers are the little-person mark);
//  (d) hover cards open within 100ms (p95) and never flicker while sweeping a ring of spaces;
//  (e) a cult member hops when its own trace line appears in the log;
//  (f) no seat sigil shapes anywhere (identity is the leader's emoji and the name);
//  (g) every member in a cult stands on a ground in its sphere's color, so it reads as that sphere;
//  (h) the member deck heads the shop strip: after a refill its count is the engine's pile length (the saved game's
//      state.pile), a refill deals the new card off it, and hovering it shows its card (count, colors adding up);
//  (i) while you place, the space under the pointer ticks "✓ after <space>" on the shop cards it would make
//      affordable (a saved scene where one does: e2e/v4/lib/tick-save.mjs), once its dry run lands;
//  (k) a resource is never color alone: every pip is its shape, every coin (setup, pay) carries its mark, and the
//      setup picker's labels read on its paper (contrast ≥ 4.5);
//  (l) who's winning and who's next: a ranked line of every player under the prompt, and each cult's place in the
//      turn order;
//  (m) the hover card opens right next to what it explains (Cory, 2026-10-15: never a docked spot elsewhere): whole
//      on screen, at the page's top level above every strip, beside or above its target and not over it;
//  (o) the rim: pointing at a quadrant's rule or a leader's emoji opens that quadrant's standings, never a space;
//  (p) a space's card lists every player in its contest line (the 4th never drops off);
//  (q) every shop card and every member in every chair opens its card, whole on screen and on top (Kingpin had
//      none; bottom-seat member cards ran under the shop strip); the pay dialog takes focus (Enter pays) and names
//      each rule-changer bending the price (Penny Pincher, a discount);
//  (n) you are "You": the round summary and the Chronicle never use your seat's name; the summary has no text under 12px.
// Screenshots go to $V4_SHOTS (default /tmp/patrons-shots/v4/info/).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { tickSave } from './lib/tick-save.mjs';
import { richSave } from './lib/rich-save.mjs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/info`;
mkdirSync(SHOTS, { recursive: true });
const base = process.env.V4_URL || 'http://localhost:5180';
const fails = [];
const fail = (msg, step) => fails.push(`[${step}] ${msg}`);

// game-meaningful elements on the Lamplit table (the older Players / QuadrantPanel / SeatRail / Shop / YourTable are gone)
const GAME = [
  '[data-region] [data-uid]', '[data-cult] .cs-head', '[data-cult] [data-res]',
  '[data-leader-ring]', '.fol-mark', '.follower', '.lt-rate', '.fb', '.slot',
  '[data-plaque] .plaque-face', '.contest-tip', '[data-cult] [data-member] .fig', '.res-glyph', '.pip', '.card-name', '.term', '[data-deck]',
  '[data-rank] .rk', '.cs-order',
].join(',');

async function audit(page, step) {
  const r = await page.evaluate(sel => {
    const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const explains = e => {
      if ((e.getAttribute('title') || '').trim()) return true;
      if (e.matches('[data-tip], [aria-haspopup]')) return true;
      if (e.querySelector(':scope > title')) return true; // an SVG symbol with its own <title>
      if (e.matches('.slot')) return true; // the board's space card (checked by hovering below)
      // a symbol inside something that explains itself (a pip in a titled cost) is covered by its parent
      const up = e.parentElement && e.parentElement.closest('[title], [data-tip], [aria-haspopup]');
      return !!(up && up.contains(e) && e.matches('.pip, .res-glyph, .follower, .fol-mark'));
    };
    const miss = [];
    let n = 0;
    for (const e of document.querySelectorAll(sel)) {
      if (!vis(e) || e.closest('[aria-hidden="true"]')) continue;
      n++;
      if (!explains(e)) miss.push(`${e.tagName.toLowerCase()}.${String(e.className && (e.className.baseVal ?? e.className)).split(' ').filter(Boolean).join('.')} "${(e.textContent || '').trim().slice(0, 24)}"`);
    }
    // (f) identity is a leader's emoji and a name: no seat sigils (circle/triangle/square/star) a player can see
    const sigils = [...document.querySelectorAll('.sigil, [class*="sigil"]')].filter(e => vis(e) && !e.closest('[aria-hidden="true"]')).length;
    // (g) every member in a cult reads as its sphere: it carries its sphere and a ground in that color
    const crowd = [...document.querySelectorAll('[data-cult] .cs-member')].filter(vis);
    const pale = crowd.filter(m => { const a = m.querySelector('.aura'); return !a || !/gradient/.test(getComputedStyle(a).backgroundImage) || !m.dataset.sphere; })
      .map(m => m.dataset.member);
    // (k) a resource is never color alone: every pip shows its shape, every coin (setup, pay) its mark inside
    const bare = [...document.querySelectorAll('.pip:not(.wild)')].filter(e => vis(e) && !e.closest('[aria-hidden="true"]') && !e.querySelector('svg.res-glyph')).length;
    const blank = [...document.querySelectorAll('.coin-big, .slot-coin, .tray-coin i')].filter(e => vis(e) && !e.querySelector('[data-coin-mark]')).length;
    // and the setup picker's labels read on their paper (contrast ≥ 4.5)
    const rgb = c => (String(c).match(/[\d.]+/g) || []).map(Number);
    const L = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const bgOf = e => {
      for (let x = e; x; x = x.parentElement) {
        const st = getComputedStyle(x), c = rgb(st.backgroundColor);
        if (c.length >= 3 && (c.length < 4 || c[3] > 0.5)) return c;
        const g = st.backgroundImage.match(/rgba?\([^)]*\)/);
        if (g) return rgb(g[0]);
      }
      return [29, 22, 17];
    };
    const faint = [...document.querySelectorAll('.prompt.choice .token > span')].filter(vis).map(e => {
      const a = L(rgb(getComputedStyle(e).color)), b = L(bgOf(e));
      return { t: e.textContent.trim(), c: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    }).filter(x => x.c < 4.5);
    return { n, miss: [...new Set(miss)].slice(0, 12), star: document.body.innerText.includes('★'), sigils, pale, bare, blank, faint };
  }, GAME);
  if (r.n < 5) fail(`only ${r.n} game elements found (the selectors no longer match the screen?)`, step);
  for (const m of r.miss) fail(`(a) no hover info: ${m}`, step);
  if (r.star) fail('(c) a "★" is on screen', step);
  if (r.sigils) fail(`(f) ${r.sigils} seat sigil(s) on screen`, step);
  for (const m of r.pale) fail(`(g) ${m} has no ground in its sphere's color`, step);
  if (r.bare) fail(`(k) ${r.bare} resource pip(s) drawn as a plain color disc (no shape)`, step);
  if (r.blank) fail(`(k) ${r.blank} coin(s) without the resource's mark inside`, step);
  for (const f of r.faint) fail(`(k) setup label "${f.t}" is hard to read (contrast ${f.c.toFixed(2)})`, step);
  return r.n;
}

// (h) the deck's number against the engine: read the screen and the saved game in one go, when both show the same move
// (m) the open hover card sits next to its target (a selector, or a rect), whole on screen, above every strip
async function anchorCheck(page, what, step, target) {
  const r = await page.evaluate(sel => {
    const L = document.querySelector('[data-hover-layer][data-open="1"]');
    const T = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!L) return null;
    const a = L.getBoundingClientRect(), t = T ? T.getBoundingClientRect() : sel;
    const ow = Math.min(a.right, t.right ?? t.x + t.width) - Math.max(a.left, t.left ?? t.x), oh = Math.min(a.bottom, t.bottom ?? t.y + t.height) - Math.max(a.top, t.top ?? t.y);
    const tl = t.left ?? t.x, tt = t.top ?? t.y, tr = t.right ?? t.x + t.width, tb = t.bottom ?? t.y + t.height;
    return {
      inView: a.left >= 0 && a.top >= 0 && a.right <= innerWidth + 0.5 && a.bottom <= innerHeight + 0.5,
      over: ow > 1 && oh > 1 ? Math.round(ow * oh) : 0, area: Math.round((tr - tl) * (tb - tt)),
      gap: Math.round(Math.max(tl - a.right, a.left - tr, tt - a.bottom, a.top - tb, 0)),
      top: L.parentElement === document.body && Number(getComputedStyle(L).zIndex) >= 35,
    };
  }, target);
  if (!r) { fail(`(m) hovering ${what} opened no hover card`, step); return; }
  if (!r.inView) fail(`(m) the hover card for ${what} runs off the window`, step);
  if (r.over > r.area * 0.2) fail(`(m) the hover card for ${what} covers it (${r.over}px² of ${r.area})`, step);
  if (r.gap > 24) fail(`(m) the hover card for ${what} opens ${r.gap}px away from it, not next to it`, step);
  if (!r.top) fail(`(m) the hover card for ${what} isn't drawn above the table's strips`, step);
}

// (o) every rim label (its first, middle and last letter) and every leader's emoji opens its quadrant's standings
async function rimCheck(page, step) {
  const pts = await page.evaluate(() => {
    const out = [];
    const scr = (el, x, y) => { const m = el.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
    for (const t of document.querySelectorAll('[data-rim-text]')) {
      const n = t.getNumberOfChars();
      for (const i of [0, Math.floor(n / 2), n - 1]) { const r = t.getExtentOfChar(i); out.push({ what: `the ${t.dataset.plaque} rule (letter ${i})`, qid: t.dataset.plaque, ...scr(t, r.x + r.width / 2, r.y + r.height / 2) }); }
    }
    for (const g of document.querySelectorAll('[data-rim-leader]')) { const b = g.getBBox(); const t = g.parentNode.querySelector(`[data-rim-text]`); out.push({ what: `a leader's emoji (${g.dataset.rimLeader})`, qid: null, ...scr(g, b.x + b.width / 2, b.y + b.height / 2) }); void t; }
    return out;
  });
  if (pts.length < 8) fail(`(o) found only ${pts.length} rim points to check`, step);
  for (const p of pts) {
    const top = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e && e.closest('[data-rim]') ? e.closest('[data-rim]').dataset.rim : e ? `${e.tagName.toLowerCase()}.${String(e.className.baseVal ?? e.className).split(' ')[0]}` : null; }, p);
    if (p.qid && top !== p.qid) { fail(`(o) pointing at ${p.what} reaches ${top}, not its standings`, step); continue; }
    if (!p.qid && !/^[a-z]+$/.test(top || '')) { fail(`(o) pointing at ${p.what} reaches ${top}, not the standings`, step); continue; }
    await page.mouse.move(4, 690); await page.waitForTimeout(200);
    await page.mouse.move(p.x, p.y); await page.waitForTimeout(150);
    const kind = await page.evaluate(() => { const c = document.querySelector('[data-hover-layer][data-open="1"] [data-hover-card]'); return c ? c.dataset.hoverCard : null; });
    if (kind !== 'plaque') fail(`(o) hovering ${p.what} opened ${kind || 'nothing'}, not the standings`, step);
  }
  await page.mouse.move(4, 690); await page.waitForTimeout(200);
}

async function deckCheck(page) {
  // bots keep playing and the screen steps through their moves a beat behind, so wait (up to 30s) for a moment the
  // screen has caught up with the engine: at the latest when it's your move again and everything stops. A round end
  // holds the screen until you go on (the engine is already past it): then the check waits for the next round.
  let last = null;
  for (let t = 0; t < 300; t++) {
    const r = await page.evaluate(() => {
      if (document.querySelector('[data-next-round], .lt-reckon')) return { held: true };
      const g = document.querySelector('.app.game'), d = document.querySelector('[data-deck]');
      let save = null;
      try { save = JSON.parse(localStorage.getItem('patrons.v4.local')); } catch { /* none */ }
      if (!g || !d || !save || !save.state) return null;
      const tv = d.querySelector('.n .tv') || d.querySelector('.n');
      return { moves: Number(g.dataset.moves), saved: save.state.moves, pile: save.state.pile.length, left: Number(d.dataset.left), shown: tv.textContent.trim() };
    });
    last = r;
    if (r && r.held) return 'held';
    if (r && r.moves === r.saved) {
      if (r.left !== r.pile) { fail(`(h) the deck says ${r.left}, the engine's pile has ${r.pile}`, 'deck'); return 'checked'; }
      if (r.shown === String(r.pile)) return 'checked';
    }
    await page.waitForTimeout(100);
  }
  fail(`(h) after a refill the deck's number never settled on the engine's pile length (last: ${JSON.stringify(last)})`, 'deck');
  return 'checked';
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(`${base}/?botDelay=20&intro=0`); // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
  await page.waitForSelector('[data-home="local"]');
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await page.click('[data-start]');
  await page.waitForSelector('[data-option]', { timeout: 20000 });
  await audit(page, 'setup');
  await page.screenshot({ path: `${SHOTS}/01-setup.png` });

  // play: the first legal option each time; audit at my first placement, my first buy and a round-II placement
  const seen = new Set();
  let lastShop = null, refills = 0, deckDue = false, summaryChecked = false;
  for (let k = 0; k < 400 && seen.size < 3; k++) {
    // (h) the row refilled (a new face-up card): the deck's count must be the engine's pile
    const shopNow = await page.$$eval('.lt-shop .lt-cards .card[data-uid]', els => els.map(e => e.dataset.uid)).catch(() => []);
    if (lastShop && shopNow.some(u => !lastShop.includes(u)) && refills < 3) deckDue = true;
    lastShop = shopNow;
    if (deckDue && (await deckCheck(page)) === 'checked') { deckDue = false; refills++; }
    const next = page.locator('[data-next-round]');
    if (await next.count()) {
      // (n) the round summary: nothing under 12px, and your own seat reads "You" (never your seat's name)
      if (!summaryChecked && await page.locator('.roundend').count()) {
        summaryChecked = true;
        await page.waitForTimeout(800); // its totals tick up
        const r = await page.evaluate(() => {
          const vis = e => { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
          let me = null;
          try { me = JSON.parse(localStorage.getItem('patrons.v4.local')).state.players[0].name; } catch { /* none */ }
          const box = document.querySelector('.roundend');
          const tiny = [...box.querySelectorAll('*')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
            .map(e => ({ t: e.textContent.trim().slice(0, 24), fs: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.fs < 12);
          const text = box.innerText;
          const named = me && new RegExp(`(^|[^\\p{L}\\p{N}])${me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(text);
          return { tiny: tiny.slice(0, 6), me, named, you: /\bYou\b/.test(text) };
        });
        for (const x of r.tiny) fail(`(n) round summary text under 12px: "${x.t}" at ${x.fs}px`, 'summary');
        if (r.named) fail(`(n) the round summary calls you "${r.me}", not "You"`, 'summary');
        if (!r.you) fail('(n) the round summary never says "You"', 'summary');
        await page.screenshot({ path: `${SHOTS}/08-round-summary.png` });
      }
      await next.first().click().catch(() => {}); await page.waitForTimeout(150); continue;
    }
    const hand = page.locator('[data-handoff]');
    if (await hand.count()) { await hand.first().click().catch(() => {}); continue; }
    const kind = await page.evaluate(() => {
      const g = document.querySelector('.app.game');
      const round = [...document.querySelectorAll('header .round, [data-region="prompt"], .lt-prompt, .rnd, [data-round]')].map(e => e.textContent).join(' ');
      const place = !!document.querySelector('.slot.can, .slot[data-option]');
      const buy = !!document.querySelector('[data-option^="card:"], [data-option^="tier:"], [data-option="pass"]');
      return { place, buy, r2: /Round II\b/.test(round), moves: g && g.dataset.moves };
    });
    const step = kind.place ? (kind.r2 ? 'place-r2' : 'place') : kind.buy ? 'buy' : null;
    if (step && !seen.has(step) && (step !== 'place-r2' || seen.has('place'))) {
      seen.add(step);
      await audit(page, step);
      await page.screenshot({ path: `${SHOTS}/0${seen.size + 1}-${step}.png` });
      if (step === 'place') {
        // (b) hover a board space and a shop card: each shows a card
        const slot = page.locator('.slot.can').first();
        await slot.hover();
        await page.waitForTimeout(500);
        if (!(await page.locator('.peek, [data-hover-card="space"], [data-space-card]').count())) fail('(b) hovering a space shows no card', step);
        await anchorCheck(page, 'a space', step, await slot.evaluate(e => e.getBoundingClientRect().toJSON()));
        // (p) the space's contest line names every player
        {
          const names = await page.evaluate(() => { try { const st = JSON.parse(localStorage.getItem('patrons.v4.local')).state; return st.players.map((p, i) => (i === 0 ? 'You' : p.name)); } catch { return null; } });
          let line = null;
          const lit = page.locator('.slot.can');
          for (let k = 0; k < Math.min(6, await lit.count()) && !line; k++) {
            await page.mouse.move(4, 690); await page.waitForTimeout(160);
            await lit.nth(k).hover(); await page.waitForTimeout(700);
            line = await page.evaluate(ns => [...document.querySelectorAll('[data-hover-layer] .lt-yd-row .v')].map(e => e.textContent).find(t => ns.filter(n => new RegExp(`(^|· )${n} \\d`).test(t)).length >= 2) || null, names);
          }
          if (!names) fail('(p) no saved game to read the players from', step);
          else if (!line) fail('(p) no space card showed its contest line', step);
          else { const missing = names.filter(n => !new RegExp(`(^|· )${n} \\d`).test(line)); if (missing.length) fail(`(p) a space's contest line leaves out ${missing.join(', ')}: "${line}"`, step); }
        }
        await rimCheck(page, step);
        await page.screenshot({ path: `${SHOTS}/02b-hover-space.png` });
        await page.mouse.move(5, 5);
        const card = page.locator('[data-region] [data-uid]').first();
        if (await card.count()) {
          await card.hover();
          await page.waitForTimeout(600);
          const shown = await page.evaluate(() => [...document.querySelectorAll('.popover, [data-hover-card]')].some(e => e.getBoundingClientRect().width > 0) || !!document.querySelector('.card-face'));
          if (!shown) fail('(b) hovering a shop card shows no card', step);
          await anchorCheck(page, 'a shop card', step, await card.evaluate(e => e.getBoundingClientRect().toJSON()));
          await page.screenshot({ path: `${SHOTS}/02c-hover-card.png` });
          await page.mouse.move(5, 5);
          await page.waitForTimeout(300);
        }
        // (h) the deck heads the strip, and hovering it shows what's in it
        const deck = page.locator('[data-deck]');
        if (!(await deck.count())) fail('(h) no member deck at the head of the shop strip', step);
        else {
          const placed = await page.evaluate(() => { const d = document.querySelector('[data-deck]').getBoundingClientRect(), c = document.querySelector('.lt-shop .lt-cards .card').getBoundingClientRect(); return d.right <= c.left + 1 && Math.abs(d.top - c.top) < 2; });
          if (!placed) fail('(h) the deck is not before the first shop card', step);
          await deck.hover();
          await page.waitForTimeout(400);
          const dc = await page.evaluate(() => {
            const c = document.querySelector('[data-hover-layer] [data-hover-card="deck"]'), d = document.querySelector('[data-deck]');
            if (!c || !(c.getBoundingClientRect().width > 0)) return null;
            const body = c.querySelector('[data-deck-card]');
            return { left: Number(d.dataset.left), card: Number(body && body.dataset.left), sum: [...c.querySelectorAll('[data-color]')].reduce((t, e) => t + Number(e.dataset.n), 0), colorless: !!c.querySelector('[data-color="colorless"]'), bottom: /bottom/.test(c.textContent) };
          });
          if (!dc) fail('(h) hovering the deck shows no card', step);
          else if (dc.card !== dc.left || dc.sum !== dc.left || !dc.colorless || !dc.bottom) fail(`(h) deck card: ${dc.card} left, colors add to ${dc.sum}, the deck shows ${dc.left}${dc.colorless ? '' : ', no colorless count'}${dc.bottom ? '' : ', no word on where released members go'}`, step);
          await anchorCheck(page, 'the deck', step, '[data-deck]');
          await page.screenshot({ path: `${SHOTS}/02d-hover-deck.png` });
          await page.mouse.move(5, 5);
          await page.waitForTimeout(300);
        }
        // (m) your own seat's card opens beside it; (l) the ranked line and the turn-order places
        const head = page.locator('.lt > .lt-seat-0 .cs-head').first();
        if (await head.count()) { await head.hover(); await page.waitForTimeout(300); await anchorCheck(page, 'your seat', step, await head.evaluate(e => e.getBoundingClientRect().toJSON())); await page.mouse.move(5, 5); await page.waitForTimeout(200); }
        const tops = await page.evaluate(() => ({ seats: document.querySelectorAll('.lt > .lt-seat [data-cult]').length, rank: [...document.querySelectorAll('[data-rank] .rk')].map(e => e.textContent.trim()), order: [...document.querySelectorAll('.lt > .lt-seat .cs-order')].map(e => e.dataset.order) }));
        if (tops.rank.length !== tops.seats) fail(`(l) the ranked line shows ${tops.rank.length} players for ${tops.seats} cults`, step);
        if (tops.order.length !== tops.seats || !tops.order.includes('now')) fail(`(l) turn-order places: ${JSON.stringify(tops.order)}`, step);
      }
    }
    const opt = page.locator('.slot.can, [data-option]:not([aria-disabled="true"])').first();
    if (await opt.count()) { await opt.click({ timeout: 2000 }).catch(() => {}); }
    await page.waitForTimeout(80);
  }
  if (seen.size < 3) fail(`only reached ${[...seen].join(', ') || 'no'} steps`, 'play');
  if (!summaryChecked) fail('(n) never saw a round summary', 'summary');
  // (n) the Chronicle: your own lines read "You took…", never your seat's name
  {
    await page.click('.lt-menu .menu-glyph').catch(() => {});
    await page.click('.lt-menu .log-btn').catch(() => {});
    const chron = await page.waitForSelector('.lt-chron', { timeout: 4000 }).catch(() => null);
    if (!chron) fail('(n) the Chronicle did not open from the menu', 'chronicle');
    else {
      const r = await page.evaluate(() => {
        let me = null;
        try { me = JSON.parse(localStorage.getItem('patrons.v4.local')).state.players[0].name; } catch { /* none */ }
        const text = document.querySelector('.lt-chron').innerText;
        const named = me && new RegExp(`(^|[^\\p{L}\\p{N}])${me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(text);
        return { me, named, you: /\bYou (took|recruited|bought|passed|picked|placed|joined)\b/.test(text) };
      });
      if (r.named) fail(`(n) the Chronicle calls you "${r.me}", not "You"`, 'chronicle');
      if (!r.you) fail('(n) the Chronicle has no "You took / recruited / bought…" line', 'chronicle');
      await page.screenshot({ path: `${SHOTS}/09-chronicle.png` });
      await page.keyboard.press('Escape');
    }
  }
  if (!refills) fail('(h) the shop row never refilled during the game', 'deck');
  else if (!(await page.evaluate(() => window.__patronsDeals || 0))) fail(`(h) ${refills} refill(s), but no card came off the deck`, 'deck');
  else console.log(`info.mjs: deck matched the engine's pile after ${refills} refill(s); ${await page.evaluate(() => window.__patronsDeals)} card(s) dealt off it`);

  // (d) hover speed (Cory: instant and seamless): p95 from the pointer arriving to a visible card < 100ms, and no
  // close/reopen flicker while sweeping across a ring of spaces. Measured on the Lamplit hover layer with the real
  // wheel and shop (the ?lab=b page of this build) until the game screen mounts it.
  {
    const lab = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    lab.on('pageerror', e => errors.push(`lab pageerror: ${e.message}`));
    await lab.goto(`${base}/?lab=b&phase=place`);
    await lab.waitForSelector('[data-hover-layer]');
    await lab.waitForTimeout(800); // idle warm-up of the dry runs
    await lab.evaluate(() => {
      const visible = () => [...document.querySelectorAll('[data-hover-layer][data-open="1"], .peek')].some(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.left > -1000 && getComputedStyle(e).opacity !== '0'; });
      window.__hov = { lat: [], flips: 0, was: false, sweeping: false };
      let t0 = null;
      addEventListener('pointerover', e => { if (e.target.closest && e.target.closest('[data-slot], [data-uid]') && !visible()) t0 = performance.now(); }, true);
      const tick = () => {
        const v = visible();
        if (v && t0 != null) { window.__hov.lat.push(performance.now() - t0); t0 = null; }
        if (window.__hov.sweeping && window.__hov.was && !v) window.__hov.flips++;
        window.__hov.was = v;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const centers = async sel => lab.$$eval(sel, els => els.map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }));
    const spaces = await centers('[data-slot] .base');
    const cards = await centers('[data-region="shop"] [data-uid]');
    // separate arrivals: move away, then onto a target, wait for its card. A shared, loaded box can stall one run;
    // a real slowdown fails both, so the better of two runs counts (both are reported).
    const measure = async () => {
      await lab.evaluate(() => { window.__hov.lat = []; });
      for (const [x, y] of [...spaces.slice(0, 14), ...cards.slice(0, 10), ...spaces.slice(14, 20)]) {
        await lab.mouse.move(4, 690);
        await lab.waitForTimeout(220);
        await lab.mouse.move(x, y, { steps: 2 });
        await lab.waitForTimeout(160);
      }
      const lat = (await lab.evaluate(() => window.__hov.lat)).sort((a, b) => a - b);
      return { lat, p95: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : Infinity };
    };
    let run = await measure();
    const first = run.p95;
    if (!(run.p95 < 100)) { const again = await measure(); if (again.p95 < run.p95) run = again; }
    const { lat, p95 } = run;
    if (lat.length < 20) fail(`(d) only ${lat.length} hover cards opened out of ${Math.min(20, spaces.length) + Math.min(10, cards.length)} arrivals`, 'hover');
    if (!(p95 < 100)) fail(`(d) hover card p95 ${Math.round(p95)}ms, first run ${Math.round(first)}ms (want < 100ms; samples ${lat.map(Math.round).join(',')})`, 'hover');
    // sweep: across the outer ring's spaces in order, never leaving the ring; the card must never close in between
    // the outer ring: the spaces farthest from the wheel's centre, in angle order
    const all = await lab.$$eval('[data-slot] .base', els => els.map(e => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }));
    const cx = all.reduce((t, o) => t + o.x, 0) / all.length, cy = all.reduce((t, o) => t + o.y, 0) / all.length;
    const far = Math.max(...all.map(o => Math.hypot(o.x - cx, o.y - cy)));
    const ring = all.filter(o => Math.hypot(o.x - cx, o.y - cy) > far * 0.85).sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    if (ring.length < 6) fail(`(d) found only ${ring.length} outer spaces to sweep`, 'hover');
    await lab.mouse.move(ring[0].x, ring[0].y);
    await lab.waitForTimeout(200);
    await lab.evaluate(() => { window.__hov.sweeping = true; window.__hov.flips = 0; });
    for (const o of ring.slice(1, 9)) { await lab.mouse.move(o.x, o.y, { steps: 6 }); await lab.waitForTimeout(90); }
    const flips = await lab.evaluate(() => { window.__hov.sweeping = false; return window.__hov.flips; });
    if (flips) fail(`(d) the hover card closed and reopened ${flips} time(s) while sweeping across ${Math.min(8, ring.length - 1)} spaces`, 'hover');
    await lab.screenshot({ path: `${SHOTS}/04-hover-sweep.png` });
    console.log(`info.mjs: hover p95 ${Math.round(p95)}ms over ${lat.length} cards${first !== p95 ? ` (first run ${Math.round(first)}ms)` : ''}; ${flips} flickers in the sweep`);
    await lab.close();
  }

  // (e) living cults: a member reacts (hops) when its own trace line appears ("Wren's Banker: +1 gold.")
  {
    const lab = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    lab.on('pageerror', e => errors.push(`lab pageerror: ${e.message}`));
    await lab.goto(`${base}/?lab=b&phase=place&react=1`);
    const who = await lab.waitForFunction(() => document.documentElement.dataset.reactMember, null, { timeout: 5000 }).then(h => h.jsonValue()).catch(() => null);
    if (!who) fail('(e) the lab never wrote a trace line', 'cults');
    else {
      const [pid, def] = who.split(':');
      const hop = await lab.waitForSelector(`[data-cult="${pid}"] [data-member="${def}"][data-react]`, { timeout: 1500 }).catch(() => null);
      if (!hop) fail(`(e) ${def} did not react to its trace line`, 'cults');
      else {
        const anim = await hop.evaluate(e => getComputedStyle(e.querySelector('.fig')).animationName);
        if (!/cult-hop/.test(anim)) fail(`(e) ${def} is marked but doesn't move (animation ${anim})`, 'cults');
        await lab.screenshot({ path: `${SHOTS}/06-member-reacts.png` });
      }
    }
    await lab.close();
  }

  // (i) the shop's "✓ after <space>" tick: hovering a space that makes a card affordable ticks that card
  {
    const { save, key, uids } = tickSave();
    const pg = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    pg.on('pageerror', e => errors.push(`tick pageerror: ${e.message}`));
    await pg.goto(`${base}/?botDelay=20&intro=0`);
    await pg.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
    await pg.reload();
    await pg.click('[data-home="resume"]');
    await pg.waitForSelector('.lt-shop .card[data-uid]');
    await pg.waitForTimeout(300);
    const spot = pg.locator(`[data-slot="${key}"] .base`).first();
    await ((await spot.count()) ? spot : pg.locator(`[data-slot="${key}"]`).first()).hover();
    const ok = await pg.waitForFunction(us => us.some(u => { const t = document.querySelector(`.lt-shop .card[data-uid="${u}"] .tick`); return !!t && /✓/.test(t.textContent) && t.getBoundingClientRect().width > 0; }), uids, { timeout: 6000 }).then(() => true, () => false);
    if (!ok) fail(`(i) hovering space ${key} never ticked "✓ after" on the card(s) it unlocks (${uids.join(', ')})`, 'tick');
    else console.log(`info.mjs: space ${key} ticks card ${uids.join(', ')} "✓ after"`);
    await pg.screenshot({ path: `${SHOTS}/07-shop-tick.png` });
    await pg.close();
  }

  // (b) touch: a long-press on a titled element shows its title
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const phone = await ctx.newPage();
  phone.on('pageerror', e => errors.push(`phone pageerror: ${e.message}`));
  await phone.goto(`${base}/?botDelay=20&intro=0`);
  await phone.waitForSelector('[data-home="local"]');
  await phone.tap('[data-home="local"]');
  await phone.waitForSelector('[data-start]');
  await phone.tap('[data-start]');
  await phone.waitForSelector('[data-option]', { timeout: 20000 });
  await audit(phone, 'phone-setup');
  const target = await phone.evaluate(() => {
    // a titled element that is really on top at its centre (not under an overlay such as the intro)
    const e = [...document.querySelectorAll('.app.game [title]')].find(x => {
      const b = x.getBoundingClientRect();
      if (!(b.width > 8 && b.height > 8 && b.top > 0 && b.bottom < innerHeight) || x.closest('button, [role="button"], [data-option]')) return false;
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return !!top && x.contains(top);
    });
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, title: e.getAttribute('title') };
  });
  if (!target) fail('(b) no titled element to long-press on the phone', 'phone');
  else {
    const cdp = await ctx.newCDPSession(phone);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await touch('touchStart', [{ x: target.x, y: target.y }]);
    await phone.waitForTimeout(700);
    const bubble = await phone.locator('[data-touch-tip]').textContent().catch(() => null);
    await touch('touchEnd', []);
    if (!bubble || !bubble.includes(target.title.slice(0, 10))) fail(`(b) long-press showed ${JSON.stringify(bubble)}, not the title ${JSON.stringify(target.title)}`, 'phone');
    await phone.screenshot({ path: `${SHOTS}/05-phone-longpress.png` });
  }
  await ctx.close();
} catch (e) {
  fails.push(`crashed: ${e && e.stack || e}`);
} finally {
  await browser.close();
}
for (const e of errors) fails.push(e);
if (fails.length) { console.error(`info.mjs: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log('info.mjs: every game element explains itself; no stars');
