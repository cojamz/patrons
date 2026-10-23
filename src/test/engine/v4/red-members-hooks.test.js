// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contextFor, countMembersOfColor, memberCount, resume } from '../../../engine/v4/core.js';
import { defById, quadrant } from '../../../engine/v4/content/index.js';
import { CUT } from '../../../engine/v4/content/cull.js';
import { table, uidIn } from './cards-helpers-b.js';
import { move } from './helpers.js';

const Q = ['red', 'echo', 'gold', 'thieves'];
const fixture = opts => { const s = table(Q, opts); s.queue = []; s.pending = null; return s; };
const acquire = (s, id) => contextFor(s).recruit(s.players[0], uidIn(s, id, 'shop'), { free: true });

describe('new Red member hooks', () => {
  it('deals exactly twelve ordinary Red members, with the approved printed bodies and prices', () => {
    expect(quadrant('red').members.filter(d => !CUT.has(d.id))).toHaveLength(12);
    for (const [id, s, w, f] of [['volunteer', 0, 0, 1], ['twins', 1, 1, 2], ['panel', 4, 2, 3], ['mob', 6, 4, 5], ['loyalists', 2, 3, 2]]) {
      expect(defById(`red.${id}`)).toMatchObject({ s, w, f });
    }
    const s = fixture({ members: [['red.mob', 'red.panel']] });
    expect(memberCount(s, s.players[0])).toBe(8);
    expect(countMembersOfColor(s, s.players[0], 'red')).toBe(8);
    expect(defById('red.mob').onGameEnd(contextFor(s), s.players[0])).toBe(8);
  });

  it('Recruit Bonus rewards actual explicit and Now abilities, not a vanilla acquisition', () => {
    const s = fixture({ members: [['red.recruitbonus']], shop: ['red.volunteer', 'echo.evergreen', 'gold.banker'] });
    acquire(s, 'red.volunteer');
    expect(s.players[0].res.red).toBe(0);
    acquire(s, 'echo.evergreen');
    expect(s.players[0].res.green).toBe(3); // ability's two, plus its color reward
    acquire(s, 'gold.banker');
    expect(s.players[0].res.gold).toBe(4); // Now's three, plus one
  });

  it('gifts and ordinary round-start hooks do not pay Recruit Bonus', () => {
    const s = fixture({ members: [['red.recruitbonus'], ['echo.evergreen']] });
    const c = contextFor(s), [p, other] = s.players;
    c.moveMember(other.members[0], other, p);
    expect(p.res.green).toBe(0);
    defById('echo.evergreen').onRoundStart(c, p);
    expect(p.res.green).toBe(2);
  });

  it('Recruiter pays for an active take from a rival, but not a gift', () => {
    const s = fixture({ members: [['red.recruiter'], ['red.volunteer', 'red.twins']] });
    const c = contextFor(s), [p, other] = s.players;
    c.steal(p, other, { uid: uidIn(s, 'red.volunteer', 1) });
    expect(p.res.red).toBe(1);
    c.moveMember(uidIn(s, 'red.twins', 1), other, p);
    expect(p.res.red).toBe(1);
  });

  it('movement penalty applies once per rival outgoing card, never own or same-container movement', () => {
    const s = fixture({ n: 3, members: [['red.movementpenalty', 'red.volunteer'], ['red.twins'], ['gold.banker']] });
    const c = contextFor(s), [p, a, b] = s.players;
    c.swapMembers(p, a.members[0], b.members[0]);
    expect([a.bonus, b.bonus]).toEqual([-1, -1]);
    c.swapMembers(p, p.members[0], p.members[1]);
    expect(p.bonus).toBe(0);
    c.moveMember(uidIn(s, 'red.volunteer', 0), p, a);
    expect([p.bonus, a.bonus]).toEqual([0, -1]);
  });

  it('a stolen Movement Penalty does not punish its own arrival retroactively', () => {
    const s = fixture({ members: [[], ['red.movementpenalty']] });
    contextFor(s).steal(s.players[0], s.players[1], { uid: s.players[1].members[0] });
    expect(s.players[1].bonus).toBe(0);
  });

  it('movement penalty stops at zero without charging future follower gains', () => {
    const s = fixture({ members: [['red.movementpenalty'], ['red.volunteer']], bonus: [0, -1], shop: ['red.twins'] });
    const c = contextFor(s), [p, rival] = s.players;
    expect(c.followers(rival)).toBe(1);
    c.steal(p, rival, { uid: rival.members[0] });
    expect(c.followers(rival)).toBe(0);
    expect(rival.bonus).toBe(-1); // no extra debt while already at zero
    c.recruit(rival, uidIn(s, 'red.twins', 'shop'), { free: true });
    expect(c.followers(rival)).toBe(2); // both printed followers arrive in full
  });

  it('Loyalists blocks both leaders’ swaps, including itself, while theft remains possible', () => {
    const s = fixture({ members: [['red.loyalists', 'red.twins'], ['gold.banker']], shop: ['red.volunteer'] });
    const c = contextFor(s), [p, rival] = s.players;
    expect(c.swapMembers(p, p.members[0], s.shop[0])).toBe(false);
    expect(c.swapMembers(rival, p.members[1], rival.members[0])).toBe(false);
    expect(c.steal(rival, p, { uid: uidIn(s, 'red.twins', 0) })).toBe(1);
  });

  it('Panel promotes another member to Mentor, who recruits the cheapest member, without inherent action red', () => {
    // Merchant (6) promotes to Mentor (8)
    let s = fixture({ members: [['gold.merchant']], shop: ['red.panel', 'red.mentor', 'red.volunteer'] });
    acquire(s, 'red.panel');
    s = resume(s);
    expect(s.pending.options.map(o => o.id)).toContain('promote');
    s = move(s, 'promote');
    const panel = uidIn(s, 'red.panel', 0), host = uidIn(s, 'gold.merchant', 0), mentor = uidIn(s, 'red.mentor', 'shop');
    expect(s.pending.options.every(o => !o.value?.includes(panel))).toBe(true);
    s = move(s, `trade:${host}:${mentor}`);
    // oldest to newest (Cory, 2026-10-22): the promoted Mentor joins the end of the row, after Panel
    expect(s.players[0].members.map(u => s.cards[u].def)).toEqual(['red.panel', 'red.mentor', 'red.volunteer']);
    expect(s.players[0].res.red).toBe(0);
    expect(s.shop).toContain(host);
  });
});
