// White: the exchange. Your followers are liquid: sell them for white when you need fuel, buy them back cheap.
// Most white at round end takes the ring's followers.
//
// Rules this module adds:
// - You can only sell followers you've won or bought (p.bonus). Never yourself, never your members.
//   So nobody can drop below 1 follower, and nobody sells in round I unless they bought followers first.
// - "Sell" is White's own verb: White members can react to it (onSell), which only White's actions and
//   members call.
//
// Prototype notes (engine changes this module would like, see design/spheres/trading.md):
// - core.js pays a member's colored part from p.res[def.quadrant], which assumes quadrant id === resource.
//   Here id 'trading' ≠ resource 'white', so install() relabels the member defs' quadrant to 'white'.
//   Real fix (one line each in paymentPlan and memberPayOk): use quadrant(def.quadrant).resource.
// - Actions can't leave anything due later (a loan repaid at game end) because only members have
//   round-end and game-end hooks. That's why the loan lives on a member (Lender), not on a space.
import { registerQuadrant, defById } from './index.js';

const W = 'white';
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

/** Followers you can sell: the ones you've won or bought. */
export const sellable = p => p.bonus;
const ahead = (ctx, p) => ctx.rivals(p).filter(o => ctx.followers(o) > ctx.followers(p)).length;
// How bots value a follower against one resource, by round (resources compound early, followers are the score late).
const fv = ctx => [1.6, 1.3, 1.2][ctx.state.round - 1] ?? 1.2;
const lastTurn = (ctx, p) => ctx.state.round === 3 && p.left === 0;

export const SELL_HIGH = { most: 2, each: 3 };
export const PAWN = { base: 2, each: 2 };
// Boom pays this many followers per white (experiments may set halves; followers are rounded down)
export const BOOM = { per: 2 };
// experiment knob: greedy bots' appetite for selling followers
export const BOTS = { sell: true };

/** Sell k followers for `each` white apiece. Fires onSell on the seller's members (a Doppelganger's copy too). */
export function sell(ctx, p, k, each, { fromAction = false, why = 'sold' } = {}) {
  k = Math.min(k, sellable(p));
  if (!(k > 0)) return 0;
  p.bonus -= k;
  ctx.gain(p, W, k * each, { fromAction });
  ctx.log(`${p.name} ${why} ${k} follower${k > 1 ? 's' : ''} for ${k * each} white.`);
  for (const c of ctx.membersOf(p)) {
    for (const d of [c.def, c.copy ? defById(c.copy) : null]) if (d?.onSell) d.onSell(ctx, p, c, k);
  }
  return k;
}

function sellChoice(ctx, p, prompt, most, each, why) {
  const max = Math.min(most, sellable(p));
  if (max <= 0) return;
  const v = fv(ctx), late = lastTurn(ctx, p);
  const opts = [];
  for (let k = 0; k <= max; k++) {
    opts.push({
      id: `amount:${k}`, label: k === 0 ? 'Sell none' : `Sell ${k} for ${k * each} white`, kind: 'amount', value: k,
      hint: late || !BOTS.sell ? -k : k * (each - v),
    });
  }
  ctx.choose(p, prompt, opts, 'trading.sell', { each, why });
}

function cashInChoice(ctx, p) {
  const w = p.res[W];
  if (!w) return;
  const amounts = [...new Set([0, Math.floor(w / 4), Math.floor(w / 2), Math.floor((3 * w) / 4), w])];
  ctx.choose(p, `Cash In: trade how much white for followers, 1 for 1? (you have ${w})`, amounts.map(x => ({
    id: `amount:${x}`, label: x === 0 ? 'None' : x === w ? `All ${x}` : `${x}`, kind: 'amount', value: x,
    // bots keep white early (it buys members) and cash it late
    hint: ctx.state.round === 3 ? x : x === Math.floor(w / 2) ? 1 : 0,
  })), 'trading.cashIn');
}

