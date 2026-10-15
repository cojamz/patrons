// White: the exchange. Your followers are liquid: sell them for white when you need fuel, draw white on them
// (Dividend), buy them back cheap. Most white at round end takes the ring's followers.
//
// Rules this module adds:
// - You can only sell or spend loose followers: the ones you've won or bought (p.bonus). Never yourself, never your members
//   (Cory, 2026-10-14). So nobody can drop below 1 follower, and nobody sells in round I unless they bought first.
// - "Sell" is White's own verb: White members can react to it (onSell), which only White's actions and
//   members call.
// - No white→followers at par in ring II (2026-10-14 rework, Claude under Cory's go-with-your-gut): Cash In's
//   "trade any white for followers 1 for 1" turned "sell for 3, buy back for 1" into a loop. Sales stay at 3
//   (Sell High, Pawnbroker): measured, a scripted seller doesn't win more, and sellers out-win non-sellers.
//
// Engine note (see design/spheres/trading.md):
// - Actions can't leave anything due later (a loan repaid at game end) because only members have
//   round-end and game-end hooks. That's why the loan lives on a member (Lender), not on a space.
import { registerQuadrant, defById } from './index.js';

const W = 'white';
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

/** Followers you can sell: your loose followers (the ones you've won or bought). */
export const sellable = p => p.bonus;
const ahead = (ctx, p) => ctx.rivals(p).filter(o => ctx.followers(o) > ctx.followers(p)).length;
// How bots value a follower against one resource, by round (resources compound early, followers are the score late).
const fv = ctx => [1.6, 1.3, 1.2][ctx.state.round - 1] ?? 1.2;
const lastTurn = (ctx, p) => ctx.state.round === 3 && p.left === 0;

