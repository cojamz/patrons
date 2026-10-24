// The table's memory of this game's turns, one story per placement (the turn card and the "since your last turn"
// strip read it). It is fed every state the table shows, in order. Moves the table never showed (a batch, an online
// update that skipped steps, a reload) are replayed from the game's own move list, so every placement keeps its own
// start, buy and end states: amounts are never netted across two placements.
import { applyMove, cardDef } from '../../engine/v4/index.js';
import { turnStory, effectStory, currentTurn, scoringSnapshot as snapshotAtScoring } from '../format.js';

const MAX_STORIES = 80;
/** One turn = one placement: the round and how many turns have started in it (the engine's turn record). */
export const turnKey = s => (s && s.round >= 1 && !s.over && s.current != null ? `${s.round}:${(s.turns || []).length}` : null);

/** A fresh trail. me: the person at this device (named "you" in the stories), or null. */
export function createTrail(me = null) {
  return { me, stories: [], cur: null, last: null, seed: null, n: 0 };
}

function finish(trail, prev, s) {
  const c = trail.cur;
  trail.cur = null;
  if (!c) return;
  // the round's last turn: tell it as the table stood when the round was scored, not after the next round began
  const end = s.round !== c.round || s.over ? (snapshotAtScoring(prev, s) || prev) : s;
  if (c.partial) return;
  const story = tell(trail, c, end, s);
  if (!story) return;
  trail.n += 1;
  trail.stories.push({ ...story, key: c.key, round: c.round, n: trail.n, endMoves: s.moves, acc: c });
  if (trail.stories.length > MAX_STORIES) trail.stories.splice(0, trail.stories.length - MAX_STORIES);
  // only the latest few keep their states (an undo can reopen them)
  for (const st of trail.stories.slice(0, -3)) st.acc = null;
}

/**
 * A turn's story: from the engine's effect stream when every move of the turn carried one (one source of truth, each
 * cause summed once), else from the log and the states. `last`: the state that ended the turn (its move's effects
 * after the round was scored belong to the round, not the turn).
 */
function tell(trail, c, end, last = null) {
  let fx = c.fx;
  if (fx && last && last.round !== c.round) {
    const cut = fx.findIndex(e => e.cause && ['contest', 'round', 'final'].includes(e.cause.kind));
    fx = cut >= 0 ? fx.slice(0, cut) : fx.filter(e => !(e.cause && e.cause.kind === 'member' && e.cause.pid !== c.actor));
  }
  return told(trail, c, end, fx ? effectStory(c.start, end, c.actor, trail.me, fx) : turnStory(c.start, end, c.actor, trail.me, c.mid));
}

/**
 * What the story can't read off the log or the effects, added by the trail: why this turn came about (an extra turn
 * names the card that gave it: "Night Owl: extra turn"; Cory, "Log did not indicate a Night Owl turn"), and the members
 * used this turn (a member used before the placement leads the head, so what it did isn't read as the space's doing).
 */
function told(trail, c, end, story) {
  if (!story) return story;
  const who = c.actor === trail.me ? 'You' : end.players[c.actor].name;
  let { head, lines, short } = story;
  const said = new Set();
  // a use before the placement leads the head even when the member has a line of its own (what it did)
  const named = n => head.includes(` ${n}`) || lines.some(l => l === `used ${n}` || l.startsWith(`${n}:`));
  const first = (c.uses || []).filter(u => u.before && !head.includes(` ${u.name}`) && !said.has(u.name) && said.add(u.name)).map(u => u.name);
  if (first.length) {
    if (head === who) head = `${who} used ${first.join(', ')}`;
    else if (head.startsWith(`${who} used `)) head = `${who} used ${first.join(', ')}, ${head.slice(who.length + 6)}`;
    else head = `${who} used ${first.join(', ')}, then ${head.slice(who.length + 1)}`;
  }
  const later = (c.uses || []).filter(u => !u.before && !named(u.name) && !said.has(u.name) && said.add(u.name)).map(u => `used ${u.name}`);
  if (later.length) lines = [...lines, ...later];
  if (c.why) { lines = [c.why, ...lines]; short = short ? `${c.why} · ${short}` : c.why; }
  if (head === story.head && lines === story.lines) return story;
  return { ...story, head, lines, short, text: [head, ...lines].join(' · ') };
}

/** Why the turn that begins at `s` came about, said on its card when it isn't the round's order: "Night Owl: extra turn". */
function whyTurn(s) {
  const t = currentTurn(s);
  if (!t || t.pid !== s.current) return null;
  if (t.early) return `${t.early}: next turn, now`;
  if (t.kind === 'extra' && t.why) return `${t.why}: extra turn`;
  if (t.kind === 'hand' && t.why) return `${t.why}: extra minion`;
  return null;
}

/**
 * A member used by the move from `prev` to `s` (its "Use" beside the spaces or the buys), or null: { name, before (used
 * before the placement), cause (the member, as the engine names it in effects) }. Read off the move list when the state
 * keeps one; else a member of the mover's that turned used while no minion landed and nothing was bought.
 */
function usedBy(prev, s) {
  const pend = prev.pending;
  if (!pend || !['place', 'buy'].includes(pend.kind) || s.moves !== prev.moves + 1) return null;
  const pid = pend.player, p0 = prev.players[pid], p1 = s.players[pid];
  const h = Array.isArray(s.history) && s.history.length === s.moves ? s.history[s.moves - 1] : null;
  let uid = null;
  if (h) { if (h[0] === pid && /^use:\d+$/.test(String(h[1]))) uid = Number(String(h[1]).slice(4)); }
  else if (Object.keys(s.slots).length === Object.keys(prev.slots).length && p1.members.length === p0.members.length
    && (p1.turnBuys || 0) === (p0.turnBuys || 0) && s.pending && s.pending.player === pid) {
    uid = p0.members.find(u => s.cards[u] && s.cards[u].used && !(prev.cards[u] && prev.cards[u].used));
  }
  if (uid == null || !s.cards[uid]) return null;
  return { name: cardDef(s, uid).name, before: pend.kind === 'place', cause: { kind: 'member', pid, uid, def: s.cards[uid].def } };
}

