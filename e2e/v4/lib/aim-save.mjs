// A saved hot-seat game where P1 (the only person) is about to place in round I with Open Door ("Recruit the cheapest
// face-up member, free.") open, and the face-up row has two members tied for cheapest: hovering Open Door should light
// exactly those two (Cory, 2026-10-16: "hovering over Free Recruit should highlight the cheapest recruit(s)").
// The expected set is the row's own lowest printed cost, read off the card defs, independent of the screen's path.
import { createGame, applyMove, chooseBotMove, quadrant, defById } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const cost = (s, u) => { const d = defById(s.cards[u].def); return (d.s || 0) + (d.w || 0); };

/** { save, key: "q-i" of Open Door, cheapest: [uid] } */
export function aimSave(seed = 4) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let k = seed; k < seed + 20; k++) {
    let s = createGame({ seats, seed: k });
    s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
    const rand = seededRandom(k);
    for (let n = 0; n < 500 && !(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'place')) continue;
    const q = s.quadrants.indexOf('red');
    if (q < 0) continue;
    const i = quadrant('red').actions.findIndex(a => a.key === 'hire');
    const key = `${q}-${i}`;
    if (s.slots[key] !== undefined || !s.pending.options.some(o => o.q === q && o.i === i)) continue;
    // two tied for cheapest: a pile card at the row's lowest cost takes the priciest face-up card's place
    const low = Math.min(...s.shop.map(u => cost(s, u)));
    const twin = s.pile.find(u => cost(s, u) === low);
    if (twin === undefined) continue;
    const top = s.shop.reduce((a, u) => (cost(s, u) > cost(s, a) ? u : a));
    s.shop = s.shop.map(u => (u === top ? twin : u));
    s.pile = s.pile.filter(u => u !== twin).concat([top]);
    // exactly two (a clearer picture): any further ties give way to pile cards that cost more
    for (const u of s.shop.filter(x => cost(s, x) === low).slice(2)) {
      const up = s.pile.find(x => cost(s, x) > low);
      if (up === undefined) break;
      s.shop = s.shop.map(x => (x === u ? up : x));
      s.pile = s.pile.filter(x => x !== up).concat([u]);
    }
    const cheapest = s.shop.filter(u => cost(s, u) === low);
    if (cheapest.length !== 2) continue;
    return { save: { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }, key, cheapest };
  }
  throw new Error('aim save: no table with Open Door open for P1 in 20 seeds');
}
