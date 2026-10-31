import { memberScoring } from './member-scoring.js';
// White: the exchange. Your followers are liquid: sell them for white when you need fuel, draw white on them
// (Dividend), buy them back cheap. Fewest followers at round end takes the ring's followers (Cory, 2026-10-15):
// sell before the round ends to dip under the table, buy back after.
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
export const sellable = p => Math.max(0, p.bonus);
const ahead = (ctx, p) => ctx.rivals(p).filter(o => ctx.followers(o) > ctx.followers(p)).length;
// How bots value a follower against one resource, by round (resources compound early, followers are the score late).
const fv = ctx => [1.6, 1.3, 1.2][ctx.state.round - 1] ?? 1.2;
const lastTurn = (ctx, p) => ctx.state.round === 3 && p.left === 0;

export const SELL_HIGH = { most: 2, each: 3 };
export const PAWN = { each: 2 }; // Your Call: per round number, +1 follower or this much white
export const BUY_LOW = { per: 2 }; // the old Cheap Seats (1 for 1, this many per round number); its handler stays for old saves
export const CHEAP_SEATS = { per: 3 }; // white held per follower
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
  // Cory, 2026-10-17: competitions count their own-color members, except Gold/Silver/Yellow.
  scoring: { label: 'Most white', counts: 'the white you hold when the round ends', score: (ctx, p) => p.res.white },

  // White, reworked by Cory (2026-10-22, design/spheres/white-actions-draft-2026-10-22.md): "basically better
  // exchange for followers". The names are Claude's fill-ins.
  actions: [
    {
      key: 'stipend', copyDoesIt: true, ring: 1, name: 'Allowance',
      text: '+2 white in round I, +3 in round II, +4 in round III. This turn, if you recruit a member, +1 follower (+2 in round II, +3 in round III).',
      // Gather's shape (Cory, 2026-10-31: "just default to gather style for now for the rest"); was +1/2/3 followers and +2/3/4 white
      byRound: { lines: ['+2 white. This turn, if you recruit a member, +1 follower.', '+3 white. This turn, if you recruit a member, +2 followers.', '+4 white. This turn, if you recruit a member, +3 followers.'] },
      estimate: ctx => ctx.state.round + 1 + ctx.state.round * 0.7,
      resolve(ctx, p) {
        ctx.gain(p, W, ctx.state.round + 1, { fromAction: true });
        (p.recruitFollowers ||= []).push({ n: ctx.state.round, name: 'Allowance', broker: true });
      },
    },
    {
      key: 'splurge', copyDoesIt: true, ring: 1, name: 'Splurge', text: 'This turn, if you recruit a member, +1 follower for every 2 resources you pay for it. +1 white.', // members only: Claude's default, 2026-10-27; +1 (Cory, Oct 28)
      estimate: (ctx, p) => 1 + Math.floor(Math.min(totalRes(p) + 1, 7) / 2) * fv(ctx) * 0.8,
      resolve(ctx, p) {
        ctx.gain(p, W, 1, { fromAction: true });
        p.perSpend = true;
      },
    },
    {
      key: 'exchange', copyDoesIt: true, ring: 1, name: 'Exchange', text: 'Turn up to 1 resource (2 in round II, 3 in round III) into 2 followers each. +1 white.', // Cory, 2026-10-23: "up to", you can stop early
      byRound: { lines: ['Turn up to 1 resource into 2 followers.', 'Turn up to 2 resources into 2 followers each.', 'Turn up to 3 resources into 2 followers each.'], rest: '+1 white.' },
      estimate: (ctx, p) => 1 + Math.min(ctx.state.round, totalRes(p) + 1) * (2 * fv(ctx) - 1),
      resolve(ctx, p) {
        ctx.gain(p, W, 1, { fromAction: true });
        exchangeStep(ctx, p, { left: ctx.state.round, done: 0 });
      },
    },
    {
      key: 'farewell', copyDoesIt: true, ring: 2, name: 'Farewell', text: 'Cast out one of your members to the bottom of the pile, gain followers equal to its cost. +1 white.', // "cast out": Cory, 2026-10-24
      estimate: (ctx, p) => 1 + Math.max(0, ...ctx.membersOf(p).map(c => buryValue(ctx, p, c, fv(ctx)))),
      resolve(ctx, p) {
        ctx.gain(p, W, 1, { fromAction: true });
        buryChoice(ctx, p, 'Farewell', 'followers');
      },
    },
    {
      key: 'estatesale', copyDoesIt: true, ring: 2, name: 'Estate Sale', text: 'Cast out one of your members to the bottom of the pile, gain white equal to its cost. +1 white.',
      estimate: (ctx, p) => 1 + Math.max(0, ...ctx.membersOf(p).map(c => buryValue(ctx, p, c, 1))),
      resolve(ctx, p) {
        ctx.gain(p, W, 1, { fromAction: true });
        buryChoice(ctx, p, 'Estate Sale', 'white');
      },
    },
    {
      key: 'cashin', copyDoesIt: true, ring: 3, name: 'Cash In', text: 'Turn all your white into followers. +1 white.',
      estimate: (ctx, p) => (p.res[W] || 0) * fv(ctx) + 1,
      resolve(ctx, p) {
        const n = p.res[W] || 0;
        if (n) {
          p.res[W] = 0;
          actionFollowers(ctx, p, n);
          ctx.log(`${p.name}'s Cash In: ${n} white became ${plural(n, 'follower')}.`);
          turned(ctx, p);
        } else ctx.log(`${p.name}'s Cash In: no white to turn into followers.`);
        ctx.gain(p, W, 1, { fromAction: true });
      },
    },
  ],

  handlers: {
    exchange(ctx, p, value, data) {
      if (value === 'done') return;
      p.res[value] -= 1;
      if (data.done === 0) actionFollowers(ctx, p, 2); else p.bonus += 2;
      ctx.log(`${p.name}'s Exchange: 1 ${value} became 2 followers.`);
      if (data.done === 0) turned(ctx, p);
      exchangeStep(ctx, p, { left: data.left - 1, done: data.done + 1 });
    },
    bury(ctx, p, uid, data) {
      if (!p.members.includes(uid)) return;
      const name = ctx.card(uid).def.name;
      const run = () => {
        const c = ctx.buryMember(p, uid);
        if (data.gain === 'white') { ctx.gain(p, W, c, { fromAction: !data.by }); ctx.log(`${p.name}'s ${data.what}: ${name} paid ${c} white.`); }
        else {
          if (data.by) p.bonus += c; else actionFollowers(ctx, p, c);
          ctx.log(`${p.name}'s ${data.what}: ${name} paid ${plural(c, 'follower')}.`);
          if (c) turned(ctx, p);
        }
        gotRidOf(ctx, p);
      };
      if (data.by) ctx.asMember(p, data.by, run); else run();
    },
    buryPick(ctx, p, value, data) { if (value !== 'done') trading.handlers.bury(ctx, p, value, data); },
    appraise(ctx, p, value, data) {
      // Appraiser: first the member, then followers or white
      ctx.choose(p, `Appraiser: ${ctx.card(value).def.name} pays followers or white?`, [
        { id: 'pick:followers', label: `${plural(cost(ctx, value), 'follower')}`, kind: 'choice', value: 'followers', hint: fv(ctx) },
        { id: 'pick:white', label: `${cost(ctx, value)} white`, kind: 'choice', value: 'white', hint: ctx.state.round < 3 ? 1.5 : 0.5 },
      ], 'trading.appraiseGain', { uid: value });
    },
    appraiseGain(ctx, p, value, data) {
      trading.handlers.bury(ctx, p, data.uid, { gain: value, what: 'Appraiser', by: 'Appraiser' });
    },
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
      // under the card's name, so the leader's loss reads "P1's Raiders" in the results, as before
      ctx.asMember(p, 'Raiders', () => raid(ctx, p, t, Math.min(k, raidAmount(ctx, p, t))));
    },
    pawn(ctx, p, k) {
      const r = ctx.state.round, white = PAWN.each * k;
      if (white) ctx.gain(p, W, white, { fromAction: true });
      actionFollowers(ctx, p, r - k);
      ctx.log(`${p.name}'s Your Call: ${[r - k ? `+${plural(r - k, 'follower')}` : '', white ? `+${white} white` : ''].filter(Boolean).join(', ')}.`);
    },
  },

  // Cory's 12 (2026-10-22, design/spheres/white-members-2026-10-22.md). Prices are Claude's educated guesses
  // (white + any, followers printed); names marked new are Claude's fill-ins.
  members: [
    // Recluse moves here from Blue (Cory, 2026-10-25: "yes"), so a seat with few members has a payoff
    m('recluse', 'Recluse', 2, 2, 'Game End: +2 followers per rival with more members than you.', {
      onGameEnd: (ctx, owner) => 2 * ctx.rivals(owner).filter(o => ctx.memberCount(o) > ctx.memberCount(owner)).length,
    }),
    // Cory, 2026-10-25: cost 3 (was 4), so White has a cheap starter
    m('shopkeeper', 'Shopkeeper', 2, 1, 'On Recruit: +2 white. Round Start: +2 white.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, W, 2); },
    }),
    m('heiress', 'Heiress', 4, 4, // 9 (Cory, Oct 30: balance run)
      'On Use, once per game: +1 white per member you have.', { f: 2,
      activate: 'game',
      onActivate(ctx, owner) {
        const n = ctx.memberCount(owner);
        ctx.gain(owner, W, n);
        ctx.log(`${owner.name} used Heiress: +${n} white.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 || (ctx.state.round === 2 && ctx.memberCount(owner) >= 5),
    }),
    m('bulkbuyer', 'Bulk Buyer', 1, 2, 'Whenever you buy 5 or more followers, +1 follower.', { f: 2,
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 5) { owner.bonus += 1; ctx.log(`${owner.name}'s Bulk Buyer: +1 follower.`); }
      },
    }),
    m('broker', 'Broker', 2, 2, 'Whenever a White action gives you followers, +1 follower.', { f: 3, brokerBonus: 1 }), // (Cory, Oct 29, balance run: +1 follower)
    m('exporter', 'Exporter', 2, 4, 'Whenever you recruit a non-white member, +1 white.', { f: 2,
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'trading') ctx.gain(owner, W, 1);
      },
    }),
    m('raider', 'Raiders', 2, 2, /* Claude's fill-in price 4, was 5 (Cory, 2026-10-22: "probably too expensive") */ 'On Use, once per game: steal 4 followers from the leader. Pay them 2 white.', { n: 2, // 2 members (Cory, Oct 29: "choir and raiders can be more"; 2 is Claude's start)
      activate: 'game',
      onActivate(ctx, owner, card) {
        const t = raidTarget(ctx, owner);
        const k = t ? Math.min(4, sellable(t)) : 0;
        if (!k || (owner.res[W] || 0) < 2) { card.used = false; ctx.log(`${owner.name}'s Raiders: ${!k ? 'no leader to steal from' : 'needs 2 white'}.`); return; }
        owner.res[W] -= 2; t.res[W] = (t.res[W] || 0) + 2;
        t.bonus -= k; owner.bonus += k;
        ctx.log(`${owner.name}'s Raiders stole ${plural(k, 'follower')} from ${t.name} and paid 2 white.`);
      },
      botActivate: (ctx, owner) => { const t = raidTarget(ctx, owner); return !!t && sellable(t) >= 3 && (owner.res[W] || 0) >= 2; },
    }),
    // new (Claude's names from here down)
    m('cashier', 'Cashier', 3, 1, 'On Recruit: turn all your white into followers.', {
      onRecruited(ctx, owner) {
        const n = owner.res[W] || 0;
        if (!n) { ctx.log(`${owner.name}'s Cashier: no white to turn into followers.`); return; }
        owner.res[W] = 0; owner.bonus += n;
        ctx.log(`${owner.name}'s Cashier: ${n} white became ${plural(n, 'follower')}.`);
        turned(ctx, owner);
      },
    }),
    m('undertaker', 'Undertaker', 2, 2, 'Whenever you cast out one of your members, +2 followers.', { onGotRidOf: 2 }),
    m('appraiser', 'Appraiser', 3, 2, 'On Use, once per game: cast out one of your members, gain followers or white equal to its cost.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        const list = ctx.membersOf(owner).filter(c => c.uid !== card.uid);
        if (!list.length) { card.used = false; ctx.log(`${owner.name}'s Appraiser: no other member to cast out.`); return; }
        ctx.choose(owner, 'Appraiser: cast out which member?', list.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name} (${cost(ctx, c.uid)})`, kind: 'card', value: c.uid, hint: buryValue(ctx, owner, c, fv(ctx)),
        })), 'trading.appraise');
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && ctx.membersOf(owner).some(c => c.def.key !== 'appraiser' && buryValue(ctx, owner, c, fv(ctx)) >= 2),
    }),
    m('changer', 'Money Changer', 2, 1, 'Whenever you turn resources or members into followers, +1 white.', { f: 2, onTurned: 1 }),
    m('martyr', 'Martyr', 2, 1, 'Whenever this member leaves your cult, gain followers equal to its cost.', { f: 2,
      onLeave(ctx, owner, card) {
        const c = card.def.s + card.def.w;
        ctx.asMember(owner, 'Martyr', () => { owner.bonus += c; ctx.log(`${owner.name}'s Martyr left: +${plural(c, 'follower')}.`); });
      },
    }),
    // Cory, 2026-10-24: "go deep card for every color" ("sure for now"); name and price Claude's fill-in, priced like Chronicler
    m('oldmoney', 'Old Money', 1, 4, /* 6 (Cory, Oct 30) */ 'Game End: +1 follower per white member you have.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'trading'),
    }),
    m('hoarder', 'Hoarder', 4, 3, 'On Use, once per game: turn all your resources into white.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        let n = 0;
        for (const r of ctx.state.resources) if (r !== W && owner.res[r]) { n += owner.res[r]; owner.res[r] = 0; }
        if (!n) { card.used = false; ctx.log(`${owner.name}'s Hoarder: nothing but white already.`); return; }
        owner.res[W] = (owner.res[W] || 0) + n;
        ctx.log(`${owner.name}'s Hoarder: ${n} resources became white.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && totalRes(owner) - (owner.res[W] || 0) >= 3,
    }),
    // cut by Cory (2026-10-22); kept defined for old records and card tests
    m('dealer', 'Dealer', 2, 0, 'Whenever you sell followers, +1 white per follower sold.', {
      onSell(ctx, owner, card, k) { ctx.gain(owner, W, k); },
    }),
    m('pawnbroker', 'Pawnbroker', 2, 2, 'On Use, once per round: sell 1 follower you bought or won, for 3 white.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name}'s Pawnbroker: ${NOTHING_TO_SELL}.`); return; }
        sell(ctx, owner, 1, 3, { by: 'Pawnbroker' });
      },
      botActivate: (ctx, owner) => sellable(owner) > 0 && ctx.state.round < 3,
    }),
    m('safetynet', 'Rich Uncle', 2, 0, 'On Recruit: if you have no white, +3 white. Round Start: if you have no white, +3 white.', { now: true,
      onRoundStart(ctx, owner) { if (!owner.res[W]) ctx.gain(owner, W, 3); },
    }),
    m('tipster', 'Tipster', 4, 2, 'Whenever a rival buys followers, +1 white.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) ctx.gain(owner, W, 1); },
    }),
    m('lender', 'Lender', 4, 0, 'When it joins you: +5 white. Game End: lose 2 followers.', {
      onRecruited(ctx, owner, card) { payLoan(ctx, owner, card); },
      onTurnEnd(ctx, owner, card) { if (!card.loanPaid) payLoan(ctx, owner, card); },
      onGameEnd: (ctx, owner) => -Math.min(2, sellable(owner)),
    }),
    m('magnate', 'Magnate', 2, 2, 'Game End: +1 follower per 3 white.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res[W] / 3),
    }),
    m('shareholder', 'Shareholder', 2, 1, 'Worth 3 followers.', { f: 3 }),
    m('liquidator', 'Liquidator', 2, 1, `On Use, once per game: sell up to ${LIQUIDATE.most} followers you bought or won, for ${LIQUIDATE.each} white each.`, {
      activate: 'game',
      onActivate(ctx, owner, card) {
        if (!sellable(owner)) { card.used = false; ctx.log(`${owner.name}'s Liquidator: ${NOTHING_TO_SELL}.`); return; }
        sell(ctx, owner, LIQUIDATE.most, LIQUIDATE.each, { why: 'liquidated', by: 'Liquidator' });
      },
      botActivate: (ctx, owner) => ctx.state.round === 2 && sellable(owner) >= 3,
    }),
    m('reinvestor', 'Reinvestor', 2, 2, 'Whenever you sell followers, your next member costs 2 less per follower sold.', {
      onSell(ctx, owner, card, k) { ctx.discount(owner, 2 * k, 'Reinvestor'); ctx.log(`${owner.name}'s Reinvestor: next member costs ${owner.discount} less.`); },
    }),
  ],
};

