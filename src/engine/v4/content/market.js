// Blue (the market): bend the shop. Recruit outside your buy, ignore colors, pay half, churn the row.
// Scoring is switchable while Cory decides (setScoring): 'pricey' = most members costing 4 or more (default),
// 'value' = most member value (total printed cost). Blue members break ties either way.
// Gold hoards money and Red piles up cheap members; Blue holds a few expensive ones, bought cheap.
import { registerQuadrant } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const B = 'blue';
const Q = 'market';
// Cost thresholds. If member costs double, PRICEY becomes 8, MID 6 and CHEAP 4.
export const PRICEY = 4, MID = 3, CHEAP = 2, LUXURY = 5;
const isBlue = def => def.quadrant === Q;

/** Printed cost of a member (before any discount). */
export const priceOf = c => c.def.s + c.def.w;
/** Total printed cost of a player's members. */
export const memberValue = (ctx, p) => ctx.membersOf(p).reduce((s, c) => s + priceOf(c), 0);
/** How many of a player's members cost PRICEY or more. */
export const priceyCount = (ctx, p) => ctx.membersOf(p).filter(c => priceOf(c) >= PRICEY).length;
const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
const colorOf = (ctx, c) => ctx.quadrant(c.def.quadrant).resource;
// what a bot thinks a member is worth to it (mirrors the greedy buy score)
const botWorth = c => c.def.f * 1.4 + (c.def.vanilla ? 0 : 1.6) + priceOf(c) * 0.3;

let MODE = 'pricey';
// Measuring knob: with lean on, Bargain and Clearance use up your buy this turn instead of adding a recruit.
let LEAN = false;
export function setLean(on) { LEAN = !!on; }
/** Switch Blue's scoring rule (for measuring): 'pricey' or 'value'. */
export function setScoring(mode) { MODE = mode; market.scoring.label = LABELS[mode]; }
const LABELS = { pricey: `Most members costing ${PRICEY}+`, value: 'Most member value' };
const blueCount = (ctx, p) => ctx.membersOf(p).filter(c => isBlue(c.def)).length;

// ---------- paying outside the normal buy ----------
// Every exact way to pay `s` of `color` plus `w` of anything. Gold is spent last by default.
function payVectors(ctx, p, color, s, w) {
  const keys = ctx.state.resources;
  const need = s + w;
  const out = [];
  const walk = (i, left, cur) => {
    if (i === keys.length) { if (left === 0 && (cur[color] || 0) >= s) out.push({ ...cur }); return; }
    for (let k = 0; k <= Math.min(p.res[keys[i]] || 0, left); k++) { cur[keys[i]] = k; walk(i + 1, left - k, cur); }
    cur[keys[i]] = 0;
  };
  walk(0, need, {});
  // default first: the colored part from its color, the rest from what you hold most of, gold last
  const res = { ...p.res };
  const plan = Object.fromEntries(keys.map(r => [r, 0]));
  if (s) { plan[color] = s; res[color] -= s; }
  for (let left = w; left > 0; left--) {
    const c = keys.filter(r => r !== 'gold' && res[r] > 0).sort((a, b) => res[b] - res[a])[0] || (res.gold > 0 ? 'gold' : null);
    if (!c) break;
    res[c] -= 1; plan[c] += 1;
  }
  const key = v => keys.map(r => v[r] || 0).join('-');
  const pk = key(plan);
  out.sort((a, b) => (key(b) === pk) - (key(a) === pk) || (a.gold || 0) - (b.gold || 0));
  return out;
}
const canPay = (p, n) => totalRes(p) >= n;
const payLabel = v => Object.entries(v).filter(([, n]) => n).map(([c, n]) => `${n} ${c}`).join(', ') || 'nothing';

