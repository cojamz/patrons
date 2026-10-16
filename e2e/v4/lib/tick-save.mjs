// A saved hot-seat game where P1 (the only person) is about to place in round I and some space would make a face-up
// card affordable: the shop should tick that card "✓ after <space>" while the space is under the pointer. The scene
// is found with the same engine dry run and unlock rule the screen uses (previewSpace, src/v4/game/cards.js).
import { createGame, applyMove, chooseBotMove, previewSpace } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';
import { unlockedBy, surely } from '../../../src/v4/game/cards.js';

/** { state, key: "q-i" of the space, uids: the cards it unlocks } or null. P1 holds `level` of every color. */
export function tickScene(seed = 4) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
  const rand = seededRandom(seed);
  for (let n = 0; n < 500 && !(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'place')) return null;
  const p = s.players[0];
  const slots = s.pending.options.filter(o => o.q != null && o.i != null);
  for (const level of [0, 1, 2, 3, 4]) {
    for (const r of s.resources) p.res[r] = level;
    for (const o of slots) {
      const pv = previewSpace({ ...s, log: [] }, 0, o.q, o.i);
      const uids = pv ? unlockedBy(s, p, surely(pv)) : [];
      if (uids.length) return { state: s, key: `${o.q}-${o.i}`, uids, seats };
    }
  }
  return null;
}

/** The scene as a local save ({ config, state, undo, savedAt }) plus the space and the cards it unlocks. */
export function tickSave(seed = 4) {
  for (let k = seed; k < seed + 20; k++) {
    const sc = tickScene(k);
    if (sc) return { save: { config: { seats: sc.seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: sc.state, undo: null, savedAt: Date.now() }, key: sc.key, uids: sc.uids };
  }
  throw new Error('tick save: no space unlocks a card in 20 seeds');
}