const trading = {
  id: 'trading',
  name: 'White',
  resource: W,
  scoring: { label: 'Most white', score: (ctx, p) => p.res[W] },

  actions: [
    {
      key: 'haggle', ring: 1, name: 'Haggle', text: '+2 white, and +1 white per player with more followers than you.',
      estimate: (ctx, p) => 2 + ahead(ctx, p),
      resolve(ctx, p) { ctx.gain(p, W, 2 + ahead(ctx, p), { fromAction: true }); },
    },
    {
      key: 'buylow', ring: 1, name: 'Buy Low', text: 'Trade up to 1 resource per round number for 2 followers each.',
      estimate: (ctx, p) => Math.min(ctx.state.round, totalRes(p)) * (2 * fv(ctx) - 1) + 0.4,
      resolve(ctx, p) {
        if (!totalRes(p)) { ctx.log(`${p.name} had nothing to trade.`); return; }
        buyLowStep(ctx, p, { left: ctx.state.round, done: 0 });
      },
    },
    {
      key: 'pawn', ring: 1, name: 'Pawn', text: '+2 white, and sell up to 1 follower per round number for 2 white each.',
      estimate: (ctx, p) => PAWN.base + Math.min(ctx.state.round, sellable(p)) * Math.max(0, PAWN.each - fv(ctx)),
      resolve(ctx, p) {
        ctx.gain(p, W, PAWN.base, { fromAction: true });
        sellChoice(ctx, p, `Pawn: sell how many followers for ${PAWN.each} white each?`, ctx.state.round, PAWN.each, 'pawned');
      },
    },
    {
      key: 'sellhigh', ring: 2, name: 'Sell High', text: 'Sell up to 2 followers for 3 white each.',
      estimate: (ctx, p) => Math.min(SELL_HIGH.most, sellable(p)) * (SELL_HIGH.each - fv(ctx)) * (lastTurn(ctx, p) ? 0 : 1),
      resolve(ctx, p) {
        if (!sellable(p)) { ctx.log(`${p.name} had no followers to sell.`); return; }
        sellChoice(ctx, p, 'Sell High: sell how many followers for 3 white each?', SELL_HIGH.most, SELL_HIGH.each, 'sold');
      },
    },
    {
      key: 'cashin', ring: 2, name: 'Cash In', text: '+1 follower, then trade any of your white for followers, 1 for 1.',
      estimate: (ctx, p) => fv(ctx) + p.res[W] * (ctx.state.round === 3 ? 0.4 : 0.2),
      resolve(ctx, p) {
        actionFollowers(ctx, p, 1);
        ctx.log(`${p.name} cashes in: +1 follower.`);
        cashInChoice(ctx, p);
      },
    },
    {
      key: 'boom', ring: 3, name: 'Boom', text: 'Each white you have becomes 2 followers.',
      estimate: (ctx, p) => p.res[W] * (BOOM.per * fv(ctx) - 1),
      resolve(ctx, p) {
        const w = p.res[W], f = Math.floor(BOOM.per * w);
        p.res[W] = 0;
        actionFollowers(ctx, p, f);
        ctx.log(w ? `${p.name}'s Boom: ${w} white became ${f} followers.` : `${p.name} had no white to turn into followers.`);
      },
    },
  ],

  handlers: {
    sell(ctx, p, k, data) { sell(ctx, p, k, data.each, { fromAction: true, why: data.why }); },
    buyLow(ctx, p, value, data) {
      if (value === 'done') return;
      buyLow(ctx, p, value);
      buyLowStep(ctx, p, { left: data.left - 1, done: data.done + 1 });
    },
    cashIn(ctx, p, x) {
      if (!x) return;
      p.res[W] -= x; p.bonus += x;
      ctx.log(`${p.name} traded ${x} white for ${x} followers.`);
    },
  },

  members: [
    m('shopkeeper', 'Shopkeeper', 1, 1, 'At round start, +2 white.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, W, 2); },
    }),
    m('dealer', 'Dealer', 1, 1, 'Whenever you sell followers, +1 white each.', {
      onSell(ctx, owner, card, k) { ctx.gain(owner, W, k); },
    }),
    m('pawnbroker', 'Pawnbroker', 1, 0, 'Once per round: sell 1 follower for 3 white.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        // nothing to sell: the use doesn't count
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name} has no followers to sell.`); return; }
        sell(ctx, owner, 1, 3, { why: 'sold (Pawnbroker)' });
      },
      botActivate: (ctx, owner) => sellable(owner) > 0 && ctx.state.round < 3,
    }),
    m('comeback', 'Comeback Kid', 1, 1, 'At round start, +1 white per player with more followers than you.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, W, ahead(ctx, owner)); },
    }),
    m('tipster', 'Tipster', 1, 1, 'Whenever a rival buys followers, +1 white.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) ctx.gain(owner, W, 1); },
    }),
    m('lender', 'Lender', 1, 0, 'When recruited: +5 white. Game end: lose 2 followers.', {
      onRecruited(ctx, owner) { ctx.gain(owner, W, 5); },
      // can't take you below the followers you've won or bought (never yourself or a member)
      onGameEnd: (ctx, owner) => -Math.min(2, owner.bonus),
    }),
    m('magnate', 'Magnate', 3, 2, 'Game end: +1 follower per 2 white.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res[W] / 2),
    }),
    m('shareholder', 'Shareholder', 2, 2, 'Worth 3 followers.', { f: 3 }),
    m('heiress', 'Heiress', 2, 2, 'Once per game: gain followers equal to your white.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const w = owner.res[W];
        owner.bonus += w;
        ctx.log(`${owner.name} used Heiress: +${w} followers.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && (owner.res[W] >= 5 || (owner.left === 0 && owner.res[W] > 0)),
    }),
    m('bargain', 'Bargain Hunter', 3, 2, 'Whenever you buy followers, +1 more.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer === owner) owner.bonus += 1; },
    }),
    m('broker', 'Broker', 1, 0, 'Whenever a White action gives you followers, +1 more.', { brokerBonus: 1 }),
    m('exporter', 'Exporter', 1, 1, 'Whenever you recruit a non-white member, +1 white.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== W) ctx.gain(owner, W, 1);
      },
    }),
    m('changer', 'Money Changer', 1, 1, 'Whenever an action gains you 3+ of another color at once, +1 white.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== W && g.n >= 3) owner.res[W] += 1; },
    }),
    m('reinvestor', 'Reinvestor', 1, 1, 'Whenever you sell followers, your next member costs 1 less per follower sold.', {
      onSell(ctx, owner, card, k) { owner.discount += k; ctx.log(`${owner.name}'s next member costs ${owner.discount} less.`); },
    }),
    m('raider', 'Raider', 2, 1, 'Once per game: buy up to 3 followers from the leader for 1 white each. They get the white.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        const t = raidTarget(ctx, owner);
        const k = t ? raidAmount(ctx, owner, t) : 0;
        if (!k) { card.used = false; ctx.log(`${owner.name}'s Raider found no one to buy from.`); return; }
        owner.res[W] -= k; t.res[W] += k;
        t.bonus -= k; owner.bonus += k;
        ctx.log(`${owner.name}'s Raider bought ${k} follower${k > 1 ? 's' : ''} from ${t.name} for ${k} white.`);
      },
      botActivate: (ctx, owner) => { const t = raidTarget(ctx, owner); return !!t && raidAmount(ctx, owner, t) >= 2; },
    }),
  ],
};

