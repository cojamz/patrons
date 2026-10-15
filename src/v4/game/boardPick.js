// The board picker (Cory, 2026-10-15: "those selector screens were awful"): a choice is answered on the board itself.
// Each option the engine marks with a structured `target` (core.js withTargets) lights the thing it names, and a click
// there picks it: { space } a wheel space, { uid } a member (in the shop or on a seat), { pid } a player's cult,
// { pid, res } one of their resource stacks (give: true for a gift), { res } your own stack of a color. Options are
// read by their target only, never by their label. What has no place on the board (Pass, "All 3 as green", an amount)
// stays a button by the caption, and every pick is also in a compact list for the keyboard.
import { quadrant, defById, followers } from '../../engine/v4/index.js';
import { lastSpace } from './seats.js';

/**
 * The picker for the pending choice, or null when it isn't one (no option has a place on the board, or two options
 * name the same thing): { title, actor, count, only, options, where: Map(boardKey → option), rest: [option],
 * spaces: Map(slotKey → optionId), cards: Map(uid → option), seats: { [pid]: { res, seat, members } }, kinds: Set }.
 * Board keys: space:q-i, shop:uid, member:uid, stack:pid:color, seat:pid.
 */
export function boardPicker(state, pend) {
  if (!pend || pend.kind !== 'choose' || !pend.options || !pend.options.length) return null;
  // a gift or a pair (Good Deed, Kickback, the swaps, Trade Seeds, Sweet Talk) is picked on the gift card by the space
  if (giftPick(state, pend)) return null;
  const where = new Map(), rest = [];
  const holder = uid => state.players.find(p => p.members.includes(uid));
  const list = pend.options;
  for (const o of list) {
    const t = o.target;
    let key = null;
    if (t && typeof t.space === 'string') key = `space:${t.space}`;
    // a member from the top of the pile (Talent Scout) is laid out in the shop strip for the pick (ShopCards' tray)
    else if (t && Number.isInteger(t.uid)) key = state.shop.includes(t.uid) || state.pile.slice(0, 5).includes(t.uid) ? `shop:${t.uid}` : holder(t.uid) ? `member:${t.uid}` : null;
    else if (t && Number.isInteger(t.pid) && state.players[t.pid]) key = t.res ? `stack:${t.pid}:${t.res}` : `seat:${t.pid}`;
    else if (t && t.res) key = `stack:${pend.player}:${t.res}`;
    if (!key) { rest.push(o); continue; }
    if (where.has(key)) {
      // two copies of one space (its taker's and a Squatter's join): the board keeps the better one for you, the other
      // is a button by the caption; giving up here put a grid of chips over the wheel (w4 skeptic #3, Encore)
      const prev = where.get(key);
      if (o.kind === 'space' && prev.kind === 'space') {
        if ((o.hint ?? 0) > (prev.hint ?? 0)) { where.set(key, o); rest.push(prev); } else rest.push(o);
        continue;
      }
      return null; // two answers on one thing: the list says it better
    }
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
    // the engine's own reason for each player who can't be picked now (a steal's per-rival limit), for dim seats
    blocked: pend.blocked || null,
    only: kinds.has('stack') && !give && colors.length === 1 ? colors[0] : null, options: list, where, rest, spaces, cards, seats, kinds, pend,
  };
}

/**
 * The gift card (Cory: the two-step pick on the seats was "very bad/confusing"): a choice that gives something to a
 * rival, or pairs two things, is picked on a small card beside the space just used, never on the seats and never from
 * a grid of combination chips. Its rows, in order:
 *   give    Good Deed: a color (the table's dots), then the rival who gets it (their faces)
 *   gift    Kickback, Benefactor: the color is fixed ("give 1 gold to…"), so only the rivals' faces
 *   colors  Trade Seeds: the color you give (yours), then the one you get
 *   amount  Sweet Talk: the color you get, then how many
 *   trade   Even Swap, Swap Sides: one of your members, then a rival's it pairs with (grouped by rival)
 *   color   Goody Bags, Cheap Seats: one row, a color of yours (a space's ask only; Done and "N left" ride along)
 * Null when the choice isn't one of these. Steals stay on the seats: one click on the rival's own pile is already the
 * pair (whose and which), and it's the thing you take.
 * The model: { kind, title, head, n, color, actor, chosen, firsts, seconds, others, rest, done, sameCost }.
 *   firsts: the first row, [{ id, a, chosen }]: id "@pick:a" lifts it, "@unpick" (the one lifted) puts it down; another
 *     first switches. The screen answers these itself; nothing goes to the engine.
 *   seconds: the second row once a first is picked (at once, for a gift): [{ o, b }], o the engine's own option (its id
 *     unchanged), b what it pairs with (a player id, a color, an amount, a member uid).
 *   others: what the second row can hold, shown quiet before a first is picked, so the card never changes shape.
 *   rest: answers with no place in a row (Keep it all, Done).
 */
