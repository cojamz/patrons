// @vitest-environment node
// The harness itself: the gate covers the playable spheres, CI runs the same gate on a clean machine (and deploys
// nothing), and the safety hook never tells an agent in a shared tree to stash.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = p => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

describe('v4 harness', () => {
  it('check:v4 runs the sphere tests too (every sphere is playable from the table picker)', () => {
    const check = read('scripts/v4-check.mjs');
    expect(check).not.toMatch(/--exclude[^\n]*spheres/);
    expect(check).toMatch(/src\/test\/engine\/v4/);
  });

  it('CI runs check:v4 --fast with node 22 and npm ci on pushes to the v4 branch, and deploys nothing', () => {
    const wf = read('.github/workflows/v4.yml');
    expect(wf).toMatch(/branches: \[claude\/gifted-newton-3lcy3i\]/);
    expect(wf).toMatch(/node-version: 22/);
    expect(wf).toMatch(/run: npm ci/);
    expect(wf).toMatch(/run: npm run check:v4 -- --fast/);
    expect(wf).not.toMatch(/netlify|deploy\b|--prod|secrets\./i);
  });

  it('protect.sh blocks tree-wide discards and advises a WIP commit, never a stash', () => {
    const hook = new URL('../../../.claude/hooks/protect.sh', import.meta.url).pathname;
    for (const command of ['git reset ' + '--hard HEAD', 'git checkout ' + '.']) {
      const r = spawnSync('bash', [hook], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }), encoding: 'utf8' });
      expect(r.status, command).toBe(2);
      expect(r.stderr).toMatch(/WIP commit/);
      expect(r.stderr).not.toMatch(/\bUse git stash\b|git stash or/);
    }
  });
});
