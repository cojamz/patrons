// A machine-wide cap on concurrent check:v4 runs (this box has 4 CPUs; five gates at once pushed engine tests into
// the 600 s backstop from load alone). Slots are small JSON files in one lock directory under /tmp, claimed inside a
// mkdir mutex. A slot whose owner is gone (its pid dead, or the pid reused by another process: the start time is
// compared) is reclaimed, so a killed run never blocks the box. The slot is released when this process exits.
//   V4_CHECK_SLOTS  how many runs at once (default 2)    V4_CHECK_LOCKS  the lock directory (default /tmp/v4-check-slots)
import { mkdirSync, rmdirSync, rmSync, readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const LOCK_DIR = process.env.V4_CHECK_LOCKS || '/tmp/v4-check-slots';
export const SLOTS = Math.max(1, Number(process.env.V4_CHECK_SLOTS) || 2);
const MUTEX = join(LOCK_DIR, '.mutex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** The kernel's start time of a pid (clock ticks since boot), or null when it isn't running. */
function startOf(pid) {
  try { const s = readFileSync(`/proc/${pid}/stat`, 'utf8'); return s.slice(s.lastIndexOf(')') + 2).split(' ')[19] || null; } catch { /* no /proc, or gone */ }
  try { process.kill(pid, 0); return 'alive'; } catch (err) { return err.code === 'EPERM' ? 'alive' : null; }
}
const alive = o => !!o && Number.isInteger(o.pid) && (() => { const s = startOf(o.pid); return s !== null && (s === 'alive' || o.start == null || String(o.start) === s); })();

async function withMutex(fn) {
  for (;;) {
    try { mkdirSync(MUTEX); break; } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // a mutex older than 30 s belongs to a process that died inside the few milliseconds it is held
      try { if (Date.now() - statSync(MUTEX).mtimeMs > 30000) rmSync(MUTEX, { recursive: true, force: true }); } catch { /* raced */ }
      await sleep(40 + Math.random() * 60);
    }
  }
  try { return fn(); } finally { try { rmdirSync(MUTEX); } catch { /* gone */ } }
}

const slotFile = i => join(LOCK_DIR, `slot-${i}.json`);
const readSlot = i => { try { return JSON.parse(readFileSync(slotFile(i), 'utf8')); } catch { return null; } };
const age = ms => { const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`; };
export const describeOwner = o => `pid ${o.pid} (${o.what || 'check:v4'}, ${age(Date.now() - o.since)})`;

/** Everyone holding a slot right now (live owners only). */
export function holders() {
  const out = [];
  for (let i = 0; i < SLOTS; i++) { const o = readSlot(i); if (alive(o)) out.push(o); }
  return out;
}

/**
 * Waits for a free slot and takes it. `what` says who we are in the waiting message of others ("follow: live tree,
 * port 5312"). Resolves to the slot index; the slot is released when this process exits.
 */
export async function acquireSlot(what, { log = msg => console.log(msg) } = {}) {
  mkdirSync(LOCK_DIR, { recursive: true });
  const me = { pid: process.pid, start: startOf(process.pid), what, since: Date.now() };
  let said = '', saidAt = 0, waited = Date.now();
  for (;;) {
    const got = await withMutex(() => {
      for (let i = 0; i < SLOTS; i++) {
        const o = readSlot(i);
        if (o && alive(o) && o.pid !== process.pid) continue;
        writeFileSync(slotFile(i), JSON.stringify(me));
        return i;
      }
      return -1;
    });
    if (got >= 0) {
      process.on('exit', () => { const o = readSlot(got); if (o && o.pid === process.pid) { try { unlinkSync(slotFile(got)); } catch { /* gone */ } } });
      if (said) log(`check slot ${got + 1} of ${SLOTS} is ours after ${age(Date.now() - waited)}`);
      return got;
    }
    const who = holders().map(describeOwner).join('; ');
    const key = holders().map(o => o.pid).join(',');
    if (key !== said || Date.now() - saidAt > 60000) {
      log(`waiting for a check slot: ${SLOTS} of ${SLOTS} in use by ${who} (at most ${SLOTS} check:v4 runs at once on this box; V4_CHECK_SLOTS changes it)`);
      said = key; saidAt = Date.now();
    }
    await sleep(2500 + Math.random() * 1500);
  }
}
