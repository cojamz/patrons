import { describe, it, expect } from 'vitest';
import { createLocalSession } from '../../../v4/session/index.js';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { until } from './helpers.js';

describe('local session', () => {
  it('runs a full all-bot game to the end', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'bot' }], seed: 11, botDelayMs: 0 });
    const seen = [];
    s.subscribe((state, info) => seen.push(info.version));
    expect(seen).toEqual([1]); // called once immediately
    expect(s.mySeats).toEqual([]);
    await until(() => s.getState().over, { label: 'game over' });
    expect(s.getState().ranking).toHaveLength(3);
    expect(s.info.mode).toBe('local');
    expect(seen.length).toBe(s.info.version);
    s.destroy();
  });

  it('hot-seat: humans play through submit, bots fill in, game completes', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'human' }], seed: 3, botDelayMs: 0 });
    expect(s.mySeats).toEqual([0, 2]);
    s.subscribe(state => {
      if (state.pending && s.mySeats.includes(state.pending.player)) queueMicrotask(() => s.submit(chooseBotMove(state)).catch(() => {}));
    });
    await until(() => s.getState().over, { label: 'game over' });
    s.destroy();
  });

  it('rejects wrong seat, wrong turn, and illegal options', async () => {
    const s = createLocalSession({ seats: [{ name: 'A' }, { name: 'B', kind: 'bot' }], seed: 5, botDelayMs: 10_000 });
    const st = s.getState();
    expect(st.pending.player).toBe(0);
    await expect(s.submit({ player: 1, option: st.pending.options[0].id })).rejects.toThrow(/isn't yours/);
    await expect(s.submit({ player: 0, option: 'nope' })).rejects.toThrow(/Illegal/);
    const before = s.info.version;
    await s.submit({ player: 0, option: st.pending.options[0].id });
    expect(s.info.version).toBe(before + 1);
    s.destroy();
  });
});
