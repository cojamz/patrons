// The board picker (Cory, 2026-10-15: "those selector screens were awful"): a choice is answered on the board itself.
// Each option the engine marks with a structured `target` (core.js withTargets) lights the thing it names, and a click
// there picks it: { space } a wheel space, { uid } a member (in the shop or on a seat), { pid } a player's cult,
// { pid, res } one of their resource stacks (give: true for a gift), { res } your own stack of a color. Options are
// read by their target only, never by their label. What has no place on the board (Pass, "All 3 as green", an amount)
// stays a button by the caption, and every pick is also in a compact list for the keyboard.
import { quadrant, defById } from '../../engine/v4/index.js';
import { lastSpace } from './seats.js';

/**
 * The picker for the pending choice, or null when it isn't one (no option has a place on the board, or two options
 * name the same thing): { title, actor, count, only, options, where: Map(boardKey → option), rest: [option],
 * spaces: Map(slotKey → optionId), cards: Map(uid → option), seats: { [pid]: { res, seat, members } }, kinds: Set }.
 * Board keys: space:q-i, shop:uid, member:uid, stack:pid:color, seat:pid.
 */
export function boardPicker(state, pend, first = null) {
  if (!pend || pend.kind !== 'choose' || !pend.options || !pend.options.length) return null;
  const where = new Map(), rest = [];
  const holder = uid => state.players.find(p => p.members.includes(uid));
  // a choice of pairs (a color × a rival, yours × theirs…) is picked in two steps: its options, as this step shows them
  const combo = comboStep(state, pend, first);
  const list = combo ? combo.options : pend.options;
  for (const o of list) {
    const t = o.target;
    let key = null;
    if (t && typeof t.space === 'string') key = `space:${t.space}`;
    // a member from the top of the pile (Talent Scout) is laid out in the shop strip for the pick (ShopCards' tray)
    else if (t && Number.isInteger(t.uid)) key = state.shop.includes(t.uid) || state.pile.slice(0, 5).includes(t.uid) ? `shop:${t.uid}` : holder(t.uid) ? `member:${t.uid}` : null;
    else if (t && Number.isInteger(t.pid) && state.players[t.pid]) key = t.res ? `stack:${t.pid}:${t.res}` : `seat:${t.pid}`;
    else if (t && t.res) key = `stack:${pend.player}:${t.res}`;
    if (!key) { rest.push(o); continue; }
    if (where.has(key)) return null; // two answers on one thing: the list says it better
    where.set(key, o);
  }
  if (!where.size) return null;
  const spaces = new Map(), cards = new Map(), seats = {}, kinds = new Set();
  const seat = pid => seats[pid] || (seats[pid] = { res: {}, seat: null, members: {} });
  let give = false;
  for (const [key, o] of where) {
    const [kind, a, b] = key.split(':');
    if (kind === 'space') { spaces.set(a, o.id); kinds.add('space'); }
    else if (kind === 'shop') { cards.set(Number(a), o); kinds.add(state.shop.includes(Number(a)) ? 'shop' : 'pile'); }
    else if (kind === 'member') { const h = holder(Number(a)); seat(h.id).members[a] = o; kinds.add(h.id === pend.player ? 'own-member' : 'member'); }
    else if (kind === 'stack') { seat(Number(a)).res[b] = o; kinds.add(Number(a) === pend.player ? 'own-stack' : 'stack'); if (o.target.give) give = true; }
    else if (kind === 'seat') { seat(Number(a)).seat = o; kinds.add('seat'); }
  }
  const colors = [...new Set([...where.keys()].filter(k => k.startsWith('stack:')).map(k => k.split(':')[2]))];
  // engine prompts read "Name: question"; the name is what's asking (a space or a member)
  const m = String(pend.prompt || '').match(/^([^:]{2,40}):\s(.*)$/);
  return {
    title: m ? m[1] : '', question: m ? m[2] : String(pend.prompt || ''), actor: pend.player, count: pend.count || null, give,
    only: kinds.has('stack') && !give && colors.length === 1 ? colors[0] : null, options: list, where, rest, spaces, cards, seats, kinds,
    combo: combo ? combo.info : null, pend,
  };
}

/**
 * Pairs: a choice whose every answer (but Pass, Done…) names two things. Good Deed (2 of a color to a rival), the
 * swaps (one of your members for a rival's), Trade Seeds (1 of a color for 1 of another), Sweet Talk (a color, then
 * how many). Step one lights the first part (your own stacks or members); once one is picked (`first`, kept by the
 * screen) step two lights what pairs with it, and the picked one stays lifted (a click on it puts it down, a click on
 * another first switches). Step options are the engine's own ids for the second step; the first step's are "@pick:x"
 * and "@unpick", which the screen answers itself. Null when the choice isn't one of these.
 */
