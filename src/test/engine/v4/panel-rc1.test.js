// @vitest-environment node
// RC1 panel (design/eval/panel-rc1-triage.md items 11–14, 19): each finding reproduced on a seeded scene first,
// then pinned. Who asked names every choice; one price rule for every recruit; the "you'd get" preview gives the
// real number and says why; a counted pick keeps its count through a save and load.
import { describe, it, expect } from 'vitest';
import * as core from '../../../engine/v4/core.js';
import { previewSpace } from '../../../engine/v4/preview.js';
import { sceneQ, buy } from './cards-helpers.js';
import { take, move, uidOf, pinCosts } from './helpers.js';

const { applyMove, paymentPlan, paymentChoices } = core;
const memberPrice = (...a) => core.memberPrice(...a);
import { payBreakdown } from '../../../v4/game/cards.js';

const CLASSIC = ['gold', 'red', 'market', 'echo'];
const rich = { gold: 30, red: 30, blue: 30, green: 30 };
/** Face-up row exactly `defs` (in order), and the pile exactly `pile`: nothing random refills in. */
function row(s, defs, pile = []) {
  const all = [...s.shop, ...s.pile];
  const grab = def => { const k = all.findIndex(u => s.cards[u].def === def); if (k < 0) { if (!STRAYS.has(def)) throw new Error(`no free ${def}`); return stray(s, def); } return all.splice(k, 1)[0]; };
  s.shop = defs.map(grab);
  s.pile = pile.map(grab);
  return s;
}

describe('11 · every choice names the card or space that asked', () => {
  it('Mentor & Protégé’s free pick among tied cheapest members says Mentor & Protégé, not Open Door', () => {
    let s = sceneQ({ quadrants: CLASSIC, res: [rich] });
    row(s, ['red.mentor', 'red.intern', 'red.reserve'], ['red.patriarch']);
    s = take(s, 'gold.rush');
    s = buy(s, 'red.mentor');
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.prompt).toMatch(/^Mentor & Protégé: /);
  });
  it('Open Door still says Open Door', () => {
    let s = sceneQ({ quadrants: CLASSIC });
    row(s, ['red.intern', 'red.reserve', 'red.patriarch']);
    s = take(s, 'red.hire');
    expect(s.pending.prompt).toMatch(/^Open Door: /);
  });
  it('a copy’s free member names the copier (Encore copying Open Door), not a bare "Copy:"', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 2, round: 2, queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }] });
    row(s, ['red.intern', 'red.patriarch', 'red.mob'], ['red.sponsor', 'red.reserve']);
    s = take(s, 'red.hire'); // P2 takes Open Door: Intern (1), free
    while (s.pending && s.pending.player === 1) s = move(s, 'pass');
    s = take(s, 'echo.encore');
    s = move(s, s.pending.options.find(o => o.label.startsWith('Open Door')).id);
    expect(s.pending.prompt).toMatch(/^Encore: /);
  });
});

