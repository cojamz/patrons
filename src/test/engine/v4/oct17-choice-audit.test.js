// @vitest-environment node
// Reported misclicks: follow real options into their board models and resulting engine state.
import { describe, it, expect } from 'vitest';
import { sceneQ, buy } from './cards-helpers.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { cardDef, contextFor } from '../../../engine/v4/core.js';
import { stripFor } from '../../../v4/game/faces/token-art.js';
import { boardPicker, giftPick } from '../../../v4/game/boardPick.js';
import { chooseGreedyMove } from '../../../engine/v4/bots.js';
import { quadrant } from '../../../engine/v4/content/index.js';

const rich = { gold: 30, red: 30, purple: 30, green: 30 };
describe('October 17 reported choices', () => {
  it('Shake Down artwork and real member targets agree at the 5-cost limit', () => {
    const restore = pinCosts({ 'red.twins': [2, 3], 'red.intern': [4, 2] });
    try {
      const s = take(sceneQ({ quadrants: ['gold', 'red', 'thieves', 'green'], round: 2,
        members: [[], ['red.twins', 'red.intern']] }), 'thieves.ransom');
      const action = quadrant('thieves').actions.find(a => a.key === 'ransom');
      const printed = Number(stripFor('thieves', action).flat().find(x => x.startsWith('tag:≤')).slice(5));
      const legal = s.pending.options.map(o => o.value);
      expect(printed).toBe(5);
      expect(legal).toContain(uidOf(s, 'red.twins', 1));
      expect(legal).not.toContain(uidOf(s, 'red.intern', 1));
      expect(legal.every(uid => { const d = cardDef(s, uid); return d.s + d.w <= printed; })).toBe(true);
      const pk = boardPicker(s, s.pending);
      expect(pk.cards.size).toBe(0);
      expect(pk.seats[1].members[uidOf(s, 'red.twins', 1)]).toBeTruthy();
    } finally { restore(); }
  });

  it('Good Deed color/rival choices map to that exact recipient and color, with no payment', () => {
    const s = take(sceneQ({ quadrants: ['gold', 'red', 'silver', 'green'], n: 3 }), 'silver.alms');
    expect(s.players[0].res.silver).toBe(4);
    for (const color of s.resources) {
      const g = giftPick(s, s.pending, color);
      expect(g.kind).toBe('give');
      expect(g.n).toBe(2);
      expect(g.seconds.map(x => x.b)).toEqual([1, 2]);
      for (const { o, b } of g.seconds) {
        const next = move(s, o.id);
        expect(next.players[0].res.silver).toBe(4);
        expect(next.players[b].res[color]).toBe(2);
        expect(next.players[b === 1 ? 2 : 1].res[color]).toBe(0);
      }
    }
  });

  it('Go-Getter bought after your last scheduled placement remains usable when the board has room', () => {
    let s = take(sceneQ({ quadrants: ['gold', 'red', 'purple', 'green'], round: 2, left: 1,
      res: [rich], shop: ['purple.secondwind'], queue: [{ t: 'turn', p: 0 }, { t: 'allPlaced' }] }), 'purple.hourly');
    s = buy(s, 'purple.secondwind');
    const uid = uidOf(s, 'purple.secondwind', 0);
    expect(s.players[0].left).toBe(0);
    expect(s.pending.afterPurchase).toBe(true);
    expect(s.pending.options.every(o => ['use', 'pass'].includes(o.kind))).toBe(true);
    expect(s.pending.options.some(o => o.id === `use:${uid}`)).toBe(true);
    s = JSON.parse(JSON.stringify(s));
    const botMove = chooseGreedyMove(s, () => 0.3);
    expect(s.pending.options.some(o => o.id === botMove.option)).toBe(true);
    s = move(s, `use:${uid}`);
    expect(s.cards[uid].used).toBe(true);
    expect(s.players[0].left).toBe(1);
    expect(s.pending.kind).toBe('place');
    expect(s.pending.player).toBe(0);
    expect(s.pending.options.some(o => o.id === `use:${uid}`)).toBe(false);
  });
  it('post-purchase Done ends the turn without a second purchase or forced activation', () => {
    let s = take(sceneQ({ quadrants: ['gold', 'red', 'purple', 'green'], round: 2, left: 1,
      res: [rich], shop: ['purple.secondwind'], queue: [{ t: 'turn', p: 0 }, { t: 'allPlaced' }] }), 'purple.hourly');
    s = buy(s, 'purple.secondwind');
    const uid = uidOf(s, 'purple.secondwind', 0);
    const paid = { ...s.players[0].res };
    s = move(s, 'pass');
    expect(s.pending).toBe(null);
    expect(s.players[0].res).toEqual(paid);
    expect(s.cards[uid].used).not.toBe(true);
    expect(s.players[0].turnBuys).toBe(1);
  });
  it('does not offer an unusable Go-Getter activation when the board is full', () => {
    const qs = ['gold', 'red', 'purple', 'green'], slots = {};
    qs.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => {
      if (a.ring <= 2 && !(qid === 'purple' && a.key === 'hourly')) slots[`${q}-${i}`] = 1;
    }));
    let s = take(sceneQ({ quadrants: qs, round: 2, left: 1, slots,
      res: [rich], shop: ['purple.secondwind'], queue: [{ t: 'turn', p: 0 }, { t: 'allPlaced' }] }), 'purple.hourly');
    s = buy(s, 'purple.secondwind');
    expect(s.pending).toBe(null);
    expect(s.cards[uidOf(s, 'purple.secondwind', 0)].used).not.toBe(true);
    expect(s.players[0].left).toBe(0);
  });

  it('Extortionist triggers for a purchase of 5 followers, never 4 or the owner’s own purchase', () => {
    const s = sceneQ({ quadrants: ['gold', 'red', 'thieves', 'green'],
      res: [{ magenta: 8 }, {}], members: [[], ['thieves.extortionist']] });
    const ctx = contextFor(s), owner = s.players[1], buyer = s.players[0];
    const def = quadrant('thieves').members.find(m => m.key === 'extortionist');
    def.onBuyFollowers(ctx, owner, null, buyer, { get: 4 });
    expect(owner.res.magenta).toBe(0);
    def.onBuyFollowers(ctx, owner, null, owner, { get: 5 });
    expect(owner.res.magenta).toBe(0);
    def.onBuyFollowers(ctx, owner, null, buyer, { get: 5 });
    expect(owner.res.magenta).toBe(2);
    expect(buyer.res.magenta).toBe(6);
    expect(def.text).toContain('buys 5 or more followers');
  });

  it('Cutpurse offers every held color of the richest eligible rival and steals the chosen one', () => {
    const s = sceneQ({ quadrants: ['gold', 'red', 'thieves', 'green'], n: 3,
      res: [{}, { red: 4, gold: 1 }, { green: 3 }], members: [['thieves.cutpurse']],
      queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.player).toBe(0);
    expect(s.pending.options.map(o => o.id).sort()).toEqual(['take:1:gold', 'take:1:red']);
    const next = move(s, 'take:1:gold');
    expect(next.players[0].res.gold).toBe(1);
    expect(next.players[0].res.magenta).toBe(0);
    expect(next.players[1].res.gold).toBe(0);
    expect(next.players[1].res.red).toBe(4);
    expect(next.players[2].res.green).toBe(3);
    expect(next.log.some(l => l.includes('Cutpurse stole 1 (1 gold from P2)'))).toBe(true);
  });

});
