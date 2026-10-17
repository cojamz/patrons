// Blue (the market): bend the shop. Recruit outside your buy, ignore colors, pay half, churn the row.
// Scoring: most blue (Cory, 2026-10-15; the old rule counted members costing 8 or more, a cutoff he cut).
// Blue's members watch who recruits blue members, and Blue's spaces pay out in blue.
import { registerQuadrant } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const B = 'blue';
const Q = 'market';
const isBlue = def => def.quadrant === Q;

/** Printed cost of a member (before any discount). */
export const priceOf = c => c.def.s + c.def.w;
/** Total printed cost of a player's members. */
export const memberValue = (ctx, p) => ctx.membersOf(p).reduce((s, c) => s + priceOf(c), 0);
const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
// A member's color, or null when its sphere isn't on this table (a guest member leaning to an absent sphere):
// then its colored part is paid in any colors, and nothing gains 'its color'.
const colorOf = (ctx, c) => { const r = ctx.quadrant(c.def.quadrant).resource; return ctx.state.resources.includes(r) ? r : null; };
// what a bot thinks a member is worth to it (mirrors the greedy buy score)
const botWorth = c => c.def.f * 1.4 + (c.def.vanilla ? 0 : 1.6) + priceOf(c) * 0.3;

// Measuring knob: with lean on, Snap Up and Half Price use up your buy this turn instead of adding a recruit.
// Half Price always uses your buy; this knob makes Snap Up's recruit use it too.
let LEAN = false;
export function setLean(on) { LEAN = !!on; }

// ---------- paying outside the normal buy ----------
// One price rule (the engine's memberPrice, through ctx.price / ctx.payChoices): every discount and rule-changer
// applies here as in the buy step (Intro Offer, Sponsor, Penny Pincher's double gold). how: Snap Up { anyColors },
// Half Price { anyColors, half }, Talent Scout {} (at its cost).
const SNAP = { anyColors: true }, HALF = { anyColors: true, half: true };
const howFor = why => (why === 'Half Price' ? HALF : why === 'Snap Up' ? SNAP : {});
const payLabel = v => Object.entries(v).filter(([, n]) => n).map(([c, n]) => `${n} ${c}`).join(', ') || 'nothing';

/** Recruit `uid` from the face-up row at the price `how` sets (the player picks how to pay). */
function buyAt(ctx, p, uid, how, why) {
  if (!ctx.payChoices(p, uid, how).length) return;
  askPay(ctx, p, `${why}: how do you pay ${ctx.price(p, uid, how).total} for ${ctx.card(uid).def.name}?`, { uid, why, how });
}
/**
 * The buy step's pay rule, for every recruit outside it (Snap Up, Half Price, Talent Scout): one way to pay pays at
 * once, unless that way gives up a lead or tie you hold (then the pay sheet asks, saying so, with Cancel); more than
 * one way, the player picks (decisions.md, 2026-10-15 17:55; panel tester C: a member-ability buy paid silently).
 */
