// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { table, uidIn } from './cards-helpers-b.js';
import { take, move } from './helpers.js';
import { memberCount, memberWeight, countMembersOfColor, contextFor, followers } from '../../../engine/v4/core.js';
const Q = ['gold', 'red', 'thieves', 'yellow'];
describe('Printed followers count as members', () => {
  it('counts printed people in total and colored counts, independently of bonus followers', () => {
    const s = table(Q, { members: [['red.twins', 'red.bigfamily', 'yellow.latebloomer']], res: [{ red: 11 }], bonus: [37] });
    expect(s.players[0].members).toHaveLength(3);
    expect(memberCount(s, s.players[0])).toBe(7);
    expect(countMembersOfColor(s, s.players[0], 'red')).toBe(5);
    expect(countMembersOfColor(s, s.players[0], 'yellow')).toBe(2);
    expect(followers(s, s.players[0])).toBe(45);
    // Printed groups still count as members; the Red contest independently counts resources.
    expect(contextFor(s).quadrant('red').scoring.score(contextFor(s), s.players[0])).toBe(11);
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
    expect(memberCount(s, s.players[0])).toBe(6);
    expect(countMembersOfColor(s, s.players[0], 'silver')).toBe(6);
  });
  it('Retinue contributes three people without changing Silver’s resource contest', () => {
    const s = table(['gold', 'red', 'silver', 'echo'], { members: [['silver.retinue']], res: [{ silver: 7 }] });
    const uid = uidIn(s, 'silver.retinue', 0);
    expect(memberWeight(s, uid)).toBe(3);
    expect(memberCount(s, s.players[0])).toBe(3);
    expect(countMembersOfColor(s, s.players[0], 'silver')).toBe(3);
    expect(followers(s, s.players[0])).toBe(4); // Leader plus Retinue’s three printed followers.
    expect(contextFor(s).quadrant('silver').scoring.score(contextFor(s), s.players[0])).toBe(7);
  });
  it('recruiting Doppelganger copies Retinue’s three people, without repeating its gift', () => {
    let s = table(['gold', 'red', 'silver', 'echo'], {
      round: 3, members: [['silver.retinue']], shop: ['echo.doppel'], queue: [{ t: 'turn', p: 0 }],
    });
    s = take(s, 'red.take');
    const uid = uidIn(s, 'echo.doppel', 'shop');
    s = move(s, `card:${uid}`);
    s = move(s, `card:${uidIn(s, 'silver.retinue', 0)}`);
    expect(s.cards[uid].copy).toBe('silver.retinue');
    expect(memberWeight(s, uid)).toBe(3);
    expect(memberCount(s, s.players[0])).toBe(6);
    expect(countMembersOfColor(s, s.players[0], 'echo')).toBe(3);
    expect(countMembersOfColor(s, s.players[0], 'silver')).toBe(3);
    expect(followers(s, s.players[0])).toBe(7);
    expect(s.players[1].res.silver).toBe(0); // Becoming a copy is its own Recruit effect.
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
