// A cult's build at one glance (Cory, 2026-10-15: "I have no idea what the bots' builds are"): what its members hand
// it each round, its members' colors, and its members grouped by what they do. All read off the engine.
import { cardDef, quadrant, roundStartIncome } from '../../engine/v4/index.js';
import { onTable } from './Info.jsx';
import { timingOf } from './cards.js';

// one engine run per table state, shared by the four chairs
const incomeCache = new WeakMap();
/** { res: { color: n }, followers } this player's members would hand them at the next round start, or null. */
export function incomeOf(state, pid) {
  if (!(state.round >= 1) || state.over) return null;
  let all = incomeCache.get(state);
  if (all === undefined) { all = roundStartIncome(state); incomeCache.set(state, all); }
  return all ? all[pid] || null : null;
}

/** The member colors, table order then colorless: [{ key, res, n }] (only the colors it has). */
export function memberColors(state, p) {
  const rows = state.quadrants.map(qid => ({ key: qid, res: quadrant(qid).resource, n: 0 }));
  const colorless = { key: 'colorless', res: null, n: 0 };
  for (const uid of p.members) {
    let d;
    try { d = cardDef(state, uid); } catch { continue; }
    const row = onTable(state, d) ? rows.find(r => r.key === d.quadrant) : null;
    (row || colorless).n++;
  }
  return [...rows, colorless].filter(r => r.n);
}

// what a member does, by when it acts (the card's own timing tag)
const GROUPS = [
  ['Each round', 'At every round start', t => /round start/i.test(t)],
  ['Reacts', 'Whenever something happens at the table', t => t === 'Whenever'],
  ['Use once', 'Once a round or once a game, when its owner chooses', t => /^Once/.test(t)],
  ['Game end', 'Scores when the game ends', t => t === 'Game end'],
  ['Always on', 'A standing rule while it is in the cult', t => t === 'While' || t === 'Always' || t === 'Round end'],
  ['On joining', 'Did its part when recruited', t => t === 'On recruit'],
  ['Followers', 'Worth followers, nothing more', t => /^Worth/.test(t)],
];
/** The members grouped by what they do: [{ label, hint, items: [{ uid, name, text, n }] }], empty groups left out. */
export function memberGroups(state, p) {
  const out = GROUPS.map(([label, hint]) => ({ label, hint, items: [] }));
  for (const uid of p.members) {
    let d;
    try { d = cardDef(state, uid); } catch { continue; }
    const t = timingOf(d);
    const k = Math.max(0, GROUPS.findIndex(([, , test]) => test(t)));
    const g = out[k];
    const same = g.items.find(x => x.name === d.name);
    if (same) { same.n++; continue; }
    // a member with no ability says so, as its card does (w2a #36): "No ability: worth 2 followers.", never "No effect."
    const ability = (d.text || '').replace(/^Worth \d+ followers?\.\s*/i, '').replace(/^(Free\.\s*)?No effect\.?$/i, '').trim();
    const text = ability || `No ability: worth ${d.f} follower${d.f === 1 ? '' : 's'}.`;
    g.items.push({ uid, name: d.name, text, n: 1 });
  }
  return out.filter(g => g.items.length);
}