describe('12 · one price rule for every recruit', () => {
  it('Talent Scout offers Underdog when Penny Pincher makes it affordable (2 gold count as 4, plus 2 blue)', () => {
    const restore = pinCosts({ 'gold.underdog': [4, 2] }); // the price this case was written at (Underdog is 8 since 2026-10-15)
    try {
    let s = sceneQ({ quadrants: CLASSIC, res: [{ gold: 2, blue: 2 }], members: [['gold.thrift', 'market.blackmarket']] });
    row(s, ['red.patriarch', 'red.mob'], ['gold.underdog']);
    s = move(s, `use:${uidOf(s, 'market.blackmarket', 0)}`);
    const ud = uidOf(s, 'gold.underdog', 'pile');
    expect(paymentPlan(s, s.players[0], ud)).not.toBeNull();
    expect(s.pending.options.map(o => o.value)).toContain(ud);
    s = move(s, `card:${ud}`);
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(s.players[0].members).toContain(ud);
    expect(s.players[0].res).toMatchObject({ gold: 0, blue: 0 });
    } finally { restore(); }
  });
  it('Talent Scout uses (and spends) an Intro Offer discount', () => {
    const restore = pinCosts({ 'gold.underdog': [4, 2] }); // the price this case was written at (Underdog is 8 since 2026-10-15)
    try {
    let s = sceneQ({ quadrants: CLASSIC, res: [{ red: 2, blue: 2 }], discount: [4], members: [['market.blackmarket']] });
    row(s, ['red.patriarch'], ['gold.underdog', 'red.mob']);
    s = move(s, `use:${uidOf(s, 'market.blackmarket', 0)}`); // 4 in all; Underdog costs 6, 2 after the discount
    const ud = uidOf(s, 'gold.underdog', 'pile');
    expect(s.pending.options.map(o => o.value)).toContain(ud);
    s = move(s, `card:${ud}`);
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(s.players[0].members).toContain(ud);
    expect(s.players[0].discount).toBe(0);
    const left = Object.values(s.players[0].res).reduce((a, b) => a + b, 0);
    expect(left).toBe(2);
    } finally { restore(); }
  });
  it('memberPrice: the exact price after Intro Offer, and the shortfall by color', () => {
    const s = sceneQ({ quadrants: CLASSIC, res: [{ gold: 2 }], discount: [4] });
    row(s, ['gold.jackpot']); // Lottery Winner: 6 gold + 4 any
    const p = s.players[0], u = s.shop[0];
    const pr = memberPrice(s, p, u);
    expect(pr).toMatchObject({ color: 'gold', colored: 2, total: 6, afford: false });
    expect(pr.short).toMatchObject({ gold: 0, any: 4, total: 4 });
    expect(pr.short.text).toBe('4 any');
    // the old hover read "need 8 more": it ignored the discount
    expect(payBreakdown(s, p, u).short.total).toBe(4);
  });
  it('memberPrice: "need 1 green" names Busker’s new colored price; "2 gold, 1 any" splits it', () => {
    const s = sceneQ({ quadrants: CLASSIC, res: [{ gold: 15 }] });
    row(s, ['echo.evergreen', 'gold.jackpot']);
    const p = s.players[0];
    expect(memberPrice(s, p, s.shop[0]).short.text).toBe('1 green');
    p.res = { gold: 4, red: 3, blue: 0, green: 0 };
    expect(memberPrice(s, p, s.shop[1]).short.text).toBe('2 gold, 1 any');
  });
  it('the buy step, the pay choices and memberPrice agree on every face-up card, with every rule-changer', () => {
    const tries = [
      { members: [['gold.thrift']], res: [{ gold: 3, red: 1 }] },
      { members: [['red.sponsor']], res: [{ gold: 2, blue: 3 }] },
      { members: [['gold.thrift', 'red.sponsor']], res: [{ gold: 2, green: 1 }], discount: [4] },
      { members: [[]], res: [{ red: 4, blue: 2 }], discount: [4] },
    ];
    for (const t of tries) {
      let s = sceneQ({ quadrants: CLASSIC, ...t });
      s = take(s, 'gold.discount');
      const p = s.players[0];
      for (const u of s.shop) {
        const pr = memberPrice(s, p, u);
        expect(!!paymentPlan(s, p, u), s.cards[u].def).toBe(pr.afford);
        expect(paymentChoices(s, p, u).length > 0, s.cards[u].def).toBe(pr.afford);
        expect(s.pending.options.some(o => o.uid === u), s.cards[u].def).toBe(pr.afford);
      }
    }
  });
  it('Penny Pincher: 2 gold pay a 3-gold-plus-1 member (the spare half counts toward the rest)', () => {
    const restore = pinCosts({ 'gold.underdog': [3, 1] });
    try {
      const s = sceneQ({ quadrants: CLASSIC, res: [{ gold: 2 }], members: [['gold.thrift']] });
      row(s, ['gold.underdog']);
      const p = s.players[0];
      expect(memberPrice(s, p, s.shop[0]).afford).toBe(true);
      expect(paymentPlan(s, p, s.shop[0])).toMatchObject({ gold: 2 });
    } finally { restore(); }
  });
});

describe('13 · Hand-pick’s preview never offers last round’s spaces as copies', () => {
  // Hand-pick became Red's Recruit a Member (v0.8.0): the same round-III free recruit of a face-up member
  it('in round III before any placement, Recruit a Member (with Sleepwalker face up) shows no "can copy"', () => {
    const s = sceneQ({ quadrants: CLASSIC, round: 3, res: [rich] });
    row(s, ['echo.afterimage', 'red.intern'], ['red.mob']);
    // P1's round-II spaces, as the copy ledger kept them
    s.echo = { round: 2, now: {
      '0-1': { key: '0-1', p: 0, ring: 1, name: 'Golden Years', color: 'gold', idx: 1, echo: false, res: { gold: 4 }, discount: 0, members: [], seq: 1 },
      '0-4': { key: '0-4', p: 0, ring: 2, name: 'Tithe', color: 'gold', idx: 4, echo: false, res: { gold: 5 }, discount: 0, members: [], seq: 2 },
    }, last: {}, open: null };
    const handpick = s.pending.options.find(o => o.label === 'Recruit a Member');
    const pv = previewSpace(s, 0, handpick.q, handpick.i);
    expect(pv).not.toBeNull();
    expect(pv.copies).toBeNull();
  });
  it('Echo still lists the spaces it can copy', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 2, queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }] });
    s = take(s, 'gold.rush');
    while (s.pending && s.pending.player === 1) s = move(s, 'pass');
    const echo = s.pending.options.find(o => o.label === 'Echo');
    expect(previewSpace(s, 0, echo.q, echo.i).copies).toEqual(['0-1']);
  });
});

