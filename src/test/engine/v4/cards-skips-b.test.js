// @vitest-environment node
// Gate: an action that skips a printed part says so in the log (Cory took Your Call in round I, couldn't sell, and the
// table said nothing). For every action of Blue, Magenta, White and Green:
//  A. in a barren position (only P2's opening Build Up on the board) the action asks, changes a number, or leaves a log
//     line after "took";
//  B. if the action asks its taker a question in a rich position but not in the barren one, the barren run
//     leaves a log line after "took" saying why the question was skipped.
import { describe, it, expect } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move } from './helpers.js';
import { table, useCosts } from './cards-helpers-b.js';

const Q = ['market', 'thieves', 'trading', 'echo'];
useCosts({ 'market.snob': [6, 4], 'market.stylist': [2, 2], 'thieves.kingpin': [2, 0], 'echo.evergreen': [2, 2], 'trading.tipster': [4, 2],
  'market.curator': [2, 2], 'thieves.crew': [2, 2], 'trading.shareholder': [4, 2] });
const ROW = ['market.snob', 'market.stylist', 'thieves.kingpin', 'echo.evergreen', 'trading.tipster', 'market.curator'];
const full = { blue: 6, magenta: 6, white: 6, green: 6 };
const numbers = s => JSON.stringify(s.players.map(p => [p.res, p.bonus, p.discount, p.members]));

/** P2 takes Build Up first (so copy spaces have something to copy), then P1 takes `name`. */
function run(name, rich) {
  let s = table(Q, {
    round: 3, left: 5, shop: ROW, queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }],
    res: rich ? [full, full] : [], bonus: rich ? [6, 8] : [], members: rich ? [['thieves.crew'], ['trading.shareholder']] : [],
  });
  s = take(s, 'echo.chant');
  if (s.pending?.kind === 'buy') s = move(s, 'pass');
  const before = numbers(s), len = s.log.length;
  s = take(s, name);
  const asked = s.pending?.kind === 'choose' && s.pending.player === 0;
  // the engine's own "couldn't afford anything" (a barren buy step) isn't the action speaking
  return { s, asked, changed: numbers(s) !== before, said: s.log.slice(len + 1).filter(l => !/couldn't afford anything/.test(l)) };
}

describe('every Blue, Magenta, White and Green action says when it skips a printed part', () => {
  for (const q of Q) for (const a of quadrant(q).actions) {
    if (a.key === 'chant') continue; // P2's opener (Build Up) in these positions; it has no conditional part
    it(`${a.name} (${quadrant(q).name})`, () => {
      const barren = run(a.name, false), rich = run(a.name, true);
      // asking a question is visible too (P2's Build Up leaves something to steal or copy)
      expect(barren.asked || barren.changed || barren.said.length > 0, `${a.name} did nothing and said nothing`).toBe(true);
      if (rich.asked && !barren.asked) expect(barren.said, `${a.name} skipped its question silently`).not.toEqual([]);
    });
  }
});
