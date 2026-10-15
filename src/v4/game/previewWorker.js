// Dry runs off the main thread: the screen posts a table and the spaces to preview; this worker runs each one
// (previewSpace) and posts it back, so a hover never waits on the engine and nothing janks while it works.
// One space per task, from a queue: a space you hover (`front`) jumps ahead of the warmup batch instead of waiting
// for the whole batch to finish (perf, 2026-10-15: "You'd get" filled in at p95 412ms).
import { previewSpace } from '../../engine/v4/index.js';
import { withRace } from './race.js';

let gen = null, state = null, queue = [], done = new Set(), busy = false;
const pump = () => {
  busy = false;
  const job = queue.shift();
  if (!job) return;
  const id = `${job.pid}|${job.key}`;
  if (!done.has(id)) {
    done.add(id);
    const [q, i] = job.key.split('-').map(Number);
    let pv = null;
    try {
      pv = previewSpace(state, job.pid, q, i);
      withRace(pv);
    } catch { pv = null; }
    self.postMessage({ gen, pid: job.pid, key: job.key, pv });
  }
  if (queue.length && !busy) { busy = true; setTimeout(pump, 0); }
};
self.onmessage = e => {
  const { gen: g, state: st, pid, keys, front = false } = e.data;
  if (g !== gen) { gen = g; state = st; queue = []; done = new Set(); }
  const jobs = keys.map(key => ({ pid, key }));
  queue = front ? [...jobs, ...queue] : [...queue, ...jobs];
  if (!busy) { busy = true; setTimeout(pump, 0); }
};
