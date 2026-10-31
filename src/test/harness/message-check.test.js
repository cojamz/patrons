import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const check = text => {
  const r = spawnSync('node', ['.claude/hooks/message-check.mjs'], { input: JSON.stringify({ tool_input: { text } }), encoding: 'utf8' });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason : null;
};

describe('message check hook (Cory voice gate)', () => {
  it('passes a short plain update', () => {
    expect(check('Shipped v0.8.11: shop names fit. Next is the Red toast, about 9:40pm.')).toBeNull();
  });
  it('passes a numbered pick list', () => {
    expect(check('Two calls:\n1. Cut Social Climber [yes]\n2. Guests stay colorless [yes]\n3. Tiebreaker is most members [yes]')).toBeNull();
  });
  it('bounces tables, headers, UTC times, em dashes and tics every time', () => {
    for (const t of ['| a | b |\n|---|---|\n| 1 | 2 |', '## Status\nDone.', 'Back at 23:40 UTC.', 'Done — next is red.', 'Fair point, shipping now.', 'Want me to ship it?', 'The Netlify check is red.', 'New threads start on v4 now.']) {
      expect(check(t)).toMatch(/bounced/);
      expect(check(t)).toMatch(/bounced/);
    }
  });
  it('bounces a long message once, then lets the identical resend through', () => {
    const t = `long ${Date.now()}\n` + 'line\n'.repeat(10) + 'Nothing needed from you.';
    expect(check(t)).toMatch(/lines/);
    expect(check(t)).toBeNull();
    rmSync('/tmp/cults-message-check', { recursive: true, force: true });
  });
  it('bounces a real update that leaves his decision unclear', () => {
    expect(check('Shipped the wheel fix.\nIt spins in 300ms now.\nNext is the shop.')).toMatch(/Nothing needed from you/);
    expect(check('Shipped the wheel fix.\nIt spins in 300ms now.\nNothing needed from you.')).toBeNull();
    expect(check('Shipped the wheel fix.\nIt spins in 300ms now.\nShip the shop next? [yes]')).toBeNull();
  });
  it('bounces engineering questions to Cory (Oct 21, Oct 28: engineering never waits on him)', () => {
    expect(check('1. Go ahead with the tuning pass and the staged rebuild? [yes]')).toMatch(/engineering never waits/);
    expect(check('Should we refactor the director first?')).toMatch(/engineering never waits/);
    expect(check('Shipped the tuning pass: rounds run lighter.\nNothing needed from you.')).toBeNull();
    expect(check('1. Tiebreaker costs 5? [yes]\n2. Keep the 12 quick lines? [yes]')).toBeNull();
  });
  it('ignores times and paths inside code and links', () => {
    expect(check('Log is `run-23:40.txt`, see https://x.io/a—b')).toBeNull();
  });
});