const cost = (ctx, uid) => { const d = ctx.card(uid).def; return d.s + d.w; };
const defsOf = (ctx, c) => [c.def, c.copy ? defById(c.copy) : null].filter(Boolean);
// Banker: "Whenever you turn resources or members into followers, +1 white" (once per turning)
function turned(ctx, p) {
  for (const c of ctx.abilitiesOf(p)) for (const d of defsOf(ctx, c)) if (d.onTurned) { ctx.gain(p, W, d.onTurned); ctx.log(`${p.name}'s ${d.name}: +${d.onTurned} white.`); }
}
// Undertaker: "Whenever you cast out one of your members, +2 followers"
function gotRidOf(ctx, p) {
  for (const c of ctx.membersOf(p)) for (const d of defsOf(ctx, c)) if (d.onGotRidOf) { p.bonus += d.onGotRidOf; ctx.log(`${p.name}'s ${d.name}: +${d.onGotRidOf} followers.`); }
}
// What getting rid of a member is worth to a bot: its cost (in followers or white) less what it's worth kept
function buryValue(ctx, p, c, each) {
  const kept = c.def.f + (c.used || ctx.state.round === 3 ? 0 : 1) + (c.def.onLeave ? -cost(ctx, c.uid) : 0);
  return cost(ctx, c.uid) * each - kept;
}
function buryChoice(ctx, p, what, gain) {
  const list = ctx.membersOf(p);
  if (!list.length) { ctx.log(`${p.name}'s ${what}: no members to send away.`); return; }
  const each = gain === 'white' ? 1 : fv(ctx);
  const opts = list.map(c => ({ id: `card:${c.uid}`, label: `${c.def.name} (${cost(ctx, c.uid)})`, kind: 'card', value: c.uid, hint: buryValue(ctx, p, c, each) }));
  opts.push({ id: 'done', label: 'Keep them all', kind: 'done', value: 'done', hint: 0 });
  ctx.choose(p, `${what}: cast out which member?`, opts, 'trading.buryPick', { gain, what });
}
// Exchange: one resource at a time (you pick the color), 2 followers each, up to the round's limit or Done
function exchangeStep(ctx, p, data) {
  const held = ctx.state.resources.filter(r => p.res[r] > 0);
  if (data.left <= 0 || !held.length) return;
  const v = fv(ctx);
  const opts = held.map(r => ({
    id: `color:${r}`, label: `1 ${r} → 2 followers`, kind: 'color', value: r, spend: { [r]: 1 },
    hint: (2 * v - 1) + 0.01 * (p.res[r] - (r === W ? 3 : 0)),
  }));
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Turn nothing', kind: 'done', value: 'done', hint: 0.1 });
  ctx.choose(p, `Exchange: turn which resource into 2 followers? (${data.left} left)`, opts, 'trading.exchange', data);
}

const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
// Cheap Seats pays one resource at a time (you pick the color), until the round's limit or Done.
function buyLowStep(ctx, p, data) {
  const held = ctx.state.resources.filter(r => p.res[r] > 0);
  if (data.left <= 0 || !held.length) return;
  const v = fv(ctx);
  const opts = held.map(r => ({
    id: `color:${r}`, label: `1 ${r} → 1 follower`, kind: 'color', value: r, spend: { [r]: 1 },
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
  ctx.log(`${owner.name}'s Raiders bought ${k} follower${k > 1 ? 's' : ''} from ${t.name} for ${k} white.`);
}
function raidAmount(ctx, p, t) {
  return Math.min(3, sellable(t), p.res[W]);
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
