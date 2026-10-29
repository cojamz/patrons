// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { defById } from '../../../engine/v4/index.js';
import { table } from '../../engine/v4/cards-helpers-b.js';
import { take, move } from '../../engine/v4/helpers.js';
import { memberCopyTargets, ownCopyPlan, copiesAll, copyAllPlan } from '../../../v4/game/cards.js';

describe('Green hover targets follow the current rules', () => {
  it('Stunt Double highlights the action just taken, but Agents blocks it', () => {
    const s = take(table(['gold', 'echo'], { shop: ['echo.agents'] }), 'gold.rush');
    const key = Object.keys(s.slots)[0];
    expect(memberCopyTargets(s, 0, defById('echo.hourglass'))).toEqual([key]);
    const agents = s.shop.find(u => s.cards[u].def === 'echo.agents');
    s.shop = s.shop.filter(u => u !== agents);
    s.players[0].members.push(agents);
    expect(memberCopyTargets(s, 0, defById('echo.hourglass'))).toEqual([]);
  });

  it('Greatest Hits and Tribute Band highlight owned copy actions too', () => {
    let s = table(['gold', 'echo'], { round: 3, queue: [0, 1, 0].map(p => ({ t: 'turn', p })) });
    s = move(take(s, 'gold.rush'), 'pass');
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options[0].id);
    const echoKey = Object.keys(s.slots).find(k => s.slots[k] === 1);
    expect(ownCopyPlan(s, 1).keys).toContain(echoKey);
    expect(ownCopyPlan(s, 1).skips).not.toMatch(/never copy a copy/);
    expect(copiesAll(defById('echo.dejavu').text)).toBe(true);
    // Tribute Band lights the leader's actions (Cory, 2026-10-28), not the viewer's
    s.players[1].bonus = 5;
    expect(copyAllPlan(s, 0, defById('echo.dejavu').text).keys).toEqual(ownCopyPlan(s, 1).keys);
  });
});
