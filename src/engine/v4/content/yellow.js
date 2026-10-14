// Yellow: abundance. Gather every color, keep them in balance, and score on full sets.
// A full set is one of each color on the table. Most full sets at round end takes the ring's followers;
// yellow breaks ties. The tension: the 6-follower buy eats 3 colors, which breaks the sets you're holding.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

const Y = 'yellow';
const colors = ctx => ctx.state.resources;
const others = ctx => colors(ctx).filter(c => c !== Y);
/** Full sets: one of each color on the table. */
export const setsOf = (ctx, p) => Math.min(...colors(ctx).map(c => p.res[c] || 0));
const held = (ctx, p) => colors(ctx).filter(c => (p.res[c] || 0) > 0);
const missing = (ctx, p) => colors(ctx).filter(c => !(p.res[c] > 0));
const total = (ctx, p) => colors(ctx).reduce((a, c) => a + (p.res[c] || 0), 0);
const colorOf = (ctx, card) => ctx.quadrant(ctx.defOf(card).quadrant).resource;
const eachColor = (ctx, p, n, opts) => { for (const c of colors(ctx)) ctx.gain(p, c, n, opts); };

export default {
  id: 'yellow',
  name: 'Yellow',
  resource: Y,
  scoring: {
    label: 'Most full sets',
    // a full set is one of each color; you need at least one to score; yellow breaks ties
    score: (ctx, p) => { const s = setsOf(ctx, p); return s > 0 ? s * 1000 + p.res[Y] : 0; },
  },

  actions: [
    {
      key: 'harvest', ring: 1, name: 'Harvest', text: '+1 yellow per color you hold (yellow always counts).',
      estimate: (ctx, p) => harvestAmount(ctx, p),
      resolve(ctx, p) { ctx.gain(p, Y, harvestAmount(ctx, p), { fromAction: true }); },
    },
    {
      key: 'bloom', ring: 1, name: 'Bloom', text: '+2 of each color you have none of.',
      estimate: (ctx, p) => 2 * missing(ctx, p).length * 0.85,
      resolve(ctx, p) { for (const c of missing(ctx, p)) ctx.gain(p, c, 2, { fromAction: true }); },
    },
    {
      key: 'transmute', ring: 1, name: 'Transmute', text: 'Swap any of your resources for other colors, one for one.',
      // worth what it adds in sets, plus a little for fixing colors
      estimate: (ctx, p) => Math.max(0, Math.floor(total(ctx, p) / colors(ctx).length) - setsOf(ctx, p)) * 1.6 + 0.4,
      resolve(ctx, p) { transmuteStep(ctx, p, { left: total(ctx, p), done: 0 }); },
    },
    {
      key: 'prism', ring: 2, name: 'Prism', text: '+1 of each other color per 2 yellow you have.',
      estimate: (ctx, p) => 3 * Math.floor(p.res[Y] / 2),
      resolve(ctx, p) {
        const k = Math.floor(p.res[Y] / 2);
        for (const c of others(ctx)) ctx.gain(p, c, k, { fromAction: true });
        ctx.log(`${p.name}'s Prism splits ${2 * k} yellow's worth into +${k} of each other color.`);
      },
    },
    {
      key: 'gather', ring: 2, name: 'Gather', text: 'Each of your members brings you 1 of its color.',
      estimate: (ctx, p) => ctx.memberCount(p),
      resolve(ctx, p) {
        for (const qid of ctx.state.quadrants) {
          const n = ctx.countMembersOfColor(p, qid);
          if (n) ctx.gain(p, ctx.quadrant(qid).resource, n, { fromAction: true });
        }
      },
    },
    {
      key: 'flourish', ring: 3, name: 'Flourish', text: 'Double your full sets: +1 of each color per full set you hold.',
      estimate: (ctx, p) => 4 * setsOf(ctx, p),
      resolve(ctx, p) {
        const k = setsOf(ctx, p);
        eachColor(ctx, p, k, { fromAction: true });
        ctx.log(k ? `${p.name} flourishes: +${k} of each color.` : `${p.name} had no full set to flourish.`);
      },
    },
  ],

  handlers: {
    swap(ctx, p, value, data) {
      if (value === 'done') { finishTransmute(ctx, p, data); return; }
      const [from, to] = value;
      p.res[from] -= 1; p.res[to] += 1;
      const tally = { ...(data.tally || {}) };
      tally[`${from}>${to}`] = (tally[`${from}>${to}`] || 0) + 1;
      transmuteStep(ctx, p, { left: data.left - 1, done: data.done + 1, tally });
    },
    sow(ctx, p, x, data) {
      if (!x) return;
      const card = ctx.card(data.uid);
      p.res[Y] -= x; card.sown = (card.sown || 0) + x;
      ctx.log(`${p.name}'s Sower plants ${x} yellow.`);
    },
  },

  members: [
    m('gardener', 'Gardener', 1, 0, 'At round start, +1 of each color you have none of.', {
      onRoundStart(ctx, owner) { for (const c of missing(ctx, owner)) ctx.gain(owner, c, 1); },
    }),
    m('peddler', 'Peddler', 1, 1, 'At round start, +1 of each other color.', {
      onRoundStart(ctx, owner) { for (const c of others(ctx)) ctx.gain(owner, c, 1); },
    }),
    m('gleaner', 'Gleaner', 3, 2, 'Whenever an action gains you 2+ of another color at once, +1 yellow.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== Y && g.n >= 2) owner.res[Y] += 1; },
    }),
    m('admirer', 'Admirer', 2, 1, 'Whenever a rival recruits a member of a color you have none of, +1 of that color.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        const c = colorOf(ctx, recruited);
        if (by !== owner && !(owner.res[c] > 0)) ctx.gain(owner, c, 1);
      },
    }),
    m('gobetween', 'Go-Between', 2, 2, 'Whenever you recruit a non-yellow member, +1 of its color.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'yellow') ctx.gain(owner, colorOf(ctx, recruited), 1);
      },
    }),
    m('dyer', 'Dyer', 2, 1, 'At round end, +1 yellow per color you hold.', {
      onRoundEnd(ctx, owner) { ctx.gain(owner, Y, held(ctx, owner).length); },
    }),
    m('latebloomer', 'Late Bloomer', 1, 1, 'At round start, if you have the fewest followers (ties count), +1 of each color.', {
      onRoundStart(ctx, owner) {
        const mine = ctx.followers(owner);
        if (ctx.rivals(owner).every(o => ctx.followers(o) >= mine)) eachColor(ctx, owner, 1);
      },
    }),
    m('sower', 'Sower', 1, 1, 'Round start: plant any of your yellow. Round end: gain that many of each other color.', {
      onRoundStartLate(ctx, owner, card) {
        const y = owner.res[Y];
        if (!y) return;
        const amounts = [...new Set([0, Math.floor(y / 4), Math.floor(y / 2), Math.floor((3 * y) / 4), y])];
        ctx.choose(owner, `Sower: plant how much yellow? (you have ${y})`, amounts.map(x => ({
          id: `amount:${x}`, label: x === 0 ? 'None' : x === y ? `All ${x}` : `${x}`, kind: 'amount', value: x, hint: x === Math.floor(y / 2) ? 1 : 0,
        })), 'yellow.sow', { uid: card.uid });
      },
      onRoundEnd(ctx, owner, card) {
        const x = card.sown || 0;
        if (!x) return;
        card.sown = 0;
        for (const c of others(ctx)) owner.res[c] += x;
        ctx.log(`${owner.name}'s Sower harvests +${x} of each other color.`);
      },
    }),
    m('harmonist', 'Harmonist', 3, 1, 'Game end: +1 follower per full set you hold.', {
      onGameEnd: (ctx, owner) => setsOf(ctx, owner),
    }),
    m('rainmaker', 'Rainmaker', 2, 1, 'Once per game: raise each of your colors to match your yellow.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const top = owner.res[Y];
        let got = 0;
        for (const c of others(ctx)) { const d = Math.max(0, top - owner.res[c]); got += d; ctx.gain(owner, c, d); }
        ctx.log(`${owner.name} used Rainmaker: every color up to ${top} (+${got}).`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3
        && others(ctx).reduce((s, c) => s + Math.max(0, owner.res[Y] - owner.res[c]), 0) >= 6,
    }),
    m('pilgrim', 'Pilgrim', 1, 1, 'When recruited: +1 of each color.', {
      onRecruited(ctx, owner) { eachColor(ctx, owner, 1); },
    }),
    m('farmer', 'Farmer', 2, 1, 'Whenever an action gains you yellow, +1 more.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color === Y && g.n > 0) owner.res[Y] += 1; },
    }),
    m('weaver', 'Weaver', 2, 1, 'Whenever you buy 6 followers, +1 of each color.', {
      onRecruited(ctx, owner, card) { card.seenBig = ctx.state.bigLeft; },
      onBuyFollowers(ctx, owner, card, buyer) {
        // the 6-follower buy is the only one that uses up a limited pile; that's how we tell it apart
        const big = ctx.state.bigLeft < (card.seenBig ?? ctx.state.bigLeft);
        card.seenBig = ctx.state.bigLeft;
        if (big && buyer === owner) eachColor(ctx, owner, 1);
      },
    }),
    m('explorer', 'Explorer', 2, 2, 'Whenever you take a space outside Yellow, +1 yellow.', {
      afterAction(ctx, owner, card, qid) { if (qid !== 'yellow') ctx.gain(owner, Y, 1); },
    }),
    m('feastmaker', 'Feastmaker', 3, 2, 'Once per game: +1 of each color per round number.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const r = ctx.state.round;
        eachColor(ctx, owner, r);
        ctx.log(`${owner.name} used Feastmaker: +${r} of each color.`);
      },
      botActivate: ctx => ctx.state.round === 3,
    }),
  ],
};

