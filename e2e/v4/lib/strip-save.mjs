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
