// A saved hot-seat game for the turn-story gate (e2e/v4/turnstory.mjs): P1 (the only person) sits last in round I's
// first pass, so the snake turns round on P1 (two placements in a row), and P1 holds Midas (switched on) and enough of
// every color to buy. Bots have already placed before P1. The round-start snapshot is saved too, with the moves since
// it, so the table can retell the rivals' moves after the resume.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';
import { freeCard } from './deal.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const play = (s, move) => { const next = applyMove(s, move); next.history = [...(s.history || []), [move.player, move.option]]; return next; };

export function snakeSave(from = 1) {
  // P1 sits last in about a quarter of seeds; search widely so a deck change can't leave the gate with none
  for (let seed = from; seed < from + 2000; seed++) {
    let s = createGame({ seats: SEATS, seed });
    s.build = buildStamp();
    s.history = [];
    const rand = seededRandom(seed);
    for (let n = 0; n < 200 && !(s.round === 1); n++) s = play(s, chooseBotMove(s, rand));
    if (s.round !== 1 || s.order[SEATS.length - 1] !== 0) continue;
    // P1 holds Midas (on) and 6 of every color; set before any placement, so the round-start snapshot agrees
    s = structuredClone(s);
    const midas = freeCard(s, 'gold.midas'); // the cull leaves Midas out of the deck: minted if so
    s.shop = s.shop.filter(u => u !== midas);
    s.pile = s.pile.filter(u => u !== midas);
    while (s.shop.length < 10 && s.pile.length) s.shop.push(s.pile.shift());
    s.players[0].members.push(midas);
    s.cards[midas].on = true;
    s.cards[midas].recruitedRound = 0;
    for (const r of s.resources) s.players[0].res[r] = 6;
    const roundStart = s;
    for (let n = 0; n < 400 && !(s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = play(s, chooseBotMove(s, rand));
    if (!(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place')) continue;
    return {
      seed,
      save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() },
      roundStart: { seed: s.seed, round: 1, names: s.players.map(p => p.name).join('|'), state: roundStart },
    };
  }
  throw new Error('snake save: no seed puts P1 last in round I');
}