describe('14 · Underdog vs Hustler: the preview gives the real number and says why', () => {
  const setup = gold => {
    const s = sceneQ({ quadrants: CLASSIC, round: 3, res: [{ gold }, { gold: 11 }], members: [['gold.underdog', 'gold.hustler']] });
    s.cards[uidOf(s, 'gold.hustler', 0)].color = 'gold';
    return s;
  };
  const kick = s => s.pending.options.find(o => o.label === 'Kickback');
  it('9 gold vs 11: Hustler’s +3 lands first, so no ×2; the preview says +6 and why', () => {
    const s = setup(9);
    const k = kick(s);
    const pv = previewSpace(s, 0, k.q, k.i);
    let t = applyMove(s, { player: 0, option: k.id });
    t = move(t, t.pending.options[0].id);
    expect(t.players[0].res.gold - 9).toBe(6);
    expect(pv.you.res.gold).toEqual([6, 6]);
    expect(pv.reasons).toContain('Underdog: no ×2 (Hustler’s +3 lands first)');
    expect(pv.reasons).toContain('Hustler: +3 gold');
  });
  it('5 gold vs 11: still behind after Hustler, so ×2; the preview says +9 and names Underdog', () => {
    const s = setup(5);
    const k = kick(s);
    const pv = previewSpace(s, 0, k.q, k.i);
    expect(pv.you.res.gold).toEqual([9, 9]);
    expect(pv.reasons).toContain('Underdog: gold gain 3 → 6');
  });
  it('nobody richer at all: Underdog says why it stays off', () => {
    const s = setup(20);
    const k = kick(s);
    const pv = previewSpace(s, 0, k.q, k.i);
    expect(pv.reasons.some(r => /^Underdog: no ×2 \(no one has more gold/.test(r))).toBe(true);
  });
});

describe('19 · Collect Debts keeps its count through a save and load', () => {
  it('pending.count says 1 of 3 taken after a JSON round trip', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 3, round: 2, res: [{}, { gold: 1 }, { gold: 5 }] });
    s = take(s, 'gold.steal');
    expect(s.pending.count).toEqual({ of: 3, left: 3 });
    s = move(s, 'player:2');
    const loaded = JSON.parse(JSON.stringify(s));
    expect(loaded.pending.count).toEqual({ of: 3, left: 2 });
    expect(loaded.pending.options.find(o => o.id === 'player:1').label).toBe('P2 · 1 gold');
  });
});

// The online gate stalled on a Snap Up pay choice (a seat in round III, 2026-10-15). Snap Up is gone (Blue's Oct 20
// rework); Talent Scout keeps that off-buy recruit path, so drive Talent Scout → pay to the end
// with Penny Pincher and an Intro Offer, by the bot and by the first option, also through a JSON save (the online
// session stores stateJson), and check every offered pay option is legal and finishes.
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { STRAYS, stray } from './stray.js';
const json = v => JSON.parse(JSON.stringify(v)); // the online session stores the state as a JSON string
describe('Talent Scout → pay always finishes', () => {
  const start = (extra = {}) => {
    const s = sceneQ({ quadrants: CLASSIC, round: 3, res: [{ gold: 3, red: 2, green: 2, blue: 2 }], members: [['gold.thrift', 'market.blackmarket']], discount: [4], ...extra });
    row(s, ['red.mob', 'red.intern'], ['gold.underdog', 'red.patriarch', 'gold.jackpot', 'red.sponsor', 'echo.evergreen']);
    return move(s, `use:${uidOf(s, 'market.blackmarket', 0)}`);
  };
  const finish = (s, pickFn, save = x => x) => {
    let guard = 0;
    while (s.pending && s.pending.kind === 'choose' && s.pending.player === 0 && guard++ < 10) {
      const m = pickFn(s);
      expect(core.isLegal(s, m)).toBe(true);
      s = save(applyMove(save(s), m));
    }
    expect(s.pending?.kind === 'choose' && s.pending.player === 0).toBe(false);
    return s;
  };
  it('every member and every pay option completes (first option, each option, bot), JSON saves too', () => {
    const s0 = start();
    const members = s0.pending.options.filter(o => o.kind === 'card');
    expect(members.length).toBeGreaterThan(1);
    for (const save of [x => x, json]) for (const mo of members) {
      const s1 = save(applyMove(save(s0), { player: 0, option: mo.id }));
      const pays = s1.pending?.kind === 'choose' && s1.pending.player === 0 ? s1.pending.options : [null];
      for (const po of pays) {
        const s2 = po ? save(applyMove(s1, { player: 0, option: po.id })) : s1;
        expect(s2.players[0].members).toContain(mo.value);
        expect(Object.values(s2.players[0].res).every(n => n >= 0)).toBe(true);
      }
    }
    for (const save of [x => x, json]) {
      finish(start(), s => ({ player: 0, option: s.pending.options[0].id }), save);
      finish(start(), s => chooseBotMove(s, () => 0.5, { level: 'normal' }), save);
      finish(start(), s => chooseBotMove(s, () => 0.5, { level: 'easy' }), save);
      expect(start().pending.options.at(-1).id).toBe('none');
      const s = finish(start(), () => ({ player: 0, option: 'none' }), save);
      expect(s.players[0].members.length).toBe(2);
    }
  });
});
