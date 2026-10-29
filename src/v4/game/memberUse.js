// A player's members as a list a person reads (Cory, 2026-10-15: "cleanly show a list of member ability/passives, if
// they've been activated if it's one of those"), and what using one would do right now. Pure: read off the engine,
// the dry run is the engine's own move on a copy (applyMove), so "Use: +7 gold" can't drift from the rules.
import { applyMove, cardDef, defById, followers, quadrant, TIERS, tierLeft } from '../../engine/v4/index.js';
import { contextFor } from '../../engine/v4/core.js';
import { timingOf } from './cards.js';
import { memberTimingWords } from './memberTiming.js';

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
const byMoment = new Map(); // "seed|moves|step|pid|uid" -> the same dry run, for another copy of the same moment
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
  // the same game moment drawn from another copy of the state (the seats and the hover card hold different objects):
  // the dry run is shared, so a seat card opens without redoing it (w4b #2: open within 150ms)
  const p0 = state.players[pid];
  const gk = `${state.seed}|${state.moves}|${state.log.length}|${pend.kind}|${pid}|${uid}|${p0.members.join(',')}|${JSON.stringify(p0.res)}|${p0.bonus}|${p0.left}`;
  if (byMoment.has(gk)) { const hit = byMoment.get(gk); memo.set(k, hit); return hit; }
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
    // a change the words don't count still counts (Restocker's new shop, a rival's loss, a discount: Cory, Oct 28, "says
    // it will do nothing"), read the way the engine's own idle check reads it
    const look = x => JSON.stringify([x.players.map(o => [o.res, o.bonus, o.discount || 0, o.members, o.left]), x.shop, x.pile.length]);
    const idle = !blocked && (opt.idle === true || (typeof opt.value === 'number' && opt.value <= 0) || (opt.idle !== false && !asks && !words && look(after) === look(state)));
    // the engine's own line, without the owner's name: "no loose followers to sell (…)", "Safecracker found no magenta…"
    const name = cardDef(state, uid).name;
    const said = (lines[lines.length - 1] || '').replace(/\.$/, '').replace(new RegExp(`^${esc(p0.name)}(?:'s)?\\s+`), '').replace(new RegExp(`^${esc(name)}:\\s*`), '');
    const why = blocked ? said : idle ? (/\b(no|nothing|none|can’t|can't|cannot)\b/i.test(said) ? said : 'it would give you nothing right now') : '';
    // a use that goes on into a choice says so, and counts what the choice can add at best (w4 skeptic #5: Tribute
    // Band read "Use: +7●" and then opened a steal worth +4 more)
    let then = '', more = '', asker = '';
    if (asks) {
      const ask = String(after.pending.prompt || '');
      asker = (ask.match(/^([^:]{2,28}):\s/) || [])[1] || '';
      then = /\b(take|steal|from (a |each )?rivals?)\b/i.test(ask) ? 'a steal' : 'a choice';
      // the best it can come to, following the choice (and the choices it leads to) on copies, within a small budget
      let best = null, bestN = 0, nodes = 0;
      const walk = (st, depth) => {
        if (++nodes > 40) return;
        if (depth < 6 && st.pending && st.pending.player === pid && st.pending.kind === 'choose') {
          for (const o of st.pending.options.slice(0, 6)) {
            let next;
            try { next = applyMove(st, { player: pid, option: o.id }); } catch { continue; }
            walk(next, depth + 1);
          }
          return;
        }
        const q = st.players[pid];
        const gain = {};
        let n = 0;
        for (const r of state.resources) { const d = (q.res[r] || 0) - (p1.res[r] || 0); if (d > 0) { gain[r] = d; n += d; } }
        if (n > bestN) { bestN = n; best = gain; }
      };
      walk(after, 0);
      if (best) more = Object.entries(best).map(([r, d]) => `+${d} ${r}`).join(', ');
    }
    // "Use: +6 gold, +1 white, then a steal (up to +4 white more)", or with nothing before it "Use: a steal, up to +3 gold"
    const tail = then ? (words ? `then ${then}${more ? ` (up to ${more} more)` : ''}` : `${then}${more ? `, up to ${more}` : ''}`) : '';
    const label = blocked ? 'Can’t use now' : idle ? 'Use: +0' : words ? `Use: ${words}${tail ? `, ${tail}` : ''}` : tail ? `Use: ${tail}` : 'Use now';
    out = { option: id, words: tail ? (words ? `${words}, ${tail}` : tail) : words, blocked, asks, idle, why, label, then, asker };
  } catch {
    out = { option: id, words: '', blocked: false, asks: false, idle: false, why: '', label: 'Use now' };
  }
  memo.set(k, out);
  byMoment.set(gk, out);
  if (byMoment.size > 64) byMoment.delete(byMoment.keys().next().value);
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
 *    use: useNow(...) | null, ask: memberAsks(...) entry | null, toggle: { on, option } | null, used }]
 * viewer: who's looking (their own members get "ready to use" and the Use button); optionFor: the live options.
 */
