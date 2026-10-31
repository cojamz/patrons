// Past games (session/archive.js): every tracked game is kept on this device, newest first, at most KEEP of them,
// and "Save game" writes notation that replays it.
import { readFileSync } from 'node:fs';
import { it, expect, beforeEach } from 'vitest';
import { pastGames, keepGame, gameFile, KEEP } from '../../v4/session/archive.js';
import { replayRecord, trackState } from '../../v4/session/record.js';
import { fromNotation } from '../../v4/session/notation.js';

const rec = JSON.parse(readFileSync('src/test/v4/records/sample-mixed-table.json', 'utf8'));
const final = replayRecord(rec).state;
beforeEach(() => localStorage.clear());

it('a finished game is kept the moment it ends, and its file replays the same moves', () => {
  trackState(final);
  const [g] = pastGames();
  expect(g.over).toBe(true);
  expect(g.names).toEqual(['Ana', 'Bot 2', 'Bot 3']);
  const f = gameFile(g.record, Date.UTC(2026, 9, 27, 20));
  expect(f.name).toMatch(/^cults-2026-10-2\d-ana-bot-2-bot-3\.txt$/);
  expect(fromNotation(f.text).moves).toEqual(rec.moves);
});

it('keeps the newest few, one entry per game', () => {
  for (let i = 0; i < KEEP + 2; i++) keepGame({ ...final, seed: i });
  keepGame({ ...final, seed: KEEP + 1, round: 2 });
  const list = pastGames();
  expect(list.length).toBe(KEEP);
  expect(list[0].record.seed).toBe(KEEP + 1);
  expect(list[0].round).toBe(2);
});