export function giftPick(state, pend, first = null) {
  if (!pend || pend.kind !== 'choose' || !pend.options || !pend.options.length) return null;
  const m = String(pend.prompt || '').match(/^([^:]{2,40}):\s(.*)$/);
  const title = m ? m[1] : '';
  const question = m ? m[2] : String(pend.prompt || '');
  const base = { title, actor: pend.player, done: null, sameCost: false };
  // a gift of a fixed color to a rival: every answer is a player ("Kickback: give 1 gold to…")
  const gift = question.match(/^give (\d+) (\w+) to\b/i);
  const players = pend.options.filter(o => o.target && Number.isInteger(o.target.pid) && o.target.res == null && o.target.pid !== pend.player);
  if (gift && players.length && players.length === pend.options.length) {
    const n = Number(gift[1]), color = state.resources.includes(gift[2]) ? gift[2] : null;
    return { ...base, kind: 'gift', n, color, head: 'Give', chosen: color, firsts: [], seconds: players.map(o => ({ o, b: o.target.pid })), others: players.map(o => o.target.pid), rest: [] };
  }
  // a color of yours asked by a space just used (Goody Bags' color, Cheap Seats' "pay 1 for 1 follower"): one row of your
  // colors on the card by the space (Cory, 2026-10-15: choices come to where you act), never your seat's stacks ~500 px
  // away. Asks from a member or a release (no space behind them) stay on your stacks.
  const own = pend.options.filter(o => o.target && o.target.res && o.target.pid == null && o.target.space == null && o.target.uid == null);
  const fromSpace = title && state.quadrants.some(q => quadrant(q).actions.some(a => a.name === title));
  if (fromSpace && own.length >= 2 && own.length + pend.options.filter(o => !o.target).length === pend.options.length) {
    const left = (question.match(/\((\d+) left\)/) || [])[1];
    const ask = question.replace(/\s*\(\d+ left\)\s*/, ' ').trim();
    // "pay which resource for 1 follower?" reads "Pay 1 for 1 follower"; any other question is its first sentence, the
    // rest of it the line under it ("Which color?" / "You get 2, everyone else gets 1.")
    const payFor = ask.match(/^pay which \w+ for (\d+ \w+)\?\s*(.*)$/i);
    const [q1, ...more] = ask.split('?');
    const head = payFor ? `Pay 1 for ${payFor[1]}` : `${q1[0].toUpperCase()}${q1.slice(1)}${more.length ? '?' : ''}`;
    const sub = payFor ? payFor[2] : more.join('?').trim();
    return { ...base, kind: 'color', n: null, color: null, chosen: null, pay: !!payFor, left: left == null ? null : Number(left),
      head, sub, firsts: [], seconds: own.map(o => ({ o, b: o.target.res })), others: own.map(o => o.target.res), rest: pend.options.filter(o => !o.target) };
  }
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
  const byColor = (x, y) => res.indexOf(x) - res.indexOf(y);
  const firstsAll = [...new Set(pairs.map(x => x.a))];
  if (kind !== 'trade') firstsAll.sort(byColor);
  const chosen = firstsAll.includes(first) ? first : firstsAll.length === 1 ? firstsAll[0] : null;
  const firsts = firstsAll.map(a => ({ id: a === chosen ? '@unpick' : `@pick:${a}`, a, chosen: a === chosen }));
  const seconds = chosen == null ? [] : pairs.filter(x => x.a === chosen).map(({ o, b }) => ({ o, b }));
  const others = [...new Set(pairs.map(x => x.b))];
  if (kind === 'colors') others.sort(byColor);
  else if (kind === 'give' || kind === 'amount') others.sort((x, y) => x - y);
  const n = Number((question.match(/give (\d+)/) || [])[1]) || null;
  const done = (question.match(/\((\d+) swapped so far\)/) || [])[1];
  const head = { give: n ? `A rival you pick gets ${n}` : 'A rival you pick gets some', colors: 'Swap one for one', amount: 'Swap for another color', trade: 'Swap a member with a rival' }[kind];
  return { ...base, kind, n, color: null, head, chosen, firsts, seconds, others, rest, done: done == null ? null : Number(done), sameCost: /equal cost/i.test(question) };
}