export function memberRows(state, pid, viewer = null, optionFor = () => null) {
  const p = state.players[pid];
  const rows = new Map();
  const asks = viewer === pid ? memberAsks(state, pid) : new Map();
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
    const ask = asks.get(uid) || null;
    if (ask) tag = { text: ask.kind === 'again' ? 'recruiting again now' : 'asking now', tone: 'lit', title: ask.say };
    else if (kind === 'use') {
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
    // what the card became: once a Doppelganger has copied, its own "When recruited: becomes a copy…" is spent and only
    // the copy reads (Cory, 2026-10-15: "once doppelganger has copied, it doesnt need the extra text anymore")
    let text = memberTimingWords((d.text || '').trim());
    if (copy) text = `Copy of ${copy.name}: ${memberTimingWords((copy.text || '').trim())}`;
    let picked = '';
    if (c.color) { try { picked = `Picked: ${quadrant(c.color).name}.`; text = `${text} ${picked}`; } catch { /* no such quadrant */ } }
    // a rule that grows by round shows as I / II / III lines in the hover (Cory, 2026-10-18); text stays the whole rule
    const rule = copy || d;
    const byRound = rule.byRound ? { def: rule, before: copy ? `Copy of ${copy.name}:` : '', after: picked } : null;
    const key = [d.id, c.used ? 'u' : '', c.on === false ? 'off' : '', c.copy || '', c.color || '', spentThisRound(state, c) ? 's' : '', ask ? 'ask' : ''].join('|');
    const row = rows.get(key);
    if (row) { row.uids.push(uid); row.n++; if (!row.use && use) row.use = use; continue; }
    rows.set(key, {
      key, uids: [uid], uid, def: d, name: d.name, n: 1, text, byRound, kind, tag, use, ask,
      toggle: eff.toggle ? { on, option: toggleOpt } : null,
      used: kind === 'use' ? !!c.used : spentThisRound(state, c),
      loaded: kind === 'use' && !c.used, // a use still in hand: a rival's is a threat to watch (w2b #21)
    });
  }
  return [...rows.values()].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    || ((a.def.s || 0) + (a.def.w || 0)) - ((b.def.s || 0) + (b.def.w || 0)));
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

const askCache = new WeakMap();
/**
 * Your members that are asking you something right now, besides a Use (blind testers, 2026-10-15: Straggler's question
 * and Big Spender's second buy showed only in the header): Map uid -> { uid, name, kind, say, skip }.
 *  kind 'again': the second buy of the turn, from the member that gives it (Big Spender, or a Doppelganger copying it);
 *    skip is the pass, which keeps it for a later turn this round.
 *  kind 'ask': a choice whose prompt is titled with one of your members' names ("Straggler: move your last minion…");
 *    skip is the choice's own "no" (Straggler's "Stay put"), when it has one.
 * say: what to do now, in a few plain words. Read off the engine's pending step only, so it never drifts from the rules.
 */
export function memberAsks(state, pid) {
  const out = new Map();
  const pend = state && state.pending;
  if (!pend || pend.player !== pid || state.over || !state.players[pid]) return out;
  const memo = askCache.get(state);
  if (memo && memo.pid === pid) return memo.out;
  const p = state.players[pid];
  const defsOf = c => [c.def, c.copy].filter(Boolean).map(id => { try { return defById(id); } catch { return null; } }).filter(Boolean);
  if (pend.kind === 'buy' && pend.extra) {
    const uid = p.members.find(u => { const c = state.cards[u]; return c && !(c.spent && c.spent.extraBuy === state.round) && defsOf(c).some(d => d.extraBuy); });
    if (uid != null) {
      const name = cardDef(state, uid).name;
      const pass = pend.options.find(o => o.kind === 'pass') || null;
      out.set(uid, { uid, name, kind: 'again', say: 'Recruiting again now: a member or followers.', skip: pass ? { option: pass.id, label: 'Skip, keep it for later', title: `Skip the second recruit: ${name} keeps it for a later turn this round.` } : null });
    }
  } else if (pend.kind === 'choose') {
    const title = (String(pend.prompt || '').match(/^([^:]{2,28}):\s*(.*)$/) || []);
    const uid = title[1] ? p.members.find(u => { const c = state.cards[u]; try { return c && !c.used && cardDef(state, u).name === title[1]; } catch { return false; } }) : undefined;
    if (uid != null) {
      const no = pend.options.find(o => o.kind === 'no' || o.kind === 'pass') || null;
      const onBoard = pend.options.some(o => o.kind === 'slot');
      const ask = (title[2] || '').replace(/\?$/, '');
      const say = onBoard ? 'Pick a lit space on the wheel.' : ask.length && ask.length <= 60 ? `${ask[0].toUpperCase()}${ask.slice(1)}.` : 'Choose above.';
      out.set(uid, { uid, name: title[1], kind: 'ask', say, skip: no ? { option: no.id, label: no.label || 'Skip', title: `${title[1]}: ${no.label || 'skip'}.` } : null });
    }
  }
  askCache.set(state, { pid, out });
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

/**
 * The most followers a player could buy right now with what they hold, from the follower buys still open to them
 * (w3b: see a round-III burst coming): { held, get }. Any resources pay; the limited buy counts only what's left.
 */
export function spendingPower(state, p) {
  const held = state.resources.reduce((t, r) => t + (p.res[r] || 0), 0);
  // best followers for each budget 0..held (a small knapsack over the open buys; the limited one by its stock)
  const tiers = TIERS.map(t => ({ cost: t.cost, get: t.get, left: Math.min(tierLeft(state, t), Math.floor(held / t.cost)) }));
  let best = new Array(held + 1).fill(0);
  for (const t of tiers) {
    if (t.left === Infinity) { for (let b = t.cost; b <= held; b++) best[b] = Math.max(best[b], best[b - t.cost] + t.get); continue; }
    for (let k = 0; k < t.left; k++) { const nx = best.slice(); for (let b = t.cost; b <= held; b++) nx[b] = Math.max(nx[b], best[b - t.cost] + t.get); best = nx; }
  }
  return { held, get: best[held] || 0 };
}

