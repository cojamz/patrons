import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E pay-flow gate (live panel round 1, G2), at laptop size (1270×700). Testers couldn't tell why some buys open the
// pay sheet and some pay at once, read the sheet's faded coins backwards, saw two prices for one discounted card, and
// took the deck for a member.
//  (f1) One way to pay (5 for 5 with exactly 5): no sheet; a "Paid 3● 2●" receipt stands at the tile you clicked (the
//       engine's spend), and goes after a moment.
//  (f2) One way to pay for a member (exact cost): the same receipt at the card.
//  (f3) Several ways (1 for 1 with mixed colors): the sheet opens beside the tile (no "more than one way" legend since H09), the
//       tile stays uncovered and lit in the hole; the coins that pay sit in a Paying row by color, above a Keeping row
//       of numbered stacks (Cory, 2026-10-15: the faded lifted coins were "hard to decipher").
//  (f4) A discount: the sheet's price is the card face's price (the struck list number, then the dots), the struck
//       number comes before the price on the card, and no card's price touches its worth.
//  (f5) A member's sheet stands beside its card, not over it.
//  (f6) The deck reads as a pile: smaller than a member card, named "deck".
// Saves: e2e/v4/lib/shop-save.mjs. Server: $V4_URL if set, else its own `npx vite` on a free port from 5395.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { buySave } from './lib/shop-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { applyMove, memberPrice } from '../../src/engine/v4/index.js';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/payflow';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5395;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 120 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}
const errors = [];
const browser = await launchBrowser({ executablePath: browserPath });

