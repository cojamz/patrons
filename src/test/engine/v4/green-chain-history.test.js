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
  it.each(['encore', 'refrain'])('%s re-chooses a copied action after save/rejoin', action => {
    const sourceOwner = action === 'encore' ? 1 : 0;
    let s = table(Q, { round: 3, left: 5, queue: [1, 0, sourceOwner, 0, 0].map(p => ({ t: 'turn', p })) });
    s = pass(take(s, 'echo.chant'));
    s = pass(take(s, 'gold.rush'));
    const source = action === 'encore' ? 'refrain' : 'encore';
    s = take(s, `echo.${source}`);
    s = pass(pick(s, keyOf('echo', 'chant')));
    s = take(s, `echo.${action}`);
    const selected = s.pending.options.find(o => o.value === keyOf('echo', source));
    expect(selected).toBeTruthy();
    const resource = action === 'encore' ? 'gold' : 'green';
    const before = s.players[0].res[resource];
    s = move(JSON.parse(JSON.stringify(s)), selected.id);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.some(o => o.value === keyOf('echo', action))).toBe(false);
    const target = s.pending.options.find(o => o.value === (action === 'encore' ? keyOf('gold', 'rush') : keyOf('echo', 'chant')));
    expect(target).toBeTruthy();
    s = move(JSON.parse(JSON.stringify(s)), target.id);
    expect(s.players[0].res[resource]).toBe(before + (action === 'encore' ? 6 : 5)); // Reprise's placement base was paid before this snapshot.
    expect(s.pending.kind).toBe('buy');
  });
});