export function comboStep(state, pend, first = null) {
  const res = state.resources, pairs = [], rest = [];
  let kind = null;
  for (const o of pend.options) {
    const t = o.target, v = o.value;
    let k = null, a, b;
    if (t && t.give && Number.isInteger(t.pid) && t.res) { k = 'give'; a = t.res; b = t.pid; }
    else if (o.kind === 'trade' && Array.isArray(v) && v.length === 2 && v.every(Number.isInteger)) { k = 'trade'; [a, b] = v; }
    else if (o.kind === 'swap' && Array.isArray(v) && res.includes(v[0]) && res.includes(v[1])) { k = 'colors'; [a, b] = v; }
    else if (o.kind === 'swap' && Array.isArray(v) && res.includes(v[0]) && Number.isInteger(v[1])) { k = 'amount'; [a, b] = v; }
    if (!k) { rest.push(o); continue; }
    if (kind && kind !== k) return null;
    kind = k;
    pairs.push({ o, a, b });
  }
  if (!kind) return null;
  const firsts = [...new Set(pairs.map(x => x.a))];
  const chosen = firsts.includes(first) ? first : firsts.length === 1 ? firsts[0] : null;
  const name = uid => (state.cards[uid] ? defById(state.cards[uid].def).name : String(uid));
  const firstTarget = a => (kind === 'trade' ? { uid: a } : { res: a });
  const firstLabel = a => (kind === 'trade' ? `Give ${name(a)}` : kind === 'give' ? `Give ${a}` : kind === 'colors' ? `Give 1 ${a}` : a);
  // alt: another first while one is picked (it switches the pick; it stays clickable but doesn't glow)
  const pick = a => ({ id: a === chosen ? '@unpick' : `@pick:${a}`, label: a === chosen ? `Put ${kind === 'trade' ? name(a) : a} back` : firstLabel(a), kind: 'first', first: a, target: firstTarget(a), chosen: a === chosen, alt: chosen != null && a !== chosen });
  let options;
  if (chosen == null) options = [...firsts.map(pick), ...rest];
  else {
    const second = pairs.filter(x => x.a === chosen).map(({ o, a, b }) => (
      kind === 'give' ? { ...o, target: { pid: b, fly: a } } // the rival's seat; the coins fly from your stack of that color
        : kind === 'trade' ? { ...o, target: { uid: b } }
          : kind === 'colors' ? { ...o, target: { res: b } }
            : { ...o, target: undefined })); // how many: a button by the caption
    // the other firsts stay live to switch (a color's stacks are both parts in Trade Seeds: there, only "put it back")
    const others = kind === 'colors' ? [pick(chosen)] : firsts.map(pick);
    options = [...others, ...second, ...rest];
  }
  const n = (String(pend.prompt || '').match(/give (\d+)/) || [])[1];
  return { options, info: { kind, chosen, firsts, n: n ? Number(n) : null, chosenName: chosen != null && kind === 'trade' ? name(chosen) : null } };
}

/**
 * The caption, docked under the headline: { title, what, left, how }. "Help Yourself: take 2 · 1 left" (the count
 * rides on the engine's task); a pair's step ("Good Deed: give 2", then "give 2 ●"); else the engine's question, which
 * moves to the line under it when it's too long to be a headline. what may hold { dot: color } parts.
 */
export function pickCaption(state, pk) {
  const c = pk.combo;
  if (c) {
    const a = c.chosen;
    const steps = {
      give: [[`give${c.n ? ` ${c.n}` : ''}`], 'Pick a color, then who gets it', [`give${c.n ? ` ${c.n}` : ''} `, { dot: a }], 'Now pick who gets it'],
      trade: [['pick yours · then theirs'], 'Click one of your lit members', [`give ${c.chosenName} · pick theirs`], 'Click a lit member on a rival’s cult'],
      colors: [['swap one for one'], 'Pick a color to give, then one to get', ['1 ', { dot: a }, ' for 1 of…'], 'Now pick the color you get'],
      amount: [['swap for another color'], 'Pick a color, then how many', ['for ', { dot: a }], 'Now pick how many'],
    }[c.kind];
    return a == null ? { title: pk.title, what: steps[0], left: null, how: steps[1] } : { title: pk.title, what: steps[2], left: null, how: steps[3] };
  }
  if (pk.kinds.has('stack') && !pk.give && pk.count && pk.title) return { title: pk.title, what: [`take ${pk.count.of}${pk.only ? ` ${pk.only}` : ''}`], left: pk.count.left, how: pickHow(pk) };
  const q = pk.title ? pk.question : state.pending.prompt;
  // a member of yours asking (Double Agent just recruited): its rule goes under the headline, so you see why
  const asker = askerOf(state, pk);
  if (asker) return { title: pk.title, what: q.length > 30 ? null : [q], left: pk.count ? pk.count.left : null, how: asker.text };
  if (q.length > 30) return { title: pk.title, what: null, left: pk.count ? pk.count.left : null, how: q[0].toUpperCase() + q.slice(1) };
  return { title: pk.title, what: [q], left: pk.count ? pk.count.left : null, how: pickHow(pk) };
}

/** The member of the actor's that asks this question (its name is the prompt's title), else null: { uid, text }. */
export function askerOf(state, pk) {
  if (!pk || !pk.title || pk.combo) return null;
  const p = state.players[pk.actor];
  const uid = p && p.members.find(u => state.cards[u] && defById(state.cards[u].def).name === pk.title);
  return uid == null ? null : { uid, text: defById(state.cards[uid].def).text };
}

