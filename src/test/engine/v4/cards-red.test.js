// @vitest-environment node
// Card-by-card: every Red action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { followers, memberCount, resume } from '../../../engine/v4/core.js';
import { defById } from '../../../engine/v4/content/index.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming, settle } from './cards-helpers.js';
import { SHOP_SIZE } from '../../../engine/v4/core.js';

const named = (s, name) => linesNaming(s.log, name);
const R = (s, i = 0) => s.players[i].res;
const rich = { gold: 30, red: 30, blue: 30, green: 30 };
const cost = id => defById(id).s + defById(id).w;

describe('Red action gains', () => {
  it.each([1, 2, 3])('Gather is round %i plus its inherent red, independent of recruit count', round => {
    const s = sceneQ({ round }); s.recruits = 99;
    expect(R(take(s, 'red.turnout')).red).toBe(round + 2);
  });
  it('Walk-In and Recruit a Member give a free member plus their red (Walk-In: +1, each rival +1)', () => {
    for (const [action, round, red, rival] of [['red.hire', 1, 1, 1], ['red.take', 3, 1, 0]]) {
      const s = settle(take(sceneQ({ round, shop: ['red.volunteer'] }), action));
      expect(s.players[0].members).toHaveLength(1);
      expect(R(s).red).toBe(red);
      expect(R(s, 1).red).toBe(rival);
    }
  });
});

