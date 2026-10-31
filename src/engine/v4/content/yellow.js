// Yellow 2.0 (Cory, 2026-10-30/31): "Yellow rewards going broad, i.e. having a combination of colors and being
// flexible. it also allows you to translate currencies (kind of like launderer)". It changes colors, yours and rivals',
// and pays for members of many colors. Contests stay a separate color's job: Yellow's contest is most yellow, as every
// 2.0 color's is (Claude, under Cory's go-with-your-gut). The wheel and deck: design/decisions.md, Oct 30-31.
import { gainColorOf } from './color-of.js';
import { startLaunder } from './launder.js';
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

const Y = 'yellow';
const colors = ctx => ctx.state.resources;
const others = ctx => colors(ctx).filter(c => c !== Y);
/** Full sets: one of each color on the table. */
export const setsOf = (ctx, p) => Math.min(...colors(ctx).map(c => p.res[c] || 0));
const held = (ctx, p) => colors(ctx).filter(c => (p.res[c] || 0) > 0);
const missing = (ctx, p) => colors(ctx).filter(c => !(p.res[c] > 0));
const total = (ctx, p) => colors(ctx).reduce((a, c) => a + (p.res[c] || 0), 0);
// a member's color, or null when its sphere isn't on this table (a guest member leaning to an absent sphere)
const colorOf = (ctx, card) => { const r = ctx.quadrant(ctx.defOf(card).quadrant).resource; return ctx.state.resources.includes(r) ? r : null; };
const eachColor = (ctx, p, n, opts) => { for (const c of colors(ctx)) ctx.gain(p, c, n, opts); };
/** The table's colors p has at least one member of (Drifters counts as its chosen color). */
const memberColors = (ctx, p) => ctx.state.quadrants.filter(q => ctx.countMembersOfColor(p, q) > 0);
const touchable = (ctx, p) => ctx.rivals(p).filter(o => ctx.canSteal(p, o, 'res'));

