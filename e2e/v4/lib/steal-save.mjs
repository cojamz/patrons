// Saved hot-seat games stopped on a board-picker choice for P1, the only person.
//  Steals and gifts (Gold, Magenta, Blue, Green): Help Yourself, Redistribute, Lie Low, Collect Debts (round II),
//  Kickback ("give 1 gold to…"); the rivals hold known piles so a test can say which stacks light up.
//  Copies and members (Green, Red, Blue, Magenta): Echo, Encore (round II), Snap Up, Shake Down (round II),
//  Hand-pick (round III).
// Used by the board-picker gate (e2e/v4/steal.mjs) and the before/after shots.
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

export const STEAL_TABLE = ['gold', 'thieves', 'blue', 'green'];
export const BOARD_TABLE = ['echo', 'red', 'market', 'thieves'];
// [table, quadrant id, action key] of each space
export const SPACES = {
  help: [STEAL_TABLE, 'thieves', 'pickpocket'], redistribute: [STEAL_TABLE, 'thieves', 'tipoff'], lielow: [STEAL_TABLE, 'thieves', 'hideout'],
  debts: [STEAL_TABLE, 'gold', 'steal'], kickback: [STEAL_TABLE, 'gold', 'jv'],
  echo: [BOARD_TABLE, 'echo', 'echo'], encore: [BOARD_TABLE, 'echo', 'encore'], snapup: [BOARD_TABLE, 'market', 'bargain'],
  shakedown: [BOARD_TABLE, 'thieves', 'ransom'], handpick: [BOARD_TABLE, 'red', 'take'],
};
// what everyone holds when P1 takes a steal space (P4 holds less than P1: Redistribute leaves P4 out)
export const PILES = [
  { gold: 1, magenta: 0, blue: 1, green: 1 },
  { gold: 3, magenta: 0, blue: 2, green: 4 },
  { gold: 5, magenta: 2, blue: 0, green: 1 },
  { gold: 0, magenta: 1, blue: 0, green: 0 },
];

export function stealSave(space = 'help') {
  const [table, qid, key] = SPACES[space];
  const q = table.indexOf(qid), i = quadrant(qid).actions.findIndex(a => a.key === key), round = quadrant(qid).actions[i].ring;
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let seed = 1; seed < 400; seed++) {
    let s = createGame({ seats, seed, quadrants: table });
    const rand = seededRandom(seed);
    const ready = st => st.round === round && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === `slot:${q}-${i}`);
    for (let n = 0; n < 1500 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s)) continue;
    if (table === STEAL_TABLE) PILES.forEach((r, k) => { s.players[k].res = { ...r }; });
    s = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
    if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'choose')) continue;
    // a board pick needs something on the board: at least two lit choices where the test can see them
    if (table === BOARD_TABLE && s.pending.options.filter(o => o.target).length < 2) continue;
    s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
    return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
  }
  throw new Error(`board-pick save: never reached P1 on ${space}`);
}