// The "each round" line is a dry run of next round's start (roundStartIncome), so a member whose pay hangs on the
// table read as a sure thing: Late Bloomer showed +1 every round while it pays only to the fewest followers, and
// Clockmaker's +2 dropped to +1 after a steal with no word why (f8). Each such member marks the parts it can touch with
// a plain condition ("if fewest", "per 2 purple"); members that always pay the same leave theirs bare.
const INCOME_IF = {
  latebloomer: 'if fewest', // "if you have the fewest followers"
  safetynet: 'if none', // Rich Uncle: "if you have no white" (round 3 skeptic: the seat's small print ran long; the hover says the rule)
  gardener: 'if none', // "+1 of each color you have none of"
  clockmaker: 'per 2 purple',
  steward: 'per 3 silver',
  host: 'per 2 members',
  heir: 'per member', // "Now and at the start of round III: +1 silver per member you have"

  curator: 'per blue member',
  minimalist: 'per bigger cult', // "per rival with more members than you"
  mole: 'per rival ahead', // "from each player with more followers than you"
  cutpurse: 'if any to rob',
  afterimage: 'copied', // Sleepwalker: what last round's space gives
};
const ALL_COLORS = /\beach (other )?colou?r\b|\bof each\b|\bcopy\b/i;
/** The condition a round-start member's pay hangs on, in a few plain words, or null when it always pays the same. */
export function incomeCondition(def) {
  if (!def) return null;
  if (INCOME_IF[def.key]) return INCOME_IF[def.key];
  const t = def.text || '';
  return /\bif\b|\bwhile\b|\bunless\b/i.test(t) ? 'not always' : /\bper\b/i.test(t) ? 'varies' : null;
}
/**
 * The seat's "each round" line, honest about conditions: { groups: [{ cond, parts: [[color, n]] }], followers,
 * sources: [{ name, text, cond, n }] }, or null with no income. Parts touched by a conditional member go in its group
 * (the first such member's words); the rest stand bare in the first group. sources feeds the hover's "why".
 */
export function incomeTerms(state, p) {
  const income = incomeOf(state, p.id);
  const parts = income ? Object.entries(income.res).filter(([, n]) => n > 0) : [];
  const followers = income && income.followers > 0 ? income.followers : 0;
  if (!parts.length && !followers) return null;
  const sources = [];
  const condOf = {}; // color -> condition words
  // (live panel r1: a seat's "+6" named no member) a member paying at "the start of round III" (Heir) counts too, and when
  // no round-start member explains the line, the members that answer what others do then (a steal, an extra turn) do
  const defs = [];
  for (const uid of p.members) { try { defs.push(cardDef(state, uid)); } catch { /* gone */ } }
  const atStart = d => /round start/i.test(timingOf(d)) || /\bstart of round\b/i.test(d.text || '');
  const reacts = d => timingOf(d) === 'Whenever' || /^once per round[,:] when(?:ever)?\b/i.test(d.text || '');
  const paying = defs.some(atStart) ? defs.filter(atStart) : defs.filter(reacts);
  for (const d of paying) {
    const cond = atStart(d) ? incomeCondition(d) : 'not always';
    const same = sources.find(x => x.name === d.name);
    if (same) same.n++;
    else sources.push({ name: d.name, text: (d.text || '').replace(/^Now and at round start[,:]\s*/i, '').replace(/^On Recruit: (.*?) Round Start: \1$/i, '$1').replace(/^(?:At round start|Round start)[,:]\s*/i, ''), cond, n: 1, hold: holdNote(state, p, d) });
    if (!cond) continue;
    const touches = d.quadrant === 'thieves' ? ['magenta'] : ALL_COLORS.test(d.text || '') ? state.resources : state.resources.filter(r => new RegExp(`\\b${r}\\b`, 'i').test(d.text || ''));
    for (const r of touches) if (!condOf[r]) condOf[r] = cond;
  }
  const groups = [{ cond: null, parts: [] }];
  for (const [r, n] of parts) {
    const cond = condOf[r] || null;
    let g = groups.find(x => x.cond === cond);
    if (!g) { g = { cond, parts: [] }; groups.push(g); }
    g.parts.push([r, n]);
  }
  return { groups: groups.filter(g => g.parts.length), followers, sources };
}
// "per 2 purple you have": how many they hold now, so a drop after a steal explains itself
function holdNote(state, p, d) {
  const m = (d.text || '').match(/\bper \d+ (\w+) you (?:have|hold)\b/i);
  if (!m || !state.resources.includes(m[1])) return null;
  return `${p.res[m[1]] || 0} ${m[1]} held now`;
}