export const SELL_HIGH = { most: 2, each: 3 };
export const PAWN = { each: 2 }; // Your Call: per round number, +1 follower or this much white
export const BUY_LOW = { per: 2 }; // up to this many resources per round number, 1 for 1
export const LIQUIDATE = { most: 5, each: 2 };
// All In pays this many followers per resource (experiments try 0.5: 2 resources per follower)
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
const NOTHING_TO_SELL = 'no followers to sell (only followers you bought or won can be sold)';
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

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const trading = {
  id: 'trading',
  name: 'White',
  resource: W,
  scoring: { label: 'Most white', counts: 'the white you hold when the round ends', score: (ctx, p) => p.res[W] },

  actions: [
    {
      key: 'haggle', ring: 1, name: 'Sob Story', text: '+2 white, and +1 white per rival with more followers than you.',
      estimate: (ctx, p) => 2 + ahead(ctx, p),
      resolve(ctx, p) { ctx.gain(p, W, 2 + ahead(ctx, p), { fromAction: true }); },
    },
    {
      key: 'buylow', ring: 1, name: 'Cheap Seats', text: `Trade resources for followers, 1 for 1: up to ${BUY_LOW.per} in round I, ${2 * BUY_LOW.per} in round II, ${3 * BUY_LOW.per} in round III.`,
      estimate: (ctx, p) => Math.min(BUY_LOW.per * ctx.state.round, totalRes(p)) * (fv(ctx) - 0.9) + 0.4,
      resolve(ctx, p) {
        if (!totalRes(p)) { ctx.log(`${p.name} had nothing to trade.`); return; }
        buyLowStep(ctx, p, { left: BUY_LOW.per * ctx.state.round, done: 0 });
      },
    },
    {
      // 2026-10-14 rework: was "+2 white, and sell up to 1 follower per round number for 2 white each", whose sale was
      // dead in round I (only won or bought followers sell). Now an either/or per unit, always live, no sale.
      key: 'pawn', ring: 1, name: 'Your Call', text: `+1 follower in round I, +2 in round II, +3 in round III; take ${PAWN.each} white in place of any of them.`,
      estimate: ctx => ctx.state.round * Math.max(fv(ctx), PAWN.each),
      resolve(ctx, p) {
        const r = ctx.state.round, v = fv(ctx), late = lastTurn(ctx, p);
        // amount:k = take k of them as white, the rest as followers
        ctx.choose(p, `Your Call: ${plural(r, 'follower')}, or ${PAWN.each} white instead of each?`, Array.from({ length: r + 1 }, (_, k) => ({
          id: `amount:${k}`, kind: 'amount', value: k,
          label: [r - k ? `+${plural(r - k, 'follower')}` : '', k ? `+${PAWN.each * k} white` : ''].filter(Boolean).join(', '),
          // bots take white while it still builds, and followers on their last turn
          hint: late ? -k : k * (PAWN.each - v),
        })), 'trading.pawn');
      },
    },
    {
      key: 'sellhigh', ring: 2, name: 'Sell High', text: 'Sell up to 2 followers you bought or won, for 3 white each.',
      estimate: (ctx, p) => Math.min(SELL_HIGH.most, sellable(p)) * (SELL_HIGH.each - fv(ctx)) * (lastTurn(ctx, p) ? 0 : 1),
      resolve(ctx, p) {
        if (!sellable(p)) { ctx.log(`Sell High: ${p.name} has ${NOTHING_TO_SELL}.`); return; }
        sellChoice(ctx, p, `Sell High: sell how many followers for ${SELL_HIGH.each} white each?`, SELL_HIGH.most, SELL_HIGH.each, 'sold');
      },
    },
    {
      // Cory cut Barter (2026-10-14: "I don't like that"), which had replaced Cash In. Dividend fills the slot
      // (Claude, under go-with-your-gut): your loose followers pay out without being sold, so nothing leaves.
      key: 'dividend', ring: 2, name: 'Dividend', text: '+1 white per follower you bought or won.',
      estimate: (ctx, p) => sellable(p),
      resolve(ctx, p) {
        const n = sellable(p);
        if (!n) { ctx.log(`${p.name}'s Dividend: no followers bought or won yet.`); return; }
        ctx.gain(p, W, n, { fromAction: true });
        ctx.log(`${p.name}'s Dividend: +${n} white (${plural(n, 'follower')} bought or won).`);
      },
    },
    {
      key: 'boom', ring: 3, name: 'All In', text: 'Trade all your resources for followers, 1 for 1 (you may keep your white).',
      estimate: (ctx, p) => 0.6 * totalRes(p),
      resolve(ctx, p) {
        if (!totalRes(p)) { ctx.log(`${p.name} had nothing to turn into followers.`); return; }
        const all = totalRes(p), rest = all - p.res[W], last = p.left === 0;
        const opts = [{ id: 'boom:all', label: `Everything: ${Math.floor(all * BOOM.per)} followers`, kind: 'boom', value: 'all', hint: last ? 2 : 0.5 }];
        if (p.res[W] && rest) opts.push({ id: 'boom:keep', label: `Keep your white: ${Math.floor(rest * BOOM.per)} followers`, kind: 'boom', value: 'keep', hint: 1 });
        opts.push({ id: 'boom:none', label: 'Nothing', kind: 'boom', value: 'none', hint: 0 });
        ctx.choose(p, 'All In: trade which resources for followers, 1 for 1?', opts, 'trading.boom');
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
      ctx.log(`${p.name}'s All In: ${n} resources became ${f} followers.`);
    },
    sell(ctx, p, k, data) { sell(ctx, p, k, data.each, { fromAction: true, why: data.why }); },
    buyLow(ctx, p, value, data) {
      if (value === 'done') return;
      buyLow(ctx, p, value, data.done === 0);
      buyLowStep(ctx, p, { left: data.left - 1, done: data.done + 1 });
    },
    raid(ctx, p, k, data) {
      const t = ctx.player(data.t);
      // under the card's name, so the leader's loss reads "P1's Raider" in the results, as before
      ctx.asMember(p, 'Raider', () => raid(ctx, p, t, Math.min(k, raidAmount(ctx, p, t))));
    },
    pawn(ctx, p, k) {
      const r = ctx.state.round, white = PAWN.each * k;
      if (white) ctx.gain(p, W, white, { fromAction: true });
      actionFollowers(ctx, p, r - k);
      ctx.log(`${p.name}'s Your Call: ${[r - k ? `+${plural(r - k, 'follower')}` : '', white ? `+${white} white` : ''].filter(Boolean).join(', ')}.`);
    },
  },

  members: [
    m('shopkeeper', 'Shopkeeper', 2, 2, 'Now and at round start, +2 white.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, W, 2); },
    }),
    // 2+0 since the 2026-10-14 rework (was 2+2): with Your Call no longer selling, bots sell half as often; value 6.2 → 2.1
    m('dealer', 'Dealer', 2, 0, 'Whenever you sell followers, +1 white each.', {
      onSell(ctx, owner, card, k) { ctx.gain(owner, W, k); },
    }),
    m('pawnbroker', 'Pawnbroker', 2, 2, 'Once per round: sell 1 follower you bought or won, for 3 white.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        // nothing to sell: the use doesn't count
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name}'s Pawnbroker: ${NOTHING_TO_SELL}.`); return; }
        sell(ctx, owner, 1, 3, { by: 'Pawnbroker' });
      },
      botActivate: (ctx, owner) => sellable(owner) > 0 && ctx.state.round < 3,
    }),
    m('safetynet', 'Rich Uncle', 2, 0, 'Now and at round start, if you have no white, +3 white.', { now: true,
      onRoundStart(ctx, owner) { if (!owner.res[W]) ctx.gain(owner, W, 3); },
    }),
    m('tipster', 'Tipster', 4, 2, 'Whenever a rival buys followers, +1 white.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) ctx.gain(owner, W, 1); },
    }),
    m('lender', 'Lender', 4, 0, 'When it joins you: +5 white. Game end: lose 2 followers.', {
      onRecruited(ctx, owner, card) { payLoan(ctx, owner, card); },
      // a Doppelganger copying Lender is a full copy (Cory): it gets the +5 too, at once (the copy runs onRecruited).
      // This turn-end check is a fallback for a copy made some other way (loanPaid unset).
      onTurnEnd(ctx, owner, card) { if (!card.loanPaid) payLoan(ctx, owner, card); },
      // can't take you below the followers you've won or bought (never yourself or a member)
      onGameEnd: (ctx, owner) => -Math.min(2, owner.bonus),
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 8 → 4
    m('magnate', 'Magnate', 2, 2, 'Game end: +1 follower per 3 white.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res[W] / 3),
    }),
    m('shareholder', 'Shareholder', 2, 1, 'Worth 3 followers.', { f: 3 }),
    m('heiress', 'Heiress', 4, 2, 'Once per game: +1 white per member you have.', {
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
    // once per action use, and 2+0 (was 2+2), since the 2026-10-14 rework: Cheap Seats paid it per resource traded,
    // and Cash In, its main trigger, is gone. Member value 3.5 → 0.6 (160 games, normal bots, White table)
    m('broker', 'Broker', 2, 0, 'Whenever a White action gives you followers, +1 more (once per action).', { brokerBonus: 1 }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 4
    m('exporter', 'Exporter', 2, 2,'Whenever you recruit a non-white member, +1 white.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'trading') ctx.gain(owner, W, 1);
      },
    }),
    m('liquidator', 'Liquidator', 2, 1, `Once per game: sell up to ${LIQUIDATE.most} followers you bought or won, for ${LIQUIDATE.each} white each.`, {
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
        // "up to 3": the player picks how many (decisions.md, card verifier B: "Liquidator and Raider let the player
        // choose how many"); white is Most white's measure, so fewer can be the right call
        if (k === 1) { raid(ctx, owner, t, 1); return; }
        ctx.choose(owner, `Raider: buy how many followers from ${t.name}, 1 white each?`, Array.from({ length: k }, (_, j) => ({
          id: `amount:${j + 1}`, label: `${plural(j + 1, 'follower')} for ${j + 1} white`, kind: 'amount', value: j + 1, hint: j + 1,
        })), 'trading.raid', { t: t.id });
      },
      botActivate: (ctx, owner) => { const t = raidTarget(ctx, owner); return !!t && raidAmount(ctx, owner, t) >= 2; },
    }),
  ],
};

const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
// Cheap Seats pays one resource at a time (you pick the color), until the round's limit or Done.
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
  ctx.choose(p, `Cheap Seats: pay which resource for 1 follower? (${data.left} left)`, opts, 'trading.buyLow', data);
}
function payLoan(ctx, owner, card) {
  card.loanPaid = true;
  ctx.gain(owner, W, 5);
  ctx.log(`${owner.name}'s Lender: +5 white.`);
}
// Cheap Seats trades one resource at a time; Broker pays once per use of the action (on its first trade), not per trade.
function buyLow(ctx, p, color, first = true) {
  p.res[color] -= 1;
  if (first) actionFollowers(ctx, p, 1); else p.bonus += 1;
  ctx.log(`${p.name} traded 1 ${color} for 1 follower.`);
}
/** Followers from a White action, plus 1 per Broker (a Doppelganger's copy counts too). Called once per action use. */
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
function raid(ctx, owner, t, k) {
  if (!(k > 0)) return;
  owner.res[W] -= k; t.res[W] += k;
  t.bonus -= k; owner.bonus += k;
  ctx.log(`${owner.name}'s Raider bought ${k} follower${k > 1 ? 's' : ''} from ${t.name} for ${k} white.`);
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
