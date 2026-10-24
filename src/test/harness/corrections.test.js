import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

// A scratch queue, so tests never write into the shared one.
const queue = `${mkdtempSync(`${tmpdir()}/corrections-`)}/q.jsonl`;
const run = (body, env = { CULTS_CORRECTIONS_FILE: queue }) => {
  const prompt = `<message from="human" trust="principal" id="cmsg_t">${body}</message>`;
  const r = spawnSync('node', ['.claude/hooks/corrections.mjs'], { input: JSON.stringify({ prompt, session_id: 'test' }), encoding: 'utf8', env: { ...process.env, ...env } });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : null;
};

describe('corrections hook', () => {
  it('ignores plain instructions', () => {
    expect(run('ship the shop fix')).toBeNull();
  });
  it('flags a correction, and calls a later similar one a repeat', () => {
    const tag = `zebra${Date.now()}`;
    const first = run(`don't show the ${tag} banner on the wheel`);
    expect(first).toMatch(/may correct/);
    const again = run(`why are you showing the ${tag} banner on the wheel again`);
    expect(again).toMatch(/resembles/);
  });
});