/**
 * The pay sheet's warning, for a choice that spends your coins (Cheap Seats, All In, Trade Seeds…): the engine marks
 * each answer that gives up a contest lead or tie you hold (breaks), and one plain line says so before you click
 * (panel tester C #1: Cheap Seats gave up a silver lead with no warning). Null when no answer does.
 */
export function leadWarning(options) {
  const lost = [...new Set((options || []).flatMap(o => o.breaks || []))];
  if (!lost.length) return null;
  const ties = [...new Set((options || []).flatMap(o => o.ties || []))];
  const or = l => (l.length > 1 ? `${l.slice(0, -1).join(', ')} or ${l[l.length - 1]}` : l[0]);
  return `Spending ${or(lost)} gives up ${leadsLost(lost, ties, or)}.`;
}
/**
 * What a payment gives up, in words: "your lead in gold", "your tie for most silver", or both joined. A tie is never
 * called a lead (blind tester B: the pay sheet said "lead" where they only tied). `join` lists colors.
 */
export function leadsLost(breaks, ties = [], join = l => l.join(' and ')) {
  const leads = breaks.filter(c => !ties.includes(c)), tied = breaks.filter(c => ties.includes(c));
  return [leads.length ? `your lead in ${join(leads)}` : null, tied.length ? `your tie for most ${join(tied)}` : null].filter(Boolean).join(' and ');
}

/**
 * The caption, docked under the headline: { title, what, left, how }. "Help Yourself: take 2 · 1 left" (the count
 * rides on the engine's task); else the engine's question, which
 * moves to the line under it when it's too long to be a headline. what may hold { dot: color } parts.
 */
export function pickCaption(state, pk) {
  const cap = captionOf(state, pk);
  const warn = leadWarning(pk.options);
  return warn ? { ...cap, how: `${cap.how} · ${warn}`, warn } : cap;
}
function captionOf(state, pk) {
  if (pk.kinds.has('stack') && !pk.give && pk.count && pk.title) {
    // the steal's limit, in the engine's words ("1 each from P3, P4"), leads the how line
    const limit = (String(pk.question).match(/\(\d+ left, ([^)]+)\)/) || [])[1];
    // "· N left" only once the first is taken: at the start it said the count twice ("take 3 · 3 left", w4b #17)
    // never more than the lit stacks hold (blind testers, 2026-10-15: "take 3 gold" with 2 on the table)
    const lit = Object.entries(pk.seats).reduce((t, [pid, x]) => t + Object.keys(x.res).reduce((u, r) => u + ((state.players[pid] && state.players[pid].res[r]) || 0), 0), 0);
    const of = Math.min(pk.count.of, pk.count.of - pk.count.left + lit);
    return { title: pk.title, what: [`take ${of}${pk.only ? ` ${pk.only}` : ''}`], left: pk.count.left < pk.count.of ? Math.min(pk.count.left, lit) : null, how: `${limit ? `${limit[0].toUpperCase()}${limit.slice(1)}. ` : ''}${pickHow(pk)}` };
  }
  const q = pk.title ? pk.question : state.pending.prompt;
  // a member of yours asking (Double Agent just recruited): its rule goes under the headline, so you see why
  const asker = askerOf(state, pk);
  // a long question ("Hustler: actions in which color give you extra gold?") says what to do in a few words instead,
  // and the line under it says where to click, with the card's rule after it only when the whole line fits (w3a #14:
  // the rule clipped to "…per ro…" and nothing said to click one of your colors); the rule is on the asker's card
  if (asker && q.length > 30) {
    const rest = asker.text.replace(/^When recruited[,:]\s*/i, '').replace(/^pick an? \w+\.\s*/i, '');
    const how = `${pickHow(pk)}. ${rest[0].toUpperCase()}${rest.slice(1)}`;
    return { title: pk.title, what: [shortAsk(pk)], left: pk.count ? pk.count.left : null, how: how.length <= 64 ? how : pickHow(pk), rule: asker.text };
  }
  if (asker) return { title: pk.title, what: [q], left: pk.count ? pk.count.left : null, how: asker.text };
  if (q.length > 30) return { title: pk.title, what: null, left: pk.count ? pk.count.left : null, how: q[0].toUpperCase() + q.slice(1) };
  return { title: pk.title, what: [q], left: pk.count ? pk.count.left : null, how: pickHow(pk) };
}

