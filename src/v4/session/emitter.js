// Tiny listener set shared by sessions and lobbies.

/** @template T @returns {{ on(fn: (...a: any[]) => void): () => void, emit(...a: any[]): void, clear(): void, size: () => number }} */
export function createEmitter() {
  const fns = new Set();
  return {
    on(fn) { fns.add(fn); return () => fns.delete(fn); },
    emit(...args) {
      for (const fn of [...fns]) {
        try { fn(...args); } catch (err) { console.error('[v4 session] listener failed:', err); }
      }
    },
    clear() { fns.clear(); },
    size: () => fns.size,
  };
}

/** Random id from a safe alphabet (Firebase keys can't hold . # $ [ ] /). */
export function randomId(len = 10, chars = 'abcdefghijkmnpqrstuvwxyz23456789') {
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