function step(trail, s) {
  const prev = trail.last;
  trail.last = s;
  const k = turnKey(s);
  // the move's effects (effects.js) go to the turn it belongs to: the one running before it, or the one it ends
  const fx = prev && Array.isArray(s.effects) && s.moves === prev.moves + 1 ? s.effects : null;
  const c0 = trail.cur;
  if (c0 && prev && s !== c0.start) {
    const use = usedBy(prev, s);
    if (use) c0.uses = [...(c0.uses || []), use];
    // a member's choices (Tribute Band copying Collect Debts: which rival, coin by coin) are its doing, not the space's:
    // the engine names a follow-up choice's effects by the move alone, which told them as the placement's own result
    const by = c0.useBy;
    if (c0.fx) { if (fx) c0.fx.push(...(by ? fx.map(e => (e.cause && e.cause.kind === 'move' ? { ...e, cause: by } : e)) : fx)); else c0.fx = null; }
    const choosing = s.pending && s.pending.kind === 'choose';
    c0.useBy = use ? (choosing ? use.cause : null) : choosing ? by : null;
  }
  if (trail.cur && k !== trail.cur.key) finish(trail, prev, s);
  if (k && !trail.cur) trail.cur = { key: k, actor: s.current, round: s.round, start: s, mid: null, fx: [], why: whyTurn(s) };
  const c = trail.cur;
  if (c && !c.mid && s.pending && s.pending.kind === 'buy' && s.pending.player === c.actor) c.mid = s;
}

/** Back to the state `s` (an undo): forget what happened after it, reopening the turn it belongs to. */
function rewind(trail, s) {
  while (trail.stories.length && trail.stories[trail.stories.length - 1].endMoves > s.moves) {
    const st = trail.stories.pop();
    trail.cur = st.acc && st.acc.start.moves <= s.moves ? { ...st.acc } : null;
  }
  const c = trail.cur;
  if (c && c.start.moves > s.moves) trail.cur = null;
  else if (c && c.mid && c.mid.moves > s.moves) c.mid = null;
  if (trail.cur) trail.cur.fx = null; // an undo: the effects since can't be taken back one by one, so the log tells this turn
  trail.last = s;
  if (!trail.cur && turnKey(s)) trail.cur = { key: turnKey(s), actor: s.current, round: s.round, start: s, mid: null, partial: true };
}

/** The moves between two states of one game, replayed from the move list; null if the list can't bridge them. */
function bridge(from, to) {
  const h = to.history;
  if (!Array.isArray(h) || h.length !== to.moves || !(to.moves > from.moves) || to.moves - from.moves > 400) return null;
  const out = [];
  let s = from;
  try {
    for (let m = from.moves; m < to.moves - 1; m++) { s = applyMove(s, { player: h[m][0], option: h[m][1] }, { effects: true }); out.push(s); }
    const last = applyMove(s, { player: h[to.moves - 1][0], option: h[to.moves - 1][1] }, { effects: true });
    // the replay must land where the game is
    if (last.log.length !== to.log.length || last.log[last.log.length - 1] !== to.log[to.log.length - 1]) return null;
  } catch { return null; }
  return out;
}

/**
 * Feed the next state the table shows. `base` (optional, first call only): an earlier state of the same game (the
 * round's start) to replay from, so a reload still knows this round's turns. Returns the trail.
 */
export function feed(trail, next, base = null) {
  if (!next) return trail;
  const last = trail.last;
  if (!last || next.seed !== trail.seed) {
    Object.assign(trail, createTrail(trail.me), { seed: next.seed });
    const mid = base && base.seed === next.seed && base.moves < next.moves ? bridge(base, next) : null;
    if (mid) { step(trail, base); for (const s of mid) step(trail, s); step(trail, next); return trail; }
    trail.last = next;
    const k = turnKey(next);
    // a turn we join part way through can't be told whole (a placement at its very start can)
    const fresh = next.pending && next.pending.kind === 'place' && next.pending.player === next.current;
    // a turn joined at its very start (a resumed game) is told from the effects of its moves, as any other turn
    if (k) trail.cur = { key: k, actor: next.current, round: next.round, start: next, mid: null, partial: !fresh, why: whyTurn(next), ...(fresh ? { fx: [] } : {}) };
    return trail;
  }
  if (next === last) return trail;
  if (next.moves <= last.moves) { rewind(trail, next); return trail; }
  const mid = next.moves > last.moves + 1 ? bridge(last, next) : null;
  if (mid) for (const s of mid) step(trail, s);
  step(trail, next);
  return trail;
}

/** The live story of the turn being played (as far as it has gone), or null. */
export function liveStory(trail) {
  const c = trail.cur, s = trail.last;
  if (!c || !s || c.start === s || c.partial) return null;
  return tell(trail, c, s);
}

/**
 * The rivals' placements since your own last one, oldest first (the "since your last turn" strip). Your own turns
 * end the list; with no turn of yours yet, every placement so far counts.
 */
export function sinceYourTurn(trail, mine) {
  const out = [];
  for (let i = trail.stories.length - 1; i >= 0; i--) {
    const st = trail.stories[i];
    if (mine.includes(st.actor)) break;
    out.push(st);
  }
  return out.reverse();
}
