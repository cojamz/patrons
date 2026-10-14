// White: the exchange. Your followers are liquid: sell them for white when you need fuel, buy them back cheap.
// Most white at round end takes the ring's followers.
//
// Rules this module adds:
// - You can only sell followers you've won or bought (p.bonus). Never yourself, never your members.
//   So nobody can drop below 1 follower, and nobody sells in round I unless they bought followers first.
// - "Sell" is White's own verb: White members can react to it (onSell), which only White's actions and
//   members call.
//
// Engine note (see design/spheres/trading.md):
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
export const BUY_LOW = { per: 2 }; // up to this many resources per round number, 1 for 1
export const LIQUIDATE = { most: 5, each: 2 };
// Boom pays this many followers per resource (experiments try 0.5: 2 resources per follower)
export const BOOM = { per: 1 };
// experiment knob: greedy bots' appetite for selling followers
export const BOTS = { sell: true };

/** Sell k followers for `each` white apiece. Fires onSell on the seller's members (a Doppelganger's copy too). */
export function sell(ctx, p, k, each, { fromAction = false, why = 'sold', by = null } = {}) {
  k = Math.min(k, sellable(p));
  if (!(k > 0)) return 0;
  p.bonus -= k;
  ctx.gain(p, W, k * each, { fromAction });
  // a member's sale names the member ("P1's Pawnbroker: sold 1 follower for 3 white.")
  ctx.log(`${p.name}${by ? `'s ${by}:` : ''} ${why} ${k} follower${k > 1 ? 's' : ''} for ${k * each} white.`);
  // members reacting to the sale (Dealer, Reinvestor) are named in the log like any member hook
  for (const c of ctx.membersOf(p)) {
    for (const d of [c.def, c.copy ? defById(c.copy) : null]) if (d?.onSell) ctx.asMember(p, d.name, () => d.onSell(ctx, p, c, k));
  }
  return k;
}

// Why a sale finds nothing to sell (Cory: a skipped printed part says so in the log).
const NOTHING_TO_SELL = 'no followers to sell yet (only followers you bought or won can be sold)';
function sellChoice(ctx, p, prompt, most, each, why) {
  const max = Math.min(most, sellable(p));
  if (max <= 0) { ctx.log(`${prompt.split(':')[0]}: ${p.name} has ${NOTHING_TO_SELL}.`); return; }
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
  if (!w) { ctx.log(`Cash In: ${p.name} has no white to trade for followers.`); return; }
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
      key: 'buylow', ring: 1, name: 'Buy Low', text: 'Trade up to 2 resources per round number for followers, 1 for 1.',
      estimate: (ctx, p) => Math.min(BUY_LOW.per * ctx.state.round, totalRes(p)) * (fv(ctx) - 0.9) + 0.4,
      resolve(ctx, p) {
        if (!totalRes(p)) { ctx.log(`${p.name} had nothing to trade.`); return; }
        buyLowStep(ctx, p, { left: BUY_LOW.per * ctx.state.round, done: 0 });
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
        if (!sellable(p)) { ctx.log(`Sell High: ${p.name} has ${NOTHING_TO_SELL}.`); return; }
        sellChoice(ctx, p, `Sell High: sell how many followers for ${SELL_HIGH.each} white each?`, SELL_HIGH.most, SELL_HIGH.each, 'sold');
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
      key: 'boom', ring: 3, name: 'Boom', text: 'Trade all your resources for followers, 1 for 1 (you may keep your white).',
      estimate: (ctx, p) => 0.6 * totalRes(p),
      resolve(ctx, p) {
        if (!totalRes(p)) { ctx.log(`${p.name} had nothing to turn into followers.`); return; }
        const all = totalRes(p), rest = all - p.res[W], last = p.left === 0;
        const opts = [{ id: 'boom:all', label: `Everything: ${Math.floor(all * BOOM.per)} followers`, kind: 'boom', value: 'all', hint: last ? 2 : 0.5 }];
        if (p.res[W] && rest) opts.push({ id: 'boom:keep', label: `Keep your white: ${Math.floor(rest * BOOM.per)} followers`, kind: 'boom', value: 'keep', hint: 1 });
        opts.push({ id: 'boom:none', label: 'Nothing', kind: 'boom', value: 'none', hint: 0 });
        ctx.choose(p, 'Boom: trade which resources for followers, 1 for 1?', opts, 'trading.boom');
      },
    },
  ],

  handlers: {
    boom(ctx, p, value) {
      if (value === 'none') return;
      let n = 0;
      for (const r of ctx.state.resources) if (value === 'all' || r !== W) { n += p.res[r]; p.res[r] = 0; }
      const f = Math.floor(n * BOOM.per);
      actionFollowers(ctx, p, f);
      ctx.log(`${p.name}'s Boom: ${n} resources became ${f} followers.`);
    },
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
    m('shopkeeper', 'Shopkeeper', 2, 2, 'At round start, +2 white.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, W, 2); },
    }),
    m('dealer', 'Dealer', 2, 2, 'Whenever you sell followers, +1 white each.', {
      onSell(ctx, owner, card, k) { ctx.gain(owner, W, k); },
    }),
    m('pawnbroker', 'Pawnbroker', 2, 2, 'Once per round: sell 1 follower for 3 white.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        // nothing to sell: the use doesn't count
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name}'s Pawnbroker: ${NOTHING_TO_SELL}.`); return; }
        sell(ctx, owner, 1, 3, { by: 'Pawnbroker' });
      },
      botActivate: (ctx, owner) => sellable(owner) > 0 && ctx.state.round < 3,
    }),
    m('safetynet', 'Safety Net', 2, 0, 'At round start, if you have no white, +3 white.', {
      onRoundStart(ctx, owner) { if (!owner.res[W]) ctx.gain(owner, W, 3); },
    }),
    m('tipster', 'Tipster', 4, 2, 'Whenever a rival buys followers, +1 white.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) ctx.gain(owner, W, 1); },
    }),
    m('lender', 'Lender', 2, 0, 'When it joins you: +5 white. Game end: lose 2 followers.', {
      onRecruited(ctx, owner, card) { payLoan(ctx, owner, card); },
      // a Doppelganger copying Lender is a full copy (Cory): it gets the +5 too. Copies don't run
      // onRecruited, so the loan pays out at the end of the turn the copy was made.
      onTurnEnd(ctx, owner, card) { if (!card.loanPaid) payLoan(ctx, owner, card); },
      // can't take you below the followers you've won or bought (never yourself or a member)
      onGameEnd: (ctx, owner) => -Math.min(2, owner.bonus),
    }),
    m('magnate', 'Magnate', 4, 4, 'Game end: +1 follower per 3 white.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res[W] / 3),
    }),
    m('shareholder', 'Shareholder', 2, 1, 'Worth 3 followers.', { f: 3 }),
    m('heiress', 'Heiress', 6, 4, 'Once per game: +1 white per member you have.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const n = ctx.memberCount(owner);
        ctx.gain(owner, W, n);
        ctx.log(`${owner.name} used Heiress: +${n} white.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 || (ctx.state.round === 2 && ctx.memberCount(owner) >= 6),
    }),
    m('bulkbuyer', 'Bulk Buyer', 4, 2, 'Whenever you buy 3 or more followers, +1 more.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 3) { owner.bonus += 1; ctx.log(`${owner.name}'s Bulk Buyer: +1 follower.`); }
      },
    }),
    m('broker', 'Broker', 2, 2, 'Whenever a White action gives you followers, +1 more.', { brokerBonus: 1 }),
    m('exporter', 'Exporter', 4, 4, 'Whenever you recruit a non-white member, +1 white.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'trading') ctx.gain(owner, W, 1);
      },
    }),
    m('liquidator', 'Liquidator', 4, 2, `Once per game: sell up to ${LIQUIDATE.most} followers for ${LIQUIDATE.each} white each.`, {
      activate: 'game',
      onActivate(ctx, owner, card) {
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name}'s Liquidator: ${NOTHING_TO_SELL}.`); return; }
        // sells as many as it can (up to the cap) the moment you use it, so the white is there for this buy
        sell(ctx, owner, LIQUIDATE.most, LIQUIDATE.each, { why: 'liquidated', by: 'Liquidator' });
      },
      botActivate: (ctx, owner) => ctx.state.round === 2 && sellable(owner) >= 3,
    }),
    m('reinvestor', 'Reinvestor', 2, 2, 'Whenever you sell followers, your next member costs 2 less per follower sold.', {
      onSell(ctx, owner, card, k) { owner.discount += 2 * k; ctx.log(`${owner.name}'s Reinvestor: next member costs ${owner.discount} less.`); },
    }),
    m('raider', 'Raider', 2, 0, 'Once per game: buy up to 3 followers from the leader for 1 white each. They get the white.', {
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
    id: `color:${r}`, label: `1 ${r} → 1 follower`, kind: 'color', value: r,
    // bots pay from the biggest pile, white last (it scores here); they keep a little to recruit with until late
    hint: (v - 1) + 0.01 * (p.res[r] - (r === W ? 3 : 0) - (r === 'gold' ? 1 : 0)),
  }));
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Trade nothing', kind: 'done', value: 'done', hint: totalRes(p) <= 3 && !lastTurn(ctx, p) ? 0.5 : 0.1 });
  ctx.choose(p, `Buy Low: pay which resource for 1 follower? (${data.left} left)`, opts, 'trading.buyLow', data);
}
function payLoan(ctx, owner, card) {
  card.loanPaid = true;
  ctx.gain(owner, W, 5);
  ctx.log(`${owner.name}'s Lender: +5 white.`);
}
function buyLow(ctx, p, color) {
  p.res[color] -= 1;
  actionFollowers(ctx, p, 1);
  ctx.log(`${p.name} traded 1 ${color} for 1 follower.`);
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
  installed = true;
  return trading;
}
