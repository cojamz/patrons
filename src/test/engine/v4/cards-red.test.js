// @vitest-environment node
// Card-by-card: every Red action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { followers, memberCount, resume } from '../../../engine/v4/core.js';
import { defById } from '../../../engine/v4/content/index.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming, settle } from './cards-helpers.js';

const named = (s, name) => linesNaming(s.log, name);
const R = (s, i = 0) => s.players[i].res;
const rich = { gold: 30, red: 30, blue: 30, green: 30 };
const cost = id => defById(id).s + defById(id).w;

describe('Red actions', () => {
  it('Scout: +2 red, and the face-up member you pick goes to the bottom of the pile', () => {
    let s = take(sceneQ({ shop: ['gold.banker'] }), 'Scout');
    const u = uidOf(s, 'gold.banker', 'shop');
    s = move(s, `card:${u}`);
    expect(R(s).red).toBe(2);
    expect(s.pile.at(-1)).toBe(u);
    expect(s.shop).toHaveLength(6);
  });
  it('Turnout: +1 red per member recruited this round by anyone', () => {
    const s = sceneQ({});
    s.recruits = 3;
    expect(R(take(s, 'Turnout')).red).toBe(3);
  });
  it('Hire / Hire Up / Take: free recruits (cheapest, cheapest +2 red, any)', () => {
    let s = settle(take(sceneQ({}), 'Hire'));
    expect(s.players[0].members).toHaveLength(1);
    const min = Math.min(...s.shop.map(u => cost(s.cards[u].def)), cost(s.cards[s.players[0].members[0]].def));
    expect(cost(s.cards[s.players[0].members[0]].def)).toBe(min);
    s = take(sceneQ({ round: 2 }), 'Hire Up');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(R(s).red).toBe(2);
    expect(s.players[0].members).toHaveLength(1);
    s = take(sceneQ({ round: 3, shop: ['gold.tycoon'] }), 'Take');
    s = move(s, `card:${uidOf(s, 'gold.tycoon', 'shop')}`);
    expect(s.players[0].res.gold).toBe(0); // free
    expect(s.cards[s.players[0].members[0]].def).toBe('gold.tycoon');
  });
  it('Trade: swap one of yours for a rival’s costing no more than yours +2', () => {
    const restore = pinCosts({ 'red.intern': [1, 0], 'gold.banker': [2, 1], 'gold.tycoon': [3, 3] });
    try {
      let s = take(sceneQ({ round: 2, members: [['red.intern'], ['gold.banker', 'gold.tycoon']] }), 'Trade');
      const ids = s.pending.options.map(o => o.label);
      expect(ids).toEqual(['Intern → P2\'s Banker']); // Tycoon costs 6 > 1 + 2
      s = move(s, s.pending.options[0].id);
      expect(s.cards[s.players[0].members[0]].def).toBe('gold.banker');
      expect(s.cards[s.players[1].members.at(-1)].def).toBe('red.intern');
    } finally { restore(); }
  });
});

