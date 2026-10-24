// Saved hot-seat games stopped where one of P1's members asks something of P1 (blind testers, 2026-10-15: a member
// you can use must glow on your seat and carry its control). P1 is the only person, on an Echo table:
//  askSave('bigspender'): P1's second buy of the turn (Big Spender), also holding Translator (a switch, off).
//  askSave('straggler'):  after the last minion is placed, Straggler asks where P1's last minion goes.
// Used by the asks gate (e2e/v4/asks.mjs) and the before/after shots in design/eval/member-asks/.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

export const ASK_TABLE = ['echo', 'red', 'market', 'thieves'];
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const wrap = s => { s.build = buildStamp(); return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal', quadrants: ASK_TABLE }, state: s, undo: null, savedAt: Date.now() }; };

function give(s, pid, defId) {
  const c = Object.values(s.cards).find(x => x.def === defId && !s.players.some(p => p.members.includes(x.uid)));
  if (!c) return null;
  s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
  s.players[pid].members.push(c.uid); c.recruitedRound = 0; c.recruitedBy = pid;
  return c.uid;
}

export function askSave(name, from = 3) {
  for (let seed = from; seed < from + 200; seed++) {
    // the cull's off: Big Spender and Translator are out of today's deck (content/cull.js), but a table can deal them
    let s = createGame({ seats: SEATS, seed, quadrants: ASK_TABLE, rules: { cull: false } });
    const rand = seededRandom(seed);
    if (name === 'bigspender') {
      for (let n = 0; n < 2000 && !(s.pending && s.pending.player === 0 && s.pending.kind === 'buy' && !s.pending.extra) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
      if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'buy')) continue;
      s = structuredClone(s);
      const big = give(s, 0, 'benders.bigspender'), tr = give(s, 0, 'echo.translator');
      if (big == null || tr == null) continue;
      s.cards[tr].on = false;
      for (const r of s.resources) s.players[0].res[r] = 6;
      resume(s);
      // a real first buy (2 followers), paid the first way offered: then Big Spender's second buy waits
      const tier = s.pending.options.find(o => o.kind === 'tier');
      if (!tier) continue;
      s = applyMove(s, { player: 0, option: tier.id });
      for (let k = 0; k < 4 && s.pending && s.pending.player === 0 && s.pending.kind === 'pay'; k++) s = applyMove(s, { player: 0, option: s.pending.options.find(o => o.kind === 'pay').id });
      if (!(s.pending && s.pending.player === 0 && s.pending.kind === 'buy' && s.pending.extra)) continue;
      return { seed, uids: { big, tr }, save: wrap(s) };
    }
    if (name === 'straggler') {
      // P1 holds Straggler from the start; everyone plays until Straggler asks (round II: round I fills every space)
      const st = give(s, 0, 'benders.straggler');
      if (st == null) continue;
      const asking = x => x.pending && x.pending.player === 0 && x.pending.kind === 'choose' && /^Straggler:/.test(String(x.pending.prompt));
      for (let n = 0; n < 2000 && !asking(s) && !s.over && s.round <= 2; n++) s = applyMove(s, chooseBotMove(s, rand));
      if (!asking(s) || !s.pending.options.some(o => o.id === 'no')) continue;
      return { seed, uids: { st }, save: wrap(s) };
    }
    throw new Error(`asks-save: unknown moment ${name}`);
  }
  throw new Error(`asks-save: no seed reaches ${name}`);
}
