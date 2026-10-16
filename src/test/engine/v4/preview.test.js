// "You'd get" (previewSpace): a dry run of a space on a copy of the state. Whatever then really happens when the
// player takes the space (choices made at random) lies inside the preview's ranges, and a space with no choices
// is previewed exactly. The preview never changes the state it reads.
import { describe, it, expect } from 'vitest';
import { applyMove, followers, previewSpace } from '../../../engine/v4/index.js';
import { playMixedGames } from './contest-oracle.js';
import { seededRandom } from '../../../engine/v4/rng.js';

const inRange = (r, v) => v >= r[0] && v <= r[1];

describe('v4 previewSpace', () => {
  it('contains what really happens, for every legal space at sampled placements of 16 mixed-table games', () => {
    let checked = 0, exact = 0, ranged = 0;
    const rand = seededRandom(77);
    playMixedGames(16, {
      g0: 300,
      onMove(s) {
        if (!s.pending || s.pending.kind !== 'place' || s.moves % 5) return;
        const pid = s.pending.player;
        const frozen = JSON.stringify(s);
        // spaces only: a member's activation is offered beside them (use any time on your turn, Cory 2026-10-15)
        for (const o of s.pending.options.filter(x => x.kind === 'slot')) {
          const pv = previewSpace(s, pid, o.q, o.i);
          expect(pv, `${o.label}`).not.toBeNull();
          // the real thing: take the space, then answer every follow-up choice at random
          let t = applyMove(s, { player: pid, option: o.id });
          let guard = 0;
          while (t.pending && t.pending.kind === 'choose' && guard++ < 60) {
            const opts = t.pending.options;
            t = applyMove(t, { player: t.pending.player, option: opts[Math.floor(rand() * opts.length)].id });
          }
          const me0 = s.players[pid], me = t.players[pid];
          // the space was the round's last placement and the real path ran on through the round's end: rivals' round-end
          // members (Straggler doing Kickback for you) are in t, and no space preview covers them
          const pastRound = t.over || t.round !== s.round || t.log.slice(s.log.length).some(l => /^Round \S+ ends\./.test(l));
          if (!pv.partial && !pastRound) {
            for (const r of s.resources) expect(inRange(pv.you.res[r], (me.res[r] || 0) - (me0.res[r] || 0)), `${o.label}: ${r} ${JSON.stringify(pv.you.res[r])}`).toBe(true);
            expect(inRange(pv.you.members, me.members.length - me0.members.length), `${o.label}: members`).toBe(true);
            // followers: the buy step can't have run yet (we stop at the next decision), so it's the space's own
            if (t.pending && t.pending.player === pid && t.pending.kind === 'buy') expect(inRange(pv.you.followers, followers(t, me) - followers(s, me0)), `${o.label}: followers`).toBe(true);
          }
          if (pv.exact) exact++; else ranged++;
          checked++;
        }
        expect(JSON.stringify(s)).toBe(frozen);
      },
    });
    expect(checked).toBeGreaterThan(200);
    expect(exact).toBeGreaterThan(0);
    expect(ranged).toBeGreaterThan(0);
  });
});