describe('Red members', () => {
  it('Mentor & Protégé: when recruited, also the cheapest face-up member free; the log names Mentor', () => {
    let s = sceneQ({ res: [rich], shop: ['red.mentor'] });
    s = take(s, 'Rush'); s = buy(s, 'red.mentor');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(s.players[0].members).toHaveLength(2);
    expect(named(s, 'Mentor & Protégé')).toHaveLength(1);
  });
  it('Mentor × Recruiter × Recruiting Drive: the free protégé is a second recruit this turn', () => {
    let s = sceneQ({ res: [rich], members: [['red.recruiter', 'red.drive']], shop: ['red.mentor'] });
    s = take(s, 'Rush');
    s = buy(s, 'red.mentor');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    // Recruiter +1 per recruit (2), Drive +2 on the second
    expect(named(s, 'Recruiter')).toHaveLength(2);
    expect(named(s, 'Recruiting Drive')).toHaveLength(1);
  });

  it('Proselytizer: +1 follower whenever you recruit (not itself), named; a free Hire counts', () => {
    let s = sceneQ({ members: [['red.proselytizer']] });
    const f0 = followers(s, s.players[0]);
    s = settle(take(s, 'Hire'));
    expect(followers(s, s.players[0])).toBe(f0 + 1 + defById(s.cards[s.players[0].members[1]].def).f);
    expect(named(s, 'Proselytizer')[0]).toMatch(/P1's Proselytizer: \+1 follower/);
  });

  it('Mob: game end +1 follower per red member; a Doppelganger is a red member and a second Mob', () => {
    let s = sceneQ({ members: [['red.mob', 'red.intern', 'red.doppel']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Mob +3']);
    s = sceneQ({ members: [['red.mob', 'red.intern', 'red.doppel']], queue: [] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'red.mob';
    s.queue = [{ t: 'finish' }]; s = resume(s);
    expect(s.players[0].final.parts).toEqual(['Mob +3', 'Mob +3']);
  });

  it('Recruiter: +1 red whenever you recruit, named', () => {
    const s = settle(take(sceneQ({ members: [['red.recruiter']] }), 'Hire'));
    expect(R(s).red).toBe(1);
    expect(named(s, 'Recruiter')).toHaveLength(1);
  });

  it('Recruiting Drive: the second recruit in one turn pays +2 red at once, named; Big Spender makes it two buys', () => {
    const restore = pinCosts({ 'red.intern': [0, 0] });
    let s = sceneQ({ res: [rich], members: [['red.drive', 'benders.bigspender']], shop: ['red.intern', 'red.volunteer'] });
    s = take(s, 'Rush');
    const r0 = R(s).red;
    s = buy(s, 'red.volunteer'); // free
    s = buy(s, 'red.intern');
    expect(named(s, 'Recruiting Drive')).toHaveLength(1);
    expect(named(s, 'Big Spender')).toHaveLength(1);
    expect(R(s).red).toBe(r0 + 2);
    restore();
  });

  it('Host: at round start, +1 red per 2 members, named; a Doppelganger copy pays again', () => {
    let s = sceneQ({ members: [['red.host', 'red.intern', 'red.twins', 'red.volunteer']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).red).toBe(2);
    expect(named(s, 'Host')[0]).toMatch(/P1's Host: \+2 red/);
    s = sceneQ({ members: [['red.host', 'red.intern', 'red.doppel']], queue: [] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'red.host';
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(R(s).red).toBe(2);
  });

  it('Sponsor: your members cost 2 less, said in the recruit line; stacks with Discount', () => {
    const restore = pinCosts({ 'gold.tycoon': [3, 4] });
    try {
      let s = sceneQ({ res: [{ gold: 1 }], members: [['red.sponsor']], shop: ['gold.tycoon'] });
      s = take(s, 'Discount'); // 4 + Sponsor 2 = 6 off 7
      s = buy(s, 'gold.tycoon');
      expect(s.players[0].res.gold).toBe(0);
      expect(named(s, 'Sponsor')[0]).toMatch(/Sponsor saves 2/);
    } finally { restore(); }
  });

  it('Crowd-Pleaser: +1 red whenever you buy followers, named; a rival’s Tax Collector fires on the same buy', () => {
    let s = sceneQ({ res: [rich], members: [['red.crowd'], ['gold.taxman']] });
    s = take(s, 'Rush'); s = move(s, 'tier:small');
    expect(named(s, 'Crowd-Pleaser')).toHaveLength(1);
    expect(named(s, 'Tax Collector')).toHaveLength(1);
  });

  it('Doppelganger: copies one of your members; the copy is named in the log', () => {
    let s = sceneQ({ res: [rich], members: [['gold.banker']], shop: ['red.doppel'] });
    s = take(s, 'Rush'); s = buy(s, 'red.doppel');
    s = move(s, s.pending.options[0].id);
    expect(named(s, 'Doppelganger')[0]).toMatch(/copies Banker/);
    s.queue = [{ t: 'round', r: 2 }]; s.pending = null; s = resume(s);
    expect(named(s, 'Banker')).toHaveLength(2);
  });
  it('Doppelganger copying a when-recruited member (Seed Money) gets nothing more (current reading; see ledger)', () => {
    const restore = pinCosts({ 'red.doppel': [0, 0] });
    let s = sceneQ({ res: [rich], members: [['gold.seed']], shop: ['red.doppel'] });
    s = take(s, 'Rush');
    const g = s.players[0].res.gold;
    s = buy(s, 'red.doppel');
    s = move(s, s.pending.options[0].id);
    expect(s.players[0].res.gold).toBe(g); // no Seed Money payout
    expect(named(s, 'Seed Money')).toHaveLength(0);
    restore();
  });

  it('Patriarch: game end +1 follower per 2 members (a Twins is one member)', () => {
    const s = sceneQ({ members: [['red.patriarch', 'red.twins', 'red.intern']], queue: [{ t: 'finish' }] });
    expect(memberCount(s, s.players[0])).toBe(3);
    expect(s.players[0].final.parts).toEqual(['Patriarch +1']);
  });
});
