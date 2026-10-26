// Asks the bot worker (botWorker.js) for a bot's move, so a bot's 100-250ms of thinking never lands on the main
// thread mid wheel-spin, hover or animation. Answers null whenever the main thread should think instead: no Worker
// (jsdom, tests, old browsers), the worker failed to load or errored, the bot threw, or no answer in time. Callers
// then run the bot on the main thread exactly as before, with their rng untouched, so games play the same either way.

/** How long a bot's answer may take before the main thread thinks instead. */
export const BOT_THINK_TIMEOUT_MS = 1500;

let worker = null; // null: not tried yet; false: none (or it failed); else the Worker
let nextId = 1;
let lastAnswer = 0;
const waiting = new Map(); // id -> { resolve, t }

function settle(id, value) {
  const w = waiting.get(id);
  if (!w) return;
  waiting.delete(id);
  w.resolve(value);
}
function workerFailed() {
  if (worker) { try { worker.terminate(); } catch { /* gone */ } }
  worker = false;
  for (const id of [...waiting.keys()]) settle(id, null);
}
function listen(w) {
  w.onmessage = e => {
    lastAnswer = Date.now();
    const { id, move, rng, error } = e.data || {};
    settle(id, error || !move ? null : { move, rng });
  };
  w.onerror = workerFailed;
  w.onmessageerror = workerFailed;
}
function getWorker() {
  if (worker !== null) return worker || null;
  try {
    if (typeof Worker === 'undefined' || typeof window === 'undefined' || /jsdom/i.test(globalThis.navigator?.userAgent || '')) { worker = false; return null; }
    worker = new Worker(new URL('./botWorker.js', import.meta.url), { type: 'module' });
    listen(worker);
  } catch { worker = false; }
  return worker || null;
}

/**
 * Starts a bot thinking about `state` in the worker, its draws starting from rng position `rng`.
 * Returns null when there is no worker (think on the main thread now, as always), else a promise of
 * { move, rng } (the move and the rng position after it) or null (think on the main thread instead).
 */
export function askBot(state, rng, { timeoutMs = BOT_THINK_TIMEOUT_MS } = {}) {
  const w = getWorker();
  if (!w) return null;
  const id = nextId++;
  const t = Date.now();
  const answer = new Promise(resolve => { waiting.set(id, { resolve, t }); });
  try { w.postMessage({ id, state, rng: rng >>> 0 }); } catch { settle(id, null); return answer; }
  setTimeout(() => {
    if (!waiting.has(id)) return;
    // nothing at all heard since this was asked: the worker is dead (a 404'd chunk, a hung load), so stop using it
    if (lastAnswer < t) workerFailed();
    else settle(id, null);
  }, timeoutMs);
  return answer;
}

/** For tests: forget the worker (null: try again; false: there is none; or a stand-in). */
export const _setBotWorker = w => {
  for (const id of [...waiting.keys()]) settle(id, null);
  worker = w;
  lastAnswer = 0;
  if (w) listen(w);
};
