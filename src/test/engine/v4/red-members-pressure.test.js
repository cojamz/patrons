// @vitest-environment node
// Bounded, real-choice regressions for the Red acquisition deck and its Green interactions.
import { describe, expect, it } from 'vitest';
import { contextFor, createGame, followers, memberCount, resume } from '../../../engine/v4/core.js';
import { defById, quadrant, EXTRA_WILD } from '../../../engine/v4/content/index.js';
import { previousEntry, previousNow, targets } from '../../../engine/v4/content/echo.js';
import { CUT } from '../../../engine/v4/content/cull.js';
import { memberCopyTargets } from '../../../v4/game/cards.js';
import { table, uidIn } from './cards-helpers-b.js';
import { actionName, move, take } from './helpers.js';

const Q = ['gold', 'red', 'market', 'echo'];
const turns = (...players) => players.map(p => ({ t: 'turn', p }));
const saved = s => JSON.parse(JSON.stringify(s));
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const go = (s, action) => pass(take(s, action));
const pair = (a, b) => `trade:${a}:${b}`;
const copyChoice = (s, action) => s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(`${actionName(action)} (`));

describe('Green exact action targets alongside Red recruitment', () => {
  it.each([1, 2, 3])('Build Up in round %i gives +3/+4/+5 green and its estimate matches the gain', round => {
    const s = table(Q, { round });
    const ctx = contextFor(s), buildUp = quadrant('echo').actions.find(a => a.key === 'chant');
    expect(buildUp.estimate(ctx, s.players[0])).toBe(round + 2);
    const after = take(s, 'echo.chant');
    expect(after.players[0].res.green).toBe(round + 2);
  });

  it('Cover offers only actions with no minion on them and does the chosen one', () => {
    let s = table(Q, { round: 2, left: 5, queue: turns(1, 0) });
    s = go(s, 'gold.rush');
    s = take(s, 'echo.hum');
    expect(s.pending.kind).toBe('choose');
    const labels = s.pending.options.map(o => o.label);
    expect(labels.some(l => l.startsWith(`${actionName('gold.rush')}:`))).toBe(false); // P2's minion is on it
    expect(labels.some(l => l.startsWith('Cover:'))).toBe(false); // P1's minion is on it
    const before = s.players[0].res.green;
    s = pass(move(s, s.pending.options.find(o => o.label.startsWith('Build Up:')).id));
    expect(s.players[0].res.green - before).toBe(4); // Build Up in round II
  });

  it.each([0, 1])('Echo copies the immediately preceding player %i, including your own snake turn', previousPlayer => {
    let s = table(Q, { queue: turns(previousPlayer, 0, 0) });
    s = go(s, 'gold.rush');
    expect(previousEntry(contextFor(s)).p).toBe(previousPlayer);
    expect(previousNow(contextFor(s), s.players[0]).map(e => e.name)).toEqual([actionName('gold.rush')]);
    expect(memberCopyTargets(s, 0, defById('echo.understudy'))).toEqual([previousEntry(contextFor(s)).key]);
    s = take(s, 'echo.echo');
    expect(s.pending.options).toHaveLength(1);
    const target = copyChoice(s, 'gold.rush');
    expect(target).toBeTruthy();
    s = pass(move(saved(s), target.id));
    expect(s.players[0].res.gold).toBe(previousPlayer === 0 ? 4 : 2);
    expect(s.players[0].res.green).toBe(1);
  });

  it('a protected most recent rival action does not fall back to an older own action', () => {
    let s = table(Q, { members: [[], ['echo.agents']], queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush');
    s = go(s, 'echo.chant');
    expect(previousEntry(contextFor(s)).p).toBe(1);
    expect(targets(contextFor(s), s.players[0], 'previous')).toEqual([]);
    expect(memberCopyTargets(s, 0, defById('echo.understudy'))).toEqual([]);
    s = go(s, 'echo.echo');
    expect(s.players[0].res.gold).toBe(2);
    expect(s.players[0].res.green).toBe(1);
    expect(s.pending?.kind).not.toBe('choose');
  });

  // Reprise plays the role Encore had until Oct 28 (Encore now copies a member's On Recruit)
  it('Reprise → Echo chooses the latest placement and cannot fall back past its own chain', () => {
    let s = table(Q, { round: 2, queue: turns(0, 0, 0) });
    s = go(s, 'gold.rush');
    s = take(s, 'echo.echo');
    s = pass(move(s, copyChoice(s, 'gold.rush').id));
    s = take(s, 'echo.refrain');
    s = pass(move(saved(s), copyChoice(s, 'echo.echo').id));
    expect(s.players[0].res.gold).toBeGreaterThanOrEqual(4);
    expect(s.pending?.kind).not.toBe('choose');
  });
});

describe('Red members: bounded acquisition and body invariants', () => {
  it('the normal Red deck contains thirteen approved members, all priced at twelve or less (Mob 12, Cory Oct 24)', () => {
    const s = createGame({ seats: [{}, {}], quadrants: ['red', 'echo'], rules: { cull: true, guests: false } });
    const red = Object.values(s.cards).map(c => defById(c.def)).filter(d => d.quadrant === 'red');
    expect(red.map(d => d.key).sort()).toEqual(['host', 'loyalists', 'mentor', 'mob', 'movementpenalty', 'panel', 'patriarch', 'proselytizer', 'recruitbonus', 'recruiter', 'twins', 'volunteer', 'headhunter'].sort());
    expect(red.every(d => d.s + d.w <= 12 + EXTRA_WILD)).toBe(true); // printed 12 or less, plus the extra wild
    expect(['red.bigfamily', 'red.intern', 'red.drive', 'red.sponsor', 'red.crowd', 'red.reserve'].every(id => CUT.has(id))).toBe(true);
  });

  it('Panel and Mob printed followers also count as members, including Mob itself in its bonus', () => {
    const s = table(Q, { members: [['red.panel', 'red.mob', 'red.twins', 'red.volunteer']] });
    const ctx = contextFor(s), mob = ctx.membersOf(s.players[0]).find(c => c.def.id === 'red.mob');
    expect(memberCount(s, s.players[0])).toBe(12);
    expect(followers(s, s.players[0])).toBe(13); // leader + printed bodies
    expect(mob.def.onGameEnd(ctx, s.players[0], mob)).toBe(12);
  });

  it('Panel save/load retains mode and exact swap targets without inherent action red', () => {
    // Merchant (6) can promote to Mentor (8) but not to Mob (10)
    let s = table(Q, { round: 3, members: [['gold.merchant']], shop: ['red.panel', 'red.mentor', 'red.mob'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'red.panel', 'shop')}`);
    expect(s.pending.prompt).toMatch(/Panel/);
    expect(s.pending.options.map(o => o.id)).toContain('promote');
    const direct = move(s, 'promote'), reload = move(saved(s), 'promote');
    expect(reload).toEqual(direct);
    const panel = uidIn(reload, 'red.panel', 0), host = uidIn(reload, 'gold.merchant', 0), mentor = uidIn(reload, 'red.mentor', 'shop');
    expect(reload.pending.options.map(o => o.id)).toContain(pair(host, mentor));
    expect(reload.pending.options.map(o => o.id)).not.toContain(pair(host, uidIn(reload, 'red.mob', 'shop')));
    expect(reload.pending.options.every(o => !o.value?.includes(panel))).toBe(true);
    expect(saved(reload).pending.options.every(o => !o.value?.includes(panel))).toBe(true);
    expect(reload.players[0].res.red).toBe(1); // Red space only; Panel itself pays no inherent red.
  });

  it('Recruit Bonus pays per ability, never for an effectless active acquisition or a gift', () => {
    const s = table(Q, { members: [['red.recruitbonus'], ['red.volunteer', 'echo.evergreen']] });
    const ctx = contextFor(s), actor = s.players[0], rival = s.players[1];
    ctx.moveMember(uidIn(s, 'red.volunteer', 1), rival, actor, { recruit: true });
    expect(actor.res.red).toBe(0);
    ctx.moveMember(uidIn(s, 'echo.evergreen', 1), rival, actor);
    expect(actor.res.green).toBe(0);
  });

  it('Panel exclusion survives a saved mode choice even if Panel has moved into the shop', () => {
    let s = table(Q, { round: 3, members: [['red.host']], shop: ['red.panel', 'red.mentor'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'red.panel', 'shop')}`);
    const panel = uidIn(s, 'red.panel', 0);
    s.players[0].members.splice(s.players[0].members.indexOf(panel), 1);
    s.shop.push(panel);
    s = move(saved(s), 'promote');
    expect(s.pending.options.length).toBeGreaterThan(0);
    expect(s.pending.options.every(o => !o.value?.includes(panel))).toBe(true);
  });

  it('Recruit Bonus rewards Doppelganger’s identity choice and its copied On Recruit, in its physical color', () => {
    let s = table(Q, { round: 3, members: [['red.recruitbonus', 'red.host']], shop: ['echo.doppel'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'echo.doppel', 'shop')}`);
    expect(s.players[0].res.green).toBe(1); // Doppelganger's choice is one Recruit ability.
    s = move(saved(s), `card:${uidIn(s, 'red.host', 0)}`);
    // Doppelganger also does the copied Host's On Recruit (Cory, 2026-10-28): +1 red per 2 members, and Recruit Bonus
    // pays once more for it, in Doppelganger's own color
    expect(s.players[0].res.green).toBe(2);
    expect(s.players[0].res.red).toBe(1 + Math.floor(memberCount(s, s.players[0]) / 2));
  });

  it.each(['echo.evergreen', 'red.host', 'red.panel'])('Impostor adopts %s without firing its Recruit or Now ability', target => {
    let s = table(Q, { round: 3, members: [['red.recruitbonus', 'red.twins'], [target]], shop: ['echo.impostor'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'echo.impostor', 'shop')}`);
    expect(s.players[0].res.green).toBe(1); // Its own identity-selection Recruit still triggers Recruit Bonus.
    s = move(saved(s), `card:${uidIn(s, target, 1)}`);
    expect(s.cards[uidIn(s, 'echo.impostor', 0)].copy).toBe(target);
    expect(s.players[0].res).toMatchObject({ green: 1, red: 1 });
    expect(s.pending?.kind).not.toBe('choose');
    if (target !== 'red.panel') {
      s.queue = [{ t: 'round', r: 3 }]; s = resume(s);
      expect(s.players[0].res[target === 'red.host' ? 'red' : 'green']).toBe(3);
    }
  });

  it('Movement Penalty charges the displaced rival, including swaps between two rival cults', () => {
    const s = table(Q, { n: 3, members: [['red.movementpenalty'], ['red.twins'], ['red.volunteer']], bonus: [0, 3, 3] });
    const ctx = contextFor(s), a = uidIn(s, 'red.twins', 1), b = uidIn(s, 'red.volunteer', 2);
    expect(ctx.swapMembers(s.players[0], a, b)).toBe(true);
    expect(s.players.map(p => p.bonus)).toEqual([0, 2, 2]);
    ctx.swapMembers(s.players[0], a, b);
    expect(s.players.map(p => p.bonus)).toEqual([0, 1, 1]);
  });

  it('Loyalists blocks both players from swapping its cult, but does not invent theft immunity', () => {
    const s = table(Q, { members: [['red.loyalists', 'red.twins'], ['red.volunteer']], shop: ['red.mentor'] });
    const ctx = contextFor(s), twins = uidIn(s, 'red.twins', 0), volunteer = uidIn(s, 'red.volunteer', 1);
    expect(ctx.canSwapMember(twins)).toBe(false);
    expect(ctx.canSwapMember(uidIn(s, 'red.loyalists', 0))).toBe(true);
    expect(ctx.swapMembers(s.players[0], twins, s.shop[0])).toBe(false);
    expect(ctx.swapMembers(s.players[1], volunteer, twins)).toBe(false);
    expect(ctx.steal(s.players[1], s.players[0], { uid: twins })).toBe(1);
    expect(s.players[1].members).toContain(twins);
  });

  it('two Loyalists (a Doppelganger copy) do not shield each other; they still shield the rest', () => {
    const s = table(Q, { members: [['red.loyalists', 'echo.doppel', 'red.twins'], ['red.volunteer']] });
    const doppel = uidIn(s, 'echo.doppel', 0);
    s.cards[doppel].copy = 'red.loyalists';
    const ctx = contextFor(s);
    expect(ctx.canSwapMember(uidIn(s, 'red.loyalists', 0))).toBe(true);
    expect(ctx.canSwapMember(doppel)).toBe(true);
    expect(ctx.canSwapMember(uidIn(s, 'red.twins', 0))).toBe(false);
  });

  // Cory, 2026-10-28: Doppelganger does the copied member's On Recruit, so a copied Panel promotes or demotes once
  it('a Doppelganger copying Panel adopts its body and does Panel\'s Promote or Demote once', () => {
    let s = table(Q, { round: 3, members: [['red.panel']], shop: ['echo.doppel', 'red.mentor'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'echo.doppel', 'shop')}`);
    s = move(saved(s), `card:${uidIn(s, 'red.panel', 0)}`);
    expect(s.pending.prompt).toBe('Panel: Promote or Demote?');
    expect(s.queue.find(t => t.t === 'choose')?.data?.excludeUid).toBe(uidIn(s, 'echo.doppel', 0));
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('red.panel');
    expect(memberCount(s, s.players[0])).toBe(6);
  });

  it('Panel cannot swap itself after reload, while promoting another member into Doppelganger terminates normally', () => {
    // the swaps below need Doppelganger at 5 (Promote reaches up to 2 more); its printed price moves with balance passes
    const dop = defById('echo.doppel'), was = { s: dop.s, w: dop.w };
    Object.assign(dop, { s: 3, w: 2 });
    try {
    let s = table(Q, { round: 2, members: [['echo.impostor', 'echo.doppel', 'red.recruitbonus']], shop: ['red.panel'], queue: turns(0, 0) });
    const impostor = uidIn(s, 'echo.impostor', 0), doppel = uidIn(s, 'echo.doppel', 0), panel = uidIn(s, 'red.panel', 'shop');
    s.cards[impostor].copy = 'red.panel'; s.cards[doppel].copy = 'red.panel';
    s = move(take(s, 'red.hireup'), pair(doppel, panel));
    s = move(saved(s), 'promote');
    expect(s.pending.options.every(o => !o.value?.includes(panel))).toBe(true);
    expect(() => move(saved(s), pair(panel, doppel))).toThrow();
    s = move(saved(s), pair(impostor, doppel));
    s = move(saved(s), `card:${panel}`);
    expect(s.cards[doppel].copy).toBe('red.panel');
    expect(s.players[0].members).toContain(doppel);
    expect(s.players[0].members).toContain(panel);
    expect(s.shop).toContain(impostor);
    // the copied Panel's Promote or Demote runs once (Cory, 2026-10-28), never on Doppelganger itself, and the chain ends
    expect(s.pending.prompt).toBe('Panel: Promote or Demote?');
    for (let k = 0; k < 8 && s.pending?.kind === 'choose'; k++) {
      expect(s.pending.options.every(o => !(Array.isArray(o.value) && o.value.includes(doppel)))).toBe(true);
      s = move(saved(s), s.pending.options[0].id);
    }
    expect(s.pending?.kind).not.toBe('choose');
    } finally { Object.assign(dop, was); }
  });
});
