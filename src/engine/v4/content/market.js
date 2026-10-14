// Blue (the market): bend the shop. Buy outside your buy, ignore colors, pay half, churn the row.
// Scoring: most member value, the total printed cost of the members you hold. Blue members break ties.
// Gold hoards money and Red piles up cheap members; Blue collects the expensive ones, cheaply.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const B = 'blue';
const Q = 'market';

/** Printed cost of a member (before any discount). */
export const priceOf = c => c.def.s + c.def.w;
/** Blue's measure: total printed cost of a player's members. */
export const memberValue = (ctx, p) => ctx.membersOf(p).reduce((s, c) => s + priceOf(c), 0);
const totalRes = p => Object.values(p.res).reduce((a, b) => a + b, 0);
const colorOf = (ctx, c) => ctx.quadrant(c.def.quadrant).resource;
// what a bot thinks a member is worth to it (mirrors the greedy buy score)
const botWorth = c => c.def.f * 1.4 + (c.def.vanilla ? 0 : 1.6) + priceOf(c) * 0.3;

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
  for (const r in v) p.res[r] -= v[r];
  const card = ctx.card(uid);
  ctx.log(`${why}: ${p.name} pays ${payLabel(v)} for ${card.def.name}.`);
  if (fromPile) {
    // lift it out of the pile into the row for a moment, so it is recruited the normal way
    const pile = ctx.state.pile;
    pile.splice(pile.indexOf(uid), 1);
    ctx.state.shop.push(uid);
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
  ctx.choose(p, `${why}: recruit which member?`, opts, `${Q}.pickRow`, { why, half: why === 'Clearance' });
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
/** Extra buys this turn: they run right after the current one. */
function extraBuys(ctx, p, k) {
  for (let i = 0; i < k; i++) ctx.state.queue.unshift({ t: 'buy', p: p.id });
}

export default {
  id: Q,
  name: 'Blue',
  resource: B,
  scoring: {
    label: 'Most member value',
    // total printed cost of your members; blue members break ties
    score: (ctx, p) => { const v = memberValue(ctx, p); return v > 0 ? v * 100 + ctx.countMembersOfColor(p, Q) : 0; },
  },

  actions: [
    {
      key: 'bargain', ring: 1, name: 'Bargain', text: 'Recruit a face-up member now, paying its cost in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, priceOf) * 0.7,
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
      key: 'showroom', ring: 1, name: 'Showroom', text: '+1 blue per face-up member costing 4 or more.',
      estimate: ctx => showroomCount(ctx),
      resolve(ctx, p) { ctx.gain(p, B, showroomCount(ctx), { fromAction: true }); },
    },
    {
      key: 'clearance', ring: 2, name: 'Clearance', text: 'Recruit a face-up member now for half its cost (rounded down), in any colors.',
      estimate: (ctx, p) => bestRowValue(ctx, p, half),
      resolve(ctx, p) { offerRow(ctx, p, half, 'Clearance'); },
    },
    {
      key: 'appraise', ring: 2, name: 'Appraise', text: 'Gain blue equal to the cost of your priciest member.',
      estimate: (ctx, p) => priciest(ctx, p),
      resolve(ctx, p) { ctx.gain(p, B, priciest(ctx, p), { fromAction: true }); },
    },
    {
      key: 'spree', ring: 3, name: 'Spree', text: 'This turn you buy 3 times instead of once.',
      estimate: (ctx, p) => Math.min(12, Math.max(0, totalRes(p) - 3)) * 0.7,
      resolve(ctx, p) { extraBuys(ctx, p, 2); ctx.log(`${p.name} goes on a spree: 3 buys this turn.`); },
    },
  ],

  handlers: {
    pickRow(ctx, p, uid, data) {
      if (uid === null) { ctx.log(`${data.why}: ${p.name} recruits nothing.`); return; }
      const c = ctx.card(uid);
      buyAt(ctx, p, uid, 0, data.half ? half(c) : priceOf(c), data.why);
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
  },

  members: [
    m('dealer', 'Dealer', 1, 1, 'Whenever anyone recruits a blue member, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) {
        if (rec.uid !== card.uid && ctx.defOf(rec).quadrant === Q) ctx.gain(owner, B, 1);
      },
    }),
    m('broker', 'Broker', 1, 1, 'Whenever a rival recruits a member costing 4 or more, +1 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by !== owner && priceOf(rec) >= 4) ctx.gain(owner, B, 1); },
    }),
    m('connoisseur', 'Connoisseur', 2, 1, 'Whenever you recruit a member costing 4 or more, +2 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid && priceOf(rec) >= 4) ctx.gain(owner, B, 2); },
    }),
    m('reseller', 'Reseller', 2, 1, 'Whenever you recruit, +1 of that member’s color.', {
      onAnyRecruit(ctx, owner, card, by, rec) { if (by === owner && rec.uid !== card.uid) ctx.gain(owner, colorOf(ctx, rec), 1); },
    }),
    m('outfitter', 'Outfitter', 1, 1, 'Whenever you recruit your first member of a color, +2 blue.', {
      onAnyRecruit(ctx, owner, card, by, rec) {
        if (by === owner && rec.uid !== card.uid && ctx.countMembersOfColor(owner, ctx.defOf(rec).quadrant) === ctx.defOf(rec).n) ctx.gain(owner, B, 2);
      },
    }),
    m('collector', 'Collector', 2, 1, 'At round start, +1 blue per member you have costing 3 or more.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, B, ctx.membersOf(owner).filter(c => priceOf(c) >= 3).length); },
    }),
    m('regular', 'Regular', 1, 1, 'At round start, your next member costs 1 less per round number.', {
      onRoundStart(ctx, owner) { owner.discount += ctx.state.round; },
    }),
    m('patron', 'Patron', 1, 0, 'Whenever you buy followers, your next member costs 1 less.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer === owner) owner.discount += 1; },
    }),
    m('underbidder', 'Underbidder', 1, 0, 'At round start, your next member costs 1 less per rival with more members than you.', {
      onRoundStart(ctx, owner) {
        const mine = ctx.memberCount(owner);
        owner.discount += ctx.rivals(owner).filter(o => ctx.memberCount(o) > mine).length;
      },
    }),
    m('windowshopper', 'Window Shopper', 1, 1, 'Once per round, before you buy: sweep the face-up row (6 new members).', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner) { sweepRow(ctx); ctx.log(`${owner.name}'s Window Shopper sweeps the row.`); },
      // sweep when nothing in the row is worth buying
      botActivate: (ctx, owner) => !ctx.shopCards().some(c => priceOf(c) <= totalRes(owner) && priceOf(c) >= 2),
    }),
    m('shopper', 'Personal Shopper', 3, 2, 'Once per round: buy one more time this turn.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner) { extraBuys(ctx, owner, 1); ctx.log(`${owner.name}'s Personal Shopper: one more buy this turn.`); },
      botActivate: (ctx, owner) => totalRes(owner) >= 7,
    }),
    m('shopaholic', 'Shopaholic', 2, 1, 'Once per game: buy two more times this turn.', {
      activate: 'game',
      onActivate(ctx, owner) { extraBuys(ctx, owner, 2); ctx.log(`${owner.name}'s Shopaholic: two more buys this turn.`); },
      botActivate: (ctx, owner) => ctx.state.round === 3 && totalRes(owner) >= 10,
    }),
    m('blackmarket', 'Black Market', 2, 2, 'Once per game, on your turn: also recruit any member from the pile, at its cost.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const opts = ctx.state.pile.map(u => ctx.card(u))
          .filter(c => payVectors(ctx, owner, colorOf(ctx, c), c.def.s, c.def.w).length)
          .map(c => ({ id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)})`, kind: 'card', value: c.uid, hint: botWorth(c) }))
          .sort((a, b) => b.hint - a.hint);
        if (!opts.length) { ctx.log(`${owner.name}'s Black Market has nothing affordable.`); return; }
        opts.push({ id: 'none', label: 'Recruit nothing', kind: 'pass', value: null, hint: -1 });
        ctx.choose(owner, 'Black Market: recruit which member from the pile?', opts, `${Q}.blackMarket`);
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && totalRes(owner) >= 8,
    }),
    m('heirloom', 'Heirloom', 3, 2, 'No effect. Worth 3 followers.', { f: 3, vanilla: true }),
    m('appraiser', 'Appraiser', 3, 2, 'Game end: +1 follower per member you have costing 4 or more.', {
      onGameEnd: (ctx, owner) => ctx.membersOf(owner).filter(c => priceOf(c) >= 4).length,
    }),
  ],
};

function showroomCount(ctx) { return ctx.shopCards().filter(c => priceOf(c) >= 4).length; }
function priciest(ctx, p) { return Math.max(0, ...ctx.membersOf(p).map(priceOf)); }