function harvestAmount(ctx, p) {
  return colors(ctx).filter(c => c === Y || p.res[c] > 0).length;
}

// Transmute is a run of one-for-one swaps, with Done at any time. It can't run longer than what you held.
function transmuteStep(ctx, p, data) {
  const cs = colors(ctx);
  const opts = [];
  if (data.left > 0) {
    for (const a of cs) if (p.res[a] > 0) for (const b of cs) if (b !== a) {
      opts.push({
        id: `swap:${a}:${b}`, label: `1 ${a} → 1 ${b}`, kind: 'swap', value: [a, b],
        // bots even out their colors: a swap helps when it moves from a pile 2+ bigger
        hint: p.res[a] - p.res[b] - 1,
      });
    }
  }
  if (!opts.length) { finishTransmute(ctx, p, data); return; }
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Swap nothing', kind: 'done', value: 'done', hint: 0.5 });
  ctx.choose(p, `Transmute: swap one for one, or stop (${data.done} swapped so far)`, opts, 'yellow.swap', data);
}
function finishTransmute(ctx, p, data) {
  const what = Object.entries(data.tally || {}).map(([k, n]) => `${n} ${k.replace('>', ' → ')}`).join(', ');
  ctx.log(data.done ? `${p.name} transmuted ${what}.` : `${p.name} swapped nothing.`);
}
