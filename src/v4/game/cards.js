// Card facts for the Lamplit shop and hover cards: timing tags, what paying leaves, how a buy moves the contests,
// and which face-up cards a space would make affordable. All read off the engine; nothing here is a rule.
import { cardDef, paymentPlan, memberPrice, contestTable } from '../../engine/v4/index.js';
import { contextFor } from '../../engine/v4/core.js';
import { ownPlan, skipWords, justTook, previousNow } from '../../engine/v4/content/echo.js';

// The card's timing, from how its text opens (the tag above the name).
const TIMINGS = [
  [/^(?:now|recruit|on recruit|when recruited) (?:and|\/) (?:at )?round start\b/i, 'On recruit + at round start'],
  [/^on recruit:.*\bround (?:i+ )?start:/i, 'On recruit + at round start'], // "On Recruit: X Round Start: X" (Cory, 2026-10-27)
  [/^(?:at )?round start\b/i, 'At round start'],
  [/^round end\b/i, 'Round end'],
  [/^(?:recruit|on recruit|when recruited|when it joins you)\b/i, 'On recruit'],
  [/^(?:whenever|when you|when another player)\b/i, 'Whenever'],
  [/^game end\b/i, 'Game end'],
  [/^once per round\b/i, 'Once a round'],
  [/^(?:once per game|one time use)\b/i, 'One Time Use'],
  [/^while\b/i, 'While'],
];
/** "Round start", "On recruit", "Worth 2"… for a member def. */
export function timingOf(def) {
  const t = (def.text || '').trim();
  const rest = t.replace(/^Worth \d+ followers?\.\s*/i, '');
  if (!rest || /^no effect\.?$/i.test(rest)) return `Worth ${def.f}`;
  for (const [re, label] of TIMINGS) if (re.test(rest)) return label;
  return 'Always';
}

/**
 * What recruiting uid costs player p now: { spend, leaves, short } (short when unaffordable: what's missing, by the
 * engine's one price rule, discounts and Penny Pincher included: { color, colorN, any, total, text: "4 green" }).
 */
export function payBreakdown(state, p, uid) {
  const spend = paymentPlan(state, p, uid);
  if (spend) {
    const leaves = Object.fromEntries(state.resources.map(r => [r, (p.res[r] || 0) - (spend[r] || 0)]));
    return { spend, leaves, short: null };
  }
  const pr = memberPrice(state, p, uid);
  const sh = pr.short || { any: 0, total: 0, text: '' };
  const colorN = pr.color ? sh[pr.color] || 0 : 0;
  return { spend: null, leaves: null, short: { color: colorN ? pr.color : null, colorN, any: sh.any, total: sh.total, text: sh.text } };
}

/**
 * How recruiting uid (paying `spend`) would change the contests for p, if the round ended right after:
 * [{ qid, rule, was:[ids], now:[ids], mine:{ before, after }, text }] for each contest whose leaders change for p.
 */
export function contestEffect(state, p, uid, spend) {
  let after;
  try {
    after = structuredClone({ ...state, log: [], pending: null, queue: [] });
    const q = after.players[p.id];
    for (const r in spend || {}) q.res[r] -= spend[r];
    after.shop = after.shop.filter(u => u !== uid);
    q.members.push(uid);
  } catch { return []; }
  const before = contestTable(state), next = contestTable(after);
  const name = id => (id === p.id ? 'you' : state.players[id].name);
  const out = [];
  before.forEach((c, k) => {
    const n = next[k];
    const had = c.winners.includes(p.id), has = n.winners.includes(p.id);
    if (had === has && (had || c.winners.join() === n.winners.join())) return;
    const mine0 = c.rows.find(r => r.player === p.id)?.count ?? 0, mine1 = n.rows.find(r => r.player === p.id)?.count ?? 0;
    const leader = n.rows.find(r => n.winners.includes(r.player) && r.player !== p.id);
    const text = had && !has
      ? `${leader ? `${cap(name(leader.player))} would lead` : 'You’d lose the lead'}, ${leader ? leader.count : ''}${leader ? ' to your ' : ''}${mine1}`
      : !had && has ? `You’d lead, ${mine1}` : `Leaders change: ${n.winners.map(name).join(' & ') || 'no one'}`;
    out.push({ qid: c.qid, rule: c.rule, was: c.winners, now: n.winners, mine: { before: mine0, after: mine1 }, lost: had && !has, text });
  });
  return out;
}
const cap = s => s[0].toUpperCase() + s.slice(1);

/**
 * Face-up cards p can't afford now but could after gaining at least `gain` ({ color: n }): uids. The space's
 * worst case is used, so a tick never promises what a choice might not give.
 */
export function unlockedBy(state, p, gain) {
  const res = { ...p.res };
  for (const r in gain || {}) res[r] = (res[r] || 0) + Math.max(0, gain[r]);
  const richer = { ...p, res };
  return state.shop.filter(u => !paymentPlan(state, p, u) && paymentPlan(state, richer, u));
}
/** The guaranteed gains of a preview (the low end of each color's range). */
export const surely = pv => (pv ? Object.fromEntries(Object.entries(pv.you.res).map(([r, [lo]]) => [r, lo])) : {});

/**
 * The actions a copying member would copy if recruited now, as
 * board keys, from Green's own target rule; null for any other member or when Green isn't on the table.
 */
export function memberCopyTargets(state, pid, def) {
  if (!state.quadrants.includes('echo')) return null;
  try {
    const ctx = contextFor(state), p = state.players[pid];
    const entries = /copy the action you just took/i.test(def.text || '')
      ? [justTook(ctx, p)].filter(Boolean)
      : /copy the previous action/i.test(def.text || '') ? previousNow(ctx, p) : null;
    return entries && [...new Set(entries.map(e => String(e.key).split('+')[0]))];
  } catch { return null; }
}

/**
 * "Copy every space you took this round" (Greatest Hits, Tribute Band) for player pid right now: the spaces it would
 * copy (board keys and names, in the order taken) and what it skips, in the engine's own words.
 * Null when it isn't such a card or Green isn't on the table. Read on a copy of the ledger.
 */
export function ownCopyPlan(state, pid) {
  if (!state.quadrants.includes('echo') || pid == null) return null;
  try {
    const s = { ...state, echo: state.echo ? structuredClone(state.echo) : undefined };
    const { take, skip } = ownPlan(contextFor(s), s.players[pid]);
    return { keys: [...new Set(take.map(e => String(e.key).split('+')[0]))], names: take.map(e => e.name), skips: skipWords(skip) };
  } catch { return null; }
}
/** Is this the copy-all card (Greatest Hits as a space, Tribute Band as a member)? */
export const copiesAll = text => /^(?:(?:once per game|one time use): )?(?:copy|do) every (?:action (?:where you have a minion|with your minion|you took this round)|space you took this round)/i.test(text || '');
