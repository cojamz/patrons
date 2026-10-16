// @vitest-environment node
// Cory, 2026-10-15: a member with an activation (once per game / once per round, the `use:` option) can be used at
// any point on your own turn: before you place (beside the spaces) and in the buy step. Its whole effect resolves at
// once, choices included, then the turn resumes with fresh options. Never on a rival's turn. A used member offers no
// use and can't be released (canRelease).
import { describe, it, expect } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move, ids } from './helpers.js';
import { table, named, uidIn } from './cards-helpers-b.js';
import { promptFor } from '../../../v4/format.js';

const Q = ['gold', 'red', 'market', 'echo'];
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'gold.taxman'];
const N = (q, k) => quadrant(q).actions.find(a => a.key === k).name; // by key: space names get renamed
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const R = (s, i = 0) => s.players[i].res;
const slots = s => s.pending.options.filter(o => o.kind === 'slot');

describe('using a member any time on your turn', () => {
  it('in the place step, beside the spaces: it resolves, then you place with fresh options', () => {
    let s = table(Q, { members: [['gold.jackpot']], res: [{}, { gold: 5 }], shop: ROW });
    const uid = uidIn(s, 'gold.jackpot', 0), use = `use:${uid}`;
    expect(s.pending.kind).toBe('place');
    expect(ids(s)).toContain(use);
    expect(slots(s).length).toBeGreaterThan(0);
    expect(promptFor(s, true).sub).toBe('…or use Lottery Winner first'); // the line under the headline names it
    s = move(s, use); // Lottery Winner: gold equal to the richest rival's
    expect(R(s).gold).toBe(5);
    expect(named(s, 'Lottery Winner').length).toBe(1);
    expect(s.pending.kind).toBe('place'); // the turn resumes where it was
    expect(ids(s)).not.toContain(use);
    expect(slots(s).length).toBeGreaterThan(0);
    // then place as usual; in the buy step a used member offers no use and can't be released
    s = take(s, N('gold', 'rush'));
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).not.toContain(use);
    expect(ids(s)).not.toContain(`release:${uid}`);
  });

  it('in the buy step, as before: it resolves, then the buy step comes back without it', () => {
    let s = table(Q, { members: [['gold.jackpot']], res: [{}, { gold: 5 }], shop: ROW });
    const uid = uidIn(s, 'gold.jackpot', 0), use = `use:${uid}`;
    s = take(s, N('gold', 'rush'));
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).toEqual(expect.arrayContaining([use, `release:${uid}`])); // unused: usable, and releasable
    // one line for one step (blind testers, 2026-10-15): the headline says it all, the line under it names the use
    expect(promptFor(s, true).text).toBe('Recruit a member or buy followers');
    expect(promptFor(s, true).sub).toBe('…or use Lottery Winner');
    s = move(s, use);
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).not.toContain(use);
    expect(ids(s)).not.toContain(`release:${uid}`);
  });

  it('never on a rival\'s turn', () => {
    let s = table(Q, { members: [['gold.jackpot']], shop: ROW, queue: turns(1, 0) });
    const use = `use:${uidIn(s, 'gold.jackpot', 0)}`;
    expect(s.pending.player).toBe(1);
    expect(ids(s)).not.toContain(use);
    s = take(s, N('gold', 'rush'));
    if (s.pending?.player === 1) expect(ids(s)).not.toContain(use);
    while (s.pending && s.pending.player === 1) s = move(s, 'pass');
    expect(s.pending.player).toBe(0);
    expect(ids(s)).toContain(use); // P1's own turn now
  });

  it('a choice it asks comes first, then the placement: Stunt Double copying your Open House on your next turn', () => {
    const price = d => d.s + d.w;
    const defs = Q.flatMap(q => quadrant(q).members).filter(d => d.id !== 'echo.hourglass' && price(d) > 0);
    const low = Math.min(...defs.map(price).filter(c => defs.filter(d => price(d) === c).length >= 2));
    const tied = defs.filter(d => price(d) === low).slice(0, 2).map(d => d.id);
    const dear = defs.filter(d => price(d) > low).slice(0, 4).map(d => d.id);
    // the snake's double turn: P1 places, buys nothing, and places again
    let s = table(Q, { round: 2, members: [['echo.hourglass']], shop: [...tied, ...dear], queue: turns(0, 0) });
    s = take(s, N('red', 'hireup'));
    if (s.pending.kind === 'choose') s = move(s, s.pending.options[0].id); // Open Door's tie: either cheapest
    while (s.pending.kind === 'buy') s = move(s, 'pass');
    expect(s.pending.kind).toBe('place');
    const use = s.pending.options.find(o => o.kind === 'use');
    expect(use).toBeTruthy();
    s = move(s, use.id); // copies the space P1 just took: a face-up member costing no more, free
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.prompt).toMatch(new RegExp(`costing ${low} or less`));
    s = move(s, s.pending.options[0].id);
    expect(s.pending.kind).toBe('place'); // then the placement, fresh
    expect(ids(s)).not.toContain(use.id);
  });
});
