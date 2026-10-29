// @vitest-environment node
// Real move sequences for Green's re-choosing copies, serialized continuations and anti-copy members.
import { describe, it, expect } from 'vitest';
import { contextFor, followers, memberCount, roundWorkers } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { targets } from '../../../engine/v4/content/echo.js';
import { table, uidIn } from './cards-helpers-b.js';
import { actionName, ids, move, take } from './helpers.js';

const Q = ['gold', 'red', 'market', 'echo'];
const turns = (...players) => players.map(p => ({ t: 'turn', p }));
const member = name => {
  const found = quadrant('echo').members.find(d => d.name === name);
  if (!found) throw new Error(`Missing Green member: ${name}`);
  return found.id;
};
const saved = s => JSON.parse(JSON.stringify(s));
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const go = (s, action) => pass(take(s, action));
const copyOption = (s, action) => {
  const option = s.pending?.options.find(o => o.kind === 'space' && o.label.startsWith(`${actionName(action)} (`));
  if (!option) throw new Error(`No copy target ${action}; ${s.pending?.prompt}: ${s.pending?.options.map(o => o.label)}`);
  return option.id;
};
const choose = (s, action) => move(s, copyOption(s, action));
const memberOption = (s, def) => `card:${uidIn(s, def, 'shop')}`;
const bonus = s => s.players.map(p => p.bonus);
// P2 copies P1 a second time: P1 takes Gather, then P2's Reprise copies P2's Echo, which copies Gather
const secondCopy = s => {
  s = go(s, 'red.turnout');
  s = choose(take(s, 'echo.refrain'), 'echo.echo');
  while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
  return pass(s);
};

describe('Green redesign: copied copy actions and continuation safety', () => {
  // Echo copies a rival's Reprise (Encore stopped copying spaces, Oct 28)
  it('Echo copies a rival Reprise, which chooses from the copier’s own actions afresh', () => {
    let s = table(Q, { round: 2, left: 6, queue: turns(0, 1, 1, 0, 0) });
    s = go(s, 'gold.rush');
    s = go(s, 'echo.chant');
    s = pass(choose(take(s, 'echo.refrain'), 'echo.chant'));
    s = take(s, 'echo.echo');
    if (s.pending?.kind === 'choose' && s.pending.options.some(o => o.label.startsWith(`${actionName('echo.refrain')} (`))) s = choose(saved(s), 'echo.refrain');
    expect(s.pending.options.map(o => o.label)).toHaveLength(1);
    expect(copyOption(s, 'gold.rush')).toBeTruthy();
    const uninterrupted = pass(choose(s, 'gold.rush'));
    const reloaded = pass(choose(saved(s), 'gold.rush'));
    expect(reloaded).toEqual(uninterrupted);
    expect(reloaded.players[0].res).toMatchObject({ gold: 8, green: 2 });
  });

  it('Reprise → Echo cannot return to Reprise or itself, including after reload', () => {
    let s = table(Q, { round: 2, left: 6, queue: turns(1, 0, 0) });
    s = go(s, 'echo.chant');
    s = pass(choose(take(s, 'echo.echo'), 'echo.chant'));
    const before = s.players[0].res.green;
    s = choose(saved(take(s, 'echo.refrain')), 'echo.echo');
    s = pass(s);
    expect(s.pending?.kind === 'choose' ? s.pending.options.map(o => o.label) : []).toEqual([]);
    expect(s.players[0].res.green - before).toBe(2); // Reprise +1, Echo +1, nothing past its own chain
    expect(s.log.some(line => /nothing to copy|already.*chain|chain.*already/i.test(line))).toBe(true);
  });

  it('copied resource gains exclude the original owner’s passive, then apply the copier’s passive', () => {
    let s = table(Q, { members: [['echo.tuningfork'], ['gold.prospector']], queue: turns(1, 0, 0) });
    s = go(s, 'gold.rush');
    expect(s.players[1].res.gold).toBe(3);
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    expect(s.players[0].res).toMatchObject({ gold: 3, green: 1 });
  });

  it('Greatest Hits keeps sibling paths independent while its Echo chooses a fresh Reprise chain', () => {
    let s = table(Q, { round: 3, left: 7, queue: turns(0, 1, 0, 0, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'gold.discount');
    s = pass(choose(take(s, 'echo.echo'), 'gold.discount'));
    s = pass(choose(take(s, 'echo.refrain'), 'gold.rush'));
    s = take(s, 'echo.eternity');
    // you pick the order (Cory, 2026-10-26): the placement order here
    s = choose(saved(s), 'gold.rush'); s = choose(saved(s), 'echo.echo');
    // Its Echo now sees Reprise as the previous placement, rather than the original Intro Offer target.
    s = choose(saved(s), 'echo.refrain');
    s = choose(saved(s), 'gold.rush');
    // The separate sibling Reprise is allowed to copy Golden Years again: only ancestors are excluded.
    s = pass(choose(saved(s), 'gold.rush'));
    expect(s.players[0].res).toMatchObject({ gold: 30, green: 6 });
    expect(s.players[0].discount).toBe(4);
    expect(s.pending?.kind).not.toBe('choose');
  });

  it('Greatest Hits resumes after a copied free recruit and its recruited Stunt Double', () => {
    const stunt = member('Stunt Double');
    let s = table(Q, { round: 3, left: 7, shop: ['red.recruiter', stunt], queue: turns(0, 0, 0, 0) });
    s = take(s, 'red.take');
    s = pass(move(s, memberOption(s, 'red.recruiter')));
    s = go(s, 'gold.rush');
    const before = s.players[0].res.gold;
    s = choose(take(s, 'echo.eternity'), 'red.take');
    expect(s.pending.kind).toBe('choose');
    s = move(saved(s), memberOption(s, stunt));
    // Recruiting starts a fresh Stunt Double chain; nested Greatest Hits must preserve the outer remainder.
    let decisions = 0;
    while (s.pending?.kind === 'choose' && decisions++ < 20) {
      const preferred = s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(`${actionName('gold.rush')} (`)) || s.pending.options[0];
      s = move(saved(s), preferred.id);
    }
    expect(decisions).toBeLessThan(20);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].members).toContain(uidIn(s, stunt, 0));
    expect(s.players[0].res.gold - before).toBe(12);
    expect(s.players[0].res.green).toBe(2);
  });

  it('Tribute Band is once per game and its saved replay resumes through choice-bearing actions', () => {
    const band = member('Tribute Band');
    let s = table(Q, { round: 2, left: 6, members: [[band]], res: [{}, { gold: 6 }], queue: turns(0, 0, 0) });
    s = take(s, 'gold.steal');
    for (let i = 0; i < 3; i++) s = move(s, 'player:1');
    s = pass(s);
    s = take(s, 'echo.chant');
    const uid = uidIn(s, band, 0);
    s = move(s, `use:${uid}`);
    for (let i = 0; i < 3; i++) s = move(saved(s), 'player:1');
    expect(s.players[0].res.gold).toBe(6);
    expect(s.players[0].res.green).toBe(8);
    expect(s.cards[uid].used).toBe(true);
    expect(ids(s)).not.toContain(`use:${uid}`);
  });
});

