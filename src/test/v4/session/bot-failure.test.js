// @vitest-environment node
// A bot move that throws must never stall a game silently. The session logs it, plays the first option that applies
// cleanly instead, and reports a small notice (record.js reportProblem; online, through the room to every client).
// Only when no option applies at all does the game stop, and then it says so.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createLocalSession, createRoom, joinRoom, createMemoryStore, createMemoryTransport } from '../../../v4/session/index.js';
import { onProblem } from '../../../v4/session/record.js';
import { untilFake, autoPlay } from './helpers.js';

// The bot brain, rigged: `every` makes every n-th bot decision throw; `illegal` makes it answer nonsense instead;
// `engineDown` makes the engine itself throw on every move (nothing can be played).
const rig = vi.hoisted(() => ({ every: 0, illegal: false, engineDown: false, botCalls: 0 }));
vi.mock('../../../engine/v4/index.js', async importOriginal => {
  const real = await importOriginal();
  return {
    ...real,
    chooseBotMove(state, ...rest) {
      const forBot = state.pending && state.players[state.pending.player].kind === 'bot';
      if (forBot && rig.every && ++rig.botCalls % rig.every === 0) {
        if (rig.illegal) return { player: state.pending.player, option: 'not-an-option' };
        throw new Error('bot brain exploded');
      }
      return real.chooseBotMove(state, ...rest);
    },
  };
});
vi.mock('../../../engine/v4/core.js', async importOriginal => {
  const real = await importOriginal();
  return { ...real, applyMove: (...a) => { if (rig.engineDown) throw new Error('engine exploded'); return real.applyMove(...a); } };
});

let problems, offProblem;
beforeEach(() => {
  Object.assign(rig, { every: 0, illegal: false, engineDown: false, botCalls: 0 });
  problems = [];
  offProblem = onProblem(p => problems.push(p));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers();
});
afterEach(() => { offProblem(); vi.useRealTimers(); vi.restoreAllMocks(); });

const bots3 = [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];

describe('local: a bot move that throws', () => {
  it('is logged, replaced by the first option that applies, and reported; the game finishes', async () => {
    rig.every = 5;
    const s = createLocalSession({ seats: bots3, seed: 17, botDelayMs: 10 });
    await untilFake(() => s.getState().over, { label: 'game over despite throwing bots' });
    expect(rig.botCalls).toBeGreaterThan(50);
    const bot = problems.filter(p => p.kind === 'bot');
    expect(bot.length).toBeGreaterThan(5);
    expect(bot[0].message).toMatch(/hit a bug, so it made a plain move instead/);
    expect(bot[0].detail).toMatch(/bot brain exploded/);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/bot move failed/), expect.any(Error));
    expect(s.getState().history.length).toBe(s.getState().moves);
    s.destroy();
  });

  it('an illegal answer from the bot is treated the same way', async () => {
    rig.every = 3; rig.illegal = true;
    const s = createLocalSession({ seats: bots3, seed: 4, botDelayMs: 10 });
    await untilFake(() => s.getState().over, { label: 'game over despite illegal bot answers' });
    expect(problems.some(p => p.kind === 'bot' && /illegal move/.test(p.detail))).toBe(true);
    s.destroy();
  });

  it('when nothing at all can be played, the game stops and says so (no silent stall, no crash)', async () => {
    const s = createLocalSession({ seats: bots3, seed: 2, botDelayMs: 10 });
    rig.engineDown = true;
    const v = s.getState().moves;
    await vi.advanceTimersByTimeAsync(200);
    expect(s.getState().moves).toBe(v);
    expect(problems.map(p => p.kind)).toEqual(['stuck']);
    expect(problems[0].message).toMatch(/can't continue/);
    s.destroy();
  });
});

describe('online: a bot move that throws on the host', () => {
  it('falls back, finishes the game, and every client hears about it through the room', async () => {
    rig.every = 4;
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 12, botDelayMs: 10 });
    const guest = await joinRoom({ code: host.code, name: 'G', transport: createMemoryTransport(store), botDelayMs: 10 });
    await host.lobby.addBot();
    await host.lobby.addBot();
    const ss = [new Promise(r => host.lobby.onStart(r)), new Promise(r => guest.lobby.onStart(r))];
    await host.lobby.start();
    const [hs, gs] = await Promise.all(ss);
    const stops = [autoPlay(hs, { seed: 1 }), autoPlay(gs, { seed: 2 })];
    await untilFake(() => hs.getState()?.over && gs.getState()?.over, { label: 'online game over despite throwing bots' });
    stops.forEach(f => f());
    expect(rig.botCalls).toBeGreaterThan(20);
    // both clients' sessions reported each room notice (two clients in this one process)
    const bot = problems.filter(p => p.kind === 'bot');
    expect(bot.length).toBeGreaterThanOrEqual(2);
    expect(bot[0].message).toMatch(/hit a bug/);
    expect(JSON.stringify(gs.getState())).toBe(JSON.stringify(hs.getState()));
    host.lobby.destroy(); guest.lobby.destroy();
  });
});
