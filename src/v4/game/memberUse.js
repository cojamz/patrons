// A player's members as a list a person reads (Cory, 2026-10-15: "cleanly show a list of member ability/passives, if
// they've been activated if it's one of those"), and what using one would do right now. Pure: read off the engine,
// the dry run is the engine's own move on a copy (applyMove), so "Use: +7 gold" can't drift from the rules.
import { applyMove, cardDef, defById, followers, quadrant } from '../../engine/v4/index.js';
import { contextFor } from '../../engine/v4/core.js';
import { timingOf } from './cards.js';

// the order a list reads in: what you can act on first, then what pays you, what reacts, the standing rules, the end
const KIND_ORDER = ['use', 'income', 'reacts', 'always', 'end', 'joined', 'worth'];
const kindOf = (def, t) => {
  if (def.activate) return 'use';
  if (/round start/i.test(t)) return 'income';
  if (t === 'Whenever') return 'reacts';
  if (t === 'Game end') return 'end';
  if (t === 'On recruit') return 'joined';
  if (/^Worth/.test(t)) return 'worth';
  return 'always';
};

const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const usedCache = new WeakMap();
/**
 * What using member uid would do for player pid right now, by playing the engine's own `use:` move on a copy:
 * null when it isn't offered now; else { option, label, words, blocked, idle, why, asks }. words: "+7 gold, −1 follower,
 * an extra turn" (empty when it gives nothing you can count). blocked: the engine refuses the use as things stand
 * (its use isn't spent: Pawnbroker with nothing to sell, Taskmaster short of purple), why is the engine's own line.
 */
