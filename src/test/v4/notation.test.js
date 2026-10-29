// @vitest-environment node
// Game notation (session/notation.js): readable text that replays the exact game.
import { readdirSync, readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { toNotation, fromNotation } from '../../v4/session/notation.js';
import { replayRecord, newGame, step, gameRecord } from '../../v4/session/record.js';
import { chooseBotMove } from '../../engine/v4/bots.js';
import { allQuadrantIds } from '../../engine/v4/content/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import { RECORDS_DIR } from './replay.js';

const records = readdirSync(RECORDS_DIR).filter(f => f.endsWith('.json'))
  .map(f => ({ f, rec: JSON.parse(readFileSync(new URL(f, RECORDS_DIR), 'utf8')) }))
  .filter(({ rec }) => replayRecord(rec).ok);

it('has a kept record to write out', () => { expect(records.length).toBeGreaterThan(0); });

for (const { f, rec } of records) {
  it(`${f}: the notation replays to the same moves and ending`, () => {
    const text = toNotation(rec);
    expect(text).toMatch(/^\[Game "Cults"\]/);
    expect(text).toMatch(/\nRound I\n1\. /);
    const back = fromNotation(text);
    expect(back.moves).toEqual(rec.moves);
    expect(back.quadrants).toEqual(rec.quadrants);
    // a record made on an earlier build with the same rules reads back as this build (its Version tag moves on with
    // every publish, which left this red after each release until the record was hand-edited)
    expect(toNotation(back)).toBe(toNotation({ ...rec, build: back.build }));
  });
}

it('a move that is not on offer names its line and the choices', () => {
  const text = toNotation(records[0].rec);
  const bad = text.replace(/\nRound I\n1\. (\S+(?: \d)?)  [^\n:·]+/, '\nRound I\n1. $1  Nowhere');
  expect(() => fromNotation(bad)).toThrow(/Line \d+ .*"Nowhere.*isn't one of/);
});

// a few bot games on random tables, so a new space or member whose choices read alike is caught
for (const g of [0, 4, 11]) {
  it(`bot game ${g}: the notation replays to the same moves`, () => {
    const rand = seededRandom(g + 1);
    const pool = [...allQuadrantIds()].sort(() => rand() - 0.5);
    const n = 2 + (g % 3);
    let st = newGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `Bot ${i + 1}`, kind: 'bot' })), seed: 1000 + g, quadrants: pool.slice(0, Math.max(4, n)) });
    for (let k = 0; !st.over && k < 3000; k++) st = step(st, chooseBotMove(st, rand));
    const rec = gameRecord(st);
    expect(fromNotation(toNotation(rec)).moves).toEqual(rec.moves);
  });
}
