// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { table, uidIn } from './cards-helpers-b.js';
import { take, move } from './helpers.js';
import { memberCount, memberWeight, countMembersOfColor, contextFor, followers } from '../../../engine/v4/core.js';
const Q = ['gold', 'red', 'thieves', 'yellow'];
describe('Printed followers count as members', () => {
  it('counts printed people in total and colored counts, independently of bonus followers', () => {
    const s = table(Q, { members: [['red.twins', 'red.bigfamily', 'yellow.latebloomer']], bonus: [37] });
    expect(s.players[0].members).toHaveLength(3);
    expect(memberCount(s, s.players[0])).toBe(7);
    expect(countMembersOfColor(s, s.players[0], 'red')).toBe(5);
    expect(countMembersOfColor(s, s.players[0], 'yellow')).toBe(2);
    expect(followers(s, s.players[0])).toBe(45);
    expect(contextFor(s).quadrant('red').scoring.score(contextFor(s), s.players[0])).toBe(5);
  });
  it('uses printed member weight for a per-member action', () => {
    let s = table(Q, { round: 2, members: [['red.twins', 'red.bigfamily']] });
    s = take(s, 'gold.windfall');
    expect(s.players[0].res.gold).toBe(5);
  });
  it('counts copies using the larger effective printed value', () => {
    const s = table(['gold', 'red', 'echo', 'yellow'], { members: [['echo.doppel', 'red.bigfamily']] });
    const uid = uidIn(s, 'echo.doppel', 0);
    s.cards[uid].copy = 'red.bigfamily';
    expect(memberWeight(s, uid)).toBe(3);
    expect(memberCount(s, s.players[0])).toBe(6);
    expect(countMembersOfColor(s, s.players[0], 'echo')).toBe(3);
  });
  it('preserves explicit three-member Revelers despite its one printed follower', () => {
    const s = table(['gold', 'red', 'silver', 'yellow'], { members: [['silver.revelers', 'silver.retinue']] });
    expect(memberCount(s, s.players[0])).toBe(5);
    expect(countMembersOfColor(s, s.players[0], 'silver')).toBe(5);
  });
  it('weighted recruit counters cross Pied Piper threshold once; recruit hooks fire once', () => {
    let s = table(Q, { res: [{ red: 20 }], members: [['red.drive', 'red.recruiter']], shop: ['red.bigfamily'] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidIn(s, 'red.bigfamily', 'shop')}`);
    expect(s.players[0].turnRecruits).toBe(3);
    expect(s.recruits).toBe(3);
    expect(s.log.filter(l => l.includes('Pied Piper: +2 red'))).toHaveLength(1);
    // Big Family cost4: +2 from Piper and +1 from Recruiter, not one hook per person.
    expect(s.players[0].res.red).toBe(19);
  });
});