async function open(tag, save) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  await seedSave(page, save);
  await page.goto(`${base}/?intro=0`, { timeout: 90000 });
  await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-card.can', { timeout: 60000 });
  await page.mouse.move(640, 695);
  await page.waitForTimeout(600);
  return { ctx, page };
}
const rectOf = (page, sel) => page.$eval(sel, e => e.getBoundingClientRect().toJSON());
async function click(page, sel) {
  const b = await (await page.waitForSelector(sel, { timeout: 8000 })).boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
const gapOf = (a, b) => Math.max(0, b.left - a.right, a.left - b.right) + Math.max(0, b.top - a.bottom, a.top - b.bottom);
const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const vecStr = (res, v) => res.filter(r => (v[r] || 0) > 0).map(r => `${v[r]}${r}`).join(' ');
// one receipt check: no sheet, the receipt names the one way's spend, stands at the thing clicked, then goes
async function receipt(tag, save, sel) {
  const st = save.state;
  const opt = sel.match(/data-(?:uid|rate)="([^"]+)"/)[1];
  const t = applyMove(structuredClone(st), { player: 0, option: /^\d+$/.test(opt) ? `card:${opt}` : `tier:${opt}` });
  const ways = t.pending && t.pending.kind === 'pay' ? t.pending.options.filter(o => o.kind === 'pay') : [];
  if (ways.length !== 1 || (ways[0].breaks || []).length) { errors.push(`(${tag}) the save is not one way that keeps every lead (${ways.map(o => o.id).join(' ')})`); return; }
  const want = vecStr(st.resources, ways[0].spend);
  const { ctx, page } = await open(tag, save);
  const at = await rectOf(page, sel);
  await page.evaluate(() => { window.__sheet = 0; const f = () => { if (document.querySelector('.dialog.pay')) window.__sheet++; if (!window.__stop) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await click(page, sel);
  const got = await page.waitForSelector('[data-pay-receipt]', { timeout: 1500 }).catch(() => null);
  if (!got) errors.push(`(${tag}) a one-way payment showed no receipt`);
  else {
    const said = await got.evaluate(e => ({ v: e.dataset.payReceipt, text: e.textContent.trim(), r: e.getBoundingClientRect().toJSON() }));
    if (said.v !== want) errors.push(`(${tag}) the receipt says "${said.v}", the engine paid "${want}"`);
    if (!/^Paid/.test(said.text)) errors.push(`(${tag}) the receipt reads "${said.text}"`);
    if (gapOf(said.r, at) > 8) errors.push(`(${tag}) the receipt is ${Math.round(gapOf(said.r, at))}px from what was bought`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/${tag}-receipt.png` });
    if (!(await page.waitForFunction(() => !document.querySelector('[data-pay-receipt]'), null, { timeout: 4000 }).then(() => true, () => false))) errors.push(`(${tag}) the receipt never went away`);
  }
  if (await page.evaluate(() => window.__sheet)) errors.push(`(${tag}) the pay sheet showed for a single way to pay`);
  await ctx.close();
}

try {
  // (f1) 5 for 5 with exactly 5 in two colors, the rivals holding more of both colors (no lead lost). Was 8 for 8 on the
  // retired 'big' tier; the buys are 1 for 1, 5 for 5 and 10 for 10 since 2026-10-16 (decisions.md).
  await receipt('f1', buySave({ def: null, res: { gold: 3, red: 0, blue: 2, green: 0 }, rivals: { gold: 6, blue: 6 } }).save, '.lt-rates [data-rate="mid"]');
  // (f2) Prospector at exactly its cost
  {
    const { save, uid } = buySave({ def: 'gold.prospector', res: { gold: 5, red: 0, blue: 0, green: 0 }, rivals: { gold: 6 } });
    await receipt('f2', save, `.lt-shop .lt-card[data-uid="${uid}"]`);
  }
  // (f3) 1 for 1 with four colors: several ways, the sheet beside the tile
  {
    const { save } = buySave({ def: null, res: { gold: 2, red: 2, blue: 1, green: 1 } });
    const p = save.state.players[0];
    const { ctx, page } = await open('f3', save);
    const tile = await rectOf(page, '.lt-rates [data-rate="small"]');
    await click(page, '.lt-rates [data-rate="small"]');
    await page.waitForSelector('.dialog.pay[data-at]', { timeout: 4000 }).catch(() => errors.push('(f3) the sheet is not anchored to the tile'));
    await page.waitForTimeout(250);
    const box = await rectOf(page, '.dialog.pay');
    if (gapOf(box, tile) > 24) errors.push(`(f3) the sheet stands ${Math.round(gapOf(box, tile))}px from the tile (want ≤ 24)`);
    if (overlap(box, tile) > 0) errors.push('(f3) the sheet covers the tile it pays for');
    const hole = await page.$eval('.pay-hole', e => ({ at: !!e.dataset.at, r: e.getBoundingClientRect().toJSON() })).catch(() => null);
    if (!hole || !hole.at || hole.r.left > tile.left || hole.r.right < tile.right || hole.r.top > tile.top || hole.r.bottom < tile.bottom) errors.push(`(f3) the tile is not lit in the hole: ${JSON.stringify(hole)}`);
    // the "you can pay this more than one way" line was taken off the sheet (Cory, 2026-10-17 feedback H09,
    // design/archive/old-notes-to-2026-10-20/feedback-addendum-2026-10-17.md); the instant receipt (f1, f2) is what tells the two flows apart now
    if (await page.$('[data-pay-legend]')) errors.push('(f3) the sheet still carries the retired "more than one way" legend');
    if (/more than one way/.test(await page.$eval('.dialog.pay', e => e.textContent))) errors.push('(f3) the sheet still says "more than one way"');
    // two rows (Cory, 2026-10-15: "hard to decipher"): what pays sits in Paying by color, what stays in Keeping, numbered
    const rows = await page.evaluate(() => {
      const P = document.querySelector('.dialog.pay .pay-row.paying'), K = document.querySelector('.dialog.pay .pay-row.keeping');
      return { pl: P && P.querySelector('.pr-lbl').textContent, kl: K && K.querySelector('.pr-lbl').textContent,
        pay: P ? [...P.querySelectorAll('[data-pay-coin]')].map(e => [e.dataset.payCoin, e.querySelectorAll('.ps-coin').length]) : [],
        keep: K ? [...K.querySelectorAll('[data-stack]')].map(e => [e.dataset.stack, Number(e.dataset.out), e.querySelector('[data-keep-label]').textContent, e.querySelectorAll('.ps-coin').length]) : [],
        below: P && K ? P.querySelector('.pr-items').getBoundingClientRect().bottom <= K.querySelector('.pay-stacks').getBoundingClientRect().top + 1 : false };
    });
    if (!/^paying$/i.test(rows.pl || '') || !/^keeping$/i.test(rows.kl || '')) errors.push(`(f3) the rows are not named Paying and Keeping (${rows.pl}, ${rows.kl})`);
    if (!rows.below) errors.push('(f3) the Paying row is not above the Keeping row');
    for (const [r, out, label, n] of rows.keep) {
      if (label !== String(p.res[r] - out)) errors.push(`(f3) the kept ${r} stack reads "${label}", want ${p.res[r] - out}`);
      if (n !== p.res[r] - out) errors.push(`(f3) the kept ${r} stack draws ${n} coins, keeps ${p.res[r] - out}`);
      const g = rows.pay.find(x => x[0] === r);
      if (out ? !g || g[1] !== out : g) errors.push(`(f3) Paying shows ${g ? g[1] : 0} ${r} for ${out} paying`);
    }
    if (!rows.pay.length) errors.push('(f3) nothing in the Paying row');
    // the paying coins are in full color (live panel: faded coins read as "not paying")
    const faded = await page.$$eval('.dialog.pay .ps-out .ps-coin', els => els.filter(e => Number(getComputedStyle(e).opacity) < 0.95).length);
    if (faded) errors.push(`(f3) ${faded} paying coins are faded`);
    await page.screenshot({ path: `${SHOTS}/f3-sheet.png` });
    await ctx.close();
  }
  // (f4)(f5) a discount: one price on the card and in the sheet; the sheet beside the card
  {
    const { save, uid } = buySave({ discount: 2 });
    const st = save.state, p = st.players[0];
    const { ctx, page } = await open('f4', save);
    // member cards only: the follower buys share the shop and its card size since v0.8.2 but print no worth
    const cards = await page.$$eval('.lt-shop .lt-card[data-uid]', els => els.map(e => {
      const now = e.querySelector('.cost-now'), was = e.querySelector('.cost-was'), cost = e.querySelector('.ft .lt-cost'), val = e.querySelector('.val');
      // the worth sits on the name bar since the trading-card face (Cory, Oct 29: "Header is good"): it must clear the price disc
      const right = e.querySelector('.lt-corner-cost').getBoundingClientRect().right;
      return { uid: e.dataset.uid, wasFirst: !!(now && was && was.compareDocumentPosition(cost) & Node.DOCUMENT_POSITION_FOLLOWING), discounted: !!now, gap: val.getBoundingClientRect().left - right };
    }));
    for (const c of cards) {
      if (c.discounted && !c.wasFirst) errors.push(`(f4) card ${c.uid}: the struck list price comes after the price`);
      if (c.gap < 2) errors.push(`(f4) card ${c.uid}: the price runs into the worth (${Math.round(c.gap)}px)`);
    }
    if (!cards.some(c => c.discounted)) errors.push('(f4) no card shows a discounted price');
    const pr = memberPrice(st, p, uid);
    const face = vecStr(st.resources.concat('any'), { [pr.color]: pr.colored, any: pr.total - pr.colored });
    const card = await rectOf(page, `.lt-shop .lt-card[data-uid="${uid}"]`);
    await click(page, `.lt-shop .lt-card[data-uid="${uid}"]`);
    await page.waitForSelector('.dialog.pay', { timeout: 4000 });
    await page.waitForTimeout(250);
    const head = await page.$eval('[data-pay-cost]', e => ({ price: e.dataset.payPrice, was: e.querySelector('.pay-was')?.textContent || null }));
    if (head.price !== face) errors.push(`(f4) the sheet's price is "${head.price}", the engine's (and the card's) "${face}"`);
    if (head.was == null) errors.push('(f4) the sheet does not strike the list price as the card does');
    const box = await rectOf(page, '.dialog.pay');
    if (gapOf(box, card) > 24 || overlap(box, card) > 0) errors.push(`(f5) the sheet is not beside its card (gap ${Math.round(gapOf(box, card))}px, overlap ${Math.round(overlap(box, card))})`);
    await page.screenshot({ path: `${SHOTS}/f4-sheet.png` });
    await ctx.close();
  }
  // (f6) the deck is a pile, smaller than a card, and says so
  {
    const { save } = buySave({});
    const { ctx, page } = await open('f6', save);
    const d = await page.evaluate(() => {
      const pile = document.querySelector('[data-deck] .pile'), card = document.querySelector('.lt-shop .lt-card[data-uid]');
      return { pile: pile && pile.getBoundingClientRect().toJSON(), card: card.getBoundingClientRect().toJSON(), cap: document.querySelector('[data-deck] .cap')?.textContent || '' };
    });
    if (!d.pile || d.pile.height > d.card.height * 0.8 || d.pile.width > d.card.width * 0.8) errors.push(`(f6) the deck is as big as a member card (${d.pile && Math.round(d.pile.width)}×${d.pile && Math.round(d.pile.height)} vs ${Math.round(d.card.width)}×${Math.round(d.card.height)})`);
    if (!/^deck$/i.test(d.cap.trim())) errors.push(`(f6) the deck is not named ("${d.cap}")`);
    await ctx.close();
  }
} catch (e) {
  errors.push(`crashed: ${e.stack || e.message}`);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) { console.error(`payflow.mjs: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`); process.exit(1); }
console.log('payflow.mjs: one-way receipts, an anchored sheet, one price, a deck that reads as a deck');