/** The member of the actor's that asks this question (its name is the prompt's title), else null: { uid, text }. */
export function askerOf(state, pk) {
  if (!pk || !pk.title) return null;
  const p = state.players[pk.actor];
  // only a member recruited this turn's round by them (Double Agent's "When recruited"): one they use says how instead
  const uid = p && p.members.find(u => state.cards[u] && defById(state.cards[u].def).name === pk.title && state.cards[u].recruitedRound === state.round && state.cards[u].recruitedBy === p.id && !state.cards[u].used);
  return uid == null ? null : { uid, text: defById(state.cards[uid].def).text };
}

/** What a choice wants, in two words, from what it lights ("pick a color"). */
function shortAsk(pk) {
  const k = pk.kinds;
  if (k.has('space')) return 'pick a space';
  if (k.has('own-stack') || k.has('stack')) return 'pick a color';
  if (k.has('seat')) return 'pick a rival';
  return 'pick a member';
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
        else if (pk.blocked && pk.blocked[pid]) why = pk.blocked[pid];
        else if (picked[r] && picked[r] >= has) why = `You’ve already picked all of ${p.name}’s ${r}.`;
        else why = `${asking} can’t take from ${p.name} now.${rule ? ` ${rule}` : ''}`;
      }
      stacks[r] = { option, why };
    }
  }
  const members = memberPick ? here.members : null;
  const lit = !!here.seat || Object.keys(here.res).length > 0 || Object.keys(here.members).length > 0;
  const seatWhy = lit || own ? null : seatPick ? `${asking}: not ${p.name}.` : hiding ? `${p.name} is lying low this round.` : pk.blocked && pk.blocked[pid] ? pk.blocked[pid] : stackPick ? `${asking} can’t pick ${p.name} now.${rule ? ` ${rule}` : ''}` : null;
  // a seat dims only when it's one of the things being picked between (a rival with nothing to take, a player not offered)
  const dims = !own && !lit && (seatPick || stackPick);
  const asker = own ? askerOf(state, pk) : null;
  // a steal from the player with the most followers pays the thief's Robin Hood: that seat says so before you pick
  // (design pod, from the detail designer: the target wasn't marked, so a player picked blind)
  let bonus = null;
  if (!own && stackPick && !pk.give && lit && Number.isInteger(pk.actor)) {
    const thief = state.players[pk.actor];
    const hoods = (thief.members || []).filter(u => state.cards[u] && state.cards[u].def === 'thieves.robinhood' && !state.cards[u].used).length;
    const fol = o => followers(state, o);
    if (hoods && state.players.every(o => fol(o) <= fol(p))) bonus = { n: hoods, why: `Robin Hood: take from ${p.name}, who has the most followers, and you gain +${hoods} follower${hoods > 1 ? 's' : ''}.` };
  }
  return { lit, dim: dims, seat: seatPick ? here.seat : null, seatMode: seatPick, why: seatWhy, stacks, members, picked, give: pk.give, askerUid: asker ? asker.uid : null, bonus };
}

/** The shop's lookup while a picker is up: a face-up member is a pick when the engine names its uid. */
export const shopLookup = pk => id => {
  const m = /^card:(\d+)$/.exec(id);
  return m ? pk.cards.get(Number(m[1])) || null : null;
};
