// @vitest-environment node
// Bounded, real-choice regressions for the Red acquisition deck and its Green interactions.
import { describe, expect, it } from 'vitest';
import { contextFor, createGame, followers, memberCount, resume } from '../../../engine/v4/core.js';
import { defById, quadrant } from '../../../engine/v4/content/index.js';
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
  it('Chorus excludes its newly placed minion and its estimate matches the gain', () => {
    const s = table(Q);
    const ctx = contextFor(s), chorus = quadrant('echo').actions.find(a => a.key === 'hum');
    expect(chorus.estimate(ctx, s.players[0])).toBe(1);
    const after = take(s, 'echo.hum');
    expect(after.players[0].res.green).toBe(1);
  });

  it('Chorus counts each other occupied Green action once, regardless of minion owner', () => {
    let s = table(Q, { round: 2, left: 5, queue: turns(1, 0, 1, 0) });
    s = go(s, 'echo.chant');
    s = go(s, 'gold.rush');
    s = go(s, 'echo.refrain');
    // Reprise copies P2's Build Up and finishes in its buy step.
    if (s.pending?.kind === 'choose') s = pass(move(s, copyChoice(s, 'echo.chant').id));
    const before = s.players[0].res.green;
    const chorus = quadrant('echo').actions.find(a => a.key === 'hum');
    expect(chorus.estimate(contextFor(s), s.players[0])).toBe(3);
    s = take(s, 'echo.hum');
    expect(s.players[0].res.green - before).toBe(3);
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

  it('Encore → Echo chooses the latest placement and cannot fall back past its own chain', () => {
    let s = table(Q, { round: 2, queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush');
    s = take(s, 'echo.echo');
    s = pass(move(s, copyChoice(s, 'gold.rush').id));
    s = take(s, 'echo.encore');
    s = pass(move(saved(s), copyChoice(s, 'echo.echo').id));
    expect(s.players[0].res.gold).toBe(4);
    expect(s.players[0].res.green).toBe(2);
    expect(s.pending?.kind).not.toBe('choose');
  });
});

describe('Red members: bounded acquisition and body invariants', () => {
  it('the normal Red deck contains twelve approved members, all priced at ten or less', () => {
    const s = createGame({ seats: [{}, {}], quadrants: ['red', 'echo'], rules: { cull: true, guests: false } });
    const red = Object.values(s.cards).map(c => defById(c.def)).filter(d => d.quadrant === 'red');
    expect(red.map(d => d.key).sort()).toEqual(['host', 'loyalists', 'mentor', 'mob', 'movementpenalty', 'panel', 'patriarch', 'proselytizer', 'recruitbonus', 'recruiter', 'twins', 'volunteer'].sort());
    expect(red.every(d => d.s + d.w <= 10)).toBe(true);
    expect(['red.bigfamily', 'red.intern', 'red.drive', 'red.sponsor', 'red.crowd', 'red.reserve'].every(id => CUT.has(id))).toBe(true);
  });

  it('Panel and Mob printed followers also count as members, including Mob itself in its bonus', () => {
    const s = table(Q, { members: [['red.panel', 'red.mob', 'red.twins', 'red.volunteer']] });
    const ctx = contextFor(s), mob = ctx.membersOf(s.players[0]).find(c => c.def.id === 'red.mob');
    expect(memberCount(s, s.players[0])).toBe(11);
    expect(followers(s, s.players[0])).toBe(12); // leader + printed bodies
    expect(mob.def.onGameEnd(ctx, s.players[0], mob)).toBe(11);
  });

  it('Panel save/load retains mode and exact swap targets without inherent action red', () => {
    let s = table(Q, { round: 3, members: [['red.host']], shop: ['red.panel', 'red.mentor', 'red.mob'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'red.panel', 'shop')}`);
    expect(s.pending.prompt).toMatch(/Panel/);
    expect(s.pending.options.map(o => o.id)).toContain('promote');
    const direct = move(s, 'promote'), reload = move(saved(s), 'promote');
    expect(reload).toEqual(direct);
    const panel = uidIn(reload, 'red.panel', 0), host = uidIn(reload, 'red.host', 0), mentor = uidIn(reload, 'red.mentor', 'shop');
    expect(reload.pending.options.map(o => o.id)).toContain(pair(host, mentor));
    expect(reload.pending.options.map(o => o.id)).not.toContain(pair(host, uidIn(reload, 'red.mob', 'shop')));
    expect(reload.pending.options.every(o => !o.value.includes(panel))).toBe(true);
    expect(saved(reload).pending.options.every(o => !o.value.includes(panel))).toBe(true);
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
    expect(s.pending.options.every(o => !o.value.includes(panel))).toBe(true);
  });

  it('Recruit Bonus rewards Doppelganger’s identity choice once, using its physical color', () => {
    let s = table(Q, { round: 3, members: [['red.recruitbonus', 'red.host']], shop: ['echo.doppel'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'echo.doppel', 'shop')}`);
    expect(s.players[0].res.green).toBe(1); // Doppelganger's choice is one Recruit ability.
    s = move(saved(s), `card:${uidIn(s, 'red.host', 0)}`);
    expect(s.players[0].res.green).toBe(1); // Copying Host does not fire Host's Recruit/Now.
    expect(s.players[0].res.red).toBe(1); // Red action only.
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
    expect(ctx.canSwapMembers(s.players[0])).toBe(false);
    expect(ctx.swapMembers(s.players[0], twins, s.shop[0])).toBe(false);
    expect(ctx.swapMembers(s.players[1], volunteer, twins)).toBe(false);
    expect(ctx.steal(s.players[1], s.players[0], { uid: twins })).toBe(1);
    expect(s.players[1].members).toContain(twins);
  });

  it('a Doppelganger copying Panel adopts its body but does not start a second Recruit chain', () => {
    let s = table(Q, { round: 3, members: [['red.panel']], shop: ['echo.doppel', 'red.mentor'], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), `card:${uidIn(s, 'echo.doppel', 'shop')}`);
    s = move(saved(s), `card:${uidIn(s, 'red.panel', 0)}`);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('red.panel');
    expect(memberCount(s, s.players[0])).toBe(6);
    expect(saved(s).players[0].res.red).toBe(1);
  });

  it('Panel cannot swap itself after reload, while promoting another member into Doppelganger terminates normally', () => {
    let s = table(Q, { round: 2, members: [['echo.impostor', 'echo.doppel', 'red.recruitbonus']], shop: ['red.panel'], queue: turns(0, 0) });
    const impostor = uidIn(s, 'echo.impostor', 0), doppel = uidIn(s, 'echo.doppel', 0), panel = uidIn(s, 'red.panel', 'shop');
    s.cards[impostor].copy = 'red.panel'; s.cards[doppel].copy = 'red.panel';
    s = move(take(s, 'red.hireup'), pair(doppel, panel));
    s = move(saved(s), 'promote');
    expect(s.pending.options.every(o => !o.value.includes(panel))).toBe(true);
    expect(() => move(saved(s), pair(panel, doppel))).toThrow();
    s = move(saved(s), pair(impostor, doppel));
    s = move(saved(s), `card:${panel}`);
    expect(s.cards[doppel].copy).toBe('red.panel');
    expect(s.players[0].members).toContain(doppel);
    expect(s.players[0].members).toContain(panel);
    expect(s.shop).toContain(impostor);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].res).toMatchObject({ red: 2, green: 1 }); // action + actual Panel ability + physical copy choice
  });
});
