// @vitest-environment node
// Log audit gate (Cory, 2026-10-22: "every game-state change and why"). Seeded mixed tables, mixed bots: after every
// move, any change to a player's resources, followers or members comes with a new log line naming that player.
// scripts/v4-log-audit.mjs is the long report.
import { describe, it, expect } from 'vitest';
import { auditLog } from './log-audit-runner.js';

describe('the log says every change to a player', () => {
  it('no silent change over seeded games', () => {
    const { crashes, gaps } = auditLog({ games: 6 });
    expect(crashes).toEqual([]);
    expect(Object.entries(gaps).map(([k, e]) => `${k}: ${e.ex}`)).toEqual([]);
  }, 240000);
});
