// A saved game for the strip's whole-lines check (e2e/v4/turnstory.mjs, t2b): a table whose rival moves tell long,
// two-line stories (steals and swaps that hit you), resumed in round II on P1's second placement, so the "since your
// last turn" strip is full and the turn card is pinned under it (design pod, 2026-10-15: the strip, stacked from its
// foot over a tall card, showed a sliver of its oldest line). Bots play every seat; the round-start snapshot goes with it.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const play = (s, move) => { const next = applyMove(s, move); next.history = [...(s.history || []), [move.player, move.option]]; return next; };

export function stripSave({ quadrants = ['silver', 'trading', 'thieves', 'red'], seed = 5, round = 2 } = {}) {
  let s = createGame({ seats: SEATS, seed, quadrants });
  s.build = buildStamp(); s.history = [];
  const rand = seededRandom(seed);
  let rs = s, r = s.round;
  const ready = st => st.round === round && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && Object.values(st.slots).filter(v => v === 0).length >= 1;
  for (let n = 0; n < 6000 && !ready(s) && !s.over; n++) { s = play(s, chooseBotMove(s, rand)); if (s.round !== r) { r = s.round; rs = s; } }
  if (!ready(s)) throw new Error(`stripSave: seed ${seed} never reached P1's placement in round ${round}`);
  return {
    save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', quadrants }, state: s, undo: null, savedAt: Date.now() },
    roundStart: { seed: s.seed, round: s.round, names: s.players.map(p => p.name).join('|'), state: rs },
  };
}

/**
 * A table where P1 gains on rivals' turns (wave-2 testers A#3, B#46: "my silver went 3→9 between turns with no cause
 * shown"): P1 holds Silversmith and Guest on a Silver table, where rivals' "everyone else +1" spaces pay P1 too. Stopped
 * on P1's placement in round II, after a rival turn since P1's last one that gave P1 something. Bots play every seat;
 * the round-start snapshot and the move list go with it (the strip is told again from them on resume). at: 'rivals'
 * stops instead just after P1's last move before that, so those rival turns play live when the game resumes. newest:
 * the gift must come on the newest rival turn, the strip's bottom line.
 */
export function giftSave({ quadrants = ['silver', 'trading', 'thieves', 'red'], members = ['silver.silversmith', 'silver.guest'], round = 2, at = 'mine', newest = false } = {}) {
  for (let seed = 1; seed < 200; seed++) {
    let s = createGame({ seats: SEATS, seed, quadrants });
    s.build = buildStamp(); s.history = [];
    const rand = seededRandom(seed);
    for (let n = 0; n < 400 && s.round < 1 && !s.over; n++) s = play(s, chooseBotMove(s, rand));
    if (s.round < 1) continue;
    // P1's members, handed over before round I's first placement (the replay starts at round II, after this)
    let ok = true;
    for (const d of members) {
      const c = Object.values(s.cards).find(x => x.def === d && !s.players.some(p => p.members.includes(x.uid)));
      if (!c) { ok = false; break; }
      s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
      s.players[0].members.push(c.uid); c.recruitedRound = 0; c.recruitedBy = 0;
    }
    if (!ok) continue;
    // the rivals' turns after one of P1's moves, as the table plays them on resume (local.js seeds its bots from the
    // saved state's rng): the first such run that gives P1 something before P1 places again
    const branch = h => {
      const r = seededRandom(((h.rng ^ h.seed) ^ 0x9e3779b9) >>> 0);
      // gifted: the turns (round:count) that gave P1 something; last: the turn the newest move belonged to
      let b = h, last = null;
      const gifted = new Map();
      for (let n = 0; n < 400 && !(b.pending && b.pending.player === 0) && !b.over; n++) {
        const move = chooseBotMove(b, r);
        const next = applyMove(b, move, { effects: true });
        next.history = [...b.history, [move.player, move.option]];
        last = `${b.round}:${(b.turns || []).length}`;
        const got = next.round === h.round ? (next.effects || []).filter(e => (e.type === 'gain' || e.type === 'transfer') && e.to && e.to.pid === 0 && e.cause && !['contest', 'round', 'final'].includes(e.cause.kind)) : [];
        if (got.length) {
          if (!gifted.has(last)) gifted.set(last, { res: {}, members: [] });
          const g = gifted.get(last);
          for (const e of got) {
            g.res[e.what.r] = (g.res[e.what.r] || 0) + e.what.n;
            if (e.cause.kind === 'member' && e.cause.def && !g.members.includes(e.cause.def)) g.members.push(e.cause.def);
          }
        }
        b = next;
      }
      // newest: the gift came on the newest rival turn (the strip's bottom line, never folded away)
      const ok = newest ? gifted.has(last) : gifted.size > 0;
      if (ok && b !== h) b.giftNewest = gifted.get(last) || null; // (taken off again before the save is made)
      return ok && b.round === h.round && b.pending && b.pending.player === 0 && b.pending.kind === 'place' ? b : null;
    };
    let rs = null;
    for (let n = 0; n < 6000 && !s.over && s.round <= round; n++) {
      const actor = s.current, move = chooseBotMove(s, rand);
      const next = applyMove(s, move, { effects: true });
      next.history = [...s.history, [move.player, move.option]];
      if (next.round === round && !rs) rs = next;
      s = next;
      if (actor !== 0 || s.round !== round || !s.pending || s.pending.player === 0 || !Object.values(s.slots).includes(0)) continue;
      const b = branch(s);
      if (!b) continue;
      const newestGift = b.giftNewest;
      delete b.giftNewest;
      // at: 'rivals' stops just after P1's move, so the rivals' turns (and what they give P1) play live on resume
      const st = at === 'rivals' ? s : b;
      return {
        save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', quadrants }, state: st, undo: null, savedAt: Date.now() },
        roundStart: { seed: st.seed, round: st.round, names: st.players.map(p => p.name).join('|'), state: rs },
        // newest: what P1 got on the newest rival turn ({ res: { color: n }, members: [def ids that paid it] })
        seed, mine: b, newest: newestGift,
      };
    }
  }
  throw new Error('giftSave: no seed gave P1 something on a rival turn in round II');
}
