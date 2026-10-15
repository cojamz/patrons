// src/engine/v4/content/silver.js
var m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var S = "silver";
var others = (ctx, p) => ctx.rivals(p);
var otherColors = (ctx) => ctx.state.resources.filter((c) => c !== S);
var effDefs = (c) => c.copy ? [c.def, defById(c.copy)] : [c.def];
function hooks(ctx, p, name) {
  const out = [];
  for (const c of ctx.membersOf(p)) for (const d of effDefs(c)) if (d[name]) out.push([c, d]);
  return out;
}
function giveTo(ctx, giver, to, color, n) {
  if (!(n > 0)) return;
  ctx.gain(to, color, n);
  for (const [c, d] of hooks(ctx, to, "onGiven")) ctx.asMember(to, d.name, () => d.onGiven(ctx, to, c, giver, color, n));
}
function giveAll(ctx, giver, color, n) {
  if (!(n > 0)) return;
  for (const o of others(ctx, giver)) giveTo(ctx, giver, o, color, n);
  afterGive(ctx, giver);
}
function give(ctx, giver, to, color, n) {
  if (!(n > 0)) return;
  giveTo(ctx, giver, to, color, n);
  afterGive(ctx, giver);
}
function afterGive(ctx, giver) {
  for (const [c, d] of hooks(ctx, giver, "onGive")) ctx.asMember(giver, d.name, () => d.onGive(ctx, giver, c));
}
function hostGain(ctx, p, n) {
  const k = hooks(ctx, p, "hostDouble").length;
  if (k) ctx.log(`${p.name}'s Grand Host: the space's ${n} silver comes as ${n * 2 ** k}.`);
  ctx.gain(p, S, n * 2 ** k, { fromAction: true, printed: n });
}
function leadIn(ctx, p, color) {
  const best = Math.max(0, ...others(ctx, p).map((o) => o.res[color] || 0));
  return (p.res[color] || 0) - best;
}
var colorHint = (ctx, p, color) => {
  const lead = leadIn(ctx, p, color);
  const risky = (p.res[color] || 0) > 0 && lead >= 0 && lead <= 1 ? -1 : 0;
  return risky - 0.3 * (p.res[color] || 0);
};
var tideAmount = (ctx, p, extra) => Math.ceil((Math.max(0, ...ctx.rivals(p).map((o) => o.res[S])) + extra) / 2);
var spillCost = (ctx, n) => 0.25 * n * (ctx.state.players.length - 1);
var silverActions = [
  {
    key: "toast",
    ring: 1,
    name: "Toast",
    text: "+3 silver per round number (3 / 6 / 9), and everyone else +1 silver.",
    estimate: (ctx) => 3 * ctx.state.round - spillCost(ctx, 1),
    resolve(ctx, p) {
      const n = 3 * ctx.state.round;
      hostGain(ctx, p, n);
      giveAll(ctx, p, S, 1);
      ctx.log(`${p.name} raised a toast: +${n} silver, +1 silver to everyone else.`);
    }
  },
  {
    key: "gift",
    ring: 1,
    name: "Goody Bags",
    text: "+2 silver and +2 of another color; everyone else gets 1 of that color.",
    estimate: (ctx) => 4 - spillCost(ctx, 1),
    resolve(ctx, p) {
      hostGain(ctx, p, 2);
      ctx.choose(p, "Goody Bags: which color? You get 2, everyone else gets 1.", otherColors(ctx).map((c) => ({
        id: `color:${c}`,
        label: c,
        kind: "color",
        value: c,
        hint: colorHint(ctx, p, c)
      })), "silver.gift", { mine: 2 });
    }
  },
  {
    key: "alms",
    ring: 1,
    name: "Good Deed",
    text: "+4 silver, and a rival you choose gets 2 of a color you choose.",
    estimate: () => 4 - 0.5,
    resolve(ctx, p) {
      hostGain(ctx, p, 4);
      const leader = Math.max(...ctx.state.players.map((o) => ctx.followers(o)));
      const opts = [];
      for (const o of others(ctx, p)) for (const c of ctx.state.resources) {
        const lead = leadIn(ctx, o, c);
        opts.push({
          id: `give:${o.id}:${c}`,
          label: `${o.name}: 2 ${c}`,
          kind: "give",
          value: [o.id, c],
          hint: -0.3 * ctx.followers(o) + (lead >= -2 && lead <= 0 ? 1 : 0) - (ctx.followers(o) === leader ? 2 : 0) + (c === S ? -0.5 : 0)
        });
      }
      ctx.choose(p, "Good Deed: give 2 of which color, to whom?", opts, "silver.alms");
    }
  },
  {
    key: "tongue",
    ring: 2,
    name: "Sweet Talk",
    text: "+4 silver, then swap any of your silver for one other color, one for one. Everyone else +1 silver.",
    estimate: (ctx) => 5 - spillCost(ctx, 1),
    resolve(ctx, p) {
      hostGain(ctx, p, 4);
      const have = p.res[S];
      const opts = [{ id: "keep", label: "Keep it all", kind: "swap", value: null, hint: 0 }];
      for (const c of otherColors(ctx)) for (const x of [.../* @__PURE__ */ new Set([Math.floor(have / 2), have])].filter((v) => v > 0)) {
        opts.push({
          id: `swap:${c}:${x}`,
          label: `${x} silver \u2192 ${x} ${c}`,
          kind: "swap",
          value: [c, x],
          // bots: turn half into the color they're shortest of
          hint: x === Math.floor(have / 2) ? 1 - 0.2 * (p.res[c] || 0) : -1
        });
      }
      ctx.choose(p, `Sweet Talk: swap silver for another color? (you have ${have})`, opts, "silver.tongue");
    }
  },
  {
    key: "tide",
    ring: 2,
    name: "Rising Tide",
    text: "Everyone else +1 silver. Then gain half the silver of the richest rival (rounded up).",
    estimate: (ctx, p) => tideAmount(ctx, p, 1) - spillCost(ctx, 1),
    resolve(ctx, p) {
      giveAll(ctx, p, S, 1);
      const k = tideAmount(ctx, p, 0);
      hostGain(ctx, p, k);
      ctx.log(`${p.name}'s Rising Tide: +1 silver to everyone else, then +${k} silver.`);
    }
  },
  {
    key: "jubilee",
    ring: 3,
    name: "Hold Court",
    text: "Gain 1 follower per 2 silver you hold (keep the silver). Everyone else +2 silver.",
    estimate: (ctx, p) => 2 * Math.floor(p.res[S] / 2) - spillCost(ctx, 2),
    resolve(ctx, p) {
      const f = Math.floor(p.res[S] / 2);
      p.bonus += f;
      giveAll(ctx, p, S, 2);
      ctx.log(`${p.name}'s Hold Court: +${f} followers, +2 silver to everyone else.`);
    }
  }
];
var silver = {
  id: "silver",
  name: "Silver",
  resource: S,
  scoring: { label: "Most silver", counts: "the silver you hold when the round ends", score: (ctx, p) => p.res[S] },
  actions: silverActions,
  handlers: {
    gift(ctx, p, color, data) {
      ctx.gain(p, color, data.mine, { fromAction: true });
      giveAll(ctx, p, color, 1);
      ctx.log(`${p.name} took ${data.mine} ${color} and gave everyone else 1 ${color}.`);
    },
    alms(ctx, p, [id, color]) {
      const t = ctx.player(id);
      giveTo(ctx, p, t, color, 2);
      afterGive(ctx, p);
      ctx.log(`${p.name} gave ${t.name} 2 ${color}.`);
    },
    tongue(ctx, p, value) {
      if (value) {
        const [c, x] = value;
        p.res[S] -= x;
        p.res[c] += x;
        ctx.log(`${p.name} turned ${x} silver into ${x} ${c}.`);
      }
      giveAll(ctx, p, S, 1);
    },
    benefactor(ctx, p, id) {
      const t = ctx.player(id);
      giveTo(ctx, p, t, S, 1);
      afterGive(ctx, p);
      ctx.log(`${p.name}'s Benefactor gives ${t.name} 1 silver.`);
    }
  },
  members: [
    m("guest", "Guest", 4, 4, "Whenever another player gives you something, +1 more of it.", {
      onGiven(ctx, owner, card, giver, color) {
        if (giver !== owner) ctx.gain(owner, color, 1);
      }
    }),
    m("benefactor", "Benefactor", 4, 2, "Now and at round start, +3 silver, and a rival you pick gets 1 silver.", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, S, 3);
        const low = Math.min(...others(ctx, owner).map((o) => ctx.followers(o)));
        ctx.choose(owner, "Benefactor: give 1 silver to\u2026", others(ctx, owner).map((o) => ({
          id: `player:${o.id}`,
          label: o.name,
          kind: "player",
          value: o.id,
          hint: ctx.followers(o) === low ? 1 : 0
        })), "silver.benefactor");
      }
    }),
    m("caterer", "Caterer", 2, 2, "Whenever you give something to other players, +1 silver.", {
      onGive(ctx, owner) {
        ctx.gain(owner, S, 1);
      }
    }),
    m("majordomo", "Majordomo", 4, 2, "Whenever you take a Silver space, +2 silver.", {
      afterAction(ctx, owner, card, qid) {
        if (qid === S) ctx.gain(owner, S, 2);
      }
    }),
    // rewards not hosting (Claude under Cory's go-with-your-gut, from the dead-window audit): "+1 more per action silver"
    // was Majordomo at half the yield, since almost all action silver comes from Silver spaces
    m("silversmith", "Silversmith", 4, 2, "Whenever a rival takes a Silver space, +1 silver.", {
      afterRivalAction(ctx, owner, card, qid) {
        if (qid === S) ctx.gain(owner, S, 1);
      }
    }),
    m("steward", "Steward", 2, 2, "Now and at round start, +1 silver per 3 silver you hold.", {
      now: true,
      // counts after every other round-start income (Benefactor, Banker…), as a player reads it (Cory hit this, 2026-10-14)
      onRoundStartLate(ctx, owner) {
        ctx.gain(owner, S, Math.floor(owner.res[S] / 3));
      }
    }),
    m("retinue", "Retinue", 2, 2, "Worth 2 followers. When recruited, everyone else +1 silver.", {
      f: 2,
      onRecruited(ctx, owner) {
        giveAll(ctx, owner, S, 1);
      }
    }),
    // Cory (2026-10-14): replaces Feast Hall. Members are people or groups, and a hall is lots of people: it counts as
    // 3 members (n: 3) everywhere members are counted. Same cost for now; the fair-price screen checks it.
    m("revelers", "Revelers", 4, 2, "Counts as 3 members.", { n: 3 }),
    // pays when recruited too (Claude under Cory's go-with-your-gut, from the dead-window audit): blank if recruited in round III
    m("heir", "Heir", 6, 2, "Now and at the start of round III: +1 silver per member you have.", {
      onRecruited(ctx, owner) {
        ctx.gain(owner, S, ctx.memberCount(owner));
      },
      onRoundStart(ctx, owner) {
        if (ctx.state.round === 3) ctx.gain(owner, S, ctx.memberCount(owner));
      }
    }),
    // Cory, 2026-10-15 (balance pass 1, #2): half of it, Rising Tide's rule (both bots read the old card at 12+ for 6)
    m("spoon", "Upstart", 4, 2, "When recruited, gain half the silver of the richest rival (rounded up).", {
      onRecruited(ctx, owner) {
        ctx.gain(owner, S, Math.ceil(Math.max(0, ...others(ctx, owner).map((o) => o.res[S] || 0)) / 2));
      }
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 8 → 4
    m("toastmaster", "Toastmaster", 2, 2, "Whenever you take a Silver space, +1 follower.", {
      afterAction(ctx, owner, card, qid) {
        if (qid === S) owner.bonus += 1;
      }
    }),
    m("gala", "Debutante", 4, 4, "Once per game: double your silver, and everyone else +2 silver.", {
      activate: "game",
      onActivate(ctx, owner) {
        ctx.gain(owner, S, owner.res[S]);
        giveAll(ctx, owner, S, 2);
        ctx.log(`${owner.name}'s Debutante: silver doubled to ${owner.res[S]}, +2 silver to everyone else.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res[S] >= 6
    }),
    m("dowager", "Dowager", 2, 2, "Worth 3 followers.", { f: 3 }),
    m("grandhost", "Grand Host", 8, 4, "Silver spaces give you twice the silver.", { hostDouble: true }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 12 → 6 (the most one pass moves);
    // pass 2's pooled midpoint (5.2) rounds back to 6, so it stays (design/eval/balance-pass-2.md)
    m("saint", "Patron Saint", 4, 2, "Game end: +1 follower per 2 silver members in play, anyone\u2019s.", {
      onGameEnd: (ctx) => Math.floor(ctx.state.players.reduce((s, o) => s + ctx.countMembersOfColor(o, S), 0) / 2)
    })
  ]
};
var silver_default = silver;

// src/engine/v4/content/gold.js
var m2 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var gold_default = {
  id: "gold",
  name: "Gold",
  resource: "gold",
  // gold is money: each gold counts as any color when buying followers
  wildInFollowerBuys: true,
  scoring: { label: "Most gold", counts: "the gold you hold when the round ends", score: (ctx, p) => p.res.gold },
  actions: [
    {
      key: "jv",
      ring: 1,
      name: "Kickback",
      text: "+3 gold, and +1 gold to a player you choose.",
      estimate: () => 3.3,
      resolve(ctx, p) {
        ctx.gain(p, "gold", 3, { fromAction: true });
        const rivals = ctx.rivals(p);
        ctx.choose(p, "Kickback: give 1 gold to\u2026", rivals.map((o) => ({
          id: `player:${o.id}`,
          label: o.name,
          kind: "player",
          value: o.id,
          hint: -ctx.followers(o)
        })), "gold.jvGift");
      }
    },
    {
      key: "rush",
      ring: 1,
      name: "Golden Years",
      text: "+2 gold per round number (2 / 4 / 6).",
      estimate: (ctx) => 2 * ctx.state.round,
      resolve(ctx, p) {
        ctx.gain(p, "gold", 2 * ctx.state.round, { fromAction: true });
      }
    },
    {
      key: "discount",
      ring: 1,
      name: "Intro Offer",
      text: "Your next member costs 4 less, off any part of its cost.",
      estimate: (ctx) => ctx.shopCards().some((c) => c.def.s + c.def.w >= 6) ? 2.4 : 1.2,
      resolve(ctx, p) {
        p.discount += 4;
        ctx.log(p.discount > 4 ? `Intro Offer stacks: ${p.name}'s next member costs ${p.discount} less.` : `${p.name}'s next member costs 4 less.`);
      }
    },
    {
      key: "steal",
      ring: 2,
      name: "Collect Debts",
      text: "Take up to 3 gold from rivals, split however you like.",
      estimate: (ctx, p) => Math.min(3, ctx.rivals(p).filter((o) => ctx.canSteal(p, o)).reduce((s, o) => s + o.res.gold, 0)) * 1.4,
      resolve(ctx, p) {
        stealStep(ctx, p, { left: ctx.stealCount(p, 3, { say: true }), picked: {} });
      }
    },
    {
      key: "windfall",
      ring: 2,
      name: "Tithe",
      text: "+1 gold per member you have.",
      estimate: (ctx, p) => ctx.memberCount(p),
      resolve(ctx, p) {
        ctx.gain(p, "gold", ctx.memberCount(p), { fromAction: true });
      }
    },
    {
      key: "strike",
      ring: 3,
      name: "Double Down",
      text: "Double your gold.",
      estimate: (ctx, p) => p.res.gold,
      resolve(ctx, p) {
        ctx.gain(p, "gold", p.res.gold, { fromAction: true });
      }
    }
  ],
  handlers: {
    jvGift(ctx, p, value) {
      const t = ctx.player(value);
      ctx.log(`${p.name} gave 1 gold to ${t.name}.`);
      give(ctx, p, t, "gold", 1);
    },
    steal(ctx, p, value, data) {
      stealStep(ctx, p, { left: data.left - 1, picked: { ...data.picked, [value]: (data.picked[value] || 0) + 1 } });
    },
    invest(ctx, p, x, data) {
      if (!x) return;
      const card = ctx.card(data.uid);
      p.res.gold -= x;
      card.invested = (card.invested || 0) + x;
      ctx.log(`${p.name}'s Investor sets aside ${x} gold.`);
    },
    hustlerColor(ctx, p, value, data) {
      ctx.card(data.uid).color = value;
      ctx.log(`${p.name}'s Hustler works the ${ctx.quadrant(value).name} spaces.`);
    }
  },
  members: [
    m2("midas", "Midas", 4, 4, "Gains from actions come as gold instead. You can switch it off or on when you buy.", {
      toggle: true,
      onRecruited(ctx, owner, card) {
        card.on = true;
      },
      // a conversion: runs before every other gain modifier, so "gold gains" sees the converted gain
      convertGain(ctx, owner, card, g) {
        if (card.on !== false && g.fromAction && g.color !== "gold") g.color = "gold";
      }
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m2("banker", "Banker", 4, 4, "Now and at round start, +3 gold.", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, "gold", 3);
      }
    }),
    m2("prospector", "Prospector", 2, 2, "Whenever an action gains you gold, +1 more.", {
      afterGain(ctx, owner, card, g) {
        if (g.fromAction && g.color === "gold" && g.n > 0) owner.res.gold += 1;
      }
    }),
    // Cory, 2026-10-15 (balance pass 1, #1): only the top rival pays it, about a third of what any rival paid
    // (both bots read the old card at 8.7 for 4). Ties for the most all count; it's measured before the buy lands.
    m2("taxman", "Tax Collector", 2, 2, "Whenever the rival with the most followers buys followers, +1 gold.", {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner) return;
        const before = (o) => ctx.followers(o) - (o === buyer ? tier && tier.get || 0 : 0);
        if (ctx.rivals(owner).every((o) => before(o) <= before(buyer))) ctx.gain(owner, "gold", 1);
      }
    }),
    m2("merchant", "Merchant", 4, 2, "Whenever anyone recruits a gold member, +1 gold.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && ctx.defOf(recruited).quadrant === "gold") ctx.gain(owner, "gold", 1);
      }
    }),
    m2("thrift", "Penny Pincher", 4, 0, "Gold you spend on members counts double.", { goldPaysDouble: true }),
    m2("coinpurse", "Middleman", 2, 2, "Whenever you recruit a non-gold member, +1 gold.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== "gold") ctx.gain(owner, "gold", 1);
      }
    }),
    m2("underdog", "Underdog", 4, 2, "While anyone has more gold than you, your gold gains are doubled.", {
      modifyGain(ctx, owner, card, g) {
        if (g.color === "gold" && !g.doubled && ctx.state.players.some((o) => o !== owner && o.res.gold > owner.res.gold)) {
          g.n *= 2;
          g.doubled = true;
        }
      },
      // the preview's reason when a gold gain isn't doubled (no rule here): who made you the richest, if it was
      // a gain earlier in the same move (Hustler's +3 lands before the space's own gold)
      whyNot(ctx, owner, card, g) {
        if (g.color !== "gold" || g.doubled) return null;
        const top2 = Math.max(0, ...ctx.rivals(owner).map((o) => o.res.gold || 0));
        if (top2 > owner.res.gold) return null;
        const earlier = (ctx.state.notes || []).filter((n) => n.p === owner.id && n.member !== card.def.name && n.res && n.res.gold > 0);
        const got = earlier.reduce((t, n) => t + n.res.gold, 0);
        if (earlier.length && owner.res.gold - got < top2) return `no \xD72 (${earlier.map((n) => `${n.member}\u2019s +${n.res.gold}`).join(", ")} lands first)`;
        return `no \xD72 (no one has more gold than your ${owner.res.gold})`;
      }
    }),
    m2("tinker", "Tinker", 4, 2, "Whenever an action gains you another resource, also gain half as much gold (rounded up).", {
      afterGain(ctx, owner, card, g) {
        if (g.fromAction && g.color !== "gold" && g.n > 0) owner.res.gold += Math.ceil(g.n / 2);
      }
    }),
    m2("investor", "Investor", 4, 2, "Round start: set aside any of your gold. Round end: it comes back doubled.", {
      onRoundStartLate(ctx, owner, card) {
        const g = owner.res.gold;
        if (!g) return;
        const amounts = [.../* @__PURE__ */ new Set([0, Math.floor(g / 4), Math.floor(g / 2), Math.floor(3 * g / 4), g])].filter((x) => x >= 0);
        ctx.choose(owner, `Investor: set aside how much gold? (you have ${g})`, amounts.map((x) => ({
          id: `amount:${x}`,
          label: x === 0 ? "None" : x === g ? `All ${x}` : `${x}`,
          kind: "amount",
          value: x,
          hint: x === Math.floor(g / 2) ? 1 : 0
        })), "gold.invest", { uid: card.uid });
      },
      onRoundEnd(ctx, owner, card) {
        const x = card.invested || 0;
        if (x) {
          owner.res.gold += 2 * x;
          card.invested = 0;
          ctx.log(`${owner.name}'s Investor returns ${2 * x} gold.`);
        }
      },
      // stolen, swapped, released or traded in: the gold set aside goes back to its owner, not doubled (Cory)
      onLeave(ctx, owner, card) {
        const x = card.invested || 0;
        if (x) {
          owner.res.gold += x;
          card.invested = 0;
          ctx.log(`${owner.name}'s Investor leaves: ${x} gold set aside comes back.`);
        }
      }
    }),
    m2("jackpot", "Lottery Winner", 6, 4, "Once per game: gain gold equal to the richest rival\u2019s gold.", {
      activate: "game",
      onActivate(ctx, owner) {
        const r = Math.max(0, ...ctx.rivals(owner).map((o) => o.res.gold));
        ctx.gain(owner, "gold", r);
        ctx.log(`${owner.name} used Lottery Winner: +${r} gold.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some((o) => o.res.gold >= 4)
    }),
    m2("speculator", "Speculator", 4, 4, "Once per game: double your gold.", {
      activate: "game",
      onActivate(ctx, owner) {
        ctx.gain(owner, "gold", owner.res.gold);
        ctx.log(`${owner.name} used Speculator: gold doubled to ${owner.res.gold}.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res.gold >= 6
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 12 → 6
    m2("tycoon", "Tycoon", 4, 2, "Game end: +1 follower per 3 gold.", {
      onGameEnd: (ctx, owner) => Math.floor(owner.res.gold / 3)
    }),
    m2("seed", "Treasurer", 4, 0, "When recruited: gain gold equal to your member count.", {
      onRecruited(ctx, owner) {
        ctx.gain(owner, "gold", ctx.memberCount(owner));
      }
    }),
    m2("hustler", "Hustler", 2, 0, "When recruited, pick a color. Actions there give you +1 gold per round number.", {
      onRecruited(ctx, owner, card) {
        ctx.choose(owner, "Hustler: actions in which color give you extra gold?", ctx.state.quadrants.map((q2) => ({
          id: `color:${q2}`,
          label: ctx.quadrant(q2).name,
          kind: "color",
          value: q2,
          hint: q2 === "gold" ? 1 : 0
        })), "gold.hustlerColor", { uid: card.uid });
      },
      afterAction(ctx, owner, card, quadrant2) {
        if (card.color === quadrant2) owner.res.gold += ctx.state.round;
      }
    })
  ]
};
function stealStep(ctx, p, data) {
  const left = (o) => o.res.gold - (data.picked[o.id] || 0);
  const targets2 = ctx.rivals(p).filter((o) => left(o) > 0 && ctx.canSteal(p, o));
  if (data.left > 0 && targets2.length) {
    const taken = Object.values(data.picked).reduce((a, b) => a + b, 0);
    ctx.choose(p, `Collect Debts: take 1 gold from\u2026 (${data.left} left)`, targets2.map((o) => ({
      id: `player:${o.id}`,
      label: `${o.name} \xB7 ${left(o)} gold`,
      kind: "player",
      value: o.id,
      hint: left(o),
      target: { pid: o.id, res: "gold" }
      // their gold stack is what you click (the seat selector)
    })), "gold.steal", data, { count: { of: data.left + taken, left: data.left } });
    return;
  }
  let got = 0;
  const from = [];
  for (const [id, k] of Object.entries(data.picked)) {
    const v = ctx.player(Number(id));
    const x = ctx.steal(p, v, { take: { gold: k }, give: (n) => ctx.gain(p, "gold", n, { fromAction: true }) });
    if (x) {
      got += x;
      from.push(`${x} from ${v.name}`);
    }
  }
  ctx.log(got ? `${p.name} stole ${got} gold (${from.join(", ")}).` : `${p.name} found no gold to steal.`);
}

// src/engine/v4/content/red.js
var m3 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var cost = (c) => c.def.s + c.def.w;
var OPEN_HOUSE_MAX = 4;
var openHouseRow = (ctx) => ctx.shopCards().filter((c) => cost(c) <= OPEN_HOUSE_MAX);
var red_default = {
  id: "red",
  name: "Red",
  resource: "red",
  scoring: {
    label: "Most members (red members break ties)",
    // red members only break ties, so they weigh less than one whole member
    score: (ctx, p) => ctx.memberCount(p) * 1e3 + ctx.countMembersOfColor(p, "red"),
    // display: what the score is made of (every screen shows these numbers, never its own count)
    show: (ctx, p) => ({ count: ctx.memberCount(p), tiebreak: ctx.countMembersOfColor(p, "red") }),
    counts: "the members you hold (a card that counts as 2 members counts 2)",
    tiebreak: { unit: "red members", text: "red members break ties" }
  },
  actions: [
    {
      // the weak twin of Swap Sides, the way Open Door pairs with Open House (Cory: "let's try it")
      key: "evenswap",
      ring: 1,
      name: "Even Swap",
      text: "+1 red, and swap one of your members for a rival\u2019s of equal cost.",
      estimate: (ctx, p) => 1 + (swapPairs(ctx, p, sameCost).length ? 1 : 0),
      resolve(ctx, p) {
        ctx.gain(p, "red", 1, { fromAction: true });
        swap(ctx, p, sameCost, "Even Swap: give one of yours, get one of theirs of equal cost", `${p.name} had no equal-cost member to swap.`);
      }
    },
    {
      key: "turnout",
      ring: 1,
      name: "Bandwagon",
      text: "+1 red per member recruited this round, by anyone.",
      estimate: (ctx) => ctx.state.recruits,
      resolve(ctx, p) {
        ctx.gain(p, "red", ctx.state.recruits, { fromAction: true });
      }
    },
    {
      key: "hire",
      ring: 1,
      name: "Open Door",
      text: "Recruit the cheapest face-up member, free.",
      estimate: (ctx) => cheapValue(ctx),
      resolve(ctx, p) {
        hireCheapest(ctx, p, "Open Door");
      }
    },
    {
      // Cory, 2026-10-15 (balance pass 1, #6): no +2 red, and you choose (was "+2 red, and recruit the cheapest
      // face-up member, free", his own "too strong" anchor: an extra recruit plus +2)
      key: "hireup",
      ring: 2,
      name: "Open House",
      text: `Recruit a face-up member costing ${OPEN_HOUSE_MAX} or less, free.`,
      estimate: (ctx) => Math.max(0, ...openHouseRow(ctx).map((c) => c.def.f + cost(c) * 0.8)),
      resolve(ctx, p) {
        const row3 = openHouseRow(ctx);
        if (!row3.length) {
          ctx.log(`Open House: no face-up member costs ${OPEN_HOUSE_MAX} or less, so ${p.name} recruits nothing.`);
          return;
        }
        if (row3.length === 1) {
          ctx.recruit(p, row3[0].uid, { free: true });
          return;
        }
        ctx.choose(p, "Open House: recruit which member?", row3.map((c) => ({
          id: `card:${c.uid}`,
          label: `${c.def.name} (${cost(c)})`,
          kind: "card",
          value: c.uid,
          hint: c.def.f * 1.5 + cost(c)
        })), "red.takeFree");
      }
    },
    {
      key: "trade",
      ring: 2,
      name: "Swap Sides",
      text: "Swap one of your members for another player\u2019s costing no more than yours +2.",
      estimate: (ctx, p) => swapPairs(ctx, p, upToTwoMore).length ? 2 : 0,
      resolve(ctx, p) {
        swap(ctx, p, upToTwoMore, "Swap Sides: give one of yours, get one of theirs", `${p.name} had nothing to trade.`);
      }
    },
    {
      key: "take",
      ring: 3,
      name: "Hand-pick",
      text: "Take any face-up member, free.",
      estimate: (ctx) => Math.max(0, ...ctx.shopCards().map((c) => c.def.f + cost(c) * 0.6)),
      resolve(ctx, p) {
        const shop = ctx.shopCards();
        if (!shop.length) return;
        ctx.choose(p, "Hand-pick: which member?", shop.map((c) => ({
          id: `card:${c.uid}`,
          label: `${c.def.name} (${cost(c)})`,
          kind: "card",
          value: c.uid,
          hint: c.def.f * 1.5 + cost(c)
        })), "red.takeFree");
      }
    }
  ],
  handlers: {
    takeFree(ctx, p, uid) {
      ctx.recruit(p, uid, { free: true });
    },
    trade(ctx, p, [mine2, theirs]) {
      const other = ctx.ownerOf(theirs);
      ctx.moveMember(mine2, p, other);
      ctx.moveMember(theirs, other, p);
      ctx.log(`${p.name} traded ${ctx.card(mine2).def.name} for ${other.name}'s ${ctx.card(theirs).def.name}.`);
    },
    doppelCopy(ctx, p, uid, data) {
      const target = ctx.card(uid);
      const self = ctx.card(data.uid);
      self.copy = target.def.id;
      if (target.color !== void 0) self.color = target.color;
      ctx.log(`${p.name}'s Doppelganger copies ${target.def.name}.`);
      const d = target.def;
      if (d.onRecruited) ctx.asMember(p, d.name, () => d.onRecruited(ctx, p, self));
      if (d.now) {
        for (const hook of ["onRoundStart", "onRoundStartLate"]) if (d[hook]) ctx.asMember(p, d.name, () => d[hook](ctx, p, self));
      }
    }
  },
  members: [
    m3("twins", "Twins", 1, 1, "Worth 2 followers.", { f: 2 }),
    m3("bigfamily", "Big Family", 2, 2, "Worth 3 followers.", { f: 3 }),
    m3("volunteer", "Volunteer", 0, 0, "Free. No effect."),
    m3("intern", "Intern", 1, 0, "No effect."),
    m3("mentor", "Mentor & Prot\xE9g\xE9", 6, 4, "When recruited: also take the cheapest face-up member free.", {
      // card: this Mentor, or a Doppelganger copying it (its free pick says so)
      onRecruited(ctx, owner, card) {
        const who = card && card.def && card.def.key === "doppel" ? "Doppelganger (as Mentor & Prot\xE9g\xE9)" : "Mentor & Prot\xE9g\xE9";
        if (ctx.shopCards().length) ctx.log(`${owner.name}'s ${who}: the cheapest face-up member comes along free.`);
        hireCheapest(ctx, owner, who);
      }
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 12 → 6
    m3("proselytizer", "Proselytizer", 4, 2, "Whenever you recruit, +1 follower.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid) owner.bonus += 1;
      }
    }),
    m3("mob", "Mob", 4, 4, "Game end: +1 follower per red member.", {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, "red")
    }),
    m3("recruiter", "Recruiter", 4, 4, "Whenever you recruit, +1 red.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid) ctx.gain(owner, "red", 1);
      }
    }),
    m3("drive", "Pied Piper", 2, 2, "Recruit 2+ members in one turn: +2 red.", {
      // pays the moment your second recruit of the turn lands, so the red can still be spent this turn
      onAnyRecruit(ctx, owner, card, by) {
        if (by === owner && ctx.state.current === owner.id && owner.turnRecruits === 2) {
          ctx.gain(owner, "red", 2);
          ctx.log(`${owner.name}'s Pied Piper: +2 red.`);
        }
      }
    }),
    m3("host", "Host", 4, 2, "Now and at round start, +1 red per 2 members.", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, "red", Math.floor(ctx.memberCount(owner) / 2));
      }
    }),
    m3("sponsor", "Sponsor", 6, 4, "Your members cost 2 less.", { costReduction: 2 }),
    m3("crowd", "Crowd-Pleaser", 2, 0, "Whenever you buy followers, +1 red.", {
      onBuyFollowers(ctx, owner, card, buyer) {
        if (buyer === owner) ctx.gain(owner, "red", 1);
      }
    }),
    m3("doppel", "Doppelganger", 4, 2, "When recruited: copies the effect of one of your members.", {
      onRecruited(ctx, owner, card) {
        const own = ctx.membersOf(owner).filter((c) => c.uid !== card.uid && c.def.key !== "doppel");
        if (!own.length) return;
        ctx.choose(owner, "Doppelganger: copy which of your members?", own.map((c) => ({
          id: `card:${c.uid}`,
          label: c.def.name,
          kind: "member",
          value: c.uid,
          hint: ["banker", "prospector", "recruiter", "proselytizer", "host"].includes(c.def.key) ? 2 : c.def.vanilla ? 0 : 1
        })), "red.doppelCopy", { uid: card.uid });
      }
    }),
    m3("patriarch", "Patriarch", 6, 4, "Game end: +1 follower per 2 members.", {
      onGameEnd: (ctx, owner) => Math.floor(ctx.memberCount(owner) / 2)
    }),
    m3("reserve", "Benchwarmer", 1, 0, "No effect.")
    // placeholder until Cory designs its hold (then it becomes Seat Saver)
  ]
};
function cheapValue(ctx) {
  const c = cheapest(ctx);
  return c ? c.def.f + cost(c) * 0.8 : 0;
}
function cheapest(ctx) {
  const shop = ctx.shopCards();
  if (!shop.length) return null;
  return shop.reduce((a, b) => cost(b) < cost(a) ? b : a);
}
function hireCheapest(ctx, p, who) {
  const shop = ctx.shopCards();
  if (!shop.length) return;
  const min = Math.min(...shop.map(cost));
  const tied = shop.filter((c) => cost(c) === min);
  if (tied.length === 1) {
    ctx.recruit(p, tied[0].uid, { free: true });
    return;
  }
  ctx.choose(p, `${who}: which of the cheapest members?`, tied.map((c) => ({
    id: `card:${c.uid}`,
    label: c.def.name,
    kind: "card",
    value: c.uid,
    hint: c.def.f
  })), "red.takeFree");
}
var upToTwoMore = (mine2, theirs) => cost(theirs) <= cost(mine2) + 2;
var sameCost = (mine2, theirs) => cost(theirs) === cost(mine2);
function swapPairs(ctx, p, fits) {
  const out = [];
  for (const a of ctx.membersOf(p))
    for (const o of ctx.rivals(p)) {
      if (!ctx.canSteal(p, o, "member")) continue;
      for (const b of ctx.membersOf(o)) if (fits(a, b)) out.push([a, o, b]);
    }
  return out;
}
function swap(ctx, p, fits, prompt, none) {
  const pairs = swapPairs(ctx, p, fits);
  if (!pairs.length) {
    ctx.log(none);
    return;
  }
  ctx.choose(p, prompt, pairs.map(([a, o, b]) => ({
    id: `trade:${a.uid}:${b.uid}`,
    label: `${a.def.name} \u2192 ${o.name}'s ${b.def.name}`,
    kind: "trade",
    value: [a.uid, b.uid],
    hint: b.def.f + cost(b) - (a.def.f + cost(a))
  })), "red.trade");
}

// src/engine/v4/content/standins.js
function standIn(id, name, other1, other2) {
  const plain = (key, ring, nm, gains) => {
    const text = Object.entries(gains).map(([c, n]) => `+${n} ${c}`).join(", ") + ".";
    return {
      key,
      ring,
      name: nm,
      text,
      estimate: () => Object.values(gains).reduce((a, b) => a + b, 0),
      // a named color that isn't on this table comes as the stand-in's own color instead
      resolve(ctx, p) {
        for (const [c, n] of Object.entries(gains)) ctx.gain(p, ctx.state.resources.includes(c) ? c : id, n, { fromAction: true });
      }
    };
  };
  const vanilla = [
    ["recruit", "Recruit", 2, 0, 1, 2],
    ["hand", "Hand", 2, 2, 1, 2],
    ["helper", "Helper", 4, 0, 1, 2],
    ["regular", "Regular", 4, 2, 2, 2],
    ["devotee", "Devotee", 4, 4, 2, 2],
    ["elder", "Elder", 6, 2, 3, 2],
    ["pillar", "Pillar", 6, 6, 5, 2],
    ["patron", "Patron", 8, 4, 5, 1]
  ];
  return {
    id,
    name,
    resource: id,
    standIn: true,
    scoring: { label: `Most ${id}`, counts: `the ${id} you hold when the round ends`, score: (ctx, p) => p.res[id] },
    actions: [
      plain("a1", 1, name === "Blue" ? "Tide" : "Sprout", { [id]: 3 }),
      plain("a2", 1, name === "Blue" ? "Current" : "Graft", { [id]: 2, [other1]: 1 }),
      plain("a3", 1, name === "Blue" ? "Shoal" : "Root", { [id]: 2, [other2]: 1 }),
      plain("a4", 2, name === "Blue" ? "Swell" : "Grove", { [id]: 5 }),
      plain("a5", 2, name === "Blue" ? "Harbor" : "Orchard", { [id]: 4, [other1 === "red" ? "gold" : "red"]: 1 }),
      plain("a6", 3, name === "Blue" ? "Flood" : "Bloom", { [id]: 8 })
    ],
    handlers: {},
    members: vanilla.map(([key, nm, s, w, f, copies]) => ({
      // plain members keep their pre-doubling cost: they don't pay for an ability they lack (Claude, 2026-10-14)
      key,
      name: `${name} ${nm}`,
      s: s / 2,
      w: w / 2,
      f,
      n: 1,
      copies,
      text: f > 1 ? `Worth ${f} followers.` : "Worth 1 follower.",
      vanilla: true
    }))
  };
}
var blue = standIn("blue", "Blue", "red", "green");
var green = standIn("green", "Green", "gold", "blue");

// src/engine/v4/content/purple.js
var m4 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var P = "purple";
var TURN_VALUE = [3, 5, 7];
var onBoard = (ctx, p) => Object.values(ctx.state.slots).filter((o) => o === p.id).length + Object.values(ctx.state.squats || {}).reduce((s, list) => s + list.filter((o) => o === p.id).length, 0);
function openSpaces(ctx) {
  const out = [];
  ctx.state.quadrants.forEach((qid, q2) => ctx.quadrant(qid).actions.forEach((a, i) => {
    if (a.ring <= ctx.state.round && ctx.state.slots[`${q2}-${i}`] === void 0) out.push([q2, i]);
  }));
  return out;
}
var scheduled = (ctx) => ctx.state.queue.filter((t) => t.t === "turn").length;
var spareSpace = (ctx) => openSpaces(ctx).length > scheduled(ctx);
var OT = 8;
var RALLY_PER = 4;
var RALLY_CAP = 2;
var priceFor = (ctx, p, base) => ctx.membersOf(p).some((c) => c.def.halfTurns || c.copy && c.copy.endsWith(".doubletime")) ? Math.ceil(base / 2) : base;
var room = (ctx) => openSpaces(ctx).length - scheduled(ctx);
var canBuyTurn = (ctx, p, base, n = 1) => (p.res[P] || 0) >= priceFor(ctx, p, base) && room(ctx) >= n;
var halfNote = (base, c) => c < base ? ` (Corner-Cutter: ${base} \u2192 ${c})` : "";
function buyTurn(ctx, p, base, what, fallback, member = false, n = 1) {
  if (canBuyTurn(ctx, p, base, n)) {
    const c = priceFor(ctx, p, base);
    p.res[P] -= c;
    const turns2 = n === 1 ? "an extra turn" : `${n} extra turns`;
    ctx.log(member ? `${p.name}'s ${what}: pays ${c} purple for ${turns2}${halfNote(base, c)}.` : `${p.name} pays ${c} purple for ${what}${halfNote(base, c)}.`);
    extraTurns(ctx, p, n);
    return true;
  }
  if (fallback) ctx.gain(p, P, fallback, { fromAction: true });
  return false;
}
var buyEstimate = (ctx, p, base, fallback, n = 1) => canBuyTurn(ctx, p, base, n) ? n * turnValue(ctx) - priceFor(ctx, p, base) * 0.8 + 1 : fallback;
var behind = (ctx, p, extra = 0) => ctx.rivals(p).filter((o) => onBoard(ctx, o) > onBoard(ctx, p) + extra).length;
var turnValue = (ctx) => TURN_VALUE[ctx.state.round - 1] || 3;
var rallyPer = (ctx, p) => priceFor(ctx, p, RALLY_PER);
var rallyWant = (ctx, p) => {
  const v = p.res[P] || 0, per = rallyPer(ctx, p);
  return v < per ? 0 : Math.min(RALLY_CAP, Math.floor(v / per) + 1);
};
var rallyTurns = (ctx, p) => Math.min(rallyWant(ctx, p), room(ctx));
function fire(ctx, p, hook, ...args) {
  for (const c of ctx.membersOf(p)) {
    const defs = [c.def];
    if (c.copy) defs.push(defById(c.copy));
    for (const d of defs) if (d && d[hook]) ctx.asMember(p, d.name, () => d[hook](ctx, p, c, ...args));
  }
}
function extraHooks(ctx, p) {
  fire(ctx, p, "onExtraTurn");
  for (const o of ctx.rivals(p)) fire(ctx, o, "onRivalExtraTurn", p);
}
function extraTurns(ctx, p, n = 1, why = null) {
  let k = 0;
  for (; k < n && spareSpace(ctx); k++) {
    const q2 = ctx.state.queue;
    const end = q2.findIndex((t) => t.t === "endTurn");
    q2.splice(end < 0 ? 0 : end + 1 + k, 0, { t: "turn", p: p.id });
    p.left += 1;
  }
  if (k) {
    ctx.log(`${why ? `${p.name}'s ${why}: ${p.name}` : p.name} takes ${k === 1 ? "an extra turn" : `${k} extra turns`}.`);
    for (let i = 0; i < k; i++) extraHooks(ctx, p);
  } else ctx.log(`No space to spare: ${p.name} gets no extra turn${why ? ` from ${why}` : ""}.`);
  return k;
}
var purple_default = {
  id: "purple",
  name: "Purple",
  resource: P,
  // Most purple: honest about what the old "most workers on the board" measured (everyone places every worker, so
  // purple's tiebreak decided it). Holding purple for the ring is the price of spending it on turns.
  scoring: { label: "Most purple", counts: "the purple you hold when the round ends", score: (ctx, p) => p.res[P] || 0 },
  actions: [
    {
      key: "hourly",
      ring: 1,
      name: "Clock In",
      text: "+4 / +5 / +6 purple, by round.",
      estimate: (ctx) => [3, 4, 5][ctx.state.round - 1] + 1,
      resolve(ctx, p) {
        ctx.gain(p, P, [3, 4, 5][ctx.state.round - 1] + 1, { fromAction: true });
      }
    },
    {
      // fill-in (critic): replaces Lend a Hand
      key: "catchup",
      ring: 1,
      name: "Catch Up",
      text: "+1 purple, and +2 per rival with more minions on the board than you.",
      estimate: (ctx, p) => 1 + 2 * behind(ctx, p, 1),
      resolve(ctx, p) {
        ctx.gain(p, P, 1 + 2 * behind(ctx, p), { fromAction: true });
      }
    },
    {
      key: "windup",
      ring: 1,
      name: "Roll Call",
      text: "+1 purple per minion you have on the board, this one included.",
      estimate: (ctx, p) => onBoard(ctx, p) + 1,
      resolve(ctx, p) {
        ctx.gain(p, P, onBoard(ctx, p), { fromAction: true });
      }
    },
    {
      // replaces Linger (Cory: "just bad"): the time you have left this round, banked as purple.
      // +1 per minion, was +2 (Cory, 2026-10-15, balance pass 1 #4: both bots read +2 at about 20u in round III)
      key: "planahead",
      ring: 2,
      name: "Plan Ahead",
      text: "+1 purple per minion you have left to place this round.",
      estimate: (ctx, p) => Math.max(0, p.left - 1),
      resolve(ctx, p) {
        ctx.gain(p, P, p.left, { fromAction: true });
      }
    },
    {
      // one worker in, two out: the turns are a net gain, not a worker spent to get a worker back (Cory)
      key: "overtime",
      ring: 2,
      name: "Overtime",
      text: `Pay ${OT} purple: take 2 extra turns right after this one. If you can\u2019t, +3 purple.`,
      estimate: (ctx, p) => buyEstimate(ctx, p, OT, 3, 2),
      resolve(ctx, p) {
        buyTurn(ctx, p, OT, "Overtime", 3, false, 2);
      }
    },
    {
      // the burst: all the purple you've banked becomes turns (and leaves the ring's count)
      key: "rally",
      ring: 3,
      name: "Crunch Time",
      text: `Spend all your purple: 1 extra turn right after this one per ${RALLY_PER} spent, plus 1 (up to ${RALLY_CAP}). With less than ${RALLY_PER}, +4 purple.`,
      estimate(ctx, p) {
        const k = rallyTurns(ctx, p);
        return k ? k * turnValue(ctx) - (p.res[P] || 0) * 0.8 + 1 : 4;
      },
      resolve(ctx, p) {
        const want = rallyWant(ctx, p), k = rallyTurns(ctx, p), per = rallyPer(ctx, p);
        if (!k) {
          if (want) ctx.log(`No space to spare: ${p.name} gets no extra turn from Crunch Time.`);
          ctx.gain(p, P, 4, { fromAction: true });
          return;
        }
        const paid = k === want ? p.res[P] : (k - 1) * per;
        p.res[P] -= paid;
        if (paid) ctx.log(`${p.name} spends ${paid} purple on Crunch Time${per < RALLY_PER ? ` (Corner-Cutter: 1 turn per ${per}, not ${RALLY_PER})` : ""}.`);
        extraTurns(ctx, p, k);
      }
    }
  ],
  members: [
    m4("secondwind", "Go-Getter", 6, 2, "Once per game: take an extra turn right after this one.", {
      activate: "game",
      onActivate(ctx, owner, card) {
        if (!extraTurns(ctx, owner, 1, "Go-Getter")) card.used = false;
      },
      botActivate: (ctx) => ctx.state.round === 3 && spareSpace(ctx)
    }),
    m4("errand", "Errand Runner", 4, 4, "When recruited: take an extra turn right after this one.", {
      onRecruited(ctx, owner) {
        extraTurns(ctx, owner, 1, "Errand Runner");
      }
    }),
    m4("taskmaster", "Taskmaster", 4, 2, "Once per round: pay 5 purple to take an extra turn right after this one.", {
      activate: "round",
      onRoundStart(ctx, owner, card) {
        card.used = false;
      },
      onActivate(ctx, owner, card) {
        if (!buyTurn(ctx, owner, 5, "Taskmaster", 0, true)) {
          card.used = false;
          ctx.log(`${owner.name} can't pay for Taskmaster now.`);
        }
      },
      botActivate: (ctx, owner) => canBuyTurn(ctx, owner, 5) && ctx.state.round >= 2
    }),
    m4("lateriser", "Late Riser", 4, 2, "At round start, if you have the fewest followers (ties count), take an extra turn before anyone else.", {
      // the round's turns are queued after round-start hooks, so this one goes first
      onRoundStart(ctx, owner) {
        const me = ctx.followers(owner);
        if (ctx.state.round > 1 && ctx.rivals(owner).every((o) => ctx.followers(o) >= me)) {
          ctx.state.queue.unshift({ t: "turn", p: owner.id });
          owner.left += 1;
          ctx.log(`${owner.name}'s Late Riser: an extra turn first.`);
          extraHooks(ctx, owner);
        }
      }
    }),
    m4("foreman", "Foreman", 4, 2, "Whenever you take an extra turn, +1 purple per minion you have on the board.", {
      onExtraTurn(ctx, owner) {
        ctx.gain(owner, P, onBoard(ctx, owner));
      }
    }),
    m4("courier", "Courier", 4, 2, "Whenever you take an extra turn, +1 of each other color.", {
      onExtraTurn(ctx, owner) {
        for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1);
      }
    }),
    m4("apprentice", "Apprentice", 2, 2, "Whenever you take an extra turn, your next member costs 4 less.", {
      onExtraTurn(ctx, owner) {
        owner.discount += 4;
      }
    }),
    m4("overseer", "Overseer", 2, 2, "Whenever a rival takes an extra turn, gain half your purple (up to 4).", {
      onRivalExtraTurn(ctx, owner) {
        ctx.gain(owner, P, Math.min(4, Math.floor((owner.res[P] || 0) / 2)));
      }
    }),
    // fill-in (critic): took the slot of an earlier card called Timekeeper (the name now belongs to the game-end purple card)
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 4 (the most one pass moves);
    // balance pass 2 (pooled bench, midpoint 2.1; design/eval/balance-pass-2.md): 4 → 2
    m4("doubletime", "Corner-Cutter", 2, 0, "Extra turns you pay purple for cost you half (rounded up).", { halfTurns: true }),
    // pays on your last placement of the round, before that turn's buy (at round end, round III's purple came too late).
    // +1 per worker measured 8.4 followers (57% win, easy bots): late purple decides the ring. Half that is the card.
    m4("bookkeeper", "Bookkeeper", 4, 2, "When you place your last minion of a round, +1 purple per 2 minions you have on the board.", {
      afterAction(ctx, owner, card) {
        if (owner.left !== 0 || card.paidRound === ctx.state.round) return;
        card.paidRound = ctx.state.round;
        ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2));
      }
    }),
    m4("clockmaker", "Clockmaker", 2, 2, "Now and at round start, +1 purple per 2 purple you have.", {
      now: true,
      // round start, not end (Claude, 2026-10-14, after Cory: purple left at the end of round III is worth nothing)
      // counts after other round-start income (Lamplighter…), like Steward
      onRoundStartLate(ctx, owner) {
        ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2));
      }
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 12
    m4("lamplighter", "Lamplighter", 10, 2, "Now and at round start, +1 purple per minion you get this round (3 / 4 / 5).", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, P, [3, 4, 5][ctx.state.round - 1] || 3);
      }
    }),
    // Relay's slot (Cory cut Relay, 2026-10-14). Member-value sim, handed over at round II: 6.9 followers, 53% win
    // (Normal bots, n=320), so 8+2 (design/eval/purple-members.md). At 4 players round I has no space to spare, so it
    // pays from round II. Fires once per round (owlRound), whether or not the board had room.
    m4("nightowl", "Night Owl", 8, 2, "Each round, after your last minion, take an extra turn: place one more and buy again.", {
      afterAction(ctx, owner, card) {
        if (owner.left !== 0 || card.owlRound === ctx.state.round) return;
        card.owlRound = ctx.state.round;
        extraTurns(ctx, owner, 1, "Night Owl");
      }
    }),
    m4("patience", "Timekeeper", 6, 2, "Game end: +1 follower per 3 purple.", {
      onGameEnd: (ctx, owner) => Math.floor((owner.res[P] || 0) / 3)
    }),
    m4("crew", "Shift Crew", 1, 1, "Worth 2 followers. No effect.", { f: 2, vanilla: true })
  ]
};

// src/engine/v4/content/yellow.js
var m5 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var Y = "yellow";
var colors = (ctx) => ctx.state.resources;
var others2 = (ctx) => colors(ctx).filter((c) => c !== Y);
var setsOf = (ctx, p) => Math.min(...colors(ctx).map((c) => p.res[c] || 0));
var held = (ctx, p) => colors(ctx).filter((c) => (p.res[c] || 0) > 0);
var missing = (ctx, p) => colors(ctx).filter((c) => !(p.res[c] > 0));
var fewest = (ctx, p) => {
  const low = Math.min(...colors(ctx).map((c) => p.res[c] || 0));
  return colors(ctx).filter((c) => (p.res[c] || 0) === low);
};
var total = (ctx, p) => colors(ctx).reduce((a, c) => a + (p.res[c] || 0), 0);
var colorOf = (ctx, card) => {
  const r = ctx.quadrant(ctx.defOf(card).quadrant).resource;
  return ctx.state.resources.includes(r) ? r : null;
};
var eachColor = (ctx, p, n, opts) => {
  for (const c of colors(ctx)) ctx.gain(p, c, n, opts);
};
var yellow_default = {
  id: "yellow",
  name: "Yellow",
  resource: Y,
  scoring: {
    label: "Most full sets",
    // a full set is one of each color; you need at least one to score; yellow breaks ties
    score: (ctx, p) => {
      const s = setsOf(ctx, p);
      return s > 0 ? s * 1e3 + p.res[Y] : 0;
    },
    show: (ctx, p) => ({ count: setsOf(ctx, p), tiebreak: p.res[Y] || 0 }),
    counts: "full sets: how many times you hold one of each color on the table",
    tiebreak: { unit: "yellow", text: "yellow breaks ties" }
  },
  actions: [
    {
      key: "harvest",
      ring: 1,
      name: "Harvest",
      text: "+1 yellow, plus 1 per other color you hold.",
      estimate: (ctx, p) => harvestAmount(ctx, p),
      resolve(ctx, p) {
        ctx.gain(p, Y, harvestAmount(ctx, p), { fromAction: true });
      }
    },
    {
      // the fewest, not "none of" (Claude under Cory's go-with-your-gut, from the dead-window audit): it printed Gardener's
      // text. Raising every lowest color always adds one full set.
      key: "bloom",
      ring: 1,
      name: "Top Up",
      text: "+1 of each color you hold the fewest of (ties: all of them).",
      estimate: (ctx, p) => fewest(ctx, p).length + 0.5,
      resolve(ctx, p) {
        const list = fewest(ctx, p);
        for (const c of list) ctx.gain(p, c, 1, { fromAction: true });
        ctx.log(`${p.name}'s Top Up: +1 ${list.join(", +1 ")}.`);
      }
    },
    {
      key: "transmute",
      ring: 1,
      name: "Trade Seeds",
      text: "Swap up to 3 of your resources for other colors, then +1 yellow.",
      estimate: (ctx, p) => 1 + Math.min(3, Math.max(0, Math.floor(total(ctx, p) / colors(ctx).length) - setsOf(ctx, p))) * 0.8,
      resolve(ctx, p) {
        transmuteStep(ctx, p, { left: Math.min(3, total(ctx, p)), done: 0 });
      }
    },
    {
      key: "prism",
      ring: 2,
      name: "Branch Out",
      text: "+1 of each other color per 3 yellow you have (you keep the yellow).",
      estimate: (ctx, p) => 3 * Math.floor(p.res[Y] / 3),
      resolve(ctx, p) {
        const k = Math.floor(p.res[Y] / 3);
        for (const c of others2(ctx)) ctx.gain(p, c, k, { fromAction: true });
        ctx.log(k ? `${p.name}'s Branch Out: +${k} of each other color.` : `${p.name}'s Branch Out had too little yellow.`);
      }
    },
    {
      key: "gather",
      ring: 2,
      name: "Potluck",
      text: "Each of your members brings you 1 of its color.",
      estimate: (ctx, p) => ctx.memberCount(p),
      resolve(ctx, p) {
        for (const qid of ctx.state.quadrants) {
          const n = ctx.countMembersOfColor(p, qid);
          if (n) ctx.gain(p, ctx.quadrant(qid).resource, n, { fromAction: true });
        }
      }
    },
    {
      key: "flourish",
      ring: 3,
      name: "Bumper Crop",
      text: "+1 of each other color per full set you hold.",
      estimate: (ctx, p) => 3 * setsOf(ctx, p),
      resolve(ctx, p) {
        const k = setsOf(ctx, p);
        for (const c of others2(ctx)) ctx.gain(p, c, k, { fromAction: true });
        ctx.log(k ? `${p.name} flourishes: +${k} of each other color.` : `${p.name} had no full set to flourish.`);
      }
    }
  ],
  handlers: {
    swap(ctx, p, value, data) {
      if (value === "done") {
        finishTransmute(ctx, p, data);
        return;
      }
      const [from, to] = value;
      p.res[from] -= 1;
      p.res[to] += 1;
      const tally = { ...data.tally || {} };
      tally[`${from}>${to}`] = (tally[`${from}>${to}`] || 0) + 1;
      transmuteStep(ctx, p, { left: data.left - 1, done: data.done + 1, tally });
    },
    sow(ctx, p, x, data) {
      if (!x) return;
      const card = ctx.card(data.uid);
      p.res[Y] -= x;
      card.sown = (card.sown || 0) + x;
      ctx.log(`${p.name}'s Sower plants ${x} yellow.`);
    }
  },
  members: [
    m5("gardener", "Gardener", 2, 0, "Now and at round start, +1 of each color you have none of.", {
      now: true,
      onRoundStart(ctx, owner) {
        for (const c of missing(ctx, owner)) ctx.gain(owner, c, 1);
      }
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m5("peddler", "Peddler", 4, 4, "Now and at round start, +1 of each other color.", {
      now: true,
      onRoundStart(ctx, owner) {
        for (const c of others2(ctx)) ctx.gain(owner, c, 1);
      }
    }),
    m5("gleaner", "Gleaner", 6, 4, "Whenever an action gains you 2+ of another color at once, +1 yellow.", {
      afterGain(ctx, owner, card, g) {
        if (g.fromAction && g.color !== Y && g.n >= 2) owner.res[Y] += 1;
      }
    }),
    m5("admirer", "Admirer", 4, 2, "Whenever a rival recruits a member of a color you have none of, +1 of that color.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        const c = colorOf(ctx, recruited);
        if (c && by !== owner && !(owner.res[c] > 0)) ctx.gain(owner, c, 1);
      }
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 4
    m5("gobetween", "Go-Between", 2, 2, "Whenever you recruit a non-yellow member, +1 of its color.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== "yellow" && colorOf(ctx, recruited)) ctx.gain(owner, colorOf(ctx, recruited), 1);
      }
    }),
    m5("dyer", "Dyer", 4, 2, "At round end, +1 yellow per color you hold.", {
      onRoundEnd(ctx, owner) {
        ctx.gain(owner, Y, held(ctx, owner).length);
      }
    }),
    m5("latebloomer", "Late Bloomer", 2, 2, "Now and at round start, if you have the fewest followers (ties count), +1 of each color.", {
      now: true,
      onRoundStart(ctx, owner) {
        const mine2 = ctx.followers(owner);
        if (ctx.rivals(owner).every((o) => ctx.followers(o) >= mine2)) eachColor(ctx, owner, 1);
      }
    }),
    m5("sower", "Sower", 2, 2, "Round start: plant any of your yellow. Round end: gain that many of each other color.", {
      onRoundStartLate(ctx, owner, card) {
        const y = owner.res[Y];
        if (!y) return;
        const amounts = [.../* @__PURE__ */ new Set([0, Math.floor(y / 4), Math.floor(y / 2), Math.floor(3 * y / 4), y])];
        ctx.choose(owner, `Sower: plant how much yellow? (you have ${y})`, amounts.map((x) => ({
          id: `amount:${x}`,
          label: x === 0 ? "None" : x === y ? `All ${x}` : `${x}`,
          kind: "amount",
          value: x,
          hint: x === Math.floor(y / 2) ? 1 : 0
        })), "yellow.sow", { uid: card.uid });
      },
      onRoundEnd(ctx, owner, card) {
        const x = card.sown || 0;
        if (!x) return;
        card.sown = 0;
        for (const c of others2(ctx)) owner.res[c] += x;
        ctx.log(`${owner.name}'s Sower harvests +${x} of each other color.`);
      },
      // leaving mid-round (released, stolen, swapped): the planted yellow comes back, unharvested (as Investor's gold does)
      onLeave(ctx, owner, card) {
        const x = card.sown || 0;
        if (x) {
          owner.res[Y] += x;
          card.sown = 0;
          ctx.log(`${owner.name}'s Sower leaves: ${x} planted yellow comes back.`);
        }
      }
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 4 (the most one pass moves)
    m5("harmonist", "Harmonist", 4, 0, "Game end: +1 follower per full set you hold.", {
      onGameEnd: (ctx, owner) => setsOf(ctx, owner)
    }),
    m5("rainmaker", "Rainmaker", 4, 2, "Once per game: raise each of your colors to match your yellow.", {
      activate: "game",
      onActivate(ctx, owner) {
        const top2 = owner.res[Y];
        let got = 0;
        for (const c of others2(ctx)) {
          const d = Math.max(0, top2 - owner.res[c]);
          got += d;
          ctx.gain(owner, c, d);
        }
        ctx.log(`${owner.name} used Rainmaker: every color up to ${top2} (+${got}).`);
      },
      // bots: a big catch-up in round III, or anything at all on their last buy of the game (they left it unused
      // in 4 of 6 holdings, dead-window audit 2026-10-14)
      botActivate: (ctx, owner) => {
        const gain2 = others2(ctx).reduce((s, c) => s + Math.max(0, owner.res[Y] - owner.res[c]), 0);
        const last = ctx.state.round === 3 && owner.left === 0;
        return ctx.state.round === 3 && gain2 >= 6 || last && gain2 > 0;
      }
    }),
    m5("pilgrim", "Pilgrim", 2, 2, "When recruited: +1 of each color.", {
      onRecruited(ctx, owner) {
        eachColor(ctx, owner, 1);
      }
    }),
    m5("farmer", "Farmer", 4, 2, "Whenever an action gains you yellow, +1 more.", {
      afterGain(ctx, owner, card, g) {
        if (g.fromAction && g.color === Y && g.n > 0) owner.res[Y] += 1;
      }
    }),
    m5("weaver", "Weaver", 4, 2, "Whenever you buy 6 or more followers, +1 of each color.", {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 6) eachColor(ctx, owner, 1);
      }
    }),
    m5("explorer", "Explorer", 4, 4, "Whenever you take a space outside Yellow, +1 yellow.", {
      afterAction(ctx, owner, card, qid) {
        if (qid !== "yellow") ctx.gain(owner, Y, 1);
      }
    }),
    m5("feastmaker", "Feastmaker", 6, 4, "Once per game: +1 of each color per round number.", {
      activate: "game",
      onActivate(ctx, owner) {
        const r = ctx.state.round;
        eachColor(ctx, owner, r);
        ctx.log(`${owner.name} used Feastmaker: +${r} of each color.`);
      },
      botActivate: (ctx) => ctx.state.round === 3
    })
  ]
};
function harvestAmount(ctx, p) {
  return 1 + others2(ctx).filter((c) => p.res[c] > 0).length;
}
function transmuteStep(ctx, p, data) {
  const cs = colors(ctx);
  const opts = [];
  if (data.left > 0) {
    for (const a of cs) if (p.res[a] > 0) {
      for (const b of cs) if (b !== a) {
        opts.push({
          id: `swap:${a}:${b}`,
          label: `1 ${a} \u2192 1 ${b}`,
          kind: "swap",
          value: [a, b],
          // bots even out their colors: a swap helps when it moves from a pile 2+ bigger
          hint: p.res[a] - p.res[b] - 1
        });
      }
    }
  }
  if (!opts.length) {
    finishTransmute(ctx, p, data);
    return;
  }
  opts.push({ id: "done", label: data.done ? "Done" : "Swap nothing", kind: "done", value: "done", hint: 0.5 });
  ctx.choose(p, `Trade Seeds: swap one for one, or stop (${data.done} swapped so far)`, opts, "yellow.swap", data);
}
function finishTransmute(ctx, p, data) {
  ctx.gain(p, Y, 1, { fromAction: true });
  const what = Object.entries(data.tally || {}).map(([k, n]) => `${n} ${k.replace(">", " \u2192 ")}`).join(", ");
  ctx.log(data.done ? `${p.name} transmuted ${what}.` : `${p.name} swapped nothing.`);
}

// src/engine/v4/content/market.js
var m6 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var B = "blue";
var Q = "market";
var isBlue = (def) => def.quadrant === Q;
var priceOf = (c) => c.def.s + c.def.w;
var totalRes = (p) => Object.values(p.res).reduce((a, b) => a + b, 0);
var colorOf2 = (ctx, c) => {
  const r = ctx.quadrant(c.def.quadrant).resource;
  return ctx.state.resources.includes(r) ? r : null;
};
var botWorth = (c) => c.def.f * 1.4 + (c.def.vanilla ? 0 : 1.6) + priceOf(c) * 0.3;
var LEAN = false;
var SNAP = { anyColors: true };
var HALF = { anyColors: true, half: true };
var howFor = (why) => why === "Half Price" ? HALF : why === "Snap Up" ? SNAP : {};
var payLabel = (v) => Object.entries(v).filter(([, n]) => n).map(([c, n]) => `${n} ${c}`).join(", ") || "nothing";
function buyAt(ctx, p, uid, how, why) {
  const card = ctx.card(uid);
  const list = ctx.payChoices(p, uid, how);
  if (!list.length) return;
  const data = { uid, why, how };
  if (list.length === 1) {
    payAndRecruit(ctx, p, list[0], data);
    return;
  }
  ctx.choose(p, `${why}: how do you pay ${ctx.price(p, uid, how).total} for ${card.def.name}?`, list.map((v, i) => ({
    id: `pay:${ctx.state.resources.map((r) => v[r] || 0).join("-")}`,
    label: payLabel(v),
    kind: "pay",
    value: v,
    hint: i === 0 ? 1 : 0
  })), `${Q}.pay`, data);
}
function payAndRecruit(ctx, p, v, { uid, why, fromPile, how = howFor(why) }) {
  const card = ctx.card(uid);
  const pile = ctx.state.pile;
  if (fromPile && pile.includes(uid)) {
    pile.splice(pile.indexOf(uid), 1);
    ctx.state.shop.push(uid);
  }
  if (!ctx.state.shop.includes(uid)) {
    ctx.log(`${why}: ${card.def.name} is gone.`);
    return;
  }
  ctx.log(fromPile ? `${p.name}'s ${why}: pays ${payLabel(v)} for ${card.def.name}.` : `${why}: ${p.name} pays ${payLabel(v)} for ${card.def.name}.`);
  if ((why === "Half Price" || LEAN && why === "Snap Up") && !fromPile) {
    const q2 = ctx.state.queue, k = q2.findIndex((t) => t.t === "buy" && !t.extra && t.p === p.id);
    if (k >= 0) {
      q2.splice(k, 1);
      p.turnBuys = (p.turnBuys || 0) + 1;
    }
  }
  ctx.recruit(p, uid, { spend: v, how, paid: true });
}
function offerRow(ctx, p, how, why) {
  const opts = ctx.shopCards().map((c) => [c, ctx.price(p, c.uid, how)]).filter(([, pr]) => pr.afford).map(([c, pr]) => ({
    id: `card:${c.uid}`,
    label: `${c.def.name} \xB7 pay ${pr.total}`,
    kind: "card",
    value: c.uid,
    hint: botWorth(c) + (priceOf(c) - pr.total) * 0.5
  }));
  if (!opts.length) {
    ctx.log(`${why}: ${p.name} can't pay for anything.`);
    return;
  }
  opts.push({ id: "none", label: "Recruit nothing", kind: "pass", value: null, hint: -1 });
  ctx.choose(p, `${why}: recruit which member?`, opts, `${Q}.pickRow`, { why });
}
function bestRowValue(ctx, p, how) {
  const ok = ctx.shopCards().map((c) => [c, ctx.price(p, c.uid, how)]).filter(([, pr]) => pr.afford);
  return ok.length ? Math.max(...ok.map(([c, pr]) => botWorth(c) + (priceOf(c) - pr.total) * 0.6)) : 0;
}
function sweepRow(ctx) {
  const old = [...ctx.state.shop];
  for (const u of old) ctx.buryFromShop(u);
}
function extraBuys(ctx, p, k) {
  for (let i = 0; i < k; i++) ctx.state.queue.unshift({ t: "buy", p: p.id });
}
var market = {
  id: Q,
  name: "Blue",
  resource: B,
  scoring: { label: "Most blue", counts: "the blue you hold when the round ends", score: (ctx, p) => p.res[B] || 0 },
  actions: [
    {
      key: "bargain",
      ring: 1,
      name: "Snap Up",
      text: "+2 blue, then you may recruit a face-up member now, in any colors.",
      estimate: (ctx, p) => 2 + bestRowValue(ctx, p, SNAP) * 0.3,
      resolve(ctx, p) {
        ctx.gain(p, B, 2, { fromAction: true });
        offerRow(ctx, p, SNAP, "Snap Up");
      }
    },
    {
      key: "restock",
      ring: 1,
      name: "New Faces",
      text: "+2 blue, and sweep the face-up row: a fresh row of members comes out.",
      estimate: () => 2.4,
      resolve(ctx, p) {
        ctx.gain(p, B, 2, { fromAction: true });
        sweepRow(ctx);
        ctx.log(`${p.name} restocked the row.`);
      }
    },
    {
      // was +1 blue per face-up member costing 8 or more (3.1 face up on average, Normal bots); now 1 + 2.3 blue face up
      key: "showroom",
      ring: 1,
      name: "Name Drop",
      text: "+1 blue, and +1 per blue face-up member.",
      estimate: (ctx) => 1 + showroomCount(ctx),
      resolve(ctx, p) {
        ctx.gain(p, B, 1 + showroomCount(ctx), { fromAction: true });
      }
    },
    {
      key: "clearance",
      ring: 2,
      name: "Half Price",
      text: "As your buy this turn: a face-up member for half its cost (rounded down), in any colors.",
      estimate: (ctx, p) => bestRowValue(ctx, p, HALF),
      resolve(ctx, p) {
        offerRow(ctx, p, HALF, "Half Price");
      }
    },
    {
      key: "pricecheck",
      ring: 2,
      name: "Show Off",
      text: "Gain blue equal to half the cost of your priciest member.",
      estimate: (ctx, p) => Math.floor(priciest(ctx, p) / 2),
      resolve(ctx, p) {
        const k = Math.floor(priciest(ctx, p) / 2);
        if (!k) ctx.log(`Show Off: ${p.name} has no member costing 2 or more, so gains nothing.`);
        ctx.gain(p, B, k, { fromAction: true });
      }
    },
    {
      key: "spree",
      ring: 3,
      name: "Spree",
      text: "This turn you buy 3 times.",
      estimate: (ctx, p) => Math.min(10, Math.max(0, totalRes(p) - 3)) * 0.8,
      resolve(ctx, p) {
        extraBuys(ctx, p, 2);
        ctx.log(`${p.name} goes on a spree: 3 buys this turn.`);
      }
    }
  ],
  handlers: {
    pickRow(ctx, p, uid, data) {
      if (uid === null) {
        ctx.log(`${data.why}: ${p.name} recruits nothing.`);
        return;
      }
      buyAt(ctx, p, uid, howFor(data.why), data.why);
    },
    pay(ctx, p, v, data) {
      payAndRecruit(ctx, p, v, data);
    },
    blackMarket(ctx, p, uid) {
      if (uid === null) return;
      const c = ctx.card(uid);
      const list = scoutChoices(ctx, p, uid);
      if (!list.length) return;
      const data = { uid, why: "Talent Scout", fromPile: true, how: {} };
      if (list.length === 1) {
        payAndRecruit(ctx, p, list[0], data);
        return;
      }
      ctx.choose(p, `Talent Scout: how do you pay for ${c.def.name}?`, list.map((v, i) => ({
        id: `pay:${ctx.state.resources.map((r) => v[r] || 0).join("-")}`,
        label: payLabel(v),
        kind: "pay",
        value: v,
        hint: i === 0 ? 1 : 0
      })), `${Q}.pay`, data);
    },
    climb(ctx, p, color) {
      ctx.gain(p, color, 2);
      ctx.log(`${p.name}'s Social Climber: +2 ${color}.`);
    }
  },
  members: [
    m6("stylist", "Stylist", 2, 2, "Whenever anyone recruits a blue member, +1 blue.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (rec2.uid !== card.uid && isBlue(ctx.defOf(rec2))) ctx.gain(owner, B, 1);
      }
    }),
    // Onlooker, Connoisseur, Curator, Auctioneer, Sommelier, Patroness and Snob counted members costing 8 or more until
    // Cory cut that cutoff (2026-10-15); they count blue members now, which come about as often (Normal bots, Blue
    // tables: 23% of recruits are blue, 27% cost 8+). Onlooker pays 2, or Stylist (anyone, +1, for 4) would beat it.
    m6("onlooker", "Onlooker", 6, 4, "Whenever a rival recruits a blue member, +2 blue.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by !== owner && isBlue(ctx.defOf(rec2))) ctx.gain(owner, B, 2);
      }
    }),
    m6("connoisseur", "Connoisseur", 2, 2, "Whenever you recruit a blue member, +2 blue.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by === owner && rec2.uid !== card.uid && isBlue(ctx.defOf(rec2))) ctx.gain(owner, B, 2);
      }
    }),
    m6("reseller", "Reseller", 8, 4, "Whenever you recruit, +1 of that member\u2019s color.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by === owner && rec2.uid !== card.uid && colorOf2(ctx, rec2)) ctx.gain(owner, colorOf2(ctx, rec2), 1);
      }
    }),
    m6("curator", "Curator", 2, 2, "Now and at round start, +1 blue per other blue member you have.", {
      now: true,
      onRoundStart(ctx, owner, card) {
        ctx.gain(owner, B, ctx.countMembersOfColor(owner, Q) - (card && isBlue(card.def) ? 1 : 0));
      }
    }),
    m6("planner", "Planner", 2, 2, "Now and at round start, your next member costs 2 less per round number.", {
      now: true,
      onRoundStart(ctx, owner) {
        owner.discount += 2 * ctx.state.round;
      }
    }),
    m6("underbidder", "Underbidder", 2, 0, "Now and at round start, your next member costs 2 less per rival with more members than you.", {
      now: true,
      onRoundStart(ctx, owner) {
        owner.discount += 2 * rivalsBigger(ctx, owner);
      }
    }),
    m6("minimalist", "Minimalist", 2, 0, "Now and at round start, +1 blue per rival with more members than you.", {
      now: true,
      onRoundStart(ctx, owner) {
        const k = rivalsBigger(ctx, owner);
        if (k) ctx.gain(owner, B, k);
      }
    }),
    // replaced (Claude under Cory's go-with-your-gut, from the dead-window audit): the old round-start trade-in never fired
    // in bot play, and the base Release rule does its job better. Releasing the Climber itself gives nothing extra.
    m6("climber", "Social Climber", 2, 0, "Whenever you release another member, +2 of any color you choose.", {
      onRelease(ctx, owner) {
        ctx.choose(owner, "Social Climber: +2 of which color?", ctx.state.resources.map((c) => ({
          // bots take the color they hold least of
          id: `color:${c}`,
          label: `+2 ${c}`,
          kind: "color",
          value: c,
          hint: -(owner.res[c] || 0)
        })), `${Q}.climb`);
      }
    }),
    m6("auctioneer", "Auctioneer", 4, 2, "Whenever a rival recruits a non-blue member, +1 blue.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by !== owner && !isBlue(ctx.defOf(rec2))) ctx.gain(owner, B, 1);
      }
    }),
    m6("sommelier", "Sommelier", 2, 2, "Whenever you recruit a blue member, your next member costs 2 less.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by === owner && rec2.uid !== card.uid && isBlue(ctx.defOf(rec2))) owner.discount += 2;
      }
    }),
    m6("patroness", "Patroness", 4, 4, "Whenever you recruit a blue member, +1 follower.", {
      onAnyRecruit(ctx, owner, card, by, rec2) {
        if (by === owner && rec2.uid !== card.uid && isBlue(ctx.defOf(rec2))) owner.bonus += 1;
      }
    }),
    m6("blackmarket", "Talent Scout", 2, 2, "Once per game, on your turn: also look at the top 5 of the pile and recruit one at its cost.", {
      activate: "game",
      onActivate(ctx, owner) {
        const opts = ctx.state.pile.slice(0, 5).map((u) => ctx.card(u)).filter((c) => scoutChoices(ctx, owner, c.uid).length).map((c) => ({ id: `card:${c.uid}`, label: `${c.def.name} (${priceOf(c)})`, kind: "card", value: c.uid, hint: botWorth(c) }));
        if (!opts.length) {
          ctx.log(`${owner.name}'s Talent Scout has nothing affordable.`);
          return;
        }
        opts.push({ id: "none", label: "Recruit nothing", kind: "pass", value: null, hint: -1 });
        ctx.choose(owner, "Talent Scout: recruit which of the top 5?", opts, `${Q}.blackMarket`);
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && totalRes(owner) >= 8
    }),
    m6("snob", "Snob", 6, 4, "Game end: +1 follower per blue member you have.", {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, Q)
    }),
    m6("recluse", "Recluse", 2, 2, "Game end: +2 followers per rival with more members than you.", {
      onGameEnd: (ctx, owner) => 2 * rivalsBigger(ctx, owner)
    })
  ]
};
var installed = false;
function install() {
  if (installed) return market;
  registerQuadrant(market);
  installed = true;
  return market;
}
var scoutChoices = (ctx, p, uid) => ctx.payChoices(p, uid, {});
function rivalsBigger(ctx, p) {
  const mine2 = ctx.memberCount(p);
  return ctx.rivals(p).filter((o) => ctx.memberCount(o) > mine2).length;
}
function showroomCount(ctx) {
  return ctx.shopCards().filter((c) => isBlue(c.def)).length;
}
function priciest(ctx, p) {
  return Math.max(0, ...ctx.membersOf(p).map(priceOf));
}

// src/engine/v4/content/thieves.js
var m7 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var cost2 = (c) => c.def.s + c.def.w;
var total2 = (p) => Object.values(p.res).reduce((a, b) => a + b, 0);
var holding = (p) => total2(p);
var SCORING = { members: { label: "Most Magenta members", counts: "the magenta members you hold right now (stolen ones count)", score: (ctx, p) => ctx.countMembersOfColor(p, "thieves") } };
var fewestFollowers = (ctx, p) => ctx.state.players.every((o) => ctx.followers(o) >= ctx.followers(p));
var isLeader = (ctx, p) => ctx.state.players.every((o) => ctx.followers(o) <= ctx.followers(p));
function ledBefore(ctx, { thief, victim, uid }) {
  if (uid === void 0) return isLeader(ctx, victim);
  const c = ctx.card(uid), f = c.copy ? Math.max(c.def.f, defById(c.copy).f) : c.def.f;
  const before = (o) => ctx.followers(o) + (o === victim ? f : o === thief ? -f : 0);
  return ctx.state.players.every((o) => before(o) <= before(victim));
}
var rankOf = (ctx, p) => ctx.state.players.filter((o) => ctx.followers(o) > ctx.followers(p)).length;
function piles(ctx, thief, o, picked = {}) {
  if (!ctx.canSteal(thief, o)) return [];
  const out = [];
  for (const c of Object.keys(o.res)) {
    const n = o.res[c] - (picked[c] || 0);
    if (n > 0) out.push([c, n]);
  }
  return out;
}
var stealable = (ctx, thief, o, picked) => piles(ctx, thief, o, picked).reduce((s, [, n]) => s + n, 0);
var stash = (ctx, p, n, fromAction = true) => {
  if (n) ctx.gain(p, "magenta", n, { fromAction });
};
function commit(ctx, thief, victim, pick, reaction = false, fromAction = true) {
  if (!ctx.canSteal(thief, victim)) return 0;
  return ctx.steal(thief, victim, { take: pick, reaction, give: (n) => stash(ctx, thief, n, fromAction) });
}
function autoSteal(ctx, thief, victim, why, n = 1, reaction = false) {
  if (!victim || victim === thief) return 0;
  const pick = {};
  for (let k = 0; k < n; k++) {
    const top2 = piles(ctx, thief, victim, pick).sort((a, b) => b[1] - a[1])[0];
    if (!top2) break;
    pick[top2[0]] = (pick[top2[0]] || 0) + 1;
  }
  const got = commit(ctx, thief, victim, pick, reaction, false);
  if (got) ctx.log(`${thief.name}'s ${why}: took ${got} from ${victim.name}.`);
  return got;
}
function stealStep2(ctx, p, data) {
  const picked = (id) => data.picked[id] || {};
  const can = (o) => stealable(ctx, p, o, picked(o.id)) > 0;
  const owed = data.each.map((id) => ctx.player(id)).filter(can);
  const free = data.left - owed.length > 0 ? ctx.rivals(p).filter((o) => can(o) && (!data.only || data.only.includes(o.id))) : [];
  const pool = data.left > 0 ? owed.length && data.left <= owed.length ? owed : [.../* @__PURE__ */ new Set([...owed, ...free])] : [];
  if (pool.length) {
    const opts = [];
    for (const o of pool) for (const [c, n] of piles(ctx, p, o, picked(o.id))) opts.push({
      id: `take:${o.id}:${c}`,
      label: `${o.name}'s ${c} (${n})`,
      kind: "take",
      value: [o.id, c],
      hint: n + 0.05 * ctx.followers(o) + (owed.includes(o) ? 5 : 0)
    });
    const owing = owed.length ? `, at least 1 from ${owed.map((o) => o.name).join(", ")}` : "";
    const taken = Object.values(data.picked).reduce((t, pk) => t + Object.values(pk).reduce((a, b) => a + b, 0), 0);
    ctx.choose(p, `${data.name}: take 1 resource (${data.left} left${owing})`, opts, "thieves.take", data, { count: { of: data.left + taken, left: data.left } });
    return;
  }
  let got = 0;
  const from = [];
  for (const [id, pick] of Object.entries(data.picked)) {
    const v = ctx.player(Number(id)), x = commit(ctx, p, v, pick);
    if (x) {
      got += x;
      from.push(`${x} from ${v.name}`);
    }
  }
  ctx.log(got ? `${p.name} stole ${got} (${from.join(", ")}).` : `${p.name} found nothing to steal.`);
}
var startSteal = (ctx, p, name, n, extra = {}) => stealStep2(ctx, p, { name, left: n, each: [], picked: {}, ...extra });
var estimateSteal = (ctx, p, n, who = ctx.rivals(p)) => Math.min(n, who.reduce((s, o) => s + stealable(ctx, p, o), 0)) * 1.33;
function takeable(ctx, p, maxCost = Infinity) {
  const out = [];
  for (const o of ctx.rivals(p)) {
    if (!ctx.canSteal(p, o, "member")) continue;
    for (const c of ctx.membersOf(o)) if (cost2(c) <= maxCost) out.push([o, c]);
  }
  return out;
}
var memberHint = (c) => c.def.f * 1.5 + cost2(c) + (c.def.vanilla || c.used ? 0 : 1);
function pickMember(ctx, p, list, prompt, handler, data = null) {
  ctx.choose(p, prompt, list.map(([o, c]) => ({
    id: `card:${c.uid}`,
    label: `${o.name}'s ${c.def.name} (${cost2(c)})`,
    kind: "member",
    value: c.uid,
    hint: memberHint(c)
  })), handler, data);
}
var richer = (ctx, p) => ctx.rivals(p).filter((o) => holding(o) > holding(p));
function richest(ctx, p) {
  const list = ctx.rivals(p).filter((o) => stealable(ctx, p, o) > 0);
  if (!list.length) return null;
  return list.reduce((a, b) => holding(b) > holding(a) ? b : a);
}
var thieves = {
  id: "thieves",
  name: "Magenta",
  resource: "magenta",
  rule: "Whatever you steal turns magenta in your supply, ready to spend. Most Magenta members at round end wins.",
  scoring: SCORING.members,
  // quadrant-level hooks (engine): Lie Low refuses resource steals (not members: Cory, 2026-10-14); thefts are recorded
  guardSteal: (ctx, thief, victim, kind = "res") => kind === "res" && victim.hideout === ctx.state.round,
  onSteal(ctx, info) {
    const s = ctx.state;
    s.thefts = s.thefts || [];
    s.thefts.push({
      r: s.round,
      m: s.moves,
      by: info.thief.id,
      from: info.victim.id,
      kind: info.uid !== void 0 ? "member" : "res",
      n: info.n,
      rank: rankOf(ctx, info.victim),
      last: fewestFollowers(ctx, info.victim) && !isLeader(ctx, info.victim),
      lead: isLeader(ctx, info.victim)
    });
  },
  actions: [
    {
      key: "pickpocket",
      ring: 1,
      name: "Help Yourself",
      text: "Take 2 / 3 / 4 resources (by round) from rivals, split as you like (they arrive as magenta).",
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, ctx.state.round + 1)),
      resolve(ctx, p) {
        startSteal(ctx, p, "Help Yourself", ctx.stealCount(p, ctx.state.round + 1, { say: true }));
      }
    },
    {
      key: "tipoff",
      ring: 1,
      name: "Redistribute",
      text: "Take 1 resource from each rival holding more resources than you (they arrive as magenta).",
      estimate: (ctx, p) => estimateSteal(ctx, p, richer(ctx, p).length, richer(ctx, p)),
      resolve(ctx, p) {
        const ids = richer(ctx, p).map((o) => o.id);
        const n = ctx.stealCount(p, ids.length, { say: true });
        startSteal(ctx, p, "Redistribute", n, { each: ids, only: ids });
      }
    },
    {
      key: "hideout",
      ring: 1,
      name: "Lie Low",
      text: "Take 1 resource from a rival (it arrives as magenta). Then no one can steal resources from you this round.",
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 1)) + 0.8 + 0.6 * ctx.state.round,
      resolve(ctx, p) {
        p.hideout = ctx.state.round;
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
        startSteal(ctx, p, "Lie Low", ctx.stealCount(p, 1, { say: true }));
      }
    },
    {
      key: "rob",
      ring: 2,
      name: "Crime Wave",
      text: "Take 3 resources from rivals, at least 1 from each (they arrive as magenta).",
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 3)),
      resolve(ctx, p) {
        startSteal(ctx, p, "Crime Wave", ctx.stealCount(p, 3, { say: true }), { each: ctx.rivals(p).map((o) => o.id) });
      }
    },
    {
      // Cory, 2026-10-15 (balance pass 1, #3): costing 4 or less, was 6 (both bots read it at 10–12u in round II)
      key: "ransom",
      ring: 2,
      name: "Shake Down",
      text: "Pick a rival\u2019s member costing 4 or less. They pay you its cost to keep it (the payment arrives as magenta), or it\u2019s yours.",
      estimate: (ctx, p) => {
        const l = takeable(ctx, p, 4).filter(([, c]) => cost2(c) > 0);
        return l.length ? Math.max(...l.map(([, c]) => cost2(c) * 1.33 + 0.5)) : 0;
      },
      resolve(ctx, p) {
        const list = takeable(ctx, p, 4).filter(([, c]) => cost2(c) > 0);
        if (!list.length) {
          ctx.log(`${p.name} found no one to hold to ransom.`);
          return;
        }
        ctx.choose(p, "Shake Down: which member?", list.map(([o, c]) => ({
          id: `card:${c.uid}`,
          label: `${o.name}'s ${c.def.name} (${cost2(c)})`,
          kind: "member",
          value: c.uid,
          hint: memberHint(c) + (total2(o) < cost2(c) ? 2 : 0)
        })), "thieves.ransomPick");
      }
    },
    {
      key: "heist",
      ring: 3,
      name: "Poach",
      text: "Take any rival\u2019s member. They recruit any face-up member costing up to the same, free.",
      estimate: (ctx, p) => {
        const l = takeable(ctx, p);
        return l.length ? Math.max(...l.map(([, c]) => memberHint(c))) : 0;
      },
      resolve(ctx, p) {
        const list = takeable(ctx, p);
        if (!list.length) {
          ctx.log(`${p.name} found nothing worth a heist.`);
          return;
        }
        pickMember(ctx, p, list, "Poach: take which member?", "thieves.heist");
      }
    }
  ],
  handlers: {
    take(ctx, p, [vid, pile], data) {
      const mine2 = { ...data.picked[vid] || {} };
      mine2[pile] = (mine2[pile] || 0) + 1;
      stealStep2(ctx, p, { ...data, left: data.left - 1, each: data.each.filter((id) => id !== vid), picked: { ...data.picked, [vid]: mine2 } });
    },
    ransomPick(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost2(c);
      const opts = [{ id: "let", label: `Let ${c.def.name} go`, kind: "ransom", value: "let", hint: 0 }];
      if (total2(v) >= n) opts.unshift({
        id: "pay",
        label: `Pay ${p.name} ${n} to keep ${c.def.name}`,
        kind: "ransom",
        value: "pay",
        hint: c.def.f * 2 + (c.def.vanilla || c.used ? 0 : 2) - n + 0.5
      });
      ctx.choose(v, `${p.name} holds your ${c.def.name} to ransom: pay ${n} to keep it?`, opts, "thieves.ransomAnswer", { uid, thief: p.id });
    },
    ransomAnswer(ctx, v, answer, data) {
      const p = ctx.player(data.thief), c = ctx.card(data.uid), n = cost2(c);
      if (answer === "pay") {
        const take = {}, left = { ...v.res };
        for (let k = 0; k < n; k++) {
          const col = Object.keys(left).filter((x) => left[x] > 0).sort((a, b) => left[b] - left[a])[0];
          left[col] -= 1;
          take[col] = (take[col] || 0) + 1;
        }
        let got = ctx.steal(p, v, { take, give: (x) => stash(ctx, p, x) });
        if (!got && !ctx.canSteal(p, v)) {
          for (const [col, x] of Object.entries(take)) v.res[col] -= x;
          got = n;
          stash(ctx, p, n);
        }
        ctx.log(`${v.name} paid ${got} (${Object.entries(take).map(([k, x]) => `${x} ${k}`).join(", ")}) to keep ${c.def.name}.`);
      } else {
        ctx.steal(p, v, { uid: data.uid });
        ctx.log(`${v.name} let ${c.def.name} go to ${p.name}.`);
      }
    },
    heist(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost2(c);
      ctx.steal(p, v, { uid });
      ctx.log(`${p.name} pulled a heist: ${v.name}'s ${c.def.name}.`);
      const shop = ctx.shopCards().filter((x) => cost2(x) <= n);
      if (!shop.length) {
        ctx.log(`${v.name} finds no face-up member costing ${n} or less.`);
        return;
      }
      ctx.choose(v, `Poach: recruit any face-up member costing up to ${n}, free`, shop.map((x) => ({
        id: `card:${x.uid}`,
        label: `${x.def.name} (${cost2(x)})`,
        kind: "card",
        value: x.uid,
        hint: x.def.f * 1.5 + cost2(x) + (x.def.vanilla ? 0 : 1)
      })), "thieves.recruitFree");
    },
    recruitFree(ctx, p, uid) {
      if (ctx.state.shop.includes(uid)) ctx.recruit(p, uid, { free: true });
    },
    doubleAgent(ctx, p, uid, data) {
      const v = ctx.ownerOf(uid);
      if (!ctx.steal(p, v, { uid })) return;
      ctx.moveMember(data.uid, p, v);
      ctx.log(`${p.name}'s Double Agent swaps sides: ${p.name} gets ${v.name}'s ${ctx.card(uid).def.name}.`);
    }
  },
  members: [
    m7("cutpurse", "Cutpurse", 2, 2, "Now and at round start, take 1 resource from the rival holding the most resources (it arrives as magenta).", {
      now: true,
      onRoundStart(ctx, owner) {
        const t = richest(ctx, owner);
        if (t) autoSteal(ctx, owner, t, "Cutpurse");
      }
    }),
    m7("mole", "Mole", 2, 2, "Now and at round start, take 1 resource from each player with more followers than you (they arrive as magenta).", {
      now: true,
      onRoundStart(ctx, owner) {
        for (const o of ctx.rivals(owner)) if (ctx.followers(o) > ctx.followers(owner)) autoSteal(ctx, owner, o, "Mole");
      }
    }),
    m7("accomplice", "Accomplice", 4, 4, "When recruited: take 1 resource from each rival (they arrive as magenta).", {
      onRecruited(ctx, owner) {
        for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, "Accomplice");
      }
    }),
    m7("grifter", "Grifter", 4, 2, "When recruited: take 1 resource per 2 members you have, from the rivals holding the most resources (they arrive as magenta).", {
      onRecruited(ctx, owner) {
        const n = Math.floor(ctx.memberCount(owner) / 2);
        for (let k = 0; k < n; k++) {
          const t = richest(ctx, owner);
          if (!t || !autoSteal(ctx, owner, t, "Grifter")) break;
        }
      }
    }),
    m7("sticky", "Sticky Fingers", 4, 4, "Your steals take 1 more resource.", { stealMore: 1 }),
    m7("desperado", "Desperado", 2, 2, "While no one has fewer followers than you, your steals take double.", {
      stealDouble: (ctx, owner) => fewestFollowers(ctx, owner)
    }),
    m7("robinhood", "Robin Hood", 2, 2, "Whenever you steal from the player with the most followers, +1 follower.", {
      onSteal(ctx, owner, card, info) {
        if (info.thief === owner && ledBefore(ctx, info)) {
          owner.bonus += 1;
          ctx.log(`${owner.name}'s Robin Hood: +1 follower.`);
        }
      }
    }),
    m7("lookout", "Lookout", 4, 2, "Once per round, when a rival steals from someone else, take 1 resource from the thief (it arrives as magenta).", {
      onSteal(ctx, owner, card, info) {
        if (info.reaction || info.thief === owner || info.victim === owner || card.round === ctx.state.round) return;
        if (autoSteal(ctx, owner, info.thief, "Lookout", 1, true)) card.round = ctx.state.round;
      }
    }),
    m7("lightfingers", "Light Fingers", 4, 4, "Whenever a rival recruits a member costing 8 or more, take 1 resource from them (it arrives as magenta).", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner && cost2(recruited) >= 8) autoSteal(ctx, owner, by, "Light Fingers");
      }
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 10
    m7("extortionist", "Extortionist", 8, 2, "Whenever a rival buys 6 or more followers, take 2 resources from them (they arrive as magenta).", {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer !== owner && tier && tier.get >= 6) autoSteal(ctx, owner, buyer, "Extortionist", 2);
      }
    }),
    m7("watchdog", "Bodyguard", 4, 2, "Rivals can\u2019t take your members.", {
      guardSteal: (ctx, owner, card, thief, kind) => kind === "member"
    }),
    m7("crew", "Crew", 1, 1, "Worth 2 followers.", { f: 2 }),
    m7("doubleagent", "Double Agent", 4, 2, "When recruited: swap it for any rival\u2019s member.", {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (list.length) pickMember(ctx, owner, list, "Double Agent: swap for which member?", "thieves.doubleAgent", { uid: card.uid });
      }
    }),
    m7("bigscore", "Safecracker", 2, 2, "Once per game: take half (rounded down) of the magenta held by the rival with the most magenta.", {
      activate: "game",
      onActivate(ctx, owner) {
        const list = ctx.rivals(owner).filter((o2) => ctx.canSteal(owner, o2) && (o2.res.magenta || 0) >= 2);
        if (!list.length) {
          ctx.log(`${owner.name}'s Safecracker found no magenta worth taking.`);
          return;
        }
        const o = list.reduce((a, b) => b.res.magenta > a.res.magenta ? b : a);
        const got = commit(ctx, owner, o, { magenta: Math.floor(o.res.magenta / 2) }, false, false);
        ctx.log(`${owner.name}'s Safecracker: ${got} magenta from ${o.name}.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some((o) => ctx.canSteal(owner, o) && (o.res.magenta || 0) >= 4)
    }),
    m7("kingpin", "Kingpin", 2, 0, "Game end: +1 follower per 2 magenta.", {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.magenta || 0) / 2)
    })
  ]
};
var installed2 = false;
function install2() {
  if (!installed2) {
    registerQuadrant(thieves);
    installed2 = true;
  }
  return thieves;
}

// src/engine/v4/content/trading.js
var W = "white";
var m8 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var sellable = (p) => p.bonus;
var ahead = (ctx, p) => ctx.rivals(p).filter((o) => ctx.followers(o) > ctx.followers(p)).length;
var fv = (ctx) => [1.6, 1.3, 1.2][ctx.state.round - 1] ?? 1.2;
var lastTurn = (ctx, p) => ctx.state.round === 3 && p.left === 0;
var SELL_HIGH = { most: 2, each: 3 };
var PAWN = { each: 2 };
var BUY_LOW = { per: 2 };
var LIQUIDATE = { most: 5, each: 2 };
var BOOM = { per: 1 };
var BOTS = { sell: true };
function sell(ctx, p, k, each, { fromAction = false, why = "sold", by = null } = {}) {
  k = Math.min(k, sellable(p));
  if (!(k > 0)) return 0;
  p.bonus -= k;
  ctx.gain(p, W, k * each, { fromAction });
  ctx.log(`${p.name}${by ? `'s ${by}:` : ""} ${why} ${k} follower${k > 1 ? "s" : ""} for ${k * each} white.`);
  for (const c of ctx.membersOf(p)) {
    for (const d of [c.def, c.copy ? defById(c.copy) : null]) if (d?.onSell) ctx.asMember(p, d.name, () => d.onSell(ctx, p, c, k));
  }
  return k;
}
var NOTHING_TO_SELL = "no loose followers to sell (only followers you bought or won can be sold)";
function sellChoice(ctx, p, prompt, most, each, why) {
  const max = Math.min(most, sellable(p));
  if (max <= 0) {
    ctx.log(`${prompt.split(":")[0]}: ${p.name} has ${NOTHING_TO_SELL}.`);
    return;
  }
  const v = fv(ctx), late = lastTurn(ctx, p);
  const opts = [];
  for (let k = 0; k <= max; k++) {
    opts.push({
      id: `amount:${k}`,
      label: k === 0 ? "Sell none" : `Sell ${k} for ${k * each} white`,
      kind: "amount",
      value: k,
      hint: late || !BOTS.sell ? -k : k * (each - v)
    });
  }
  ctx.choose(p, prompt, opts, "trading.sell", { each, why });
}
var plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
var trading = {
  id: "trading",
  name: "White",
  resource: W,
  scoring: { label: "Most white", counts: "the white you hold when the round ends", score: (ctx, p) => p.res[W] },
  actions: [
    {
      key: "haggle",
      ring: 1,
      name: "Sob Story",
      text: "+2 white, and +1 white per player with more followers than you.",
      estimate: (ctx, p) => 2 + ahead(ctx, p),
      resolve(ctx, p) {
        ctx.gain(p, W, 2 + ahead(ctx, p), { fromAction: true });
      }
    },
    {
      key: "buylow",
      ring: 1,
      name: "Cheap Seats",
      text: "Trade up to 2 resources per round number for followers, 1 for 1.",
      estimate: (ctx, p) => Math.min(BUY_LOW.per * ctx.state.round, totalRes2(p)) * (fv(ctx) - 0.9) + 0.4,
      resolve(ctx, p) {
        if (!totalRes2(p)) {
          ctx.log(`${p.name} had nothing to trade.`);
          return;
        }
        buyLowStep(ctx, p, { left: BUY_LOW.per * ctx.state.round, done: 0 });
      }
    },
    {
      // 2026-10-14 rework: was "+2 white, and sell up to 1 follower per round number for 2 white each", whose sale was
      // dead in round I (only won or bought followers sell). Now an either/or per unit, always live, no sale.
      key: "pawn",
      ring: 1,
      name: "Your Call",
      text: `Per round number: +1 follower or +${PAWN.each} white.`,
      estimate: (ctx) => ctx.state.round * Math.max(fv(ctx), PAWN.each),
      resolve(ctx, p) {
        const r = ctx.state.round, v = fv(ctx), late = lastTurn(ctx, p);
        ctx.choose(p, `Your Call: ${plural(r, "follower")}, or ${PAWN.each} white instead of each?`, Array.from({ length: r + 1 }, (_, k) => ({
          id: `amount:${k}`,
          kind: "amount",
          value: k,
          label: [r - k ? `+${plural(r - k, "follower")}` : "", k ? `+${PAWN.each * k} white` : ""].filter(Boolean).join(", "),
          // bots take white while it still builds, and followers on their last turn
          hint: late ? -k : k * (PAWN.each - v)
        })), "trading.pawn");
      }
    },
    {
      key: "sellhigh",
      ring: 2,
      name: "Sell High",
      text: "Sell up to 2 loose followers for 3 white each.",
      estimate: (ctx, p) => Math.min(SELL_HIGH.most, sellable(p)) * (SELL_HIGH.each - fv(ctx)) * (lastTurn(ctx, p) ? 0 : 1),
      resolve(ctx, p) {
        if (!sellable(p)) {
          ctx.log(`Sell High: ${p.name} has ${NOTHING_TO_SELL}.`);
          return;
        }
        sellChoice(ctx, p, `Sell High: sell how many followers for ${SELL_HIGH.each} white each?`, SELL_HIGH.most, SELL_HIGH.each, "sold");
      }
    },
    {
      // Cory cut Barter (2026-10-14: "I don't like that"), which had replaced Cash In. Dividend fills the slot
      // (Claude, under go-with-your-gut): your loose followers pay out without being sold, so nothing leaves.
      key: "dividend",
      ring: 2,
      name: "Dividend",
      text: "+1 white per loose follower you have.",
      estimate: (ctx, p) => sellable(p),
      resolve(ctx, p) {
        const n = sellable(p);
        if (!n) {
          ctx.log(`${p.name}'s Dividend: no loose followers yet (followers you bought or won).`);
          return;
        }
        ctx.gain(p, W, n, { fromAction: true });
        ctx.log(`${p.name}'s Dividend: +${n} white (${plural(n, "loose follower")}).`);
      }
    },
    {
      key: "boom",
      ring: 3,
      name: "All In",
      text: "Trade all your resources for followers, 1 for 1 (you may keep your white).",
      estimate: (ctx, p) => 0.6 * totalRes2(p),
      resolve(ctx, p) {
        if (!totalRes2(p)) {
          ctx.log(`${p.name} had nothing to turn into followers.`);
          return;
        }
        const all = totalRes2(p), rest = all - p.res[W], last = p.left === 0;
        const opts = [{ id: "boom:all", label: `Everything: ${Math.floor(all * BOOM.per)} followers`, kind: "boom", value: "all", hint: last ? 2 : 0.5 }];
        if (p.res[W] && rest) opts.push({ id: "boom:keep", label: `Keep your white: ${Math.floor(rest * BOOM.per)} followers`, kind: "boom", value: "keep", hint: 1 });
        opts.push({ id: "boom:none", label: "Nothing", kind: "boom", value: "none", hint: 0 });
        ctx.choose(p, "All In: trade which resources for followers, 1 for 1?", opts, "trading.boom");
      }
    }
  ],
  handlers: {
    boom(ctx, p, value) {
      if (value === "none") return;
      let n = 0;
      for (const r of ctx.state.resources) if (value === "all" || r !== W) {
        n += p.res[r];
        p.res[r] = 0;
      }
      const f = Math.floor(n * BOOM.per);
      actionFollowers(ctx, p, f);
      ctx.log(`${p.name}'s All In: ${n} resources became ${f} followers.`);
    },
    sell(ctx, p, k, data) {
      sell(ctx, p, k, data.each, { fromAction: true, why: data.why });
    },
    buyLow(ctx, p, value, data) {
      if (value === "done") return;
      buyLow(ctx, p, value, data.done === 0);
      buyLowStep(ctx, p, { left: data.left - 1, done: data.done + 1 });
    },
    pawn(ctx, p, k) {
      const r = ctx.state.round, white = PAWN.each * k;
      if (white) ctx.gain(p, W, white, { fromAction: true });
      actionFollowers(ctx, p, r - k);
      ctx.log(`${p.name}'s Your Call: ${[r - k ? `+${plural(r - k, "follower")}` : "", white ? `+${white} white` : ""].filter(Boolean).join(", ")}.`);
    }
  },
  members: [
    m8("shopkeeper", "Shopkeeper", 2, 2, "Now and at round start, +2 white.", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, W, 2);
      }
    }),
    // 2+0 since the 2026-10-14 rework (was 2+2): with Your Call no longer selling, bots sell half as often; value 6.2 → 2.1
    m8("dealer", "Dealer", 2, 0, "Whenever you sell followers, +1 white each.", {
      onSell(ctx, owner, card, k) {
        ctx.gain(owner, W, k);
      }
    }),
    m8("pawnbroker", "Pawnbroker", 2, 2, "Once per round: sell 1 loose follower for 3 white.", {
      activate: "round",
      onRoundStart(ctx, owner, card) {
        card.used = false;
      },
      onActivate(ctx, owner, card) {
        if (!sellable(owner)) {
          card.used = false;
          ctx.log(`${owner.name}'s Pawnbroker: ${NOTHING_TO_SELL}.`);
          return;
        }
        sell(ctx, owner, 1, 3, { by: "Pawnbroker" });
      },
      botActivate: (ctx, owner) => sellable(owner) > 0 && ctx.state.round < 3
    }),
    m8("safetynet", "Rich Uncle", 2, 0, "Now and at round start, if you have no white, +3 white.", {
      now: true,
      onRoundStart(ctx, owner) {
        if (!owner.res[W]) ctx.gain(owner, W, 3);
      }
    }),
    m8("tipster", "Tipster", 4, 2, "Whenever a rival buys followers, +1 white.", {
      onBuyFollowers(ctx, owner, card, buyer) {
        if (buyer !== owner) ctx.gain(owner, W, 1);
      }
    }),
    m8("lender", "Lender", 2, 0, "When it joins you: +5 white. Game end: lose 2 followers.", {
      onRecruited(ctx, owner, card) {
        payLoan(ctx, owner, card);
      },
      // a Doppelganger copying Lender is a full copy (Cory): it gets the +5 too, at once (the copy runs onRecruited).
      // This turn-end check is a fallback for a copy made some other way (loanPaid unset).
      onTurnEnd(ctx, owner, card) {
        if (!card.loanPaid) payLoan(ctx, owner, card);
      },
      // can't take you below the followers you've won or bought (never yourself or a member)
      onGameEnd: (ctx, owner) => -Math.min(2, owner.bonus)
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 8 → 4
    m8("magnate", "Magnate", 2, 2, "Game end: +1 follower per 3 white.", {
      onGameEnd: (ctx, owner) => Math.floor(owner.res[W] / 3)
    }),
    m8("shareholder", "Shareholder", 2, 1, "Worth 3 followers.", { f: 3 }),
    m8("heiress", "Heiress", 6, 4, "Once per game: +1 white per member you have.", {
      activate: "game",
      onActivate(ctx, owner) {
        const n = ctx.memberCount(owner);
        ctx.gain(owner, W, n);
        ctx.log(`${owner.name} used Heiress: +${n} white.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 || ctx.state.round === 2 && ctx.memberCount(owner) >= 6
    }),
    m8("bulkbuyer", "Bulk Buyer", 4, 2, "Whenever you buy 3 or more followers, +1 more.", {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 3) {
          owner.bonus += 1;
          ctx.log(`${owner.name}'s Bulk Buyer: +1 follower.`);
        }
      }
    }),
    // once per action use, and 2+0 (was 2+2), since the 2026-10-14 rework: Cheap Seats paid it per resource traded,
    // and Cash In, its main trigger, is gone. Member value 3.5 → 0.6 (160 games, normal bots, White table)
    m8("broker", "Broker", 2, 0, "Whenever a White action gives you followers, +1 more (once per action).", { brokerBonus: 1 }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 4
    m8("exporter", "Exporter", 2, 2, "Whenever you recruit a non-white member, +1 white.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== "trading") ctx.gain(owner, W, 1);
      }
    }),
    m8("liquidator", "Liquidator", 4, 2, `Once per game: sell up to ${LIQUIDATE.most} loose followers for ${LIQUIDATE.each} white each.`, {
      activate: "game",
      onActivate(ctx, owner, card) {
        if (!sellable(owner)) {
          card.used = false;
          ctx.log(`${owner.name}'s Liquidator: ${NOTHING_TO_SELL}.`);
          return;
        }
        sell(ctx, owner, LIQUIDATE.most, LIQUIDATE.each, { why: "liquidated", by: "Liquidator" });
      },
      botActivate: (ctx, owner) => ctx.state.round === 2 && sellable(owner) >= 3
    }),
    m8("reinvestor", "Reinvestor", 2, 2, "Whenever you sell followers, your next member costs 2 less per follower sold.", {
      onSell(ctx, owner, card, k) {
        owner.discount += 2 * k;
        ctx.log(`${owner.name}'s Reinvestor: next member costs ${owner.discount} less.`);
      }
    }),
    m8("raider", "Raider", 2, 0, "Once per game: buy up to 3 followers from the leader for 1 white each. They get the white.", {
      activate: "game",
      onActivate(ctx, owner, card) {
        const t = raidTarget(ctx, owner);
        const k = t ? raidAmount(ctx, owner, t) : 0;
        if (!k) {
          card.used = false;
          ctx.log(`${owner.name}'s Raider found no one to buy from.`);
          return;
        }
        owner.res[W] -= k;
        t.res[W] += k;
        t.bonus -= k;
        owner.bonus += k;
        ctx.log(`${owner.name}'s Raider bought ${k} follower${k > 1 ? "s" : ""} from ${t.name} for ${k} white.`);
      },
      botActivate: (ctx, owner) => {
        const t = raidTarget(ctx, owner);
        return !!t && raidAmount(ctx, owner, t) >= 2;
      }
    })
  ]
};
var totalRes2 = (p) => Object.values(p.res).reduce((a, b) => a + b, 0);
function buyLowStep(ctx, p, data) {
  const held2 = ctx.state.resources.filter((r) => p.res[r] > 0);
  if (data.left <= 0 || !held2.length) return;
  const v = fv(ctx);
  const opts = held2.map((r) => ({
    id: `color:${r}`,
    label: `1 ${r} \u2192 1 follower`,
    kind: "color",
    value: r,
    // bots pay from the biggest pile, white last (it scores here); they keep a little to recruit with until late
    hint: v - 1 + 0.01 * (p.res[r] - (r === W ? 3 : 0) - (r === "gold" ? 1 : 0))
  }));
  opts.push({ id: "done", label: data.done ? "Done" : "Trade nothing", kind: "done", value: "done", hint: totalRes2(p) <= 3 && !lastTurn(ctx, p) ? 0.5 : 0.1 });
  ctx.choose(p, `Cheap Seats: pay which resource for 1 follower? (${data.left} left)`, opts, "trading.buyLow", data);
}
function payLoan(ctx, owner, card) {
  card.loanPaid = true;
  ctx.gain(owner, W, 5);
  ctx.log(`${owner.name}'s Lender: +5 white.`);
}
function buyLow(ctx, p, color, first = true) {
  p.res[color] -= 1;
  if (first) actionFollowers(ctx, p, 1);
  else p.bonus += 1;
  ctx.log(`${p.name} traded 1 ${color} for 1 follower.`);
}
function actionFollowers(ctx, p, n) {
  if (!(n > 0)) return;
  let extra = 0;
  for (const c of ctx.membersOf(p)) for (const d of [c.def, c.copy ? defById(c.copy) : null]) extra += d?.brokerBonus || 0;
  p.bonus += n + extra;
  if (extra) ctx.log(`${p.name}'s Broker: +${extra} follower${extra > 1 ? "s" : ""}.`);
}
function raidTarget(ctx, p) {
  const top2 = Math.max(...ctx.state.players.map((o) => ctx.followers(o)));
  if (ctx.followers(p) >= top2) return null;
  return ctx.rivals(p).filter((o) => ctx.followers(o) === top2).sort((a, b) => b.bonus - a.bonus)[0];
}
function raidAmount(ctx, p, t) {
  return Math.min(3, t.bonus, p.res[W]);
}
var installed3 = false;
function install3() {
  if (installed3) return trading;
  registerQuadrant(trading);
  installed3 = true;
  return trading;
}

// src/engine/v4/content/echo.js
var m9 = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
var costOf = (def) => def.s + def.w;
function ledger(state) {
  if (!state.echo) state.echo = { round: state.round, now: {}, last: {}, open: null };
  const L = state.echo;
  if (L.round !== state.round) {
    L.last = L.round === state.round - 1 ? L.now : {};
    L.now = {};
    L.round = state.round;
    L.open = null;
  }
  return L;
}
var snapAll = (state, p) => ({ res: state.players.map((o) => ({ ...o.res })), members: state.players.map((o) => [...o.members]), bonus: state.players.map((o) => o.bonus), discount: p.discount });
function settle(state, e) {
  const p = state.players[e.p];
  e.discount = Math.max(0, p.discount - e.before.discount);
  const lost = state.players.some((o, i) => Object.keys(e.before.res[i]).some((r) => (o.res[r] || 0) < e.before.res[i][r]) || e.before.members[i].some((u) => !o.members.includes(u)) || o.bonus < (e.before.bonus?.[i] ?? o.bonus));
  if (lost) e.redo = true;
}
var quadrantDef = (state, uid) => defById(state.cards[uid].def);
function windowOpen(state, e) {
  const next = state.queue.find((t) => t.t !== "choose");
  return !!next && next.t === "buy" && next.p === e.p;
}
function track(ctx, e) {
  const gain2 = ctx.gain, recruit2 = ctx.recruit;
  ctx.gain = (t, c, n, o) => {
    if (t.id === e.p && n > 0 && o?.fromAction) {
      const k = o.printed ?? n;
      if (k > 0) e.res[c] = (e.res[c] || 0) + k;
    }
    return gain2(t, c, n, o);
  };
  ctx.recruit = (t, uid, o) => {
    if (t.id === e.p && o?.paid) e.redo = true;
    else if (t.id === e.p && o?.free) {
      e.members.push(costOf(quadrantDef(ctx.state, uid)));
      e.members.sort((x, y) => x - y);
    }
    return recruit2(t, uid, o);
  };
}
function wrapAction(qid, a, idx) {
  if (a.resolve.__echo) return;
  const orig = a.resolve;
  const wrapped = function(ctx, p) {
    const L = ledger(ctx.state);
    let key = `${ctx.state.quadrants.indexOf(qid)}-${idx}`;
    if (L.now[key] && L.now[key].p !== p.id && ctx.state.squats?.[key]?.includes(p.id)) key = `${key}+${p.id}`;
    const e = { key, p: p.id, ring: a.ring, name: a.name, color: qid, idx, echo: !!a.echo, before: snapAll(ctx.state, p), res: {}, discount: 0, members: [] };
    L.seq = (L.seq || 0) + 1;
    e.seq = L.seq;
    L.now[key] = e;
    L.open = key;
    L.lastBy = key;
    track(ctx, e);
    orig.call(this, ctx, p);
    settle(ctx.state, e);
  };
  wrapped.__echo = true;
  wrapped.__orig = orig;
  a.resolve = wrapped;
}
function wrapHandler(q2, k) {
  const orig = q2.handlers[k];
  if (orig.__echo) return;
  const wrapped = function(ctx, p, value, data) {
    const L = ctx.state.echo;
    const e = L && L.open && L.now[L.open];
    const open = e && windowOpen(ctx.state, e);
    if (open) track(ctx, e);
    orig.call(this, ctx, p, value, data);
    if (open) settle(ctx.state, e);
  };
  wrapped.__echo = true;
  q2.handlers[k] = wrapped;
}
var actionOf = (e) => quadrant(e.color).actions[e.idx];
var spaceTotal = (e) => Object.values(e.res).reduce((a, b) => a + b, 0);
function entryValue(ctx, e, p = null) {
  if (e.redo) {
    const a = actionOf(e);
    return p && a.estimate ? a.estimate(ctx, p) : spaceTotal(e);
  }
  let v = spaceTotal(e) + e.discount * 0.9;
  const shop = ctx.shopCards();
  for (const c of e.members) {
    const fits = shop.filter((x) => costOf(x.def) <= c);
    if (fits.length) v += Math.max(...fits.map((x) => x.def.f * 1.4 + costOf(x.def) * 0.8));
  }
  return v;
}
var copyable = (e) => !e.echo && e.ring < 3 && (e.redo || spaceTotal(e) > 0 || e.discount > 0 || e.members.length > 0);
var has = (ctx, p, key) => ctx.membersOf(p).filter((c) => c.def.id === `echo.${key}` || c.copy === `echo.${key}`).length;
var describe = (ctx, e) => {
  if (e.redo) return `do ${e.name} yourself`;
  const bits = Object.entries(e.res).map(([c, n]) => `+${n} ${c}`);
  if (e.discount) bits.push(`${e.discount} off`);
  for (const c of e.members) bits.push(ctx.shopCards().some((x) => costOf(x.def) <= c) ? `a member (\u2264${c})` : `a member (\u2264${c}; none face up)`);
  return bits.join(", ") || "nothing";
};
var VARIANT = { plus: 0 };
var plus = (ctx, p) => {
  if (VARIANT.plus) ctx.gain(p, "green", VARIANT.plus, { fromAction: true });
};
function targets(ctx, p, which, skip = null) {
  const L = ledger(ctx.state);
  const pool = Object.values(L.now);
  const since = which === "since" ? Math.max(0, ...pool.filter((e) => e.p === p.id && e.key !== skip).map((e) => e.seq || 0)) : 0;
  return pool.filter((e) => copyable(e) && (which === "since" ? e.p !== p.id && (e.seq || 0) > since : which === "own" ? e.p === p.id : true));
}
var sinceNow = (ctx, p) => {
  const L = ledger(ctx.state);
  return targets(ctx, p, "since", L.now[L.open]?.p === p.id ? L.open : null);
};
var bestValue = (ctx, list, p) => Math.max(0, ...list.map((e) => entryValue(ctx, e, p)));
function offer(ctx, p, list, prompt, from, by = null) {
  if (!list.length) {
    ctx.log(`${p.name}${by ? `'s ${by}` : ""} had nothing to copy.`);
    return;
  }
  const who = by || prompt.split(":")[0];
  ctx.choose(p, prompt, list.map((e) => ({
    id: `space:${from}:${e.key}`,
    label: `${e.name} (${ctx.player(e.p).name}): ${describe(ctx, e)}`,
    kind: "space",
    value: e.key,
    hint: entryValue(ctx, e, p)
  })), "echo.pick", by ? { from, by, who } : { from, who });
}
function copy(ctx, p, e, { later = null, by = null, asker = null } = {}) {
  const taker = ctx.player(e.p);
  const who = by ? `${p.name}'s ${by}: ${p.name}` : p.name;
  if (e.redo) {
    ctx.log(`${who} copies ${e.name}${taker !== p ? ` (${taker.name}'s)` : ""}: doing it again.`);
    heard(ctx, p, e, taker);
    actionOf(e).resolve.__orig.call(actionOf(e), ctx, p);
    return;
  }
  const fewest2 = ctx.state.players.every((o) => ctx.followers(o) >= ctx.followers(p));
  const mult = has(ctx, p, "wallflower") && fewest2 ? 2 : 1;
  const asGreen = ctx.membersOf(p).some((c) => (c.def.id === "echo.translator" || c.copy === "echo.translator") && c.on !== false);
  for (const [c, n] of Object.entries(e.res)) ctx.gain(p, asGreen ? "green" : c, n * mult, { fromAction: true });
  if (e.discount) p.discount += e.discount;
  const notes = [mult > 1 ? `doubled by ${p.name}'s Wallflower` : "", asGreen && Object.keys(e.res).length ? `as green by ${p.name}'s Translator` : ""].filter(Boolean);
  ctx.log(`${who} copied ${e.name}${e.p !== p.id ? ` (${ctx.player(e.p).name}'s)` : ""}: ${describe(ctx, e)}${notes.length ? `, ${notes.join(", ")}` : ""}.`);
  heard(ctx, p, e, taker);
  if (later) later.push(...e.members);
  else if (e.members.length) freeStep(ctx, p, { left: [...e.members], who: asker || by || "Copy" });
}
function heard(ctx, p, e, taker) {
  const fork = has(ctx, p, "tuningfork");
  if (fork) ctx.asMember(p, "Impressionist", () => ctx.gain(p, ctx.quadrant(e.color).resource, fork));
  const choir = has(ctx, p, "choir");
  if (choir) ctx.asMember(p, "Choir", () => ctx.gain(p, "green", choir));
  if (taker !== p) {
    const muse = has(ctx, taker, "muse");
    if (muse) ctx.asMember(taker, "Muse", () => ctx.gain(taker, "green", 2 * muse));
  }
  const ensemble = taker !== p ? has(ctx, p, "ensemble") : 0;
  if (ensemble) ctx.asMember(p, "Ensemble", () => {
    p.bonus += ensemble;
  });
}
function copyAll(ctx, p, list, by = null, who = by) {
  const later = [];
  for (const e of list) copy(ctx, p, e, { later, by });
  if (later.length) freeStep(ctx, p, { left: later.sort((a, b) => b - a), who: who || "Copy" });
}
function freeStep(ctx, p, data) {
  if (!data.left.length) return;
  const c = data.left[0];
  const fits = ctx.shopCards().filter((x) => costOf(x.def) <= c);
  if (!fits.length) {
    ctx.log(`${p.name}: no face-up member costs ${c} or less.`);
    freeStep(ctx, p, { ...data, left: data.left.slice(1) });
    return;
  }
  ctx.choose(p, `${data.who || "Copy"}: take a face-up member costing ${c} or less, free`, fits.map((x) => ({
    id: `card:${x.uid}`,
    label: `${x.def.name} (${costOf(x.def)})`,
    kind: "card",
    value: x.uid,
    hint: x.def.f * 1.4 + costOf(x.def)
  })), "echo.free", { cost: c, left: data.left.slice(1), who: data.who || "Copy" });
}
var echoQ = {
  id: "echo",
  name: "Green",
  resource: "green",
  rule: "Copies never reach the center or another copy. Most green at round end wins.",
  scoring: { label: "Most green", counts: "the green you hold when the round ends", score: (ctx, p) => p.res.green || 0 },
  actions: [
    {
      key: "hum",
      ring: 1,
      name: "Hum",
      text: "+3 green.",
      estimate: () => 3,
      resolve(ctx, p) {
        ctx.gain(p, "green", 3, { fromAction: true });
      }
    },
    {
      key: "chant",
      ring: 1,
      name: "Crescendo",
      text: "+2 green per round number (2 / 4 / 6).",
      estimate: (ctx) => 2 * ctx.state.round,
      resolve(ctx, p) {
        ctx.gain(p, "green", 2 * ctx.state.round, { fromAction: true });
      }
    },
    {
      // the rivals' spaces since your last turn: what the "since your turn" line shows, so you know before you place
      key: "echo",
      ring: 1,
      name: "Echo",
      echo: true,
      text: "Copy a space a rival took since your last turn.",
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, "since"), p),
      resolve(ctx, p) {
        plus(ctx, p);
        offer(ctx, p, sinceNow(ctx, p), "Echo: copy which rival\u2019s space (taken since your last turn)?", "now");
      }
    },
    {
      key: "encore",
      ring: 2,
      name: "Encore",
      echo: true,
      text: "Copy any space taken this round.",
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, "any"), p),
      resolve(ctx, p) {
        plus(ctx, p);
        offer(ctx, p, targets(ctx, p, "any"), "Encore: copy which space?", "now");
      }
    },
    {
      // your own spaces are on the board in your color: no memory of last round needed (it replaced Recall)
      key: "refrain",
      ring: 2,
      name: "Reprise",
      echo: true,
      text: "+2 green, and copy one of your spaces from this round.",
      estimate: (ctx, p) => 2 + VARIANT.plus + bestValue(ctx, targets(ctx, p, "own"), p),
      resolve(ctx, p) {
        plus(ctx, p);
        ctx.gain(p, "green", 2, { fromAction: true });
        offer(ctx, p, targets(ctx, p, "own"), "Reprise: copy which of your spaces?", "now");
      }
    },
    {
      key: "eternity",
      ring: 3,
      name: "Greatest Hits",
      echo: true,
      text: "Copy every space you took this round.",
      estimate: (ctx, p) => VARIANT.plus + targets(ctx, p, "own").reduce((s, e) => s + entryValue(ctx, e, p), 0),
      resolve(ctx, p) {
        plus(ctx, p);
        const list = targets(ctx, p, "own");
        if (!list.length) {
          ctx.log(`${p.name} had nothing to copy.`);
          return;
        }
        copyAll(ctx, p, list, null, "Greatest Hits");
      }
    }
  ],
  handlers: {
    pick(ctx, p, key, data) {
      const L = ledger(ctx.state);
      const e = (data.from === "last" ? L.last : L.now)[key];
      if (e) copy(ctx, p, e, { by: data.by || null, asker: data.who || data.by || null });
    },
    free(ctx, p, uid, data) {
      if (!ctx.state.shop.includes(uid)) {
        freeStep(ctx, p, { left: [data.cost, ...data.left], who: data.who });
        return;
      }
      ctx.recruit(p, uid, { free: true });
      freeStep(ctx, p, data);
    }
  },
  members: [
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m9("evergreen", "Busker", 4, 4, "Now and at round start, +3 green.", {
      now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, "green", 3);
      }
    }),
    m9("choir", "Choir", 4, 2, "Whenever you copy a space, +1 green."),
    m9("muse", "Muse", 2, 2, "Whenever a rival copies one of your spaces, +2 green."),
    // Understudy and Ensemble replaced Choirmaster (green for a rival's copy: a gift for doing nothing, and Muse's
    // twin) and Fan (green when a rival takes the center: nothing to do with copying). Claude, 2026-10-14.
    m9("understudy", "Understudy", 4, 2, "When recruited: copy a space a rival took since your last turn.", {
      onRecruited(ctx, owner) {
        offer(ctx, owner, sinceNow(ctx, owner), "Understudy: copy which rival\u2019s space (taken since your last turn)?", "now", "Understudy");
      }
    }),
    // was "Game end: +1 follower per green member." (2+2) until the design critic's follow-ups (2026-10-14): now it
    // pays for the copy itself, a rival's space only, and the follower counts at once (heard() above).
    m9("ensemble", "Ensemble", 4, 2, "Whenever you copy a rival\u2019s space, +1 follower."),
    m9("groupie", "Groupie", 4, 4, "Whenever anyone recruits a green member, +1 green.", {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && recruited.def.id.startsWith("echo.")) ctx.gain(owner, "green", 1);
      }
    }),
    m9("translator", "Translator", 4, 2, "What you copy comes as green. You can switch it off or on when you buy.", {
      toggle: true,
      onRecruited(ctx, owner, card) {
        card.on = true;
      }
    }),
    m9("tuningfork", "Impressionist", 2, 2, "Whenever you copy a space, also gain 1 of that space\u2019s color."),
    m9("wallflower", "Wallflower", 2, 2, "While no one has fewer followers than you, the resources you copy are doubled."),
    // Keepsake ("When recruited: copy one of your spaces from this round") is cut: Reprise does the same on a space.
    m9("mirror", "Mime", 4, 2, "When recruited: gain as much green as the rival with the most green.", {
      onRecruited(ctx, owner) {
        const g = Math.max(0, ...ctx.rivals(owner).map((o) => o.res.green || 0));
        if (g) ctx.gain(owner, "green", g);
        ctx.log(`${owner.name}'s Mime: +${g} green.`);
      }
    }),
    m9("afterimage", "Sleepwalker", 4, 2, "Now and at round start: copy one of your spaces from last round.", {
      now: true,
      onRoundStart(ctx, owner) {
        const L = ledger(ctx.state);
        const list = Object.values(L.last).filter((e) => copyable(e) && e.p === owner.id);
        offer(ctx, owner, list, "Sleepwalker: copy which of your spaces from last round?", "last", "Sleepwalker");
      }
    }),
    m9("hourglass", "Stunt Double", 6, 4, "Once per round: copy the space you just took.", {
      activate: "round",
      onRoundStart(ctx, owner, card) {
        card.used = false;
      },
      onActivate(ctx, owner, card) {
        const e = justTook(ctx, owner);
        if (!e) {
          card.used = false;
          ctx.log(`${owner.name}'s Stunt Double has nothing to copy.`);
          return;
        }
        copy(ctx, owner, e, { by: "Stunt Double" });
      },
      botActivate: (ctx, owner) => {
        const e = justTook(ctx, owner);
        return !!e && entryValue(ctx, e, owner) >= 3;
      }
    }),
    m9("dejavu", "Tribute Band", 8, 4, "Once per game: copy every space you took this round.", {
      activate: "game",
      onActivate(ctx, owner) {
        const list = targets(ctx, owner, "own");
        if (!list.length) ctx.log(`${owner.name}'s Tribute Band has nothing to copy.`);
        copyAll(ctx, owner, list, "Tribute Band");
      },
      botActivate: (ctx, owner) => owner.left === 0 && ctx.state.round >= 2 && targets(ctx, owner, "own").reduce((s, e) => s + entryValue(ctx, e, owner), 0) >= (ctx.state.round === 3 ? 6 : 10)
    }),
    m9("chronicler", "Chronicler", 4, 4, "Game end: +1 follower per 2 green.", {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.green || 0) / 2)
    })
  ]
};
function justTook(ctx, p) {
  const L = ledger(ctx.state);
  const e = L.lastBy && L.now[L.lastBy];
  return e && e.p === p.id && copyable(e) ? e : null;
}
var installed4 = false;
function install4() {
  if (!installed4) registerQuadrant(echoQ);
  for (const id of allQuadrantIds()) {
    const q2 = quadrant(id);
    q2.actions.forEach((a, i) => wrapAction(id, a, i));
    for (const k of Object.keys(q2.handlers || {})) wrapHandler(q2, k);
    const labels = q2.members.map((d) => d.quadrant);
    registerQuadrant(q2);
    q2.members.forEach((d, i) => {
      if (labels[i]) d.quadrant = labels[i];
    });
  }
  installed4 = true;
  return echoQ;
}

// src/engine/v4/content/benders.js
var m10 = (key, name, lean, s, w, text, extra = {}) => ({ key, name, lean, s, w, text, f: 1, n: 1, bends: true, ...extra });
function openSpaces2(ctx) {
  const out = [];
  ctx.state.quadrants.forEach((qid, q2) => ctx.quadrant(qid).actions.forEach((a, i) => {
    if (a.ring <= ctx.state.round && ctx.state.slots[`${q2}-${i}`] === void 0) out.push({ key: `${q2}-${i}`, q: q2, i, a });
  }));
  return out;
}
var actionOf2 = (ctx, key) => {
  const [q2, i] = key.split("-").map(Number);
  return ctx.quadrant(ctx.state.quadrants[q2]).actions[i];
};
var spaceLabel = (ctx, key) => {
  const q2 = Number(key.split("-")[0]);
  return `${actionOf2(ctx, key).name} (${ctx.quadrant(ctx.state.quadrants[q2]).name})`;
};
function myWorkers(ctx, p) {
  const out = [];
  for (const [key, o] of Object.entries(ctx.state.slots)) if (o === p.id) out.push({ key, joined: false });
  for (const [key, list] of Object.entries(ctx.state.squats || {})) if (list.includes(p.id)) out.push({ key, joined: true });
  return out;
}
function lastWorker(ctx, p) {
  const all = myWorkers(ctx, p), l = p.lastSlot;
  return l && all.find((w) => w.key === l.key && w.joined === !!l.joined) || all[all.length - 1] || null;
}
function offerFrom(ctx, owner, uid) {
  const from = lastWorker(ctx, owner), to = openSpaces2(ctx);
  if (!from || !to.length) return;
  ctx.choose(owner, `Straggler: move your last minion (on ${actionOf2(ctx, from.key).name}) to an unused space and do that action?`, [
    ...to.map((t) => ({ id: `to:${t.key}`, label: spaceLabel(ctx, t.key), kind: "slot", value: t.key, hint: t.a.estimate(ctx, owner) })),
    { id: "no", label: "Stay put", kind: "no", value: null, hint: 0.5 }
  ], "benders.stragglerTo", { uid, from });
}
var stillMine = (ctx, p, w) => w.joined ? (ctx.state.squats?.[w.key] || []).includes(p.id) : ctx.state.slots[w.key] === p.id;
var members = [
  m10("squatter", "Squatter", "thieves", 6, 2, "Once per round: place a minion on a space a rival already took.", { squat: true }),
  m10("bigspender", "Big Spender", "gold", 2, 2, "Once per round: buy twice in one turn.", { extraBuy: true }),
  m10("freelancer", "Freelancer", "yellow", 2, 2, "You may pay any member\u2019s colored part in any colors.", { anyColorPart: true }),
  m10("insider", "Insider", "market", 4, 2, "You may also recruit from the top 3 of the pile.", { pileReach: 3 }),
  m10("extrahand", "Extra Hand", "purple", 6, 4, "+1 minion in round III.", { extraWorkers: [0, 0, 1] }),
  m10("frontrunner", "Front-runner", "purple", 2, 0, "You always pick first in a round.", { pickFirst: true }),
  m10("straggler", "Straggler", "purple", 6, 2, "Once per round, after the last minion is placed: your last minion may move to an unused space and do that action.", {
    onAllPlaced(ctx, owner, card) {
      if (card.usedRound === ctx.state.round) return;
      offerFrom(ctx, owner, card.uid);
    }
  })
];
var handlers = {
  stragglerFrom(ctx, p, from, data) {
    if (!from) return;
    if (!stillMine(ctx, p, from)) {
      offerFrom(ctx, p, data.uid);
      return;
    }
    const to = openSpaces2(ctx);
    if (!to.length) return;
    ctx.choose(p, "Straggler: move it to which unused space?", to.map((t) => ({
      id: `to:${t.key}`,
      label: spaceLabel(ctx, t.key),
      kind: "slot",
      value: t.key,
      hint: t.a.estimate(ctx, p)
    })), "benders.stragglerTo", { ...data, from });
  },
  stragglerTo(ctx, p, to, data) {
    if (!to) return;
    if (!stillMine(ctx, p, data.from) || ctx.state.slots[to] !== void 0) {
      offerFrom(ctx, p, data.uid);
      return;
    }
    const card = ctx.card(data.uid);
    card.usedRound = ctx.state.round;
    const { key, joined } = data.from;
    if (joined) {
      const list = ctx.state.squats[key];
      list.splice(list.indexOf(p.id), 1);
      if (!list.length) delete ctx.state.squats[key];
    } else delete ctx.state.slots[key];
    ctx.state.slots[to] = p.id;
    const [q2, i] = to.split("-").map(Number);
    ctx.log(`${p.name}'s Straggler moves a minion from ${actionOf2(ctx, key).name} to ${actionOf2(ctx, to).name}.`);
    ctx.state.queue.unshift({ t: "act", p: p.id, q: q2, i });
  }
};
var group = { id: "benders", members, handlers };
var installed5 = false;
function install5() {
  if (installed5) return group;
  registerGuests("benders", members, handlers);
  installed5 = true;
  return group;
}

// src/engine/v4/content/index.js
var QUADRANTS = { gold: gold_default, red: red_default, blue, green };
var DEFS = {};
var HANDLERS = {};
function registerQuadrant(q2) {
  QUADRANTS[q2.id] = q2;
  index(q2);
  return q2;
}
function index(q2) {
  for (const def of q2.members) {
    def.id = `${q2.id}.${def.key}`;
    def.quadrant = q2.id;
    def.copies = def.copies || 1;
    DEFS[def.id] = def;
  }
  for (const a of q2.actions) a.id = `${q2.id}.${a.key}`;
  for (const [k, fn] of Object.entries(q2.handlers || {})) HANDLERS[`${q2.id}.${k}`] = fn;
}
for (const q2 of Object.values(QUADRANTS)) index(q2);
var DEFAULT_QUADRANTS = ["gold", "red", "blue", "green"];
var quadrant = (id) => {
  const q2 = QUADRANTS[id];
  if (!q2) throw new Error(`Unknown quadrant: ${id}`);
  return q2;
};
var defById = (id) => {
  const d = DEFS[id];
  if (!d) throw new Error(`Unknown member: ${id}`);
  return d;
};
var handlerById = (id) => {
  const h = HANDLERS[id];
  if (!h) throw new Error(`Unknown handler: ${id}`);
  return h;
};
var allQuadrantIds = () => Object.keys(QUADRANTS);
var GUESTS = [];
function registerGuests(group2, defs, handlers2 = {}) {
  for (const [k, fn] of Object.entries(handlers2)) HANDLERS[`${group2}.${k}`] = fn;
  for (const def of defs) {
    def.id = `${group2}.${def.key}`;
    def.quadrant = def.lean;
    def.copies = def.copies || 1;
    def.guest = group2;
    DEFS[def.id] = def;
    if (!GUESTS.includes(def)) GUESTS.push(def);
  }
}
var guestMembers = () => [...GUESTS];
for (const q2 of [purple_default, silver_default, yellow_default]) registerQuadrant(q2);
install();
install2();
install3();
install5();
install4();
for (const q2 of Object.values(QUADRANTS)) for (const a of q2.actions) {
  const w = a.resolve;
  if (!w.__echo || w.__gated) continue;
  const gated = function(ctx, p) {
    return (ctx.state.quadrants.includes("echo") ? w : w.__orig).call(this, ctx, p);
  };
  Object.assign(gated, { __echo: true, __gated: true, __orig: w.__orig });
  a.resolve = gated;
}

// src/engine/v4/rng.js
function nextRandom(state) {
  let t = state.rng = state.rng + 1831565813 >>> 0;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function shuffleInPlace(state, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    let t = s = s + 1831565813 >>> 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// src/engine/v4/effects.js
var rec = null;
function startEffects(state, cause, { followers: followers2, worth }) {
  rec = { state, list: [], stack: [], n: 0, followers: followers2, worth };
  push(cause);
}
function stopEffects() {
  if (!rec) return [];
  while (rec.stack.length) pop();
  const out = rec.list;
  rec = null;
  return out;
}
function abandonEffects() {
  rec = null;
}
var top = () => rec.stack[rec.stack.length - 1];
function push(cause) {
  if (rec.stack.length) flush(top());
  rec.stack.push({ cause, snap: snap() });
}
function pop() {
  const f = rec.stack.pop();
  flush(f);
  if (rec.stack.length) top().snap = snap();
}
function underCause(cause, fn) {
  if (!rec) return fn();
  push(typeof cause === "function" ? cause() : cause);
  try {
    return fn();
  } finally {
    if (rec) pop();
  }
}
function snap() {
  const s = rec.state;
  return {
    players: s.players.map((p) => ({
      res: { ...p.res },
      bonus: p.bonus,
      discount: p.discount || 0,
      fol: rec.followers(s, p),
      members: p.members.map((u) => [u, rec.worth(s.cards[u])])
    })),
    shop: [...s.shop]
  };
}
function placeOf(cause) {
  switch (cause.kind) {
    case "space":
      return { kind: "space", key: cause.key, qid: cause.qid };
    case "member":
      return { kind: "member", pid: cause.pid, uid: cause.uid };
    case "recruit":
      return { kind: "shop", index: cause.index, uid: cause.uid };
    case "buy":
      return { kind: "rate", tier: cause.tier };
    case "contest":
      return { kind: "rim", qid: cause.qid };
    case "setup":
      return { kind: "quadrant", qid: cause.qid };
    case "release":
      return { kind: "member", pid: cause.pid, uid: cause.uid };
    case "move": {
      const last = rec.state.players[cause.pid] && rec.state.players[cause.pid].lastSlot;
      return last && last.key ? { kind: "space", key: last.key } : { kind: "bank" };
    }
    default:
      return { kind: "bank" };
  }
}
function flush(f) {
  const s = rec.state, was = f.snap, cause = f.cause, place = placeOf(cause);
  const out = [];
  const add = (e) => out.push({ cause, ...e });
  const before = /* @__PURE__ */ new Map(), after = /* @__PURE__ */ new Map();
  was.players.forEach((p, pid) => p.members.forEach(([u, w]) => before.set(u, { pid, w })));
  s.players.forEach((p, pid) => p.members.forEach((u) => after.set(u, { pid, w: rec.worth(s.cards[u]) })));
  const inMoved = new Map(s.players.map((p) => [p.id, 0])), outMoved = new Map(s.players.map((p) => [p.id, 0]));
  for (const [u, a] of after) {
    const b = before.get(u);
    if (b && b.pid === a.pid) continue;
    inMoved.set(a.pid, inMoved.get(a.pid) + a.w);
    if (b) {
      outMoved.set(b.pid, outMoved.get(b.pid) + b.w);
      add({ type: "member-move", from: { kind: "crowd", pid: b.pid }, to: { kind: "crowd", pid: a.pid }, what: { uid: u, worth: a.w } });
    } else {
      const i = was.shop.indexOf(u);
      add({ type: "recruit", from: i >= 0 ? { kind: "shop", index: i, uid: u } : { kind: "pile" }, to: { kind: "crowd", pid: a.pid }, what: { uid: u, worth: a.w } });
    }
  }
  for (const [u, b] of before) {
    if (after.has(u)) continue;
    outMoved.set(b.pid, outMoved.get(b.pid) + b.w);
    const i = s.shop.indexOf(u);
    add({ type: "release", from: { kind: "crowd", pid: b.pid }, to: i >= 0 ? { kind: "shop", index: i, uid: u } : { kind: "pile" }, what: { uid: u, worth: b.w } });
  }
  for (const u of s.shop) if (!was.shop.includes(u) && !before.has(u)) add({ type: "refill", from: { kind: "pile" }, to: { kind: "shop", index: s.shop.indexOf(u), uid: u }, what: { uid: u } });
  for (const u of was.shop) if (!s.shop.includes(u) && !after.has(u)) add({ type: "shop-out", from: { kind: "shop", index: was.shop.indexOf(u), uid: u }, to: { kind: "pile" }, what: { uid: u } });
  const d = s.players.map((p, i) => Object.fromEntries(Object.keys({ ...was.players[i].res, ...p.res }).map((r) => [r, (p.res[r] || 0) - (was.players[i].res[r] || 0)])));
  for (const r of s.resources) {
    for (const g of s.players) {
      for (const q2 of s.players) {
        if (g.id === q2.id || !(d[g.id][r] > 0) || !(d[q2.id][r] < 0)) continue;
        const k = Math.min(d[g.id][r], -d[q2.id][r]);
        d[g.id][r] -= k;
        d[q2.id][r] += k;
        add({ type: "transfer", from: { kind: "stack", pid: q2.id, r }, to: { kind: "stack", pid: g.id, r }, what: { r, n: k } });
      }
    }
  }
  s.players.forEach((p) => {
    for (const r of Object.keys(d[p.id])) {
      const k = d[p.id][r];
      if (k > 0) add({ type: "gain", from: place, to: { kind: "stack", pid: p.id, r }, what: { r, n: k } });
      if (k < 0) add({ type: "pay", from: { kind: "stack", pid: p.id, r }, to: place, what: { r, n: -k } });
    }
    const f2 = rec.followers(s, p) - was.players[p.id].fol - (inMoved.get(p.id) - outMoved.get(p.id));
    if (f2 > 0) add({ type: "followers", from: place, to: { kind: "count", pid: p.id }, what: { n: f2 } });
    if (f2 < 0) add({ type: "followers", from: { kind: "count", pid: p.id }, to: place, what: { n: f2 } });
    const disc = (p.discount || 0) - was.players[p.id].discount;
    if (disc) add({ type: "discount", from: place, to: { kind: "player", pid: p.id }, what: { n: disc } });
  });
  const rank = { pay: 0, transfer: 1, "shop-out": 2, recruit: 3, "member-move": 3, release: 3, refill: 4, gain: 5, discount: 6, followers: 7 };
  out.sort((a, b) => rank[a.type] - rank[b.type]);
  for (const e of out) rec.list.push({ n: rec.n++, ...e });
}

// src/engine/v4/core.js
var RING_VALUE = [2, 4, 6];
var WORKERS = [3, 4, 5];
var SHOP_SIZE = 10;
var TIERS = [
  { key: "small", cost: 2, get: 1, colors: 1, label: "2 of anything" },
  { key: "mid", cost: 4, get: 3, colors: 1, label: "4 of anything" },
  { key: "big", cost: 8, get: 6, colors: 1, label: "8 of anything", limited: true, stock: (n) => 2 * n },
  { key: "top", cost: 10, get: 10, colors: 1, label: "10 of anything" }
];
var tierLeft = (state, tier) => tier.limited ? state.stock?.[tier.key] ?? 0 : Infinity;
var LOG_MAX = 300;
var DEFAULT_RULES = { release: true, guests: true };
function createGame({ seats, seed = 1, quadrants = DEFAULT_QUADRANTS, rules = {} }) {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 4) throw new Error("Patrons needs 2 to 4 seats.");
  const resources = quadrants.map((q2) => quadrant(q2).resource);
  const zero = Object.fromEntries(resources.map((r) => [r, 0]));
  const cards = {};
  let uid = 0;
  for (const q2 of quadrants) for (const def of quadrant(q2).members)
    for (let k = 0; k < def.copies; k++) {
      cards[uid] = { uid, def: def.id };
      uid++;
    }
  const table = { ...DEFAULT_RULES, ...rules };
  if (table.guests) for (const def of guestMembers())
    for (let k = 0; k < def.copies; k++) {
      cards[uid] = { uid, def: def.id };
      uid++;
    }
  const state = {
    v: 4,
    seed: seed >>> 0,
    rng: seed >>> 0,
    quadrants: [...quadrants],
    resources,
    rules: table,
    players: seats.map((s, i) => ({
      id: i,
      name: s.name || `P${i + 1}`,
      kind: s.kind || "human",
      ...s.emoji ? { emoji: String(s.emoji) } : {},
      // emoji: the player's pick (display only)
      res: { ...zero },
      bonus: 0,
      contest: 0,
      bought: 0,
      members: [],
      discount: 0,
      left: 0,
      turnRecruits: 0,
      final: null
    })),
    cards,
    pile: Object.keys(cards).map(Number),
    shop: [],
    round: 0,
    slots: {},
    squats: {},
    order: [],
    turnIndex: 0,
    current: null,
    recruits: 0,
    stock: Object.fromEntries(TIERS.filter((t) => t.limited).map((t) => [t.key, t.stock(seats.length)])),
    // contests: each round's scoring as the engine decided it (see contestTable); turns: who has taken a turn this round
    contests: [],
    turns: [],
    queue: [],
    pending: null,
    log: [],
    moves: 0,
    over: false,
    ranking: null
  };
  shuffleInPlace(state, state.pile);
  refill(state);
  for (const p of state.players) state.queue.push({ t: "setupPick", p: p.id, k: 1 }, { t: "setupPick", p: p.id, k: 2 });
  state.queue.push({ t: "round", r: 1 });
  log(state, "Each player picks 2 starting resources, first seat to last.");
  advance(state);
  return state;
}
function isLegal(state, move) {
  return !!(state.pending && move && move.player === state.pending.player && state.pending.options.some((o) => o.id === move.option));
}
function applyMove(prev, move, { effects = false } = {}) {
  if (!isLegal(prev, move)) throw new Error(`Illegal move: ${JSON.stringify(move)}`);
  const state = structuredClone(prev);
  const task = state.queue.shift();
  state.pending = null;
  state.moves += 1;
  if (effects) startEffects(state, moveCause(state, task, move), { followers, worth: valueOf });
  try {
    resolveTask(state, task, move.option);
    clearFresh(state);
    advance(state);
  } catch (err) {
    if (effects) abandonEffects();
    throw err;
  }
  if (effects) Object.defineProperty(state, "effects", { value: stopEffects(), enumerable: false, configurable: true, writable: true });
  return state;
}
function moveCause(state, task, move) {
  const o = String(move.option);
  if (task.t === "setupPick" && o.startsWith("color:")) return { kind: "setup", pid: task.p, qid: o.slice(6) };
  if (o.startsWith("use:")) {
    const uid = Number(o.slice(4));
    return { kind: "member", pid: task.p, uid, def: state.cards[uid] ? state.cards[uid].def : null };
  }
  return { kind: "move", pid: task.p, option: o };
}
var valueOf = (card) => card.copy ? Math.max(defById(card.def).f, defById(card.copy).f) : defById(card.def).f;
var followers = (state, p) => 1 + p.bonus + p.members.reduce((s, u) => s + valueOf(state.cards[u]), 0);
var countOf = (card) => card.copy ? Math.max(defById(card.def).n, defById(card.copy).n) : defById(card.def).n;
var memberCount = (state, p) => p.members.reduce((s, u) => s + countOf(state.cards[u]), 0);
var countMembersOfColor = (state, p, q2) => p.members.reduce((s, u) => {
  const c = state.cards[u];
  return s + (defById(c.def).quadrant === q2 ? countOf(c) : 0);
}, 0);
var cardDef = (state, uid) => defById(state.cards[uid].def);
function actionAt(state, q2, i) {
  return quadrant(state.quadrants[q2]).actions[i];
}
function openSlots(state) {
  const out = [];
  state.quadrants.forEach((qid, q2) => quadrant(qid).actions.forEach((a, i) => {
    if (a.ring <= state.round && state.slots[`${q2}-${i}`] === void 0) out.push([q2, i]);
  }));
  return out;
}
var colorOf3 = (def) => {
  try {
    return quadrant(def.quadrant).resource;
  } catch {
    return def.quadrant;
  }
};
var colorPartFree = (state, p, def) => !state.resources.includes(colorOf3(def)) || sumMemberFlag(state, p, "anyColorPart") > 0;
function priceParts(state, p, def, how = {}) {
  let s = def.s, w = def.w;
  if (how.half) {
    w = Math.floor((s + w) / 2);
    s = 0;
  }
  if (how.anyColors || colorPartFree(state, p, def)) {
    w += s;
    s = 0;
  }
  const off = (p.discount || 0) + sumMemberFlag(state, p, "costReduction");
  const colored = Math.max(0, s - off), total3 = Math.max(0, s + w - off);
  const goldDouble = sumMemberFlag(state, p, "goldPaysDouble") > 0;
  return { q: colored > 0 ? colorOf3(def) : null, colored, total: total3, worth: (c) => c === "gold" && goldDouble ? 2 : 1 };
}
var unitsOf = (v, worth) => Object.entries(v).reduce((t, [c, n]) => t + (n || 0) * worth(c), 0);
function memberPayOk(state, p, def, v, how) {
  const { q: q2, colored, total: total3, worth } = priceParts(state, p, def, how);
  return (!q2 || (v[q2] || 0) * worth(q2) >= colored) && unitsOf(v, worth) >= total3;
}
function memberPrice(state, p, uid, how = {}) {
  const def = cardDef(state, uid);
  const { q: q2, colored, total: total3, worth } = priceParts(state, p, def, how);
  const res = p.res;
  const haveQ = q2 ? (res[q2] || 0) * worth(q2) : 0;
  const shortQ = q2 ? Math.ceil(Math.max(0, colored - haveQ) / worth(q2)) : 0;
  const shortAny = Math.max(0, total3 - unitsOf(res, worth) - shortQ * (q2 ? worth(q2) : 1));
  const afford = shortQ === 0 && shortAny === 0;
  let short = null;
  if (!afford) {
    const text = [shortQ ? `${shortQ} ${q2}` : "", shortAny ? `${shortAny} any` : ""].filter(Boolean).join(", ");
    short = { ...q2 ? { [q2]: shortQ } : {}, any: shortAny, total: shortQ + shortAny, text };
  }
  return { color: q2, colored, total: total3, afford, short };
}
function paymentPlan(state, p, uid, how = {}) {
  const { q: q2, colored, total: total3, worth } = priceParts(state, p, cardDef(state, uid), how);
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map((r) => [r, 0]));
  let paid = 0;
  if (q2 && colored > 0) {
    const k = Math.ceil(colored / worth(q2));
    if ((res[q2] || 0) < k) return null;
    res[q2] -= k;
    spend[q2] = (spend[q2] || 0) + k;
    paid += k * worth(q2);
  }
  while (paid < total3) {
    const c = Object.keys(res).filter((r) => r !== "gold" && res[r] > 0).sort((a, b) => res[b] - res[a])[0] || (res.gold > 0 ? "gold" : null);
    if (!c) return null;
    res[c] -= 1;
    spend[c] += 1;
    paid += worth(c);
  }
  return spend;
}
function vectors(res, keys, maxTotal, exactTotal) {
  const out = [];
  const walk = (i, left, cur) => {
    if (i === keys.length) {
      if (exactTotal === void 0 || left === 0) out.push({ ...cur });
      return;
    }
    for (let k = 0; k <= Math.min(res[keys[i]], left); k++) {
      cur[keys[i]] = k;
      walk(i + 1, left - k, cur);
    }
    cur[keys[i]] = 0;
  };
  walk(0, exactTotal ?? maxTotal, {});
  return out;
}
var vecKey = (state, v) => state.resources.map((r) => v[r] || 0).join("-");
function paymentChoices(state, p, uid, how = {}) {
  const def = cardDef(state, uid);
  const keys = state.resources;
  if (!memberPrice(state, p, uid, how).afford) return [];
  const all = vectors(p.res, keys, priceParts(state, p, def, how).total).filter((v) => memberPayOk(state, p, def, v, how));
  const minimal = all.filter((v) => keys.every((c) => !v[c] || !memberPayOk(state, p, def, { ...v, [c]: v[c] - 1 }, how)));
  return orderChoices(state, minimal, paymentPlan(state, p, uid, how), p);
}
var wildColors = (state) => state.quadrants.map(quadrant).filter((q2) => q2.wildInFollowerBuys).map((q2) => q2.resource);
var colorsCovered = (state, v) => {
  const wild = wildColors(state);
  let n = 0;
  for (const c of state.resources) if (v[c] > 0) n += wild.includes(c) ? v[c] : 1;
  return n;
};
function followerChoices(state, p, tier) {
  if (tierLeft(state, tier) <= 0) return [];
  const keys = state.resources;
  const all = vectors(p.res, keys, tier.cost, tier.cost).filter((v) => colorsCovered(state, v) >= tier.colors);
  return orderChoices(state, all, followerPlan(state, p, tier), p);
}
function protectedColors(state, p) {
  const ctx = ctxFor(state);
  const out = /* @__PURE__ */ new Set();
  for (const qid of state.quadrants) {
    const q2 = quadrant(qid);
    const r = q2.resource;
    if (!r || !(p.res[r] > 0)) continue;
    let mine2, top2, less;
    try {
      mine2 = q2.scoring.score(ctx, p);
      top2 = Math.max(...state.players.map((o) => q2.scoring.score(ctx, o)));
      p.res[r] -= 1;
      try {
        less = q2.scoring.score(ctx, p);
      } finally {
        p.res[r] += 1;
      }
    } catch {
      continue;
    }
    if (less < mine2 && top2 > 0 && mine2 >= top2) out.add(r);
  }
  return out;
}
function orderChoices(state, list, preferred, p) {
  const pk = preferred ? vecKey(state, preferred) : null;
  const guard = p ? protectedColors(state, p) : /* @__PURE__ */ new Set();
  const risk = (v) => [...guard].reduce((s, c) => s + (v[c] || 0), 0);
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const v of list) {
    const k = vecKey(state, v);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  out.sort((a, b) => risk(a) - risk(b) || (a.gold || 0) - (b.gold || 0) || (vecKey(state, b) === pk) - (vecKey(state, a) === pk));
  return out;
}
function payOption(state, v, i) {
  return { id: `pay:${vecKey(state, v)}`, label: payString(v), kind: "pay", spend: Object.fromEntries(state.resources.map((r) => [r, v[r] || 0])), default: i === 0 };
}
function followerPlan(state, p, tier) {
  if (tierLeft(state, tier) <= 0) return null;
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map((r) => [r, 0]));
  const order = () => Object.keys(res).filter((c) => res[c] > 0).sort((a, b) => (a === "gold") - (b === "gold") || res[b] - res[a]);
  const wild = wildColors(state);
  let need = tier.colors;
  for (const c of order().filter((c2) => !wild.includes(c2)).slice(0, need)) {
    res[c]--;
    spend[c]++;
    need--;
  }
  for (const c of wild) while (need > 0 && res[c] > 0) {
    res[c]--;
    spend[c]++;
    need--;
  }
  if (need > 0) return null;
  let left = tier.cost - tier.colors;
  while (left > 0) {
    const c = order()[0];
    if (!c) return null;
    res[c]--;
    spend[c]++;
    left--;
  }
  return spend;
}
function advance(state) {
  while (state.queue.length) {
    const task = state.queue[0];
    const ask = inputFor(state, task);
    if (ask) {
      if (ask.options.length) {
        const { onEmpty, ...shown } = ask;
        state.pending = { player: task.p, ...shown };
        return;
      }
      state.queue.shift();
      if (ask.onEmpty) ask.onEmpty();
      continue;
    }
    state.queue.shift();
    runTask(state, task);
    clearFresh(state);
  }
  state.pending = null;
}
function inputFor(state, task) {
  const p = task.p !== void 0 ? state.players[task.p] : null;
  switch (task.t) {
    case "setupPick":
      return {
        kind: "setup",
        prompt: `${p.name}: pick a starting resource (${task.k} of 2)`,
        options: state.quadrants.map((q2) => ({ id: `color:${q2}`, label: quadrant(q2).name, kind: "color", value: q2 }))
      };
    case "place": {
      const slots = [
        ...openSlots(state).filter(([q2, i]) => !task.ring || actionAt(state, q2, i).ring <= task.ring).map(([q2, i]) => ({ id: `slot:${q2}-${i}`, label: actionAt(state, q2, i).name, kind: "slot", q: q2, i })),
        ...squatSlots(state, p).filter(([q2, i]) => !task.ring || actionAt(state, q2, i).ring <= task.ring).map(([q2, i]) => ({ id: `squat:${q2}-${i}`, label: `${actionAt(state, q2, i).name} (join ${state.players[state.slots[`${q2}-${i}`]].name})`, kind: "slot", squat: true, q: q2, i }))
      ];
      return { kind: "place", prompt: `${p.name}: place a minion`, options: slots.length ? [...slots, ...useOptions(state, p)] : [], onEmpty: () => {
        p.left -= 1;
      } };
    }
    case "buy": {
      if (task.extra && !(p.turnBuys > 0 && allowance(state, p, "extraBuy"))) return { kind: "buy", prompt: "", options: [] };
      const opts = [];
      for (const uid of state.shop) if (paymentChoices(state, p, uid).length)
        opts.push({ id: `card:${uid}`, label: cardDef(state, uid).name, kind: "card", uid });
      for (const uid of state.pile.slice(0, pileReach(state, p))) if (paymentChoices(state, p, uid).length)
        opts.push({ id: `card:${uid}`, label: `${cardDef(state, uid).name} (from the pile)`, kind: "card", uid, fromPile: true });
      TIERS.forEach((t) => {
        if (followerChoices(state, p, t).length) opts.push({ id: `tier:${t.key}`, label: `+${t.get} followers`, kind: "tier", tier: t.key });
      });
      for (const uid of p.members) {
        const c = state.cards[uid], d = defById(c.def);
        const eff = effectiveDefs(c);
        opts.push(...useOptions(state, p, [uid]));
        if (eff.some((e) => e.toggle)) opts.push({ id: `toggle:${uid}`, label: `${d.name}: switch ${c.on === false ? "on" : "off"}`, kind: "toggle", uid });
      }
      if (canRelease(state, p)) for (const uid of p.members) {
        if (!canRelease(state, p, uid)) continue;
        const d = cardDef(state, uid), back = releaseRefund(state, uid);
        if (back.n > 0) opts.push({ id: `release:${uid}`, label: `Release ${d.name} for ${back.label}`, kind: "release", uid, refund: back.n, color: back.color });
      }
      const real = opts.filter((o) => o.kind === "card" || o.kind === "tier" || o.kind === "use" || o.kind === "release");
      if (!real.length) return { kind: "buy", prompt: "", options: [], onEmpty: task.extra ? void 0 : () => log(state, `${p.name} couldn't buy anything.`) };
      opts.push({ id: "pass", label: "Pass", kind: "pass" });
      return { kind: "buy", extra: !!task.extra, prompt: task.extra ? `${p.name}: buy again (Big Spender), or pass` : `${p.name}: recruit a member, buy followers, or pass`, options: opts };
    }
    case "choose": {
      const options = liveOptions(state, task);
      if (options.length || !task.options.length) return { kind: "choose", prompt: task.prompt, options, ...task.count ? { count: task.count } : {} };
      return {
        kind: "choose",
        prompt: task.prompt,
        options: [],
        onEmpty: () => log(state, `${task.prompt.split(":")[0]}: nothing left to choose (${p.name}'s options were taken or moved first), so nothing happens.`)
      };
    }
    case "release": {
      const opts = [];
      for (const c of state.resources) {
        opts.push({ id: `all:${c}`, label: `All ${task.left} as ${c}`, kind: "color", value: c, hint: -(p.res[c] || 0), ...task.left === 1 ? { target: { res: c } } : {} });
        if (task.left > 1) opts.push({ id: `one:${c}`, label: `1 ${c}`, kind: "color", value: c, hint: -(p.res[c] || 0) - 0.5, target: { res: c } });
      }
      return { kind: "choose", prompt: `${p.name}: take ${task.left} more from the release, in any colors`, options: opts };
    }
    case "pay": {
      const list = task.uid !== void 0 ? paymentChoices(state, p, task.uid) : followerChoices(state, p, TIERS.find((t) => t.key === task.tier));
      const what = task.uid !== void 0 ? cardDef(state, task.uid).name : `${TIERS.find((t) => t.key === task.tier).get} followers`;
      return {
        kind: "pay",
        prompt: `${p.name}: choose how to pay for ${what}`,
        ...task.uid !== void 0 ? { uid: task.uid } : { tier: task.tier },
        options: [...list.map((v, i) => payOption(state, v, i)), { id: "back", label: "Back", kind: "back" }]
      };
    }
    default:
      return null;
  }
}
function useOptions(state, p, uids = p.members) {
  const out = [];
  for (const uid of uids) {
    const c = state.cards[uid];
    if (!c.used && effectiveDefs(c).some((e) => e.activate)) out.push({ id: `use:${uid}`, label: `Use ${defById(c.def).name}`, kind: "use", uid });
  }
  return out;
}
function useMember(state, p, uid, resume2) {
  const c = state.cards[uid];
  c.used = true;
  const act = effectiveDefs(c).find((e) => e.onActivate);
  const before = traceSnapshot(state);
  act.onActivate(ctxFor(state), p, wrap(state, c));
  traceChanges(state, before, p, act);
  const at = state.queue.findIndex((t) => !t._fresh);
  state.queue.splice(at < 0 ? state.queue.length : at, 0, resume2);
}
function resolveTask(state, task, optionId) {
  const p = state.players[task.p];
  switch (task.t) {
    case "setupPick": {
      const q2 = optionId.slice("color:".length);
      p.res[quadrant(q2).resource] += 1;
      log(state, `${p.name} starts with +1 ${quadrant(q2).resource}.`);
      return;
    }
    case "place": {
      if (optionId.startsWith("use:")) {
        useMember(state, p, Number(optionId.slice(4)), { ...task });
        return;
      }
      const squat = optionId.startsWith("squat:");
      const [q2, i] = optionId.slice(optionId.indexOf(":") + 1).split("-").map(Number);
      const key = `${q2}-${i}`;
      if (squat) {
        spendAllowance(state, p, "squat");
        (state.squats[key] = state.squats[key] || []).push(p.id);
      } else state.slots[key] = p.id;
      p.lastSlot = { key, joined: squat };
      p.left -= 1;
      const a = actionAt(state, q2, i);
      log(state, squat ? `${p.name} joined ${state.players[state.slots[key]].name} on ${a.name} (${quadrant(state.quadrants[q2]).name}).` : `${p.name} took ${a.name} (${quadrant(state.quadrants[q2]).name}).`);
      state.queue.unshift({ t: "act", p: p.id, q: q2, i });
      return;
    }
    case "buy": {
      if (optionId === "pass") {
        log(state, `${p.name} passed.`);
        return;
      }
      const [kind, rest] = optionId.split(":");
      if (kind === "card") {
        const uid = Number(rest), list = paymentChoices(state, p, uid);
        const nothing = list.length === 1 && Object.values(list[0]).every((v) => !v);
        if (nothing) {
          boughtOnce(state, p, task);
          recruit(state, p, uid, { free: false, spend: list[0] });
        } else state.queue.unshift({ t: "pay", p: p.id, uid, ...extraOf(task) });
        return;
      }
      if (kind === "tier") {
        const tier = TIERS.find((t) => t.key === rest);
        state.queue.unshift({ t: "pay", p: p.id, tier: tier.key, ...extraOf(task) });
        return;
      }
      if (kind === "use") {
        useMember(state, p, Number(rest), { t: "buy", p: p.id, ...extraOf(task) });
        return;
      }
      if (kind === "toggle") {
        const c = state.cards[Number(rest)];
        c.on = c.on === false;
        log(state, `${p.name} switched ${defById(c.def).name} ${c.on ? "on" : "off"}.`);
        state.queue.unshift({ t: "buy", p: p.id, ...extraOf(task) });
        return;
      }
      if (kind === "release") {
        const uid = Number(rest), def = state.cards[uid].def;
        const back = release(state, p, uid);
        state.queue.unshift(...back.color ? [] : [{ t: "release", p: p.id, left: back.n }], { t: "released", p: p.id, def }, { t: "buy", p: p.id, ...extraOf(task) });
        return;
      }
      throw new Error(`Bad buy option ${optionId}`);
    }
    case "choose": {
      const o = task.options.find((x) => x.id === optionId);
      handlerById(task.h)(ctxFor(state), p, o.value, task.data);
      return;
    }
    case "release": {
      const [how, c] = optionId.split(":");
      const n = how === "all" ? task.left : 1;
      p.res[c] = (p.res[c] || 0) + n;
      log(state, `${p.name} takes ${n} ${c} from the release.`);
      if (task.left - n > 0) state.queue.unshift({ t: "release", p: p.id, left: task.left - n });
      return;
    }
    case "pay": {
      if (optionId === "back") {
        state.queue.unshift({ t: "buy", p: p.id, ...extraOf(task) });
        return;
      }
      const v = Object.fromEntries(optionId.slice(4).split("-").map((n, i) => [state.resources[i], Number(n)]));
      boughtOnce(state, p, task);
      if (task.uid !== void 0) recruit(state, p, task.uid, { free: false, spend: v });
      else buyFollowers(state, p, TIERS.find((t) => t.key === task.tier), v);
      return;
    }
    default:
      throw new Error(`Task ${task.t} takes no input`);
  }
}
function runTask(state, task) {
  const p = task.p !== void 0 ? state.players[task.p] : null;
  switch (task.t) {
    case "round":
      return underCause({ kind: "round", round: task.r }, () => startRound(state, task.r));
    case "turn": {
      state.current = p.id;
      (state.turns = state.turns || []).push(p.id);
      p.turnRecruits = 0;
      p.turnBuys = 0;
      state.queue.unshift({ t: "place", p: p.id, ...task.ring ? { ring: task.ring } : {} }, { t: "buy", p: p.id }, { t: "buy", p: p.id, extra: true }, { t: "endTurn", p: p.id });
      return;
    }
    case "act": {
      const qid = state.quadrants[task.q];
      const a = actionAt(state, task.q, task.i);
      const ctx = ctxFor(state);
      return underCause({ kind: "space", key: `${task.q}-${task.i}`, qid, pid: p.id }, () => {
        eachMember(state, (owner, card, def) => {
          if (owner === p && def.afterAction) def.afterAction(ctx, owner, card, qid);
          if (owner !== p && def.afterRivalAction) def.afterRivalAction(ctx, owner, card, qid, p);
        });
        a.resolve(ctx, p);
      });
    }
    case "endTurn": {
      const ctx = ctxFor(state);
      eachMember(state, (owner, card, def) => {
        if (def.onTurnEnd) def.onTurnEnd(ctx, owner, card, p);
      });
      state.current = null;
      return;
    }
    case "allPlaced": {
      const ctx = ctxFor(state);
      for (const id of turnOrder(state)) eachMemberOf(state, state.players[id], (card, def) => {
        if (def.onAllPlaced) def.onAllPlaced(ctx, state.players[id], card);
      });
      return;
    }
    case "released": {
      const ctx = ctxFor(state);
      eachMemberOf(state, p, (card, def) => {
        if (def.onRelease) def.onRelease(ctx, p, card, defById(task.def));
      });
      return;
    }
    case "endRound":
      return endRound(state);
    case "afterRound":
      if (state.round < 3) state.queue.push({ t: "round", r: state.round + 1 });
      else state.queue.push({ t: "finish" });
      return;
    case "finish":
      return underCause({ kind: "final" }, () => finish(state));
    default:
      throw new Error(`Unknown task ${task.t}`);
  }
}
function startRound(state, r) {
  state.round = r;
  state.slots = {};
  state.squats = {};
  state.recruits = 0;
  state.turns = [];
  const n = WORKERS[r - 1];
  const more = (id) => sumMemberFlag(state, state.players[id], "extraWorkers", (v) => v[r - 1] || 0);
  for (const p of state.players) {
    p.left = n + more(p.id);
    p.workers = p.left;
  }
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => {
    if (def.onRoundStart) def.onRoundStart(ctx, owner, card);
  });
  eachMember(state, (owner, card, def) => {
    if (def.onRoundStartLate) def.onRoundStartLate(ctx, owner, card);
  });
  const prev = state.order.length ? state.order.slice(0, state.players.length) : [...state.players.map((p) => p.id)];
  const lastPos = (id) => prev.indexOf(id);
  const base = r === 1 && state.order.length === 0 ? shuffleInPlace(state, state.players.map((p) => p.id)) : [...state.players].sort((a, b) => followers(state, a) - followers(state, b) || lastPos(b.id) - lastPos(a.id)).map((p) => p.id);
  const first = (id) => sumMemberFlag(state, state.players[id], "pickFirst") > 0;
  const lead = base.filter(first);
  if (lead.length) base.splice(0, base.length, ...lead, ...base.filter((id) => !first(id)));
  state.order = [];
  for (let k = 0; k < n; k++) state.order.push(...k % 2 ? [...base].reverse() : base);
  const extras = Object.fromEntries(base.map((id) => {
    const rings = [];
    for (const uid of state.players[id].members) for (const d of effectiveDefs(state.cards[uid]))
      for (let k = 0; k < ((d.extraWorkers || [])[r - 1] || 0); k++) rings.push(d.extraWorkerRing || 0);
    return [id, rings];
  }));
  const snake = state.order.map((id) => ({ t: "turn", p: id }));
  const most = Math.max(0, ...base.map((id) => extras[id].length));
  for (let k = 0; k < most; k++) for (const id of base) if (extras[id].length > k) {
    state.order.push(id);
    snake.push({ t: "turn", p: id, ...extras[id][k] ? { ring: extras[id][k] } : {} });
  }
  const hands = base.filter((id) => extras[id].length).map((id) => `${state.players[id].name}'s ${flagName(state, state.players[id], "extraWorkers")}: +${extras[id].length} minion${extras[id].length > 1 ? "s" : ""}.`);
  log(state, `Round ${roman(r)} begins. ${state.players[base[0]].name} picks first.${lead.length ? ` (${lead.map((id) => `${state.players[id].name}'s ${flagName(state, state.players[id], "pickFirst")}`).join(", ")}: always pick${lead.length === 1 ? "s" : ""} first.)` : ""}${hands.length ? ` ${hands.join(" ")}` : ""}`);
  state.queue.push(...snake, { t: "allPlaced" }, { t: "endRound" }, { t: "afterRound" });
}
function endRound(state) {
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => {
    if (def.onRoundEnd) def.onRoundEnd(ctx, owner, card);
  });
  const v = RING_VALUE[state.round - 1];
  const table = contestTable(state, ctx);
  const msg = [];
  for (const c of table) {
    if (!c.winners.length) continue;
    const winners = c.winners.map((id) => state.players[id]);
    underCause({ kind: "contest", qid: c.qid, round: state.round }, () => {
      for (const w of winners) {
        w.bonus += v;
        w.contest += v;
      }
    });
    msg.push(`${c.label}: ${winners.map((w) => w.name).join(" & ")} +${v}`);
  }
  state.contests = [...state.contests || [], { round: state.round, prize: v, results: table }];
  log(state, `Round ${roman(state.round)} ends. ${msg.join(" \xB7 ") || "No one scored."}`);
}
var ruleOf = (label) => label.replace(/\s*\(.*\)\s*$/, "");
function contestTable(state, ctx = ctxFor(state)) {
  const prize = RING_VALUE[Math.min(3, Math.max(1, state.round)) - 1];
  return state.quadrants.map((qid) => {
    const q2 = quadrant(qid);
    const sc = q2.scoring;
    const scores = state.players.map((p) => sc.score(ctx, p));
    const top2 = Math.max(...scores);
    const winners = top2 > 0 ? state.players.filter((p, i) => scores[i] === top2).map((p) => p.id) : [];
    const rows = state.players.map((p, i) => {
      const shown = sc.show ? sc.show(ctx, p) : { count: scores[i] };
      const row3 = { player: p.id, score: scores[i], count: shown.count };
      if (shown.tiebreak !== void 0) row3.tiebreak = shown.tiebreak;
      return row3;
    }).sort((a, b) => b.score - a.score || a.player - b.player);
    return {
      qid,
      label: sc.label,
      rule: ruleOf(sc.label),
      counts: sc.counts || null,
      tiebreak: sc.tiebreak || null,
      prize,
      rows,
      winners
    };
  });
}
function finish(state) {
  const ctx = ctxFor(state);
  for (const p of state.players) p.final = { total: 0, parts: [] };
  eachMember(state, (owner, card, def) => {
    if (!def.onGameEnd) return;
    const got = def.onGameEnd(ctx, owner, card) || 0;
    if (got) {
      owner.bonus += got;
      owner.final.total += got;
      owner.final.parts.push(`${def.name} ${got > 0 ? "+" : "\u2212"}${Math.abs(got)}`);
    }
  });
  const ranked = [...state.players].sort((a, b) => followers(state, b) - followers(state, a) || memberCount(state, b) - memberCount(state, a));
  state.ranking = ranked.map((p) => p.id);
  state.over = true;
  state.current = null;
  log(state, `Game over. ${ranked[0].name} wins with ${followers(state, ranked[0])} followers.`);
}
function refill(state) {
  while (state.shop.length < SHOP_SIZE && state.pile.length) state.shop.push(state.pile.shift());
}
function recruit(state, p, uid, opts) {
  return underCause(() => ({ kind: "recruit", pid: p.id, uid, index: state.shop.indexOf(uid) }), () => recruitNow(state, p, uid, opts));
}
function recruitNow(state, p, uid, { free, spend: chosen, how = {} }) {
  const idx = state.shop.indexOf(uid);
  const fromPile = idx < 0 ? state.pile.indexOf(uid) : -1;
  if (idx < 0 && (fromPile < 0 || fromPile >= pileReach(state, p))) throw new Error(`Card ${uid} is not in the shop`);
  let paid = "free";
  if (!free) {
    const spend = chosen || paymentPlan(state, p, uid, how);
    if (!spend || !memberPayOk(state, p, cardDef(state, uid), spend, how) || Object.keys(spend).some((r) => spend[r] > (p.res[r] || 0))) throw new Error("Cannot afford");
    for (const r in spend) p.res[r] -= spend[r];
    paid = payString(spend);
    const notes = [];
    const def0 = cardDef(state, uid);
    if (p.discount && def0.s + def0.w > 0) notes.push(`discount \u2212${p.discount}`);
    for (const flag of ["costReduction", "goldPaysDouble"]) {
      for (const u of p.members) for (const d of effectiveDefs(state.cards[u])) {
        if (!d[flag]) continue;
        if (flag === "goldPaysDouble" && !spend.gold) continue;
        notes.push(flag === "costReduction" ? `${d.name} saves ${d[flag] === true ? 1 : d[flag]}` : `${d.name}: gold counts double`);
      }
    }
    const q0 = colorOf3(def0);
    if (!how.anyColors && !how.half && state.resources.includes(q0) && sumMemberFlag(state, p, "anyColorPart") > 0) {
      const needS = Math.max(0, def0.s - p.discount - sumMemberFlag(state, p, "costReduction"));
      const worth = q0 === "gold" && sumMemberFlag(state, p, "goldPaysDouble") > 0 ? 2 : 1;
      if ((spend[q0] || 0) * worth < needS) notes.push(`${flagName(state, p, "anyColorPart")}: colored part in any colors`);
    }
    if (notes.length) paid += `; ${notes.join(", ")}`;
    if (cardDef(state, uid).s + cardDef(state, uid).w > 0) p.discount = 0;
  }
  if (idx >= 0) state.shop.splice(idx, 1);
  else state.pile.splice(fromPile, 1);
  refill(state);
  p.members.push(uid);
  state.recruits += 1;
  p.turnRecruits += 1;
  const card = state.cards[uid], def = defById(card.def);
  card.recruitedRound = state.round;
  card.recruitedBy = p.id;
  log(state, `${p.name} recruited ${def.name}${idx < 0 ? ` from the pile with ${p.name}'s ${flagName(state, p, "pileReach")}` : ""} (${paid}).`);
  const ctx = ctxFor(state);
  const w = wrap(state, card);
  eachMember(state, (owner, c, d) => {
    if (d.onAnyRecruit) d.onAnyRecruit(ctx, owner, c, p, w);
  });
  if (def.onRecruited) {
    const before = traceSnapshot(state);
    def.onRecruited(ctx, p, w);
    traceChanges(state, before, p, def);
  }
  if (def.now) {
    for (const hook of ["onRoundStart", "onRoundStartLate"]) if (def[hook]) {
      const before = traceSnapshot(state);
      def[hook](ctx, p, w);
      traceChanges(state, before, p, def);
    }
  }
}
function buyFollowers(state, p, tier, chosen) {
  return underCause({ kind: "buy", pid: p.id, tier: tier.key, get: tier.get }, () => buyFollowersNow(state, p, tier, chosen));
}
function buyFollowersNow(state, p, tier, chosen) {
  const spend = chosen || followerPlan(state, p, tier);
  if (!spend) throw new Error("Cannot afford");
  for (const r in spend) p.res[r] -= spend[r];
  p.bonus += tier.get;
  p.bought = (p.bought || 0) + tier.get;
  log(state, `${p.name} bought ${tier.get} follower${tier.get > 1 ? "s" : ""} (${payString(spend)}).`);
  if (tier.limited) state.stock[tier.key] -= 1;
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => {
    if (def.onBuyFollowers) def.onBuyFollowers(ctx, owner, card, p, tier);
  });
}
function gain(state, p, color, n, { fromAction = false } = {}) {
  if (!(n > 0)) return;
  const g = { color, n, fromAction, doubled: false };
  const ctx = ctxFor(state);
  const said = (card, def, c0, n0) => {
    if (g.color === c0 && g.n === n0) {
      const why = state.notes && def.whyNot ? def.whyNot(ctx, p, card, g) : null;
      if (why) note(state, p, def.name, why);
      return;
    }
    const what = g.color === c0 ? `${c0} gain ${n0} \u2192 ${g.n}` : `${n0} ${c0} comes as ${g.n} ${g.color}`;
    log(state, `${p.name}'s ${def.name}: ${what}.`);
    note(state, p, def.name, what);
  };
  eachMemberOf(state, p, (card, def) => {
    if (def.convertGain) {
      const c0 = g.color, n0 = g.n;
      def.convertGain(ctx, p, card, g);
      said(card, def, c0, n0);
    }
  });
  eachMemberOf(state, p, (card, def) => {
    if (def.modifyGain) {
      const c0 = g.color, n0 = g.n;
      def.modifyGain(ctx, p, card, g);
      said(card, def, c0, n0);
    }
  });
  p.res[g.color] = (p.res[g.color] || 0) + g.n;
  eachMemberOf(state, p, (card, def) => {
    if (def.afterGain) def.afterGain(ctx, p, card, g);
  });
}
function effectiveDefs(card) {
  const own = defById(card.def);
  if (!card.copy) return [own];
  const copied = defById(card.copy);
  const { onRecruited, ...hooks2 } = copied;
  return [own, hooks2];
}
function eachMemberOf(state, p, fn) {
  for (const uid of [...p.members]) {
    const card = state.cards[uid];
    for (const def of effectiveDefs(card)) {
      const before = traceSnapshot(state);
      underCause({ kind: "member", pid: p.id, uid, def: card.def }, () => fn(wrap(state, card), def));
      traceChanges(state, before, p, def);
    }
  }
}
function traceSnapshot(state) {
  return { len: state.log.length, last: state.log[state.log.length - 1], players: state.players.map((o) => ({ res: { ...o.res }, bonus: o.bonus, discount: o.discount })) };
}
function traceChanges(state, before, owner, def) {
  const name = def && def.name;
  if (!name) return;
  const out = [];
  state.players.forEach((o, i) => {
    const b = before.players[i];
    if (!b) return;
    const parts = Object.keys({ ...b.res, ...o.res }).map((r) => [r, (o.res[r] || 0) - (b.res[r] || 0)]).filter(([, d2]) => d2).map(([r, d2]) => `${d2 > 0 ? "+" : "\u2212"}${Math.abs(d2)} ${r}`);
    const f = o.bonus - b.bonus;
    if (f) parts.push(`${f > 0 ? "+" : "\u2212"}${Math.abs(f)} follower${Math.abs(f) === 1 ? "" : "s"}`);
    const d = (o.discount || 0) - (b.discount || 0);
    if (d > 0) parts.push(`next member costs ${d} less`);
    if (!parts.length) return;
    if (o === owner && state.notes) note(state, owner, name, parts.join(", "), Object.fromEntries(Object.keys({ ...b.res, ...o.res }).map((r) => [r, (o.res[r] || 0) - (b.res[r] || 0)]).filter(([, d2]) => d2)));
    out.push(o === owner ? `${owner.name}'s ${name}: ${parts.join(", ")}.` : `${o.name} ${parts.join(", ")} (${owner.name}'s ${name}).`);
  });
  if (!out.length) return;
  const fresh = state.log.length < LOG_MAX ? state.log.slice(before.len) : state.log.slice(state.log.lastIndexOf(before.last) + 1);
  if (fresh.some((l) => l.includes(name))) return;
  for (const line of out) log(state, line);
}
function eachMember(state, fn) {
  for (const owner of state.players) eachMemberOf(state, owner, (card, def) => fn(owner, card, def));
}
function flagName(state, p, flag) {
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) if (def[flag]) return def.name;
  return "member";
}
function sumMemberFlag(state, p, flag, map) {
  let s = 0;
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) {
    const v = def[flag];
    if (v === void 0) continue;
    s += map ? map(v) : v === true ? 1 : typeof v === "number" ? v : 0;
  }
  return s;
}
function allowanceCards(state, p, flag) {
  const out = [];
  for (const uid of p.members) {
    const card = state.cards[uid];
    if (card.spent?.[flag] === state.round) continue;
    if (effectiveDefs(card).some((d) => d[flag])) out.push(card);
  }
  return out;
}
var allowance = (state, p, flag) => allowanceCards(state, p, flag).length;
function spendAllowance(state, p, flag) {
  const card = allowanceCards(state, p, flag)[0];
  if (!card) throw new Error(`${p.name} has no ${flag} left this round`);
  card.spent = { ...card.spent || {}, [flag]: state.round };
  log(state, `${p.name} uses ${defById(card.def).name}.`);
}
var extraOf = (task) => task.extra ? { extra: true } : {};
function boughtOnce(state, p, task) {
  if (task.extra) spendAllowance(state, p, "extraBuy");
  p.turnBuys = (p.turnBuys || 0) + 1;
}
function pileReach(state, p) {
  let n = 0;
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) if (def.pileReach) n = Math.max(n, def.pileReach);
  return n;
}
function squatSlots(state, p) {
  if (!allowance(state, p, "squat")) return [];
  const out = [];
  for (const [key, owner] of Object.entries(state.slots)) {
    if (owner === p.id || state.squats?.[key]?.length) continue;
    out.push(key.split("-").map(Number));
  }
  return out;
}
var canRelease = (state, p, uid) => !!state.rules?.release && p.releasedRound !== state.round && (uid === void 0 || !(state.cards[uid]?.recruitedRound === state.round && state.cards[uid]?.recruitedBy === p.id) && !state.cards[uid]?.used);
function releaseRefund(state, uid) {
  const def = cardDef(state, uid), c = colorOf3(def), n = def.s;
  const color = state.resources.includes(c) ? c : null;
  return { n, color, label: !n ? "nothing" : color ? `${n} ${color}` : `${n} in any colors` };
}
function release(state, p, uid) {
  return underCause({ kind: "release", pid: p.id, uid }, () => releaseNow(state, p, uid));
}
function releaseNow(state, p, uid) {
  const def = cardDef(state, uid), back = releaseRefund(state, uid);
  cardLeaves(state, p, uid);
  p.members.splice(p.members.indexOf(uid), 1);
  state.cards[uid] = { uid, def: state.cards[uid].def };
  state.pile.push(uid);
  p.releasedRound = state.round;
  if (back.color) p.res[back.color] = (p.res[back.color] || 0) + back.n;
  log(state, `${p.name} released ${def.name} to the bottom of the pile, for ${back.label}.`);
  return back;
}
function cardLeaves(state, p, uid) {
  const card = state.cards[uid], ctx = ctxFor(state);
  for (const def of effectiveDefs(card)) if (def.onLeave) def.onLeave(ctx, p, wrap(state, card));
}
var turnOrder = (state) => state.order.length ? state.order.slice(0, state.players.length) : state.players.map((p) => p.id);
function wrap(state, card) {
  return new Proxy(card, {
    get(target, key) {
      return key === "def" ? defById(target.def) : target[key];
    },
    set(target, key, value) {
      if (key === "def") throw new Error("def is read-only");
      target[key] = value;
      return true;
    }
  });
}
function contextFor(state) {
  return ctxFor(state);
}
function ctxFor(state) {
  const ctx = {
    state,
    player: (id) => state.players[id],
    rivals: (p) => state.players.filter((o) => o !== p),
    quadrant,
    followers: (p) => followers(state, p),
    memberCount: (p) => memberCount(state, p),
    countMembersOfColor: (p, q2) => countMembersOfColor(state, p, q2),
    card: (uid) => wrap(state, state.cards[uid]),
    defOf: (c) => typeof c === "number" ? cardDef(state, c) : c.def,
    membersOf: (p) => p.members.map((u) => wrap(state, state.cards[u])),
    ownerOf: (uid) => state.players.find((o) => o.members.includes(uid)),
    shopCards: () => state.shop.map((u) => wrap(state, state.cards[u])),
    gain: (p, color, n, opts) => gain(state, p, color, n, opts),
    recruit: (p, uid, opts) => recruit(state, p, uid, opts),
    /** The one price rule (memberPrice) and the ways to pay it (paymentChoices), for recruits outside the buy step. */
    price: (p, uid, how) => memberPrice(state, p, uid, how),
    payChoices: (p, uid, how) => paymentChoices(state, p, uid, how),
    log: (text) => log(state, text),
    cardLeaves: (p, uid) => cardLeaves(state, p, uid),
    /** Run fn on behalf of owner's member `name` (a hook content code calls itself, e.g. Choir reacting to a copy):
     *  whatever it changes and doesn't log is logged under that name, like the engine's own member hooks. */
    asMember(owner, name, fn) {
      const before = traceSnapshot(state);
      const uid = owner.members.find((u) => {
        try {
          return cardDef(state, u).name === name;
        } catch {
          return false;
        }
      });
      const out = underCause({ kind: "member", pid: owner.id, uid: uid ?? null, def: uid != null ? state.cards[uid].def : null }, fn);
      traceChanges(state, before, owner, { name });
      return out;
    },
    buryFromShop(uid) {
      const i = state.shop.indexOf(uid);
      if (i < 0) return;
      state.shop.splice(i, 1);
      state.pile.push(uid);
      refill(state);
    },
    moveMember(uid, from, to) {
      cardLeaves(state, from, uid);
      from.members.splice(from.members.indexOf(uid), 1);
      to.members.push(uid);
    },
    // ---- stealing: one shared verb, so protections and reactions apply to every sphere's steals ----
    /** May `thief` steal from `victim`? kind is 'res' (resources, piles) or 'member'. Quadrants and the
     *  victim's members can refuse (guardSteal returns true). */
    canSteal(thief, victim, kind = "res") {
      if (!victim || victim === thief) return false;
      for (const qid of state.quadrants) {
        const q2 = quadrant(qid);
        if (q2.guardSteal && q2.guardSteal(ctx, thief, victim, kind)) return false;
      }
      let blocked = false;
      eachMemberOf(state, victim, (card, def) => {
        if (def.guardSteal && def.guardSteal(ctx, victim, card, thief, kind)) blocked = true;
      });
      return !blocked;
    },
    /** How many a steal of `base` takes for this thief (members: stealMore adds, stealDouble(ctx, owner) doubles). */
    stealCount(thief, base, { say = false } = {}) {
      let n = base, double = false;
      const who = [];
      eachMemberOf(state, thief, (card, def) => {
        if (typeof def.stealMore === "number") {
          n += def.stealMore;
          if (def.stealMore) who.push(`${thief.name}'s ${def.name}: +${def.stealMore}`);
        }
        if (def.stealDouble && def.stealDouble(ctx, thief)) {
          double = true;
          who.push(`${thief.name}'s ${def.name}: doubled`);
        }
      });
      const out = double ? n * 2 : n;
      if (say && base > 0 && out !== base) log(state, `${thief.name}'s steal takes ${out}, not ${base} (${who.join("; ")}).`);
      return out;
    },
    /** One steal event from one victim. what: { take: {color: n} } moves resources (clamped to what they hold),
     *  { uid } moves a member, { other: n } reports units the caller already moved (e.g. a loot pile).
     *  what.give(n) hands the thief the proceeds before anyone reacts (so a reaction can take from the thief).
     *  Then fires onSteal on every quadrant and member. Returns units taken. */
    steal(thief, victim, what = {}) {
      if (!ctx.canSteal(thief, victim, what.uid !== void 0 ? "member" : "res")) return 0;
      const took = {};
      let n = what.other || 0;
      for (const [c, k] of Object.entries(what.take || {})) {
        const x = Math.max(0, Math.min(k, victim.res[c] || 0));
        if (x) {
          victim.res[c] -= x;
          took[c] = x;
          n += x;
        }
      }
      if (what.uid !== void 0) {
        ctx.moveMember(what.uid, victim, thief);
        n += 1;
      }
      if (!n) return 0;
      if (what.give) what.give(n);
      const info = { thief, victim, took, uid: what.uid, n, reaction: !!what.reaction };
      for (const qid of state.quadrants) {
        const q2 = quadrant(qid);
        if (q2.onSteal) q2.onSteal(ctx, info);
      }
      eachMember(state, (owner, card, def) => {
        if (def.onSteal) def.onSteal(ctx, owner, card, info);
      });
      return n;
    },
    // Queue a decision for player p. It runs before anything else still queued. extra.count: a counted pick's
    // progress, { of, left } (Collect Debts: 1 of 3 taken), kept on the task so it survives a save and load.
    choose(p, prompt, options, handler, data = null, extra = {}) {
      if (!options.length) return;
      const at = state.queue.findIndex((t) => !t._fresh);
      const task = { t: "choose", p: p.id, prompt, options: withTargets(state, options).map((o) => pinCards(state, o)), h: handler, data, ...extra.count ? { count: extra.count } : {}, _fresh: true };
      state.queue.splice(at < 0 ? state.queue.length : at, 0, task);
    }
  };
  return ctx;
}
var CARD_KINDS = /* @__PURE__ */ new Set(["card", "member", "trade"]);
function whereIs(state, uid) {
  if (state.shop.includes(uid)) return "shop";
  if (state.pile.includes(uid)) return "pile";
  const o = state.players.find((q2) => q2.members.includes(uid));
  return o ? `p${o.id}` : "gone";
}
function pinCards(state, o) {
  const uids = CARD_KINDS.has(o.kind) ? [].concat(o.value).filter((u) => Number.isInteger(u) && state.cards[u]) : [];
  return uids.length ? { ...o, at: Object.fromEntries(uids.map((u) => [u, whereIs(state, u)])) } : o;
}
function withTargets(state, options) {
  const colors2 = options.filter((o) => o.kind === "color" && !o.target).map((o) => o.value);
  const asQuadrant = colors2.length > 0 && colors2.every((v) => state.quadrants.includes(v)) && !colors2.every((v) => state.resources.includes(v));
  return options.map((o) => {
    if (o.target) return o;
    const v = o.value;
    let target = null;
    if ((o.kind === "take" || o.kind === "give") && Array.isArray(v) && Number.isInteger(v[0]) && typeof v[1] === "string") target = { pid: v[0], res: v[1], ...o.kind === "give" ? { give: true } : {} };
    else if (o.kind === "player" && Number.isInteger(v)) target = { pid: v };
    else if ((o.kind === "card" || o.kind === "member") && Number.isInteger(v) && state.cards[v]) target = { uid: v };
    else if ((o.kind === "space" || o.kind === "slot") && (typeof v === "string" || v && typeof v.key === "string")) {
      const key = String(typeof v === "string" ? v : v.key).split("+")[0];
      if (/^\d+-\d+$/.test(key)) target = { space: key };
    } else if (o.kind === "color" && typeof v === "string") {
      if (asQuadrant) target = { res: quadrant(v).resource };
      else if (state.resources.includes(v)) target = { res: v };
    }
    return target ? { ...o, target } : o;
  });
}
function liveOptions(state, task) {
  return task.options.filter((o) => !o.at || Object.entries(o.at).every(([u, w]) => whereIs(state, Number(u)) === w));
}
function clearFresh(state) {
  for (const t of state.queue) if (t._fresh) delete t._fresh;
}
function note(state, p, member, text, res = null) {
  if (Array.isArray(state.notes)) state.notes.push({ p: p.id, member, text, ...res ? { res } : {} });
}
function log(state, text) {
  state.log.push(text);
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
}
var payString = (s) => Object.entries(s).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(", ") || "free";
var roman = (r) => ["I", "II", "III"][r - 1] || String(r);

// src/engine/v4/thinker.js
var ROLLOUT = { noise: 0.6, payWays: 2, payOptions: 2 };
var margin = (state, id) => followers(state, state.players[id]) - Math.max(...state.players.filter((p) => p.id !== id).map((p) => followers(state, p)));
function chooseThinkerMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  if (!["place", "buy"].includes(pend.kind)) return chooseNormalMove(state, rand);
  const me = pend.player;
  const short = pend.kind === "buy" ? buyShortcut(state) : null;
  if (short) return { player: me, option: short.id };
  const ranked = scoreOptions(state, rand);
  if (!ranked.length) return chooseNormalMove(state, rand);
  if (ranked.length === 1) return { player: me, option: ranked[0].o.id };
  const { candidates = 3, budget = 100, full = false, maxMs = Infinity } = opts;
  const now = opts.now ?? (globalThis.performance ? () => globalThis.performance.now() : () => Date.now());
  const until = Number.isFinite(maxMs) ? now() + maxMs : Infinity;
  const late = () => until !== Infinity && now() > until;
  const pool = ranked.slice(0, candidates).filter((r, i) => i === 0 || r.v >= ranked[0].v - 4);
  if (pool.length === 1) return { player: me, option: pool[0].o.id };
  const round = state.round;
  const totals = pool.map(() => 0), counts = pool.map(() => 0);
  let spent = 0;
  const cap = Math.max(8, Math.floor(budget / pool.length));
  for (let k = 0; spent < budget || counts.some((c) => c === 0); k++) {
    const i = k % pool.length;
    if (counts[i] > 0 && (spent >= budget || late())) break;
    const r = seededRandom(Math.floor(rand() * 2 ** 31));
    let s, steps = 1, value;
    try {
      s = applyMove(state, { player: me, option: pool[i].o.id });
      while (!s.over && (full || s.round === round && steps < cap) && steps < 800 && !late()) {
        s = applyMove(s, opts.rollout === "greedy" ? chooseGreedyMove(s, r, { noise: 1 }) : chooseNormalMove(s, r, ROLLOUT));
        steps++;
      }
      value = s.over ? margin(s, me) : valueAtBoundary(s, me);
    } catch (err) {
      if (globalThis.process?.env?.THINKER_DUMP) rolloutCrash(state, pool[i].o.id, err);
      value = -100;
    }
    spent += steps;
    totals[i] += value;
    counts[i] += 1;
    if (k > 200) break;
  }
  let best = 0;
  for (let i = 1; i < pool.length; i++) if (totals[i] / counts[i] > totals[best] / counts[best]) best = i;
  return { player: me, option: pool[best].o.id };
}
function valueAtBoundary(s, me) {
  if (!s.pending) return margin(s, me);
  const probe = { ...s, pending: { player: me, kind: "buy", options: [{ id: "pass", kind: "pass" }] } };
  return scoreOptions(probe, () => 0, { spite: 1 })[0].v;
}
var dumped = 0;
function rolloutCrash(state, option, err) {
  if (dumped++ > 2) return;
  const fs = globalThis.process.getBuiltinModule?.("node:fs");
  fs?.writeFileSync(`${globalThis.process.env.THINKER_DUMP}-${Date.now()}.json`, JSON.stringify({ error: String(err), stack: err.stack, option, state }));
}

// src/engine/v4/bots.js
var BOT_LEVELS = ["easy", "normal", "hard"];
var MEMBER_BIAS = 2;
var BIAS_FLOOR = 0.3;
var SPITE = 0.4;
var EASY = { noise: 6, buyNoise: 4, k: 1, spite: 1, memberBias: 0, biasFloor: 1 };
var NORMAL = { noise: 0.3, buyNoise: 0.05, k: 2, spite: SPITE, memberBias: MEMBER_BIAS, biasFloor: BIAS_FLOOR };
var blendProfile = (t) => Object.fromEntries(Object.keys(NORMAL).map((key) => [key, EASY[key] + (NORMAL[key] - EASY[key]) * t]));
var SIM_LEVELS = [...BOT_LEVELS, "casual", "collector"];
var BOT_PROFILES = {
  easy: EASY,
  casual: blendProfile(0.5),
  collector: { noise: 3, buyNoise: 2, memberBias: 3, biasFloor: 1, spite: 1 },
  normal: {}
};
var HARD_MAX_MS = 200;
var SETUP_WEIGHTS = { gold: 3, red: 3, blue: 1, green: 1 };
var DEFAULT_BOT_LEVEL = "normal";
function botLevel(state, player, opts = {}) {
  const b = state.players[player]?.bot;
  const l = opts.level ?? (b && typeof b === "object" ? b.level : b);
  return SIM_LEVELS.includes(l) ? l : DEFAULT_BOT_LEVEL;
}
function chooseBotMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const level = botLevel(state, pend.player, opts);
  if (level === "hard") return chooseThinkerMove(state, rand, { maxMs: HARD_MAX_MS, ...opts });
  return chooseNormalMove(state, rand, { ...BOT_PROFILES[level], ...opts });
}
function chooseGreedyMove(state, rand = Math.random, { noise = 1.6 } = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const p = state.players[pend.player];
  const ctx = contextFor(state);
  const move = (o) => ({ player: pend.player, option: o.id });
  const best = (opts, score) => opts.reduce((a, b) => score(b) > score(a) ? b : a);
  switch (pend.kind) {
    case "setup":
      return setupPick(pend, rand);
    case "place":
      return move(best(pend.options.filter((o) => o.kind === "slot"), (o) => {
        const a = actionAt(state, o.q, o.i);
        const qid = state.quadrants[o.q];
        const hustle = p.members.filter((u) => state.cards[u].def === "gold.hustler" && state.cards[u].color === qid).length;
        return a.estimate(ctx, p) + hustle + rand() * 1.2 * noise;
      }));
    case "buy": {
      const use = useOption(state, pend, ctx, p);
      if (use) return move(use);
      const tiers = pend.options.filter((o) => o.kind === "tier");
      const tierOf = (o) => TIERS.find((t) => t.key === o.tier);
      const last = state.round === 3 && p.left === 0;
      if (last && tiers.length) return move(best(tiers, (o) => tierOf(o).get));
      const cards = pend.options.filter((o) => o.kind === "card").map((o) => {
        const d = cardDef(state, o.uid), c = d.s + d.w;
        const v = d.f * 1.4 + (d.vanilla ? 0 : 1.6) + c * 0.3 - (state.round === 3 ? c * 0.5 : 0) + rand() * 0.5 * noise;
        return { o, v };
      });
      const top2 = cards.length ? cards.reduce((a, b) => b.v > a.v ? b : a) : null;
      if (top2 && top2.v > 1.5) return move(top2.o);
      const bulk = tiers.filter((o) => tierOf(o).limited);
      if (bulk.length) return move(best(bulk, (o) => tierOf(o).get));
      const mid = tiers.find((o) => tierOf(o).get === 3);
      const held2 = Object.values(p.res).reduce((a, b) => a + b, 0);
      if (mid && state.round >= 2 && held2 >= 7) return move(mid);
      return move(pend.options.find((o) => o.kind === "pass"));
    }
    default:
      return followUp(pend, rand);
  }
}
function setupPick(pend, rand) {
  const total3 = pend.options.reduce((s, o) => s + (SETUP_WEIGHTS[o.value] || 1), 0);
  let r = rand() * total3;
  for (const o of pend.options) {
    r -= SETUP_WEIGHTS[o.value] || 1;
    if (r <= 0) return { player: pend.player, option: o.id };
  }
  return { player: pend.player, option: pend.options[0].id };
}
function followUp(pend, rand) {
  const move = (o) => ({ player: pend.player, option: o.id });
  if (pend.kind === "pay") return move(pend.options.find((o) => o.default) || pend.options[0]);
  if (pend.kind === "choose") return move(pend.options.reduce((a, b) => (b.hint || 0) + rand() * 0.01 > (a.hint || 0) ? b : a));
  return move(pend.options[0]);
}
function useOption(state, pend, ctx, p) {
  const canUse = (c) => [c.def, c.copy].some((id) => id && defById(id).botActivate?.(ctx, p));
  return pend.options.find((o) => o.kind === "use" && canUse(state.cards[o.uid]));
}
var INCOME = [3.5, 5.5, 8];
var INCOME_SCALE = 0.4;
var K_ABILITY = 2;
var PAY_WAYS = 4;
var SURPLUS_WAYS = 3;
function surplus(state, me) {
  const p = state.players[me];
  const out = {};
  for (const r of state.resources) {
    const mine2 = p.res[r] || 0;
    const counted = state.quadrants.some((q2) => quadrant(q2).resource === r);
    const next = Math.max(0, ...state.players.filter((o) => o !== p).map((o) => o.res[r] || 0));
    out[r] = counted && mine2 > next ? Math.max(0, mine2 - next - 1) : mine2;
  }
  return out;
}
var FUTURE_CONTESTS = 0.4;
var copy2 = (v) => {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(copy2);
  const o = {};
  for (const k in v) o[k] = copy2(v[k]);
  return o;
};
var lightClone = (s) => {
  const c = {};
  for (const k in s) if (k !== "log" && k !== "queue" && k !== "pending") c[k] = copy2(s[k]);
  c.log = [];
  c.queue = [];
  c.pending = null;
  return c;
};
var sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
function horizon(state) {
  const n = state.players.length;
  const turns2 = Array(n).fill(0);
  for (const t of state.queue) if (t.t === "turn") turns2[t.p] += 1;
  const roundTotal = (WORKERS[state.round - 1] || 1) * n;
  return { turns: turns2, roundLeft: Math.min(1, turns2.reduce((a, b) => a + b, 0) / roundTotal) };
}
function laterTurns(s) {
  if (s.round >= 3) return { turns: 0, income: 0 };
  let turns2 = 0, income = 0;
  for (let r = s.round; r < 3; r++) {
    turns2 += WORKERS[r];
    income += WORKERS[r] * INCOME[r];
  }
  return { turns: turns2, income };
}
function liquidate(s, res, extra, buys, wild) {
  if (buys <= 0) return 0;
  const keys = s.resources;
  const tot = sum(res);
  const pool = {};
  for (const k of keys) pool[k] = (res[k] || 0) + extra * ((res[k] || 0) + 1) / (tot + keys.length);
  const n = s.players.length;
  const used = {};
  let got = 0;
  const tiers = [...TIERS].sort((a, b) => b.get - a.get);
  for (let b = 0; b < buys; b++) {
    let bought = false;
    for (const t of tiers) {
      if (t.limited && (used[t.key] || 0) >= Math.floor(tierLeft(s, t) / n)) continue;
      if (sum(pool) < t.cost - 1e-9) continue;
      const plain = keys.filter((k) => !wild.has(k) && pool[k] >= 1).sort((x, y) => pool[y] - pool[x]);
      const wilds = keys.filter((k) => wild.has(k));
      if (plain.length + wilds.reduce((a, k) => a + Math.floor(pool[k]), 0) < t.colors) continue;
      let need = t.cost, c = t.colors;
      for (const k of plain) {
        if (!c) break;
        pool[k] -= 1;
        need -= 1;
        c -= 1;
      }
      for (const k of wilds) while (c > 0 && pool[k] >= 1) {
        pool[k] -= 1;
        need -= 1;
        c -= 1;
      }
      while (need > 1e-9) {
        const k = keys.reduce((x2, y) => pool[y] > pool[x2] ? y : x2);
        const x = Math.min(pool[k], need);
        pool[k] -= x;
        need -= x;
      }
      got += t.get;
      used[t.key] = (used[t.key] || 0) + 1;
      bought = true;
      break;
    }
    if (!bought) break;
  }
  return got + 0.2 * Math.min(2, sum(pool));
}
function contests(s, ctx, p, roundLeft, future = FUTURE_CONTESTS) {
  if (s.over || !s.round) return 0;
  const later = RING_VALUE.slice(s.round).reduce((a, b) => a + b, 0) * future;
  const v = RING_VALUE[s.round - 1];
  let out = 0;
  for (const qid of s.quadrants) {
    const q2 = quadrant(qid);
    let mine2, other;
    try {
      mine2 = q2.scoring.score(ctx, p);
      other = Math.max(...s.players.filter((o) => o !== p).map((o) => q2.scoring.score(ctx, o)));
    } catch {
      continue;
    }
    if (!(mine2 > 0)) continue;
    const certain = mine2 >= other ? 1 : 0;
    const rough = mine2 > other ? 0.75 : mine2 === other ? 0.55 : 0.15;
    out += v * (certain * (1 - roundLeft) + rough * roundLeft) + later * rough;
  }
  return out;
}
function gameEndPay(s, ctx, p) {
  let out = 0;
  for (const c of ctx.membersOf(p)) for (const id of [c.def.id, c.copy].filter(Boolean)) {
    const d = defById(id);
    if (!d.onGameEnd) continue;
    try {
      out += d.onGameEnd(ctx, p, c) || 0;
    } catch {
    }
  }
  return out;
}
var DATA_KEYS = /* @__PURE__ */ new Set(["key", "name", "s", "w", "text", "f", "n", "id", "quadrant", "copies", "vanilla", "lean", "guest"]);
var MEASURED = /* @__PURE__ */ new Set(["onGameEnd", "onRecruited", "botActivate", "estimate"]);
var PLAIN_TEXT = /^(Free\. )?((Worth \d+ followers?\.|No effect\.|Counts as \d+ members\.)\s*)+$/;
function abilityValue(def, placementsLeft, k = K_ABILITY) {
  if (def.vanilla || PLAIN_TEXT.test((def.text || "").trim())) return 0;
  const keys = Object.keys(def).filter((x) => !DATA_KEYS.has(x));
  if (keys.length && keys.every((x) => MEASURED.has(x))) return 0;
  return k * (def.s + def.w) * Math.min(1, placementsLeft / 12);
}
function evaluate(s, buysLeft, incomeLeft, roundLeft, extraAbility = {}, future) {
  const ctx = contextFor(s);
  const wild = new Set(s.quadrants.map(quadrant).filter((q2) => q2.wildInFollowerBuys).map((q2) => q2.resource));
  return s.players.map((p) => {
    const extra = incomeLeft[p.id];
    return followers(s, p) + gameEndPay(s, ctx, p) + (extraAbility[p.id] || 0) + liquidate(s, p.res, extra, buysLeft[p.id], wild) + contests(s, ctx, p, roundLeft, future);
  });
}
var marginOf = (vals, me, spite = SPITE) => vals[me] - spite * Math.max(...vals.filter((_, i) => i !== me));
function settle2(s, ctx) {
  for (let k = 0; k < 40 && s.queue.length; k++) {
    const t = s.queue.shift();
    if (t.t !== "choose" || !t.options?.length) continue;
    const live = liveOptions(s, t);
    if (!live.length) continue;
    const o = live.reduce((a, b) => (b.hint || 0) > (a.hint || 0) ? b : a);
    handlerById(t.h)(ctx, s.players[t.p], o.value, t.data);
  }
}
function scoreOptions(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  const me = pend.player;
  const { turns: turns2, roundLeft } = horizon(state);
  const nowIncome = INCOME[state.round - 1] * (opts.income ?? INCOME_SCALE);
  const buysAt = (s, extraNow) => {
    const lt = laterTurns(s).turns;
    return state.players.map((_, i) => turns2[i] + lt + (i === me ? extraNow : 0));
  };
  const incomeAt = (s, extra = 0) => {
    const li = laterTurns(s).income * (opts.income ?? INCOME_SCALE);
    return turns2.map((t, i) => (t + (i === me ? extra : 0)) * nowIncome + li);
  };
  const turnsQueued = (s) => s.queue.filter((t) => t.t === "turn" && t.p === me).length;
  const placesLeft = turns2[me] + laterTurns(state).turns;
  const buyNoise = opts.buyNoise ?? opts.noise ?? 0.05;
  const floor = opts.biasFloor ?? BIAS_FLOOR;
  const memberBias = (opts.memberBias ?? MEMBER_BIAS) * (floor + (1 - floor) * Math.min(1, placesLeft / 12));
  const out = [];
  if (pend.kind === "place") {
    for (const o of pend.options) {
      if (o.kind !== "slot") continue;
      let v;
      try {
        const s = lightClone(state);
        const ctx = contextFor(s);
        const p = s.players[me];
        const before = memberCount(s, p);
        const had = new Set(p.members);
        const turns0 = turnsQueued(s);
        s.slots[`${o.q}-${o.i}`] = me;
        p.left -= 1;
        const qid = s.quadrants[o.q];
        for (const c of ctx.membersOf(p)) for (const id of [c.def.id, c.copy].filter(Boolean)) defById(id).afterAction?.(ctx, p, c, qid);
        actionAt(s, o.q, o.i).resolve(ctx, p);
        const moreBuys = s.queue.filter((t) => t.t === "buy" && t.p === me && !t.extra).length;
        const moreTurns = Math.max(0, turnsQueued(s) - turns0);
        settle2(s, ctx);
        const gained = p.members.filter((u) => !had.has(u)).reduce((a, u) => a + abilityValue(cardDef(s, u), placesLeft, opts.k), 0);
        v = marginOf(evaluate(s, buysAt(s, 1 + moreBuys + moreTurns), incomeAt(s, moreTurns), roundLeft, { [me]: gained }, opts.future), me, opts.spite);
        if (opts.noMembers && memberCount(s, p) > before) v -= 100;
      } catch {
        v = -50 + actionAt(state, o.q, o.i).estimate(contextFor(state), state.players[me]);
      }
      out.push({ o, v: v + rand() * (opts.noise ?? 0.3) });
    }
  } else if (pend.kind === "buy" || pend.kind === "pay") {
    const valueOf2 = (what, spend) => {
      try {
        const s = lightClone(state);
        const ctx = contextFor(s);
        const p = s.players[me];
        const extraAbility = {};
        const turns0 = turnsQueued(s);
        const full = Object.fromEntries(s.resources.map((r) => [r, spend[r] || 0]));
        if (what.uid !== void 0) {
          ctx.recruit(p, what.uid, { free: false, spend: full });
          settle2(s, ctx);
          extraAbility[me] = abilityValue(cardDef(s, what.uid), placesLeft, opts.k);
        } else if (what.tier) {
          const tier = TIERS.find((t) => t.key === what.tier);
          for (const r of s.resources) p.res[r] -= full[r];
          p.bonus += tier.get;
          if (tier.limited) s.stock[tier.key] -= 1;
        }
        const moreTurns = Math.max(0, turnsQueued(s) - turns0);
        return marginOf(evaluate(s, buysAt(s, moreTurns), incomeAt(s, moreTurns), roundLeft, extraAbility, opts.future), me, opts.spite);
      } catch {
        return -1e6;
      }
    };
    const releaseValue = (uid) => {
      try {
        const s = lightClone(state);
        const p = s.players[me];
        const def = cardDef(s, uid);
        refundInto(s, p, uid);
        p.members = p.members.filter((u) => u !== uid);
        return marginOf(evaluate(s, buysAt(s, 1), incomeAt(s), roundLeft, { [me]: -abilityValue(def, placesLeft, opts.k) }), me, opts.spite) - 0.5;
      } catch {
        return -1e6;
      }
    };
    const ways = (what) => {
      const all = what.uid !== void 0 ? paymentChoices(state, state.players[me], what.uid) : followerChoices(state, state.players[me], TIERS.find((t) => t.key === what.tier));
      const first = all.slice(0, opts.payWays ?? PAY_WAYS);
      if (all.length <= first.length) return first;
      const spare = surplus(state, me);
      const over = (v) => state.resources.reduce((a, r) => a + Math.max(0, (v[r] || 0) - spare[r]), 0);
      const extra = [...all.slice(first.length)].sort((a, b) => over(a) - over(b)).slice(0, SURPLUS_WAYS);
      return [...first, ...extra];
    };
    if (pend.kind === "pay") {
      const what = pend.uid !== void 0 ? { uid: pend.uid } : { tier: pend.tier };
      const pays = pend.options.filter((o) => o.kind === "pay").slice(0, opts.payOptions ?? Infinity);
      for (const o of pays) out.push({ o, v: valueOf2(what, o.spend) + (o.default ? 0.01 : 0) });
    } else {
      for (const o of pend.options) {
        if (!["card", "tier", "pass"].includes(o.kind)) continue;
        if (opts.noMembers && o.kind === "card") continue;
        if (o.kind === "release") {
          out.push({ o, v: releaseValue(o.uid) + rand() * buyNoise });
          continue;
        }
        if (o.kind !== "pass" && o.kind !== "card" && o.kind !== "tier") continue;
        let v;
        if (o.kind === "pass") v = valueOf2({}, {});
        else v = Math.max(-1e6, ...ways(o.kind === "card" ? { uid: o.uid } : { tier: o.tier }).map((w) => valueOf2(o.kind === "card" ? { uid: o.uid } : { tier: o.tier }, w)));
        if (o.kind === "card") v += memberBias;
        out.push({ o, v: v + rand() * buyNoise });
      }
    }
  }
  return out.sort((a, b) => b.v - a.v);
}
function refundInto(s, p, uid) {
  const back = releaseRefund(s, uid);
  if (back.color) {
    p.res[back.color] = (p.res[back.color] || 0) + back.n;
    return;
  }
  for (let k = 0; k < back.n; k++) {
    const c = s.resources.reduce((a, b) => (p.res[b] || 0) < (p.res[a] || 0) ? b : a);
    p.res[c] = (p.res[c] || 0) + 1;
  }
}
function releaseOption(state, opts) {
  const pend = state.pending;
  const unused = (uid) => {
    const c = state.cards[uid];
    return !c.used && [c.def, c.copy].some((id) => id && defById(id).activate);
  };
  const rels = pend.options.filter((o) => o.kind === "release" && !unused(o.uid));
  if (!rels.length) return null;
  const me = pend.player;
  const { turns: turns2, roundLeft } = horizon(state);
  const lt = laterTurns(state);
  const buys = state.players.map((_, i) => turns2[i] + lt.turns + (i === me ? 1 : 0));
  const income = turns2.map((t) => t * INCOME[state.round - 1] * (opts.income ?? INCOME_SCALE) + lt.income * (opts.income ?? INCOME_SCALE));
  const placesLeft = turns2[me] + lt.turns;
  const base = marginOf(evaluate(lightClone(state), buys, income, roundLeft, {}, opts.future), me, opts.spite);
  let best = null, bestV = base + 1;
  for (const o of rels) {
    try {
      const s = lightClone(state);
      const p = s.players[me];
      const def = cardDef(s, o.uid);
      refundInto(s, p, o.uid);
      p.members = p.members.filter((u) => u !== o.uid);
      const v = marginOf(evaluate(s, buys, income, roundLeft, { [me]: -abilityValue(def, placesLeft, opts.k) }, opts.future), me, opts.spite);
      if (v > bestV) {
        bestV = v;
        best = o;
      }
    } catch {
    }
  }
  return best;
}
function buyShortcut(state, opts = {}) {
  const pend = state.pending;
  return useOption(state, pend, contextFor(state), state.players[pend.player]) || releaseOption(state, opts);
}
function chooseNormalMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const move = (o) => ({ player: pend.player, option: o.id });
  switch (pend.kind) {
    case "setup":
      return setupPick(pend, rand);
    case "place":
      return move(scoreOptions(state, rand, opts)[0].o);
    case "buy": {
      const p = state.players[pend.player];
      const short = buyShortcut(state, opts);
      if (short) return move(short);
      const ranked = scoreOptions(state, rand, opts);
      return move(ranked.length ? ranked[0].o : pend.options.find((o) => o.kind === "pass"));
    }
    case "pay": {
      const ranked = scoreOptions(state, rand, opts);
      return ranked.length ? move(ranked[0].o) : followUp(pend, rand);
    }
    default:
      return followUp(pend, rand);
  }
}

// src/v4/motion.js
var SPEEDS = { quick: 0.5, steady: 1, relaxed: 1.55 };
var DEFAULT_SPEED = "steady";
var KEY = "patrons.v4.motionSpeed";
var urlSpeed = () => {
  try {
    const q2 = new URLSearchParams(globalThis.location?.search || "");
    const v = q2.get("speed");
    if (v && SPEEDS[v]) return v;
    if (q2.get("botDelay")) return "quick";
  } catch {
  }
  return null;
};
function readSpeed() {
  const u = urlSpeed();
  if (u) return u;
  try {
    const v = globalThis.localStorage && localStorage.getItem(KEY);
    if (v && SPEEDS[v]) return v;
  } catch {
  }
  return DEFAULT_SPEED;
}
var speed = readSpeed();
var subs = /* @__PURE__ */ new Set();
var applyCss = () => {
  try {
    if (typeof document !== "undefined") document.documentElement.style.setProperty("--mo-scale", String(SPEEDS[speed]));
  } catch {
  }
};
applyCss();
var speedScale = () => SPEEDS[speed] ?? 1;
function setMotionSpeed(s) {
  if (!SPEEDS[s] || s === speed) return;
  speed = s;
  try {
    localStorage.setItem(KEY, s);
  } catch {
  }
  applyCss();
  for (const fn of subs) fn(s);
}
var BASE = {
  /** the wheel turning to its next quarter (arrow key, swipe, fling, settle after a drag) */
  spin: 300,
  /** hover cards: open at once, close a beat after the pointer leaves (HoverCards.jsx) */
  hoverOpen: 0,
  hoverClose: 150,
  /** a keyword's tip (Info.jsx): a hair of intent, so sweeping across a sentence doesn't flash every term */
  tipOpen: 50,
  /** the chosen space lights before anything moves (the selection, made obvious) */
  select: 140,
  /** a minion travels from its slot in the seat to the space (it shows on the space as it lands) */
  minionFly: 380,
  /** a member acknowledges that it's acting (a hop) before what it gives leaves it */
  hop: 200,
  /** a recruited card lifts off the shop and flies to its new owner's crowd, which then glows */
  cardFly: 420,
  chipGlow: 500,
  /** every gain and payment: one piece per unit flies from its source to where it lands, this far apart (flight.js) */
  pieceFly: 340,
  pieceStagger: 55,
  pieceMax: 10,
  pieceBump: 240,
  /** in a chain, the next step starts when this much of the one before has played (overlap, never all at once) */
  overlap: 0.7,
  /** a chain holds its end a moment before the next thing happens */
  chainHold: 220,
  /** the cards left in the shop slide to their new places */
  shopSlide: 260,
  /** a new card is dealt off the deck into its slot (per card, plus a stagger) */
  deal: 340,
  dealStagger: 50,
  /** a new round sends the wheel's minions home (per minion, plus a stagger) */
  minionsHome: 380,
  minionsHomeStagger: 35,
  /** a number counting up or down: base + per step, capped (Tick.jsx; the round summary passes its own) */
  tickBase: 300,
  tickPer: 30,
  tickMax: 550,
  /** a seat's members and leader react to what just happened (CultSeat.jsx) */
  react: 900,
  /** the "Nothing you can afford" toast waits for your recruit to land */
  afterFlight: 420,
  /** the Reckoning's prize token, plaque to winner (its pacing is the Reckoning's own) */
  reckonToken: 640,
  /** a new kind of step ignores a second press near the first for this long (the double-tap guard) */
  stepLock: 400,
  /** the same option twice within this is one double-click */
  doubleClick: 350
};
var SHOW = /* @__PURE__ */ new Set([
  "select",
  "minionFly",
  "hop",
  "cardFly",
  "chipGlow",
  "pieceFly",
  "pieceStagger",
  "pieceBump",
  "chainHold",
  "shopSlide",
  "deal",
  "dealStagger",
  "minionsHome",
  "minionsHomeStagger",
  "tickBase",
  "tickPer",
  "tickMax",
  "react",
  "afterFlight",
  "reckonToken"
]);
var TABLE = {
  //            quick  steady  relaxed
  ownStamp: [100, 140, 180],
  // your minion stands in the door at once, then settles
  trail: [140, 180, 240],
  // your minion's trail from the column
  minionFly: [240, 380, 560],
  // a rival's minion flight
  readHold: [60, 160, 320],
  // after a rival places: which space, before anything flies
  pulse: [50, 90, 140],
  // a source about to give
  hop: [120, 180, 260],
  // a member acts
  lead: [40, 80, 120],
  // hop or pulse → first piece leaves
  tug: [60, 90, 140],
  // a stack being taken from
  pieceStagger: [35, 60, 90],
  bundleTrail: [20, 30, 45],
  fan: [25, 40, 60],
  // groups, colors, seats in one beat
  settle: [140, 180, 240],
  roll: [160, 240, 360],
  // a bundle's number rolling on landing
  cardLift: [80, 120, 160],
  rivalBuyHold: [0, 0, 160],
  // a rival's buy: the card stays lifted while its coins fly in (the telegraph)
  passHold: [150, 300, 500],
  // a turn-ending pass with nothing to show
  cardFly: [260, 380, 560],
  ring: [200, 260, 340],
  worthHop: [180, 240, 340],
  // a new member's worth, chip → follower count
  accept: [100, 160, 240],
  // a rate or space's press-pop in an exchange
  swap: [280, 420, 620],
  shopSlide: [180, 240, 320],
  deal: [220, 300, 420],
  dealStagger: [30, 40, 60],
  breath: [80, 180, 360],
  // between one player's turn and the next
  minionsHome: [260, 340, 480],
  minionsHomeStagger: [20, 30, 45],
  incomeSeat: [120, 200, 320]
};
var IDX = { quick: 0, steady: 1, relaxed: 2 };
var MO = {};
for (const k of /* @__PURE__ */ new Set([...Object.keys(BASE), ...Object.keys(TABLE)])) {
  Object.defineProperty(MO, k, {
    enumerable: true,
    get: () => TABLE[k] ? TABLE[k][IDX[speed] ?? 1] : SHOW.has(k) ? Math.round(BASE[k] * speedScale()) : BASE[k]
  });
}
function flightMs(d) {
  const x = Math.max(0, d || 0);
  if (speed === "quick") return Math.round(Math.min(280, Math.max(160, 120 + 0.18 * x)));
  if (speed === "relaxed") return Math.round(Math.min(640, Math.max(380, 280 + 0.45 * x)));
  return Math.round(Math.min(440, Math.max(260, 200 + 0.3 * x)));
}
var nextBeatAt = (flight) => speed === "quick" ? flight * 0.5 : speed === "relaxed" ? flight + 60 : flight * (2 / 3);

// src/v4/art/icons/calibration.js
var calibration_default = [{ "id": "gold.jv", "name": "Kickback", "kind": "action", "sphere": "gold", "px": ["........................", "........................", ".....3322...............", "....332222..............", "...32222222.............", "...32222222.....332.....", "...22222221....32222....", "...22222221....22222....", "....222211.....22221....", ".....2211.......221.....", "........................", "...........lll..........", "..........lllll.........", ".3222223lllllllldmmmmmm.", ".2222223mmmmlllldmmmmmm.", ".2222223lllllllldmmmmmm.", ".2222223mmmmlllldmmmmmm.", ".2222223lllllllldmmmmmm.", ".1111113mmmmlllldmmmmdd.", "........lllllll.........", "........................", "........................", "........................", "........................"] }, { "id": "gold.strike", "name": "Double Down", "kind": "action", "sphere": "gold", "px": ["........................", "........................", "........................", "..mml...................", "...dmmml................", ".....dmmmml.............", ".......dmmmml...........", "........1ddmmml.........", "........1d..dmml........", ".......1d.....dml...l...", ".......1d....l.dml.lll..", "......1d....lll.ml..l...", "......1d.....l...m......", ".....1d........33322....", ".....1d......3l332222...", "....1d......3333222221..", "....1d.....33332222221..", "...1d.....322222222211..", "...1d.....322222122211..", "..1d......222221222111..", "..1d.......22221222111..", "............211111111...", "........................", "........................"] }, { "id": "thieves.pickpocket", "name": "Help Yourself", "kind": "action", "sphere": "magenta", "px": ["........................", "..............111111....", "..............111111....", "..............333333....", "............32222222....", "...........322222222....", ".........32222222221....", ".........2222222211.....", ".........22122122.......", ".........22122122.......", ".mmmmmmmm22122122mm.....", ".ddddlldd22122122dd.....", ".dddlllmd22122122dd.....", ".dddllllllllllllddd.....", ".dddmmmmmmmmmmmmddd.....", ".dddmmmmmmmmmmmmddd.....", ".dddmmmmmmmmmmmmddd.....", ".dddmmmmmmmmmmmmddd.....", ".ddddmmmmmmmmmmdddd.....", ".dddddmmmmmmmmddddd.....", ".dddddddmmmmddddddd.....", ".dddddddddddddddddd.....", ".dddddddddddddddddd.....", "........................"] }, { "id": "thieves.heist", "name": "Poach", "kind": "action", "sphere": "magenta", "px": ["........................", "..............111111....", "..............111111....", "..............333333....", "............322222222...", "...........3222222221...", "..........32222222211...", "..........222222211.....", "..........221.21........", "........llll.21.........", ".......llllll2..........", ".......lllllm...........", "........lllm............", "....lllllllllllm........", "...llllllllllllmm.......", ".....lllllllllm.........", "......llllllmm..........", "......llllllmm..........", ".....llll..lllm.........", "....lllll..llllm........", "........................", "........................", "....kkkkkkkkkkkk........", "........................"] }, { "id": "echo", "name": "Echo", "kind": "action", "sphere": "green", "px": ["........................", "........................", ".......32...............", ".......2232.............", ".......22322.....1......", ".......22.222....11.....", ".......22..222...1.1....", ".......22...22...1..1...", ".......22...22...1..1...", ".......22..22....1.1....", ".......22.2......1......", ".......22........1......", ".......22.....1111......", ".......22....11111......", ".......22....11111......", "..3322222.....111.......", ".332222222..............", ".322222222..............", ".222222221..............", "..2222221...............", "...22111................", "........................", "........................", "........................"] }, { "id": "toast", "name": "Toast", "kind": "action", "sphere": "silver", "px": ["........................", "........................", "........................", "...........ll...........", "......l...llll...l......", "...........ll...........", "....llllllll............", "...322222221............", "...322222221llllllll....", "...322222211322222221...", "....3222211.322222221...", ".....22211..322222211...", "......221....3222211....", "......21......22211.....", "......21.......221......", ".....21.........21......", ".....21.........21......", ".....21..........21.....", "...322221........21.....", "..1111111........21.....", "...............322221...", "...............1111111..", "........................", "........................"] }, { "id": "banker", "name": "Banker", "kind": "member", "sphere": "gold", "px": ["........................", "........................", ".......dddddd...........", "......dmmddddd..........", "......dmdddddd..........", "......dddddddd..........", "....dddddddddddd........", "......llllllll..........", "......llllllll..........", "......lllkllkl..........", "......llllllll...llll...", ".......llllll.....dd....", "........llll.....llll...", "....2222llll222kllllll..", "...222222ll222kllllllll.", "..233222211222klll322ll.", "..232222211222kll32222l.", "..222222222221kll22222m.", "..222222222221kll22221m.", "..222222222221klll221mm.", "..2222222222211klllmmm..", "..22222222222211kmmmm...", "..222222222222211k......", "........................"] }, { "id": "tycoon", "name": "Tycoon", "kind": "member", "sphere": "gold", "px": ["........................", "........................", ".......dddddd...........", ".......dmdddd...........", ".......dmdddd...........", ".......dddddd...........", ".......222222...........", ".....dddddddddd.........", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", "......lllddddl..........", ".......llllll.....3333..", "...22222llll2222k233332.", "..2222222ll22222k111111.", ".233222221122222k322222.", ".232222211112222k111111.", ".222222211112221k322222.", ".222222231132221k111111.", ".222222213312221k322222.", ".222222211112221k111111.", ".222222211112211k322222.", ".222222211112211k111111.", "........................"] }, { "id": "cutpurse", "name": "Cutpurse", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", ".........32.............", "........3222............", ".......322222...........", "......32222222..........", ".....322dddd222.........", ".....22dlllld22.........", ".....221l11l122.........", ".....22dlllld22.........", ".....22dllkld22.........", "......22dlld22..........", ".....2222222222.........", "....222222222222222ll...", "...3222222222221111ll...", "..32222122222221...d....", "..2222212222222....d....", "..222221222222211.llll..", "..22222122222221.llllll.", "..22222122222221.lllllm.", "..2222212222222l.lllllm.", "..2222212222222l..lmmm..", "..2222212222221l........", "........................"] }, { "id": "doppelganger", "name": "Doppelganger", "kind": "member", "sphere": "red", "px": ["........................", "........................", "...............llllll...", "....dddddd....llllllll..", "...dddddddd...llllllll..", "...dlllllld...llkllkll..", "...llkllkll...llllllll..", "...llllllll...lllkklll..", "...lllkklll....llllll...", "....llllll.......dd.....", ".....llll........dd.....", "..322llll222....llll....", ".32222ll22222222llll....", ".222221122222211.dd.....", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", ".222222222222211........", "........................"] }];

// src/v4/art/icons/batch-blue-white-green-purple.js
var batch_blue_white_green_purple_default = [{ "id": "market.bargain", "name": "Bargain", "kind": "action", "sphere": "blue", "px": ["........................", "........................", "..........3322..........", ".........332222.........", "........33222222........", ".......3322kk2222.......", "......322222222221......", "......322222222221......", "......32222ll22221......", "......3222llll2221......", "......3222llll2221......", "......32llllllll21......", "......32llllllll21......", "......322llllll221......", "......3222llll2221......", "......322llllll221......", "......322ll22ll221......", "......32lll22lll21......", "......322222222221......", "......322222222221......", "......211111111111......", "........................", "........................", "........................"] }, { "id": "market.restock", "name": "Restock", "kind": "action", "sphere": "blue", "px": ["........................", "..............md........", "..............md........", ".............md.........", ".............md.........", "............md..........", "............md..........", "...........md...........", "...........md...........", "..........md............", "..........md............", "......ddddddddd.........", "......mmmmmmmmm.........", ".....32222222221...lll..", ".....32212212221...lll..", "....3222122122221..lmm..", "....3221221221221.......", "...322212212212221..lll.", "...322122122122121..lll.", "..32221221221221221.lmm.", "..2.2.2.2.2.2.2.2.2.....", "........................", "........................", "........................"] }, { "id": "market.showroom", "name": "Showroom", "kind": "action", "sphere": "blue", "px": ["........................", "........................", "....l......32...........", "...lll....3322..........", "....l....332222...l.....", "........3l222222........", ".......3ll2222221.......", "......332222222211......", ".......2222222211..l....", "........22222111..lll...", ".........222111....l....", "..........2111..........", "...........11...........", "........................", "....mmmmmmmmmmmmmmmm....", "....dddddddddddddddd....", "......mmlmmmmmmmmd......", "......mmlmmmmmmmmd......", "......mmlmmmmmmmmd......", "......mmlmmmmmmmmd......", "....mmmmmmmmmmmmmmmm....", "....dddddddddddddddd....", "........................", "........................"] }, { "id": "market.clearance", "name": "Clearance", "kind": "action", "sphere": "blue", "px": ["........................", "........................", "..................mm....", ".................mml....", "................mml.....", "...............mml......", "..............lmm.......", "...........dddmlmmm.....", ".3333333333dkd33llmmm...", ".3l2l2l2l2ldddl21.llmm..", ".3222222222ddd221...ll..", ".3l22222222dkd221.......", ".3222222222ddd221.......", ".3l2222222222l221.......", ".3222222222222221.......", ".3l2l2l2l2l2l2l21.......", ".2111111111111111.......", "........................", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "market.pricecheck", "name": "Price Check", "kind": "action", "sphere": "blue", "px": ["........................", "............mmmmm.......", "..........mm33333dd.....", ".........m3ll333333d....", ".........m3l3333333d....", "........m33333333333d...", ".....332m33333333333d...", "....3322m33333333333d...", "...33kk2m33333333333d...", "..332222m33333333333d...", "..3222222m333333333d....", "..3222222d333333333d....", "..32222222dd33333dd.....", "..3222222221ddddd.md....", "..3222222221......mdd...", "..3222222221.......mdd..", "..3222222221........mdd.", "..3222222221.........md.", "..3222222221............", "..2111111111............", "........................", "........................", "........................", "........................"] }, { "id": "market.spree", "name": "Spree", "kind": "action", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "........lllll...........", "........llllm..llll.....", ".mmm....llllm..lllm.ll..", "...m....mmmmm..mmmm.ll..", "...mm333333333333333333.", ".....222122212221222121.", ".....22212221222122221..", "......1111111111111111..", "......221222122212221...", ".......21222122212221...", ".......1111111111111....", ".......mmmmmmmmmmmmm....", ".......dd........dd.....", ".......dd........dd.....", "........................", "........................", "........................", "........................", "........................"] }, { "id": "market.stylist", "name": "Stylist", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........ddd....lm....ml.", "......ddddddd..lm....ml.", ".....ddddmddd...lm..ml..", "....dddddddd....lm..ml..", "....dddddddd.....lmml...", "....dlllllld.....mkkm...", "....llllllll..3322.3322.", "....lllkllkl..3kk2.3kk2.", "....llllllll..2kk1.2kk1.", ".....llllll...2211.2211.", "......llll....lll.......", "..3222llll2222lll.......", ".322222ll2222222........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.onlooker", "name": "Onlooker", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", ".....dddddd.............", "....dddddddd............", "...3322..3322...........", "..322221322221..........", "..2dddd22dddd1..........", "..2d3dd22d3dd1..........", "..2dddd12dddd1..........", "...1111ll1111...........", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.connoisseur", "name": "Connoisseur", "kind": "member", "sphere": "blue", "px": ["........................", "........................", ".....................l..", ".................32.....", "......dddd...l..3322....", ".....ddmmdd....3l2222...", "....dddddddd..33222221..", "....dlllllld...222211...", "....llllllll....2211....", "....lllkllkl.....11.....", "....llllllll....l.ll....", ".....llllll.....llll....", "......llll......llll....", "..3223llll322222222.....", ".322223ll322221.........", ".23322211222221.........", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "market.reseller", "name": "Reseller", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "......1111..............", ".....322222.............", "....32222222............", "....11111111............", "....llllllll............", "....llllllll............", "....lllkllkl............", "....llllllll..mmmm32mmm.", ".....llllll...lmmm22mmd.", "......llll....lmmm22mmd.", "..3222llll2222332233221.", ".322222ll2222llmmm22mmd.", ".233222112222llmmm22mmd.", ".2322222222222lmmm21mmd.", ".2222222222222dddd11ddd.", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.curator", "name": "Curator", "kind": "member", "sphere": "blue", "px": ["........................", "........................", ".......dd...............", "......dddd...mmmmmmmmmm.", ".......dd....m33333l33d.", ".....dddddd..m3333lll3d.", "....dddddddd.m333333l3d.", "....dlllllld.m22333332d.", "....llllllll.m22223322d.", "....lllkllkl.m22222222d.", "....llllllll.m11222111d.", ".....llllll..m11111111d.", "......llll...dddddddddd.", "..3223llll32lll.........", ".322223ll322lll.........", ".23322211222221.........", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "market.planner", "name": "Planner", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", ".................3221...", ".....dddddd....mmm11mmm.", "....ddmddddd...mllllllm.", "....dlllllld...mlkkkllm.", "....llllllll...mllllllm.", "....lllkllkl...mlkkkklm.", "....llllllll...mllllllm.", ".....llllll....mlkkkllm.", "......llll.....mllllllm.", "..3222l11l222lllddddddd.", ".32222l11l222lll........", ".23322211222221.........", ".23222211222221.........", ".22222211222221.........", ".22222211222221.........", ".22222221222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.underbidder", "name": "Underbidder", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", ".................3322...", "................3llll1..", "................3lkkl1..", ".....111111.....2lkkl1..", "....32222222222.2llll1..", "....1111111111...2111...", "....llllllll......dd....", "....lllkllkl......dd....", "....llllllll......dd....", ".....llllll.....lll.....", "......llll......lll.....", "..3222llll2222.222......", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", "........................"] }, { "id": "market.minimalist", "name": "Minimalist", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "..................ll....", "....dddddddd.....lmmd...", "....llllllll......dd....", "....llllllll.....lmm....", "....lllkllkl....lmmmd...", "....llllllll.....ddd....", ".....llllll.....lmmmm...", "......3222.....lmmmmmd..", "..322322221222..ddddd...", ".322222ll22222llllllll..", ".23322211222222lllllll..", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.climber", "name": "Social Climber", "kind": "member", "sphere": "blue", "px": ["........................", "................3....3..", "................322223..", "................2....2..", "................2lll.2..", "................3lll23..", ".....dddddd.....22l..2..", "....dddddddd...22....2..", "....dlllllld..22322223..", "....llllllll....2....2..", "....lllkllkl....2....2..", "....llllllll....322223..", ".....llllll.....2....2..", "......llll......2....2..", "..3222llll2222..322223..", ".322222ll222221.2....2..", ".23322211222221.2....2..", ".23222222222221.322223..", ".22222222222221.2....2..", ".22222222222221.2....2..", ".22222222222221.322223..", ".22222222222221.2....2..", ".22222222222211.1....1..", "........................"] }, { "id": "market.auctioneer", "name": "Auctioneer", "kind": "member", "sphere": "blue", "px": ["........................", "........................", ".............dd32222dd..", ".............dd22222dd..", ".............dd11111dd..", ".....dddddd.....md......", "....dddmdddd....md......", "....dlllllld...md.......", "....llllllll..llmd......", "....lllkllkl..llll......", "....llllllll..lll.......", ".....llllll...222.......", "......llll...22.........", "..322ddkkdd222..........", ".322223ll322221.........", ".23322211222221.........", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "market.sommelier", "name": "Sommelier", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "...............ll....ll.", "...............l3222221.", ".....dddddd....l2222221.", "....dddkdddd....222221..", "....dlllllld.....2211...", "....llllllll......mm....", "....lllkllkl......mm....", "....llllllll....llmm....", ".....llllll...ll.lmmm...", "......llll...llll.......", "..3222llll2222..........", ".32222mllm22221.........", ".2332m2112m2221.........", ".2322llllll2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2211.........", ".2222lllllm2211.........", "........................"] }, { "id": "market.patroness", "name": "Patroness", "kind": "member", "sphere": "blue", "px": ["........................", "...............ll.......", "......32222...lll.......", ".....3222222.llm........", ".332222222222ll.........", "..11111111111l1.........", "...dd......dd...........", "...dlllllllld...........", "...dlllllllld...........", "...dlllkllkld...........", "..ddlllllllldd..........", ".....llllll.............", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.blackmarket", "name": "Black Market", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "......111111............", "......1dddd1............", ".....11111111...........", "...111111111111.........", "....dddddddd............", "....llllllll............", "....lllkllkl....ll......", "....llllllll...lll......", ".....llllll...222.......", "....33llll21.2211111....", "..3223llll22222111111...", ".322222ll2222221l1311...", ".2332221122222211111l1..", ".232222222222221311111..", ".2222222222222211l1111..", ".222222222222221111111..", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "market.snob", "name": "Snob", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "......dddd..............", ".....dddddd.............", "....dddddddd............", "....llllllll............", "....lllllmmm............", "....lllklmkm.....l......", "....lllllmmmm...3l3333..", ".....llllll.m..l32222l..", "......llll.....l2222ll..", "..3223llll3222..2221....", ".322223ll322221mmmmmmm..", ".233222112222ll.........", ".232222212222ll.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "market.recluse", "name": "Recluse", "kind": "member", "sphere": "blue", "px": ["........................", ".................mmm....", "........32......md.md...", ".......3322.....md..m...", "......332222....md......", ".....33222222...md......", "....3322222221..md......", "....32llllll21..md......", "....32lkllkl21..md......", "....32llllll21..md......", "....321llll121..md......", "....3221111221.llll.....", "...322222222122llll.....", "..3222111122222.md......", ".322222ll222221.md......", ".23322211222221.md......", ".23222222222221.md......", ".22222222222221.md......", ".22222222222221.md......", ".22222222222221.md......", ".22222222222221.md......", ".22222222222211.md......", ".22222222222211.md......", "........................"] }, { "id": "trading.haggle", "name": "Haggle", "kind": "action", "sphere": "white", "px": ["........................", "........................", ".................ll.....", "..............ll.ll.ll..", "..............ll.ll.ll..", "..............ll.ll.ll..", "..............ll.ll.ll..", "..............ll.ll.ll..", "..............ll.ll.ll..", ".............lllllllll..", "......3....ll.llllllll..", "....33232..llllllllllm..", "...3222222.lllllllllm...", "..322222221.llllllllm...", "..322222221..lllllllm...", "..322222221..llllllm....", "..322222221...lllllm....", "...2222221...1111111....", "....21211....2222221....", "......1......2222221....", ".............2222221....", ".............2222211....", "........................", "........................"] }, { "id": "trading.buylow", "name": "Buy Low", "kind": "action", "sphere": "white", "px": ["........................", "........mmmmmmmm........", ".......md......md.......", "....llmd...ll...mdll....", "....llmd...ll...mdll....", "........................", "...llll...llll...llll...", "..llllll.llllll.llllll..", "..llllll.llllll.llllll..", "..llllll.llllll.llllll..", "..11111131111113111111..", "...212121212121212121...", "...121212121212121211...", "....2121212121212121....", "....1212121212121211....", ".....21212121212121.....", ".....11111111111111.....", "........................", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "trading.pawn", "name": "Pawn", "kind": "action", "sphere": "white", "px": ["........................", "........................", ".mm.....................", ".mmmmmmmmmmmmmmmmmmmm...", ".dddddddddddddddddddd...", ".mm.....................", "......m....m....m.......", "......m....m....m.......", "....3122...m..3122......", "...31l122..m.31l122.....", "...321221..m.321221.....", "...222221..m.222221.....", "...222211....222211.....", "....2111......2111......", ".........3122...........", "........31l122..........", "........321221..........", "........222221..........", "........222211..........", ".........2111...........", "........................", "........................", "........................", "........................"] }, { "id": "trading.sellhigh", "name": "Sell High", "kind": "action", "sphere": "white", "px": ["........................", "...........dd...........", "..........dmmd..........", ".mmmmm.....md...........", ".ddddmmmm..md...........", ".m.lldmddmmmd...........", ".m.ll.m..ddmdmmmm.......", ".mllllm....mdddddmmmm...", ".mllllm....md....dddd...", ".ml..lm....md...m....m..", ".312211....md...m....m..", "..1111.....md...m3321m..", "...........md...m2211m..", "...........md...m3321m..", "...........md...m2211m..", "...........md...m3321m..", "...........md...m2211m..", "...........md..32222221.", "...........md...111111..", "...........md...........", ".......mmmmmmmmmm.......", ".......dddddddddd.......", "........................", "........................"] }, { "id": "trading.dividend", "name": "Dividend", "kind": "action", "sphere": "white", "px": ["........................", "..........3122..........", ".........322221.........", ".........222221.........", ".........222211.........", "..........2111..........", "....3122.........3122...", "...322221.......322221..", "...222221.......222221..", "...222211.......222211..", "....2111.........2111...", ".....m.....m......m.....", ".....m.....m......m.....", "........................", "........................", "...ll......ll......ll...", "..llll....llll....llll..", "..llll....llll....llll..", "...ll......ll......ll...", ".llllll..llllll..llllll.", ".llllll..llllll..llllll.", ".llllll..llllll..llllll.", ".mmmmmmmmmmmmmmmmmmmmmm.", "........................"] }, { "id": "trading.boom", "name": "Boom", "kind": "action", "sphere": "white", "px": ["........................", "...................l....", "..................lll...", ".............l...l.l.l..", "..................3121..", "..................2221..", ".........l........2221..", "........lll.......2221..", ".........l...3221.2221..", ".............2221.2221..", ".............2221.2221..", ".............2221.2221..", "........3221.2221.2221..", "........2221.2221.2221..", "........2221.2221.2211..", "........2221.2211.2211..", "...3221.2211.2211.2211..", "...2221.2211.2211.2211..", "...2211.2211.2211.2211..", "...2211.2211.2211.2211..", "...2211.2211.2211.2211..", "..mmmmmmmmmmmmmmmmmmmm..", "........................", "........................"] }, { "id": "trading.shopkeeper", "name": "Shopkeeper", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "................ll......", "................ll......", ".....dddddd.............", "....dddddddd......dd....", "....dlllllld......dd....", "....llllllll.....3322...", "....lllkllkl...33222221.", "....llllllll...32222221.", ".....llllll....22222211.", "......llll.....dddddddd.", "..3221llll1222..mmmmmm..", ".32222mllm2221llll......", ".2332m1111m222111.......", ".2321llllll1221.........", ".2221lllllm2221.........", ".2221lllllm2221.........", ".2221lllllm2221.........", ".2221lllllm2221.........", ".2221lllllm2211.........", ".2221lllllm2211.........", "........................"] }, { "id": "trading.dealer", "name": "Dealer", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "................klllll..", "................klllll..", ".....dddddd..lllklklkll.", "...3322222221llkklkkkll.", "...111111111.lkkkllkkll.", "....ddlllldd.llkklllklk.", "....lllkllkl.lllklllkll.", "....llllllll.lllklllkll.", ".....llllll..lllll..kll.", "......llll....llllll....", "..3221llll1221lllll.....", ".322221ll12222111.......", ".23322211222221.........", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "trading.pawnbroker", "name": "Pawnbroker", "kind": "member", "sphere": "white", "px": ["........................", "........................", "..................33....", ".................3223...", "......dddd........mm....", ".....dddddd......m..m...", "....dddddddd....m....m..", "....dlllllld....m....m..", "....lllllddl.....m..m...", "....lllkldkl......mm....", "....llllllll....ll.l....", ".....llllll....lllll....", "......llll.....lllll....", "..3221llll1222.111......", ".322221ll122221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.safetynet", "name": "Safety Net", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "........................", ".....d.dd.d....mmmmm....", "....dddddddd..mmmmmmm...", "....dddddddd.32mmmmmm2..", "....dlllllld3221...m221.", "....llllllll121.....321.", "....lllkllkl121.....321.", "....llllllll121.....321.", ".....llllll.322m...3221.", "......llll...1mmmmmm21..", "..3221llll11llllmmmmm...", ".322221ll121llllmmmm....", ".23322211222111.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.tipster", "name": "Tipster", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "...............lllllll..", ".....111111....lkkkllm..", "....32222222221lllllll..", "....1111111111.lkklkkm..", "....llllllll...lllllll..", "....llllllll...lkkkkkm..", "....lllkllkl...lllllll..", "....llllllll...mmmmmmm..", ".....llllll...lll.......", "......llll...llll.......", "..3221llll121llll.......", ".322221ll1222111........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.lender", "name": "Lender", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "........................", "........................", ".....dddddd.............", "....dddddddd..mmmmmmmm..", "....ddlllldd...llllll...", "....llllllll...lkkkkl...", "....lllkllkl...llllll...", "....llllllll...lkkkll...", ".....llllll....lll11l...", "......llll.....ll1221...", "..3221l11l1211mmmm11mm..", ".32221l11l11lll.........", ".23322111121lll.........", ".23222211222111.........", ".22222211222221.........", ".22222211222221.........", ".22222221222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.magnate", "name": "Magnate", "kind": "member", "sphere": "white", "px": ["........................", "....................mm..", "...................m.m..", "...................mm...", "........................", "......llll........mmm...", ".....llmmll......mm.m...", "...ddlllllldd.....mm....", "...dlllllllld...........", "....lllkllkl............", "....llllllddmmmmmml.....", ".....llllldddddddd......", "...321llll122222........", "..322211112222221.......", ".32222222k22222221......", ".2322222222222221.......", ".2222222k22222221.......", ".2222222222222221.......", ".222222k222222221.......", ".2222222222222211.......", ".2222222222222211.......", ".2222222222222211.......", ".2222222222222211.......", "........................"] }, { "id": "trading.shareholder", "name": "Shareholder", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "..................333...", "................3.2222..", ".....dddddd...332.22222.", "....dddddddd.3222.22222.", "....dddddddd32222.22222.", "....dlllllld32222.22222.", "....dllkllk322222.......", "....dllllll12222m222221.", ".....llllll.3mmmmm2221..", "......llll..mmmmmm2221..", "..3221llll122mmmmm221...", ".322221ll1221llllmd1....", ".233222112221lllld......", ".23222221222211.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "trading.heiress", "name": "Heiress", "kind": "member", "sphere": "white", "px": ["........................", "......3..3..3...........", "......1..3..3...........", ".....1l1331l1...........", ".....3122221............", ".....dddddd.............", "....dddddddd............", "....dlllllld............", "....dlllllld............", "...ddllkllkdd...........", "...ddlllllldd...........", "...ddlllllldd...........", "...d..llll..d...........", "..3221llll1122..........", ".3221l1lll1l121.........", ".23321211121221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.bulkbuyer", "name": "Bulk Buyer", "kind": "member", "sphere": "white", "px": ["........................", "........................", "..............lll1lll...", "..............mmm1mmd...", "..............mmm2mmd...", ".....dddddd...ddd1ddd...", "....dddddddd...lll1lll..", "...1111111111..mmm2mmd..", "....llllllll...mmm2mmd..", "....lllkllkl...mmm2mmd..", "....llllllll...ddd1ddd..", ".....llllll...llll1lll..", "......llll....mmmm2mmd..", "..3221llll1221mmmm2mmd..", ".322221ll1221lmmmm2mmd..", ".233222112221lmmmm2mmd..", ".2322222222221dddd1ddd..", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.broker", "name": "Broker", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "........................", ".............mmmd.......", ".....dddddd.mmmmd.......", "....ddddmddddddd........", "....dlllllld..mmll......", "....llllllll..mmll......", "....lllkllkl..mmll......", "....llllllll..mm11......", ".....llllll.mmm22.......", "......llll..dddd........", "..3221l11l1222...m......", ".32221l11l12221...m.....", ".23322111122221..m......", ".23222211222221...m.....", ".22222211222221..m......", ".22222211222221...m.....", ".22222221222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.exporter", "name": "Exporter", "kind": "member", "sphere": "white", "px": ["........................", "................333.....", "...............3...1....", ".......11.......321.....", ".....122221...3322211...", "....12222222..2222211...", "....11111111.....21.....", "....llllllll.....11.....", "....llllllll...llll.....", "....lllkllkl...llll.....", "....llllllll.....11.....", ".....llllll......21.....", "......llll.......21.....", "..3221llll1222...21...1.", ".322221ll122222..21..11.", ".233222112222222.21.11..", ".23222222222221222211...", ".22222222222221.2211....", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.liquidator", "name": "Liquidator", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "........................", "....d.d.d.d.........33..", "....dddddddd.......3322.", "....dddddddd.....332222.", "....dlllllld...33222222.", "....llllllll.3322222222.", "....lllkllkl12222222222.", "....llllllll12222222222.", ".....llllll..11dd222222.", "......llll.....dd222222.", "..3221llll1222.ll112222.", ".322221ll122221ll..1111.", ".23322211222221.....11..", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "trading.reinvestor", "name": "Reinvestor", "kind": "member", "sphere": "white", "px": ["........................", "........................", "........................", "......1111...........l..", ".....122221........l....", "..3222222222221......l..", "...11111111111..........", "....1111111111.mmmm..11.", "....llllllll.ll....m21..", "....lllkllkl.ll....21...", "....llllllll.1132222..1.", ".....llllll..3222222.21.", "......llll...3222222211.", "..3221llll1222222222211.", ".322221ll12222222222211.", ".233222112222211111111..", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "trading.raider", "name": "Raider", "kind": "member", "sphere": "white", "px": ["........................", "...dd........dd.........", "...ddd.dddd.ddd.........", "...dddddlldddddd........", "....dddddkkdddd.........", ".....3333333333.........", ".....11111111...........", "....llllkkll............", "....kkkkllll............", "....lkkkllkl............", "....llllllll............", ".....llllll.............", "......llll..............", "..3221llll1222..........", ".322221ll122221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.hum", "name": "Hum", "kind": "action", "sphere": "green", "px": ["........................", "........................", ".......32...............", ".......2232........22...", ".......22322....2..21...", ".......22.22....22..31..", ".......22..2.2..21..31..", ".......22...22...1...1..", ".......22....31..31..1..", ".......22..2.31..31..31.", ".......22.2...1..31..31.", ".......22.....1..31..31.", ".......22....31..31..31.", ".......22....31..31..1..", ".......22...31...1...1..", "..3322222....1..31..31..", ".332222222......31..31..", ".322222222......1..31...", ".222222221.........31...", "..2222221...............", "...22111................", "........................", "........................", "........................"] }, { "id": "echo.chant", "name": "Chant", "kind": "action", "sphere": "green", "px": ["........................", ".......33...............", ".......223..............", ".......2.2.....33.......", ".......2.......223......", ".....322.......2.2......", "....32222......2........", "....2221.....322........", "............32222.......", "............2221........", "........................", "....llllll..llllll......", "...lllllllkllllllll.....", "..lmmmmmllklmmmmmll.....", "..lllllllklllllllll.....", "..lmmmmlllklmmmllll.....", "..lllllllklllllllll.....", "..lmmmmmllklmmmmmll.....", ".3222222222222222221....", "..111111111111111111....", "........................", "........................", "........................", "........................"] }, { "id": "echo.echo", "name": "Echo", "kind": "action", "sphere": "green", "px": ["........................", "........................", ".......32...............", ".......2232.............", ".......22322.....1......", ".......22.222....11.....", ".......22..222...1.1....", ".......22...22...1..1...", ".......22...22...1..1...", ".......22..22....1.1....", ".......22.2......1......", ".......22........1......", ".......22.....1111......", ".......22....11111......", ".......22....11111......", "..3322222.....111.......", ".332222222..............", ".322222222..............", ".222222221..............", "..2222221...............", "...22111................", "........................", "........................", "........................"] }, { "id": "echo.encore", "name": "Encore", "kind": "action", "sphere": "green", "px": ["........................", "...........ll...........", ".....l............l.....", "........l......l........", "........................", ".........ll..ll.........", "........lll..lll........", ".......llkl..lkll.......", "......llkll..llkll......", ".....llkllk..kllkll.....", "....lllllkl..lklllll....", "...lllllll....lllllll...", "...llllll......llllll...", "...lllll........lllll...", "..3222l..........l2221..", "..3222............2221..", "..2221............3222..", "..2221............3222..", "..2211............3322..", "........................", "........................", "........................", "........................", "........................"] }, { "id": "echo.refrain", "name": "Refrain", "kind": "action", "sphere": "green", "px": ["........................", "........................", "...........33...........", "........33322333........", "......333111111222......", ".....33111222211122.....", "....3311331111221122....", "....3113111221112112....", "...321311322222112121...", "...3112132llll2212111...", "...312112llllll211211...", "..3212122llkkll2212121..", "..3212122llkkll2212121..", "...312112llllll211211...", "...3112122llll2212111...", "...321211222222112121...", "....2112111221112111....", "....2211221111221121....", ".....22111222211121.....", "......222111111211......", "........11122111........", "...........11...........", "........................", "........................"] }, { "id": "echo.eternity", "name": "Eternity", "kind": "action", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "............l...........", "...........lll..........", ".....3333...l..3333.....", "...33222222..33222222...", "..32221122223222112222..", "..3221..22223221..2222..", ".3221....223221....2221.", ".321......3321......321.", ".321......3321......321.", ".3222....322222....3221.", "..2222..32212222..3221..", "..22223322212222332221..", "...22222211..22222211...", ".....1111......1111.....", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "echo.evergreen", "name": "Evergreen", "kind": "member", "sphere": "green", "px": ["........................", "..................32....", ".................3221...", "................322221..", ".................3221...", ".....dddddd.....322221..", "....dddddddd...32222211.", "....dlllllld....322221..", "....dlllllld...32222221.", "....dllkllkd..322222211.", "....llllllll...22222111.", ".....llllll.......dd....", "......llll......mmmmmm..", "..3222llll2222llmmmmmd..", ".322222ll22222ll.mmmd...", ".23322211222221..dddd...", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.choir", "name": "Choir", "kind": "member", "sphere": "green", "px": ["........................", "........................", "..................33....", "..................223...", "..................2.2...", ".....dddddd.......2.....", "....dddddddd....322.....", "....dlllllld...32222....", "....llllllll...2221.....", "....lllkllkl....11......", "....llllllll............", ".....llkkll.............", "......llll..............", "..lmlmlmlmlmlm..........", ".lmlmlmlmlmlmlm.........", ".2mmmmmmmmmmmm1.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.muse", "name": "Muse", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "...............3......3.", "..32........23.32....23.", "...3223d32d32..mmmmmmmm.", "..32dddddddd21.22.l.l22.", "....dlllllld...22.l.l22.", "....dlllllld...22.l.l22.", "...ddllkllkdd..22.l.l22.", "...ddlllllldd..22.l.l22.", "...d.llllll.d...222222..", "......llll.......2111...", "..3222llll2222.lll......", ".322222ll222221lll......", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.understudy", "name": "Understudy", "kind": "member", "sphere": "green", "px": ["........................", ".3221322132.............", ".3221322132.............", ".3221322132.............", ".3221322132.............", ".3221322132ddddd........", ".3221322132dddddd.......", ".3221322132llllld.......", ".3221322132llllll.......", ".3221322132lkllkl.......", ".3221322132llllll.......", ".3221322132lllll........", ".3221322132llll.........", ".3221322132lllll2222....", ".3221322132llll222221...", ".32213221322211222221...", ".32213221322222222221...", ".32213221322222222221...", ".32213221322222222221...", ".32213221322222222221...", ".32213221322222222221...", ".32213221322222222211...", ".32213221322222222211...", "........................"] }, { "id": "echo.ensemble", "name": "Ensemble", "kind": "member", "sphere": "green", "px": ["........................", "........................", "...dddd..........mmmm...", "..dddddd........mmmmmm..", "..llllll........llllll..", "..lkllkl.dddddd.lkllkl..", "..llllllddddddddllllll..", "...llll.dlllllld.llll...", "........llllllll........", ".1111111lllkllkl1111111.", ".1111111llllllll1111111.", ".1111111.lllkkl.1111111.", ".1111111..llll..1111111.", ".1111113222llll22221111.", ".1111132222ll2222221111.", ".1111333222211222222111.", ".1111322222222222222111.", ".1111222222222222222111.", ".1111222222222222222111.", ".1111222222222222221111.", ".1111222222222222221111.", ".1111222222222222221111.", ".....2222222222222211...", "........................"] }, { "id": "echo.groupie", "name": "Groupie", "kind": "member", "sphere": "green", "px": ["........................", "........................", "..............md3222222.", "..............md322221..", "..............md32221...", ".....dddddd...md3221....", "....dddddddd..md321.....", ".ddddlllllldddmd21......", ".ddddlllllllddmd........", "..ddlllkllklddmd........", "....llllllll..md........", ".....llllll...md........", "......llll...llll.......", "..3222llll222llll.......", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.translator", "name": "Translator", "kind": "member", "sphere": "green", "px": ["........................", "..............llllllll..", "..............lkkklkkl..", ".....mmmmmm...llllllll..", "....m......m..lkklkkkl..", "....mddddddm..llllllll..", "....mddddddm...ll.......", "..mmdlllllldmml.........", "..ddlllllllldd..3222222.", "..ddlllkllkldd.32l2l2l2.", "....llllllll...22222221.", ".....llllll.....2111111.", "......llll..........21..", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.tuningfork", "name": "Tuning Fork", "kind": "member", "sphere": "green", "px": ["........................", "........................", "................lm..lm..", "..............2.lm..lm2.", "..............2.lm..lm2.", ".....dddddd.....lm..lm..", "....dddddddd..2.lm..lm2.", "....dlllllld..2.lm..lm2.", "....llllllll....lmmmmm..", "....lllkllkl.....lmmm...", "....llllllll......md....", ".....llllll.......md....", "......llll......llll....", "..3222llll222222llll....", ".32222mllm22221.........", ".2332m2112m2221.........", ".2322llllll2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2211.........", ".2222lllllm2211.........", "........................"] }, { "id": "echo.wallflower", "name": "Wallflower", "kind": "member", "sphere": "green", "px": ["........................", "........................", "................3.2.2...", "................32222...", "................32221...", ".....dddddd.....22221...", "....dddddddd.....221....", "....dddddddd......1.....", "....dlllllld......122...", "....llllllll......12....", "....llkllkll......1.....", ".....llllll......llll...", "......llll.......llll...", "..3222llll2222.22.......", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.keepsake", "name": "Keepsake", "kind": "member", "sphere": "green", "px": ["........................", "........................", ".............lll........", ".............lll........", ".....d.dd.d..lllm.......", "....dddddddd.222.m......", "....dddddddd.222m.......", "....dlllllld.222.m......", "....llllllll..22m.......", "....lllkllkl..22.32.32..", "....llllllll..223222222.", ".....llllll...222222221.", "......llll.....2.22221..", "..3222llll2222....221...", ".322222ll222221....1....", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.mirror", "name": "Mirror", "kind": "member", "sphere": "green", "px": ["........................", "................32221...", "...............3llll31..", "...............2l3lll1..", "...............2ll3ll1..", ".....dddddd....2lll3l1..", ".ddddddddddd...2llll31..", ".ddddlllllld...22llll1..", "..ddllllllll....2111....", "..d.lllkllkl.....md.....", "....llllllll.....md.....", ".....llllll......md.....", "......llll......llll....", "..3222llll222222llll....", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.afterimage", "name": "Afterimage", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", ".....dddddd33333333.....", "....dddddddd3333333.....", "....dlllllld33k33k3.....", "....llllllll3333333.....", "....lllkllkl333333......", "....llllllll............", ".....llllll3333333333...", "......llll333333333333..", "..3222llll222233333333..", ".322222ll2222213333333..", ".233222112222213333333..", ".232222222222213333333..", ".222222222222213333333..", ".222222222222213333333..", ".222222222222213333333..", ".222222222222213333333..", ".222222222222113333333..", ".22222222222211.........", "........................"] }, { "id": "echo.hourglass", "name": "Hourglass", "kind": "member", "sphere": "green", "px": ["........................", "........................", "...............mmmmmmm..", "...............d22222d..", "...............dl222ld..", "...............d.l2l.d..", "....m......m...d..l..d..", "...mmllllllmm..d.l2l.d..", "....llllllll...dl222ld..", "....lllkllkl...d22222d..", "....llllllll...mmmmmmm..", ".....llllll....lllll....", "......llll.....lllll....", "..3223llll322222........", ".322223ll322221.........", ".23322211222221.........", ".23222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222221.........", ".22222221222221.........", ".2222222k222211.........", ".22222221222211.........", "........................"] }, { "id": "echo.dejavu", "name": "D\xE9j\xE0 Vu", "kind": "member", "sphere": "green", "px": ["........................", "..............22222222..", "..............2......2..", "..............2.2222.2..", ".....d.dd.d...2.2..2.2..", "....dddddddd..2.2.22.2..", "....dddddddd..2.2....2..", "....dlllllld..2.222222..", "....llkkllll..2.........", "....lllkllkl............", "....llllllll............", ".....llllll.............", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "echo.chronicler", "name": "Chronicler", "kind": "member", "sphere": "green", "px": ["........................", "....................321.", "....................321.", "..................33m11.", "..................33m11.", ".....mmmmmm......33m11..", "....mmmmmmmm.....33m11..", "....mllllllm....33m11...", "....llllllll....33m11...", "....lllkllkl...33m11....", "....mmmmmmmm...33m11....", ".....mmmmmm.....m.......", "......mmmm....lll.......", "..3222lmml2222lll.......", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.hourly", "name": "Hourly", "kind": "action", "sphere": "purple", "px": ["........................", "........................", "..........3333..........", ".......3332222332.......", "......322222222222......", ".....322lllmllll222.....", "....322llllklllll222....", "...322lllllkllllll222...", "...32llllllklllllll21...", "...32llllllklllllll21...", "..322llllllklllllll221..", "..322mllllldkkkkllm221..", "..322llllllllllllll221..", "..322llllllllllllll221..", "...32llllllllllllll21...", "...32llllllllllllll21...", "...222llllllllllll221...", "....222llllllllll221....", ".....222lllmllll221.....", "......222222222221......", ".......2112222111.......", "..........1111..........", "........................", "........................"] }, { "id": "purple.catchup", "name": "Catch Up", "kind": "action", "sphere": "purple", "px": ["........................", "........................", "........................", "..ll....................", "..llll..................", "...lllll................", "....3322m...............", "...32222l...............", "...322222l..............", "...32222kll1............", "...322222kll1...........", "...3222222kll11.........", "...32222222kll2221......", "...322222222222222221...", "...3222222222222222221..", "...llllllllllllllllllll.", "...mmmmmmmmmmmmmmmmmmmd.", "........................", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "purple.windup", "name": "Wind-up", "kind": "action", "sphere": "purple", "px": ["........................", "........................", "....3322......3322......", "...332222....322221.....", "..33222222..32222211....", "..322222222232222221....", "..222222222222222221....", "..222222222222222211....", "...2222221..22222211....", "....22111....22111......", "...........md...........", "...........md...........", "...........md...........", "...........md...........", "......33333333333.......", ".....3222222222222......", "....322222kkkk222221....", "....322222222222221.....", "....222222222222211.....", ".....1111111111111......", "........................", "........................", "........................", "........................"] }, { "id": "purple.planahead", "name": "Plan Ahead", "kind": "action", "sphere": "purple", "px": ["........................", "........................", "......mm...mm...mm......", "......dd...dd...dd......", "...333mm333mm333mm333...", "...322222222222222221...", "...222222222222222211...", "...lllmlllmlllmlllmlm...", "...lllmlllmlllmlllmlm...", "...lllmlllmlllmlllmlm...", "...mmmmmmmmmmmmmmmmmm...", "...lllm222mlllmlllmlm...", "...lllm222mlllmlllmlm...", "...lllm222mlllmlllmlm...", "...mmmmmmmmmmmmmmmmmm...", "...lllmlllmlllm222mlm...", "...lllmlllmlllm222mlm...", "...lllmlllmlllm222mlm...", "...mmmmmmmmmmmmmmmmmm...", "...dddddddddddddddddd...", "........................", "........................", "........................", "........................"] }, { "id": "purple.overtime", "name": "Overtime", "kind": "action", "sphere": "purple", "px": ["........................", "........................", "..........l.......lll...", ".........ll......ll.....", ".........l3l.....l......", "........l33l.....l......", "........l33l.....ll.....", ".........ll.......lll...", "..........k.............", ".......322221...........", ".......322221...........", ".......3222211..........", ".......322221...........", ".......322221...........", ".......322221...........", ".......322221...........", ".......322221...........", ".......222211...........", ".....mmmmmmmmmmmm.......", "....mmmmmmmmmmmmmmdd....", ".....dddddddddddd.......", "........................", "........................", "........................"] }, { "id": "purple.rally", "name": "Rally", "kind": "action", "sphere": "purple", "px": ["........................", "....ll..................", "....md3333331333333.....", "....md3222221222222222..", "....md322222122222222...", "....md32222212222222....", "....md3222221222222.....", "....md32222212222222....", "....md322222122222222...", "....md3222221222222222..", "....md1111111111111111..", "....md..................", "....md..................", "....md..................", "..llll..................", "..llll..................", "..2222..................", "..2222..................", "..222d..................", "....md..................", "....md..................", "....md..................", "........................", "........................"] }, { "id": "purple.secondwind", "name": "Second Wind", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "..............1...22222.", "..............11..2222..", "..............111.222...", ".....dddddd...111122....", "....dddddddd..1111l3333.", "....33333333.....223333.", "....llllllll....222.333.", "....lllkllkl...2222..33.", "....llllllll..22222...3.", ".....llllll.......md....", "......llll........md....", "..3222llll2222..llll....", ".322222ll2222222llll....", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.errand", "name": "Errand Runner", "kind": "member", "sphere": "purple", "px": ["........................", "....................ll..", "...................llm..", "...................lml..", ".....322222.....3.lml...", "....32222222...332llm...", "....1111111111.322lml...", "....dlllllld....2.ll....", "....llllllll..3l3l3l3l1.", "....lllkllkl..322222221.", "....llllllll..322222221.", ".....llllll.ll322222221.", "......llll..ll322222221.", "..3222llll2222322222221.", ".322222ll22222322222211.", ".2332221122222222222211.", ".2322222222222111111111.", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.taskmaster", "name": "Taskmaster", "kind": "member", "sphere": "purple", "px": ["........................", ".................mm.....", ".................dd.....", "................3333....", "...............322222...", "....dddddddd..32llll22..", "....dddddddd.32llklll21.", "....llllllll.32llklll21.", "....lkkklkkl.32llkkll21.", "....lllkllkl.32llllll21.", "....llllllll..22llll21..", ".....llllll....222221...", "......llll......1111....", "..3222llll2222.llll.....", ".322222ll222222llll.....", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.lateriser", "name": "Late Riser", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "......33322.............", ".....3322222............", "....332222222222........", "...32222222222221.......", "...2222222222.2221......", "...1111111111..2ll......", "....llllllll...lll......", "....lkkllkkl....l.......", "....llllllll............", ".....llkkll.............", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.foreman", "name": "Foreman", "kind": "member", "sphere": "purple", "px": ["........................", "........................", ".......3322.............", "......322222............", ".....32222222...........", "...3322222221...........", "..111111111111..........", "....llllllll............", "....llllllll............", "....lllkllkl.22.........", "....llllllll22llllllll..", ".....llllll.22lllllllll.", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.courier", "name": "Courier", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "........................", "..............lllllllll.", "......3222....lklllllkl.", ".....322222...llkllklll.", "....32222222..lllk22lll.", "....1111111111lllll2lll.", "....dlllllld..lllllllll.", "....lllkllkl..mmmmmmmmm.", "....llllllll...lll......", ".....llllll....lll......", "......llll..............", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.apprentice", "name": "Apprentice", "kind": "member", "sphere": "purple", "px": ["........................", "................mm..mm..", "................mm..mm..", "................lmmmmd..", "....d.dd.d.......lmmd...", "....dddddddd......md....", "....dddddddd......md....", "....dlllllld......md....", "....llllllll......md....", "....lllkllkl......md....", "....llllllll....llll....", ".....llllll.....llll....", "......llll....222.......", "..3222llll2222..........", ".32222mllm22221.........", ".2332m2112m2221.........", ".2322llllll2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2211.........", ".2222lllllm2211.........", "........................"] }, { "id": "purple.overseer", "name": "Overseer", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "........................", "........................", ".....322222.............", "....32222222............", "...ddddddddd......m3222.", "....llllllll.m3222m2222.", "....lllllllddm2222m2222.", "....lllkllkddm1111m1111.", "....llllllll..lll.......", ".....llllll...lll.......", "......llll...22.........", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.doubletime", "name": "Double Time", "kind": "member", "sphere": "purple", "px": ["........................", ".....................d..", ".....................d..", "..................32dm..", "......dddd.......322mm..", ".....dddddd......3ld1...", "....dddddddd....3lld1...", "....ddllllld....3lld1...", "....dlllllld....3ldl21..", "....lllkllkl...3lldl21..", "....llllllll...3lldl21..", ".....llllll....3lldll21.", "......llll....3llldll21.", "..3222llll2222322222221.", ".322222ll222llddddddddd.", ".23322211222ll1.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.bookkeeper", "name": "Bookkeeper", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "........................", "........................", ".............dddddddddd.", ".....dddddd..m3232..32m.", "....ddmddddd.m2121mm21m.", "....dlllllld.m........m.", "....llllllll.m32..3232m.", "....lllkllkl.m21mm2121m.", "....llllllll.m........m.", ".....llllll..m..323232m.", "......llll...mmm212121m.", "..3222l11l222dddddddddd.", ".32222l11l22lll.........", ".23322211222lll.........", ".23222211222221.........", ".22222211222221.........", ".22222211222221.........", ".22222221222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.clockmaker", "name": "Clockmaker", "kind": "member", "sphere": "purple", "px": ["........................", "........................", ".................33.....", "..............32222222..", "..............22222222..", ".....dddddd...22211222..", "...mmllmmllmm3221..3221.", "....dlllllld.3221..3221.", "....llllllll..22233222..", "....lllkllkl..22222222..", "....llllllll..22222221..", ".....llllll......11.....", "......llll.....llll.....", "..3222llll22222llll.....", ".32222mllm22221.........", ".2332m2112m2221.........", ".2322llllll2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2221.........", ".2222lllllm2211.........", ".2222lllllm2211.........", "........................"] }, { "id": "purple.lamplighter", "name": "Lamplighter", "kind": "member", "sphere": "purple", "px": ["........................", ".................mm.....", ".............ll.m..m....", ".............lm.dddd....", ".....111111..2.dddddd...", "....32222222222m3ll3d...", "....1111111112.ml33ld...", "....llllllll.2.ml33ld...", "....llllllll.2.ml33ld...", "....lllkllkl.2.m3ll3d...", "....llllllll.2.dddddd...", ".....llllll..2..mmmm....", "......llll...2..........", "..3222llll2222..........", ".322222ll222221.........", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.nightowl", "name": "Night Owl", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "......3222..............", ".....322222...mm...mm...", "....32222222..mmmmmmm...", "....32222222..mllmllm...", "....11111111..mlkmklm...", "....llllllll..mmmdmmm...", "....lllkllkl..mmlllmm...", "....llllllll..mmlllmm...", "....llllllll..mmlllmm...", ".....llllll....mmmmm....", "......llll......d.d.....", "..3222llll2222.llll.....", ".322222ll222222llll.....", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.patience", "name": "Patience", "kind": "member", "sphere": "purple", "px": ["........................", "........................", ".....................m..", ".....................ml.", ".....322222.........m.l.", "....32222222........m.l.", "..311111111111.....m..l.", "....dlllllld.......m..l.", "....llllllll......m...l.", "....lkkllkkl......m...l.", "....llllllll.....m....l.", ".....llllll.....m.....l.", "......llll.....m.....32.", "..3222llll2222lll....21.", ".322222ll22222lll.......", ".23322211222221.........", ".23222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222221.........", ".22222222222211.........", ".22222222222211.........", "........................"] }, { "id": "purple.crew", "name": "Shift Crew", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "...............1111.....", "..............322222....", ".............32222222...", "......2222..1111111111..", ".....322222..llllllll...", "....32222222.lllkllkl...", "....d111111d11lllllll...", "....llllllll..llllll....", "....lllkllkl11111111111.", "....llllllll11111111111.", ".....llllll111111111111.", "......llll1111111111111.", "..3222llll2222111111111.", ".322222ll22222111111111.", ".2332221122222111111111.", ".2322222222222111111111.", ".2222222222222111111111.", ".2222222222222111111111.", ".2222222222222111111111.", ".2222222222222111111111.", ".22222222222211.........", "........................"] }, { "id": "blue.recruit", "name": "Blue Recruit", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".32222ll22221..lklkl....", ".233221122221...lll.....", ".232222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "blue.hand", "name": "Blue Hand", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".32222ll22221..lklkl....", ".233221122221...lll.....", ".232222222221..11111....", ".222222222221..11111....", ".111111111111..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "blue.helper", "name": "Blue Helper", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".33322ll22221..lklkl....", ".233321122221...lll.....", ".232332222221..11111....", ".222223322221..11111....", ".222222233221..11111....", ".222222222331..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "blue.regular", "name": "Blue Regular", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222.lll...lll..", ".32222ll2222lklkl.lklkl.", ".233221122221lll...lll..", ".2322222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222111111.11111.", ".2222222222111111.11111.", "........................"] }, { "id": "blue.devotee", "name": "Blue Devotee", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222.lll...lll..", ".32222mm2222lklkl.lklkl.", ".23323ll12221lll...lll..", ".2322111122211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222111111.11111.", ".2222222222111111.11111.", "........................"] }, { "id": "blue.elder", "name": "Blue Elder", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....mmmmmm..............", "...mmmmmmmm.............", "...mllllllm.............", "...llllllll.............", "...lllkllkl.....lll.....", "...llllllll....lklkl....", "....llllll......lll.....", ".....llll......11111....", "..322llll222...11111....", ".32222ll22221lll111lll..", ".23322112222lklkl1lklkl.", ".232222222221lll111lll..", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }, { "id": "blue.pillar", "name": "Blue Pillar", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd...lll...lll..", "...dddddddd.lklkl.lklkl.", "...dlllllld..lll...lll..", "...llllllll.11111.11111.", "...lllkllkl.11111.11111.", "...llllllll.1111lll1111.", "....llllll..111lklkl111.", ".....llll...1111lll1111.", "..322llll22211111111111.", ".32222ll222211111111111.", ".233221122221lll111lll1.", ".23222222222lklkl1lklkl.", ".222222222221lll111lll1.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }, { "id": "blue.patron", "name": "Blue Patron", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "...3..3..3..............", "...32323232.............", "........................", "....dddddd...lll...lll..", "...dddddddd.lklkl.lklkl.", "...dlllllld..lll...lll..", "...llllllll.11111.11111.", "...lllkllkl.11111.11111.", "...llllllll.1111lll1111.", "....llllll..111lklkl111.", ".....llll...1111lll1111.", "..322llll22211111111111.", ".32222ll222211111111111.", ".233221122221lll111lll1.", ".23222222222lklkl1lklkl.", ".222222222221lll111lll1.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }, { "id": "green.recruit", "name": "Green Recruit", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".32222ll22221..lklkl....", ".233221122221...lll.....", ".232222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "green.hand", "name": "Green Hand", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".32222ll22221..lklkl....", ".233221122221...lll.....", ".232222222221..11111....", ".222222222221..11111....", ".111111111111..11111....", ".222222222221..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "green.helper", "name": "Green Helper", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222....lll.....", ".33322ll22221..lklkl....", ".233321122221...lll.....", ".232332222221..11111....", ".222223322221..11111....", ".222222233221..11111....", ".222222222331..11111....", ".222222222221..11111....", ".222222222211..11111....", ".222222222211..11111....", "........................"] }, { "id": "green.regular", "name": "Green Regular", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222.lll...lll..", ".32222ll2222lklkl.lklkl.", ".233221122221lll...lll..", ".2322222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222111111.11111.", ".2222222222111111.11111.", "........................"] }, { "id": "green.devotee", "name": "Green Devotee", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd..............", "...dddddddd.............", "...dlllllld.............", "...llllllll.............", "...lllkllkl.............", "...llllllll.............", "....llllll..............", ".....llll...............", "..322llll222.lll...lll..", ".32222mm2222lklkl.lklkl.", ".23323ll12221lll...lll..", ".2322111122211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222211111.11111.", ".2222222222111111.11111.", ".2222222222111111.11111.", "........................"] }, { "id": "green.elder", "name": "Green Elder", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....mmmmmm..............", "...mmmmmmmm.............", "...mllllllm.............", "...llllllll.............", "...lllkllkl.....lll.....", "...llllllll....lklkl....", "....llllll......lll.....", ".....llll......11111....", "..322llll222...11111....", ".32222ll22221lll111lll..", ".23322112222lklkl1lklkl.", ".232222222221lll111lll..", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }, { "id": "green.pillar", "name": "Green Pillar", "kind": "member", "sphere": "green", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd...lll...lll..", "...dddddddd.lklkl.lklkl.", "...dlllllld..lll...lll..", "...llllllll.11111.11111.", "...lllkllkl.11111.11111.", "...llllllll.1111lll1111.", "....llllll..111lklkl111.", ".....llll...1111lll1111.", "..322llll22211111111111.", ".32222ll222211111111111.", ".233221122221lll111lll1.", ".23222222222lklkl1lklkl.", ".222222222221lll111lll1.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }, { "id": "green.patron", "name": "Green Patron", "kind": "member", "sphere": "green", "px": ["........................", "........................", "...3..3..3..............", "...32323232.............", "........................", "....dddddd...lll...lll..", "...dddddddd.lklkl.lklkl.", "...dlllllld..lll...lll..", "...llllllll.11111.11111.", "...lllkllkl.11111.11111.", "...llllllll.1111lll1111.", "....llllll..111lklkl111.", ".....llll...1111lll1111.", "..322llll22211111111111.", ".32222ll222211111111111.", ".233221122221lll111lll1.", ".23222222222lklkl1lklkl.", ".222222222221lll111lll1.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222211111111111.", ".2222222222111111111111.", ".2222222222111111111111.", "........................"] }];

// src/v4/art/icons/batch-gold-red-guests.js
var batch_gold_red_guests_default = [{ "id": "gold.rush", "name": "Golden Years", "kind": "action", "sphere": "gold", "px": ["........................", "........................", "........................", "........................", "........................", "........................", "..............3322......", "............33222222....", "...33333...3322222221...", "...22222...3221111221...", "..........322122221221..", ".33333333.322122221221..", ".22222222.322122221221..", "..........322122221221..", "...33333...2221111221...", "...22222...2222222211...", "............22222111....", "..............2111......", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "gold.discount", "name": "Intro Offer", "kind": "action", "sphere": "gold", "px": ["........................", "........................", "........................", "......32................", ".....3222...............", "....322222..............", "...32222222.............", "..3222222221............", "..3222kk2221............", "..3222kk2221......mmmm..", "..3222222221.....mm..mm.", "..3222222221.....mm..mm.", "..322lll2221......mmmm..", "..32222mlllll....mm.....", "..3222222mmllmmmm.......", "..32222mlllll....mm.....", "..322lll2221......mmmm..", "..3222222221.....mm..mm.", "..3222222221.....mm..mm.", "..3222222221......mmmm..", "..2222222211............", "..1111111111............", "........................", "........................"] }, { "id": "gold.steal", "name": "Collect Debts", "kind": "action", "sphere": "gold", "px": ["........................", "..............m.........", "..............m.........", "..............m.........", "..............m.........", "...........l..m.........", "...........m..m.........", ".........3.mmmm.2.......", "........322.dd.221......", ".........3222222........", "..........3dd21.........", ".........322221.........", ".......3322222221.......", "......322l22222221......", ".....322l2222222221.....", ".....32l22222222221.....", ".....3222222222222l.....", ".....3222222222222......", ".....22222222222221.....", ".....22222222222211.....", "......222222222211......", ".......1111111111.......", "........................", "........................"] }, { "id": "gold.windfall", "name": "Tithe", "kind": "action", "sphere": "gold", "px": ["........................", "........................", "........................", "........................", ".........3322...........", "..3322..322222..........", ".322222.322221...3322...", ".322221.222221..322222..", ".222221.222211..322221..", ".222211..2211...222221..", "..2211..........222211..", ".................2211...", "........................", ".........3322...........", "........322222..........", "........322221..........", "....l...222221..l.......", "....ll..222211.ll.......", "....llll.2211lllm.......", ".....lllllllllllm.......", "......mllllllllm........", ".......32221221.........", ".......32221221.........", "........................"] }, { "id": "gold.midas", "name": "Midas", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "......3..32..1...l.3.3..", "......32.32.21..l.3.3.3.", "......3l2232l1...l3.3.3.", "......32222221....32323.", "......dddddddd....32222.", "......llllllll....22222.", "......llllllll....22221.", "......lllkllkl.....221..", "......llllllll.....221..", ".......llllll.....3221..", "........llll......221...", "....2222llll2222.3221...", "...222222ll2222222221...", "..33222221122222221.....", "..32222221122222221.....", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.prospector", "name": "Prospector", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", "........dddd............", ".......ddkddd...........", ".......mmmmmm...........", "....dddddddddddd........", "......llllllll..........", "......lllkllkl..........", "......mllllllm..........", "......mmmllmmm..........", "......mmmmmmmm..........", ".......mmmmmm...........", "....2222mmmm2222........", "...222222mm222222.......", "..3322222222222l.mmmmmm.", "..32222222222lmmdd3dddm.", "..3222222222lmd32dd23dm.", "..32222222222lmdd2dd2m..", "..3222222222222lmmmmmm..", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.taxman", "name": "Tax Collector", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......ddd22ddd..........", "......ddddddddddd.......", "......llllllll..........", "......llllllll....332...", "......lllkllkl...32221..", "......llllkkll...22221..", ".......llllll.....211...", "........llll..kmlldddlm.", "....2222llll22klmmmmmmd.", "...222222ll222klmmmmmmd.", "..332222211222klmmmmmmd.", "..322222211222klmmmmmmd.", "..322222222222klmmmmmmd.", "..322222222222klmmmmmmd.", "..322222222222kdddddddd.", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.merchant", "name": "Merchant", "kind": "member", "sphere": "gold", "px": ["........................", "........................", ".................l......", "............mmmmmmmmmm..", "............m....d....m.", ".....dddddd.m....d....m.", "....dddddddd.m...d...m..", "....dddddddd3221.d.3221.", "....llllllll2211.d.2211.", "....llkllkll.....d......", "....llllllll.....d......", "....lddddddl.....d......", ".....llllll......d......", "......llll......ldl.....", "..2222llll2222..lll.....", ".222222ll22222.2221.....", ".32222211222222221......", ".3222221122222221.......", ".3222222222222221.......", ".3222222222222221.......", ".3222222222222221.......", ".3222222222222221.......", ".2222222222222211.......", "........................"] }, { "id": "gold.thrift", "name": "Penny Pincher", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........mmmm............", ".......mmllmm...........", "........mmmm............", "......mmmmmmmm..........", ".....mmllllllmm.........", ".....mllllllllm.........", ".....mllllllllm.........", "......lmkmmkml..........", "......llllllll..........", ".......llkkll....32.....", "........llll....321.....", "....2222llll2222.1......", "...222222ll222222kk.l...", "..3322222112222llllll...", "..322222211222llllllkl..", "..32222222222mlllllllmm.", "..322222222222lllllllmk.", "..3222222222222mmmmmm...", "..3222222222222mm1.mm...", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.coinpurse", "name": "Middleman", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "......dddddddd..........", ".....dddddddddd.........", ".....dddddddddd.........", ".....ddllllllld.........", ".....dlllllllld.........", ".....dlllkllkld.........", ".....dllllllld..........", ".....dd.llllll..........", "....dd...llll...........", ".........llll....l.l....", "....2222llll222kmmmmm...", "...222222ll222k3222222..", "..33222221122k32222222..", "..32222221122k32222221..", "..32222222222k22222221..", "..322222222222k222221...", "..3222222222222k1111....", "..32222222222222kk......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.underdog", "name": "Underdog", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", "........................", ".......dddddd...........", "......ddddddddddd.......", "......llllllll..........", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", ".......llllll...........", "........llll.....mmmm...", "....2222llll2222dmmmmd..", "...222222ll2222ddmmmmdd.", "..3322222112222ddkmmkdd.", "..3222222112222ddmllmdd.", "..32222222222222dlkkld..", "..322222222222221.llll..", "..322222222222221.2222..", "..322222222222221mmmmmm.", "..322222222222221mmmmmm.", "..322222222222221mmmmmm.", "..222222222222211mmmmmm.", "........................"] }, { "id": "gold.tinker", "name": "Tinker", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", ".......d.d.d.....mm.mm..", "......dddddddd...mm.mm..", "......mmmmmmmm...mmmmm..", "......mllmmllm....lm....", "......mmmmmmmm....lm....", "......llllllll....lm....", "......lllkllkl....lm....", "......llllllll....lm....", ".......llllll.....lm....", "........llll.....llll...", "....2222llll2222.llll...", "...222222ll222222.22....", "..3322222mmmm22222221...", "..322222mmmmmm222221....", "..322222mmmmmm22221.....", "..322222mmmmmm22221.....", "..322222mmmmmm22221.....", "..322222mmmmmm22221.....", "..322222mmmmmm22221.....", "..222222mmmmmm22211.....", "........................"] }, { "id": "gold.investor", "name": "Investor", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......dddddddd..........", "......llllllll..........", "......llllllll....32....", "......lllkllkl...3322...", "......llllllll..332222..", ".......llllll...322222..", "........llll....322221..", "....2222llll222k222221..", "...2222ldddl22mdmdmdmdm.", "..3322ll1d1ll22dmdmdmd..", "..322ll21d12ll22ddddd...", "..3222221d12222221......", "..3222222122222221......", "..3222222122222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.jackpot", "name": "Lottery Winner", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "......d.d.d.d....l...l..", "......ddddddd.....l.l...", ".....ddddddddd...l...l..", "......llllllll..........", "......lllkllkl..........", "......llllllll..3322....", "......lllkkkll.3222332..", ".......llkkll.322223222.", "........llll..222222221.", "....2222llll.mmmmmmmmmm.", "...222222ll22dmmmmmmmmd.", "..33222221122dmlmmmmmmd.", "..32222221122dmmmmmmmmd.", "..32222222222dmmmmmmmmd.", "..322222222222dmmmmmmd..", "..3222222222222dddddd...", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.speculator", "name": "Speculator", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", "......dddddddd..........", "......dddddddd..........", "....11111111111.........", ".....3333322222.........", "......llllllll..lllllm..", "......lllkllkl..lklklmm.", "......llllllll..llklllm.", "......lllllkkl..lklklmm.", ".......llllll...lllllmm.", "........llll.....mmmmm..", "....2222llll2222........", "...222222ll222222.......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.seed", "name": "Treasurer", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", "........llll............", ".......llllll......22...", "....mmmmmmmmmmmm..3221..", "......llllllll.33.221...", "......lllkllkl.3221.....", "......llllllll..2211....", "......lllllkkl....1.....", ".......llllll.....1.....", "........llll....3322....", "....2222llll222332222...", "...222222ll222k322221...", "..33222221122k2222221...", "..32222221122kl222211...", "..322222222222lllllll...", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "gold.hustler", "name": "Hustler", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddkdddd..........", "......22222222..........", "....dddddddddddd..mmmmm.", "......llllllll....mm2mm.", "......lllkllkk..llllllm.", "......llllllll..l2llllm.", "......llllllll..ll22llm.", ".......lllllll.l2222llm.", "........llll....ll22ll..", "....2222llll2222llllll..", "...222222ll22222llll2l..", "..3322222112222kllllll..", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.evenswap", "name": "Even Swap", "kind": "action", "sphere": "red", "px": ["........................", "........................", "........................", "........................", "...ll..............ll...", "..llll............llll..", "..lllm.......3....lllm..", "...lm...3333322....lm...", "........22222222........", "..lllm..1111121...lllm..", ".llllmm......1...llllmm.", ".llllmm..........llllmm.", ".l.lm.m...3......l.lm.m.", ".l.lm.m..3233333.l.lm.m.", "..llmm..22222222..llmm..", "..l..m...1211111..l..m..", "..l..m....1.......l..m..", ".ll..mm..........ll..mm.", ".322221..........322221.", ".222221..........222221.", ".111111..........111111.", "........................", "........................", "........................"] }, { "id": "red.turnout", "name": "Bandwagon", "kind": "action", "sphere": "red", "px": ["........................", "........................", ".mmmmmmmmmmmmmmmmmmmmmm.", ".32221..32221..32221..3.", "..221....221....221.....", "..21.....21.....21......", "...1......1......1......", "........................", "...llll..........llll...", "..llllll........llllll..", "..lllllm..llll..lllllm..", "...lllm..llllll..lllm...", ".lllllllklllllmllllllll.", ".lllllllm.lllm.kllllllm.", "..lllllkllllllllklllllm.", "..lllllklllllllmllllllm.", "..lllllmmllllllmlllllmm.", "..ll..lmmllllllmll..lmm.", ".lll..llmlllllmmll..llm.", ".........ll..lmm........", "........lll..llm........", "..33333333333333333333..", "..22222222222222222211..", "........................"] }, { "id": "red.hire", "name": "Open Door", "kind": "action", "sphere": "red", "px": ["........................", "........................", "........................", "........................", "........................", "................llll....", "...............llllll...", "...............lllllm...", "................lllm....", "..............llllllll..", "..............lllllllm..", ".3222..........llllllm..", ".32221lll......llllllm..", ".32221llllllllklllllmm..", ".32221llllllllkll..lmm..", ".32221lllkkkmmlll..llm..", ".32221lllllll...........", ".32221lllkkkm...........", ".32221lllllll...........", ".32221.llkkm............", ".2221...llm.............", "........................", "........................", "........................"] }, { "id": "red.hireup", "name": "Open House", "kind": "action", "sphere": "red", "px": ["........................", "..3322..................", ".322221.................", ".322221.................", ".222221...llll..........", "..2211...llllll.........", ".........lllllm..3322...", "..........lllm..322221..", "........llllllll322221..", "........lllllllm222221..", ".........llllllm.2211...", ".........llllllm........", ".........lllllmm........", "......l..ll..lmm........", "......lklll..llm........", "......llkkkllkkllll.....", ".......llllllllllllll...", "........mmmmllllmmmm....", ".........3222221........", ".........3222221........", ".........3222221........", ".........3222221........", ".........3222221........", "........................"] }, { "id": "red.trade", "name": "Swap Sides", "kind": "action", "sphere": "red", "px": ["........................", "........................", "...........32...........", "..........3221..........", ".322222222222222222221..", ".111111111111111111111..", "..m.m......32......m.m..", "..m.m......21......m.m..", "..m.m......21......m.m..", "..mlll.....21....lll.m..", "..lllll....21...lllllm..", "..mlll.....21....lll.m..", "..lllll....21...lllllm..", "..lllll....21...lllllm..", "..mlll.....21....lll.m..", ".kllkllkl..21..kllkllkl.", "..mmmmmm...21...mmmmmm..", "...mmmm....21....mmmm...", "...........21...........", "...........21...........", "........32222221........", ".......3222222221.......", ".......1111111111.......", "........................"] }, { "id": "red.take", "name": "Hand-pick", "kind": "action", "sphere": "red", "px": ["........................", "...........mm...........", "...........mm...........", "...........mm...........", ".........322221.........", "........32222221........", "........11111111........", ".......32..21..21.......", "......32...21...21......", ".....32...llll...21.....", ".....32..llllll..21.....", ".....32...llll...21.....", "......32.llllll.21......", ".......3kllllllk1.......", "..........llllm.........", ".........ll..lm.........", "........................", "........................", "....lll...lll...lll.....", "...lllll.lllll.lllll....", "....lll...lll...lll.....", "...lllll.lllll.lllll....", "...lllll.lllll.lllll....", "........................"] }, { "id": "red.twins", "name": "Twins", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", "........................", "........................", "....dddddd....dddddd....", "...dddddddd..dddddddd...", "...dddddddd..dddddddd...", "...dllllllld.dllllllld..", "...dlkllklld.dlkllklld..", "....llllll....llllll....", "....llkkll....llkkll....", ".....llll......llll.....", "..2222ll222k2222ll2222..", ".322222222k322222222221.", ".322222222k322222222221.", ".3lllllllll3llllllllll1.", ".322222222k322222222221.", ".322222222k322222222221.", ".3lllllllll3llllllllll1.", ".322222222k322222222221.", ".322222222k322222222221.", ".222222222k222222222211.", "........................"] }, { "id": "red.bigfamily", "name": "Big Family", "kind": "member", "sphere": "red", "px": ["........................", "........................", "...dddddd....dddddd.....", "..dddddddd..dddddddd....", "..dllllll...dlllllld....", "..dlkllkl...dlkllkld....", "..dllllll...dlllllld....", "...llllll...ddllllddd...", "....llll...ddd.ll.ddd...", ".....ll....322222222221.", "..22222222.322222222221.", ".322222222k322222222221.", ".32222222dddd2222222221.", ".3222222dddddd222222221.", ".3222222dllllld22222221.", ".3222222lkllkl222222221.", ".3222222llllll222222211.", ".3222222kllll...........", ".322222k32ll221.........", ".32222k3222222221.......", ".32222k3222222221.......", ".32222k3222222221.......", ".22222k2222222211.......", "........................"] }, { "id": "red.volunteer", "name": "Volunteer", "kind": "member", "sphere": "red", "px": ["........................", "...............l.l.l....", "...............l.l.l.l..", "...............lllllll..", "..............llllllll..", ".......d.d.d...llllll...", "......dddddddd..3221....", "......dddddddd..3221....", "......llllllll..3221....", "......lllkllkl..3221....", "......llllllll..3221....", "......llkkkkll..3221....", ".......llllll...3221....", "........llll...32221....", "....2222llll2222222.....", "...222222ll2222221......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.intern", "name": "Intern", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......ddddddd...........", "......dlllllll....l.....", "......llllllll...l......", "......lldkddkd....l.....", "......llllllll..mmmmm...", ".......llkkl...mmmmmmm..", "........llll....lllll...", "....2222llll222k32221...", "...222222ll2222k22221...", "..33222221122222lllll...", "..322222211222222lll....", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.mentor", "name": "Mentor & Prot\xE9g\xE9", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", ".....mmmmmm.............", "....mmmmmmmm............", "....mllllllm............", "....mllllllm............", "....llllllll............", "....lkkllkkl............", "....llllllll............", "....lmmmmmml............", ".....mmmmmm...dddd......", "......mmmm...dddddd.....", "..2222llll222dlllll.....", ".222222ll2222lkllkl.....", ".322222112222llllll.....", ".3222221122222llll......", ".32222222222kkkll..lll..", ".3222222222k32222llllm..", ".322222222k32222222221..", ".322222222k32222222221..", ".322222222k32222222221..", ".222222222k22222222211..", "........................"] }, { "id": "red.proselytizer", "name": "Proselytizer", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......dlllllll..........", "......llllllll.......3l.", "......lllkllkl.....333l.", "......llllllll...33332l.", "......llllllll.3332222l.", ".......llllll.22222222m.", "........llll..22222222m.", "........llll...1112222m.", "....2222kkkk2222.11111m.", "...222222ll222221..111m.", "..33222221122222221..1m.", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.mob", "name": "Mob", "kind": "member", "sphere": "red", "px": ["........................", "................m.m.m...", "................m.m.m...", "................m.m.m...", "................mmmmm...", "......d.d.d.d.....d.....", "......dddddddd....d.....", "......dddddddd....d.....", "......lkkllkkl....d.....", "......lllkllkl....d.....", "......llllllll....d.....", "......lkkkkkkl....d.....", ".......llllll....lll....", "........llll.....lll....", "....2222llll22222lll....", "...222222ll222222.d.....", "..3322222112222221d.....", "..3222222112222221d.....", "..3222222222222221d.....", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.recruiter", "name": "Recruiter", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......dd2222222.........", "......llllllll..........", "......llllllll..........", "......lllkllkl..........", "......llllllll...ddd....", "......lllkkkll.mmdddmm..", ".......llllll..mlllllm..", "........llll...mlkkklm..", "....2222llll222mlllllm..", "...222222ll2222mlkkllm..", "..3322222112222mlllllm..", "..3222222112222mlkkklm..", "..3222222222222mlllllm..", "..3222222222222mmmmmmm..", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.drive", "name": "Pied Piper", "kind": "member", "sphere": "red", "px": ["........................", "...............m........", "...............m3332222.", "...............m3l22221.", "...............mlll2221.", "...............m2l22221.", "...............ml2l2221.", "...............m2222111.", ".......llllll..m111.....", "......ll2222ll.m........", ".....llllllllllm........", "......llllllll.m........", "......lllkllkllll.......", "......llllllll.lll......", ".......llkkll..lll......", "........llll...m........", "....2222llll2222m.......", "...222222ll22222m.......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.host", "name": "Host", "kind": "member", "sphere": "red", "px": ["........................", ".........ll.............", ".........ll.............", ".........32.............", "........3l22............", "........32l21...........", ".......3l22l2...........", ".......322l221..........", "......dddddddd..........", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", "......llkkkkll..........", ".......llkkll...........", "........llll............", "....2222ddkdd222........", "...22222ddkdd22222......", "..3322222l12222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.sponsor", "name": "Sponsor", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......dddddddd..........", "......llllllll..........", "......llllllll..........", "......lllklmmm..........", "......llllmklm..........", "......llllmmmd..........", ".......lllllld..ll.ll...", "........llll..d..lll....", "....2222llll22k333l222..", "...222222ll222k111l111..", "..3322222112222k32l21...", "..3222222112222k32l21...", "..3222222222222k22l21...", "..3222222222222k21l11...", "..32222222222222kk......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.crowd", "name": "Crowd-Pleaser", "kind": "member", "sphere": "red", "px": ["........................", "..................32....", ".................3222...", "......d.d.d.d....2221...", "......ddddddd.....21....", ".....ddddddddd..........", "......llllllll.32.......", "......lllkllkl3222..32..", "......llllllll2221.3222.", "......lkllllkl.21..2221.", "......llkkkkll......21..", ".......llllll....l..l...", "........llll.....llll...", "....2222llll2222.lll....", "...222222ll22222.322....", "..33222221122222222.....", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "red.patriarch", "name": "Patriarch", "kind": "member", "sphere": "red", "px": ["........................", "..................mm....", ".................mllm...", ".................mmmm...", ".......llllll.....dd....", "......llllllll....dd....", "......mllllllm....dd....", "......llllllll....dd....", "......lllkllkl....dd....", "......llllllll....dd....", "......mmmmmmmm....dd....", "......mmmmmmmm....dd....", "......mmmmmmmm...lll....", "....22mmmmmmmm22.lll....", "...222mmmmmmmm22.ldd....", "..3322mmmmmmmm221.dd....", "..32222mmmmmm22221dd....", "..322222mmmm222221dd....", "..3222222mm2222221dd....", "..3222222222222221dd....", "..3222222222222221dd....", "..3222222222222221dd....", "..2222222222222211dd....", "........................"] }, { "id": "red.reserve", "name": "Benchwarmer", "kind": "member", "sphere": "red", "px": ["........................", "........................", "........................", "........lmmmm...........", "......llmmmmmmd.........", ".....lmmmmmmmmmd........", ".....mmmmmmmmmmd........", "....mmmmmmmmmmmmd.......", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", "......dlllllld..........", ".......dllllld..........", "........dlld............", "....2222llll2222........", "...222222ll222222.......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.squatter", "name": "Squatter", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", "........32..............", ".......3222.............", "......322222............", "......32222221..........", "......11111111..........", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", "......lmlmmlml..........", ".......mlmmlm...........", "........llll............", "....2222llll2222.lm.....", "...222222ll22222llmm....", "..33222221122222lldm....", "..3222222112222llldmm...", "..3222222222222llddmm...", "..322222222222llldddmm..", "..322222222222llddddmm..", "..32222222222llldddddmm.", "..2222222222222211......", "........................"] }, { "id": "benders.bigspender", "name": "Big Spender", "kind": "member", "sphere": "gold", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......ddddddd...........", "......dllllll...........", "......llllllll..........", "......kkkkkkkk..........", "......lkkklkkk.....mmm..", "......llllllll....m...m.", "......llkkkkll....lllll.", ".......llllll..mmmlllll.", "........llll..m...mllll.", "....2222llll2k32222llll.", "...222222ll22k32222mmmm.", "..33222221122k32222.....", "..32222221122k32221.....", "..32222222222k22221.....", "..32222222222k22111.....", "..322222222222kkkk......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.freelancer", "name": "Freelancer", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "..........d.............", "......dddddddd..........", ".....dddddddddd.........", "......dddddddd..........", "......llllllll......33..", "......llllllll.....322..", "......lllkllkl.....21...", "......llllllll....d.....", ".......llkkll....d......", "........llll...llllll...", "....2222llll22l22ll11l..", "...222222ll22ll22ll11ll.", "..33222221122llllllllll.", "..32222221122l33llllkkm.", "..32222222222l33llll.km.", "..322222222222llllllmm..", "..3222222222222llllmm...", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.insider", "name": "Insider", "kind": "member", "sphere": "blue", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......ddddddd.....lll...", "......llllllll...l...m..", "......llllllll...l...m..", "......lkkkkkkk....mmm...", "......lkkklkkk.....m....", "......llllllll.....m....", "....3.llllll.2.....mm...", "....32.lllll21.....m....", "....322.llll221....mm...", "....3222llll2221........", "...32222l11l22221.......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.extrahand", "name": "Extra Hand", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "........................", ".......222222...........", "......22222222..........", "......2222222222........", "......llllllll.....32...", "......llllllll....3222..", "......lllkllkl....2221..", "......llllllll.....21...", "......llkkkkll....3221..", ".......llllll....322221.", "........llll.....222211.", "....2222llll2222l...l...", "...222222ll22222lllll...", "..3322222112222lllllm...", "..32222221122222llmm....", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.frontrunner", "name": "Front-runner", "kind": "member", "sphere": "purple", "px": ["........................", "........................", "...............3322221..", "..............232222212.", ".......dddddd.2.32221.2.", "......dddddddd.2.3221.2.", "......llllllll...221....", "......llllllll....2.....", "......lllkllkl...222....", "......llllllll..11111...", "......lllkkkll...llll...", ".......llllll...lllll...", "........llll.....lll....", "....2222llll2222........", "...222222ll222222.......", "..3322222112222221......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }, { "id": "benders.straggler", "name": "Straggler", "kind": "member", "sphere": "purple", "px": ["........................", ".....................l..", "..................33222.", "........mmmm.....322l22.", ".......mmmmmm....3222l1.", "....mmmmmmmmmmm...2l221.", "......llllllll.....221..", "......lllkllkl....md....", "......llllllll....d.....", "......lmlmmlml...md.....", "......llllllll..md......", ".......lmmml...md.......", "........llll...d........", "....2222llll2md.........", "...222222ll22md.........", "..33222221122d222.......", "..3222222112222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..3222222222222221......", "..2222222222222211......", "........................"] }];

// src/v4/art/icons/batch-magenta-silver-yellow.js
var batch_magenta_silver_yellow_default = [{ "id": "thieves.tipoff", "name": "Tip-off", "kind": "action", "sphere": "magenta", "px": ["........................", "........................", ".............111111.....", ".............111111.....", ".............333333.....", "...........322222222....", "..........3222222221....", ".........32222222211....", ".........222222211......", "..lllllll221l21.........", "..lllllllllllll.........", "..lllllllllllll.........", "..llkkkkkkkkkll.........", "..lllllllllllll.........", "..llkkkkkkkkkll.........", "..lllllllllllll.........", "..llkkkkkkkllll.........", "..lllllllllllll.........", "..lllllllllllll.........", "..mmmmmmmmmmmmm.........", "........................", "........................", "........................", "........................"] }, { "id": "thieves.hideout", "name": "Hideout", "kind": "action", "sphere": "magenta", "px": ["........................", "........................", "........mmmmmmm.........", ".......mlmmmmmmd........", "......mlm.....mmd.......", "......ml.......md.......", "......ml.......md.......", "......ml.......md.......", "......ml.......md.......", "....33222222222221......", "....32222222222221......", "....32222222222221......", "....32222222222221......", "....3222222kk22221......", "....322222kkkk2221......", "....3222222kk22221......", "....3222222kk22221......", "....3222222kk22221......", "....32222222222221......", "....32222222222221......", "....11111111111111......", "........................", "........................", "........................"] }, { "id": "thieves.rob", "name": "Rob", "kind": "action", "sphere": "magenta", "px": ["........................", "............111111......", "............111111......", "............333333......", "..........322222222.....", ".........3222222221.....", "........32222222211.....", "........222222211.......", ".......m221.21..........", "........mmmm............", ".........dd.............", ".......lmmmmmd..........", ".....llmmmmmmmmd........", "....llmmmmmmmmmmd.......", "....lmmmmmmmmmmmd.......", "...llmmmmmmmmmmm32......", "...lmmmmmmmmmmm3221.....", "...lmmmmmmmmmmm2211.....", "....mmmmmmmmmmmd11......", ".....dddddddddd...32....", ".................3221...", ".................2211...", "..................11....", "........................"] }, { "id": "thieves.ransom", "name": "Ransom", "kind": "action", "sphere": "magenta", "px": ["........................", "........................", "..........3222..........", "........322222221.......", "......3222222222221.....", ".....322222222222221....", "...3.112111111121111....", "...3...2...lll.2...1....", "...3...2..lllll2...1....", "...3...2..lllll2...1....", "...3...2...lll.2...1....", "...3...2lllllll2ll.1....", "...3..l2lllllll2lll1....", "...3...2lllllll2l..1....", "...3...2.llllll2...1....", "...3...2.llllll2...1....", "...3...2llll.ll2l..1....", "...3...2llll.ll2ll.1....", "..33222222222222222221..", "..11111111111111111111..", "........................", "........................", "........................", "........................"] }, { "id": "thieves.mole", "name": "Mole", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "................dddd....", "........2222....d..d....", ".......322222...dddd....", "......32222222...md.....", "......11111111...md.....", "......llllllll...md.....", "......llllllll...md.....", "......lllkllkl...md.....", "......llllllll...md.....", ".......llllll...llll....", "........llll...kllll....", "...32222llll2221.md.....", "..3322222ll2222lmmmmd...", "..3222222222222lmmmmd...", "..3222222222222lmmmmd...", "..2221222222222lmmmmd...", "..22212222222221mmmd....", "..222122222222211md.....", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.accomplice", "name": "Accomplice", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "................m....m..", "................mllllm..", "................m....m..", ".......dddddd...m....m..", "......dddddddd..m....m..", "......llllllll..mllllm..", "......llllllll..m....m..", "......lllkllkl..m....m..", "......11111111..m....m..", ".......111111...mllllm..", "........1111..kll....m..", "...32222llll22kll....m..", "..3322222ll22222m....m..", "..32222222222221mllllm..", "..32222222222221m....m..", "..22212222222221m....m..", "..22212222222221m....m..", "..22212222222221mllllm..", "..22212222222221m....m..", "..22212222222221m....m..", "..222122222222211.......", "........................"] }, { "id": "thieves.grifter", "name": "Grifter", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", ".......llllllll.........", ".......22222222..dddddd.", ".....mmmmmmmmmmmmdmmmmd.", "......llllllll...dmmmmd.", "......llllllllllllllmmd.", "......llllllllllllllmmd.", "......lllkllkllll3llmmd.", "......llkkkkklll322lmmd.", ".......llllll.l32221mmd.", "........llll..ll221lddd.", "...32222llll22lll1ll....", "..3322222ll2klllllll....", "..3222222222klllllll....", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.sticky", "name": "Sticky Fingers", "kind": "member", "sphere": "magenta", "px": ["........................", "................l.l.l...", "..........2.....l.l.l...", ".........322....l.l.l...", "........32222..llllll...", ".......3222222.ll32ll.l.", "......322222222l3221ll..", ".....22lllllllll2211ll..", ".....22llllllll.l11ll...", ".....22lllkllkl.llll....", ".....22llllllll.2222....", "......22llllll2.2222....", "......222llll22k2221....", "...32222llll2221........", "..3322222ll222221.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.desperado", "name": "Desperado", "kind": "member", "sphere": "magenta", "px": ["........................", "................mmmmmm..", "........dddd...mm....mm.", ".......dmdddd.mm......m.", ".......dmdddd.mmm...mmm.", "..dd..dddddddd..mmmmm...", "...dddddddddddddd.m.....", "......llllllll....m.....", "......llllllll...m......", "......lllkllkl...m......", "......22222222..m.......", ".......222222..ll.......", "........2222..kll.......", "...32222llll2221........", "..3322222ll222221.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.robinhood", "name": "Robin Hood", "kind": "member", "sphere": "magenta", "px": ["........................", "..lll...................", "...llm..........l.mm....", "....llm......2..l..md...", ".....llm..3222..l...md..", ".......3222222..l...md..", "......32222222..l...md..", "......11111111..l...md..", "......llllllll..l...md..", "......lllkllkl..l...md..", "......llllllll..l..llm..", ".......llllll...l..llm..", "........llll....l...md..", "...32222llll2221l...md..", "..3322222ll22222l...md..", "..32222222222221l...md..", "..32222222222221l...md..", "..22212222222221l..md...", "..22212222222221l.mm....", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.lookout", "name": "Lookout", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", "........................", ".......dddddd...........", "......dmmdddddd.........", "......dddddddddd........", "......llllllll...llllll.", "......lllllkmmmmlmmmmml.", "......lllklkdmmmlmmmmml.", "......lllllkmmmmlmmmmml.", ".......llllll....llllll.", "........lllllll.........", "...32222lllllll1........", "..3322222ll222221.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.lightfingers", "name": "Light Fingers", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", ".................ll.....", ".................ll.....", ".......dddddd.....m.....", "......dddddddd....m.....", ".....ddddddddddd.mmm....", ".....dllllllllldmmmmm...", ".....dlllllllllmlllllm..", ".....dlllkllklmlllklllm.", ".....dllllllllmlllkllld.", ".....ddlllllllmlllkkkld.", ".....dddllllddmllllllld.", "...32dddllll222mllllld..", "..3322222ll22222mdddd...", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.extortionist", "name": "Extortionist", "kind": "member", "sphere": "magenta", "px": ["........................", "...................mmm..", "..................mmddd.", ".................mmdddd.", "................mmdddd..", "...............mmdddd...", ".......llllll..mddd.....", "......llllllllmdd.......", "......lllllllmdd........", "......lllkllkmdd........", "......llllllllll........", "......lmmmmmmlll........", ".......mmmmmm...........", "..322222llll22221.......", ".33222222ll2222221......", ".32222222222222211......", ".32222222222222211......", ".22212222222222211......", ".22212222222222211......", ".22212222222222211......", ".22212222222222211......", ".22212222222222211......", ".22212222222222211......", "........................"] }, { "id": "thieves.watchdog", "name": "Watchdog", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", ".......dddddd...........", "......dddddddd..........", "......22222222..........", "......ddddddddddd.......", "......llllllll..........", "......llllllll..........", "......lllkllkl..........", "......llllllll..mmmmmm..", ".......llllll..mmmmmmmm.", "........llll..ddmmmmmdd.", "...32222llll22ddkmmmkdd.", "..3322222ll222ddmmmmmdd.", "..322222222222dd1lll.dd.", "..322222222222211lkl....", "..222122222222211lll....", "..2221222222222122222...", "..2221222222222132221...", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.crew", "name": "Crew", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", "........................", ".............dddddd.....", "............ddddddddd...", ".............llllll.....", ".....dddddd..lllklk.....", "....dddddddddllllll.....", ".....llllll...llll......", ".....lllklk2222222221...", ".....llllll22222222211..", "......llll2222k2222211..", "...32222ll2221k2222211..", "..3222222222221k222211..", "..3222222222211k222211..", "..2222222222211k222211..", "..2222222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "........................"] }, { "id": "thieves.doubleagent", "name": "Double Agent", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........................", "........................", ".......dddddd...........", "......ddmdddddd.........", "......dddddddd..........", "......llllllll..........", "......llllllll..........", "......kddkkddk..........", "......llllllll..........", ".....3.llllll.1.........", ".....33.llll.11..mmm....", "...333322ll22111.m.m....", "..332222222222mmmmmmmmm.", "..322222222222mlllllllm.", "..322222222222mmmmdmmmm.", "..222122222222mmmmmmmmm.", "..222122222222mmmmmmmmm.", "..222122222222ddddddddd.", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "thieves.bigscore", "name": "Big Score", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", ".................33322..", "................3322221.", "...............33222221.", ".......dddddd..11111111.", "......dddddddd..222221..", "......llllllll...2221...", "......dddddddd....21....", "......ddlddldd...lll....", "......llllllll...lll....", ".......llllll...........", "........llll............", "...32222llll2221........", "..3322222ll222221.......", "..322222222222211.......", "..3llllllllllll11.......", "..222122222222211.......", "..2ll1lllllllll11.......", "..222122222222211.......", "..2ll1lllllllll11.......", "..222122222222211.......", "..2ll1lllllllll11.......", "........................"] }, { "id": "thieves.kingpin", "name": "Kingpin", "kind": "member", "sphere": "magenta", "px": ["........................", "........................", "........dddd.......mm...", ".......dmdddd.....mmmm..", ".......dddddd.....mm....", ".......222222....mm.....", "....dddddddddddd.mmm....", "......llllllll....mm....", "......llllllll.....mm...", "......lllkllkl......m...", "......lllllkmmmmmmml....", ".......llllkdddddddl....", "....333.llll.33.........", "...3333322223333........", "..332222222222221.......", "..321221222212211.......", "..321221222212211.......", "..221121222212211.......", "..221121222212211.......", "..221121222212211.......", "..221121222212211.......", "..221121222212211.......", "..221121222212211.......", "........................"] }, { "id": "silver.gift", "name": "Gift", "kind": "action", "sphere": "silver", "px": ["........................", "........................", "........................", "......lll......lll......", ".....ll.ll....ll.ll.....", ".....ll..ll..ll..ll.....", "......ll..llll..ll......", ".......lllllmmlll.......", "...33333333lm33333331...", "...32222222lm22222221...", "...32222222lm22222221...", "...11111111lm11111111...", "....3333333lm3333331....", "....3222222lm2222221....", "....3222222lm2222221....", "....3222222lm2222221....", "....3222222lm2222221....", "....3222222lm2222221....", "....3222222lm2222221....", "....3222222lm2222221....", "....1111111lm1111111....", "........................", "........................", "........................"] }, { "id": "silver.alms", "name": "Alms", "kind": "action", "sphere": "silver", "px": ["........................", "........................", "..................1111..", "...............lll1111..", ".............lllllll11..", "............llllllllll..", "...........lllllllll....", "..........ll.l.l.ll.....", "..........l..l.l........", "........................", "........32..............", ".......3221.............", ".......2211.............", "........13221...........", ".........2211...........", "..3333333333333333331...", "...32222222222222221....", "....322222222222211.....", ".....2222222222211......", ".......11111111.........", "........................", "........................", "........................", "........................"] }, { "id": "silver.tongue", "name": "Silver Tongue", "kind": "action", "sphere": "silver", "px": ["........................", "........................", "........................", ".....333333333332.......", "...33222222222222221....", "...32222222222222221....", "..322222222222222221....", "..32222kk22kk22kk2221...", "..32222kk22kk22kk2221...", "..322222222222222221....", "...22222222222222221....", "...22222222222222211....", ".....22221111111111.....", ".....2221...............", "....2211................", "...211..................", "........................", "........................", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "silver.tide", "name": "Rising Tide", "kind": "action", "sphere": "silver", "px": ["........................", "........................", ".....lll................", "....ll..................", "...ll...................", "...ll...................", "...ll...................", "....ll......3333........", ".....lll..33222l3.......", ".........3222.ll........", "........3222............", ".......32221.....33.....", "......322221...33223....", "...33322222213322222....", "..322222222222222222221.", ".3222222222222222222221.", ".2222222222222222222221.", ".2222222222222222222221.", ".2222222222222222222211.", ".1111111111111111111111.", "........................", "........................", "........................", "........................"] }, { "id": "silver.jubilee", "name": "Jubilee", "kind": "action", "sphere": "silver", "px": ["........................", ".........3..............", "....3....3....3.........", ".....3...2...3..........", "......3..2..3...........", ".......2.l.2............", "..33222.lll.22223.......", ".......2.l.2............", "......2..2..2...........", ".....2...2...2..........", "....1....2....1.........", ".........1......3.......", "..............3.3.3.....", "...............222......", "....l........3322l2211..", "...lll.........222......", "....l.........1.2.1.....", "................1.......", "........................", "..........l.............", ".........lll............", "..........l.............", "........................", "........................"] }, { "id": "silver.guest", "name": "Guest", "kind": "member", "sphere": "silver", "px": ["........................", "........................", ".........ll.............", "..........ll............", ".......dd.3l............", "......ddd322d...........", "......dddddddd..........", "......dlllddddd.........", "......llllllll..........", "......lllkllkllllllllll.", "......llllllllmllllllml.", ".......llllllllmllllmll.", "........llll.lllmllmlll.", "...32222llll2lllll22lll.", "..3322222ll22llllll1lll.", "..32222222222llllllllll.", "..3222222222kllmmmmmmmm.", "..2221222222kll11.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.benefactor", "name": "Benefactor", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "........................", "........................", "........................", ".......llllll...........", ".....mmllllllmm.........", ".....mllllllllm.........", ".....mllllllllm...3332..", ".....mlllkllklm..332221.", "......llllllll...322221.", ".......llllll.....1111..", "........llll.....322221.", "...32222llll2221..1111..", "..3322222ll222221322221.", "..322222222222211.1111..", "..32222222222221kllllll.", "..222122222222222llllll.", "..2221222222222221111...", "..222122222221111.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.caterer", "name": "Caterer", "kind": "member", "sphere": "silver", "px": ["........................", ".......ll.ll............", "......llllllll..........", "......llllllll..........", ".......llllll...........", ".......mmmmmm...........", "......kkkkkkkk..........", "......llllllll..........", "......llllllll..........", "......lllkllkl....3.....", "......llllllll...321....", ".......llllll..3322221..", "........llll..332222221.", "...32222llll22322222221.", "..3322222ll223222222222.", "..322222222223222222221.", "..32222222222mmmmmmmmmm.", "..222122222222kllllllll.", "..222122222222kll.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.majordomo", "name": "Majordomo", "kind": "member", "sphere": "silver", "px": ["........................", ".................3322...", "................32..21..", "................32..21..", ".................3221...", "......dddddddd....21....", "......dmmddddd....21....", "......llllllll....21....", "......mlllllll....21....", "......mllkllkl..llll....", "......mmllllll.kllll....", ".......llllll.....21....", "........llll......2111..", "...3222kddk2221...21....", "..332222222222221.2111..", "..322222222222211.11....", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.silversmith", "name": "Silversmith", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "..............llmmmmmmd.", "..............lmmmmmmmd.", "..............mmmmmmmmd.", ".......dddddd.dddddmddd.", "......dddddddd.....md...", "......11111111.....md...", "......llllllll.....md...", "......lllkllkl.....md...", "......llllllll.....md...", ".......llllll.....llll..", "........llll.....kllll..", "...32222llll2221...md...", "..3322222ll222221.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.steward", "name": "Steward", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "........................", "........................", ".......dddddd...........", "......dddkdddd..........", "......dddlllldd.........", "......llllllll..........", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", ".......lllllllllll.llll.", "........llllllmmmlllmml.", "...32222lllllllllllllll.", "..3322222ll2llmmmllmmml.", "..3222222222lllllllllll.", "..3222222222llmmlllmmll.", "..222122222232222212221.", "..22212222222111111111..", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.retinue", "name": "Retinue", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "........................", "............mmmmmmmm....", "...........mmmmmmmmmm...", "...........mmllllllmm...", "....mmmmmmmmmlllklkmm...", "...mmmmmmmmmmllllllmm...", "...mmllllllmm.llll......", "...mmlllklkmm22ll2221...", "...mmllllllmm222222211..", "......llll2222k2222211..", "...32222ll2221k2222211..", "..3222222222221k222211..", "..3222222222211k222211..", "..2222222222211k222211..", "..2222222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "..2212222222211k222211..", "........................"] }, { "id": "silver.revelers", "name": "Revelers", "kind": "member", "sphere": "silver", "px": ["........................", "...........ll...........", "...........32...........", ".dddddd...3221...dddddd.", ".llllll..322221..llllll.", ".lkllkl..llllll..lkllkl.", ".llllll..lkllkl..llllll.", ".llkkll..llllll..llkkll.", "..llll...lkkkkl...llll..", ".32ll21...llll...32ll21.", ".322221....ll....322221.", ".322221k322ll221k322221.", ".322221k32222221k322221.", ".222221k32222221k222221.", ".222221k32222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", ".222221k22222221k222221.", "........................"] }, { "id": "silver.heir", "name": "Heir", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "........................", ".......3.3.3.3..........", ".......3232321..........", ".......2222221..........", "......dddddddddmmmmmmd..", "......llllllll.llllll...", "......llllllll.lmmmml...", "......lllkllkl.llllll...", "......llllllll.lmmmll...", ".......llllllklllllll...", "........llll.kllmmmml...", "...32222llll222llllll...", "..3322222ll222dmmmmmmd..", "..32222222222221132.....", "..32222222222221121.....", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.spoon", "name": "Silver Spoon", "kind": "member", "sphere": "silver", "px": ["........................", ".................3332...", "................332221..", "................321121..", ".........dd.....321121..", "........llld....322111..", "......llllllll...2211...", ".....llllllllll...21....", ".....llllllllll...21....", ".....llllkllkll...21....", ".....llllllllll...21....", "......llllmmll...lll....", ".......llllll...klll....", "....32mmmmmmmm1...21....", "...332llllllll21..11....", "...322llllllll11........", "...3222mllllm211........", "...2221222222211........", "...2221222222211........", "...2221222222211........", "...2221222222211........", "...2221222222211........", "...2221222222211........", "........................"] }, { "id": "silver.toastmaster", "name": "Toastmaster", "kind": "member", "sphere": "silver", "px": ["........................", "...................l....", "..................lll...", "..............33222221..", "..............32222221..", ".......dddddd.32222211..", "......ddddddddd322211...", "......llllllll..3221....", "......llllllll...21.....", "......lllkllkl...21.....", "......llllllll..3221....", ".......llllll...llll....", "........llll...kllll....", "...3222kddk2221.........", "..33222lllll2221........", "..322222lll222211.......", "..322222lll222211.......", "..222122lll222211.......", "..222122lll222211.......", "..222122lll222211.......", "..222122lll222211.......", "..222122lll222211.......", "..222122lll222211.......", "........................"] }, { "id": "silver.gala", "name": "Gala", "kind": "member", "sphere": "silver", "px": ["........................", "........................", ".........ddd............", "........ddddd...........", ".........ddd............", ".......dddddd....lll....", "......ddddddddlllllllll.", "......dllllllll3312211l.", "......llllllll133122112.", "......lllkllkl113122122.", "......llllllll113122121.", ".......llllll.311321211.", "........llll...3132111..", "...32222llll2221.121....", "..3322222ll222221kll....", "..322222222222211kll....", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "silver.dowager", "name": "Dowager", "kind": "member", "sphere": "silver", "px": ["........................", "........................", "........................", ".........mmm............", "........mmmmm...........", ".......mmmmmmm..........", "......mmmmmmmmm.........", "......mllllllm...dddd...", "......llllllll..dmmmmd..", "......lllkllkl..md..md..", "......llllllll..md..md..", ".......llllll.......md..", "........llll.......llll.", "...3222l2l2l2211..kllll.", "..3322222lll222221..md..", "..322222222222211...md..", "..322222222222211...md..", "..222122222222211...md..", "..222122222222211...md..", "..222122222222211...md..", "..222122222222211...md..", "..222122222222211...md..", "..222122222222211.......", "........................"] }, { "id": "silver.grandhost", "name": "Grand Host", "kind": "member", "sphere": "silver", "px": ["........................", "..................mm....", "..................ll....", "..................11....", ".......dddddd.....11....", "......dddddddd...1111...", "......dddddddd..111111..", "......llllllll..1lll11..", "......llllllll..1lll11..", "......lllkllkl..1lll11..", "......lmmmmmml..111111..", ".......llllll...111111..", "........llll....kllll...", "..322222llll2222kllll...", ".33332222ll2222221......", ".32233222222222211......", ".32223322222222211......", ".22212332222222211......", ".22212233222222211......", ".22212223322222211......", ".22212222332222211......", ".22212222233222211......", ".22212222223322211......", "........................"] }, { "id": "silver.saint", "name": "Patron Saint", "kind": "member", "sphere": "silver", "px": ["........................", ".......llllllll.........", ".....ll........ll.......", ".....ll........ll.......", ".......llllllll.........", ".......mmmmmm...........", "......mmmmmmmm..........", ".....mmllllllmm.........", ".....mmllllllmm.........", ".....mmllkllkmm.........", ".....mmllllllmm.........", ".....mmmmmmmmmm.........", ".....mm.mmmmmmm.........", "...32222mmmm2221........", "..3322222ll222221.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.harvest", "name": "Harvest", "kind": "action", "sphere": "yellow", "px": ["........................", "...........32...........", "......32...322...32.....", ".....322...3221.3221....", "....3221...3221.3221....", "....3221...3221..221....", "....3221....221..21.....", ".....221.32..1..1.......", "......21322...1.1.32....", "........3221..1.13221...", "........3221.11.13221...", "........32321211.221....", ".........323211.........", ".........dddddd.........", ".........mmmmmd.........", ".........323211.........", "........32323211........", "........323232111.......", ".......3232321211.......", ".......32323212111......", "......323232121211......", "........................", "........................", "........................"] }, { "id": "yellow.bloom", "name": "Bloom", "kind": "action", "sphere": "yellow", "px": ["........................", "........................", "..........3332..........", ".........332221.........", "......33.322221.32......", ".....3322.3221.3221.....", ".....322221..322221.....", "......32221ll32221......", ".........2llll1.........", "......3322llll3321......", ".....322221ll322211.....", ".....322221..322211.....", "......2221.32.2221......", "..........3221..........", "..........2221..........", "...........11...........", "......3221.11...........", ".......2211111.322......", "...........113221.......", "...........11...........", "...........11...........", "........................", "........................", "........................"] }, { "id": "yellow.transmute", "name": "Transmute", "kind": "action", "sphere": "yellow", "px": ["........................", ".........l....l.........", "...........ddd..........", "...........ddd.l........", "..........mlmmd.........", "..........mlmmd.........", "..........mlmmd.........", "........mmlmmmmmd.......", ".......mlmmmmmmmmd......", "......mlmmmmmmmmmd......", "......m3332222l22d......", "......332222222221......", "......32222l222221......", "......322222222l21......", "......322222222211......", ".......2222222221.......", "........22221111........", ".........111111.........", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "yellow.prism", "name": "Prism", "kind": "action", "sphere": "yellow", "px": ["........................", "........................", "........................", "........................", "............ll..........", "...........lllm.........", "...........llmm.....333.", "..........lllmmm..33333.", "..........llmmmm3333322.", ".........lllmmm33322222.", ".llllllllllmmm222222211.", "........lllmmmm22211111.", "........llmmmmmm1111111.", ".......lllmmmmmmmm11111.", ".......llmmmmmmmmmm.111.", "......lllmmmmmmmmmmm....", "......dddddddddddddd....", "........................", "........................", "........................", "........................", "........................", "........................", "........................"] }, { "id": "yellow.gather", "name": "Gather", "kind": "action", "sphere": "yellow", "px": ["........................", "........................", ".........mmmmmm.........", ".......mml....mmd.......", "......ml........md......", "......m...3322...d......", ".....33223322223322.....", "....3322232222332222....", "....3222222222322221....", "....2222222221222221....", "....2222111111222211....", "..33333333333333333331..", "..mmmmmmmmmmmmmmmmmmmd..", "...mdmmdmmdmmdmmdmmdd...", "...mmdmmdmmdmmdmmdmmd...", "...dmmdmmdmmdmmdmmdmd...", "....mdmmdmmdmmdmmdmd....", "....mmdmmdmmdmmdmmdd....", "....dmmdmmdmmdmmdmmd....", ".....mdmmdmmdmmdmmd.....", ".....dddddddddddddd.....", "........................", "........................", "........................"] }, { "id": "yellow.flourish", "name": "Flourish", "kind": "action", "sphere": "yellow", "px": ["........................", "........33332...........", "......33322222l2........", "....3332l222222221......", "...332222222l222221.....", "...32222l222222l2221....", "..3222222222222222211...", "..32222222l222222l211...", "..322l2222222222222111..", "...2222222222l22222211..", "...22222l22222222l2111..", "....22222222222222111...", ".....222112222211111....", ".......111.md.111.......", "...........md...........", "...........md...........", "..........mmdd..........", ".........mmd.dd.........", "......3333333333331.....", "....11111111111111111...", "........................", "........................", "........................", "........................"] }, { "id": "yellow.gardener", "name": "Gardener", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........3322............", ".......332222...........", ".......3222221..........", "...33322222222211.......", "....1111111111111.......", "......llllllll..........", "......llllllll..........", "......lllkllkl.......mm.", "......llllllll.......ml.", ".......llllll....mmm.m..", "........llll....m...mm..", "...32222llll22llmmmmm2..", "..3322222ll222lmmmmmmd..", "..3222222222kllmmmmmm2..", "..3222222222kllmmmmmmd..", "..222122222222lmmmmmmd..", "..222122222222mmmmmmmd..", "..2221222222222ddddddd..", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.peddler", "name": "Peddler", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "..............3333332...", ".............322222221..", ".............211111111..", ".......dddddd.mmmmmmmd..", "......ddmdddddddmmmmmdd.", "......llllllllmmmmmmmdd.", "......llllllllddddddddd.", "......lllkllklmmmmmmmdd.", "......llllllllmmmmmmmdd.", ".......lllllllmmmmmmmdd.", "........llll.dddddddddd.", "...32222llll222mmmmmmdd.", "..3322222ll22222mmmmmdd.", "..32222222222221mmmmmdd.", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.gleaner", "name": "Gleaner", "kind": "member", "sphere": "yellow", "px": ["........................", ".................3...3..", "..................3.3...", "..................332...", ".......mmmmmm....3322...", "......mmmmmmmm....3221..", ".....mmmmmmmmmm..3321...", ".....mmllllllmm...2211..", ".....mmllllllmm..3221...", ".....mmllkllkmm...221...", ".....mmllllllmm....1....", "......mmllllmm.....1....", ".......mmmmmm.....lll...", "...32222mmmm2221.klll...", "..332222222222221..1....", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.admirer", "name": "Admirer", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "................3.3.3...", "................32323...", ".......ddddddd..32221...", "......ddddddddd.32221...", ".....dddddddddd..221....", ".....dllllllll....1.....", ".....dllllllll..1.1.....", "......lllkllkl..111.1...", "......l3llll3l...1111...", ".......llllll.....1.....", "........llll.....lll....", "...32222llll2221klll....", "..3322222ll222221.1.....", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.gobetween", "name": "Go-Between", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "........................", "..................lll...", ".......dddddd....llkld..", "......dddddddd...lllldd.", "......llllllllmmmllll...", "......lllllllmmmmmlll...", "......lllkllklmmmmmmll..", "......llllllll.mmmmmml..", ".......llllll....mmm....", "........llll.....d.d....", "...32222llll222kllllll..", "..3322222ll2222kllllll..", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.dyer", "name": "Dyer", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "........................", ".......111111...........", "......11111111..........", "......11111111111.......", "......llllllll..11......", "......llllllll..........", "......lllkllkl..........", "......llllllll..........", ".......llllll..mmmmmmm..", "........llll..m.......m.", "...32222llll2m21........", "..3322222ll22dd3333332d.", "..32222222222d22222222d.", "..32222222222dm2m2mmm2d.", "..22212222222dmmm2mmmmd.", "..22212222222dmmmmmmmmd.", "..222122222222mmmmmmmd..", "..222122222222ddddddd...", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.latebloomer", "name": "Late Bloomer", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "........................", "........................", ".................32.....", ".......llllll...3221....", ".....mlllllllll..21.....", ".....mllllllllm..1......", ".....mlllkllklm311......", "......llllllll..11......", ".......llllll..mmmmmd...", "........llll...lmmmmd...", "...32222llll2221mmmd....", "..3322222ll22222mmmd....", "..3222222222222kllll....", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.sower", "name": "Sower", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", ".................mm.....", "................llmm....", ".......dddddd..lllmmmd..", "......ddddddddlllmmmmd..", "......dddddddkllmmmmmd..", "......lllllllklmmmmmd...", "......lllkllkl.mmmdd....", "......llllllll.....3....", ".......llllll.......2...", "........llll.......3....", "...32222llll2221....2...", "..3322222ll222221..3....", "..322222222222211...1...", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.harmonist", "name": "Harmonist", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "...............3.....3..", "..............32.....2..", ".......dddddd.32.....2..", "......dddddddd32ll.ll2..", ".....dllllllll32lllll2..", ".....dllllllll.2l.l.l1..", ".....dlllkllkl.2l.l.l1..", ".....dllllllll.2l.l.l1..", ".....ddlllllll.322221...", ".....dd.lllll...3221....", "...32222llll2221.21.....", "..3322222ll2222kll1.....", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.rainmaker", "name": "Rainmaker", "kind": "member", "sphere": "yellow", "px": ["........................", ".........ll.............", ".........lm......llll...", ".........lm....llllllm..", ".........m....lllllllmm.", "......dddddddlllllllmmm.", "......22222222mmmmmmmm..", "......llllllll.3..3..3..", "......llllllll.2..2..2..", "......lllkllkl3..3..3...", "......llllllll1..2..1...", ".......llllll....1......", "........llll............", "...32222llll2kll........", "..3322222ll22kll1.......", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.pilgrim", "name": "Pilgrim", "kind": "member", "sphere": "yellow", "px": ["........................", ".......dddddd...........", ".......dmdddd.....lm....", ".......dmdddd.....lm....", ".......d3333d.....lm....", ".......d3dd3d.....lm....", "....dddddddddddd.1lm....", "......llllllll..3221....", "......llllllll..2211....", "......lllkllkl...11.....", "......llllllll....lm....", ".......llllll.....lm....", "........llll....kllll...", "...32222llll2221kllll...", "..3322222ll222221.lm....", "..322222222222211.lm....", "..322222222222211.lm....", "..222122222222211.lm....", "..222122222222211.lm....", "..222122222222211.lm....", "..222122222222211.mm....", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.farmer", "name": "Farmer", "kind": "member", "sphere": "yellow", "px": ["........................", "................m..m..m.", ".........332....m..m..m.", ".......3322221..m..m..m.", ".......1111111..m..m..m.", "...3332222222222mmmmmmm.", "....1111111111111..md...", "......llllllll.....md...", "......llllllll.....md...", "......lllkllkl.....md...", "......llllllll.....md...", ".......llllll.....llll..", "........llll.....kllll..", "...32222llll2221...md...", "..3322222ll222221..md...", "..322222222222211..md...", "..322222222222211..md...", "..222122222222211..md...", "..222122222222211..md...", "..222122222222211..md...", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.weaver", "name": "Weaver", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........................", "........................", "........................", ".......dddddd...........", "......ddddddddm.....m...", "....ddllllllll.m...m....", "....ddllllllll..3322....", ".....dlllkllkl.3m222m...", "....ddllllllll3l2l2l21..", "....d..llllll.32l2l221..", "....dd..llll..3l2l2l21..", "...32222llll2222l2l211..", "..3322222ll222222211....", "..322222222222211.......", "..322222222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.explorer", "name": "Explorer", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", "........llll............", ".......llllll...........", "......llllllll..........", "......llllllll..........", "....mmmmmmmmmmmm........", "....mmmmmmmmmmmm........", "......llllllll..........", "......lllkllklllmlllmll.", "......llllllll2llml2kml.", ".......llllllll2lmlkmkl.", "........llll.lll2m2lmll.", "...32222llll2llllm2lmll.", "..3322222ll22lllm2llmll.", "..32222222222ll2mlllmll.", "..32222222222mmmmmmmmmm.", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }, { "id": "yellow.feastmaker", "name": "Feastmaker", "kind": "member", "sphere": "yellow", "px": ["........................", "........................", ".................l..l...", ".......llllll...l..l....", "......llllllll..l..l....", ".....mlmlmlmlmm..l..l...", "......mmmmmmmm...l..l...", "......llllllll..l..l....", "......llllllll..........", "......lllkllkl.332222...", "......llllllll32121211..", ".......llllll.22222222..", "........llll..21212121..", "...32222llll22dddddddd..", "..3322222ll2222mmmmmm...", "..32222222222kll1.......", "..32222222222kll1.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "..222122222222211.......", "........................"] }];

// src/v4/art/icons/emojis.js
var emojis_default = [{ "id": "santa", "name": "Santa", "emoji": "\u{1F385}", "kind": "emoji", "px": ["................", ".....3322.......", "....322222......", "...32222222.ww..", "...222222221www.", "..wwwwwwwwwwwcc.", "..cwwwwwwwwwc...", "...ssksssskst...", "...sbssssbsst...", "..wwwwwwwwwwww..", "..wwwwwkkwwwwc..", "..cwwwwwwwwwwc..", "...cwwwwwwwwc...", "....cwwwwwwc....", "......cccc......", "................"], "em": ["..3322..", ".322221w", "wwwwwwww", ".skssks.", "wwssssww", "wwwkkwww", ".wwwwww.", "..wwww.."], "palette": { "1": "#8f2a22", "2": "#d4473a", "3": "#f0866c", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "unicorn", "name": "Unicorn", "emoji": "\u{1F984}", "kind": "emoji", "px": ["................", "..33............", "..321...w.......", "...321.ww55.....", "....2wwwww554...", "...wwwwwwww556..", "..wwwkwwwww6554.", ".wwwwwwwwwwc554.", ".wwwwwwwwwwc455.", ".wkwwwwwwwwwc54.", "..cwwcwwwwwwc56.", "...cc.cwwwwwc45.", ".......wwwwww55.", ".......cwwwwwc4.", "........cccccc..", "................"], "em": [".3......", "..3.w5..", "..wwww54", ".wkwww45", "wwwwwc54", "wkwwwc45", ".cc.ww5.", "....wc.."], "palette": { "1": "#a8761a", "2": "#e3b23c", "3": "#f8dc86", "4": "#8b66cb", "5": "#e27aa6", "6": "#6fa8dc", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "surfer", "name": "Surfer", "emoji": "\u{1F3C4}", "kind": "emoji", "px": ["................", "..3.3.3.....55..", ".3323232...5w54.", ".222222221.5w54.", ".2ssssss21.5w54.", ".sssssssst.5w54.", ".kkkkkkkkt.5w54.", ".skksskkst.5w54.", ".sssssssst.5w54.", ".ssskkksst.5w54.", "..ssssstt..5w54.", "..6666666..5w54.", ".766666667.5w54.", ".76666666667.54.", ".76666666667....", "................"], "em": [".3.3.5..", "3232.54.", "2ssss5w4", "kkkkk5w4", "skksk5w4", "sssss5w4", "skkks5w4", ".sss..4."], "palette": { "1": "#b48a1f", "2": "#f2c94a", "3": "#fbe596", "4": "#226a70", "5": "#3aa0a3", "6": "#d9583a", "7": "#f39a75", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "bug", "name": "Bug", "emoji": "\u{1F41B}", "kind": "emoji", "px": ["................", ".........4...4..", "..........1.1...", ".........32221..", "........3222221.", "........2k22k21.", "........2222221.", "..33.33.22kk21..", ".3223223222w211.", ".24224224222221.", ".22222222222221.", ".12111211121111.", "..1..1..1..1....", "................", "................", "................"], "em": ["....4.4.", ".....1..", "...3222.", "...2k2k2", "3232222.", "2422422.", "2222221.", ".1..1..."], "palette": { "1": "#3a7634", "2": "#6bb24d", "3": "#a8d97b", "4": "#f2c94a", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "ghost", "name": "Ghost", "emoji": "\u{1F47B}", "kind": "emoji", "px": ["................", ".....wwwww......", "....wwwwwwwc....", "...wwwwwwwwwc...", "..wwwwwwwwwwwc..", "..wwkkwwwkkwwc..", "..wwkkwwwkkwwc..", "..wbwwwwwwwbwc..", ".wwwwwwkkwwwwwc.", ".cwwwwwkkwwwwcc.", "..wwwwwwwwwwwc..", "..wwwwwwwwwwwc..", "..wwwwwwwwwwwc..", "..wwc.wwwc.wwc..", "..wc...wc...c...", "................"], "em": ["..wwww..", ".wwwwww.", "wwkwwkww", "wwkwwkww", "wwwkkwww", "wwwkkwww", "wwwwwwww", ".w.ww.w."], "palette": { "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "alien", "name": "Alien", "emoji": "\u{1F47D}", "kind": "emoji", "px": ["................", ".....332221.....", "....32222222....", "...3222222221...", "..322222222221..", "..222222222221..", "..2kkk2222kkk1..", "..2kwkk22kkwk1..", "..22kkk22kkk21..", "...22kk22kk21...", "...2222222221...", "....22222221....", ".....22kk21.....", "......2221......", ".......11.......", "................"], "em": ["..3222..", ".322222.", "2kk22kk1", "2kkk2kk1", ".2k22k2.", ".222221.", "..2kk1..", "...21..."], "palette": { "1": "#5f9370", "2": "#9fcf96", "3": "#d2edc6", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "robot", "name": "Robot", "emoji": "\u{1F916}", "kind": "emoji", "px": ["................", ".......55.......", ".......54.......", ".......2........", "..333333333332..", "..322222222221..", ".23xxxxxxxxxx12.", ".23x66xxxx66x12.", ".23x66xxxx66x12.", ".23xxxxxxxxxx12.", "..322222222221..", "..32k2k2k2k221..", "..322222222221..", "..111111111111..", "................", "................"], "em": ["...55...", "...22...", "33333332", "3x6xx6x1", "3x6xx6x1", "32222221", ".2k2k21.", ".111111."], "palette": { "1": "#66717a", "2": "#a9b4bb", "3": "#dfe5e8", "4": "#8f2a22", "5": "#d4473a", "6": "#7fe0e6", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "cat", "name": "Cat", "emoji": "\u{1F431}", "kind": "emoji", "px": ["................", "..3..........2..", "..33........22..", "..343......242..", "..322222222221..", ".32222121222221.", ".22222222222221.", ".222k222222k221.", ".222k222222k221.", ".22wwww44wwww21.", ".22wwwkwwkwww21.", ".122wwwwwwww211.", "..122222222211..", "....11111111....", "................", "................"], "em": [".3....2.", ".34..42.", ".322221.", "22k22k21", "2ww44ww1", "2wkwwkw1", ".122221.", "..1111.."], "palette": { "1": "#a5521b", "2": "#e8892f", "3": "#f7b866", "4": "#ec8a9a", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "frog", "name": "Frog", "emoji": "\u{1F438}", "kind": "emoji", "px": ["................", "................", "................", "..3322....3322..", ".32wwk2..2wwk21.", ".32wwk2222wwk21.", ".32222222222221.", ".22222222222221.", ".2b2222222222b1.", ".2k2222222222k1.", ".22kkkkkkkkkk21.", ".2222w2222w2221.", "..222222222221..", "...1111111111...", "................", "................"], "em": [".33..33.", "3wk33wk3", "2wk22wk2", "22222222", "2b2222b2", "2kkkkkk2", ".222222.", "..1111.."], "palette": { "1": "#3a7634", "2": "#6bb24d", "3": "#a8d97b", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "octopus", "name": "Octopus", "emoji": "\u{1F419}", "kind": "emoji", "px": ["................", ".....332221.....", "....32222222....", "...3222222221...", "...2222222221...", "...22kk22kk21...", "...22kk22kk21...", "...2b222222b1...", "..322222222221..", "..222222222221..", ".32.22.22.22.21.", ".2..2..22..2..1.", ".22.2..2...2.21.", "..2..2..2.2..2..", "................", "................"], "em": ["..3222..", ".322222.", ".2k22k1.", ".222221.", "32222221", "2.2..2.1", "2.2..2.1", ".2.22.2."], "palette": { "1": "#8e3a6c", "2": "#cf6aa0", "3": "#f0a9cb", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "pumpkin", "name": "Pumpkin", "emoji": "\u{1F383}", "kind": "emoji", "px": ["................", "................", "........45......", ".......45.......", "...3312322122...", "..332122221221..", ".32221222212221.", ".222o122221o221.", ".22ooo2222ooo21.", ".222212oo212221.", ".22oooooooooo21.", ".222oo2oo2oo221.", ".12221222212211.", "...1111111111...", "................", "................"], "em": ["....45..", ".332231.", "32o22o21", "2ooo2oo1", "22222221", "2oooooo1", ".2o2o21.", "..1111.."], "palette": { "1": "#a5521b", "2": "#e8892f", "3": "#f7b866", "4": "#2f6a3a", "5": "#4f9a55", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "skull", "name": "Skull", "emoji": "\u{1F480}", "kind": "emoji", "px": ["................", ".....wwwwww.....", "...wwwwwwwwww...", "..wwwwwwwwwwwc..", "..wwwwwwwwwwwc..", "..wxxxwwwwxxxc..", "..wxoxwwwwxoxc..", "..wxxxwwwwxxxc..", "..cwwwwxxwwwwc..", "...cwwwwwwwwc...", "....wwwwwwww....", "....wwkwwkwc....", "....cccccccc....", "................", "................", "................"], "em": ["..wwww..", ".wwwwww.", "wxxwwxxw", "wxowwoxc", "wwwxxwwc", ".cwwwwc.", ".wkwkwc.", "..cccc.."], "palette": { "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "cactus", "name": "Cactus", "emoji": "\u{1F335}", "kind": "emoji", "px": ["................", ".....33721......", "....3222221.....", "....3222221.32..", ".32.32k2k21.221.", ".22.3222221.221.", ".22.322k221.221.", ".22.322w2222221.", ".2223222221.....", ".1113222221.....", "....3222221.....", "....3222221.....", "...466666664....", "....4555554.....", ".....44444......", "................"], "em": ["...37...", "..3221..", "3.2k21.3", "2.2221.2", "2222222.", "..2221..", ".666664.", "..4554.."], "palette": { "1": "#2f6a3a", "2": "#4f9a55", "3": "#86c47d", "4": "#7c3d24", "5": "#bd6a43", "6": "#e09a6e", "7": "#f08fb5", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "pizza", "name": "Pizza", "emoji": "\u{1F355}", "kind": "emoji", "px": ["................", "..333222222221..", ".32222222222221.", ".11111111111111.", ".65555555555554.", "..658855555554..", "..658755558854..", "...6555555874...", "....65555554....", "....65588554....", ".....658754.....", "......6554......", "......6554......", ".......54.......", "................", "................"], "em": [".332221.", "32222221", "11111111", "65885554", ".655884.", "..6554..", "...54...", "........"], "palette": { "1": "#6a3d1d", "2": "#b06a2e", "3": "#dd9c58", "4": "#b48a1f", "5": "#f2c94a", "6": "#fbe596", "7": "#8f2a22", "8": "#d4473a", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "dino", "name": "Dinosaur", "emoji": "\u{1F996}", "kind": "emoji", "px": ["................", "........332221..", ".......322k2221.", ".......22222222.", ".......222kkkkk.", ".......2222w2w1.", "......222221....", ".....32222222...", "....3222222122..", "..3322222221....", ".32222222221....", ".1..1222221.....", "....22..22......", "....22..22......", "...111.111......", "................"], "em": ["....322.", "...2k222", "...22kkk", "...222w.", "..22222.", "322222.2", "2.2222..", "..2..2.."], "palette": { "1": "#245e4c", "2": "#3f9472", "3": "#7cc9a2", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "ninja", "name": "Ninja", "emoji": "\u{1F977}", "kind": "emoji", "px": ["................", ".....332222.....", "....32222221....", "...3222222221...", "...65555555554..", "...skksssskkt55.", "...ssssssssst.5.", "...3222222221.4.", "...2222222221...", "....22222221....", "...3222222221...", "..322222222221..", "..255555555554..", "..222222222221..", "..111111111111..", "................"], "em": ["..3222..", ".322221.", ".6555545", ".sksskt5", ".322221.", "..2221..", ".655554.", "32222221"], "palette": { "1": "#2f3a6b", "2": "#4b5a9c", "3": "#7787c7", "4": "#8f2a22", "5": "#d4473a", "6": "#f0866c", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "wizard", "name": "Wizard", "emoji": "\u{1F9D9}", "kind": "emoji", "px": ["................", "..........32....", ".........322....", "........3222....", ".......32422....", "......3244421...", ".....32224221...", ".33222222222211.", "...ssksssskst...", "...7777t77776...", "...6777777776...", "....67777776....", "....67777776....", ".....677776.....", "......5665......", "................"], "em": ["....32..", "...342..", "..32221.", "32222221", ".skssks.", ".677776.", "..6776..", "...55..."], "palette": { "1": "#553a8e", "2": "#8b66cb", "3": "#b99ce6", "4": "#f2c94a", "5": "#8d969c", "6": "#c4cbcf", "7": "#eef1f2", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "crab", "name": "Crab", "emoji": "\u{1F980}", "kind": "emoji", "px": ["................", ".32.3......3.23.", ".22.2......2.22.", ".2222......2222.", "..22.wk..kw.22..", "...2..2..2..2...", "...3222222221...", "..322222222221..", ".32222222222221.", ".22222222222221.", "..122222222211..", "..2.2......2.2..", ".2.2........2.2.", "................", "................", "................"], "em": ["3.3..3.3", "222..222", ".2w..w2.", ".322221.", "32222221", "22222221", ".122211.", "2.2..2.2"], "palette": { "1": "#93331f", "2": "#d9583a", "3": "#f39a75", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "mushroom", "name": "Mushroom", "emoji": "\u{1F344}", "kind": "emoji", "px": ["................", ".....332222.....", "...33ww222221...", "..32www2222ww1..", ".3222w22222www1.", ".2ww222222222w1.", ".1www22ww222211.", "..111111111111..", "....wwwwwwwc....", "....wkwwwwkc....", "....wbwkkwbc....", "....wwwwwwwc....", "....cwwwwwcc....", ".....cccccc.....", "................", "................"], "em": ["..3222..", ".3ww221.", "32w22ww2", "2222w221", ".111111.", "..wkwk..", "..wwwc..", "..cccc.."], "palette": { "1": "#8f2a22", "2": "#d4473a", "3": "#f0866c", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }, { "id": "bee", "name": "Bee", "emoji": "\u{1F41D}", "kind": "emoji", "px": ["................", "................", "......44...44...", ".....4554.4554..", ".....4554.4554..", "......44...44...", "....32xx22xx1...", ".32222xx22xx21..", ".2k222xx22xx22x.", ".22b22xx22xx21..", "..1222xx22xx1...", "....11xx11xx....", "................", "................", "................", "................"], "em": ["..44.44.", ".455455.", "..44.44.", ".32xx2x.", "2k2xx2xx", "222xx2x.", ".12xx1..", "........"], "palette": { "1": "#b48a1f", "2": "#f2c94a", "3": "#fbe596", "4": "#86aec2", "5": "#cfe6f0", "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c", "s": "#f1c49b", "t": "#c88b62", "o": "#ffd66e", "x": "#2e2430", "b": "#ee8f8a" } }];

// src/v4/art/icons/leaders.js
var leaders_default = [{ "id": "_leader", "kind": "leader", "px": ["................................", "..............3321..............", "............33332221............", "...........3333322221...........", "..........332111111221..........", "..........331dddddd121..........", ".........331dddddddd121.........", ".........321dddddddd121.........", ".........321dooddood121.........", ".........321dddddddd121.........", ".........321dddddddd121.........", ".........3221dddddd1221.........", "........3222211111122221........", ".......3222g22222222g2221.......", "......31111g11111111g11111......", ".....3222222g222222g2222221.....", ".....3221222g222222g2221221.....", "....32221222yyyyyyyy22212221....", "....3222122ymmmmmmmmy2212221....", "....322212ymmmmmmmmmmg212221....", "....322212ymmmmmmmmmmg212221....", "....322212ymmmmmmmmmmg212221....", "....322212ymmmmmmmmmmG212221....", "....322212ymmmmmmmmmmG212221....", "....322212gmmmmmmmmmmG212221....", "....322212gmmmmmmmmmmG212221....", "....322212gmmmmmmmmmmG212221....", "....ygggg22GmmmmmmmmG22ygggg....", "....32222222GGGGGGGG22222221....", "...32222222222222222222222221...", "...11111111111111111111111111...", "................................"], "base": { "k": "#1c1410", "d": "#1a120e", "o": "#ffd978", "g": "#d9a63a", "y": "#f6d77e", "G": "#8f6516", "m": "#20160f" }, "panel": { "x": 10, "y": 17, "size": 12 }, "emblem": { "x": 12, "y": 19, "size": 8 }, "accents": { "plum": "#86587e", "slate": "#5e7a8c", "clay": "#a8644a", "moss": "#6e7d4a", "teal": "#4c8077", "rose": "#a45a64" } }, { "id": "_follower", "kind": "follower", "px": ["..........", "...wwwc...", "...wwwc...", "....wc....", ".wwwwwwwc.", "..wwwwwc..", "..wwwwwc..", "..wc..wc..", "..cc..cc..", ".........."], "base": { "k": "#1c1410", "w": "#f6eedb", "c": "#cbbd9c" } }];

// src/v4/art/icons/index.js
var icons_default = [calibration_default, batch_blue_white_green_purple_default, batch_gold_red_guests_default, batch_magenta_silver_yellow_default, emojis_default, leaders_default].flat();

// src/v4/art/index.js
function row(w, fill, edgeL = "3", edgeR = "1") {
  if (w <= 0) return ".".repeat(24);
  const inner = typeof fill === "function" ? fill(w) : fill.repeat(Math.max(0, w - 2));
  const s = w === 1 ? fill[0] : edgeL + inner.slice(0, w - 2) + edgeR;
  const left = Math.floor((24 - s.length) / 2);
  return ".".repeat(left) + s + ".".repeat(24 - left - s.length);
}
var HOOD = (() => {
  const W2 = [0, 4, 8, 10, 12, 12, 14, 14, 14, 14, 16, 18, 18, 18, 20, 20, 20, 20, 22, 22, 22, 22, 22, 0];
  return W2.map((w, y) => {
    if (y >= 5 && y <= 9) {
      const face = w - 6;
      const mid = y === 7 ? "l".padStart(Math.ceil(face / 2) - 1, "d").padEnd(face - (Math.ceil(face / 2) - 1), "d").replace(/d$/, "l").split("") : Array(face).fill("d");
      if (y === 7) {
        mid.fill("d");
        mid[1] = "l";
        mid[face - 2] = "l";
      }
      return row(w, () => `22${mid.join("")}22`);
    }
    if (y >= 13 && y <= 22) return row(w, (n) => {
      const a = "2".repeat(n);
      const c = Math.floor(n / 2);
      return a.slice(0, c - 1) + "k" + a.slice(c);
    });
    return row(w, "2");
  });
})();
var TOKEN = (() => {
  const W2 = [0, 0, 0, 8, 12, 14, 16, 18, 18, 20, 20, 20, 20, 20, 20, 18, 18, 16, 14, 12, 8, 0, 0, 0];
  return W2.map((w) => row(w, "2"));
})();
var BY_ID = new Map(icons_default.filter((i) => i.kind === "member" || i.kind === "action").map((i) => [i.id, i]));

// src/v4/art/emojis.js
var EMOJIS = icons_default.filter((i) => i.kind === "emoji");

// src/v4/format.js
function newLogLines(prev, next) {
  const a = prev.log, b = next.log;
  if (a === b) return [];
  if (b.length >= a.length && (a.length === 0 || b[a.length - 1] === a[a.length - 1])) return b.slice(a.length);
  const tail = a.slice(-4);
  for (let j = b.length; j >= tail.length; j--) {
    if (tail.every((l, k) => b[j - tail.length + k] === l)) return b.slice(j);
  }
  return b.slice(-1);
}

// src/v4/game/gains.js
var esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function gainsBetween(before, state) {
  if (!before || !state || before === state || before.seed !== state.seed) return [];
  if (!(state.moves > before.moves)) return [];
  const lines = newLogLines(before, state);
  const newRound = state.round !== before.round;
  const actor = before.pending ? before.pending.player : null;
  const placed = newRound ? [] : Object.keys(state.slots).filter((k) => before.slots[k] === void 0);
  const placedKey = placed.length ? placed[placed.length - 1] : null;
  const R = state.resources;
  const d = state.players.map((p, i) => Object.fromEntries(R.map((r) => [r, (p.res[r] || 0) - (before.players[i].res[r] || 0)])));
  const out = [];
  const take = (pid, r, n, from, to) => {
    if (n > 0) out.push({ what: "res", r, n, from, to });
  };
  for (const p of state.players) {
    for (const u of p.members) {
      let def;
      try {
        def = cardDef(state, u);
      } catch {
        continue;
      }
      const own = new RegExp(`(^|\\(|\\s)${esc(p.name)}'s ${esc(def.name)}(?![A-Za-z0-9\xC0-\u024F])`);
      for (const l of lines) {
        if (!own.test(l)) continue;
        for (const m11 of l.matchAll(/(?:^|[\s(])([^\s(:]+) \+(\d+) (\w+)|: \+(\d+) (\w+)/g)) {
          const who = m11[1] ? state.players.find((x) => x.name === m11[1]) : p;
          const n = Number(m11[2] || m11[4]), r = m11[3] || m11[5];
          if (!who || !R.includes(r) || !(d[who.id][r] > 0)) continue;
          const k = Math.min(n, d[who.id][r]);
          d[who.id][r] -= k;
          take(who.id, r, k, { kind: "member", pid: p.id, def: def.id }, { kind: "stack", pid: who.id, r });
        }
      }
    }
  }
  for (const r of R) {
    for (const g of state.players) {
      for (const q2 of state.players) {
        if (g.id === q2.id || !(d[g.id][r] > 0) || !(d[q2.id][r] < 0)) continue;
        const k = Math.min(d[g.id][r], -d[q2.id][r]);
        d[g.id][r] -= k;
        d[q2.id][r] += k;
        take(g.id, r, k, { kind: "stack", pid: q2.id, r }, { kind: "stack", pid: g.id, r });
      }
    }
  }
  const usedUid = actor == null || newRound ? null : state.players[actor].members.find((u) => state.cards[u] && state.cards[u].used && before.cards[u] && !before.cards[u].used);
  let usedSrc = null;
  if (usedUid != null) {
    try {
      usedSrc = { kind: "member", pid: actor, def: cardDef(state, usedUid).id };
    } catch {
    }
  }
  const recruited = state.players.map((p, i) => p.members.filter((u) => !before.players[i].members.includes(u) && before.shop.includes(u)));
  const boughtN = state.players.map((p, i) => (p.bonus || 0) - (before.players[i].bonus || 0));
  for (const p of state.players) {
    for (const r of R) {
      if (!(d[p.id][r] < 0)) continue;
      const to = recruited[p.id].length ? { kind: "card", uid: recruited[p.id][0] } : boughtN[p.id] > 0 ? { kind: "rate", n: boughtN[p.id] } : placedKey && p.id === actor ? { kind: "slot", key: placedKey } : usedSrc && p.id === actor ? usedSrc : { kind: "hub" };
      out.unshift({ what: "res", r, n: -d[p.id][r], from: { kind: "stack", pid: p.id, r }, to, pay: true });
      d[p.id][r] = 0;
    }
  }
  const released = lines.some((l) => / released .* for /.test(l));
  for (const p of state.players) {
    for (const r of R) {
      if (!(d[p.id][r] > 0)) continue;
      const from = placedKey ? { kind: "slot", key: placedKey } : usedSrc || (newRound || released && p.id === actor ? { kind: "crowd", pid: p.id } : { kind: "hub" });
      take(p.id, r, d[p.id][r], from, { kind: "stack", pid: p.id, r });
      d[p.id][r] = 0;
    }
  }
  if (!newRound) {
    for (const p of state.players) {
      const f = followers(state, p) - followers(before, before.players[p.id]);
      if (!(f > 0)) continue;
      const from = usedSrc ? usedSrc : boughtN[p.id] > 0 ? { kind: "rate", n: boughtN[p.id] } : recruited[p.id].length ? { kind: "card", uid: recruited[p.id][0] } : placedKey ? { kind: "slot", key: placedKey } : { kind: "hub" };
      out.push({ what: "fol", n: f, from, to: { kind: "total", pid: p.id } });
    }
  }
  return out;
}

// src/v4/game/Tick.jsx
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

// src/v4/game/director.js
var causeKey = (c) => c ? `${c.kind}:${c.pid ?? ""}:${c.uid ?? ""}:${c.key ?? ""}:${c.qid ?? ""}:${c.tier ?? ""}` : "";
var TYPICAL = 450;
function fromGains(before, state) {
  const conv = (w) => {
    switch (w && w.kind) {
      case "slot":
        return { kind: "space", key: w.key };
      case "total":
        return { kind: "count", pid: w.pid };
      case "card":
        return { kind: "shop", uid: w.uid };
      case "rate":
        return { kind: "rate", n: w.n };
      default:
        return w;
    }
  };
  return gainsBetween(before, state).map((m11, i) => {
    const from = conv(m11.from), to = conv(m11.to);
    const cause = from.kind === "member" ? { kind: "member", pid: from.pid, def: from.def } : from.kind === "space" ? { kind: "space", key: from.key } : { kind: "guess", n: i };
    return { n: i, type: m11.what === "fol" ? "followers" : m11.pay ? "pay" : from.kind === "stack" ? "transfer" : "gain", cause, from, to, what: m11.what === "fol" ? { n: m11.n } : { r: m11.r, n: m11.n } };
  });
}
function movesOf(cause, effects, owner) {
  const pays = [], takes = [], gives = [], gains = [], cards = [], fols = [];
  const used = /* @__PURE__ */ new Set();
  for (const p of effects) {
    if (p.type !== "pay" || p.from.pid === owner || used.has(p)) continue;
    const g = effects.find((e) => e.type === "gain" && !used.has(e) && e.to.pid === owner && e.what.n === p.what.n);
    if (g) {
      used.add(p);
      used.add(g);
      takes.push({ from: p.from, to: g.to, n: p.what.n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null });
    }
  }
  for (const e of effects) {
    if (used.has(e)) continue;
    if (e.type === "pay") pays.push(e);
    else if (e.type === "transfer") (owner != null && e.to.pid === owner ? takes : gives).push({ from: e.from, to: e.to, n: e.what.n, r: e.what.r });
    else if (e.type === "gain") gains.push(e);
    else if (e.type === "recruit" || e.type === "member-move" || e.type === "release") cards.push(e);
    else if (e.type === "followers" && e.what.n) fols.push(e);
  }
  gains.sort((a, b) => (a.to.pid === owner ? 0 : 1) - (b.to.pid === owner ? 0 : 1));
  return { pays, takes, gives, gains, cards, fols };
}
function planChain(before, state, { mine: mine2 = [], measure = null } = {}) {
  const atoms = [];
  if (!before || !state || before === state || before.seed !== state.seed || !(state.moves > before.moves)) return { atoms, total: 0 };
  const dist = (a, b) => measure ? measure(a, b) : TYPICAL;
  const fly = (a, b) => flightMs(dist(a, b));
  let t = 0, end = 0;
  const at = (time, op) => {
    atoms.push({ at: Math.round(time), ...op });
    return time;
  };
  const ends = (x) => {
    end = Math.max(end, x);
    return x;
  };
  const sameRound = state.round === before.round;
  let pulsed = null;
  const placed = sameRound ? Object.keys(state.slots).filter((k) => before.slots[k] === void 0) : [];
  for (const key of placed) {
    const pid = state.slots[key];
    if (mine2.includes(pid)) {
      at(0, { op: "minion", pid, key, own: true, dur: MO.trail });
      at(0, { op: "pulse", place: { kind: "space", key }, dur: MO.ownStamp });
      t = ends(MO.trail * 0.6);
    } else {
      at(0, { op: "minion", pid, key, own: false, dur: MO.minionFly });
      const landed = ends(MO.minionFly);
      at(landed + Math.max(0, MO.readHold - MO.pulse), { op: "pulse", place: { kind: "space", key }, dur: MO.pulse });
      t = ends(landed + MO.readHold);
    }
    pulsed = key;
  }
  if (!sameRound && before.round >= 1) {
    at(0, { op: "home" });
    t = ends(MO.minionsHome);
  }
  const fx = Array.isArray(state.effects) && state.moves === before.moves + 1 ? state.effects : fromGains(before, state);
  const beats = [];
  for (const e of fx) {
    if (!e || !e.cause || e.cause.kind === "contest") continue;
    if (["refill", "shop-out", "discount"].includes(e.type)) continue;
    const k = causeKey(e.cause);
    if (!beats.length || beats[beats.length - 1].key !== k) beats.push({ key: k, cause: e.cause, effects: [] });
    beats[beats.length - 1].effects.push(e);
  }
  let hand = 0;
  const pieces = (time, from, to, n, opt = {}) => {
    const d = opt.dur || fly(from, to);
    hand = Math.max(hand, (n >= 4 ? time : time + (n - 1) * MO.pieceStagger) + d * (2 / 3));
    if (n >= 4) {
      at(time, { op: "piece", from, to, n, bundle: true, dur: d, ...opt });
      at(time + d, { op: "land", to, by: n, bundle: true, ...opt });
      return { last: time, d };
    }
    for (let k = 0; k < n; k++) {
      at(time + k * MO.pieceStagger, { op: "piece", from, to, n: 1, dur: d, ...opt });
      at(time + k * MO.pieceStagger + d, { op: "land", to, by: 1, ...opt });
    }
    return { last: time + (n - 1) * MO.pieceStagger, d };
  };
  const after = (r) => r.last + nextBeatAt(r.d);
  const owner0 = (c) => c.kind === "recruit" || c.kind === "buy" || c.kind === "space" || c.kind === "move" || c.kind === "release" || c.kind === "member" ? c.pid : null;
  for (const beat of beats) {
    const c = beat.cause, owner = owner0(c);
    const m11 = movesOf(c, beat.effects, owner);
    let s = t;
    if (c.kind === "member" && c.uid != null) {
      at(s, { op: "hop", place: { kind: "member", pid: c.pid, uid: c.uid, def: c.def } });
      s += MO.lead;
    } else if (c.kind === "space" && c.key !== pulsed) {
      at(s, { op: "pulse", place: { kind: "space", key: c.key }, dur: MO.pulse });
      s += MO.lead;
      pulsed = c.key;
    }
    let next = s;
    const isRecruit = c.kind === "recruit" && m11.cards.some((e) => e.type === "recruit");
    if (isRecruit) {
      const card = m11.cards.find((e) => e.type === "recruit");
      const hold = mine2.includes(card.to.pid) ? 0 : MO.rivalBuyHold;
      let paid = s + MO.cardLift + hold;
      for (const [i, p] of m11.pays.entries()) {
        const r = pieces(s + MO.cardLift + hold + i * MO.fan, p.from, { kind: "shop", index: c.index, uid: c.uid }, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid });
        paid = Math.max(paid, r.last + r.d * (2 / 3));
      }
      const d = fly(card.from, card.to);
      hand = Math.max(hand, paid + d * (2 / 3));
      at(s, { op: "card", uid: card.what.uid, to: card.to.pid, from: card.from, lift: MO.cardLift, wait: paid - s - MO.cardLift, dur: d });
      const landed = ends(paid + d);
      if (card.what.worth > 0) {
        const r = pieces(landed, { kind: "crowd", pid: card.to.pid, uid: card.what.uid }, { kind: "count", pid: card.to.pid }, card.what.worth, { fol: true, dur: MO.worthHop });
        next = ends(after(r));
        ends(r.last + r.d);
      } else next = landed;
      m11.pays.length = 0;
      m11.cards.splice(m11.cards.indexOf(card), 1);
    }
    if (c.kind === "buy") {
      let paid = s;
      const rate = { kind: "rate", tier: c.tier, n: c.get };
      for (const [i, p] of m11.pays.entries()) {
        const r = pieces(s + i * MO.fan, p.from, rate, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid });
        paid = Math.max(paid, r.last + r.d);
      }
      at(paid, { op: "pulse", place: rate, dur: MO.accept, press: true });
      let o = paid + MO.accept;
      for (const f of m11.fols) {
        const r = pieces(o, rate, f.to, f.what.n, { fol: true });
        next = Math.max(next, after(r));
        ends(r.last + r.d);
        o += MO.fan;
      }
      m11.pays.length = 0;
      m11.fols.length = 0;
      next = ends(Math.max(next, o));
    }
    let cur = Math.max(s, next === s ? s : next);
    const phase = (list) => {
      if (!list.length) return;
      let lastR = null, o = cur;
      for (const g of list) {
        if (g.tug) at(o, { op: "tug", place: g.from, toward: g.to, dur: MO.tug });
        const r = pieces(o + (g.tug ? MO.tug : 0), g.from, g.to, g.n, g.opt);
        ends(r.last + r.d);
        if (!lastR || r.last + r.d > lastR.last + lastR.d) lastR = r;
        o += MO.fan;
      }
      cur = after(lastR);
    };
    phase(m11.pays.map((p) => ({ from: p.from, to: p.to.kind === "bank" && pulsed ? { kind: "space", key: pulsed } : p.to, n: p.what.n, opt: { pay: true, r: p.what.r, owner: p.from.pid } })));
    phase(m11.takes.map((x) => ({ from: x.from, to: x.to, n: x.n, tug: true, opt: { take: true, r: x.r, turn: x.turn, owner: x.to.pid } })));
    phase(m11.gives.map((x) => ({ from: x.from, to: x.to, n: x.n, opt: { r: x.r, owner: x.to.pid } })));
    const own = m11.gains.filter((g) => g.to.pid === owner || owner == null), spill = m11.gains.filter((g) => !(g.to.pid === owner || owner == null));
    const before0 = cur;
    phase(own.map((g) => ({ from: g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid } })));
    if (spill.length) {
      cur = own.length ? cur : before0;
      phase(spill.map((g) => ({ from: g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid, light: true } })));
    }
    for (const card of m11.cards) {
      const d = card.type === "member-move" ? MO.swap : fly(card.from, card.to);
      at(cur, { op: "chip", from: card.from, to: card.to, uid: card.what.uid, path: card.type === "release" ? "drop" : card.type === "member-move" ? "line" : "arc", dur: d });
      ends(cur + d);
      cur += nextBeatAt(d);
    }
    phase(m11.fols.map((f) => f.what.n > 0 ? { from: f.from.kind === "bank" && pulsed ? { kind: "space", key: pulsed } : f.from, to: f.to, n: f.what.n, opt: { fol: true } } : { from: f.from, to: f.to, n: -f.what.n, opt: { fol: true, pay: true } }));
    t = Math.max(t, cur);
  }
  const turnPasses = !!(state.pending && before.pending && state.pending.player !== before.pending.player);
  return { atoms: atoms.sort((a, b) => a.at - b.at), total: end ? end + (turnPasses ? MO.breath : 0) : 0, handoff: end ? Math.round(Math.max(hand, t)) : 0, turnPasses };
}

// ../../../tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/md/plan-entry.mjs
var [speed2 = "steady", gamesArg = "6", verbose = "0", seedBase = "11"] = process.argv.slice(2);
setMotionSpeed(speed2);
var q = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
};
var turns = [];
var waits = [];
var mine = [];
var chains = [];
var byCause = /* @__PURE__ */ new Map();
for (let g = 0; g < Number(gamesArg); g++) {
  const seed = Number(seedBase) + g;
  const seats = [{ name: "P1", kind: "bot" }, { name: "P2", kind: "bot" }, { name: "P3", kind: "bot" }, { name: "P4", kind: "bot" }];
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  let cur = null;
  let waitStart = null, waitMs = 0;
  for (let n = 0; n < 4e3 && !s.over; n++) {
    const pend = s.pending;
    const actor = pend ? pend.player : null;
    const mv = chooseBotMove(s, rand);
    const next = applyMove(s, mv, { effects: true });
    if (s.round < 1) {
      s = next;
      continue;
    }
    const plan = planChain(s, next, { mine: [0] });
    const sameNext = !!(next.pending && pend && next.pending.player === pend.player);
    const PASS = { quick: 150, steady: 300, relaxed: 500 }[speed2];
    const ms = process.env.OLD ? plan.total || (actor !== 0 ? 600 : 0) : plan.total ? sameNext ? plan.handoff ?? plan.total : plan.total : actor !== 0 ? sameNext ? 0 : PASS : 0;
    const kinds = [...new Set((next.effects || []).map((e) => e.cause && e.cause.kind))].join(",");
    chains.push({ ms, actor, kind: pend && pend.kind, kinds, atoms: plan.atoms.length });
    const ck = `${pend && pend.kind}`;
    if (!byCause.has(ck)) byCause.set(ck, []);
    byCause.get(ck).push(ms);
    if (verbose === "1" && ms > 2600 || verbose === "pay" && pend && pend.kind === "pay" && actor !== 0 && Math.random() < 0.04 || verbose === "place" && pend && pend.kind === "place" && actor !== 0 && Math.random() < 0.03) console.log("long chain", ms, "actor", actor, pend && pend.kind, kinds, plan.atoms.map((a) => `${a.at}:${a.op}${a.dur ? "(" + a.dur + ")" : ""}${a.n ? "x" + a.n : ""}${a.bundle ? "B" : ""}`).join(" "));
    if (!cur || cur.pid !== actor || cur.round !== s.round) {
      if (cur) (cur.pid === 0 ? mine : turns).push(cur.ms);
      cur = { pid: actor, ms: 0, round: s.round };
    }
    cur.ms += ms;
    if (actor === 0) {
      if (waitStart != null && waitMs > 0) waits.push(waitMs);
      waitStart = null;
      waitMs = 0;
    } else {
      if (waitStart == null) waitStart = n;
      waitMs += ms;
    }
    s = next;
  }
  if (cur) (cur.pid === 0 ? mine : turns).push(cur.ms);
}
var row2 = (name, xs) => console.log(`${name.padEnd(34)} n=${String(xs.length).padStart(4)}  p50=${String(q(xs, 0.5)).padStart(5)}  p95=${String(q(xs, 0.95)).padStart(5)}  max=${String(Math.max(...xs)).padStart(5)}`);
console.log(`speed=${speed2} games=${gamesArg} (plan only: planChain at 450px typical distances, P1 as "mine")`);
row2("a rival turn (sum of its chains)", turns.filter((x) => x > 0));
row2("P1 turn (sum of its chains)", mine.filter((x) => x > 0));
row2("wait between P1 turns (rivals)", waits);
for (const [k, xs] of byCause) row2(`chain: ${k}`, xs.filter((x) => x > 0));