describe('Green redesign: copy observers and anti-copy members', () => {
  it('Ensemble rewards own-action copies only, including a copied copy action that targets your action', () => {
    const ensemble = member('Ensemble');
    let s = table(Q, { round: 2, left: 6, members: [[ensemble]], queue: turns(0, 1, 0, 0, 0) });
    s = go(s, 'gold.rush');
    s = go(s, 'echo.chant');
    s = pass(choose(take(s, 'echo.echo'), 'echo.chant'));
    expect(s.players[0].bonus).toBe(0);
    s = pass(choose(take(s, 'echo.refrain'), 'gold.rush'));
    expect(s.players[0].bonus).toBe(1);
  });

  it('every other player’s Muse hears a copy, even when the action belongs to someone else', () => {
    const muse = member('Muse');
    let s = table(Q, { n: 3, members: [[], [muse], ['echo.doppel']], queue: turns(2, 0, 0) });
    s.cards[uidIn(s, 'echo.doppel', 2)].copy = muse;
    s = go(s, 'gold.rush');
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    expect(s.players.map(p => p.res.green)).toEqual([1, 1, 1]); // P1's Echo +1; each Muse +1
  });

  it('Agents blocks its owner and rivals from copying its owner’s actions', () => {
    const agents = member('Agents');
    let s = table(Q, { round: 2, left: 6, members: [[agents]], queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush');
    s = go(s, 'echo.echo');
    expect(s.players[1].res).toMatchObject({ gold: 0, green: 1 });
    s = go(s, 'echo.refrain');
    expect(s.players[0].res).toMatchObject({ gold: 4, green: 1 });
    expect(memberCount(s, s.players[0])).toBe(2);
    expect(followers(s, s.players[0])).toBe(3);
  });

  it('a copied Agents blocks copying and copied printed quantities remain effective', () => {
    const agents = member('Agents');
    let s = table(Q, { members: [['echo.doppel']], queue: turns(0, 1, 0) });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = agents;
    s = go(s, 'gold.rush');
    const ctx = contextFor(s);
    expect(targets(ctx, s.players[1], 'any')).toEqual([]);
    s = go(s, 'echo.echo');
    expect(s.players[1].res.gold).toBe(0);
    expect(memberCount(s, s.players[0])).toBe(2);
    expect(followers(s, s.players[0])).toBe(3);
  });

  it('Bait makes a rival lose the follower and pays the owner; self-copy only loses', () => {
    const bait = member('Bait');
    let s = table(Q, { round: 2, left: 6, members: [[bait]], bonus: [3, 3], queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush');
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    expect(bonus(s)).toEqual([4, 2]);
    s = pass(choose(take(s, 'echo.refrain'), 'gold.rush'));
    expect(bonus(s)).toEqual([3, 2]);
  });

  it('Bait takes printed/base followers too, floors the copier at zero, and still pays its owner', () => {
    let s = table(Q, { round: 2, left: 6, members: [['echo.bait']], queue: turns(0, 1, 0, 1) });
    s = go(s, 'gold.rush');
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    expect(followers(s, s.players[1])).toBe(0);
    s = secondCopy(s);
    expect(followers(s, s.players[1])).toBe(0);
    expect(s.players[0].bonus).toBe(2);
  });

  it('recruiting Agents midway through Greatest Hits prevents later sibling copies', () => {
    let s = table(Q, { round: 3, left: 6, shop: ['red.bigfamily', 'echo.agents'], queue: turns(0, 0, 0, 0) });
    s = pass(move(take(s, 'red.take'), memberOption(s, 'red.bigfamily')));
    s = go(s, 'gold.rush');
    const before = s.players[0].res.gold;
    s = choose(take(s, 'echo.eternity'), 'red.take');
    expect(s.pending.kind).toBe('choose');
    s = move(saved(s), memberOption(s, 'echo.agents'));
    expect(s.players[0].res.gold).toBe(before);
    expect(s.players[0].members).toContain(uidIn(s, 'echo.agents', 0));
    expect(s.pending?.kind).not.toBe('choose');
  });

  it('losing a printed member after Bait losses cannot take the total below zero', () => {
    let s = table(Q, { round: 2, left: 6, members: [['echo.bait'], ['red.bigfamily']], queue: turns(0, 1, 0, 1) });
    s = go(s, 'gold.rush');
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    s = secondCopy(s);
    expect(s.players[1].bonus).toBe(-2);
    contextFor(s).moveMember(uidIn(s, 'red.bigfamily', 1), s.players[1], s.players[0]);
    expect(followers(s, s.players[1])).toBe(0);
  });

  it('copied Bait reacts as its current owner’s passive', () => {
    const bait = member('Bait');
    let s = table(Q, { members: [['echo.doppel']], bonus: [2, 2], queue: turns(0, 1, 0) });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = bait;
    s = go(s, 'gold.rush');
    s = pass(choose(take(s, 'echo.echo'), 'gold.rush'));
    expect(bonus(s)).toEqual([3, 1]);
  });

  it('Impostor adopts a copied member’s effective identity without triggering its Recruit ability', () => {
    const impostor = member('Impostor');
    const busker = member('Busker');
    let s = table(Q, { round: 3, left: 6, shop: [impostor], members: [[], [busker, 'echo.doppel']], queue: turns(0, 0) });
    s.cards[uidIn(s, 'echo.doppel', 1)].copy = busker;
    s = move(take(s, 'red.take'), memberOption(s, impostor));
    s = move(saved(s), `card:${uidIn(s, 'echo.doppel', 1)}`);
    expect(s.cards[uidIn(s, impostor, 0)].copy).toBe(busker);
    expect(s.players[0].res.green).toBe(0);
  });

  it.each(['echo.doppel', 'echo.impostor'])('%s grants a copied Extra Hand’s unplaced minion immediately in round III', copier => {
    const owner = copier === 'echo.doppel' ? 0 : 1;
    const members = [[], []]; members[owner] = ['benders.extrahand'];
    let s = table(['gold', 'red', 'purple', 'echo'], {
      round: 3, left: 5, shop: [copier], members,
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'allPlaced' }],
    });
    const before = { left: s.players[0].left, workers: roundWorkers(s, s.players[0]) };
    s = move(take(s, 'red.take'), memberOption(s, copier));
    s = move(saved(s), `card:${uidIn(s, 'benders.extrahand', owner)}`);
    const uid = uidIn(s, copier, 0);
    expect(s.cards[uid].copy).toBe('benders.extrahand');
    expect(s.players[0].left).toBe(before.left);
    expect(s.players[0].workers).toBe(before.workers + 1);
    expect(s.queue.filter(t => t.workerSource === uid && t.p === 0)).toHaveLength(1);
  });

  it('Doppelganger can copy a resolved Impostor without losing its effective Agents identity', () => {
    let s = table(Q, { round: 3, left: 5, members: [['echo.impostor']], shop: ['echo.doppel'], queue: turns(0, 1) });
    s.cards[uidIn(s, 'echo.impostor', 0)].copy = 'echo.agents';
    s = move(take(s, 'red.take'), memberOption(s, 'echo.doppel'));
    s = move(saved(s), `card:${uidIn(s, 'echo.impostor', 0)}`);
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('echo.agents');
    expect(memberCount(s, s.players[0])).toBe(4);
    expect(followers(s, s.players[0])).toBe(5);
    expect(targets(contextFor(s), s.players[1], 'any')).toEqual([]);
  });
});
