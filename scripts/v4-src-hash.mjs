// A hash of the v4 rules source, taken at build time (vite.config.js and vitest.config.js define it as __V4_SRC__).
// record.js folds it into CONTENT_HASH, so a changed card effect (a function body, which the shape hash only sees as
// "a function") still refuses old rooms and sets aside old saves.
// Rules only: src/engine/v4/**/*.js except the bots and the preview helper (they choose moves, they don't make rules).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// (paths from strings, not new URL(): under vitest's jsdom, URL is jsdom's and node's fileURLToPath rejects it)
export const ENGINE_DIR = resolve(dirname(fileURLToPath(String(import.meta.url))), '../src/engine/v4');
const NOT_RULES = new Set(['bots.js', 'thinker.js', 'preview.js']);

/** [{ path, text }] for every rules file, sorted by path (paths relative to src/engine/v4, with '/'). */
export function engineFiles(root = ENGINE_DIR) {
  const out = [];
  const walk = dir => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(m?js|json)$/.test(name)) {
        const path = relative(root, full).split(sep).join('/');
        if (!NOT_RULES.has(path)) out.push({ path, text: readFileSync(full, 'utf8').replace(/\r\n/g, '\n') });
      }
    }
  };
  walk(root);
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** 10 hex characters over the files' paths and text. */
export function engineSourceHash(files = engineFiles()) {
  const h = createHash('sha1');
  for (const f of files) { h.update(f.path); h.update('\0'); h.update(f.text); h.update('\0'); }
  return h.digest('hex').slice(0, 10);
}

/** For the configs: never let a hashing problem break a build (an empty hash just means "shape only"). */
export function engineSourceHashSafe() {
  try { return engineSourceHash(); } catch (err) { console.warn('[v4-src-hash]', err?.message || err); return ''; }
}

if (process.argv[1] && fileURLToPath(String(import.meta.url)) === process.argv[1]) console.log(engineSourceHash());
