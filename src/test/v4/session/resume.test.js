// Reload-proofing: a hot-seat game saved the way the app saves it (every change) can be resumed at every single
// step, including bot turns in round III, the final prompts and the finished game before its results are shown.
import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalSession } from '../../../v4/session/index.js';
import { loadLocal, saveLocal, clearLocal, finishLocal, ROUND_START } from '../../../v4/saved.js';
import { until, autoPlay } from './helpers.js';

const seats = [{ name: 'Ana', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];

describe('resume after a reload', () => {
  beforeEach(() => localStorage.clear());

  for (const seed of [3, 21]) {
    it(`restores an identical state at every step of a full game (seed ${seed})`, async () => {
      const config = { seats, speed: 'normal' };
      const s = createLocalSession({ seats, seed, botDelayMs: 0 });
      const problems = [];
      const seen = { steps: 0, botR3: 0, over: 0, lastPrompts: 0 };
      // the app's save, then a "reload" right after it
      s.subscribe(st => saveLocal(config, st, s.undoCheckpoint));
      s.subscribe(st => {
        seen.steps++;
        if (st.round === 3 && st.pending && st.players[st.pending.player].kind === 'bot') seen.botR3++;
        if (st.over) seen.over++;
        if (st.round === 3 && st.pending && st.queue.length <= 3) seen.lastPrompts++;
        const v = loadLocal();
        if (!v || v.fromRoundStart) { problems.push(`step ${seen.steps}: nothing to resume (round ${st.round}, over ${!!st.over})`); return; }
        if (JSON.stringify(v.state) !== JSON.stringify(st)) { problems.push(`step ${seen.steps}: saved state differs`); return; }
        const again = createLocalSession({ state: v.state, undo: v.undo, botDelayMs: 1e9 });
        if (JSON.stringify(again.getState()) !== JSON.stringify(st)) problems.push(`step ${seen.steps}: resumed state differs`);
        if (s.canUndo() && !again.canUndo()) problems.push(`step ${seen.steps}: undo lost on resume`);
        again.destroy();
      });
      const stop = autoPlay(s, { seed });
      await until(() => s.getState().over, { timeout: 20000, label: 'game over' });
      stop();
      expect(problems.slice(0, 5)).toEqual([]);
      expect(seen.botR3).toBeGreaterThan(5);
      expect(seen.lastPrompts).toBeGreaterThan(0);
      expect(seen.over).toBeGreaterThan(0);
      // finished but results not yet shown: still resumable, straight to the final scores
      expect(loadLocal()?.state.over).toBeTruthy();
      finishLocal(); // the results screen rendered
      expect(loadLocal()).toBe(null);
      s.destroy();
    }, 30000);
  }

  it('falls back to the round-start snapshot when the save is missing', async () => {
    const s = createLocalSession({ seats, seed: 5, botDelayMs: 0 });
    const stop = autoPlay(s, { seed: 5 });
    await until(() => s.getState().round === 2, { label: 'round II' });
    stop();
    const snap = s.getState();
    localStorage.setItem(ROUND_START, JSON.stringify({ seed: snap.seed, round: snap.round, names: '', state: snap }));
    const v = loadLocal();
    expect(v && v.fromRoundStart).toBe(true);
    expect(JSON.stringify(v.state)).toBe(JSON.stringify(snap));
    clearLocal();
    expect(loadLocal()).toBe(null);
    s.destroy();
  });
});
