// Composite-only motion (eng-audit S3.3): every keyframe list the show passes to `.animate(` in director.js, flight.js
// and stage.js moves only what the compositor can move on its own (transform and its parts, opacity), so a flight never
// repaints the page under it. A static scan: each call's keyframes are followed to where they're built (a literal, a
// const, a helper like arcFrames, or a wrapper's call sites like relative and pulse's ride) and their keys are checked.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const FILES = ['director.js', 'flight.js', 'stage.js'].map(f => [f, readFileSync(resolve(__dirname, '../../../v4/game', f), 'utf8')]);
const ALLOWED = new Set(['transform', 'translate', 'scale', 'rotate', 'opacity', 'offset', 'easing', 'composite']);
// keyframes that animate something else today, kept on purpose (don't change their look here)
const EXCEPTIONS = [
  { file: 'flight.js', fn: 'flyCards', key: 'boxShadow', why: 'the chip a bought card lands on glows once (one small chip, after the card lands); not in a chain' },
  { file: 'director.js', fn: 'playChain', key: 'boxShadow', why: "a bought member's chip glows once as the card reaches it (onHome, via relative); one small chip, the chain's last beat" },
];

// blank strings and comments (keeping length), so keys and brackets are found only in code
function code(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && d === '*') { while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; } out += '  '; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      out += c; i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') { out += '  '; i += 2; continue; } out += src[i] === '\n' ? '\n' : ' '; i++; }
      out += c; i++; continue;
    }
    out += c; i++;
  }
  return out;
}
const OPEN = '([{', CLOSE = ')]}';
const match = (s, i) => { let d = 0; for (let j = i; j < s.length; j++) { if (OPEN.includes(s[j])) d++; else if (CLOSE.includes(s[j]) && --d === 0) return j; } return -1; };
// the top-level arguments of the call whose '(' is at i
function args(s, i) {
  const end = match(s, i), out = [];
  let d = 0, from = i + 1;
  for (let j = i + 1; j < end; j++) {
    if (OPEN.includes(s[j])) d++; else if (CLOSE.includes(s[j])) d--;
    else if (s[j] === ',' && d === 0) { out.push([from, j]); from = j + 1; }
  }
  out.push([from, end]);
  return out.map(([a, b]) => ({ at: a, text: s.slice(a, b).trim() }));
}
// the expression after `=` at i, up to its ';' or line end at depth 0
function rhs(s, i) {
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (OPEN.includes(s[j])) d++; else if (CLOSE.includes(s[j])) d--;
    if (d < 0 || (d === 0 && (s[j] === ';' || (s[j] === '\n' && !/^\s*[?:.]/.test(s.slice(j + 1, j + 40)))))) return s.slice(i, j);
  }
  return s.slice(i);
}
const srcs = FILES.map(([file, raw]) => ({ file, s: code(raw) }));
// named functions and arrow consts: their params and bodies
const fns = [];
for (const { file, s } of srcs) {
  const re = /function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*\(/g;
  let m;
  while ((m = re.exec(s))) {
    const p = m.index + m[0].length - 1, pe = match(s, p);
    const after = s.slice(pe + 1, pe + 6);
    if (m[2] && !/^\s*=>/.test(after)) continue;
    const bodyAt = s.indexOf('{', pe), bodyEnd = match(s, bodyAt);
    const params = args(s, p).map(a => a.text.replace(/=.*$/s, '').trim());
    fns.push({ file, name: m[1] || m[2], params, from: p, to: bodyEnd, body: s.slice(bodyAt, bodyEnd + 1) });
  }
}
const enclosing = (file, at) => fns.filter(f => f.file === file && f.from < at && at < f.to).sort((a, b) => (b.from - a.from))[0];

const found = [];
const seen = new Set();
// the keys of the keyframes an expression builds; `where` is { file, at } for resolving names
function keysOf(expr, where, via) {
  const key = `${where.file}:${where.at}:${expr}`;
  if (seen.has(key)) return;
  seen.add(key);
  const s = srcs.find(x => x.file === where.file).s;
  let text = expr;
  // a helper that builds keyframes (arcFrames): scan its body, not its options
  for (const f of fns) {
    const re = new RegExp(`\\b${f.name}\\s*\\(`, 'g');
    let m;
    while ((m = re.exec(text))) {
      if (!/Frames$/.test(f.name)) continue;
      const p = m.index + m[0].length - 1, e = match(text, p);
      keysOf(f.body.replace(/^[^]*?\{/, '{').replace(/\bconst\b[^;]*;/, ''), { file: f.file, at: f.from }, `${via} → ${f.name}`);
      text = text.slice(0, p) + ' '.repeat(e - p + 1) + text.slice(e + 1);
    }
  }
  // a bare name: its const, or a parameter of the function it's in (then every call site's argument)
  const bare = text.match(/^\(?\s*([A-Za-z_$][\w$]*)\s*\)?$/);
  if (bare) {
    const name = bare[1];
    const fn = enclosing(where.file, where.at);
    const decl = [...s.slice(0, where.at).matchAll(new RegExp(`(?:const|let)\\s+${name}\\s*=`, 'g'))].pop();
    if (fn && fn.params.includes(name) && (!decl || decl.index < fn.from)) {
      const idx = fn.params.indexOf(name);
      let calls = 0;
      for (const { file, s: t } of srcs) {
        const re = new RegExp(`(?<![\\w.$])${fn.name}\\s*\\(`, 'g');
        let m;
        while ((m = re.exec(t))) {
          const p = m.index + m[0].length - 1;
          if (file === fn.file && p === fn.from) continue;
          if (/function\s+$|const\s+$/.test(t.slice(Math.max(0, m.index - 12), m.index))) continue;
          const a = args(t, p)[idx];
          if (a) { calls++; keysOf(a.text, { file, at: a.at }, `${via} → ${fn.name}()`); }
        }
      }
      expect(calls, `${where.file}: no call sites found for ${fn.name}(${name})`).toBeGreaterThan(0);
      return;
    }
    expect(decl, `${where.file}: can't find where "${name}" (keyframes of ${via}) is built; teach this scan`).toBeTruthy();
    keysOf(rhs(s, decl.index + decl[0].length).trim(), { file: where.file, at: decl.index }, via);
    return;
  }
  // a literal (or a ternary of literals, a spread, a .map): its object keys
  for (const m of text.matchAll(/(?:^|[{,])\s*([A-Za-z_$][\w$]*)\s*:/g)) found.push({ file: where.file, fn: enclosing(where.file, where.at)?.name, key: m[1], via });
}
for (const { file, s } of srcs) {
  for (const m of s.matchAll(/\.animate\s*\(/g)) {
    const p = m.index + m[0].length - 1;
    const [first] = args(s, p);
    keysOf(first.text, { file, at: first.at }, `${file}:${s.slice(0, m.index).split('\n').length}`);
  }
}

it('finds the keyframes of every animate call (the scan sees what it should)', () => {
  const keys = new Set(found.map(f => f.key));
  for (const k of ['transform', 'opacity', 'offset', 'translate', 'scale']) expect(keys.has(k), k).toBe(true);
  expect(found.length).toBeGreaterThan(60);
  expect(found.some(f => f.via.includes('arcFrames'))).toBe(true);
  expect(found.some(f => f.via.includes('relative()'))).toBe(true);
});

it('every keyframe moves only transform, translate, scale, rotate and opacity', () => {
  const bad = found.filter(f => !ALLOWED.has(f.key) && !EXCEPTIONS.some(e => e.file === f.file && e.fn === f.fn && e.key === f.key));
  expect(bad.map(f => `${f.via} (${f.fn}): ${f.key}`)).toEqual([]);
});

it('each named exception still exists (drop it when its motion goes composite)', () => {
  for (const e of EXCEPTIONS) expect(found.some(f => f.file === e.file && f.fn === e.fn && f.key === e.key), `${e.fn} ${e.key}`).toBe(true);
});
