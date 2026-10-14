// Blue (the market): bend the shop. Recruit outside your buy, ignore colors, pay half, churn the row.
// Scoring is switchable while Cory decides (setScoring): 'pricey' = most badged members (default),
// 'value' = most member value (total printed cost). Blue members break ties either way.
// A member is badged when it costs BADGE or more; the UI marks badged members so nobody adds up prices.
// Gold hoards money and Red piles up cheap members; Blue holds a few expensive ones, bought cheap.
import { registerQuadrant } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const B = 'blue';
const Q = 'market';
// One cutoff, scaled with member costs (they doubled 2026-10-14: 4 became 8).
export let BADGE = 8;
/** Move the cutoff (tests written against small pinned costs use 4). */
export function setBadge(n) { BADGE = n; }
const isBlue = def => def.quadrant === Q;

/** Printed cost of a member (before any discount). */
export const priceOf = c => c.def.s + c.def.w;
/** Total printed cost of a player's members. */
export const memberValue = (ctx, p) => ctx.membersOf(p).reduce((s, c) => s + priceOf(c), 0);
/** Badged: a member def whose printed cost is BADGE or more (the screen marks these with one helper, this one). */
export const badgedDef = def => def.s + def.w >= BADGE;
/** Badged: costs BADGE or more. */
export const badged = c => badgedDef(c.def);
/** How many badged members a player holds. */
export const priceyCount = (ctx, p) => ctx.membersOf(p).filter(badged).length;
const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
// A member's color, or null when its sphere isn't on this table (a guest member leaning to an absent sphere):
// then its colored part is paid in any colors, and nothing gains 'its color'.
const colorOf = (ctx, c) => { const r = ctx.quadrant(c.def.quadrant).resource; return ctx.state.resources.includes(r) ? r : null; };
// what a bot thinks a member is worth to it (mirrors the greedy buy score)
const botWorth = c => c.def.f * 1.4 + (c.def.vanilla ? 0 : 1.6) + priceOf(c) * 0.3;

let MODE = 'pricey';
// Measuring knob: with lean on, Snap Up and Half Price use up your buy this turn instead of adding a recruit.
// Half Price always uses your buy; this knob makes Snap Up's recruit use it too.
let LEAN = false;
export function setLean(on) { LEAN = !!on; }
/** Switch Blue's scoring rule (for measuring): 'pricey' or 'value'. */
export function setScoring(mode) { MODE = mode; market.scoring.label = LABELS[mode]; }
const LABELS = { pricey: 'Most badged members', value: 'Most member value' };
const blueCount = (ctx, p) => ctx.membersOf(p).filter(c => isBlue(c.def)).length;

