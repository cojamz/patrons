import { memberScoring } from './member-scoring.js';
// Green: the echo. Copy the previous action, an occupied space, or your own occupied spaces.
// Scoring: most green at round end.
//
// The copy rule: a copy gives the space's own printed gain, as its chip shows: the resources and discount the
// action itself handed its taker, never their members' bonuses and never what they paid. A free member copies as
// "a face-up member costing no more, free". A space that took or traded (Collect Debts, Swap Sides…) is copied by doing the
// action yourself. Green's one rule, printed once (the sphere's `rule`, the rulebook and the glossary's "copy"), not
// on each card: copies never copy another copy. Occupied center spaces can be copied too.
//
// Prototype notes (engine changes this module would like, see design/spheres/echo.md):
// - The engine doesn't record what a space gave. install() wraps every action's resolve and every handler,
//   and records the gains/free recruits made through that content's own ctx (members run on a fresh ctx, so
//   their bonuses never land on a chip). The real fix in core.js: an 'act'-scoped ctx that tags gains and free
//   recruits with the space, kept per round on state (this round and last round, for the board's chips).
// - Member defs keep quadrant 'echo' (core pays the colored part in quadrant('echo').resource = green), so
//   color counts (Potluck, countMembersOfColor) see Green members.
import { registerQuadrant, allQuadrantIds, quadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const costOf = def => def.s + def.w;

// ---------- the yield ledger ----------
// state.echo = { round, now: { 'q-i': entry }, last: { ... } (last round's chips, kept for the board), open: key | null }
// entry = { key, p, ring, name, color, idx, echo, res: { color: n }, discount, members: [cost, ...], redo }
// What a space records is its own printed gain for the taker: the amounts its action hands over (before the
// taker's members change them), the discount it gives, and the members it recruits free. Gains from the
// taker's members (Prospector, Underdog, Mentor…) run on a fresh context and are never recorded.
// A space that took or traded (anyone's resources or members went down) records redo: a copy does the action itself.
export function ledger(state) {
  if (!state.echo) state.echo = { round: state.round, now: {}, last: {}, open: null };
  const L = state.echo;
  if (L.round !== state.round) {
    L.last = L.round === state.round - 1 ? L.now : {};
    L.now = {}; L.round = state.round; L.open = null;
  }
  return L;
}
const snapAll = (state, p) => ({ res: state.players.map(o => ({ ...o.res })), members: state.players.map(o => [...o.members]), bonus: state.players.map(o => o.bonus), discount: p.discount });
function settle(state, e) {
  const p = state.players[e.p];
  e.discount = Math.max(0, p.discount - e.before.discount);
  const lost = state.players.some((o, i) => Object.keys(e.before.res[i]).some(r => (o.res[r] || 0) < e.before.res[i][r])
    || e.before.members[i].some(u => !o.members.includes(u))
    // selling followers (White) is a trade too: a copy must sell its own
    || o.bonus < (e.before.bonus?.[i] ?? o.bonus));
  if (lost) e.redo = true;
}
const quadrantDef = (state, uid) => defById(state.cards[uid].def);
// The window for a space stays open while its follow-up choices run, until the taker's buy step. The buy step that
// follows the space carries the space's key (win, set in wrapAction); once that step has been taken off the queue,
// choices made in the buy step (Understudy's copy, a Doppelganger's pick, a tied Mentor pick) never land on the chip.
function windowOpen(state, e) {
  const next = state.queue.find(t => t.t !== 'choose');
  return !!next && next.t === 'buy' && next.p === e.p && next.win === e.key;
}
// Record what this context hands the taker (the content code's own calls only).
function track(ctx, e) {
  const gain = ctx.gain, recruit = ctx.recruit;
  // Only the action's own printed gains (fromAction) land on the chip; member hooks the action sets off through
  // this same ctx (Caterer, Foreman, Dealer…) don't. `printed` is the gain before a member doubled it (Grand Host).
  ctx.gain = (t, c, n, o) => {
    if (t.id === e.p && n > 0 && o?.fromAction) { const k = o.printed ?? n; if (k > 0) e.res[c] = (e.res[c] || 0) + k; }
    return gain(t, c, n, o);
  };
  ctx.recruit = (t, uid, o) => {
    // a member the taker paid for (Snap Up, Half Price) is a trade: a copy does the action itself
    if (t.id === e.p && o?.paid) e.redo = true;
    else if (t.id === e.p && o?.free) { e.members.push(costOf(quadrantDef(ctx.state, uid))); e.members.sort((x, y) => x - y); }
    return recruit(t, uid, o);
  };
}
function wrapAction(qid, a, idx) {
  if (a.resolve.__echo) return;
  const orig = a.resolve;
  const wrapped = function (ctx, p) {
    const L = ledger(ctx.state);
    let key = `${ctx.state.quadrants.indexOf(qid)}-${idx}`;
    // a second worker on a taken space (Squatter) gets its own chip, so the first taker's stays copyable
    if (L.now[key] && L.now[key].p !== p.id && ctx.state.squats?.[key]?.includes(p.id)) key = `${key}+${p.id}`;
    const e = { key, p: p.id, ring: a.ring, name: a.name, color: qid, idx, echo: !!a.echo, before: snapAll(ctx.state, p), res: {}, discount: 0, members: [] };
    L.seq = (L.seq || 0) + 1; e.seq = L.seq;
    L.now[key] = e; L.open = key; L.lastBy = key;
    // a space whose gain is an extra turn (Overtime, free since 2026-10-15) hands over nothing a chip can hold:
    // a copy does the action itself, as it did when Overtime was paid for
    if (a.copyDoesIt) e.redo = true;
    track(ctx, e);
    orig.call(this, ctx, p);
    settle(ctx.state, e);
    // mark the taker's buy step that follows: the window stays open until it starts (windowOpen)
    const next = ctx.state.queue.find(t => t.t !== 'choose');
    if (next && next.t === 'buy' && next.p === p.id) next.win = key;
  };
  wrapped.__echo = true;
  wrapped.__orig = orig;
  a.resolve = wrapped;
}
function wrapHandler(q, k) {
  const orig = q.handlers[k];
  if (orig.__echo) return;
  const wrapped = function (ctx, p, value, data) {
    const L = ctx.state.echo;
    const e = L && L.open && L.now[L.open];
    const open = e && windowOpen(ctx.state, e);
    if (open) track(ctx, e);
    orig.call(this, ctx, p, value, data);
    if (open) settle(ctx.state, e);
  };
  wrapped.__echo = true;
  q.handlers[k] = wrapped;
}
const actionOf = e => quadrant(e.color).actions[e.idx];

// ---------- reading and copying ----------
const spaceTotal = e => Object.values(e.res).reduce((a, b) => a + b, 0);
/** Rough worth of copying an entry for player p right now (bots and hints). */
export function entryValue(ctx, e, p = null) {
  if (e.redo) { const a = actionOf(e); return p && a.estimate ? a.estimate(ctx, p) : spaceTotal(e); }
  let v = spaceTotal(e) + e.discount * 0.9;
  const shop = ctx.shopCards();
  for (const c of e.members) {
    const fits = shop.filter(x => costOf(x.def) <= c);
    if (fits.length) v += Math.max(...fits.map(x => x.def.f * 1.4 + costOf(x.def) * 0.8));
  }
  return v;
}
const copyable = e => !e.echo && (e.redo || spaceTotal(e) > 0 || e.discount > 0 || e.members.length > 0);
const has = (ctx, p, key) => ctx.membersOf(p).filter(c => c.def.id === `echo.${key}` || c.copy === `echo.${key}`).length;
/** The chip on a taken space: exactly what a copy gives. */
export const describe = (ctx, e) => {
  if (e.redo) return `do ${e.name} yourself`;
  const bits = Object.entries(e.res).map(([c, n]) => `+${n} ${c}`);
  if (e.discount) bits.push(`${e.discount} off`);
  // say so when no face-up member is that cheap right now, so the chip never promises a member you can't get
  // in words, never "a member (≤6)" (w3a #34)
  for (const c of e.members) {
    const m = c > 0 ? `a member costing ${c} or less` : 'a free member';
    bits.push(ctx.shopCards().some(x => costOf(x.def) <= c) ? m : `${m} (none face up)`);
  }
  return bits.join(', ') || 'nothing';
};
/**
 * Targets: 'previous' is the immediately preceding placement; 'any' is any occupied space; 'own' is your spaces.
 * 'since' remains for legacy callers. skip excludes the current placement while a copy action or recruit resolves.
 */
export const VARIANT = { plus: 0 }; // sim switch: +N green on every copy action (idea 29); 0 is the pitched rule
const plus = (ctx, p) => { if (VARIANT.plus) ctx.gain(p, 'green', VARIANT.plus, { fromAction: true }); };
export function targets(ctx, p, which, skip = null) {
  const L = ledger(ctx.state);
  const pool = Object.values(L.now);
  if (which === 'previous') {
    const previous = pool.filter(e => e.key !== skip).sort((a, b) => (b.seq || 0) - (a.seq || 0))[0];
    return previous && copyable(previous) ? [previous] : [];
  }
  const since = which === 'since' ? Math.max(0, ...pool.filter(e => e.p === p.id && e.key !== skip).map(e => e.seq || 0)) : 0;
  return pool.filter(e => copyable(e) && (which === 'since' ? e.p !== p.id && (e.seq || 0) > since : which === 'own' ? e.p === p.id : true));
}
/**
 * "Copy every space you took this round" (Greatest Hits, Tribute Band): the spaces it copies, in the order taken, and
 * the ones it skips with why (Green's rule: never another copy; a space that gave nothing has nothing to
 * copy). self: the space doing the copying (Greatest Hits as it resolves), which is never listed. Cory's play
 * (2026-10-16): a skipped Echo or Reprise vanished without a word, so every skip is said, in the log and on the hover.
 */
export function ownPlan(ctx, p, self = null) {
  const L = ledger(ctx.state);
  const mine = Object.values(L.now).filter(e => e.p === p.id && e.key !== self).sort((a, b) => (a.seq || 0) - (b.seq || 0));
  const take = mine.filter(copyable);
  const skip = mine.filter(e => !copyable(e)).map(e => ({ e, why: e.echo ? 'copy' : 'nothing' }));
  return { take, skip };
}
const SKIP_WHY = { copy: 'copies never copy a copy', center: 'the center', nothing: 'gave nothing' };
/** "Echo, Reprise (copies never copy a copy); Double Down (the center)", or '' when nothing is skipped. */
export function skipWords(skip) {
  return ['copy', 'center', 'nothing'].map(why => {
    const names = skip.filter(x => x.why === why).map(x => x.e.name);
    return names.length ? `${names.join(', ')} (${SKIP_WHY[why]})` : '';
  }).filter(Boolean).join('; ');
}
/** Greatest Hits and Tribute Band: copy p's spaces from this round, and say what was left out and why. */
function copyOwn(ctx, p, self, by, who) {
  const { take, skip } = ownPlan(ctx, p, self);
  const skipped = skipWords(skip);
  const name = `${p.name}${by ? `'s ${by}` : ''}`;
  // a member says it in the present ("P1's Tribute Band has nothing to copy"), a space in the past ("P1 had…")
  if (!take.length) { ctx.log(`${name} ${by ? 'has' : 'had'} nothing to copy${skipped ? `: it skips ${skipped}` : ''}.`); return false; }
  if (skipped) ctx.log(`${who} skips ${skipped}.`);
  copyAll(ctx, p, take, by, who);
  return true;
}
/** Previous placement before this turn's action, including p's own placement on a snake double turn. */
const previousNow = (ctx, p) => { const L = ledger(ctx.state); return targets(ctx, p, 'previous', L.now[L.open]?.p === p.id ? L.open : null); };
const bestValue = (ctx, list, p) => Math.max(0, ...list.map(e => entryValue(ctx, e, p)));
// by: the member making the copy (Understudy, Sleepwalker…), so the log names it. who: the card or space asking
// (the prompt's own name), so a copied space's free member is titled with it ("Encore: take a face-up member…").
function offer(ctx, p, list, prompt, from, by = null) {
  if (!list.length) { ctx.log(`${p.name}${by ? `'s ${by}` : ''} had nothing to copy.`); return; }
  const who = by || prompt.split(':')[0];
  ctx.choose(p, prompt, list.map(e => ({
    id: `space:${from}:${e.key}`, label: `${e.name} (${ctx.player(e.p).name}): ${describe(ctx, e)}`, kind: 'space',
    value: e.key, hint: entryValue(ctx, e, p),
  })), 'echo.pick', by ? { from, by, who } : { from, who });
}

/** p copies entry e: same resources, same discount, and a free face-up member (cost ≤ theirs) per member. */
export function copy(ctx, p, e, { later = null, by = null, asker = null } = {}) {
  const taker = ctx.player(e.p);
  const who = by ? `${p.name}'s ${by}: ${p.name}` : p.name;
  if (e.redo) {
    // a space that took or traded: the copy does the action itself
    ctx.log(`${who} copies ${e.name}${taker !== p ? ` (${taker.name}'s)` : ''}: doing it again.`);
    heard(ctx, p, e, taker);
    actionOf(e).resolve.__orig.call(actionOf(e), ctx, p);
    return;
  }
  const fewest = ctx.state.players.every(o => ctx.followers(o) >= ctx.followers(p));
  const mult = has(ctx, p, 'wallflower') && fewest ? 2 : 1;
  const asGreen = ctx.membersOf(p).some(c => (c.def.id === 'echo.translator' || c.copy === 'echo.translator') && c.on !== false);
  for (const [c, n] of Object.entries(e.res)) ctx.gain(p, asGreen ? 'green' : c, n * mult, { fromAction: true });
  if (e.discount) ctx.discount(p, e.discount, `Copy of ${e.name}`);
  const notes = [mult > 1 ? `doubled by ${p.name}'s Wallflower` : '', asGreen && Object.keys(e.res).length ? `as green by ${p.name}'s Translator` : ''].filter(Boolean);
  ctx.log(`${who} copied ${e.name}${e.p !== p.id ? ` (${ctx.player(e.p).name}'s)` : ''}: ${describe(ctx, e)}${notes.length ? `, ${notes.join(', ')}` : ''}.`);
  heard(ctx, p, e, taker);
  if (later) later.push(...e.members);
  else if (e.members.length) freeStep(ctx, p, { left: [...e.members], who: asker || by || 'Copy' });
}
// members that react to a copy
function heard(ctx, p, e, taker) {
  // each runs as its member, so the log names it ("P1's Choir: +1 green.")
  const fork = has(ctx, p, 'tuningfork');
  if (fork) ctx.asMember(p, 'Impressionist', () => ctx.gain(p, ctx.quadrant(e.color).resource, fork));
  const choir = has(ctx, p, 'choir');
  if (choir) ctx.asMember(p, 'Choir', () => ctx.gain(p, 'green', choir));
  if (taker !== p) { const muse = has(ctx, taker, 'muse'); if (muse) ctx.asMember(taker, 'Muse', () => ctx.gain(taker, 'green', 2 * muse)); }
  // Ensemble: a rival's space only; the follower counts at once (a won follower, so it's loose: White can sell it)
  const ensemble = taker !== p ? has(ctx, p, 'ensemble') : 0;
  if (ensemble) ctx.asMember(p, 'Ensemble', () => { p.bonus += ensemble; });
}
/** Copy several spaces; free members are picked one after another at the end. who: the card or space copying. */
export function copyAll(ctx, p, list, by = null, who = by) {
  const later = [];
  for (const e of list) copy(ctx, p, e, { later, by });
  if (later.length) freeStep(ctx, p, { left: later.sort((a, b) => b - a), who: who || 'Copy' });
}
function freeStep(ctx, p, data) {
  if (!data.left.length) return;
  const c = data.left[0];
  const fits = ctx.shopCards().filter(x => costOf(x.def) <= c);
  if (!fits.length) { ctx.log(`${p.name}: no face-up member costs ${c} or less.`); freeStep(ctx, p, { ...data, left: data.left.slice(1) }); return; }
  ctx.choose(p, `${data.who || 'Copy'}: take a face-up member costing ${c} or less, free`, fits.map(x => ({
    id: `card:${x.uid}`, label: `${x.def.name} (${costOf(x.def)})`, kind: 'card', value: x.uid, hint: x.def.f * 1.4 + costOf(x.def),
  })), 'echo.free', { cost: c, left: data.left.slice(1), who: data.who || 'Copy' });
}

// ---------- the quadrant ----------
const echoQ = {
  id: 'echo',
  name: 'Green',
  resource: 'green',
  rule: 'Copies never copy another copy. Most green at round end wins.',
  scoring: memberScoring('echo', 'green'),

  actions: [
    {
      key: 'hum', ring: 1, name: 'Hum', text: '+3 green.',
      estimate: () => 3,
      resolve(ctx, p) { ctx.gain(p, 'green', 3, { fromAction: true }); },
    },
    {
      key: 'chant', ring: 1, name: 'Crescendo', text: '+2 green in round I, +4 in round II, +6 in round III.',
      estimate: ctx => 2 * ctx.state.round,
      resolve(ctx, p) { ctx.gain(p, 'green', 2 * ctx.state.round, { fromAction: true }); },
    },
    {
      // The previous placement can be your own on a snake double turn.
      key: 'echo', ring: 1, name: 'Echo', echo: true, text: 'Copy the previous action.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'previous'), p),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, previousNow(ctx, p), 'Echo: copy the previous action?', 'now'); },
    },
    {
      key: 'encore', ring: 2, name: 'Encore', echo: true, text: 'Copy any space with a minion.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'any'), p),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, targets(ctx, p, 'any'), 'Encore: copy which space?', 'now'); },
    },
    {
      // your own spaces are on the board in your color: no memory of last round needed (it replaced Recall)
      key: 'refrain', ring: 2, name: 'Reprise', echo: true, text: 'Copy a space where you have a minion.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'own'), p),
      resolve(ctx, p) {
        plus(ctx, p);
        offer(ctx, p, targets(ctx, p, 'own'), 'Reprise: copy which of your spaces?', 'now');
      },
    },
    {
      key: 'eternity', ring: 3, name: 'Greatest Hits', echo: true, text: 'Copy every action where you have a minion.',
      estimate: (ctx, p) => VARIANT.plus + targets(ctx, p, 'own').reduce((s, e) => s + entryValue(ctx, e, p), 0),
      resolve(ctx, p) {
        plus(ctx, p);
        copyOwn(ctx, p, ledger(ctx.state).open, null, 'Greatest Hits');
      },
    },
  ],

  handlers: {
    pick(ctx, p, key, data) {
      const L = ledger(ctx.state);
      const e = (data.from === 'last' ? L.last : L.now)[key];
      if (e) copy(ctx, p, e, { by: data.by || null, asker: data.who || data.by || null });
    },
    free(ctx, p, uid, data) {
      if (!ctx.state.shop.includes(uid)) { freeStep(ctx, p, { left: [data.cost, ...data.left], who: data.who }); return; }
      ctx.recruit(p, uid, { free: true });
      freeStep(ctx, p, data);
    },
    doppelCopy(ctx, p, uid, data) {
      const target = ctx.card(uid);
      const self = ctx.card(data.uid);
      self.copy = target.def.id;
      // a copied Hustler works the same color (until its own when-recruited pick below sets one)
      if (target.color !== undefined) self.color = target.color;
      ctx.log(`${p.name}'s Doppelganger copies ${target.def.name}.`);
      // Doppelganger becomes a copy of the member card (Cory): the copied "when recruited" effect fires once, for the
      // copy, and so does a "Now and at round start" member's now part. Named under the copied member, like its other hooks.
      const d = target.def;
      if (d.onRecruited) ctx.asMember(p, d.name, () => d.onRecruited(ctx, p, self));
      if (d.now) for (const hook of ['onRoundStart', 'onRoundStartLate']) if (d[hook]) ctx.asMember(p, d.name, () => d[hook](ctx, p, self));
    },
  },

  members: [
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m('evergreen', 'Busker', 4, 4, 'Now and at round start, +3 green.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, 'green', 3); },
    }),
    m('choir', 'Choir', 4, 2, 'Whenever you copy a space, +1 green.'),
    m('muse', 'Muse', 2, 2, 'Whenever a rival copies one of your spaces, +2 green.'),
    // Understudy and Ensemble replaced Choirmaster (green for a rival's copy: a gift for doing nothing, and Muse's
    // twin) and Fan (green when a rival takes the center: nothing to do with copying). Claude, 2026-10-14.
    m('understudy', 'Understudy', 4, 2, 'When recruited: copy the previous action.', {
      onRecruited(ctx, owner) { offer(ctx, owner, previousNow(ctx, owner), 'Understudy: copy the previous action?', 'now', 'Understudy'); },
    }),
    // was "Game end: +1 follower per green member." (2+2) until the design critic's follow-ups (2026-10-14): now it
    // pays for the copy itself, a rival's space only, and the follower counts at once (heard() above).
    m('ensemble', 'Ensemble', 2, 1, 'Whenever you copy a rival’s space, +1 follower.'),
    m('groupie', 'Groupie', 4, 4, 'Whenever anyone recruits a green member, +1 green.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && recruited.def.id.startsWith('echo.')) ctx.gain(owner, 'green', 1);
      },
    }),
    m('translator', 'Translator', 3, 1, 'What you copy comes as green. You can switch it off or on when you buy.', {
      toggle: true,
      onRecruited(ctx, owner, card) { card.on = true; },
    }),
    m('tuningfork', 'Impressionist', 2, 2, 'Whenever you copy a space, also gain 1 of that space’s color.'),
    m('wallflower', 'Wallflower', 2, 2, 'While no one has fewer followers than you, the resources you copy are doubled.'),
    // Keepsake ("When recruited: copy one of your spaces from this round") is cut: Reprise does the same on a space.
    m('mirror', 'Mime', 4, 2, 'When recruited: gain as much green as the rival with the most green.', {
      onRecruited(ctx, owner) {
        const g = Math.max(0, ...ctx.rivals(owner).map(o => o.res.green || 0));
        if (g) ctx.gain(owner, 'green', g);
        ctx.log(`${owner.name}'s Mime: +${g} green.`);
      },
    }),
    m('afterimage', 'Sleepwalker', 4, 2, 'Now and at round start: copy one of your spaces from last round.', { now: true,
      onRoundStart(ctx, owner) {
        const L = ledger(ctx.state);
        const list = Object.values(L.last).filter(e => copyable(e) && e.p === owner.id);
        offer(ctx, owner, list, 'Sleepwalker: copy which of your spaces from last round?', 'last', 'Sleepwalker');
      },
    }),
    m('hourglass', 'Stunt Double', 6, 4, 'Once per round: copy the space you just took.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        const e = justTook(ctx, owner);
        if (!e) { card.used = false; ctx.log(`${owner.name}'s Stunt Double has nothing to copy.`); return; }
        copy(ctx, owner, e, { by: 'Stunt Double' });
      },
      botActivate: (ctx, owner) => { const e = justTook(ctx, owner); return !!e && entryValue(ctx, e, owner) >= 3; },
    }),
    m('dejavu', 'Tribute Band', 8, 4, 'Once per game: copy every space you took this round.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        // nothing to copy: the once-per-game use isn't spent (as Stunt Double's isn't)
        if (!copyOwn(ctx, owner, null, 'Tribute Band', 'Tribute Band')) card.used = false;
      },
      botActivate: (ctx, owner) => owner.left === 0 && ctx.state.round >= 2
        && targets(ctx, owner, 'own').reduce((s, e) => s + entryValue(ctx, e, owner), 0) >= (ctx.state.round === 3 ? 6 : 10),
    }),
    // Cory, 2026-10-15: moved here from Red (same card; its rename and recruit-time pick wait for his redesign)
    m('doppel', 'Doppelganger', 3, 1, 'When recruited: becomes a copy of one of your other members (its effect and its followers).', {
      onRecruited(ctx, owner, card) {
        const own = ctx.membersOf(owner).filter(c => c.uid !== card.uid && c.def.key !== 'doppel');
        if (!own.length) return;
        ctx.choose(owner, 'Doppelganger: copy which of your members?', own.map(c => ({
          id: `card:${c.uid}`, label: c.def.name, kind: 'member', value: c.uid,
          hint: ['banker', 'prospector', 'recruiter', 'proselytizer', 'host'].includes(c.def.key) ? 2 : (c.def.vanilla ? 0 : 1),
        })), 'echo.doppelCopy', { uid: card.uid });
      },
    }),
    m('chronicler', 'Chronicler', 2, 2, 'Game end: +1 follower per 2 green.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.green || 0) / 2),
    }),
  ],
};

function justTook(ctx, p) {
  const L = ledger(ctx.state);
  const e = L.lastBy && L.now[L.lastBy];
  return e && e.p === p.id && copyable(e) ? e : null;
}

export default echoQ;

let installed = false;
/** Register Green and start the yield ledger on every quadrant registered so far. Call once, after the others. */
export function install() {
  if (!installed) registerQuadrant(echoQ);
  for (const id of allQuadrantIds()) {
    const q = quadrant(id);
    q.actions.forEach((a, i) => wrapAction(id, a, i));
    for (const k of Object.keys(q.handlers || {})) wrapHandler(q, k);
    // re-index the wrapped handlers, keeping any relabelled member colors (thieves.js does the same trick)
    const labels = q.members.map(d => d.quadrant);
    registerQuadrant(q);
    q.members.forEach((d, i) => { if (labels[i]) d.quadrant = labels[i]; });
  }
  installed = true;
  return echoQ;
}
