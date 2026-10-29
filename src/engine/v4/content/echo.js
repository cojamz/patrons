// Green copies actions, including copy actions whose targets are chosen afresh.
// Each action pays +1 green; each branch excludes actions already in that branch.
//
// The copy rule: a copy gives the space's own printed gain, as its chip shows: the resources and discount the
// action itself handed its taker, never their members' bonuses and never what they paid. A free member copies as
// "a face-up member costing no more, free". A space that took or traded (Collect Debts, Swap Sides…) is copied by doing the
// action yourself. Green's one rule, printed once (the sphere's `rule`, the rulebook and the glossary's "copy"), not
// on each card: copy choices can chain, but never revisit an action. Occupied center actions can be copied too.
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
  const next = state.queue.find(t => t.t !== 'choose' && t.t !== 'content');
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
    withPath(ctx, [actionKey(key)], () => orig.call(this, ctx, p), key);
    settle(ctx.state, e);
    // mark the taker's buy step that follows: the window stays open until it starts (windowOpen)
    const next = ctx.state.queue.find(t => t.t !== 'choose' && t.t !== 'content');
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
    if (data?.__echoPath) withPath(ctx, data.__echoPath, () => orig.call(this, ctx, p, value, data), data.__echoOrigin);
    else orig.call(this, ctx, p, value, data);
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
  // Estimates never recurse through a copy action's estimate: cycles are choices, not infinite bot work.
  if (e.echo) return 2 + (e.color === 'echo' ? VARIANT.plus : 0);
  if (e.redo) { const a = actionOf(e); return p && a.estimate ? a.estimate(ctx, p) : spaceTotal(e); }
  let v = spaceTotal(e) + e.discount * 0.9;
  const shop = ctx.shopCards();
  for (const c of e.members) {
    const fits = shop.filter(x => costOf(x.def) <= c);
    if (fits.length) v += Math.max(...fits.map(x => x.def.f * 1.4 + costOf(x.def) * 0.8));
  }
  return v;
}
const copyable = e => e.echo || e.redo || spaceTotal(e) > 0 || e.discount > 0 || e.members.length > 0;
const has = (ctx, p, key) => (key === 'tuningfork' ? ctx.abilitiesOf(p) : ctx.membersOf(p)).filter(c => c.def.id === `echo.${key}` || c.copy === `echo.${key}`).length;
const actionKey = key => key.split('+')[0];
const pathNow = ctx => ledger(ctx.state).path || [];
const protectedAction = (ctx, e) => has(ctx, ctx.player(e.p), 'agents') > 0;
const allowed = (ctx, e, path = pathNow(ctx)) => copyable(e) && !protectedAction(ctx, e) && !path.includes(actionKey(e.key));
// The active context exists only while content resolves. Every queued choice/continuation gets its
// own immutable path, so siblings don't poison each other's targets and save/load needs no closures.
function withPath(ctx, path, fn, origin = ledger(ctx.state).origin) {
  const L = ledger(ctx.state), previous = { path: L.path, origin: L.origin };
  const choose = ctx.choose, defer = ctx.defer;
  L.path = path; L.origin = origin;
  const stamp = data => data?.__echoPath ? data : ({ ...(data || {}), __echoPath: [...path], __echoOrigin: origin ?? null });
  ctx.choose = (p, prompt, options, h, data, extra) => choose(p, prompt, options, h, stamp(data), extra);
  ctx.defer = (p, h, data, cause) => defer(p, h, stamp(data), cause);
  try { return fn(); }
  finally {
    ctx.choose = choose; ctx.defer = defer;
    if (previous.path === undefined) delete L.path; else L.path = previous.path;
    if (previous.origin === undefined) delete L.origin; else L.origin = previous.origin;
  }
}
/** The chip on a taken space: exactly what a copy gives. */
export const describe = (ctx, e) => {
  if (e.echo) return `${actionOf(e).text} Choose again.`;
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
 * Targets: 'previous' is the immediately preceding placement; 'any' is any occupied action;
 * 'own' and 'rival' use minion ownership. Agents and the current branch exclude targets.
 * 'since' remains for legacy callers. skip excludes the current placement while a copy action or recruit resolves.
 */
export const VARIANT = { plus: 1 }; // Every Green action pays its inherent green, including each traversal in a chain.
const plus = (ctx, p) => { if (VARIANT.plus) ctx.gain(p, 'green', VARIANT.plus, { fromAction: true }); };
export function targets(ctx, p, which, skip = null) {
  const L = ledger(ctx.state);
  const pool = Object.values(L.now);
  if (which === 'previous') {
    const previous = previousEntry(ctx, skip);
    return previous && allowed(ctx, previous) ? [previous] : [];
  }
  const since = which === 'since' ? Math.max(0, ...pool.filter(e => e.p === p.id && e.key !== skip).map(e => e.seq || 0)) : 0;
  return pool.filter(e => e.key !== skip && allowed(ctx, e) && (which === 'since' ? e.p !== p.id && (e.seq || 0) > since : which === 'own' ? e.p === p.id : which === 'rival' ? e.p !== p.id : true));
}
/**
 * Greatest Hits / Tribute Band replay occupied own actions in placement order. A branch can
 * include copy actions, but not its ancestors. The UI/log explain every blocked action.
 */
export function ownPlan(ctx, p, self = null) {
  const L = ledger(ctx.state);
  const mine = Object.values(L.now).filter(e => e.p === p.id && e.key !== self).sort((a, b) => (a.seq || 0) - (b.seq || 0));
  const take = mine.filter(e => allowed(ctx, e));
  const skip = mine.filter(e => !allowed(ctx, e)).map(e => ({ e, why: protectedAction(ctx, e) ? 'protected' : pathNow(ctx).includes(actionKey(e.key)) ? 'chain' : 'nothing' }));
  return { take, skip };
}
const SKIP_WHY = { protected: 'Agents prevents copying', chain: 'already in this chain', nothing: 'gave nothing' };
/** Group skipped actions by the rule that blocked them. */
export function skipWords(skip) {
  return ['protected', 'chain', 'nothing'].map(why => {
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
  // Greatest Hits: you pick the order, one space at a time on the wheel (Cory, 2026-10-26, from playtester Maxwell)
  if (!by) orderStep(ctx, p, take.map(e => e.key), who);
  else copyAll(ctx, p, take, by, who);
  return true;
}
/** Tribute Band: do every action the chosen rival has a minion on this round, in placement order. */
function copyLeader(ctx, p, leader) {
  const { take, skip } = ownPlan(ctx, leader);
  const skipped = skipWords(skip);
  if (!take.length) { ctx.log(`${p.name}'s Tribute Band has nothing to copy from ${leader.name}${skipped ? `: it skips ${skipped}` : ''}.`); return false; }
  if (skipped) ctx.log(`Tribute Band skips ${skipped}.`);
  ctx.log(`${p.name}'s Tribute Band plays ${leader.name}'s actions.`);
  copyAll(ctx, p, take, 'Tribute Band', 'Tribute Band');
  return true;
}
/** Greatest Hits' next copy: one left goes straight on; more ask which, and the rest wait until that copy is done. */
function orderStep(ctx, p, keys, who) {
  const L = ledger(ctx.state);
  const left = keys.map(k => L.now[k]).filter(e => e && allowed(ctx, e));
  if (left.length === 1) ctx.defer(p, 'echo.continueCopy', { key: left[0].key, by: null, who }, { kind: 'space', key: left[0].key, qid: left[0].color, pid: p.id });
  if (left.length < 2) return;
  ctx.choose(p, `${who}: copy which next?`, left.map(e => ({
    id: `space:order:${e.key}`, label: `${e.name} (${ctx.player(e.p).name}): ${describe(ctx, e)}`, kind: 'space', value: e.key, hint: entryValue(ctx, e, p),
  })), 'echo.order', { left: left.map(e => e.key), who });
}
/** Latest placement regardless of its owner; legality never makes us fall back to an earlier placement. */
export const previousEntry = (ctx, skip = null) => Object.values(ledger(ctx.state).now)
  .filter(e => e.key !== skip).sort((a, b) => (b.seq || 0) - (a.seq || 0))[0] || null;
/** Exclude the active placement while executing it, rather than guessing from the previous owner's identity. */
export const previousNow = (ctx, p) => {
  const L = ledger(ctx.state);
  return targets(ctx, p, 'previous', L.path?.length ? L.origin : null);
};
/** Cover's targets: open actions with no minion on them, not already in this copy chain. */
function emptyTargets(ctx) {
  const st = ctx.state, path = pathNow(ctx), out = [];
  st.quadrants.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => {
    const key = `${q}-${i}`;
    if (a.ring <= st.round && !(a.lastRound && st.round > a.lastRound) && st.slots[key] === undefined && !path.includes(key)) out.push({ key, a, qid });
  }));
  return out;
}
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
  if (!allowed(ctx, e)) return;
  return withPath(ctx, [...pathNow(ctx), actionKey(e.key)], () => copyResolved(ctx, p, e, { later, by, asker }));
}
function copyResolved(ctx, p, e, { later, by, asker }) {
  const taker = ctx.player(e.p);
  const who = by ? `${p.name}'s ${by}: ${p.name}` : p.name;
  if (e.redo || e.echo) {
    // a space that took or traded: the copy does the action itself
    ctx.log(`${who} copies ${e.name}${taker !== p ? ` (${taker.name}'s)` : ''}: doing it again.`);
    heard(ctx, p, e, taker);
    (actionOf(e).resolve.__orig || actionOf(e).resolve).call(actionOf(e), ctx, p);
    return;
  }
  const mult = has(ctx, p, 'wallflower') ? 2 : 1;
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
  each(ctx, p, 'tuningfork', 'Impressionist', () => ctx.gain(p, ctx.quadrant(e.color).resource, 1));
  each(ctx, p, 'choir', 'Choir', () => ctx.gain(p, 'green', 1));
  for (const owner of ctx.rivals(p)) each(ctx, owner, 'muse', 'Muse', () => ctx.gain(owner, 'green', 1));
  if (taker === p) each(ctx, p, 'ensemble', 'Ensemble', () => { p.bonus += 1; });
  each(ctx, taker, 'bait', 'Bait', () => {
    p.bonus -= Math.min(1, ctx.followers(p));
    if (taker !== p) taker.bonus += 1;
  });
}
// Run fn once per card of p's that is (or copies) the member `key`, each as its own source: a Doppelganger copying
// Muse pays its +1 beside Muse's, named "Doppelganger (as Muse)" (Cory, Oct 28). An artifact has no uid among members.
function each(ctx, p, key, name, fn) {
  const cards = (key === 'tuningfork' ? ctx.abilitiesOf(p) : ctx.membersOf(p)).filter(c => c.def.id === `echo.${key}` || c.copy === `echo.${key}`);
  for (const c of cards) {
    const own = c.def.id === `echo.${key}`;
    ctx.asMember(p, own ? name : `${c.def.name} (as ${name})`, fn, p.members.includes(c.uid) ? c.uid : null);
  }
}
/** Copy several spaces; free members are picked one after another at the end. who: the card or space copying. */
export function copyAll(ctx, p, list, by = null, who = by) {
  const member = by && ctx.membersOf(p).find(c => c.def.name === by || (c.copy && defById(c.copy).name === by));
  for (const e of list) ctx.defer(p, 'echo.continueCopy', { key: e.key, by, who: who || 'Copy' },
    member ? { kind: 'member', pid: p.id, uid: member.uid, def: member.def.id } : { kind: 'space', key: e.key, qid: e.color, pid: p.id });
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

// Encore's rival members: an On Recruit (or a now-and-round-start effect) that doesn't act on the card itself ("swap
// it", "it becomes a copy"), which a card held by someone else can't do for you. Same test as Red's Tryout.
function rivalRecruits(ctx, p) {
  return ctx.rivals(p).flatMap(o => ctx.membersOf(o).map(c => ({ c, o })))
    .filter(({ c }) => !c.def.artifact && (c.def.onRecruited || (c.def.now && (c.def.onRoundStart || c.def.onRoundStartLate)))
      && !/\bit\b|\bcop(?:y|ies)\b/i.test(c.def.text.replace(/^[^:]*:/, '')));
}

// ---------- the quadrant ----------
const echoQ = {
  id: 'echo',
  name: 'Green',
  resource: 'green',
  rule: 'Copying a copy lets you choose again. Never copy an action already in its chain. Every Green action gives +1 green.',
  scoring: { label: 'Most green', counts: 'the green you hold when the round ends', score: (ctx, p) => p.res.green },

  actions: [
    {
      key: 'chant', ring: 1, name: 'Build Up', text: '+3 green in round I, +4 in round II, +5 in round III.', // every color's 3/4/5 (Cory, 2026-10-27)
      byRound: { lines: ['+3 green', '+4 green', '+5 green'] },
      estimate: ctx => 2 + ctx.state.round,
      resolve(ctx, p) { plus(ctx, p); ctx.gain(p, 'green', ctx.state.round + 1, { fromAction: true }); },
    },
    {
      // The previous placement can be your own on a snake double turn.
      key: 'echo', ring: 1, name: 'Echo', echo: true, text: 'Copy the previous action. +1 green.', // back to +1 (Cory, Oct 28)
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'previous'), p),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, previousNow(ctx, p), 'Echo: copy the previous action?', 'now'); },
    },
    {
      // your own spaces are on the board in your color: no memory of last round needed (it replaced Recall)
      key: 'refrain', ring: 1, name: 'Reprise', echo: true, text: 'Copy an action with your minion. +1 green.', // round I (Cory, 2026-10-27); +1 (Cory, Oct 28)
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'own'), p),
      resolve(ctx, p) {
        plus(ctx, p);
        offer(ctx, p, targets(ctx, p, 'own'), 'Reprise: copy which of your spaces?', 'now');
      },
    },
    {
      // Cory, 2026-10-28: Green had one copy too many, so Encore stops copying a space; "maybe copy an On Recruit"
      // (the rival's member, Claude's read of his yes). Like Red's Tryout, but on a rival's member, not the shop's.
      key: 'encore', ring: 2, name: 'Encore', text: 'Copy the On Recruit of a rival’s member. +1 green.', copyDoesIt: true,
      estimate: (ctx, p) => VARIANT.plus + (rivalRecruits(ctx, p).length ? 3 : 0),
      resolve(ctx, p) {
        plus(ctx, p);
        const list = rivalRecruits(ctx, p);
        if (!list.length) { ctx.log(`${p.name}: no rival's member has an On Recruit to copy.`); return; }
        ctx.choose(p, 'Encore: copy which rival member’s On Recruit?', list.map(({ c, o }) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name}: ${c.def.text}`, kind: 'card', value: c.uid, hint: 2 + (c.def.f || 0),
        })), 'echo.encoreCopy');
      },
    },
    {
      // Cory, 2026-10-27: Chorus out; "Copy an action with no minion on it" takes Reprise's round II spot. Name is
      // Claude's fill-in. A copy of an empty space does that action itself (nobody took it, so there's no chip).
      key: 'hum', ring: 2, name: 'Cover', echo: true, text: 'Copy an action with no minion on it. +1 green.',
      estimate: (ctx, p) => VARIANT.plus + (emptyTargets(ctx).length ? 2.5 : 0),
      resolve(ctx, p) {
        plus(ctx, p);
        const list = emptyTargets(ctx);
        if (!list.length) { ctx.log(`${p.name} found no empty action to copy.`); return; }
        ctx.choose(p, 'Cover: copy which empty action?', list.map(({ key, a }) => ({
          id: `space:empty:${key}`, label: `${a.name}: ${a.text}`, kind: 'space', value: key, hint: 2,
        })), 'echo.copyEmpty');
      },
    },
    {
      key: 'eternity', ring: 3, name: 'Greatest Hits', echo: true, text: 'Copy every action with your minion. +1 green.',
      estimate: (ctx, p) => VARIANT.plus + targets(ctx, p, 'own').reduce((s, e) => s + entryValue(ctx, e, p), 0),
      resolve(ctx, p) {
        plus(ctx, p);
        copyOwn(ctx, p, ledger(ctx.state).open, null, 'Greatest Hits');
      },
    },
  ],

  handlers: {
    tribute(ctx, p, id, data) {
      const leader = ctx.player(id);
      const card = ctx.card(data.uid);
      if (!copyLeader(ctx, p, leader) && card) card.used = false;
    },
    encoreCopy(ctx, p, uid) {
      const o = ctx.ownerOf(uid);
      if (!o || o.id === p.id) { ctx.log(`${p.name}: that member left the rival's cult.`); return; }
      ctx.log(`${p.name} copies ${o.name}'s ${ctx.defOf(uid).name}: its On Recruit.`);
      ctx.borrowOnRecruit(p, uid);
    },
    copyEmpty(ctx, p, key) {
      const hit = emptyTargets(ctx).find(x => x.key === key);
      if (!hit) { ctx.log(`${p.name}: that action has a minion now.`); return; }
      withPath(ctx, [...pathNow(ctx), key], () => {
        ctx.log(`${p.name} copies ${hit.a.name}: doing it.`);
        each(ctx, p, 'tuningfork', 'Impressionist', () => ctx.gain(p, ctx.quadrant(hit.qid).resource, 1));
        each(ctx, p, 'choir', 'Choir', () => ctx.gain(p, 'green', 1));
        (hit.a.resolve.__orig || hit.a.resolve).call(hit.a, ctx, p);
      });
    },
    continueCopy(ctx, p, _, data) {
      const e = ledger(ctx.state).now[data.key];
      if (e) copy(ctx, p, e, { by: data.by, asker: data.who });
    },
    order(ctx, p, key, data) {
      const L = ledger(ctx.state);
      const e = L.now[key];
      if (e) ctx.defer(p, 'echo.continueCopy', { key, by: null, who: data.who }, { kind: 'space', key, qid: e.color, pid: p.id });
      ctx.defer(p, 'echo.orderNext', { left: data.left.filter(k => k !== key), who: data.who });
    },
    orderNext(ctx, p, _, data) { orderStep(ctx, p, data.left, data.who); },
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
      self.copy = target.copy || target.def.id;
      // a copied Hustler works the same color (until its own when-recruited pick below sets one)
      if (target.color !== undefined) self.color = target.color;
      ctx.log(`${p.name}'s ${self.def.name} becomes a copy of ${defById(self.copy).name}.`);
      // Becoming a copy is this physical card's Recruit ability. An Impostor doesn't recruit that identity again:
      // its ongoing hooks start now, and round-start hooks wait.
      const d = defById(self.copy);
      // Doppelganger also does the copied member's On Recruit right then (Cory, 2026-10-28: a copied Connector
      // did nothing, since Doppelganger only comes in round III and Connector's Round Start never came)
      // Once per round per Doppelganger, so a Doppelganger swapped out and back in by Panel-style swaps can't loop
      // (Claude, under Cory's go-with-your-gut).
      if (self.def.key === 'doppel' && self.copiedRecruit !== ctx.state.round) {
        self.copiedRecruit = ctx.state.round;
        if (d.onRecruited) ctx.recruitAbility(p, self, d, () => d.onRecruited(ctx, p, self));
        if (d.now) for (const hook of ['onRoundStart', 'onRoundStartLate']) if (d[hook]) ctx.recruitAbility(p, self, d, () => d[hook](ctx, p, self));
      }
      ctx.grantWorkers(p, d, self.uid);
    },
  },

  members: [
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m('evergreen', 'Busker', 1, 2, // Cory, 2026-10-25: cost 3 (was 4)
      'On Recruit: +2 green. Round Start: +2 green.', {
      onRecruited(ctx, owner) { ctx.gain(owner, 'green', 2); },
      onRoundStart(ctx, owner) { ctx.gain(owner, 'green', 2); },
    }),
    m('choir', 'Choir', 4, 2, 'Whenever you copy a space, +1 green.'),
    m('muse', 'Muse', 1, 2, 'Whenever a rival copies an action, +1 green.'),
    // Understudy and Ensemble replaced Choirmaster (green for a rival's copy: a gift for doing nothing, and Muse's
    // twin) and Fan (green when a rival takes the center: nothing to do with copying). Claude, 2026-10-14.
    // Cory, 2026-10-28: back in the deck at 4, "two green two wild" (2 green + 1 any + the +1 wild)
    m('understudy', 'Understudy', 2, 1, 'On Recruit: copy the action taken the previous turn.', { // wording Cory's, Oct 28
      onRecruited(ctx, owner) {
        // Retired Understudy keeps its old before-this-turn behavior in saved games; current Echo uses previousNow.
        const L = ledger(ctx.state), skip = L.origin || (L.now[L.open]?.p === owner.id ? L.open : null);
        offer(ctx, owner, targets(ctx, owner, 'previous', skip), 'Understudy: copy the action taken the previous turn?', 'now', 'Understudy');
      },
    }),
    // was "Game end: +1 follower per green member." (2+2) until the design critic's follow-ups (2026-10-14): now it
    // pays for the copy itself, a rival's space only, and the follower counts at once (heard() above).
    m('ensemble', 'Ensemble', 2, 2, 'Whenever you copy your own action, +1 follower.', { n: 2 }), // Cory, 2026-10-28: 2 members
    m('groupie', 'Groupie', 4, 4, 'Whenever anyone recruits a green member, +1 green.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && recruited.def.id.startsWith('echo.')) ctx.gain(owner, 'green', 1);
      },
    }),
    m('translator', 'Translator', 3, 1, 'What you copy comes as green. Switch it on or off when you recruit.', {
      toggle: true,
      onRecruited(ctx, owner, card) { card.on = true; },
    }),
    m('tuningfork', 'Impressionist', 1, 2, 'Whenever you copy an action, +1 of its color.'),
    // Cory, 2026-10-28: back as a big card at 10 (6 green + 3 any + the +1 wild); no follower condition any more
    m('wallflower', 'Wallflower', 6, 3, 'When you copy an action, double the resources it gives you.'),
    // Keepsake ("When recruited: copy one of your spaces from this round") is cut: Reprise does the same on a space.
    // Cory, 2026-10-28: Mime returns renamed ("yes but needs a different name"); text and cost 3 are Claude's
    m('mirror', 'Fan Club', 1, 1, 'On Recruit: +1 green per Green space with a minion.', {
      onRecruited(ctx, owner) {
        const q = ctx.state.quadrants.indexOf('echo');
        const g = q < 0 ? 0 : Object.keys(ctx.state.slots).filter(k => Number(k.split('-')[0]) === q).length;
        if (g) ctx.gain(owner, 'green', g);
        ctx.log(`${owner.name}'s Fan Club: +${g} green.`);
      },
    }),
    // Cory, 2026-10-28: "Roadie is good" (Green's 16th); cost 3 is Claude's
    m('roadie', 'Roadie', 1, 1, 'Round Start: +1 green per Green member you have.', {
      onRoundStart(ctx, owner) {
        const g = ctx.countMembersOfColor(owner, 'echo');
        if (g) ctx.gain(owner, 'green', g);
      },
    }),
    m('afterimage', 'Sleepwalker', 4, 2, 'On Recruit: copy one of your spaces from last round. Round Start: copy one of your spaces from last round.', { now: true,
      onRoundStart(ctx, owner) {
        const L = ledger(ctx.state);
        const list = Object.values(L.last).filter(e => copyable(e) && e.p === owner.id);
        offer(ctx, owner, list, 'Sleepwalker: copy which of your spaces from last round?', 'last', 'Sleepwalker');
      },
    }),
    m('hourglass', 'Stunt Double', 2, 2, 'On Recruit: copy the action you just took.', {
      onRecruited(ctx, owner) {
        const e = justTook(ctx, owner);
        if (!e) {
          const mine = Object.values(ledger(ctx.state).now).some(x => x.p === owner.id);
          ctx.log(mine && has(ctx, owner, 'agents') ? `${owner.name}'s Stunt Double: Agents keeps your actions from being copied.` : `${owner.name}'s Stunt Double has nothing to copy.`);
          return;
        }
        // A recruited member begins its own chain, even when an action recruited it for free.
        withPath(ctx, [], () => copy(ctx, owner, e, { by: 'Stunt Double' }), e.key);
      },
    }),
    // Cory, 2026-10-28: "lets shift tribute band into this", then "should maybe get to pick the rival they copy"
    m('dejavu', 'Tribute Band', 8, 3, /* Cory, Oct 27: "tribute band at 12" (with the +1 wild) */ 'Once per game: do every action a rival you choose has a minion on this round.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        const list = ctx.rivals(owner).filter(o => ownPlan(ctx, o).take.length);
        // nothing to copy: the use isn't spent (as Stunt Double's isn't)
        if (!list.length) { card.used = false; ctx.log(`${owner.name}'s Tribute Band has no rival's actions to copy.`); return; }
        if (list.length === 1) { copyLeader(ctx, owner, list[0]); return; }
        ctx.choose(owner, 'Tribute Band: whose actions?', list.map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: ownPlan(ctx, o).take.reduce((n, e) => n + entryValue(ctx, e, owner), 0),
        })), 'echo.tribute', { uid: card.uid });
      },
      botActivate: (ctx, owner) => owner.left === 0 && ctx.state.round >= 2
        && Math.max(0, ...ctx.rivals(owner).map(o => ownPlan(ctx, o).take.reduce((n, e) => n + entryValue(ctx, e, owner), 0))) >= (ctx.state.round === 3 ? 6 : 10),
    }),
    // Cory, 2026-10-15: moved here from Red (same card; its rename and recruit-time pick wait for his redesign)
    m('doppel', 'Doppelganger', 2, 2, 'On Recruit: it becomes a copy of one of your members.', { round: 3, // joins in round III (Cory, 2026-10-25)
      onRecruited(ctx, owner, card) {
        const own = ctx.membersOf(owner).filter(c => c.uid !== card.uid && (c.copy || !['doppel', 'impostor'].includes(c.def.key)));
        if (!own.length) return;
        ctx.choose(owner, 'Doppelganger: copy which of your members?', own.map(c => ({
          id: `card:${c.uid}`, label: c.def.name, kind: 'member', value: c.uid,
          hint: ['banker', 'prospector', 'recruiter', 'proselytizer', 'host'].includes(c.def.key) ? 2 : (c.def.vanilla ? 0 : 1),
        })), 'echo.doppelCopy', { uid: card.uid });
      },
    }),
    m('impostor', 'Impostor', 2, 3, /* Cory, 2026-10-28: "more expensive": 6 (was 5) */ 'On Recruit: it becomes a copy of a rival’s member.', { round: 3, // joins in round III (Cory, 2026-10-25)
      onRecruited(ctx, owner, card) {
        const rivals = ctx.rivals(owner).flatMap(p => ctx.membersOf(p)).filter(c => c.copy || !['doppel', 'impostor'].includes(c.def.key));
        if (!rivals.length) return;
        ctx.choose(owner, 'Impostor: copy a rival’s member', rivals.map(c => ({
          id: `card:${c.uid}`, label: `${ctx.ownerOf(c.uid).name}: ${c.def.name}`, kind: 'member', value: c.uid,
          hint: (defById(c.copy || c.def.id).f || 1) + 1,
        })), 'echo.doppelCopy', { uid: card.uid });
      },
    }),
    m('connector', 'Connector', 2, 2, 'On Recruit: +1 green per non-green member you have. Round Start: +1 green per non-green member you have.', {
      onRecruited(ctx, owner) { ctx.gain(owner, 'green', nonGreenMembers(ctx, owner)); },
      onRoundStart(ctx, owner) { ctx.gain(owner, 'green', nonGreenMembers(ctx, owner)); },
    }),
    m('agents', 'Agents', 1, 1, 'No one can copy your actions, you included.', { f: 2, n: 2 }),
    m('bait', 'Bait', 1, 1, 'Whenever anyone copies your action, they −1 follower. If it’s a rival, +1 follower.'),
    m('chronicler', 'Chronicler', 1, 3, 'Game end: +1 follower per green member.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'echo'),
    }),
  ],
};

export function justTook(ctx, p) {
  const L = ledger(ctx.state);
  // your own latest space this round (a rival's space or a copy that ran since can't stand in for it)
  const last = Object.values(L.now).filter(x => x.p === p.id).sort((a, b) => (b.seq || 0) - (a.seq || 0))[0];
  // Recruit hooks can run inside a still-resolving take/swap, before its wrapper settles the yield.
  // Read a settled copy so Stunt Double sees that action without mutating the ledger during UI previews.
  const e = last && { ...last };
  if (e?.before) settle(ctx.state, e);
  return e && e.p === p.id && copyable(e) && !protectedAction(ctx, e) ? e : null;
}

const nonGreenMembers = (ctx, p) => ctx.membersOf(p).reduce((n, c) => n + (c.def.quadrant === 'echo' ? 0 : ctx.memberWeight(c)), 0);
const greenOccupied = ctx => {
  const q = ctx.state.quadrants.indexOf('echo');
  return Object.keys(ctx.state.slots).filter(key => key.startsWith(`${q}-`) && key !== `${q}-0`).length;
};

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