function askPay(ctx, p, prompt, data) {
  const list = ctx.payChoices(p, data.uid, data.how || {});
  if (!list.length) return;
  const asks = list.length > 1 || ctx.leadsLost(p, list[0]).length > 0;
  if (!asks) { payAndRecruit(ctx, p, list[0], data); return; }
  // uid and how ride on each way to pay, so a screen can show the member and its price (the pay sheet); ids unchanged
  const opts = list.map((v, i) => ({
    id: `pay:${ctx.state.resources.map(r => v[r] || 0).join('-')}`, label: payLabel(v), kind: 'pay', value: v, hint: i === 0 ? 1 : 0, uid: data.uid, how: data.how || {},
  }));
  // the one way gives up a lead: the sheet's Cancel recruits nothing
  if (list.length === 1) opts.push({ id: 'back', label: 'Cancel', kind: 'back', value: null, hint: -1 });
  ctx.choose(p, prompt, opts, `${Q}.pay`, data);
}
function payAndRecruit(ctx, p, v, { uid, why, fromPile, how = howFor(why) }) {
  const card = ctx.card(uid);
  const pile = ctx.state.pile;
  if (fromPile && pile.includes(uid)) {
    // lift it out of the pile into the row for a moment, so it is recruited the normal way
    pile.splice(pile.indexOf(uid), 1);
    ctx.state.shop.push(uid);
  }
  if (!ctx.state.shop.includes(uid)) { ctx.log(`${why}: ${card.def.name} is gone.`); return; }
  // a member's own recruit names the member ("P1's Talent Scout: pays …"); an action's names the action
  ctx.log(fromPile ? `${p.name}'s ${why}: pays ${payLabel(v)} for ${card.def.name}.` : `${why}: ${p.name} pays ${payLabel(v)} for ${card.def.name}.`);
  if ((why === 'Half Price' || (LEAN && why === 'Snap Up')) && !fromPile) {
    const q = ctx.state.queue, k = q.findIndex(t => t.t === 'buy' && !t.extra && t.p === p.id);
    // it is this turn's buy: it counts as a real first buy, so a second buy (Big Spender) still follows
    if (k >= 0) { q.splice(k, 1); p.turnBuys = (p.turnBuys || 0) + 1; }
  }
  // the engine takes the payment (and spends a discount) by the same price rule; `paid` tells a copy (Green) this
  // wasn't a free member
  ctx.recruit(p, uid, { spend: v, how, paid: true });
}

