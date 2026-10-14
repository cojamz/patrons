// Green: the echo. You copy what spaces gave: a rival's, your own, last round's.
// Scoring: most green at round end.
//
// The echo rule (core-rules.md): an echo gives exactly what the space gave its original taker, never
// recomputed for you. Echoes can't be echoed, and the round-III center can't be echoed.
// A copied member comes as "a face-up member costing no more than theirs, free" (the card itself is gone).
//
// Prototype notes (engine changes this module would like, see design/spheres/echo.md):
// - The engine doesn't record what a space gave. install() wraps every action's resolve and every handler
//   to keep a yield ledger on state.echo. The real fix is ~10 lines in core.js: snapshot the taker in the
//   'act' task, and close the entry when that player's 'buy' task starts.
// - core.js pays a member's colored part from p.res[def.quadrant]; here id 'echo' ≠ resource 'green', so
//   install() relabels the member defs' quadrant as 'green' (same one-line fix as thieves.js).
import { registerQuadrant, allQuadrantIds, quadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const costOf = def => def.s + def.w;

// ---------- the yield ledger ----------
// state.echo = { round, now: { 'q-i': entry }, last: { ... }, open: key | null }
// entry = { key, p, ring, name, color, echo, res: { color: n }, discount, members: [cost, ...] }
export function ledger(state) {
  if (!state.echo) state.echo = { round: state.round, now: {}, last: {}, open: null };
  const L = state.echo;
  if (L.round !== state.round) {
    L.last = L.round === state.round - 1 ? L.now : {};
    L.now = {}; L.round = state.round; L.open = null;
  }
  return L;
}
const snap = p => ({ res: { ...p.res }, discount: p.discount, members: [...p.members] });
function settle(state, e) {
  const p = state.players[e.p];
  e.res = {};
  for (const r of state.resources) { const d = (p.res[r] || 0) - (e.before.res[r] || 0); if (d > 0) e.res[r] = d; }
  e.discount = Math.max(0, p.discount - e.before.discount);
  const k = Math.max(0, p.members.length - e.before.members.length);
  const fresh = p.members.filter(u => !e.before.members.includes(u)).map(u => costOf(quadrantDef(state, u))).sort((a, b) => a - b);
  e.members = fresh.slice(0, k);
}
const quadrantDef = (state, uid) => defById(state.cards[uid].def);
// The window for a space stays open while its follow-up choices run, until the taker's buy step.
function windowOpen(state, e) {
  const next = state.queue.find(t => t.t !== 'choose');
  return !!next && next.t === 'buy' && next.p === e.p;
}
function wrapAction(qid, a, idx) {
  if (a.resolve.__echo) return;
  const orig = a.resolve;
  const wrapped = function (ctx, p) {
    const L = ledger(ctx.state);
    const key = `${ctx.state.quadrants.indexOf(qid)}-${idx}`;
    const e = { key, p: p.id, ring: a.ring, name: a.name, color: qid, echo: !!a.echo, before: snap(p), res: {}, discount: 0, members: [] };
    L.seq = (L.seq || 0) + 1; e.seq = L.seq;
    L.now[key] = e; L.open = key; L.lastBy = key;
    orig.call(this, ctx, p);
    settle(ctx.state, e);
  };
  wrapped.__echo = true;
  a.resolve = wrapped;
}
function wrapHandler(q, k) {
  const orig = q.handlers[k];
  if (orig.__echo) return;
  const wrapped = function (ctx, p, value, data) {
    orig.call(this, ctx, p, value, data);
    const L = ctx.state.echo;
    const e = L && L.open && L.now[L.open];
    if (e && windowOpen(ctx.state, e)) settle(ctx.state, e);
  };
  wrapped.__echo = true;
  q.handlers[k] = wrapped;
}

// ---------- reading and copying ----------
const spaceTotal = e => Object.values(e.res).reduce((a, b) => a + b, 0);
/** Rough worth of copying an entry for player p right now (bots and hints). */
export function entryValue(ctx, e) {
  let v = spaceTotal(e) + e.discount * 0.9;
  const shop = ctx.shopCards();
  for (const c of e.members) {
    const fits = shop.filter(x => costOf(x.def) <= c);
    if (fits.length) v += Math.max(...fits.map(x => x.def.f * 1.4 + costOf(x.def) * 0.8));
  }
  return v;
}
const copyable = e => !e.echo && e.ring < 3 && (spaceTotal(e) > 0 || e.discount > 0 || e.members.length > 0);
const has = (ctx, p, key) => ctx.membersOf(p).filter(c => c.def.id === `echo.${key}` || c.copy === `echo.${key}`).length;
const describe = (ctx, e) => {
  const bits = Object.entries(e.res).map(([c, n]) => `+${n} ${c}`);
  if (e.discount) bits.push(`${e.discount} off`);
  for (const c of e.members) bits.push(`a member (≤${c})`);
  return bits.join(', ') || 'nothing';
};
/** Spaces p could copy: which = 'rivalOuter' | 'ownOuter' | 'any' | 'last' | 'own'. */
export const VARIANT = { echo: 'rivalOuter', relive: 'ownOuter', plus: 0 };
const plus = (ctx, p) => { if (VARIANT.plus) ctx.gain(p, 'green', VARIANT.plus, { fromAction: true }); };
export function targets(ctx, p, which) {
  const L = ledger(ctx.state);
  const pool = which === 'last' ? Object.values(L.last) : Object.values(L.now);
  if (which === 'rivalLast' || which === 'ownLast' || which === 'rivalLastOuter') {
    const list = pool.filter(e => copyable(e) && (which === 'ownLast' ? e.p === p.id : e.p !== p.id) && (which !== 'rivalLastOuter' || e.ring === 1));
    return list.length ? [list.reduce((a, b) => (b.seq > a.seq ? b : a))] : [];
  }
  return pool.filter(e => copyable(e) && (
    which === 'rivalOuter' ? e.p !== p.id && e.ring === 1
      : which === 'ownOuter' ? e.p === p.id && e.ring === 1
        : which === 'own' ? e.p === p.id
          : true));
}
const bestValue = (ctx, list) => Math.max(0, ...list.map(e => entryValue(ctx, e)));
function offer(ctx, p, list, prompt, from) {
  if (!list.length) { ctx.log(`${p.name} had nothing to copy.`); return; }
  ctx.choose(p, prompt, list.map(e => ({
    id: `space:${from}:${e.key}`, label: `${e.name} (${ctx.player(e.p).name}): ${describe(ctx, e)}`, kind: 'space',
    value: e.key, hint: entryValue(ctx, e),
  })), 'echo.pick', { from });
}

/** p copies entry e: same resources, same discount, and a free face-up member (cost ≤ theirs) per member. */
export function copy(ctx, p, e, { later = null } = {}) {
  const fewest = ctx.state.players.every(o => ctx.followers(o) >= ctx.followers(p));
  const mult = has(ctx, p, 'wallflower') && fewest ? 2 : 1;
  const asGreen = ctx.membersOf(p).some(c => (c.def.id === 'echo.translator' || c.copy === 'echo.translator') && c.on !== false);
  for (const [c, n] of Object.entries(e.res)) ctx.gain(p, asGreen ? 'green' : c, n * mult, { fromAction: true });
  if (e.discount) p.discount += e.discount;
  ctx.log(`${p.name} copied ${e.name}${e.p !== p.id ? ` (${ctx.player(e.p).name}'s)` : ''}: ${describe(ctx, e)}${mult > 1 ? ', doubled' : ''}.`);
  // who hears it
  const choir = has(ctx, p, 'choir');
  if (choir) ctx.gain(p, 'green', choir);
  const taker = ctx.player(e.p);
  if (taker !== p) { const muse = has(ctx, taker, 'muse'); if (muse) ctx.gain(taker, 'green', 2 * muse); }
  for (const o of ctx.rivals(p)) { const cm = has(ctx, o, 'choirmaster'); if (cm) ctx.gain(o, 'green', cm); }
  if (later) later.push(...e.members);
  else if (e.members.length) freeStep(ctx, p, { left: [...e.members] });
}
/** Copy several spaces; free members are picked one after another at the end. */
export function copyAll(ctx, p, list) {
  const later = [];
  for (const e of list) copy(ctx, p, e, { later });
  if (later.length) freeStep(ctx, p, { left: later.sort((a, b) => b - a) });
}
function freeStep(ctx, p, data) {
  if (!data.left.length) return;
  const c = data.left[0];
  const fits = ctx.shopCards().filter(x => costOf(x.def) <= c);
  if (!fits.length) { ctx.log(`${p.name}: no face-up member costs ${c} or less.`); freeStep(ctx, p, { left: data.left.slice(1) }); return; }
  ctx.choose(p, `Copy: take a face-up member costing ${c} or less, free`, fits.map(x => ({
    id: `card:${x.uid}`, label: `${x.def.name} (${costOf(x.def)})`, kind: 'card', value: x.uid, hint: x.def.f * 1.4 + costOf(x.def),
  })), 'echo.free', { cost: c, left: data.left.slice(1) });
}

// ---------- the quadrant ----------
const echoQ = {
  id: 'echo',
  name: 'Green',
  resource: 'green',
  scoring: { label: 'Most green', score: (ctx, p) => p.res.green || 0 },

  actions: [
    {
      key: 'hum', ring: 1, name: 'Hum', text: '+3 green.',
      estimate: () => 3,
      resolve(ctx, p) { ctx.gain(p, 'green', 3, { fromAction: true }); },
    },
    {
      key: 'echo', ring: 1, name: 'Echo', echo: true, text: 'Copy what a rival got from an outer-ring space this round.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, VARIANT.echo)),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, targets(ctx, p, VARIANT.echo), 'Echo: copy which rival space?', 'now'); },
    },
    {
      key: 'relive', ring: 1, name: 'Relive', echo: true, text: 'Copy what you got from one of your outer-ring spaces this round.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, VARIANT.relive)),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, targets(ctx, p, VARIANT.relive), 'Relive: copy which of your spaces?', 'now'); },
    },
    {
      key: 'encore', ring: 2, name: 'Encore', echo: true, text: 'Copy what anyone got from any space this round (not the center).',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'any')),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, targets(ctx, p, 'any'), 'Encore: copy which space?', 'now'); },
    },
    {
      key: 'recall', ring: 2, name: 'Recall', echo: true, text: 'Copy what anyone got from any space last round.',
      estimate: (ctx, p) => VARIANT.plus + bestValue(ctx, targets(ctx, p, 'last')),
      resolve(ctx, p) { plus(ctx, p); offer(ctx, p, targets(ctx, p, 'last'), 'Recall: copy which space from last round?', 'last'); },
    },
    {
      key: 'eternity', ring: 3, name: 'Eternity', echo: true, text: 'Copy every space you took this round.',
      estimate: (ctx, p) => VARIANT.plus + targets(ctx, p, 'own').reduce((s, e) => s + entryValue(ctx, e), 0),
      resolve(ctx, p) {
        plus(ctx, p);
        const list = targets(ctx, p, 'own');
        if (!list.length) { ctx.log(`${p.name} had nothing to copy.`); return; }
        copyAll(ctx, p, list);
      },
    },
  ],

  handlers: {
    pick(ctx, p, key, data) {
      const L = ledger(ctx.state);
      const e = (data.from === 'last' ? L.last : L.now)[key];
      if (e) copy(ctx, p, e);
    },
    free(ctx, p, uid, data) {
      if (!ctx.state.shop.includes(uid)) { freeStep(ctx, p, { left: [data.cost, ...data.left] }); return; }
      ctx.recruit(p, uid, { free: true });
      freeStep(ctx, p, data);
    },
  },

  members: [
    m('evergreen', 'Evergreen', 1, 1, 'At round start, +2 green.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, 'green', 2); },
    }),
    m('choir', 'Choir', 1, 1, 'Whenever you copy a space, +1 green.'),
    m('muse', 'Muse', 1, 0, 'Whenever a rival copies one of your spaces, +2 green.'),
    m('choirmaster', 'Choirmaster', 1, 1, 'Whenever a rival copies a space, +1 green.'),
    m('fan', 'Fan', 1, 1, 'Whenever a rival takes a space that gives them 5 or more resources, +1 green.', {
      onTurnEnd(ctx, owner, card, p) {
        if (p === owner) return;
        const L = ledger(ctx.state);
        const e = L.lastBy && L.now[L.lastBy];
        if (e && e.p === p.id && spaceTotal(e) >= 5) ctx.gain(owner, 'green', 1);
      },
    }),
    m('groupie', 'Groupie', 1, 1, 'Whenever anyone recruits a green member, +1 green.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && recruited.def.id.startsWith('echo.')) ctx.gain(owner, 'green', 1);
      },
    }),
    m('translator', 'Translator', 2, 1, 'What you copy comes as green. You can switch it off or on when you buy.', {
      toggle: true,
      onRecruited(ctx, owner, card) { card.on = true; },
    }),
    m('straggler', 'Straggler', 1, 0, 'At round start, +1 green per player with more followers than you.', {
      onRoundStart(ctx, owner) {
        const n = ctx.rivals(owner).filter(o => ctx.followers(o) > ctx.followers(owner)).length;
        if (n) ctx.gain(owner, 'green', n);
      },
    }),
    m('wallflower', 'Wallflower', 1, 1, 'While no one has fewer followers than you, the resources you copy are doubled.'),
    m('keepsake', 'Keepsake', 1, 1, 'When recruited: copy one of your spaces from this round.', {
      onRecruited(ctx, owner) { offer(ctx, owner, targets(ctx, owner, 'own'), 'Keepsake: copy which of your spaces?', 'now'); },
    }),
    m('mirror', 'Mirror', 2, 2, 'When recruited: gain as much green as the rival with the most green.', {
      onRecruited(ctx, owner) {
        const g = Math.max(0, ...ctx.rivals(owner).map(o => o.res.green || 0));
        if (g) ctx.gain(owner, 'green', g);
        ctx.log(`${owner.name}'s Mirror: +${g} green.`);
      },
    }),
    m('afterimage', 'Afterimage', 2, 2, 'At round start: copy one of your spaces from last round.', {
      onRoundStart(ctx, owner) {
        const L = ledger(ctx.state);
        const list = Object.values(L.last).filter(e => copyable(e) && e.p === owner.id);
        offer(ctx, owner, list, 'Afterimage: copy which of your spaces from last round?', 'last');
      },
    }),
    m('hourglass', 'Hourglass', 3, 2, 'Once per round: copy the space you just took.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        const e = justTook(ctx, owner);
        if (!e) { card.used = false; ctx.log(`${owner.name}'s Hourglass has nothing to copy.`); return; }
        copy(ctx, owner, e);
      },
      botActivate: (ctx, owner) => { const e = justTook(ctx, owner); return !!e && entryValue(ctx, e) >= 3; },
    }),
    m('dejavu', 'Déjà Vu', 3, 2, 'Once per game: copy every space you took this round.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const list = targets(ctx, owner, 'own');
        if (!list.length) ctx.log(`${owner.name}'s Déjà Vu has nothing to copy.`);
        copyAll(ctx, owner, list);
      },
      botActivate: (ctx, owner) => owner.left === 0 && ctx.state.round >= 2
        && targets(ctx, owner, 'own').reduce((s, e) => s + entryValue(ctx, e), 0) >= (ctx.state.round === 3 ? 6 : 10),
    }),
    m('chronicler', 'Chronicler', 4, 2, 'Game end: +1 follower per 3 green.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.green || 0) / 3),
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
  // member costs are paid in green (see the note at the top)
  for (const d of echoQ.members) d.quadrant = 'green';
  installed = true;
  return echoQ;
}