describe('Red members', () => {
  it('Mentor & Protégé: when recruited, also the cheapest face-up member free; the log names Mentor', () => {
    let s = sceneQ({ res: [rich], shop: ['red.mentor'] });
    s = take(s, 'gold.rush'); s = buy(s, 'red.mentor');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(s.players[0].members).toHaveLength(2);
    expect(named(s, 'Mentor & Protégé')).toHaveLength(1);
  });
  it('Mentor × Recruiter × Pied Piper: the free protégé is a second recruit this turn', () => {
    let s = sceneQ({ res: [rich], members: [['red.recruiter', 'red.drive']], shop: ['red.mentor'] });
    s = take(s, 'gold.rush');
    s = buy(s, 'red.mentor');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    // Recruiter +1 per recruit (2), Drive +2 on the second
    expect(named(s, 'Recruiter')).toHaveLength(2);
    expect(named(s, 'Pied Piper')).toHaveLength(1);
  });

  it('Proselytizer: +1 follower whenever you recruit (not itself), named; a free Walk-In counts', () => {
    let s = sceneQ({ members: [['red.proselytizer']] });
    const f0 = followers(s, s.players[0]);
    s = settle(take(s, 'red.hire'));
    expect(followers(s, s.players[0])).toBe(f0 + 1 + defById(s.cards[s.players[0].members[1]].def).f);
    expect(named(s, 'Proselytizer')[0]).toMatch(/P1's Proselytizer: \+1 follower/);
  });

  it('Mob: game end +1 follower per red member; a Doppelganger (green since 2026-10-15) is a second Mob', () => {
    let s = sceneQ({ members: [['red.mob', 'red.intern', 'echo.doppel']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Mob +6']);
    s = sceneQ({ members: [['red.mob', 'red.intern', 'echo.doppel']], queue: [] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'red.mob';
    s.queue = [{ t: 'finish' }]; s = resume(s);
    expect(s.players[0].final.parts).toEqual(['Mob +6', 'Mob +6']);
  });

  it('Recruiter: +1 red whenever you recruit, named', () => {
    const s = settle(take(sceneQ({ members: [['red.recruiter']] }), 'red.hire'));
    expect(R(s).red).toBe(2); // Walk-In's +1, Recruiter's +1
    expect(named(s, 'Recruiter')).toHaveLength(1);
  });

  it('Pied Piper: the second recruit in one turn pays +2 red at once, named; Big Spender makes it two buys', () => {
    const restore = pinCosts({ 'red.intern': [0, 0], 'red.volunteer': [0, 0] });
    let s = sceneQ({ res: [rich], members: [['red.drive', 'benders.bigspender1']], shop: ['red.intern', 'red.volunteer'] });
    s = take(s, 'gold.rush');
    const r0 = R(s).red;
    s = buy(s, 'red.volunteer'); // free
    s = buy(s, 'red.intern');
    expect(named(s, 'Pied Piper')).toHaveLength(1);
    expect(named(s, 'Big Spender')).toHaveLength(1);
    expect(R(s).red).toBe(r0 + 2);
    restore();
  });

  it('Host: at round start, +1 red per 2 members, named; a Doppelganger copy pays again', () => {
    let s = sceneQ({ members: [['red.host', 'red.intern', 'red.twins', 'red.volunteer']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).red).toBe(3);
    expect(named(s, 'Host')[0]).toMatch(/P1's Host: \+3 red/);
    s = sceneQ({ members: [['red.host', 'red.intern', 'echo.doppel']], queue: [] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'red.host';
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(R(s).red).toBe(2);
  });

  it('Sponsor: your members cost 2 less, said in the recruit line; stacks with Intro Offer', () => {
    const restore = pinCosts({ 'gold.tycoon': [3, 4] });
    try {
      let s = sceneQ({ res: [{ gold: 1 }], members: [['red.sponsor']], shop: ['gold.tycoon'] });
      s = take(s, 'gold.discount'); // 4 + Sponsor 2 = 6 off 7
      s = buy(s, 'gold.tycoon');
      expect(s.players[0].res.gold).toBe(0);
      expect(named(s, 'Sponsor')[0]).toMatch(/Sponsor saves 2/);
    } finally { restore(); }
  });

  it('Crowd-Pleaser: +1 red whenever you buy followers, named; a rival’s Tax Collector fires on the same buy', () => {
    let s = sceneQ({ res: [rich], members: [['red.crowd'], ['gold.taxman']] });
    s = take(s, 'gold.rush'); s = move(s, 'tier:small');
    expect(named(s, 'Crowd-Pleaser')).toHaveLength(1);
    expect(named(s, 'Tax Collector')).toHaveLength(1);
  });

  it('Doppelganger: copies one of your members; the copy is named in the log', () => {
    let s = sceneQ({ res: [rich], members: [['gold.banker']], shop: ['echo.doppel'] });
    s = take(s, 'gold.rush'); s = buy(s, 'echo.doppel');
    s = move(s, s.pending.options[0].id);
    expect(named(s, 'Doppelganger')[0]).toMatch(/becomes a copy of Banker/);
    expect(named(s, 'Banker')).toHaveLength(1); // the copied Banker's On Recruit (Cory, 2026-10-28)
    s.queue = [{ t: 'round', r: 2 }]; s.pending = null; s = resume(s);
    expect(named(s, 'Banker')).toHaveLength(3);
  });
  it('Doppelganger triggers copied Treasurer’s On Recruit (Cory, 2026-10-28)', () => {
    const restore = pinCosts({ 'echo.doppel': [0, 0] });
    let s = sceneQ({ res: [rich], members: [['gold.seed']], shop: ['echo.doppel'] });
    s = take(s, 'gold.rush');
    const g = s.players[0].res.gold;
    s = buy(s, 'echo.doppel');
    s = move(s, s.pending.options[0].id);
    expect(s.players[0].res.gold).toBe(g + 2);
    expect(named(s, 'Treasurer')).toHaveLength(1);
    restore();
  });

  it('Patriarch: game end +1 follower per 2 members (Triplets counts as three)', () => {
    const s = sceneQ({ members: [['red.patriarch', 'red.twins', 'red.intern']], queue: [{ t: 'finish' }] });
    expect(memberCount(s, s.players[0])).toBe(5);
    expect(s.players[0].final.parts).toEqual(['Patriarch +2']);
  });
});
