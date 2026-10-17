// @vitest-environment node
// Repeated Green copies must retain their target/history through a save, never copy a copy.
import { describe, it, expect } from 'vitest';
import { table } from './cards-helpers-b.js';
import { take, move } from './helpers.js';
import { quadrant } from '../../../engine/v4/content/index.js';
const Q = ['gold', 'red', 'market', 'echo'];
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const name = key => quadrant('echo').actions.find(a => a.key === key).name;
describe('Green copy chains across saved choices', () => {
  it.each(['encore', 'refrain'])('%s → Echo does not fall back; Greatest Hits repeats only the original own action', key => {
    let s = table(Q, { round: 3, left: 5, queue: Array.from({ length: 5 }, () => ({ t: 'turn', p: 0 })) });
    s = pass(take(s, 'echo.hum'));
    const original = s.players[0].lastSlot.key;
    s = take(s, `echo.${key}`);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options).toHaveLength(1);
    expect(s.pending.options[0].target).toEqual({ space: original });
    expect(s.pending.options[0].label).toBe(`${name('hum')} (P1): +3 green`);
    const choice = s.pending.options[0].id;
    s = JSON.parse(JSON.stringify(s)); // mimic saving/rejoining before the target is selected
    s = pass(move(s, choice));
    expect(s.players[0].res.green).toBe(6);
    const afterFirstCopy = s.players[0].res.green;
    s = pass(take(s, 'echo.echo'));
    expect(s.players[0].res.green).toBe(afterFirstCopy);
    expect(s.log.some(l => l.includes('P1 had nothing to copy'))).toBe(true);
    const at = s.log.length;
    s = pass(take(s, 'echo.eternity'));
    expect(s.players[0].res.green).toBe(afterFirstCopy + 3);
    expect(s.pending?.kind).not.toBe('choose');
    const copied = s.log.slice(at).filter(l => l.startsWith('P1 copied '));
    expect(copied).toHaveLength(1);
    expect(copied[0]).toContain(`copied ${name('hum')}`);
    expect(s.log.slice(at).some(l => l.includes('copies never copy a copy'))).toBe(true);
  });
});