/** Offer face-up members the player can pay for at the price `how` sets, in any colors. */
function offerRow(ctx, p, how, why) {
  const opts = ctx.shopCards().map(c => [c, ctx.price(p, c.uid, how)]).filter(([, pr]) => pr.afford).map(([c, pr]) => ({
    id: `card:${c.uid}`, label: `${c.def.name} · pay ${pr.total}`, kind: 'card', value: c.uid, hint: botWorth(c) + (priceOf(c) - pr.total) * 0.5,
  }));
  if (!opts.length) { ctx.log(`${why}: ${p.name} can't pay for anything.`); return; }
  opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
  ctx.choose(p, `${why}: recruit which member?`, opts, `${Q}.pickRow`, { why });
}
function bestRowValue(ctx, p, how) {
  const ok = ctx.shopCards().map(c => [c, ctx.price(p, c.uid, how)]).filter(([, pr]) => pr.afford);
  return ok.length ? Math.max(...ok.map(([c, pr]) => botWorth(c) + (priceOf(c) - pr.total) * 0.6)) : 0;
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
  scoring: { label: 'Most blue', counts: 'the blue you hold when the round ends', score: (ctx, p) => p.res[B] || 0 },

  actions: [
    {
      key: 'bargain', ring: 1, name: 'Snap Up', text: '+2 blue. You may then pay for a member in the shop using any colors, in addition to your normal buy.',
      estimate: (ctx, p) => 2 + bestRowValue(ctx, p, SNAP) * 0.3,
      resolve(ctx, p) { ctx.gain(p, B, 2, { fromAction: true }); offerRow(ctx, p, SNAP, 'Snap Up'); },
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
      // was +1 blue per face-up member costing 8 or more (3.1 face up on average, Normal bots); now 1 + 2.3 blue face up
      key: 'showroom', ring: 1, name: 'Name Drop', text: '+1 blue, and +1 per blue member in the shop.',
      estimate: ctx => 1 + showroomCount(ctx),
      resolve(ctx, p) { ctx.gain(p, B, 1 + showroomCount(ctx), { fromAction: true }); },
    },
    {
      key: 'clearance', ring: 2, name: 'Half Price', text: 'As your buy this turn: a face-up member for half its cost (rounded down), in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, HALF),
      resolve(ctx, p) { offerRow(ctx, p, HALF, 'Half Price'); },
    },
    {
      key: 'pricecheck', ring: 2, name: 'Show Off', text: 'Gain blue equal to half the cost of your priciest member (rounded down).',
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
      buyAt(ctx, p, uid, howFor(data.why), data.why);
    },
    pay(ctx, p, v, data) {
      if (!v) { ctx.log(`${data.why}: ${p.name} recruits nothing.`); return; }
      payAndRecruit(ctx, p, v, data);
    },
    blackMarket(ctx, p, uid) {
      if (uid === null) return;
      const c = ctx.card(uid);
      if (!scoutChoices(ctx, p, uid).length) return;
      askPay(ctx, p, `Talent Scout: how do you pay for ${c.def.name}?`, { uid, why: 'Talent Scout', fromPile: true, how: {} });
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
    // Onlooker, Connoisseur, Curator, Auctioneer, Sommelier, Patroness and Snob counted members costing 8 or more until
    // Cory cut that cutoff (2026-10-15); they count blue members now, which come about as often (Normal bots, Blue
    // tables: 23% of recruits are blue, 27% cost 8+). Onlooker pays 2, or Stylist (anyone, +1, for 4) would beat it.
    m('onlooker', 'Onlooker', 6, 4, 'Whenever a rival recruits a blue member, +2 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && isBlue(ctx.defOf(rec))) ctx.gain(owner, B, 2); },
    }),
    m('connoisseur', 'Connoisseur', 2, 2, 'Whenever you recruit a blue member, +2 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && isBlue(ctx.defOf(rec))) ctx.gain(owner, B, 2); },
    }),
    m('reseller', 'Reseller', 4, 2, 'Whenever you recruit, +1 of that member’s color.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && colorOf(ctx, rec)) ctx.gain(owner, colorOf(ctx, rec), 1); },
    }),
    m('curator', 'Curator', 2, 2, 'Now and at round start, +1 blue per other blue member you have.', { now: true,
      onRoundStart(ctx, owner, card) { ctx.gain(owner, B, ctx.countMembersOfColor(owner, Q) - (card && isBlue(card.def) ? 1 : 0)); },
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
    m('auctioneer', 'Auctioneer', 4, 2, 'Whenever a rival recruits a non-blue member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && !isBlue(ctx.defOf(rec))) ctx.gain(owner, B, 1); },
    }),
    m('sommelier', 'Sommelier', 2, 2, 'Whenever you recruit a blue member, your next member costs 2 less.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && isBlue(ctx.defOf(rec))) owner.discount += 2; },
    }),
    m('patroness', 'Patroness', 2, 2, 'Whenever you recruit a blue member, +1 follower.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && isBlue(ctx.defOf(rec))) owner.bonus += 1; },
    }),
    m('blackmarket', 'Talent Scout', 2, 2, 'Once per game, on your turn: also look at the top 5 of the pile and recruit one at its cost.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const opts = ctx.state.pile.slice(0, 5).map(u => ctx.card(u))
          .filter(c => scoutChoices(ctx, owner, c.uid).length)
          .map(c => ({ id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)})`, kind: 'card', value: c.uid, hint: botWorth(c) }));
        if (!opts.length) { ctx.log(`${owner.name}'s Talent Scout has nothing affordable.`); return; }
        opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
        ctx.choose(owner, 'Talent Scout: recruit which of the top 5?', opts, `${Q}.blackMarket`);
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && totalRes(owner) >= 8,
    }),
    m('snob', 'Snob', 3, 2, 'Game end: +1 follower per blue member you have.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, Q),
    }),
    m('recluse', 'Recluse', 2, 2, 'Game end: +2 followers per rival with more members than you.', {
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

// Talent Scout recruits from the pile at the member's own price, by the one price rule.
const scoutChoices = (ctx, p, uid) => ctx.payChoices(p, uid, {});
function rivalsBigger(ctx, p) { const mine = ctx.memberCount(p); return ctx.rivals(p).filter(o => ctx.memberCount(o) > mine).length; }
function showroomCount(ctx) { return ctx.shopCards().filter(c => isBlue(c.def)).length; }
function priciest(ctx, p) { return Math.max(0, ...ctx.membersOf(p).map(priceOf)); }
