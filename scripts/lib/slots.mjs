// Machine-wide pools that keep check:v4 runs from trampling each other on this 4-CPU box.
//   check  how many check:v4 runs at once (V4_CHECK_SLOTS, default 3). Unit tests run niced (v4-check.mjs), so the
//          cap guards memory and the queue, not the timing gates.
//   e2e    browser e2e scripts in flight across EVERY run on the box (V4_E2E_TOKENS, default 4; they mostly wait on
//          animations and bot pacing: ~10-20% of a core each). A timing-sensitive
//          script (hover p95, count-ups, bot pacing) takes all the tokens: it runs with no other e2e anywhere on the
//          box, whichever run started it, while niced unit tests fill the idle CPU underneath.
// Holders and waiters are small JSON files under one lock directory, claimed inside a mkdir mutex. FIFO and weighted:
// the longest waiter goes first and nobody jumps it, so a solo e2e (weight = every token) is never starved by a stream
// of small ones. An owner that is gone (pid dead, or the pid reused: the start time is compared) is reclaimed, so a
// killed run never blocks the box; everything is released when this process exits.
// Waiters get an ETA from the recent run history (runs.jsonl in the lock dir, written by v4-check.mjs).
//   V4_CHECK_LOCKS  the lock directory (default /tmp/v4-check-slots)
import { mkdirSync, rmdirSync, rmSync, readFileSync, writeFileSync, unlinkSync, statSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export const LOCK_DIR = process.env.V4_CHECK_LOCKS || '/tmp/v4-check-slots';
export const SLOTS = Math.max(1, Number(process.env.V4_CHECK_SLOTS) || 3);
export const E2E_TOKENS = Math.max(1, Number(process.env.V4_E2E_TOKENS) || 4);
export const RUNS = join(LOCK_DIR, 'runs.jsonl');
const CAP = { check: SLOTS, e2e: E2E_TOKENS };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** The kernel's start time of a pid (clock ticks since boot), or null when it isn't running. */
function startOf(pid) {
  try { const s = readFileSync(`/proc/${pid}/stat`, 'utf8'); return s.slice(s.lastIndexOf(')') + 2).split(' ')[19] || null; } catch { /* no /proc, or gone */ }
  try { process.kill(pid, 0); return 'alive'; } catch (err) { return err.code === 'EPERM' ? 'alive' : null; }
}
const alive = o => !!o && Number.isInteger(o.pid) && (() => { const s = startOf(o.pid); return s !== null && (s === 'alive' || o.start == null || String(o.start) === s); })();
const ME = { pid: process.pid, start: startOf(process.pid) };

async function withMutex(dir, fn) {
  const mutex = join(dir, '.mutex');
  for (;;) {
    try { mkdirSync(mutex); break; } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // a mutex older than 30 s belongs to a process that died inside the few milliseconds it is held
      try { if (Date.now() - statSync(mutex).mtimeMs > 30000) rmSync(mutex, { recursive: true, force: true }); } catch { /* raced */ }
      await sleep(20 + Math.random() * 40);
    }
  }
  try { return fn(); } finally { try { rmdirSync(mutex); } catch { /* gone */ } }
}

const readJSON = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
const poolDir = pool => join(LOCK_DIR, pool);
/** Live files of one type (hold | wait) in a pool, oldest first; dead owners' files are removed. */
function scan(pool, type) {
  const dir = poolDir(pool), out = [];
  let names = [];
  try { names = readdirSync(dir); } catch { /* no pool dir yet */ }
  for (const f of names) {
    if (!f.startsWith(`${type}-`) || !f.endsWith('.json')) continue;
    const o = readJSON(join(dir, f));
    if (o && alive(o)) out.push({ ...o, file: f });
    else if (o) { try { unlinkSync(join(dir, f)); } catch { /* raced */ } }
  }
  // runs from before the pools (scripts/lib/slots.mjs v1: slot-<i>.json in the lock dir) still hold a check slot each
  if (pool === 'check' && type === 'hold') {
    try {
      for (const f of readdirSync(LOCK_DIR)) if (/^slot-\d+\.json$/.test(f)) { const o = readJSON(join(LOCK_DIR, f)); if (o && alive(o)) out.push({ ...o, weight: 1, file: f, legacy: true }); }
    } catch { /* no lock dir */ }
  }
  return out.sort((a, b) => a.since - b.since || a.pid - b.pid || a.seq - b.seq);
}
const used = hs => hs.reduce((n, h) => n + (h.weight || 1), 0);

