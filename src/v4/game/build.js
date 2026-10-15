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
    const text = (d.text || '').replace(/^Worth \d+ followers?\.\s*/i, '').trim() || `Worth ${d.f}.`;
    g.items.push({ uid, name: d.name, text, n: 1 });
  }
  return out.filter(g => g.items.length);
}
