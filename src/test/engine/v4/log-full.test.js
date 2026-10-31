// @vitest-environment node
// The log keeps its last 300 lines. Late in a game (round III) a new line can repeat the line before it
// ("P2's Cover: +1 green." twice), and reading "what's new" by the last line's text then saw nothing new: the log
// audit flagged silent changes (Big Spender's recruit, Melting Pot's +1 blue, Oct 31) and the engine's own
// "say every change" pass could say a change twice. What's new is counted (logN), not matched by text.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, logCount, logSince } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { newLogLines } from '../../../v4/format.js';

const plain = s => JSON.parse(JSON.stringify(s));

// a seeded game of Normal bots, stopped at the first move that says at least two lines
function midGame() {
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 4242 });
  s.players.forEach(p => { p.bot = 'normal'; });
  const rand = seededRandom(5);
  for (let k = 0; k < 400 && !s.over; k++) {
    const mv = chooseBotMove(s, rand);
    const t = applyMove(plain(s), mv);
    if (s.round >= 1 && logSince(t, logCount(s)).length >= 2) return { s, mv, lines: logSince(t, logCount(s)) };
    s = applyMove(s, mv);
  }
  throw new Error('no move said two lines');
}

describe('a full log still says every new line', () => {
  it('a new line that repeats the last one counts as new, and is said once', () => {
    const { s, mv, lines } = midGame();
    // the same table with a full log whose last line is the line this move says first
    const full = plain(s);
    full.log = [...Array.from({ length: 299 }, (_, i) => `filler ${i}.`), lines[0]];
    full.logN = 1000;
    const after = applyMove(plain(full), mv);
    expect(after.log.length).toBe(300);
    expect(logSince(after, logCount(full))).toEqual(lines);
    expect(after.log.slice(-lines.length)).toEqual(lines);
    expect(newLogLines(full, after)).toEqual(lines);
  });

  it('a save from before the count reads its log length as the count', () => {
    const { s, mv, lines } = midGame();
    const old = plain(s);
    delete old.logN;
    const after = applyMove(old, mv);
    expect(logSince(after, old.log.length)).toEqual(lines);
  });
});
