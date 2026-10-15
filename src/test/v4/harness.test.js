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

  it('seeded blocks never shrink silently: the verdict plays at least 60 games (or all) of each, and check:v4:full plays every one', () => {
    // budget.js reads V4_GAMES once, at import: ask a fresh node at each level
    const at = level => {
      const env = { ...process.env, V4_GAMES: level };
      if (!level) delete env.V4_GAMES;
      const code = "const b = await import('./src/test/engine/v4/budget.js'); console.log(JSON.stringify([b.LEVEL, b.games(200), b.games(170, 12), b.games(60), b.games(24), +b.catches(100).toFixed(3)]));";
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: new URL('../../../', import.meta.url).pathname, env, encoding: 'utf8' });
      return JSON.parse(r.stdout.trim().split('\n').pop());
    };
    expect(at('')).toEqual(['verdict', 100, 85, 60, 24, 0.030]); // 100 games catch a bug in ≥3% of games, 95% confidence
    expect(at('full')).toEqual(['full', 200, 170, 60, 24, 0.030]);
    expect(at('fast')).toEqual(['fast', 20, 12, 6, 3, 0.030]);
    expect(JSON.parse(read('package.json')).scripts['check:v4:full']).toMatch(/--full/);
    expect(read('scripts/v4-check.mjs')).toMatch(/full \? 'full'/); // --full sets V4_GAMES=full
  });

  it('CI runs check:v4 --fast with node 22 and npm ci on pushes to the v4 branch, and deploys nothing', () => {
    const wf = read('.github/workflows/v4.yml');
    expect(wf).toMatch(/tags: \['v\*'\]/); // release tags and manual runs only, not every WIP push
    expect(wf).toMatch(/node-version: 22/);
    expect(wf).toMatch(/run: npm ci/);
    expect(wf).toMatch(/run: npm run check:v4 -- --fast/);
    const steps = wf.split('\n').filter(l => !l.trim().startsWith('#')).join('\n'); // the comments may say "deploy"
    expect(steps).not.toMatch(/netlify|deploy\b|--prod|secrets\./i);
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
