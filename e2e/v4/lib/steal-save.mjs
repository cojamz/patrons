// Saved hot-seat games stopped on a steal (or a pick-a-player) choice for P1, the only person: Help Yourself,
// Redistribute, Lie Low (Magenta) and Collect Debts (Gold, round II), Kickback (Gold: give 1 gold to a player).
// The table is Gold, Magenta, Blue, Green; the rivals hold known piles so a test can say which stacks light up.
// Used by the steal gate (e2e/v4/steal.mjs) and the before/after shots.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

export const STEAL_TABLE = ['gold', 'thieves', 'blue', 'green'];
// [quadrant index, action index, round] of each space on this table
export const SPACES = {
  help: [1, 0, 1], redistribute: [1, 1, 1], lielow: [1, 2, 1], debts: [0, 3, 2], kickback: [0, 0, 1],
};
// what everyone holds when P1 takes the space (P4 holds less than P1: Redistribute leaves P4 out)
export const PILES = [
  { gold: 1, magenta: 0, blue: 1, green: 1 },
  { gold: 3, magenta: 0, blue: 2, green: 4 },
  { gold: 5, magenta: 2, blue: 0, green: 1 },
  { gold: 0, magenta: 1, blue: 0, green: 0 },
];

export function stealSave(space = 'help') {
  const [q, i, round] = SPACES[space];
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let seed = 1; seed < 400; seed++) {
    let s = createGame({ seats, seed, quadrants: STEAL_TABLE });
    const rand = seededRandom(seed);
    const ready = st => st.round === round && st.pending && st.pending.player === 0 && st.pending.kind === 'place';
    for (let n = 0; n < 800 && !ready(s); n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s) || !s.pending.options.some(o => o.id === `slot:${q}-${i}`)) continue;
    PILES.forEach((r, k) => { s.players[k].res = { ...r }; });
    s = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
    if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'choose')) continue;
    s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
    return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
  }
  throw new Error(`steal save: never reached P1 on ${space}`);
}
