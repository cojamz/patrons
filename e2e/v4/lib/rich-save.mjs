// A saved hot-seat game, ready to resume, where P1 (the only person) is about to place a worker in round I holding
// 6 of every color: enough for the +6 follower buy right after. Used by the motion gate.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';

export function richSave(seed = 4) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  for (let n = 0; n < 500 && !(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'place')) throw new Error('rich save: never reached P1 placing');
  for (const r of s.resources) s.players[0].res[r] = 6;
  return { config: { seats: [...seats.map(x => ({ kind: x.kind, name: x.name }))], speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}
