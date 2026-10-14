// A machine-wide cap on concurrent check:v4 runs (this box has 4 CPUs; five gates at once pushed engine tests into
// the 600 s backstop from load alone). Slots are small JSON files in one lock directory under /tmp, claimed inside a
// mkdir mutex. A slot whose owner is gone (its pid dead, or the pid reused by another process: the start time is
// compared) is reclaimed, so a killed run never blocks the box. The slot is released when this process exits.
//   V4_CHECK_SLOTS  how many runs at once (default 2)    V4_CHECK_LOCKS  the lock directory (default /tmp/v4-check-slots)
import { mkdirSync, rmdirSync, rmSync, readFileSync, writeFileSync, unlinkSync, statSync, readdirSync, existsSync } from 'node:fs';
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

// waiters queue in arrival order (wait-<pid>.json): a free slot goes to the longest-waiting live run, so a run that
// arrives later can't jump ahead of one that has waited an hour
const waitFile = pid => join(LOCK_DIR, `wait-${pid}.json`);
function queue() {
  const out = [];
  for (const f of readdirSync(LOCK_DIR)) {
    if (!/^wait-\d+\.json$/.test(f)) continue;
    let o = null;
    try { o = JSON.parse(readFileSync(join(LOCK_DIR, f), 'utf8')); } catch { /* half-written or gone */ }
    if (o && alive(o)) out.push(o);
    else if (o) { try { unlinkSync(join(LOCK_DIR, f)); } catch { /* raced */ } }
  }
  return out.sort((a, b) => a.since - b.since || a.pid - b.pid);
}

/**
 * Waits for a free slot and takes it, first come first served. `what` says who we are in the waiting message of
 * others ("live tree, .v4-build-follow, port 5312"). Resolves to the slot index; the slot is released when this
 * process exits.
 */
export async function acquireSlot(what, { log = msg => console.log(msg) } = {}) {
  mkdirSync(LOCK_DIR, { recursive: true });
  const me = { pid: process.pid, start: startOf(process.pid), what, since: Date.now() };
  writeFileSync(waitFile(process.pid), JSON.stringify(me));
  const unqueue = () => { try { unlinkSync(waitFile(process.pid)); } catch { /* gone */ } };
  process.on('exit', unqueue);
  let said = '', saidAt = 0;
  for (;;) {
    const got = await withMutex(() => {
      const free = [];
      for (let i = 0; i < SLOTS; i++) { const o = readSlot(i); if (!(o && alive(o) && o.pid !== process.pid)) free.push(i); }
      const ahead = queue().findIndex(o => o.pid === process.pid);
      if (!free.length || ahead >= free.length) return -1; // (ahead -1: our ticket vanished; the next poll re-files it)
      writeFileSync(slotFile(free[0]), JSON.stringify({ ...me, since: Date.now() }));
      unqueue();
      return free[0];
    });
    if (got >= 0) {
      process.on('exit', () => { const o = readSlot(got); if (o && o.pid === process.pid) { try { unlinkSync(slotFile(got)); } catch { /* gone */ } } });
      if (said) log(`check slot ${got + 1} of ${SLOTS} is ours after ${age(Date.now() - me.since)}`);
      return got;
    }
    if (!existsSync(waitFile(process.pid))) writeFileSync(waitFile(process.pid), JSON.stringify(me));
    const hs = holders(), q = queue();
    const key = `${hs.map(o => o.pid).join(',')}|${q.findIndex(o => o.pid === process.pid)}`;
    if (key !== said || Date.now() - saidAt > 300000) {
      const pos = q.findIndex(o => o.pid === process.pid);
      log(`waiting for a check slot (${pos + 1} in line): ${hs.length} of ${SLOTS} in use by ${hs.map(describeOwner).join('; ') || 'runs ahead of us'} (at most ${SLOTS} check:v4 runs at once on this box; V4_CHECK_SLOTS changes it)`);
      said = key; saidAt = Date.now();
    }
    await sleep(2500 + Math.random() * 1500);
  }
}
