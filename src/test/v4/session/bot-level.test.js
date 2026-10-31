// The setup screen's bot level reaches every bot seat of a new local game (and a resumed game keeps its own).
import { describe, it, expect } from 'vitest';
import { createLocalSession } from '../../../v4/session/local.js';
import { botLevel } from '../../../engine/v4/index.js';

const seats = [{ name: 'Me', kind: 'human' }, { name: 'B1', kind: 'bot' }, { name: 'B2', kind: 'bot' }];

describe('local session bot level', () => {
  it('puts the chosen level on bot seats only', () => {
    const s = createLocalSession({ seats, seed: 7, botDelayMs: 1e9, botLevel: 'hard' });
    const st = s.getState();
    expect(st.players.map((p, i) => (p.kind === 'bot' ? botLevel(st, i) : p.bot))).toEqual([undefined, 'hard', 'hard']);
    s.destroy && s.destroy();
  });
  it('defaults to Normal when no level is given', () => {
    const s = createLocalSession({ seats, seed: 7, botDelayMs: 1e9 });
    const st = s.getState();
    expect([1, 2].map(i => botLevel(st, i))).toEqual(['normal', 'normal']);
    s.destroy && s.destroy();
  });
});
