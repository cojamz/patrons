// The end-game scoring, beat by beat (Cory, 2026-10-15; taste rule 11: "scoring shows its sources"). Read straight off
// the engine's own count, so the pops always add up to followers(state, p):
//   followers(p) = 1 (the leader) + p.bonus (loose followers: bought, prizes, won or lost in play, end-game bonuses)
//                + each member's follower value (a Doppelganger counts as the better of itself and what it copies)
//   beat 1 "followers": the leader and every loose follower except the end-game bonuses, over the leader's head
//   beat 2 "members":   each member's own people (its follower value), over its head
//   beat 3 "grants":    the followers a member grants at game end (Mob, Tycoon, Recluse…: p.final.cards), over its head
import { cardDef, defById, followers } from '../../engine/v4/index.js';

/** A member card's follower value, as the engine counts it (core.js valueOf). */
export function memberValue(state, uid) {
  const c = state.cards[uid];
  const own = cardDef(state, uid).f ?? 1;
  return c.copy ? Math.max(own, defById(c.copy).f ?? 1) : own;
}

/** The end-game bonuses with the member that scored each. An old save without final.cards matches each part's name. */
export function finalGrants(state, p) {
  const fin = p.final;
  if (!fin) return [];
  if (Array.isArray(fin.cards)) return fin.cards.map(x => ({ uid: x.uid, name: x.name, n: x.n }));
  const used = new Set();
  return (fin.parts || []).map(t => {
    const m = String(t).match(/^(.*) ([+−-])(\d+)$/);
    if (!m) return null;
    const n = (m[2] === '+' ? 1 : -1) * Number(m[3]);
    const uid = p.members.find(u => !used.has(u) && (cardDef(state, u).name === m[1] || (state.cards[u].copy && defById(state.cards[u].copy).name === m[1])));
    if (uid != null) used.add(uid);
    return { uid: uid ?? null, name: m[1], n };
  }).filter(Boolean);
}

/**
 * One player's scoring steps, in order: [{ beat: 'followers'|'members'|'grants', uid|null, n, name }]. A member worth
 * nothing still gets no pop; every step's n sums to followers(state, p).
 */
export function scoreSteps(state, p) {
  const grants = finalGrants(state, p);
  const granted = grants.reduce((s, g) => s + g.n, 0);
  const loose = 1 + p.bonus - granted;
  const steps = [{ beat: 'followers', uid: null, n: Math.max(0, loose), name: 'followers' }];
  for (const uid of p.members) {
    const n = memberValue(state, uid);
    if (n) steps.push({ beat: 'members', uid, n, name: cardDef(state, uid).name });
  }
  for (const g of grants) if (g.n) steps.push({ beat: 'grants', uid: g.uid, n: g.n, name: g.name });
  // Signed losses may consume printed followers. Count their sources first, then subtract the
  // loss, bounded by the engine's zero minimum, so no scoring beat shows a negative player total.
  if (loose < 0) {
    const counted = steps.reduce((n, s) => n + s.n, 0);
    const loss = followers(state, p) - counted;
    if (loss) steps.push({ beat: 'losses', uid: null, n: loss, name: 'followers lost' });
  }
  return steps;
}

export const BEATS = ['followers', 'members', 'grants', 'losses'];
