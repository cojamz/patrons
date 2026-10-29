// Saved hot-seat games at Peek (Blue): P1 has just taken Peek in round I and is ordering the top 4 (stage 'order'), or
// has ordered them and is recruiting (stage 'buy'). P1 holds `res` (every color named: a missing one pays nothing), and
// Peek's +2 blue on top, so some peeked cards are out of reach (Agents' green part; prices fell Oct 25 and the old hand
// reached all four; prices fell again by Oct 29 and blue 1 + red 1 reached all four, so blue 0).
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const wrap = s => { s.build = buildStamp(); return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }; };

export function peekSave({ stage = 'order', res = { blue: 0, red: 1, gold: 0, green: 0 }, seed = 3 } = {}) {
  let s = createGame({ seats: SEATS, seed, quadrants: ['market', 'gold', 'red', 'echo'] });
  const rand = seededRandom(seed);
  const ready = st => st.round >= 1 && st.pending && st.pending.player === 0 && st.pending.kind === 'place';
  for (let n = 0; n < 2000 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!ready(s)) throw new Error('peek-save: never reached P1’s place step');
  s.players[0].res = { ...res };
  resume(s);
  const opt = s.pending.options.find(o => o.kind === 'slot' && o.label === 'Peek');
  if (!opt) throw new Error('peek-save: Peek is not open to P1');
  s = applyMove(s, { player: 0, option: opt.id });
  for (let n = 0; n < 6 && s.pending && s.pending.kind !== 'choose'; n++) {
    const o = s.pending.options[0]; if (!o) break; s = applyMove(s, { player: s.pending.player, option: o.id });
  }
  if (stage === 'buy') for (let n = 0; n < 6 && s.pending && s.pending.kind === 'choose' && /^Peek: /.test(s.pending.prompt); n++) s = applyMove(s, { player: 0, option: s.pending.options[0].id });
  return wrap(s);
}