// ---------- paying outside the normal buy ----------
// Every exact way to pay `s` of `color` plus `w` of anything. Gold is spent last by default.
function payVectors(ctx, p, color, s, w) {
  if (!color) { w += s; s = 0; }
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
  // a member's own recruit names the member ("P1's Talent Scout: pays …"); an action's names the action
  ctx.log(fromPile ? `${p.name}'s ${why}: pays ${payLabel(v)} for ${card.def.name}.` : `${why}: ${p.name} pays ${payLabel(v)} for ${card.def.name}.`);
  if ((why === 'Half Price' || (LEAN && why === 'Snap Up')) && !fromPile) {
    const q = ctx.state.queue, k = q.findIndex(t => t.t === 'buy' && !t.extra && t.p === p.id);
    // it is this turn's buy: it counts as a real first buy, so a second buy (Big Spender) still follows
    if (k >= 0) { q.splice(k, 1); p.turnBuys = (p.turnBuys || 0) + 1; }
  }
  // paid for here, so the engine takes no payment; `paid` tells a copy (Green) this wasn't a free member
  ctx.recruit(p, uid, { free: true, paid: Object.values(v).some(n => n > 0) });
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
    show: (ctx, p) => ({ count: MODE === 'value' ? memberValue(ctx, p) : priceyCount(ctx, p), tiebreak: blueCount(ctx, p) }),
    get counts() {
      return MODE === 'value' ? 'the total printed cost of your members'
        : `your badged members: members whose printed cost is ${BADGE} or more`;
    },
    tiebreak: { unit: 'blue members', text: 'blue members break ties' },
  },

  actions: [
    {
      key: 'bargain', ring: 1, name: 'Snap Up', text: '+2 blue, then you may recruit a face-up member now, in any colors.',
      estimate: (ctx, p) => 2 + bestRowValue(ctx, p, priceOf) * 0.3,
      resolve(ctx, p) { ctx.gain(p, B, 2, { fromAction: true }); offerRow(ctx, p, priceOf, 'Snap Up'); },
    },
    {
      key: 'restock', ring: 1, name: 'New Faces', text: '+2 blue, and sweep the face-up row: a fresh row of members comes out.',
      estimate: () => 2.4,
      resolve(ctx, p) {
        ctx.gain(p, B, 2, { fromAction: true });
        sweepRow(ctx);
        ctx.log(`${p.name} restocked the row.`);
      },
    },
    {
      key: 'showroom', ring: 1, name: 'Name Drop', text: '+1 blue per badged face-up member.',
      estimate: ctx => showroomCount(ctx),
      resolve(ctx, p) {
        const k = showroomCount(ctx);
        if (!k) ctx.log(`Name Drop: no badged member is face up, so ${p.name} gains nothing.`);
        ctx.gain(p, B, k, { fromAction: true });
      },
    },
    {
      key: 'clearance', ring: 2, name: 'Half Price', text: 'As your buy this turn: a face-up member for half its cost (rounded down), in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, half),
      resolve(ctx, p) { offerRow(ctx, p, half, 'Half Price'); },
    },
    {
      key: 'pricecheck', ring: 2, name: 'Show Off', text: 'Gain blue equal to half the cost of your priciest member.',
      estimate: (ctx, p) => Math.floor(priciest(ctx, p) / 2),
      resolve(ctx, p) {
        const k = Math.floor(priciest(ctx, p) / 2);
        if (!k) ctx.log(`Show Off: ${p.name} has no member costing 2 or more, so gains nothing.`);
        ctx.gain(p, B, k, { fromAction: true });
      },
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
      buyAt(ctx, p, uid, 0, data.why === 'Half Price' ? half(c) : priceOf(c), data.why);
    },
    pay(ctx, p, v, data) { payAndRecruit(ctx, p, v, data); },
    blackMarket(ctx, p, uid) {
      if (uid === null) return;
      const c = ctx.card(uid);
      const list = payVectors(ctx, p, colorOf(ctx, c), c.def.s, c.def.w);
      if (!list.length) return;
      const data = { uid, why: 'Talent Scout', fromPile: true };
      if (list.length === 1) { payAndRecruit(ctx, p, list[0], data); return; }
      ctx.choose(p, `Talent Scout: how do you pay for ${c.def.name}?`, list.map((v, i) => ({
        id: `pay:${ctx.state.resources.map(r => v[r] || 0).join('-')}`, label: payLabel(v), kind: 'pay', value: v, hint: i === 0 ? 1 : 0,
      })), `${Q}.pay`, data);
    },
    climb(ctx, p, color) {
      ctx.gain(p, color, 2);
      ctx.log(`${p.name}'s Social Climber: +2 ${color}.`);
    },
  },

  members: [
    m('stylist', 'Stylist', 2, 2, 'Whenever anyone recruits a blue member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) {
        if (rec.uid !== card.uid && isBlue(ctx.defOf(rec))) ctx.gain(owner, B, 1);
      },
    }),
    m('onlooker', 'Onlooker', 6, 4, 'Whenever a rival recruits a badged member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && badged(rec)) ctx.gain(owner, B, 1); },
    }),
    m('connoisseur', 'Connoisseur', 2, 2, 'Whenever you recruit a badged member, +2 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && badged(rec)) ctx.gain(owner, B, 2); },
    }),
    m('reseller', 'Reseller', 8, 4, 'Whenever you recruit, +1 of that member’s color.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && colorOf(ctx, rec)) ctx.gain(owner, colorOf(ctx, rec), 1); },
    }),
    m('curator', 'Curator', 2, 2, 'Now and at round start, +1 blue per badged member you have.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, B, priceyCount(ctx, owner)); },
    }),
    m('planner', 'Planner', 2, 2, 'Now and at round start, your next member costs 2 less per round number.', { now: true,
      onRoundStart(ctx, owner) { owner.discount += 2 * ctx.state.round; },
    }),
    m('underbidder', 'Underbidder', 2, 0, 'Now and at round start, your next member costs 2 less per rival with more members than you.', { now: true,
      onRoundStart(ctx, owner) { owner.discount += 2 * rivalsBigger(ctx, owner); },
    }),
    m('minimalist', 'Minimalist', 2, 0, 'Now and at round start, +1 blue per rival with more members than you.', { now: true,
      onRoundStart(ctx, owner) { const k = rivalsBigger(ctx, owner); if (k) ctx.gain(owner, B, k); },
    }),
    // replaced (Claude under Cory's go-with-your-gut, from the dead-window audit): the old round-start trade-in never fired
    // in bot play, and the base Release rule does its job better. Releasing the Climber itself gives nothing extra.
    m('climber', 'Social Climber', 2, 0, 'Whenever you release another member, +2 of any color you choose.', {
      onRelease(ctx, owner) {
        ctx.choose(owner, 'Social Climber: +2 of which color?', ctx.state.resources.map(c => ({
          // bots take the color they hold least of
          id: `color:${c}`, label: `+2 ${c}`, kind: 'color', value: c, hint: -(owner.res[c] || 0),
        })), `${Q}.climb`);
      },
    }),
    m('auctioneer', 'Auctioneer', 4, 2, 'Whenever a rival recruits an unbadged member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && !badged(rec)) ctx.gain(owner, B, 1); },
    }),
    m('sommelier', 'Sommelier', 2, 2, 'Whenever you recruit a badged member, your next member costs 2 less.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && badged(rec)) owner.discount += 2; },
    }),
    m('patroness', 'Patroness', 4, 4, 'Whenever you recruit a badged member, +1 follower.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && badged(rec)) owner.bonus += 1; },
    }),
    m('blackmarket', 'Talent Scout', 2, 2, 'Once per game, on your turn: also look at the top 5 of the pile and recruit one at its cost.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const opts = ctx.state.pile.slice(0, 5).map(u => ctx.card(u))
          .filter(c => payVectors(ctx, owner, colorOf(ctx, c), c.def.s, c.def.w).length)
          .map(c => ({ id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)})`, kind: 'card', value: c.uid, hint: botWorth(c) }));
        if (!opts.length) { ctx.log(`${owner.name}'s Talent Scout has nothing affordable.`); return; }
        opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
        ctx.choose(owner, 'Talent Scout: recruit which of the top 5?', opts, `${Q}.blackMarket`);
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && totalRes(owner) >= 8,
    }),
    m('snob', 'Snob', 6, 4, 'Game end: +1 follower per badged member you have.', {
      onGameEnd: (ctx, owner) => priceyCount(ctx, owner),
    }),
    m('recluse', 'Recluse', 2, 2, 'Game end: +2 followers per rival with more members than you.', {
      onGameEnd: (ctx, owner) => 2 * rivalsBigger(ctx, owner),
    }),
  ],
};

// Badge flag for the UI, derived from cost so repricing keeps it right. (Engine-wide, the same getter
// belongs in content/index.js index() for every member def.)
for (const d of market.members) Object.defineProperty(d, 'badge', { get() { return this.s + this.w >= BADGE; }, enumerable: true });

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
function showroomCount(ctx) { return ctx.shopCards().filter(badged).length; }
function priciest(ctx, p) { return Math.max(0, ...ctx.membersOf(p).map(priceOf)); }
