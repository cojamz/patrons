// A saved hot-seat game, ready to resume, where P1 (the only person) is about to place their last minion of round
// `round` (bots elsewhere). Seed 21 reaches the end with end-game bonuses on the table (Mob, Tycoon) when the rest is
// played by bots. Used by the reckoning gate (the round-III summary at 700px).
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

export function lateSave(seed = 21, round = 3) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
  const rand = seededRandom(seed);
  const there = () => s.round === round && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left === 1;
  for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!there()) throw new Error(`late save: never reached P1's last placement of round ${round}`);
  return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}