/** How to answer, in a few words: where the lit things are. */
export function pickHow(pk) {
  const k = pk.kinds, say = [];
  if (k.has('space')) say.push('a lit space on the wheel');
  if (k.has('shop')) say.push('a lit member in the shop');
  if (k.has('pile')) say.push('one of the lit members from the top of the pile');
  if (k.has('member') || k.has('own-member')) say.push(k.has('own-member') && !k.has('member') ? 'one of your lit members' : 'a lit member on a cult');
  if (k.has('stack')) say.push(pk.give ? 'a color on a rival’s cult' : 'a lit stack on a rival’s cult');
  if (k.has('own-stack')) say.push('one of your lit stacks');
  if (k.has('seat')) say.push('a rival’s cult');
  return `Click ${say.join(' or ')}`;
}

/** What one option is, for the keyboard list: "P3's green", "P3: green", "P3", your "green", else the engine's words. */
export function pickName(state, o) {
  const t = o.target;
  if (!t || t.fly) return o.label;
  if (Number.isInteger(t.pid) && state.players[t.pid]) {
    const who = state.players[t.pid].name;
    return t.res == null ? who : t.give ? `${who}: ${t.res}` : `${who}’s ${t.res}`;
  }
  if (t.res && t.space == null && t.uid == null) return o.label;
  return o.label;
}

/** The rule of the space the actor just took, when it's what's asking (for "why not" on a dim stack). */
function ruleText(state, pk) {
  const last = lastSpace(state, pk.actor);
  if (!last || last.name !== pk.title) return '';
  try { const a = quadrant(last.qid).actions.find(x => x.name === last.name); return a ? a.text : ''; } catch { return ''; }
}

/**
 * One cult's part in the picker, or null when it takes no part: { lit, seat: option|null, why (seat-level),
 * stacks: { [color]: { option, why } } | null, members: { [uid]: option } | null, picked, give }.
 * Rival stacks (a steal, a gift) and rival seats (pick a player) light on every rival, dim ones saying why; your own
 * stacks light for a color pick; members light wherever the engine offers them, the rest of the figures recede.
 */
export function seatPart(state, pk, pid, picked = {}) {
  if (!pk) return null;
  const own = pid === pk.actor;
  const p = state.players[pid];
  const here = pk.seats[pid] || { res: {}, seat: null, members: {} };
  const k = pk.kinds;
  const stackPick = own ? k.has('own-stack') : k.has('stack');
  const seatPick = !own && k.has('seat');
  const memberPick = k.has('member') || k.has('own-member');
  if (!stackPick && !seatPick && !memberPick) return null;
  const asking = pk.title || 'This choice';
  const rule = own ? '' : ruleText(state, pk);
  const hiding = !own && p.hideout === state.round;
  let stacks = null;
  if (stackPick) {
    stacks = {};
    for (const r of state.resources) {
      const option = here.res[r] || null;
      let why = null;
      if (!option) {
        const has = p.res[r] || 0;
        if (own) why = `${asking}: not ${r}.`;
        else if (pk.give) why = `${asking} can’t give ${r} to ${p.name} now.`;
        else if (hiding && has) why = `${p.name} is lying low this round: no one can take their resources.`;
        else if (!has) why = `${p.name} has no ${r}.`;
        else if (pk.only && r !== pk.only) why = `${asking} takes only ${pk.only}.`;
        else if (picked[r] && picked[r] >= has) why = `You’ve already picked all of ${p.name}’s ${r}.`;
        else why = `${asking} can’t take from ${p.name} now.${rule ? ` ${rule}` : ''}`;
      }
      stacks[r] = { option, why, chosen: !!(option && option.chosen) };
    }
  }
  const members = memberPick ? here.members : null;
  const lit = !!here.seat || Object.keys(here.res).length > 0 || Object.keys(here.members).length > 0;
  const seatWhy = lit || own ? null : seatPick ? `${asking}: not ${p.name}.` : hiding ? `${p.name} is lying low this round.` : stackPick ? `${asking} can’t pick ${p.name} now.${rule ? ` ${rule}` : ''}` : null;
  // a seat dims only when it's one of the things being picked between (a rival with nothing to take, a player not offered)
  const dims = !own && !lit && (seatPick || stackPick);
  const chosenUid = pk.combo && pk.combo.kind === 'trade' && own ? pk.combo.chosen : null;
  const asker = own ? askerOf(state, pk) : null;
  return { lit, dim: dims, seat: seatPick ? here.seat : null, seatMode: seatPick, why: seatWhy, stacks, members, picked, give: pk.give, chosenUid, askerUid: asker ? asker.uid : null };
}

/** The shop's lookup while a picker is up: a face-up member is a pick when the engine names its uid. */
export const shopLookup = pk => id => {
  const m = /^card:(\d+)$/.exec(id);
  return m ? pk.cards.get(Number(m[1])) || null : null;
};
