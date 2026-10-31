// A saved hot-seat game where P1 (the only person) is about to place in round III with Recruit a Member ("Recruit a
// member in the shop costing 8 or less.") open, and the face-up row holds exactly two members at 8 or less, the rest
// pricier: hovering it should light exactly those two (Cory, 2026-10-16: a space's hover lights what it acts on).
// It replaced Open Door (cut in the round I rework, Oct 27). The expected set is read off the card defs (cost = the
// colored part plus the any part, the +1 wild included), independent of the screen's path.
import { createGame, applyMove, chooseBotMove, quadrant, defById } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const cost = (s, u) => { const d = defById(s.cards[u].def); return (d.s || 0) + (d.w || 0); };
export const CAP = 8;

/** { save, key: "q-i" of Recruit a Member, lit: [uid] } */
export function aimSave(seed = 4) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let k = seed; k < seed + 40; k++) {
    let s = createGame({ seats, seed: k });
    s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
    const rand = seededRandom(k);
    for (let n = 0; n < 3000 && !s.over && !(s.round === 3 && s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
    if (s.over || !(s.round === 3 && s.pending && s.pending.player === 0 && s.pending.kind === 'place')) continue;
    const q = s.quadrants.indexOf('red');
    if (q < 0) continue;
    const i = quadrant('red').actions.findIndex(a => a.key === 'take');
    const key = `${q}-${i}`;
    if (s.slots[key] !== undefined || !s.pending.options.some(o => o.q === q && o.i === i)) continue;
    // exactly two face-up members at the cap or under, every other one over it (pile cards trade places)
    const cheap = s.pile.filter(u => cost(s, u) <= CAP), dear = s.pile.filter(u => cost(s, u) > CAP);
    const row = [...s.shop.filter(u => cost(s, u) <= CAP), ...cheap].slice(0, 2);
    if (row.length < 2) continue;
    const over = [...s.shop.filter(u => cost(s, u) > CAP), ...dear].slice(0, s.shop.length - 2);
    if (over.length < s.shop.length - 2) continue;
    const shop = [...over.slice(0, 1), ...row, ...over.slice(1)];
    s.pile = s.pile.filter(u => !shop.includes(u)).concat(s.shop.filter(u => !shop.includes(u)));
    s.shop = shop;
    return { save: { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }, key, lit: row };
  }
  throw new Error('aim save: no table with Recruit a Member open for P1 in round III in 40 seeds');
}
