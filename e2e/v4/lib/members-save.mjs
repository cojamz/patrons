// A saved hot-seat game for the members gate (e2e/v4/members.mjs): P1 (the only person) is about to place in round I
// on a table of Gold, Echo, Trading and Purple, holding a full spread of members: use-once ones ready (Lottery Winner,
// Heiress, Go-Getter), one already used (Speculator), switches (Midas on, Translator off), round-start income (Banker),
// reactions (Prospector, Impressionist), a game-end scorer (Tycoon) and a once-a-round allowance (Pawnbroker). P2 holds
// gold, so Lottery Winner has something to win. The round-start snapshot is saved too.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
export const QUADS = ['gold', 'echo', 'trading', 'purple'];
export const HAND = ['gold.jackpot', 'gold.speculator', 'gold.midas', 'gold.banker', 'gold.prospector', 'gold.tycoon',
  'echo.translator', 'echo.tuningfork', 'trading.heiress', 'trading.pawnbroker', 'purple.secondwind'];
export const RIVAL = ['gold.thrift', 'echo.hourglass'];
const play = (s, move) => { const next = applyMove(s, move); next.history = [...(s.history || []), [move.player, move.option]]; return next; };

export function membersSave(from = 1) {
  for (let seed = from; seed < from + 200; seed++) {
    let s = createGame({ seats: SEATS, seed, quadrants: QUADS });
    s.build = buildStamp();
    s.history = [];
    const rand = seededRandom(seed);
    for (let n = 0; n < 200 && !(s.round === 1); n++) s = play(s, chooseBotMove(s, rand));
    if (s.round !== 1) continue;
    const uidOf = id => Object.keys(s.cards).map(Number).find(u => s.cards[u].def === id && !s.players.some(p => p.members.includes(u)));
    s = structuredClone(s);
    const give = (pid, id) => {
      const u = uidOf(id);
      if (u == null) return false;
      s.shop = s.shop.filter(x => x !== u);
      s.pile = s.pile.filter(x => x !== u);
      s.players[pid].members.push(u);
      s.cards[u].recruitedRound = 0;
      return u;
    };
    const uids = HAND.map(id => give(0, id));
    const theirs = RIVAL.map(id => give(1, id));
    if (uids.includes(false) || theirs.includes(false)) continue;
    while (s.shop.length < 10 && s.pile.length) s.shop.push(s.pile.shift());
    s.cards[uids[HAND.indexOf('gold.midas')]].on = true;
    s.cards[uids[HAND.indexOf('echo.translator')]].on = false;
    s.cards[uids[HAND.indexOf('gold.speculator')]].used = true;
    for (const r of s.resources) s.players[0].res[r] = 3;
    s.players[1].res.gold = 7;
    resume(s); // the step waiting now sees the new hands (its use options)
    const roundStart = s;
    for (let n = 0; n < 400 && !(s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = play(s, chooseBotMove(s, rand));
    if (!(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place')) continue;
    if (!(s.players[1].res.gold >= 2)) continue;
    return {
      seed, uids: Object.fromEntries(HAND.map((id, k) => [id, uids[k]])),
      save: { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', quadrants: QUADS }, state: s, undo: null, savedAt: Date.now() },
      roundStart: { seed: s.seed, round: 1, names: s.players.map(p => p.name).join('|'), state: roundStart },
    };
  }
  throw new Error('members save: no seed gives P1 a place step in round I');
}
