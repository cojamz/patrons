// presend.mjs is the only check chat threads get (they run no hooks): card text and voice rules must bounce.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

const run = (text, ...args) => spawnSync('node', ['.claude/hooks/presend.mjs', ...args], { input: text, encoding: 'utf8' });

describe('presend', () => {
  it('bounces a card named without its text', () => {
    const r = run('**Stash** is the better pick here. Nothing needed from you.');
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/Card text missing.*Stash/);
  });
  it('passes a card quoted next to its name', () => {
    const r = run('**Stash** (+3 magenta in round I, +4 in round II, +5 in round III) is the better pick. Nothing needed from you.');
    expect(r.status).toBe(0);
  });
  it('bounces voice rules', () => {
    const r = run('Done — want me to ship it?\nline two\nline three');
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/em dash/);
  });
  it('lets a plain-word name through with --ok', () => {
    expect(run('The Mob was loud. Nothing needed from you.', '--ok', 'Mob').status).toBe(0);
  });
});