export default {
  id: 'yellow',
  name: 'Yellow',
  resource: Y,
  scoring: { label: 'Most yellow', counts: 'the yellow you hold when the round ends', score: (ctx, p) => p.res[Y] },

  actions: [
    {
      // fuel with Yellow's flavor (Cory, 2026-10-30): "+3wild +4wild +5wild"
      key: 'harvest', ring: 1, name: 'Harvest', text: '+3 in round I, +4 in round II, +5 in round III, in colors you choose.',
      byRound: { lead: 'In colors you choose:', lines: ['+3', '+4', '+5'] },
      estimate: ctx => ctx.state.round + 2.5,
      resolve(ctx, p) { pickColors(ctx, p, ctx.state.round + 2, 'Harvest', true); },
    },
    {
      key: 'transmute', ring: 1, name: 'Trade Seeds', text: '+2 yellow, then swap up to 3 of your resources for other colors.', // Cory, 2026-10-15: the gain first, then the swap (was swap, then +1)
      estimate: (ctx, p) => 2 + Math.min(3, Math.max(0, Math.floor(total(ctx, p) / colors(ctx).length) - setsOf(ctx, p))) * 0.8,
      resolve(ctx, p) { ctx.gain(p, Y, 2, { fromAction: true }); transmuteStep(ctx, p, { left: Math.min(3, total(ctx, p)), done: 0 }); },
    },
    {
      // Cory, 2026-10-31: "does the same thing as trade seeds but you do it for opponents", no selector
      key: 'dilute', ring: 1, name: 'Dilute', text: "+2 yellow, then change up to 3 of rivals' resources one for one.",
      estimate: (ctx, p) => 2 + 0.6 * Math.min(3, touchable(ctx, p).reduce((a, o) => a + total(ctx, o), 0)),
      resolve(ctx, p) { ctx.gain(p, Y, 2, { fromAction: true }); startChange(ctx, p, { who: 'Dilute', left: 3 }); },
    },
    {
      // Cory, 2026-10-30: "maybe it should just be a bigger dilute? like +4 rearrange 6? for opponent". Name: Claude's.
      key: 'bigdilute', ring: 2, name: 'Big Dilute', text: "+4 yellow, then change up to 6 of rivals' resources one for one.",
      estimate: (ctx, p) => 4 + 0.6 * Math.min(6, touchable(ctx, p).reduce((a, o) => a + total(ctx, o), 0)),
      resolve(ctx, p) { ctx.gain(p, Y, 4, { fromAction: true }); startChange(ctx, p, { who: 'Big Dilute', left: 6 }); },
    },
    {
      // Cory, 2026-10-30: "+1 rainbow per, and then also +2 yellow"
      key: 'meltingpot', ring: 2, name: 'Melting Pot', text: '+1 per color among your members, in colors you choose. +2 yellow.',
      estimate: (ctx, p) => memberColors(ctx, p).length + 2,
      resolve(ctx, p) {
        ctx.gain(p, Y, 2, { fromAction: true });
        const k = memberColors(ctx, p).length;
        if (k) pickColors(ctx, p, k, 'Melting Pot', true);
        else ctx.log(`${p.name}'s Melting Pot: no members yet, so only the yellow.`);
      },
    },
    {
      // Cory, 2026-10-30: "let's stick with launderers effect round III", "+3 or +4 yellow". Name: Claude's fill-in.
      key: 'makeover', ring: 3, name: 'Makeover', text: '+4 yellow, then rearrange your resources into any mix of colors.',
      estimate: () => 5,
      resolve(ctx, p) { ctx.gain(p, Y, 4, { fromAction: true }); startLaunder(ctx, p, 'Makeover'); },
    },
  ],

  handlers: {
    swap(ctx, p, value, data) {
      if (value === 'done') { finishTransmute(ctx, p, data); return; }
      const [from, to] = value;
      p.res[from] -= 1; p.res[to] += 1;
      // each swap said as it happens, so the log never lags the coins (Cory, 2026-10-22: every change and why)
      ctx.log(`${p.name} swapped 1 ${from} for 1 ${to} (${data.who || 'Trade Seeds'}).`);
      const tally = { ...(data.tally || {}) };
      tally[`${from}>${to}`] = (tally[`${from}>${to}`] || 0) + 1;
      transmuteStep(ctx, p, { ...data, left: data.left - 1, done: data.done + 1, tally });
    },
    wild(ctx, p, c, data) {
      ctx.gain(p, c, 1, { fromAction: !!data.fromAction });
      ctx.log(`${p.name}'s ${data.who}: +1 ${c}.`);
      if (data.left > 1) pickColors(ctx, p, data.left - 1, data.who, data.fromAction, data.got + 1);
    },
    changeFrom(ctx, p, value, data) {
      if (value === 'done') { if (!data.done) ctx.log(`${p.name}'s ${data.who}: changed nothing.`); return; }
      const [oid, a] = value, o = ctx.state.players[oid];
      ctx.choose(p, `${data.who}: change ${o.name}'s 1 ${a} into which color?`, colors(ctx).filter(b => b !== a).map(b => ({
        id: `color:${b}`, label: `1 ${b}`, kind: 'color', value: b, hint: -(o.res[b] || 0) + (b === Y ? -1 : 0),
      })), 'yellow.changeTo', { ...data, pick: [oid, a] });
    },
    changeTo(ctx, p, b, data) {
      const [oid, a] = data.pick, o = ctx.state.players[oid];
      if ((o.res[a] || 0) > 0) changeOne(ctx, p, o, a, b, data.who);
      if (data.follower) { p.bonus += 1; ctx.log(`${p.name}'s ${data.who}: +1 follower.`); }
      const next = { ...data, pick: null, left: data.left - 1, done: data.done + 1, used: [...(data.used || []), oid] };
      if (next.left > 0) changeStep(ctx, p, next);
    },
    gobetween(ctx, p, value) {
      if (!value) return;
      const [a, b] = value;
      if (!(p.res[a] > 0)) return;
      p.res[a] -= 1; p.res[b] += 1;
      ctx.log(`${p.name}'s Go-Between: 1 ${a} becomes 1 ${b}.`);
    },
    sow(ctx, p, x, data) {
      if (!x) return;
      const card = ctx.card(data.uid);
      p.res[Y] -= x; card.sown = (card.sown || 0) + x;
      ctx.log(`${p.name}'s Sower plants ${x} yellow.`);
    },
    drift(ctx, p, q, data) {
      const card = ctx.card(data.uid);
      card.asColor = q;
      ctx.log(`${p.name}'s Drifters count as a ${ctx.quadrant(q).name} member.`);
    },
    level(ctx, p, b) {
      for (const o of touchable(ctx, p)) {
        const pool = colors(ctx).filter(c => c !== b && (o.res[c] || 0) > 0);
        if (!pool.length) continue;
        const top = Math.max(...pool.map(c => o.res[c]));
        changeOne(ctx, p, o, pool.find(c => o.res[c] === top), b, 'Leveler');
      }
    },
  },

  members: [
    m('gardener', 'Gardener', 2, 0, 'On Recruit: +1 of each color you have none of. Round Start: +1 of each color you have none of.', { now: true,
      onRoundStart(ctx, owner) { for (const c of missing(ctx, owner)) ctx.gain(owner, c, 1); },
    }),
    // Cory, 2026-10-31: "maybe just +1 yellow when any of your resources are stolen or moved"
    m('customs', 'Customs', 2, 1, 'Whenever a rival steals or changes any of your resources, +1 yellow.', {
      onSteal(ctx, owner, card, info) { if (info.victim === owner && info.thief !== owner) { ctx.gain(owner, Y, 1); ctx.log(`${owner.name}'s Customs: +1 yellow.`); } },
      onChanged(ctx, owner, card, by) { if (by !== owner) { ctx.gain(owner, Y, 1); ctx.log(`${owner.name}'s Customs: +1 yellow.`); } },
    }),
    // Claude's fill-in (Cory, 2026-10-31: "whenever you recruit, +1 of its color" may become Red's artifact)
    m('gobetween', 'Go-Between', 2, 2, 'Whenever a space gives you resources, you may change 1 of them to any color.', {
      afterGain(ctx, owner, card, g) {
        if (!g.fromAction || !(g.n > 0) || card.gbTurn === ctx.turnKey()) return;
        card.gbTurn = ctx.turnKey();
        const a = g.color;
        ctx.choose(owner, `Go-Between: change 1 ${a} to another color?`, [
          { id: 'keep', label: `Keep the ${a}`, kind: 'pass', value: null, hint: 0 },
          ...colors(ctx).filter(b => b !== a).map(b => ({ id: `color:${b}`, label: `1 ${a} → 1 ${b}`, kind: 'swap', value: [a, b], hint: (owner.res[a] || 0) - (owner.res[b] || 0) - 1.5 })),
        ], 'yellow.gobetween');
      },
    }),
    // Cory, 2026-10-31: "make it 3 and add on recruit as well"
    m('tinker', 'Tinker', 3, 2, 'On Recruit: swap up to 3 of your resources one for one. Round Start: swap up to 3 of your resources one for one.', { now: true,
      onRoundStart(ctx, owner) { transmuteStep(ctx, owner, { who: 'Tinker', left: Math.min(3, total(ctx, owner)), done: 0 }); },
    }),
    // Cory, 2026-10-31: "needs to be more expensive" (was 4)
    m('harmonist', 'Harmonist', 4, 2, 'Game End: +1 follower per full set you hold.', {
      onGameEnd: (ctx, owner) => setsOf(ctx, owner),
    }),
    // Cory, 2026-10-31: "also give followers… like side quests"
    m('matchmaker', 'Matchmaker', 3, 2, 'Whenever you recruit a member of a color none of your members have, +2 in colors you choose and +1 follower.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner || recruited.uid === card.uid) return;
        const q = ctx.defOf(recruited).quadrant;
        if (!ctx.state.quadrants.includes(q) || ctx.countMembersOfColor(owner, q) > (ctx.defOf(recruited).n ?? 1)) return;
        owner.bonus += 1;
        ctx.log(`${owner.name}'s Matchmaker: a new color, +1 follower.`);
        pickColors(ctx, owner, 2, 'Matchmaker');
      },
    }),
    // Cory, 2026-10-31: "i dont like round end. i like on recruit and round start"
    m('dyer', 'Dyer', 4, 2, 'On Recruit: +1 yellow per color you hold. Round Start: +1 yellow per color you hold.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, Y, held(ctx, owner).length); },
    }),
    // Cory, 2026-10-31: "definitely too expensive" (was 4 + 4); 3 + 1 read strong in both bot runs, so 3 + 2 (Claude, Oct 31 balance run)
    m('explorer', 'Explorer', 3, 2, 'Whenever you take a space outside Yellow, +1 yellow.', {
      afterAction(ctx, owner, card, qid) { if (qid !== 'yellow') ctx.gain(owner, Y, 1); },
    }),
    // Cory, 2026-10-31: "there should be an On Recruit rearrange opponents resources"
    m('agitator', 'Agitator', 3, 2, "On Recruit: change up to 4 of rivals' resources one for one.", {
      onRecruited(ctx, owner) { startChange(ctx, owner, { who: 'Agitator', left: 4 }); },
    }),
    // Claude's fill-in (Cory, 2026-10-31: "just come up with whatever's remaining quick")
    m('ringleader', 'Ringleader', 3, 2, "On Recruit: change 1 of each rival's resources one for one. +1 follower per rival changed.", {
      onRecruited(ctx, owner) { startChange(ctx, owner, { who: 'Ringleader', left: touchable(ctx, owner).length, perRival: true, follower: true }); },
    }),
    // Cory, 2026-10-31 ("Drifters is good"; worth 2)
    m('drifters', 'Drifters', 2, 2, 'Worth 2 followers. On Recruit: choose a color; these count as a member of that color.', { f: 2,
      onRecruited(ctx, owner, card) {
        ctx.choose(owner, 'Drifters: count as a member of which color?', ctx.state.quadrants.map(q => ({
          id: `color:${q}`, label: ctx.quadrant(q).name, kind: 'color', value: q, hint: ctx.countMembersOfColor(owner, q) ? -1 : 1,
        })), 'yellow.drift', { uid: card.uid });
      },
    }),
    // Cory, 2026-10-31: "Make this Use Once Per Round"
    m('leveler', 'Leveler', 4, 3, "On Use, once per round: choose a color; 1 of each rival's biggest color becomes it.", {
      activate: 'round',
      onActivate(ctx, owner) {
        ctx.choose(owner, 'Leveler: change 1 of each rival\'s biggest color into which color?', colors(ctx).map(b => ({
          id: `color:${b}`, label: b, kind: 'color', value: b, hint: -Math.max(0, ...ctx.rivals(owner).map(o => o.res[b] || 0)),
        })), 'yellow.level');
      },
      botActivate: (ctx, owner) => touchable(ctx, owner).some(o => total(ctx, o) > 0),
    }),
    // Cory, 2026-10-31 (in place of HR's "+3 per color you have 3 members of")
    m('bigtent', 'Big Tent', 4, 3, 'Game End: +2 followers per color you have exactly one member of.', {
      onGameEnd: (ctx, owner) => 2 * ctx.state.quadrants.filter(q => ctx.countMembersOfColor(owner, q) === 1).length,
    }),
    // Cory, 2026-10-31: named Book Cooker; "agree this gives multiple followers"
    m('bookcooker', 'Book Cooker', 5, 4, 'Worth 3 followers. On Use, once per game: rearrange your resources into any mix of colors.', { f: 3,
      activate: 'game',
      onActivate(ctx, owner) { startLaunder(ctx, owner, 'Book Cooker'); },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.left === 0,
    }),
    // Claude's fill-in, the second big card
    m('puppeteer', 'Puppeteer', 5, 4, "Worth 3 followers. Round Start: change up to 3 of rivals' resources one for one.", { f: 3,
      onRoundStart(ctx, owner) { startChange(ctx, owner, { who: 'Puppeteer', left: 3 }); },
    }),
    // Yellow's artifact (Cory, 2026-10-31: "I think C is probably best"; replaces Farmer). Name: Claude's fill-in.
    m('guestbook', 'Guest Book', 0, 0, 'Whenever you recruit a member of a color none of your members have, +2 yellow.', { artifact: true,
      onRecruit(ctx, owner, card, by, what) {
        if (by !== owner || !what.member || what.member.uid === card.uid) return;
        const def = ctx.defOf(what.member), q = what.member.asColor || def.quadrant;
        if (!ctx.state.quadrants.includes(q) || ctx.countMembersOfColor(owner, q) > (def.n ?? 1)) return;
        ctx.gain(owner, Y, 2);
        ctx.log(`${owner.name}'s Guest Book: a new member color, +2 yellow.`);
      },
    }),
    // ---- out of the deck since Yellow 2.0 (cull.js); kept so old records still read ----
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m('peddler', 'Peddler', 4, 4, 'On Recruit: +1 of each color. Round Start: +1 of each color.', { now: true,
      onRoundStart(ctx, owner) { for (const c of colors(ctx)) ctx.gain(owner, c, 1); },
    }),
    m('gleaner', 'Gleaner', 6, 4, 'Whenever an action gains you 2 or more of another color at once, +1 yellow.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== Y && g.n >= 2) owner.res[Y] += 1; },
    }),
    m('admirer', 'Admirer', 3, 1, 'Whenever a rival recruits a member of a color you have none of, +1 of that color.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        const c = colorOf(ctx, recruited);
        if (c && by !== owner && !(owner.res[c] > 0)) ctx.gain(owner, c, 1);
      },
    }),
    m('latebloomer', 'Late Bloomers', 2, 2, 'Worth 2 followers. On Recruit: if no rival has fewer followers than you (not counting this card), +1 of each color. Round Start: if no rival has fewer followers than you (not counting this card), +1 of each color.', { now: true, f: 2,
      onRoundStart(ctx, owner, card) {
        // Exclude this physical card, including its value when a Doppelganger copies it.
        const mine = ctx.followers(owner) - Math.max(2, card.def.f);
        if (ctx.rivals(owner).every(o => ctx.followers(o) >= mine)) eachColor(ctx, owner, 1);
      },
    }),
    m('sower', 'Sower', 1, 1, 'Round Start: plant any of your yellow. Round End: gain that many of each other color.', {
      onRoundStartLate(ctx, owner, card) {
        const y = owner.res[Y];
        if (!y) return;
        const amounts = [...new Set([0, Math.floor(y / 4), Math.floor(y / 2), Math.floor((3 * y) / 4), y])];
        ctx.choose(owner, `Sower: plant how much yellow? (you have ${y})`, amounts.map(x => ({
          id: `amount:${x}`, label: x === 0 ? 'None' : x === y ? `All ${x}` : `${x}`, kind: 'amount', value: x, ...(x ? { spend: { yellow: x } } : {}), hint: x === Math.floor(y / 2) ? 1 : 0,
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
    m('rainmaker', 'Rainmaker', 3, 1, 'On Use, once per game: raise each of your colors to match your yellow.', {
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
        const last = ctx.state.round === 3 && owner.left === 0;
        return (ctx.state.round === 3 && gain >= 6) || (last && gain > 0);
      },
    }),
    m('pilgrim', 'Pilgrim', 2, 2, 'On Recruit: +1 of each color.', {
      onRecruited(ctx, owner) { eachColor(ctx, owner, 1); },
    }),
    m('farmer', 'Farmer', 4, 2, 'Whenever an action gains you yellow, +1 yellow.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color === Y && g.n > 0) owner.res[Y] += 1; },
    }),
    m('weaver', 'Weaver', 4, 2, 'Whenever you buy 5 or more followers, +1 of each color.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner && tier?.get >= 5) eachColor(ctx, owner, 1);
      },
    }),
    // was Feastmaker 6+4 (Cory, 2026-10-18): Chefs, a little cheaper, counts as 2 members (worth 2 followers, as Twins)
    m('chefs', 'Chefs', 6, 3, 'Worth 2 followers. On Use, once per game: +1 of each color in round I, +2 in round II, +3 in round III.', {
      f: 2,
      byRound: { lead: 'Worth 2 followers. Once per game:', lines: ['+1 of each color', '+2 of each color', '+3 of each color'] },
      activate: 'game',
      onActivate(ctx, owner) {
        const r = ctx.state.round;
        eachColor(ctx, owner, r);
        ctx.log(`${owner.name} used Chefs: +${r} of each color.`);
      },
      botActivate: ctx => ctx.state.round === 3,
    }),
  ],
};

// Trade Seeds (and Tinker): up to 3 one-for-one swaps of your own, with Done at any time.
function transmuteStep(ctx, p, data) {
  const cs = colors(ctx);
  const opts = [];
  if (data.left > 0) {
    for (const a of cs) if (p.res[a] > 0) for (const b of cs) if (b !== a) {
      opts.push({
        id: `swap:${a}:${b}`, label: `1 ${a} → 1 ${b}`, kind: 'swap', value: [a, b], spend: { [a]: 1, [b]: -1 },
        // bots even out their colors: a swap helps when it moves from a pile 2+ bigger
        hint: p.res[a] - p.res[b] - 1,
      });
    }
  }
  if (!opts.length) { finishTransmute(ctx, p, data); return; }
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Swap nothing', kind: 'done', value: 'done', hint: 0.5 });
  ctx.choose(p, `${data.who || 'Trade Seeds'}: swap one for one, or stop (${data.done} swapped so far)`, opts, 'yellow.swap', data);
}
function finishTransmute(ctx, p, data) {
  if (!data.done) ctx.log(`${p.name} swapped nothing.`);
}

// "+N in colors you choose": one color at a time (bots lean to their fewest)
function pickColors(ctx, p, n, who, fromAction = false, got = 0) {
  ctx.choose(p, `${who}: +1 of which color? (${n} to pick)`, colors(ctx).map(c => ({
    id: `color:${c}`, label: `+1 ${c}`, kind: 'color', value: c, hint: -(p.res[c] || 0),
  })), 'yellow.wild', { left: n, who, fromAction, got });
}

// Changing rivals' resources one for one (Dilute, Big Dilute, Agitator, Ringleader, Puppeteer): pick a rival's
// resource, then the color it becomes. A rival who can't be stolen from can't be changed either (Bodyguard).
function startChange(ctx, p, data) {
  if (!(data.left > 0)) return;
  changeStep(ctx, p, { done: 0, used: [], ...data });
}
function changeStep(ctx, p, data) {
  const opts = [];
  for (const o of touchable(ctx, p)) {
    if (data.perRival && data.used.includes(o.id)) continue;
    for (const a of colors(ctx)) if ((o.res[a] || 0) > 0) opts.push({
      id: `res:${o.id}:${a}`, label: `${o.name}'s ${a}`, kind: 'choice', value: [o.id, a],
      // bots knock down the rival's biggest piles, most of all where that rival out-holds them
      hint: (o.res[a] || 0) - (p.res[a] || 0) * 0.5,
    });
  }
  if (!opts.length) { if (!data.done) ctx.log(`${p.name}'s ${data.who}: no rival resources to change.`); return; }
  opts.push({ id: 'done', label: data.done ? 'Done' : 'Change nothing', kind: 'done', value: 'done', hint: -5 });
  ctx.choose(p, `${data.who}: change a rival's resource (${data.left} left)`, opts, 'yellow.changeFrom', data);
}
function changeOne(ctx, p, o, a, b, who) {
  o.res[a] -= 1; o.res[b] = (o.res[b] || 0) + 1;
  ctx.log(`${p.name}'s ${who}: ${o.name}'s 1 ${a} becomes 1 ${b}.`);
  for (const card of ctx.membersOf(o)) {
    const def = ctx.defOf(card);
    if (def.onChanged) def.onChanged(ctx, o, card, p);
  }
}