const age = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`; };
export const describeOwner = o => `pid ${o.pid} (${o.what || 'check:v4'}, ${age(Date.now() - o.since)})`;

/** Everyone holding a check slot right now (live owners only). */
export const holders = (pool = 'check') => scan(pool, 'hold');

// ---------- the run history (for ETAs; scripts/v4-retro.mjs reads it too) ----------

const DEFAULT_S = { verdict: 600, live: 600, fast: 240, quick: 120, full: 3600 };
/** Recent run records, newest last. */
export function runHistory(limit = 200) {
  try { return readFileSync(RUNS, 'utf8').trim().split('\n').filter(Boolean).slice(-limit).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
}
export function recordRun(rec) { try { mkdirSync(LOCK_DIR, { recursive: true }); appendFileSync(RUNS, JSON.stringify(rec) + '\n'); } catch { /* history is best effort */ } }
/** Typical seconds for a run of this kind: the median of the last 10 green ones, else a default. */
export function typicalS(kind) {
  const xs = runHistory().filter(r => r.kind === kind && r.ok && r.totalS > 0).slice(-10).map(r => r.totalS).sort((a, b) => a - b);
  return xs.length ? xs[Math.floor(xs.length / 2)] : DEFAULT_S[kind] ?? 600;
}
/** When a weight-1 newcomer at queue position `ahead` should get a check slot, in seconds from now (a simulation). */
function etaS(hs, queueAhead) {
  const free = [];
  for (const h of hs) for (let w = 0; w < (h.weight || 1); w++) free.push(Math.max(30, typicalS(h.kind) - (Date.now() - h.since) / 1000));
  while (free.length < SLOTS) free.push(0);
  free.sort((a, b) => a - b);
  for (const q of queueAhead) { const t = free.shift(); free.push(t + typicalS(q.kind)); free.sort((a, b) => a - b); }
  return free[0];
}

// ---------- acquiring ----------

let seq = 0;
/**
 * Waits for `weight` units of `pool` and takes them, first come first served. `what` names us in others' waiting
 * messages. Resolves to { waitedMs, release }; whatever is still held is released when this process exits.
 */
export async function acquire(pool, { weight = 1, what = 'check:v4', kind = 'live', log = msg => console.log(msg), quiet = false } = {}) {
  const cap = CAP[pool] ?? 1;
  weight = Math.min(Math.max(1, weight), cap);
  const dir = poolDir(pool);
  mkdirSync(dir, { recursive: true });
  const n = ++seq;
  const me = { ...ME, seq: n, weight, what, kind, since: Date.now() };
  const waitF = join(dir, `wait-${process.pid}-${n}.json`), holdF = join(dir, `hold-${process.pid}-${n}.json`);
  const drop = f => { try { unlinkSync(f); } catch { /* gone */ } };
  writeFileSync(waitF, JSON.stringify(me));
  const onExit = () => { drop(waitF); drop(holdF); };
  process.on('exit', onExit);
  let said = '', saidAt = 0;
  for (;;) {
    const got = await withMutex(dir, () => {
      const hs = scan(pool, 'hold'), q = scan(pool, 'wait');
      const pos = q.findIndex(o => o.pid === process.pid && o.seq === n);
      if (pos < 0) return false; // our ticket vanished: re-filed below
      // strict FIFO: everyone ahead of us must fit first (they're waiting, so they don't: we wait too)
      if (pos > 0 || used(hs) + weight > cap) return false;
      writeFileSync(holdF, JSON.stringify({ ...me, since: Date.now() }));
      drop(waitF);
      return true;
    });
    if (got) {
      const waitedMs = Date.now() - me.since;
      if (said) log(`${pool === 'check' ? 'check slot' : `${weight} e2e token(s)`} ours after ${age(waitedMs)}`);
      return { waitedMs, release() { drop(holdF); process.off('exit', onExit); } };
    }
    if (!existsSync(waitF)) writeFileSync(waitF, JSON.stringify(me));
    if (!quiet) {
      const hs = scan(pool, 'hold'), q = scan(pool, 'wait');
      const pos = q.findIndex(o => o.pid === process.pid && o.seq === n);
      const key = `${hs.map(o => `${o.pid}.${o.seq}`).join(',')}|${pos}`;
      if (key !== said || Date.now() - saidAt > 120000) {
        const eta = pool === 'check' ? ` · ETA ~${age(etaS(hs, q.slice(0, Math.max(0, pos))) * 1000)} (from recent run times)` : '';
        log(`waiting for ${pool === 'check' ? 'a check slot' : `${weight} e2e token(s)`} (${pos + 1} in line)${eta}: ${used(hs)} of ${cap} in use by ${hs.map(describeOwner).join('; ') || 'runs ahead of us'}`);
        said = key; saidAt = Date.now();
      }
    }
    await sleep(pool === 'check' ? 2000 + Math.random() * 1000 : 300 + Math.random() * 200);
  }
}

/** A check:v4 slot for this run (released when the process exits). Resolves to { waitedMs }. */
export const acquireSlot = (what, opts = {}) => acquire('check', { what, ...opts });
