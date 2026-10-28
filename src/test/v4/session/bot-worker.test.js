import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLocalSession } from '../../../v4/session/index.js';
import { _setBotWorker } from '../../../v4/session/botThink.js';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { untilFake } from './helpers.js';

// Bots think in a worker in the browser (botThink.js / botWorker.js). These stand-ins do what botWorker.js does,
// answering a tick later, and the game must come out move for move the same as thinking on the main thread.
const standIn = ({ answer = true, crash = false, ready = false, slowFirst = 0 } = {}) => {
  const w = { asked: 0, answered: 0, terminated: false, onmessage: null, onerror: null, onmessageerror: null };
  w.terminate = () => { w.terminated = true; };
  if (ready) setTimeout(() => w.onmessage?.({ data: { ready: true } }), 0);
  w.postMessage = ({ id, state, rng }) => {
    w.asked += 1;
    const copy = structuredClone(state);
    setTimeout(() => {
      if (w.terminated) return;
      if (crash) { w.onerror?.(new Event('error')); return; }
      if (!answer) return;
      const rand = seededRandom(rng);
      const move = chooseBotMove(copy, rand);
      w.answered += 1;
      w.onmessage?.({ data: { id, move, rng: rand.state } });
    }, w.asked === 1 && slowFirst ? slowFirst : 1);
  };
  return w;
};

const seats = [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'bot' }];
async function playOut(seed) {
  const s = createLocalSession({ seats, seed, botDelayMs: 5 });
  await untilFake(() => s.getState().over, { step: 50, label: 'game over' });
  const st = s.getState();
  s.destroy();
  return { history: st.history, ranking: st.ranking };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { _setBotWorker(null); vi.useRealTimers(); });

describe('bots thinking in a worker', () => {
  it('the bot rng picks up exactly where it left off from its state', () => {
    const a = seededRandom(1234);
    a(); a(); a();
    const b = seededRandom(a.state);
    expect([b(), b(), b()]).toEqual([a(), a(), a()]);
  });

  it('a whole game goes move for move the same with the worker as without it', async () => {
    _setBotWorker(false);
    const here = await playOut(11);
    const w = standIn();
    _setBotWorker(w);
    const there = await playOut(11);
    expect(here.history.length).toBeGreaterThan(50);
    expect(w.answered).toBeGreaterThan(50);
    expect(there.history).toEqual(here.history);
    expect(there.ranking).toEqual(here.ranking);
  });

  it('a worker that never answers falls back to the main thread, same game', async () => {
    _setBotWorker(false);
    const here = await playOut(5);
    const w = standIn({ answer: false });
    _setBotWorker(w);
    const there = await playOut(5);
    expect(w.terminated).toBe(true); // never heard from: dropped after the first timeout
    expect(there.history).toEqual(here.history);
  });

  it('one slow answer falls back once and keeps the worker for the rest of the game, same game', async () => {
    _setBotWorker(false);
    const here = await playOut(9);
    const w = standIn({ ready: true, slowFirst: 4000 });
    _setBotWorker(w);
    const there = await playOut(9);
    expect(w.terminated).toBe(false);
    expect(w.answered).toBeGreaterThan(50);
    expect(there.history).toEqual(here.history);
  });

  it('a worker that errors falls back to the main thread, same game', async () => {
    _setBotWorker(false);
    const here = await playOut(7);
    const w = standIn({ crash: true });
    _setBotWorker(w);
    const there = await playOut(7);
    expect(w.terminated).toBe(true);
    expect(w.asked).toBe(1);
    expect(there.history).toEqual(here.history);
  });
});
