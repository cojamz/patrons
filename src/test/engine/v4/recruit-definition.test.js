// @vitest-environment node
// Recruit, Cory's definition (decisions.md, 2026-10-21): bringing a member or followers into your cult by your own
// doing. "Whenever you recruit" fires on a member you take (shop, free, a steal), a member your own red swap brings in,
// and each follower purchase; never on a member a rival's action moves into your cult. A member's own "When recruited"
// fires when it joins by your doing, not when a rival forces it on you.
import { describe, expect, it } from 'vitest';
import { contextFor, resume } from '../../../engine/v4/core.js';
import { table, uidIn } from './cards-helpers-b.js';
import { move } from './helpers.js';

const Q = ['red', 'yellow', 'gold', 'thieves'];
const fixture = opts => { const s = table(Q, opts); s.queue = []; s.pending = null; return s; };
/** P(i)'s buy step, then recruit the 1-for-1 followers (auto-paid). */
const buyOne = (s, i = 0) => { s.queue = [{ t: 'buy', p: i }]; s.current = i; return move(resume(s), 'tier:small'); };
const colors = (s, i) => s.resources.map(r => s.players[i].res[r]);

describe('Recruiter ("Whenever you add a member to your cult, +1 red") counts members you bring in', () => {
  it('a member taken from the shop is a recruit', () => {
    const s = fixture({ members: [['red.recruiter']], shop: ['red.volunteer'] });
    contextFor(s).recruit(s.players[0], uidIn(s, 'red.volunteer', 'shop'), { free: true });
    expect(s.players[0].res.red).toBe(1);
  });

  it('a member you swap into your cult with a red action is a recruit, once per member that came in', () => {
    const s = fixture({ members: [['red.recruiter', 'red.twins']], shop: ['red.volunteer'] });
    const p = s.players[0];
    expect(contextFor(s).swapMembers(p, uidIn(s, 'red.twins', 0), uidIn(s, 'red.volunteer', 'shop'))).toBe(true);
    expect(p.res.red).toBe(1);
  });

  it('a follower purchase adds no member, so it pays nothing (Cory, 2026-10-29)', () => {
    let s = fixture({ members: [['red.recruiter']], res: [{ gold: 3 }] });
    s = buyOne(s);
    expect(s.players[0].bonus).toBe(1);
    expect(s.players[0].res.red || 0).toBe(0);
  });

  it('a member a rival moves into your cult is not your recruit', () => {
    const s = fixture({ members: [['red.recruiter', 'red.twins'], ['red.volunteer']] });
    const [p, rival] = s.players;
    // the rival's own red swap: your Twins for their Volunteer
    expect(contextFor(s).swapMembers(rival, uidIn(s, 'red.twins', 0), uidIn(s, 'red.volunteer', 1))).toBe(true);
    expect(p.members).toContain(uidIn(s, 'red.volunteer', 0));
    expect(p.res.red).toBe(0);
    // and a member a rival hands you
    contextFor(s).moveMember(uidIn(s, 'red.twins', 1), rival, p);
    expect(p.res.red).toBe(0);
  });

  it('a rival buying followers is not your recruit', () => {
    let s = fixture({ members: [['red.recruiter']], res: [{}, { gold: 3 }] });
    s = buyOne(s, 1);
    expect(s.players[1].bonus).toBe(1);
    expect(s.players[0].res.red).toBe(0);
  });
});

describe('the other "whenever you recruit" members fire on follower purchases too', () => {
  it('Proselytizer: +1 follower on a follower purchase', () => {
    let s = fixture({ members: [['red.proselytizer']], res: [{ gold: 3 }] });
    s = buyOne(s);
    expect(s.players[0].bonus).toBe(2);
  });

  it('Shoplifter: steals 1 resource on a follower purchase', () => {
    let s = fixture({ members: [['thieves.shoplifter']], res: [{ gold: 3 }, { yellow: 2 }] });
    s = buyOne(s);
    while (s.pending && s.pending.player === 0 && s.pending.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(s.players[1].res.yellow).toBe(1);
    expect(s.players[0].res.yellow).toBe(1);
  });

  it('cards that name a member stay members-only: Pied Piper counts members, Middleman a non-gold member', () => {
    let s = fixture({ members: [['red.drive', 'gold.coinpurse']], res: [{ gold: 3 }], shop: ['red.volunteer'] });
    s.current = 0;
    contextFor(s).recruit(s.players[0], uidIn(s, 'red.volunteer', 'shop'), { free: true });
    expect(s.players[0].res.gold).toBe(4); // Middleman's +1 for the Volunteer
    s = buyOne(s);
    expect(s.players[0].res.red).toBe(0); // one member and one follower purchase: not "2 or more members"
    expect(s.players[0].res.gold).toBe(3); // paid 1, no Middleman gold for followers
  });
});

describe('Pilgrim ("When recruited: +1 of each color") fires when it joins by your doing', () => {
  it('taken from the shop', () => {
    const s = fixture({ shop: ['yellow.pilgrim'] });
    contextFor(s).recruit(s.players[0], uidIn(s, 'yellow.pilgrim', 'shop'), { free: true });
    expect(colors(s, 0)).toEqual([1, 1, 1, 1]);
  });

  it('stolen from a rival', () => {
    const s = fixture({ members: [[], ['yellow.pilgrim']] });
    contextFor(s).steal(s.players[0], s.players[1], { uid: uidIn(s, 'yellow.pilgrim', 1) });
    expect(colors(s, 0)).toEqual([1, 1, 1, 1]);
  });

  it('swapped in with your own red action', () => {
    const s = fixture({ members: [['red.twins']], shop: ['yellow.pilgrim'] });
    contextFor(s).swapMembers(s.players[0], uidIn(s, 'red.twins', 0), uidIn(s, 'yellow.pilgrim', 'shop'));
    expect(colors(s, 0)).toEqual([1, 1, 1, 1]);
  });

  it('not when a rival forces it on you, by their swap or a hand-off', () => {
    const s = fixture({ members: [['red.twins'], ['yellow.pilgrim', 'red.volunteer']] });
    const [p, rival] = s.players;
    contextFor(s).swapMembers(rival, uidIn(s, 'red.twins', 0), uidIn(s, 'yellow.pilgrim', 1));
    expect(p.members).toContain(uidIn(s, 'yellow.pilgrim', 0));
    expect(colors(s, 0)).toEqual([0, 0, 0, 0]);
    contextFor(s).moveMember(uidIn(s, 'red.volunteer', 1), rival, p);
    expect(colors(s, 0)).toEqual([0, 0, 0, 0]);
  });

  it('Recruit Bonus pays for a "When recruited" only when it happens', () => {
    const s = fixture({ members: [['red.recruitbonus', 'red.twins'], ['yellow.pilgrim']], res: [{ gold: 2 }] });
    const [p, rival] = s.players;
    contextFor(s).swapMembers(rival, uidIn(s, 'red.twins', 0), uidIn(s, 'yellow.pilgrim', 1));
    expect(p.res.yellow).toBe(0);
    const t = buyOne(s);
    expect(t.players[0].res.yellow).toBe(0); // a follower purchase has no "When recruited"
  });
});
