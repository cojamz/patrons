// A small JSON tree that behaves like Firebase RTDB, shared by the memory and BroadcastChannel transports.
// Like RTDB it drops null/undefined and empty objects, and stores arrays as index-keyed objects,
// so code that works here won't be surprised by the real database.

/**
 * The Transport interface every session talks to. Paths are slash-separated strings ('v3rooms/ABCDE/state').
 * @typedef {{
 *   kind: string,
 *   ready: Promise<void>,
 *   get(path: string): Promise<any>,
 *   set(path: string, value: any): Promise<void>,
 *   update(path: string, obj: Record<string, any>): Promise<void>,
 *   push(path: string, value: any): Promise<string>,
 *   subscribe(path: string, cb: (value: any) => void): () => void,
 *   onChildAdded(path: string, cb: (key: string, value: any) => void): () => void,
 *   remove(path: string): Promise<void>,
 *   transaction(path: string, fn: (current: any) => any): Promise<{ committed: boolean, value: any }>,
 *   onDisconnectSet(path: string, value: any): Promise<void>,
 *   cancelDisconnect(path: string): Promise<void>,
 *   onConnectedChange(cb: (connected: boolean) => void): () => void,
 *   serverTime(): any,
 *   serverNow?(): number, // the server's clock now, in ms (local clock + the server's offset)
 *   close(): void,
 * }} Transport
 */

export const splitPath = p => String(p).split('/').filter(Boolean);

/** Clone + RTDB-style cleanup. Returns null for "nothing". */
export function normalize(v) {
  if (v === undefined || v === null || typeof v === 'function') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'object') return v;
  const entries = Array.isArray(v) ? v.map((x, i) => [String(i), x]) : Object.entries(v);
  const out = {};
  for (const [k, x] of entries) { const n = normalize(x); if (n !== null) out[k] = n; }
  return Object.keys(out).length ? out : null;
}

export function getAt(root, segs) {
  let n = root;
  for (const s of segs) {
    if (n === null || n === undefined || typeof n !== 'object') return null;
    n = n[s];
  }
  return n ?? null;
}

/** Returns a new root with `value` at `segs`. Untouched branches are shared. */
export function setAt(root, segs, value) {
  if (!segs.length) return normalize(value);
  const [head, ...rest] = segs;
  const base = root && typeof root === 'object' ? { ...root } : {};
  const child = setAt(base[head] ?? null, rest, value);
  if (child === null) delete base[head]; else base[head] = child;
  return Object.keys(base).length ? base : null;
}

/** Applies a Firebase-style multi-path update ({ 'a/b': 1, c: null }). */
export function updateAt(root, segs, obj) {
  let out = root;
  for (const [k, v] of Object.entries(obj || {})) out = setAt(out, [...segs, ...splitPath(k)], v);
  return out;
}

const clone = v => (v === null || v === undefined ? null : JSON.parse(JSON.stringify(v)));

let lastPushTime = 0;
let pushSeq = 0;
/** Sortable, unique-enough push keys (time + counter + random), like Firebase's. */
export function pushKey() {
  const now = Date.now();
  pushSeq = now === lastPushTime ? pushSeq + 1 : 0;
  lastPushTime = now;
  return '-' + now.toString(36).padStart(9, '0') + pushSeq.toString(36).padStart(3, '0') + Math.random().toString(36).slice(2, 8);
}

/**
 * Value / child-added listeners over a readable tree. notify() diffs each listener against what it last
 * delivered and schedules callbacks on microtasks, in order, so delivery is async like the real thing.
 * @param {(segs: string[]) => any} read
 */
export function createListenerHub(read) {
  const listeners = new Set();

  function check(l) {
    if (!l.active) return;
    const v = read(l.segs);
    if (l.type === 'value') {
      const s = JSON.stringify(v ?? null);
      if (s === l.last) return;
      l.last = s;
      queueMicrotask(() => { if (l.active) l.cb(JSON.parse(s)); });
    } else {
      const obj = v && typeof v === 'object' ? v : {};
      const keys = Object.keys(obj).sort();
      for (const k of keys) {
        if (l.known.has(k)) continue;
        const val = clone(obj[k]);
        queueMicrotask(() => { if (l.active) l.cb(k, val); });
      }
      l.known = new Set(keys);
    }
  }

  function add(type, path, cb) {
    const l = { type, segs: splitPath(path), cb, active: true, last: undefined, known: new Set() };
    listeners.add(l);
    check(l);
    return () => { l.active = false; listeners.delete(l); };
  }

  return {
    value: (path, cb) => add('value', path, cb),
    child: (path, cb) => add('child', path, cb),
    notify() { for (const l of [...listeners]) check(l); },
    clear() { for (const l of listeners) l.active = false; listeners.clear(); },
  };
}

export { clone };