export function useNow(state, pid, uid) {
  const id = `use:${uid}`;
  const pend = state && state.pending;
  if (!pend || pend.player !== pid || state.over || !pend.options.some(o => o.id === id)) return null;
  let memo = usedCache.get(state);
  if (!memo) { memo = new Map(); usedCache.set(state, memo); }
  const k = `${pid}:${uid}`;
  if (memo.has(k)) return memo.get(k);
  let out;
  try {
    const after = applyMove({ ...state, log: [...state.log] }, { player: pid, option: id });
    const p0 = state.players[pid], p1 = after.players[pid];
    const parts = [];
    for (const r of state.resources) {
      const d = (p1.res[r] || 0) - (p0.res[r] || 0);
      if (d) parts.push(`${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`);
    }
    const f = followers(after, p1) - followers(state, p0);
    if (f) parts.push(`${f > 0 ? '+' : '−'}${Math.abs(f)} follower${Math.abs(f) === 1 ? '' : 's'}`);
    const turns = (p1.left || 0) - (p0.left || 0);
    if (turns > 0) parts.push(turns === 1 ? 'an extra turn' : `${turns} extra turns`);
    const blocked = !after.cards[uid] || !after.cards[uid].used;
    const lines = after.log.slice(state.log.length);
    const asks = !!(after.pending && after.pending.player === pid && after.pending.kind === 'choose');
    const words = parts.join(', ');
    // worth nothing now (w2b #19: Safecracker invited a use that gave 0): the engine's flag when it gives one, else the
    // copy says so (nothing counted changed, nothing asked); such a use is never lit or invited, it reads "Use: +0"
    const opt = pend.options.find(o => o.id === id) || {};
    const idle = !blocked && (opt.idle === true || (typeof opt.value === 'number' && opt.value <= 0) || (opt.idle !== false && !asks && !words));
    // the engine's own line, without the owner's name: "no loose followers to sell (…)", "Safecracker found no magenta…"
    const name = cardDef(state, uid).name;
    const said = (lines[lines.length - 1] || '').replace(/\.$/, '').replace(new RegExp(`^${esc(p0.name)}(?:'s)?\\s+`), '').replace(new RegExp(`^${esc(name)}:\\s*`), '');
    const why = blocked ? said : idle ? (/\b(no|nothing|none|can’t|can't|cannot)\b/i.test(said) ? said : 'it would give you nothing right now') : '';
    out = { option: id, words, blocked, asks, idle, why, label: blocked ? 'Can’t use now' : idle ? 'Use: +0' : words ? `Use: ${words}` : 'Use now' };
  } catch {
    out = { option: id, words: '', blocked: false, asks: false, idle: false, why: '', label: 'Use now' };
  }
  memo.set(k, out);
  return out;
}

/** Does this card hold a use not spent yet (its own, or what a Doppelganger copies)? */
export function loadedUse(state, uid) {
  const c = state.cards[uid];
  if (!c || c.used) return false;
  try { return !!(defById(c.def).activate || (c.copy && defById(c.copy).activate)); } catch { return false; }
}

/** Has this card spent a once-a-round allowance (Squatter, Big Spender, Straggler) this round? */
const spentThisRound = (state, card) => !!card.spent && Object.values(card.spent).some(r => r === state.round);

/**
 * One row per member (identical cards in identical states share a row, ×n), in reading order:
 * [{ key, uids, uid, def, name, n, text, kind, tag: { text, tone: 'lit'|'quiet'|'dim', title } | null,
 *    use: useNow(...) | null, toggle: { on, option } | null, used }]
 * viewer: who's looking (their own members get "ready to use" and the Use button); optionFor: the live options.
 */
export function memberRows(state, pid, viewer = null, optionFor = () => null) {
  const p = state.players[pid];
  const rows = new Map();
  for (const uid of p.members) {
    const c = state.cards[uid];
    let d;
    try { d = cardDef(state, uid); } catch { continue; }
    const copy = c.copy ? defById(c.copy) : null;
    const eff = copy ? { ...d, activate: d.activate || copy.activate, toggle: d.toggle || copy.toggle } : d;
    const t = timingOf(copy || d);
    const kind = kindOf(eff, t);
    const mine = viewer === pid;
    const use = kind === 'use' && mine && !c.used ? useNow(state, pid, uid) : null;
    const toggleOpt = mine ? optionFor(`toggle:${uid}`) : null;
    const on = c.on !== false;
    let tag = null;
    if (kind === 'use') {
      const once = (eff.activate === 'round') ? 'this round' : '';
      if (c.used) tag = { text: once ? 'used this round' : 'used', tone: 'dim' };
      else if (use && use.idle) tag = { text: 'nothing to gain now', tone: 'quiet', title: use.why };
      else if (use && !use.blocked) tag = { text: 'ready to use', tone: 'lit' };
      else if (use && use.blocked) tag = { text: 'can’t use now', tone: 'quiet', title: use.why };
      else tag = { text: eff.activate === 'round' ? 'once a round' : 'not used yet', tone: 'quiet' };
    } else if (spentThisRound(state, c)) tag = { text: 'used this round', tone: 'dim' };
    else if (t === 'Once a round') tag = { text: 'once a round', tone: 'quiet' }; // Big Spender, Squatter: not spent yet
    else if (kind === 'income') tag = { text: 'pays at round start', tone: 'quiet' };
    else if (kind === 'end') tag = { text: 'scores at game end', tone: 'quiet' };
    // what the card became: "Copying Banker", Hustler's picked color
    let text = (d.text || '').trim();
    if (copy) text = `${text} Copying ${copy.name}: ${copy.text}`;
    if (c.color) { try { text = `${text} Picked: ${quadrant(c.color).name}.`; } catch { /* no such quadrant */ } }
    const key = [d.id, c.used ? 'u' : '', c.on === false ? 'off' : '', c.copy || '', c.color || '', spentThisRound(state, c) ? 's' : ''].join('|');
    const row = rows.get(key);
    if (row) { row.uids.push(uid); row.n++; if (!row.use && use) row.use = use; continue; }
    rows.set(key, {
      key, uids: [uid], uid, def: d, name: d.name, n: 1, text, kind, tag, use,
      toggle: eff.toggle ? { on, option: toggleOpt } : null,
      used: kind === 'use' ? !!c.used : spentThisRound(state, c),
      loaded: kind === 'use' && !c.used, // a use still in hand: a rival's is a threat to watch (w2b #21)
    });
  }
  return [...rows.values()].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/** The members pid can use now with an effect (not refused by the engine, not worth nothing): [{ uid, name, use }]. */
export function usableNow(state, pid) {
  const pend = state && state.pending;
  if (!pend || pend.player !== pid || state.over) return [];
  const out = [];
  for (const o of pend.options) {
    if (o.kind !== 'use') continue;
    const u = useNow(state, pid, o.uid);
    if (u && !u.blocked && !u.idle) out.push({ uid: o.uid, name: cardDef(state, o.uid).name, use: u });
  }
  return out;
}

const safeCache = new WeakMap();
/**
 * Can no rival steal resources from pid right now (Lie Low: "then no one can steal resources from you this round")?
 * Asked of the engine's own steal rule (ctx.canSteal), so any protection reads the same. Display only (w2b #21).
 */
export function safeThisRound(state, pid) {
  if (!(state.round >= 1) || state.over || state.players.length < 2) return false;
  let all = safeCache.get(state);
  if (!all) { all = {}; safeCache.set(state, all); }
  if (pid in all) return all[pid];
  let safe = false;
  try {
    const ctx = contextFor(state), victim = state.players[pid];
    safe = state.players.filter(o => o.id !== pid).every(o => !ctx.canSteal(o, victim, 'res'));
  } catch { safe = false; }
  all[pid] = safe;
  return safe;
}
