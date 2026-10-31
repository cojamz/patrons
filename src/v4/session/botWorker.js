// Bot thinking off the main thread: the session posts the table and its bot rng's position; this worker picks the
// bot's move (chooseBotMove, the same call the main thread makes) and posts back the move and the rng's new
// position, so the main thread applies it and its rng carries on exactly as if it had thought there itself.
import { chooseBotMove } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';

// it says it loaded (botThink.js: only a worker that never does counts as dead); not when a test loads it as a plain module
if (typeof window === 'undefined') self.postMessage({ ready: true });
self.onmessage = e => {
  const { id, state, rng } = e.data;
  const rand = seededRandom(rng);
  try {
    const move = chooseBotMove(state, rand);
    self.postMessage({ id, move: move ? { player: move.player, option: move.option } : null, rng: rand.state });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
