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