const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
// Buy Low pays one resource at a time (you pick the color), until the round's limit or Done.
function buyLowStep(ctx, p, data) {
  const held = ctx.state.resources.filter(r => p.res[r] > 0);
  if (data.left <= 0 || !held.length) return;
  const v = fv(ctx);
  const opts = held.map(r => ({
    id: `color:${r}`, label: `1 ${r} → 2 followers`, kind: 'color', value: r,
    // bots pay from the biggest pile, white last (it scores here); late in round III they spend everything
    hint: (2 * v - 1) + 0.01 * (p.res[r] - (r === W ? 3 : 0) - (r === 'gold' ? 1 : 0)),
  }));
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Trade nothing', kind: 'done', value: 'done', hint: 0.9 });
  ctx.choose(p, `Buy Low: pay which resource for 2 followers? (${data.left} left)`, opts, 'trading.buyLow', data);
}
function buyLow(ctx, p, color) {
  p.res[color] -= 1;
  actionFollowers(ctx, p, 2);
  ctx.log(`${p.name} traded 1 ${color} for 2 followers.`);
}
/** Followers from a White action, plus 1 per Broker (a Doppelganger's copy counts too). */
function actionFollowers(ctx, p, n) {
  if (!(n > 0)) return;
  let extra = 0;
  for (const c of ctx.membersOf(p)) for (const d of [c.def, c.copy ? defById(c.copy) : null]) extra += d?.brokerBonus || 0;
  p.bonus += n + extra;
  if (extra) ctx.log(`${p.name}'s Broker: +${extra} follower${extra > 1 ? 's' : ''}.`);
}

/** The leader: most followers, and more than you. Ties go to whoever has more followers to sell. */
function raidTarget(ctx, p) {
  const top = Math.max(...ctx.state.players.map(o => ctx.followers(o)));
  if (ctx.followers(p) >= top) return null;
  return ctx.rivals(p).filter(o => ctx.followers(o) === top).sort((a, b) => b.bonus - a.bonus)[0];
}
function raidAmount(ctx, p, t) {
  return Math.min(3, t.bonus, p.res[W]);
}

export default trading;

let installed = false;
/** Register White with the engine (tests and scripts call this; index.js is untouched). */
export function install() {
  if (installed) return trading;
  registerQuadrant(trading);
  // engine workaround: member colored parts are paid from p.res[def.quadrant]
  for (const d of trading.members) d.quadrant = W;
  installed = true;
  return trading;
}
