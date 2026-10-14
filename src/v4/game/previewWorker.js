// Dry runs off the main thread: the screen posts a table and the spaces to preview; this worker runs each one
// (previewSpace) and posts it back, so a hover never waits on the engine and nothing janks while it works.
import { previewSpace, contestTable } from '../../engine/v4/index.js';

self.onmessage = e => {
  const { gen, state, pid, keys } = e.data;
  for (const key of keys) {
    const [q, i] = key.split('-').map(Number);
    let pv = null;
    try {
      pv = previewSpace(state, pid, q, i);
      if (pv) { pv.race = pv.sample ? contestTable(pv.sample).map(c => ({ qid: c.qid, rule: c.rule, prize: c.prize, winners: c.winners, rows: c.rows })) : null; delete pv.sample; }
    } catch { pv = null; }
    self.postMessage({ gen, pid, key, pv });
  }
};
