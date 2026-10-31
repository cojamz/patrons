// @vitest-environment node
// A copy must do everything the space does (Cory, 2026-10-23: Echo and Reprise copying Sleep In didn't skip a turn or
// pay Gossip). A copy hands over a space's chip (its resources, discount and free members) unless the space is
// marked redo, when the copier does the action itself. So every space that does anything a chip can't carry (moves
// turns, skips one, gives followers, sets a rule for the round) must be redo. This takes every space on a fresh table
// and checks.
import { describe, it, expect } from 'vitest';
import { allQuadrantIds, quadrant } from '../../../engine/v4/content/index.js';
import { take, move } from './helpers.js';
import { sceneQ, settle, passBuys, buy } from './cards-helpers.js';

const FILL = ['gold', 'red', 'market', 'echo', 'purple'];
const turns = s => s.queue.filter(t => t.t === 'turn' || (t.t === 'content' && t.h === 'purple.skipped')).map(t => `${t.t}${t.p}`).join(' ');
const flags = p => Object.fromEntries(Object.entries(p).filter(([k]) => !['res', 'members', 'discount', 'left', 'workers', 'bonus', 'lastSlot', 'turnRecruits', 'turnBuys', 'perSpend', 'recruitFollowers', 'peekReach', 'discountSources'].includes(k)).map(([k, v]) => [k, JSON.stringify(v)]));

describe('a copy does what the space does', () => {
  for (const qid of allQuadrantIds()) {
    const q = quadrant(qid);
    if (!q.actions?.length) continue;
    for (const a of q.actions) {
      if (a.echo) continue;
      it(`${q.name}: ${a.name}`, () => {
        const quadrants = [...new Set([qid, 'echo', ...FILL])].slice(0, 4);
        const rich = Object.fromEntries(['gold', 'red', 'blue', 'green', 'purple', 'silver', 'yellow', 'white', 'magenta'].map(r => [r, 6]));
        let s;
        try {
          s = sceneQ({ quadrants, n: 3, round: 3, res: [rich, rich, rich], queue: [0, 1, 2, 0, 1, 2].map(p => ({ t: 'turn', p })).concat({ t: 'allPlaced' }) });
        } catch (err) { return; }
        const before = { q: turns(s), bonus: s.players[0].bonus, early: JSON.stringify(s.early || null), flags: flags(s.players[0]) };
        try { s = take(s, `${qid}.${a.key}`); } catch (err) { return; } // a space this scene can't open
        s = passBuys(settle(s));
        const e = Object.values(s.echo?.now || {}).find(x => x.p === 0 && x.name === a.name);
        if (!e) return;
        const after = { q: turns(s).replace(/^turn1 /, ''), bonus: s.players[0].bonus, early: JSON.stringify(s.early || null), flags: flags(s.players[0]) };
        const changed = [];
        if (after.q !== before.q.replace(/^turn0 /, '').replace(/^turn1 /, '')) changed.push(`turns ${before.q} → ${turns(s)}`);
        if (after.bonus !== before.bonus) changed.push(`followers ${before.bonus} → ${after.bonus}`);
        if (after.early !== before.early) changed.push('turn order');
        for (const k of Object.keys(after.flags)) if (after.flags[k] !== before.flags[k]) changed.push(`${k}`);
        if (changed.length) expect(e.redo, `${a.name} changes ${changed.join(', ')} but a copy only hands over its chip`).toBe(true);
      });
    }
  }
});

describe('Echo copying Sleep In (Cory’s playtest, Oct 23)', () => {
  it('skips the copier’s next turn, and Gossip pays when that turn is passed over', () => {
    const rich = { purple: 9, green: 9, gold: 9, red: 9 };
    let s = sceneQ({ quadrants: ['purple', 'echo', 'gold', 'red'], n: 3, round: 2, res: [rich, rich, rich], members: [[], [], ['purple.gossip']],
      queue: [0, 1, 2, 2, 1, 0].map(p => ({ t: 'turn', p })).concat({ t: 'allPlaced' }) });
    s = passBuys(settle(take(s, 'purple.skip')));
    s = passBuys(settle(take(s, 'echo.echo')));
    expect(s.log).toContain("P2's Sleep In: P2 skips their next turn.");
    expect(s.players[1].res.purple).toBe(9 + 5); // Sleep In's round II gain (+4 / +5 / +6, Oct 28)
    s = passBuys(settle(take(s, 'gold.rush'))); // P3
    s = passBuys(settle(take(s, 'red.turnout'))); // P3 again; P2's turn is next, passed over
    expect(s.log).toContain("P2's turn is skipped (Sleep In).");
    expect(s.pending.player).toBe(0);
    expect(s.players[2].bonus).toBe(2); // P1's skip and P2's
  });
});

describe('Stunt Double (Cory’s playtest, Oct 23)', () => {
  it('recruited right after Lie Low and its steal picks, repeats Lie Low', () => {
    const rich = { magenta: 9, green: 9, gold: 9, red: 9 };
    let s = sceneQ({ quadrants: ['thieves', 'echo', 'purple', 'red'], n: 2, round: 3, res: [rich, { red: 1, purple: 1, magenta: 1, gold: 2 }], shop: ['echo.hourglass'], queue: [0, 1].map(p => ({ t: 'turn', p })) });
    s = settle(take(s, 'thieves.hideout'));
    s = settle(buy(s, 'echo.hourglass'));
    expect(s.log).toContain("P1's Stunt Double: P1 copies Lie Low: doing it again.");
  });
});

describe('Greatest Hits copying turn spaces (Cory’s playtest, Oct 23)', () => {
  const after = (sp) => {
    const rich = { purple: 9, green: 9, gold: 9, red: 9 };
    let s = sceneQ({ quadrants: ['purple', 'echo', 'gold', 'red'], n: 2, round: 3, res: [rich, rich], queue: [0, 1, 0, 1, 0, 1].map(p => ({ t: 'turn', p })).concat({ t: 'allPlaced' }) });
    s = passBuys(settle(take(s, sp)));
    // the rival takes plain spaces (gold or red) meanwhile
    while (!(s.pending?.kind === 'place' && s.pending.player === 0)) {
      const o = s.pending.options.find(x => x.kind === 'slot' && ['gold', 'red'].includes(s.quadrants[x.q]));
      s = passBuys(settle(move(s, o.id)));
    }
    const n = s.log.length;
    s = passBuys(settle(take(s, 'echo.eternity')));
    return { s, log: s.log.slice(n) };
  };
  it('Right Away: the copy gives its turn too', () => {
    const { s, log } = after('purple.again');
    expect(log).toContain('P1 copies Right Away: doing it again.');
    expect(log).toContain("P1's Right Away: P1 takes their next turn now.");
    expect(s.pending.player).toBe(0);
  });
  it('Crunch Time: the copy moves up your last turn', () => {
    const { s, log } = after('purple.rally');
    expect(log.some(l => /^P1's Crunch Time: P1 takes their next turn now/.test(l))).toBe(true);
    expect(s.pending.player).toBe(0);
  });
  it('Sleep In: the copy skips your next turn', () => {
    const { log } = after('purple.skip');
    expect(log).toContain("P1's Sleep In: P1 skips their next turn.");
  });
});
