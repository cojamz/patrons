// The seat selector (Cory, 2026-10-15: "this should be way easier to select what I want to steal"): when a choice's
// options all point at seats (the engine's structured `target`: { pid } a player, { pid, res } one of their resource
// stacks, give: true a gift of that color), the cults around the wheel become the selector. A stack you can take
// lights up on its seat and a click takes one; a stack you can't stays dim and says why on hover. Options are read
// by their target field only, never by their label.
import { quadrant } from '../../engine/v4/index.js';
import { lastSpace } from './seats.js';

const targetOf = o => (o && o.target && Number.isInteger(o.target.pid) ? o.target : null);

/**
 * The selector for the pending choice, or null when it isn't a seat choice:
 * { mode: 'take'|'give'|'player', title, actor, count, only (the one color every option names, if any), options,
 *   seats: { [pid]: { res: { [color]: option }, seat: option|null } } }.
 */
export function seatPicker(state, pend) {
  if (!pend || pend.kind !== 'choose' || !pend.options || !pend.options.length) return null;
  const list = pend.options.map(o => [o, targetOf(o)]);
  if (list.some(([, t]) => !t || !state.players[t.pid])) return null;
  const withRes = list.filter(([, t]) => t.res != null).length;
  if (withRes && withRes !== list.length) return null; // a mix of seats and stacks: the list handles it
  const mode = !withRes ? 'player' : list.every(([, t]) => t.give) ? 'give' : list.some(([, t]) => t.give) ? null : 'take';
  if (!mode) return null;
  const seats = {};
  for (const [o, t] of list) {
    const s = seats[t.pid] || (seats[t.pid] = { res: {}, seat: null });
    if (t.res != null) s.res[t.res] = o; else s.seat = o;
  }
  const colors = [...new Set(list.map(([, t]) => t.res).filter(Boolean))];
  // engine prompts read "Name: question"; the name is what's asking (a space or a member)
  const title = (String(pend.prompt || '').match(/^([^:]{2,40}):\s/) || [])[1] || '';
  return { mode, title, actor: pend.player, count: pend.count || null, only: colors.length === 1 && mode === 'take' ? colors[0] : null, options: pend.options, seats };
}

/** "Help Yourself: take 2 · 1 left" (the count rides on the engine's task), else the engine's own prompt. */
export function pickCaption(state, pk) {
  const pend = state.pending;
  if (pk.mode === 'take' && pk.count && pk.title) {
    return { title: pk.title, what: `take ${pk.count.of}${pk.only ? ` ${pk.only}` : ''}`, left: pk.count.left };
  }
  return { title: '', what: pend.prompt, left: null };
}

/** How to answer, in a few words. */
export const pickHow = pk => (pk.mode === 'player' ? 'Click a rival’s cult' : pk.mode === 'give' ? 'Click a color on a rival’s cult' : 'Click a lit stack on a rival’s cult');

/** What one option is, read from its target: "P3's green", "P3: green", "P3". */
export function pickName(state, o) {
  const t = targetOf(o);
  if (!t) return o.label;
  const who = state.players[t.pid].name;
  return t.res == null ? who : t.give ? `${who}: ${t.res}` : `${who}’s ${t.res}`;
}

/** The rule of the space the actor just took, when it's what's asking (for "why not" on a dim stack). */
function ruleText(state, pk) {
  const last = lastSpace(state, pk.actor);
  if (!last || last.name !== pk.title) return '';
  try { const a = quadrant(last.qid).actions.find(x => x.name === last.name); return a ? a.text : ''; } catch { return ''; }
}

/**
 * One seat's part in the selector: { mode, lit, seat: option|null, why (seat-level), stacks: { [color]: { option, why } } }.
 * Every rival seat takes part (a seat with nothing to pick is dim and says why); the actor's own seat doesn't.
 */
export function seatPart(state, pk, pid, picked = {}) {
  if (!pk || pid === pk.actor) return null;
  const p = state.players[pid];
  const mine = pk.seats[pid] || { res: {}, seat: null };
  const rule = ruleText(state, pk);
  const asking = pk.title || 'This choice';
  const hiding = p.hideout === state.round;
  const stacks = {};
  for (const r of state.resources) {
    const option = mine.res[r] || null;
    let why = null;
    if (!option && pk.mode !== 'player') {
      const has = p.res[r] || 0;
      if (pk.mode === 'give') why = `${asking} can’t give ${r} to ${p.name} now.`;
      else if (hiding && has) why = `${p.name} is lying low this round: no one can take their resources.`;
      else if (!has) why = `${p.name} has no ${r}.`;
      else if (pk.only && r !== pk.only) why = `${asking} takes only ${pk.only}.`;
      else if (picked[r] && picked[r] >= has) why = `You’ve already picked all of ${p.name}’s ${r}.`;
      else why = `${asking} can’t take from ${p.name} now.${rule ? ` ${rule}` : ''}`;
    }
    stacks[r] = { option, why };
  }
  const lit = !!mine.seat || Object.values(mine.res).length > 0;
  const seatWhy = lit ? null : pk.mode === 'player' ? `${asking}: not ${p.name}.` : hiding ? `${p.name} is lying low this round.` : `${asking} can’t pick ${p.name} now.${rule ? ` ${rule}` : ''}`;
  return { mode: pk.mode, lit, seat: mine.seat, why: seatWhy, stacks, picked };
}
