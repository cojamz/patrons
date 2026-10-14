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
/** The colors p holds the fewest of (ties: all of them). */
const fewest = (ctx, p) => { const low = Math.min(...colors(ctx).map(c => p.res[c] || 0)); return colors(ctx).filter(c => (p.res[c] || 0) === low); };
const total = (ctx, p) => colors(ctx).reduce((a, c) => a + (p.res[c] || 0), 0);
// a member's color, or null when its sphere isn't on this table (a guest member leaning to an absent sphere)
const colorOf = (ctx, card) => { const r = ctx.quadrant(ctx.defOf(card).quadrant).resource; return ctx.state.resources.includes(r) ? r : null; };
const eachColor = (ctx, p, n, opts) => { for (const c of colors(ctx)) ctx.gain(p, c, n, opts); };

export default {
  id: 'yellow',
  name: 'Yellow',
  resource: Y,
  scoring: {
    label: 'Most full sets',
    // a full set is one of each color; you need at least one to score; yellow breaks ties
    score: (ctx, p) => { const s = setsOf(ctx, p); return s > 0 ? s * 1000 + p.res[Y] : 0; },
    show: (ctx, p) => ({ count: setsOf(ctx, p), tiebreak: p.res[Y] || 0 }),
    counts: 'full sets: how many times you hold one of each color on the table',
    tiebreak: { unit: 'yellow', text: 'yellow breaks ties' },
  },

  actions: [
    {
      key: 'harvest', ring: 1, name: 'Harvest', text: '+1 yellow, plus 1 per other color you hold.',
      estimate: (ctx, p) => harvestAmount(ctx, p),
      resolve(ctx, p) { ctx.gain(p, Y, harvestAmount(ctx, p), { fromAction: true }); },
    },
    {
      // never 0 (Claude under Cory's go-with-your-gut, from the dead-window audit): "colors you have none of" was dead
      // whenever you held every color. Raising every lowest color always adds one full set.
      key: 'bloom', ring: 1, name: 'Bloom', text: '+1 of each color you hold the fewest of (ties: all of them).',
      estimate: (ctx, p) => fewest(ctx, p).length + 0.5,
      resolve(ctx, p) {
        const list = fewest(ctx, p);
        for (const c of list) ctx.gain(p, c, 1, { fromAction: true });
        ctx.log(`${p.name}'s Bloom: +1 ${list.join(', +1 ')}.`);
      },
    },
    {
      key: 'transmute', ring: 1, name: 'Transmute', text: 'Swap up to 3 of your resources for other colors, then +1 yellow.',
      estimate: (ctx, p) => 1 + Math.min(3, Math.max(0, Math.floor(total(ctx, p) / colors(ctx).length) - setsOf(ctx, p))) * 0.8,
      resolve(ctx, p) { transmuteStep(ctx, p, { left: Math.min(3, total(ctx, p)), done: 0 }); },
    },
    {
      // a base of 1 (Claude under Cory's go-with-your-gut, from the dead-window audit): it was dead in 76–84% of offers
      key: 'prism', ring: 2, name: 'Prism', text: '+1 of each other color, and +1 more of each per 3 yellow you have (you keep the yellow).',
      estimate: (ctx, p) => others(ctx).length * (1 + Math.floor((p.res[Y] || 0) / 3)),
      resolve(ctx, p) {
        const k = 1 + Math.floor((p.res[Y] || 0) / 3);
        for (const c of others(ctx)) ctx.gain(p, c, k, { fromAction: true });
        ctx.log(`${p.name}'s Prism: +${k} of each other color.`);
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
      key: 'flourish', ring: 3, name: 'Flourish', text: '+1 of each other color per full set you hold.',
      estimate: (ctx, p) => 3 * setsOf(ctx, p),
      resolve(ctx, p) {
        const k = setsOf(ctx, p);
        for (const c of others(ctx)) ctx.gain(p, c, k, { fromAction: true });
        ctx.log(k ? `${p.name} flourishes: +${k} of each other color.` : `${p.name} had no full set to flourish.`);
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
    m('gardener', 'Gardener', 2, 0, 'Now and at round start, +1 of each color you have none of.', { now: true,
      onRoundStart(ctx, owner) { for (const c of missing(ctx, owner)) ctx.gain(owner, c, 1); },
    }),
    m('peddler', 'Peddler', 2, 2, 'Now and at round start, +1 of each other color.', { now: true,
      onRoundStart(ctx, owner) { for (const c of others(ctx)) ctx.gain(owner, c, 1); },
    }),
    m('gleaner', 'Gleaner', 6, 4, 'Whenever an action gains you 2+ of another color at once, +1 yellow.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== Y && g.n >= 2) owner.res[Y] += 1; },
    }),
    m('admirer', 'Admirer', 4, 2, 'Whenever a rival recruits a member of a color you have none of, +1 of that color.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        const c = colorOf(ctx, recruited);
        if (c && by !== owner && !(owner.res[c] > 0)) ctx.gain(owner, c, 1);
      },
    }),
    m('gobetween', 'Go-Between', 4, 4, 'Whenever you recruit a non-yellow member, +1 of its color.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'yellow' && colorOf(ctx, recruited)) ctx.gain(owner, colorOf(ctx, recruited), 1);
      },
    }),
    m('dyer', 'Dyer', 4, 2, 'At round end, +1 yellow per color you hold.', {
      onRoundEnd(ctx, owner) { ctx.gain(owner, Y, held(ctx, owner).length); },
    }),
    m('latebloomer', 'Late Bloomer', 2, 2, 'Now and at round start, if you have the fewest followers (ties count), +1 of each color.', { now: true,
      onRoundStart(ctx, owner) {
        const mine = ctx.followers(owner);
        if (ctx.rivals(owner).every(o => ctx.followers(o) >= mine)) eachColor(ctx, owner, 1);
      },
    }),
    m('sower', 'Sower', 2, 2, 'Round start: plant any of your yellow. Round end: gain that many of each other color.', {
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
      // leaving mid-round (released, stolen, swapped): the planted yellow comes back, unharvested (as Investor's gold does)
      onLeave(ctx, owner, card) {
        const x = card.sown || 0;
        if (x) { owner.res[Y] += x; card.sown = 0; ctx.log(`${owner.name}'s Sower leaves: ${x} planted yellow comes back.`); }
      },
    }),
    m('harmonist', 'Harmonist', 6, 2, 'Game end: +1 follower per full set you hold.', {
      onGameEnd: (ctx, owner) => setsOf(ctx, owner),
    }),
    m('rainmaker', 'Rainmaker', 4, 2, 'Once per game: raise each of your colors to match your yellow.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const top = owner.res[Y];
        let got = 0;
        for (const c of others(ctx)) { const d = Math.max(0, top - owner.res[c]); got += d; ctx.gain(owner, c, d); }
        ctx.log(`${owner.name} used Rainmaker: every color up to ${top} (+${got}).`);
      },
      // bots: a big catch-up in round III, or anything at all on their last buy of the game (they left it unused
      // in 4 of 6 holdings, dead-window audit 2026-10-14)
      botActivate: (ctx, owner) => {
        const gain = others(ctx).reduce((s, c) => s + Math.max(0, owner.res[Y] - owner.res[c]), 0);
        const last = (ctx.state.round === 3 || ctx.state.endEarly) && owner.left === 0;
        return (ctx.state.round === 3 && gain >= 6) || (last && gain > 0);
      },
    }),
    m('pilgrim', 'Pilgrim', 2, 2, 'When recruited: +1 of each color.', {
      onRecruited(ctx, owner) { eachColor(ctx, owner, 1); },
    }),
    m('farmer', 'Farmer', 4, 2, 'Whenever an action gains you yellow, +1 more.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color === Y && g.n > 0) owner.res[Y] += 1; },
    }),
    m('weaver', 'Weaver', 4, 2, 'Whenever you buy 6 or more followers, +1 of each color.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 6) eachColor(ctx, owner, 1);
      },
    }),
    m('explorer', 'Explorer', 4, 4, 'Whenever you take a space outside Yellow, +1 yellow.', {
      afterAction(ctx, owner, card, qid) { if (qid !== 'yellow') ctx.gain(owner, Y, 1); },
    }),
    m('feastmaker', 'Feastmaker', 6, 4, 'Once per game: +1 of each color per round number.', {
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
  return 1 + others(ctx).filter(c => p.res[c] > 0).length;
}

// Transmute is up to 3 one-for-one swaps, with Done at any time, then +1 yellow.
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
  ctx.gain(p, Y, 1, { fromAction: true });
  const what = Object.entries(data.tally || {}).map(([k, n]) => `${n} ${k.replace('>', ' → ')}`).join(', ');
  ctx.log(data.done ? `${p.name} transmuted ${what}.` : `${p.name} swapped nothing.`);
}