/** Recruit `uid` from the face-up row, paying `s` colored + `w` any (the player picks how). */
function buyAt(ctx, p, uid, s, w, why) {
  const card = ctx.card(uid);
  const color = colorOf(ctx, card);
  const list = payVectors(ctx, p, color, s, w);
  if (!list.length) return;
  const data = { uid, why };
  if (list.length === 1) { payAndRecruit(ctx, p, list[0], data); return; }
  ctx.choose(p, `${why}: how do you pay ${s + w} for ${card.def.name}?`, list.map((v, i) => ({
    id: `pay:${ctx.state.resources.map(r => v[r] || 0).join('-')}`, label: payLabel(v), kind: 'pay', value: v, hint: i === 0 ? 1 : 0,
  })), `${Q}.pay`, data);
}
function payAndRecruit(ctx, p, v, { uid, why, fromPile }) {
  const card = ctx.card(uid);
  const pile = ctx.state.pile;
  if (fromPile && pile.includes(uid)) {
    // lift it out of the pile into the row for a moment, so it is recruited the normal way
    pile.splice(pile.indexOf(uid), 1);
    ctx.state.shop.push(uid);
  }
  if (!ctx.state.shop.includes(uid)) { ctx.log(`${why}: ${card.def.name} is gone.`); return; }
  for (const r in v) p.res[r] -= v[r];
  ctx.log(`${why}: ${p.name} pays ${payLabel(v)} for ${card.def.name}.`);
  if (LEAN && !fromPile) {
    const q = ctx.state.queue, k = q.findIndex(t => t.t === 'buy' && t.p === p.id);
    if (k >= 0) q.splice(k, 1);
  }
  ctx.recruit(p, uid, { free: true });
}

/** Offer face-up members the player can pay for at price(card) in any colors. */
function offerRow(ctx, p, price, why) {
  const opts = ctx.shopCards().filter(c => canPay(p, price(c))).map(c => ({
    id: `card:${c.uid}`, label: `${c.def.name} · pay ${price(c)}`, kind: 'card', value: c.uid, hint: botWorth(c) + (priceOf(c) - price(c)) * 0.5,
  }));
  if (!opts.length) { ctx.log(`${why}: ${p.name} can't pay for anything.`); return; }
  opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
  ctx.choose(p, `${why}: recruit which member?`, opts, `${Q}.pickRow`, { why });
}
const half = c => Math.floor(priceOf(c) / 2);

function bestRowValue(ctx, p, price) {
  const ok = ctx.shopCards().filter(c => canPay(p, price(c)));
  return ok.length ? Math.max(...ok.map(c => botWorth(c) + (priceOf(c) - price(c)) * 0.6)) : 0;
}

function sweepRow(ctx) {
  const old = [...ctx.state.shop];
  for (const u of old) ctx.buryFromShop(u);
}
/** Extra buys this turn: they run right after the current one (added to the engine's queue directly). */
function extraBuys(ctx, p, k) {
  for (let i = 0; i < k; i++) ctx.state.queue.unshift({ t: 'buy', p: p.id });
}

