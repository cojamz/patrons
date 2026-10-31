// The version guard has to see rule changes that live inside functions. Measured 2026-10-14: Bookkeeper was halved
// (`ctx.gain(owner, P, onBoard)` → `Math.floor(onBoard / 2)`) and the shape-only CONTENT_HASH stayed the same, so
// rooms, saves and records from before the change were accepted under the new rules.
import { describe, it, expect } from 'vitest';
import { CONTENT_HASH, SHAPE_HASH, BUILD, contentManifest, hashContent } from '../../../v4/session/record.js';
import { engineFiles, engineSourceHash } from '../../../../scripts/v4-src-hash.mjs';

describe('content hash sees effects', () => {
  it('an effect-only change (a function body) leaves the shape hash alone but changes the source hash', () => {
    const files = engineFiles();
    const i = files.findIndex(f => f.path.startsWith('content/') && /ctx\.gain\(/.test(f.text));
    expect(i).toBeGreaterThanOrEqual(0);
    const changed = files.map((f, k) => (k === i ? { ...f, text: f.text.replace(/ctx\.gain\(([^,]+), ([^,]+), /, 'ctx.gain($1, $2, Math.floor(1 / 2) + ') } : f));
    expect(changed[i].text).not.toBe(files[i].text);
    expect(engineSourceHash(changed)).not.toBe(engineSourceHash(files));
    expect(hashContent(contentManifest())).toBe(SHAPE_HASH); // the shape hash can't see it, by design
  });

  it('this build’s content stamp carries the rules-source hash, so rooms, saves and records refuse an effect change', () => {
    expect(CONTENT_HASH).toBe(`${SHAPE_HASH}.${engineSourceHash()}`);
    expect(BUILD.content).toBe(CONTENT_HASH);
  });

  it('bots and the preview helper aren’t rules: they’re left out', () => {
    const paths = engineFiles().map(f => f.path);
    expect(paths).toContain('core.js');
    expect(paths.some(p => p.startsWith('content/'))).toBe(true);
    for (const p of ['bots.js', 'thinker.js', 'preview.js']) expect(paths).not.toContain(p);
  });
});

describe('node-made stamps agree with the app', () => {
  it('the build defines the same rules-source hash the tests use', async () => {
    // (in a child node: loading vite.config.js under jsdom trips esbuild)
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', "const c = (await import('./vite.config.js')).default; console.log(c.define.__V4_SRC__);"], { cwd: process.cwd(), encoding: 'utf8' });
    expect(r.stdout.trim().split('\n').pop()).toBe(JSON.stringify(engineSourceHash()));
  });

  it('scripts and e2e helpers (plain node, no Vite define) stamp exactly like the app for the same tree', async () => {
    const { spawnSync } = await import('node:child_process');
    const code = "await import('./scripts/v4-node-stamp.mjs'); const m = await import('./src/v4/session/record.js'); const s = await import('./e2e/v4/lib/stamp.mjs'); console.log(JSON.stringify({ content: m.CONTENT_HASH, game: m.newGame({ seats: [{ name: 'A' }, { name: 'B' }], seed: 1 }).build.content, e2e: s.buildStamp().content }));";
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: process.cwd(), encoding: 'utf8' });
    expect(r.stderr || '').not.toMatch(/Error/);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    expect(out).toEqual({ content: CONTENT_HASH, game: CONTENT_HASH, e2e: CONTENT_HASH });
  });
});
