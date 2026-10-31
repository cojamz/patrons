// @vitest-environment node
// Repeated Green copies retain fresh target choices and branch history through a save.
import { describe, it, expect } from 'vitest';
import { table } from './cards-helpers-b.js';
import { take, move } from './helpers.js';
import { quadrant } from '../../../engine/v4/content/index.js';
const Q = ['gold', 'red', 'market', 'echo'];
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const keyOf = (q, k) => `${Q.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;
const pick = (s, k) => move(s, s.pending.options.find(o => o.value === k).id);
describe('Green copy chains across saved choices', () => {
  // Reprise copies your Cover, which chooses again (Encore copied spaces until Oct 28; Cover now plays the source)
  it('Reprise re-chooses a copied Cover target after save/rejoin', () => {
    let s = table(Q, { round: 3, left: 5, queue: [0, 0, 0].map(p => ({ t: 'turn', p })) });
    s = take(s, 'echo.hum');
    s = pass(pick(s, keyOf('echo', 'chant')));
    s = pass(take(s, 'gold.rush'));
    s = take(s, 'echo.refrain');
    const selected = s.pending.options.find(o => o.value === keyOf('echo', 'hum'));
    expect(selected).toBeTruthy();
    const before = s.players[0].res.green;
    s = move(JSON.parse(JSON.stringify(s)), selected.id);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.some(o => o.value === keyOf('echo', 'refrain'))).toBe(false);
    const target = s.pending.options.find(o => o.value === keyOf('echo', 'chant'));
    expect(target).toBeTruthy();
    s = move(JSON.parse(JSON.stringify(s)), target.id);
    expect(s.players[0].res.green).toBeGreaterThanOrEqual(before + 5); // Build Up's +5 in round III
    expect(s.pending.kind).toBe('buy');
  });
});