const market = {
  id: Q,
  name: 'Blue',
  resource: B,
  scoring: {
    label: LABELS.pricey,
    score: (ctx, p) => {
      const v = MODE === 'value' ? memberValue(ctx, p) : priceyCount(ctx, p);
      return v > 0 ? v * 100 + blueCount(ctx, p) : 0;
    },
  },

  actions: [
    {
      key: 'bargain', ring: 1, name: 'Bargain', text: 'Recruit a face-up member now, in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, priceOf) * 0.5,
      resolve(ctx, p) { offerRow(ctx, p, priceOf, 'Bargain'); },
    },
    {
      key: 'restock', ring: 1, name: 'Restock', text: '+2 blue, and sweep the face-up row: 6 new members come out.',
      estimate: () => 2.4,
      resolve(ctx, p) {
        ctx.gain(p, B, 2, { fromAction: true });
        sweepRow(ctx);
        ctx.log(`${p.name} restocked the row.`);
      },
    },
    {
      key: 'showroom', ring: 1, name: 'Showroom', text: `+1 blue per face-up member costing ${PRICEY} or more.`,
      estimate: ctx => showroomCount(ctx),
      resolve(ctx, p) { ctx.gain(p, B, showroomCount(ctx), { fromAction: true }); },
    },
    {
      key: 'clearance', ring: 2, name: 'Clearance', text: 'Recruit a face-up member now for half its cost (rounded down), in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, half),
      resolve(ctx, p) { offerRow(ctx, p, half, 'Clearance'); },
    },
    {
      key: 'pricecheck', ring: 2, name: 'Price Check', text: 'Gain blue equal to the cost of your priciest member.',
      estimate: (ctx, p) => priciest(ctx, p),
      resolve(ctx, p) { ctx.gain(p, B, priciest(ctx, p), { fromAction: true }); },
    },
    {
      key: 'spree', ring: 3, name: 'Spree', text: 'This turn you buy 3 times.',
      estimate: (ctx, p) => Math.min(10, Math.max(0, totalRes(p) - 3)) * 0.8,
      resolve(ctx, p) { extraBuys(ctx, p, 2); ctx.log(`${p.name} goes on a spree: 3 buys this turn.`); },
    },
  ],

  handlers: {
    pickRow(ctx, p, uid, data) {
      if (uid === null) { ctx.log(`${data.why}: ${p.name} recruits nothing.`); return; }
      const c = ctx.card(uid);
      buyAt(ctx, p, uid, 0, data.why === 'Clearance' ? half(c) : priceOf(c), data.why);
    },
    pay(ctx, p, v, data) { payAndRecruit(ctx, p, v, data); },
    blackMarket(ctx, p, uid) {
      if (uid === null) return;
      const c = ctx.card(uid);
      const list = payVectors(ctx, p, colorOf(ctx, c), c.def.s, c.def.w);
      if (!list.length) return;
      const data = { uid, why: 'Black Market', fromPile: true };
      if (list.length === 1) { payAndRecruit(ctx, p, list[0], data); return; }
      ctx.choose(p, `Black Market: how do you pay for ${c.def.name}?`, list.map((v, i) => ({
        id: `pay:${ctx.state.resources.map(r => v[r] || 0).join('-')}`, label: payLabel(v), kind: 'pay', value: v, hint: i === 0 ? 1 : 0,
      })), `${Q}.pay`, data);
    },
    tradeIn(ctx, p, uid) {
      if (uid === null) return;
      const c = ctx.card(uid);
      p.members.splice(p.members.indexOf(uid), 1);
      ctx.state.pile.push(uid);
      p.discount += priceOf(c);
      ctx.log(`${p.name}'s Social Climber trades in ${c.def.name}: next member costs ${priceOf(c)} less.`);
    },
  },

  members: [
    m('dealer', 'Dealer', 2, 1, 'Whenever anyone recruits a blue member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) {
        if (rec.uid !== card.uid && isBlue(ctx.defOf(rec))) ctx.gain(owner, B, 1);
      },
    }),
    m('broker', 'Broker', 2, 2, `Whenever a rival recruits a member costing ${PRICEY} or more, +1 blue.`, {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && priceOf(rec) >= PRICEY) ctx.gain(owner, B, 1); },
    }),
    m('connoisseur', 'Connoisseur', 2, 1, `Whenever you recruit a member costing ${PRICEY} or more, +2 blue.`, {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && priceOf(rec) >= PRICEY) ctx.gain(owner, B, 2); },
    }),
    m('reseller', 'Reseller', 2, 2, 'Whenever you recruit, +1 of that member’s color.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid) ctx.gain(owner, colorOf(ctx, rec), 1); },
    }),
    m('curator', 'Curator', 2, 1, `At round start, +1 blue per member you have costing ${MID} or more.`, {
      onRoundStart(ctx, owner) { ctx.gain(owner, B, ctx.membersOf(owner).filter(c => priceOf(c) >= MID).length); },
    }),
    m('regular', 'Regular', 1, 1, 'At round start, your next member costs 1 less per round number.', {
      onRoundStart(ctx, owner) { owner.discount += ctx.state.round; },
    }),
    m('underbidder', 'Underbidder', 1, 0, 'At round start, your next member costs 1 less per rival with more members than you.', {
      onRoundStart(ctx, owner) { owner.discount += rivalsBigger(ctx, owner); },
    }),
    m('minimalist', 'Minimalist', 2, 1, 'At round start, +1 blue per member fewer than the rival with the most.', {
      onRoundStart(ctx, owner) {
        const gap = Math.max(0, ...ctx.rivals(owner).map(o => ctx.memberCount(o))) - ctx.memberCount(owner);
        if (gap > 0) ctx.gain(owner, B, gap);
      },
    }),
    m('climber', 'Social Climber', 1, 1, 'At round start, you may send one of your members to the bottom of the pile; your next member costs that much less.', {
      onRoundStart(ctx, owner, card) {
        const own = ctx.membersOf(owner).filter(c => c.uid !== card.uid);
        if (!own.length) return;
        const top = Math.max(0, ...ctx.shopCards().map(priceOf));
        ctx.choose(owner, 'Social Climber: trade in a member?', [
          { id: 'none', label: 'Keep everyone', kind: 'pass', value: null, hint: 0 },
          ...own.map(c => ({
            id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)} off)`, kind: 'member', value: c.uid,
            // bots trade a plain cheap member up when the row has something pricier
            hint: c.def.vanilla && priceOf(c) >= 1 && top >= priceOf(c) + 3 ? 1 + priceOf(c) * 0.1 : -1,
          })),
        ], `${Q}.tradeIn`);
      },
    }),
    m('auctioneer', 'Auctioneer', 1, 1, `Whenever a rival recruits a member costing ${CHEAP} or less, +1 blue.`, {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && priceOf(rec) <= CHEAP) ctx.gain(owner, B, 1); },
    }),
    m('sommelier', 'Sommelier', 1, 1, `Whenever you recruit a member costing ${PRICEY} or more, your next member costs 1 less.`, {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && priceOf(rec) >= PRICEY) owner.discount += 1; },
    }),
    m('patroness', 'Patroness', 3, 2, `Whenever you recruit a member costing ${LUXURY} or more, +1 follower.`, {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && priceOf(rec) >= LUXURY) owner.bonus += 1; },
    }),
    m('blackmarket', 'Black Market', 2, 1, 'Once per game, on your turn: also look at the top 5 of the pile and recruit one at its cost.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const opts = ctx.state.pile.slice(0, 5).map(u => ctx.card(u))
          .filter(c => payVectors(ctx, owner, colorOf(ctx, c), c.def.s, c.def.w).length)
          .map(c => ({ id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)})`, kind: 'card', value: c.uid, hint: botWorth(c) }));
        if (!opts.length) { ctx.log(`${owner.name}'s Black Market has nothing affordable.`); return; }
        opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
        ctx.choose(owner, 'Black Market: recruit which of the top 5?', opts, `${Q}.blackMarket`);
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && totalRes(owner) >= 8,
    }),
    m('snob', 'Snob', 2, 2, `Game end: +1 follower per member you have costing ${PRICEY} or more.`, {
      onGameEnd: (ctx, owner) => priceyCount(ctx, owner),
    }),
    m('recluse', 'Recluse', 2, 1, 'Game end: +2 followers per rival with more members than you.', {
      onGameEnd: (ctx, owner) => 2 * rivalsBigger(ctx, owner),
    }),
  ],
};

export default market;

let installed = false;
/** Register Blue with the engine (tests and scripts call this; index.js is untouched). */
export function install() {
  if (installed) return market;
  registerQuadrant(market);
  installed = true;
  return market;
}

function rivalsBigger(ctx, p) { const mine = ctx.memberCount(p); return ctx.rivals(p).filter(o => ctx.memberCount(o) > mine).length; }
function showroomCount(ctx) { return ctx.shopCards().filter(c => priceOf(c) >= PRICEY).length; }
function priciest(ctx, p) { return Math.max(0, ...ctx.membersOf(p).map(priceOf)); }
