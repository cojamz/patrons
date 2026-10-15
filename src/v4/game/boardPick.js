// The board picker (Cory, 2026-10-15: "those selector screens were awful"): a choice is answered on the board itself.
// Each option the engine marks with a structured `target` (core.js withTargets) lights the thing it names, and a click
// there picks it: { space } a wheel space, { uid } a member (in the shop or on a seat), { pid } a player's cult,
// { pid, res } one of their resource stacks (give: true for a gift), { res } your own stack of a color. Options are
// read by their target only, never by their label. What has no place on the board (Pass, "All 3 as green", an amount)
// stays a button by the caption, and every pick is also in a compact list for the keyboard.
import { quadrant } from '../../engine/v4/index.js';
import { lastSpace } from './seats.js';

/**
 * The picker for the pending choice, or null when it isn't one (no option has a place on the board, or two options
 * name the same thing): { title, actor, count, only, options, where: Map(boardKey → option), rest: [option],
 * spaces: Map(slotKey → optionId), cards: Map(uid → option), seats: { [pid]: { res, seat, members } }, kinds: Set }.
 * Board keys: space:q-i, shop:uid, member:uid, stack:pid:color, seat:pid.
 */
export function boardPicker(state, pend) {
  if (!pend || pend.kind !== 'choose' || !pend.options || !pend.options.length) return null;
  const where = new Map(), rest = [];
  const holder = uid => state.players.find(p => p.members.includes(uid));
  for (const o of pend.options) {
    const t = o.target;
    let key = null;
    if (t && typeof t.space === 'string') key = `space:${t.space}`;
    else if (t && Number.isInteger(t.uid)) key = state.shop.includes(t.uid) ? `shop:${t.uid}` : holder(t.uid) ? `member:${t.uid}` : null;
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
    else if (kind === 'shop') { cards.set(Number(a), o); kinds.add('shop'); }
    else if (kind === 'member') { const h = holder(Number(a)); seat(h.id).members[a] = o; kinds.add(h.id === pend.player ? 'own-member' : 'member'); }
    else if (kind === 'stack') { seat(Number(a)).res[b] = o; kinds.add(Number(a) === pend.player ? 'own-stack' : 'stack'); if (o.target.give) give = true; }
    else if (kind === 'seat') { seat(Number(a)).seat = o; kinds.add('seat'); }
  }
  const colors = [...new Set([...where.keys()].filter(k => k.startsWith('stack:')).map(k => k.split(':')[2]))];
  // engine prompts read "Name: question"; the name is what's asking (a space or a member)
  const m = String(pend.prompt || '').match(/^([^:]{2,40}):\s(.*)$/);
  return {
    title: m ? m[1] : '', question: m ? m[2] : String(pend.prompt || ''), actor: pend.player, count: pend.count || null, give,
    only: kinds.has('stack') && !give && colors.length === 1 ? colors[0] : null, options: pend.options, where, rest, spaces, cards, seats, kinds,
  };
}

/** "Help Yourself: take 2 · 1 left" (the count rides on the engine's task), else the engine's own question. */
export function pickCaption(state, pk) {
  if (pk.kinds.has('stack') && !pk.give && pk.count && pk.title) return { title: pk.title, what: `take ${pk.count.of}${pk.only ? ` ${pk.only}` : ''}`, left: pk.count.left };
  return { title: pk.title, what: pk.title ? pk.question : state.pending.prompt, left: pk.count ? pk.count.left : null };
}

/** How to answer, in a few words: where the lit things are. */
export function pickHow(pk) {
  const k = pk.kinds, say = [];
  if (k.has('space')) say.push('a lit space on the wheel');
  if (k.has('shop')) say.push('a lit member in the shop');
  if (k.has('member') || k.has('own-member')) say.push(k.has('own-member') && !k.has('member') ? 'one of your lit members' : 'a lit member on a cult');
  if (k.has('stack')) say.push(pk.give ? 'a color on a rival’s cult' : 'a lit stack on a rival’s cult');
  if (k.has('own-stack')) say.push('one of your lit stacks');
  if (k.has('seat')) say.push('a rival’s cult');
  return `Click ${say.join(' or ')}`;
}

/** What one option is, for the keyboard list: "P3's green", "P3: green", "P3", your "green", else the engine's words. */
export function pickName(state, o) {
  const t = o.target;
  if (!t) return o.label;
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
      stacks[r] = { option, why };
    }
  }
  const members = memberPick ? here.members : null;
  const lit = !!here.seat || Object.keys(here.res).length > 0 || Object.keys(here.members).length > 0;
  const seatWhy = lit || own ? null : seatPick ? `${asking}: not ${p.name}.` : hiding ? `${p.name} is lying low this round.` : stackPick ? `${asking} can’t pick ${p.name} now.${rule ? ` ${rule}` : ''}` : null;
  // a seat dims only when it's one of the things being picked between (a rival with nothing to take, a player not offered)
  const dims = !own && !lit && (seatPick || stackPick);
  return { lit, dim: dims, seat: seatPick ? here.seat : null, seatMode: seatPick, why: seatWhy, stacks, members, picked, give: pk.give };
}

/** The shop's lookup while a picker is up: a face-up member is a pick when the engine names its uid. */
export const shopLookup = pk => id => {
  const m = /^card:(\d+)$/.exec(id);
  return m ? pk.cards.get(Number(m[1])) || null : null;
};
