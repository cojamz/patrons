// The round card's "Other" column measures from the round's start; a reload mid-round must not move that baseline.
import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { loadRoundStart, saveRoundStart } from '../../../v4/game/GameScreen.jsx';

const seats = [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }];
const step = s => applyMove(s, chooseBotMove(s, () => 0.4));

describe('round-start baseline survives a reload', () => {
  beforeEach(() => localStorage.clear());
  it('a reload mid-round keeps the start of the round as the baseline', () => {
    let s = createGame({ seats, seed: 5 });
    while (s.round < 1) s = step(s);
    const start = s;
    saveRoundStart(start); // the table saw the round begin
    for (let k = 0; k < 6; k++) s = step(s); // play on, then "reload"
    expect(s.round).toBe(1);
    const restored = loadRoundStart(s);
    expect(restored && restored.moves).toBe(start.moves);
  });
  it("a different game's baseline is ignored", () => {
    let s = createGame({ seats, seed: 5 });
    while (s.round < 1) s = step(s);
    saveRoundStart(s);
    let other = createGame({ seats, seed: 6 });
    while (other.round < 1) other = step(other);
    expect(loadRoundStart(other)).toBe(null);
  });
});
