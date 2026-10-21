import { afterEach, expect, it } from 'vitest';
import { planChain, rewindPlan, isUndo } from '../../../v4/game/director.js';
import { motionSpeed, setMotionSpeed } from '../../../v4/motion.js';
import { sceneQ } from '../../engine/v4/cards-helpers.js';

const speed = motionSpeed();
afterEach(() => setMotionSpeed(speed));
const stack = (pid, r) => ({ kind: 'stack', pid, r });
const member = (pid, uid) => ({ kind: 'member', pid, uid, def: 'silver.majordomo' });
function chain(effects) {
  setMotionSpeed('steady');
  const before = sceneQ({ quadrants: ['gold', 'silver'] });
  return planChain(before, { ...before, moves: before.moves + 1, effects }, { mine: [0] });
}

it('lets each named payout land before the next member enters, including rival reactions', () => {
  const action = { kind: 'space', pid: 0, key: '0-0' };
  const a = member(1, 101), b = member(0, 102);
  const plan = chain([
    { type: 'gain', cause: action, from: action, to: stack(0, 'gold'), what: { r: 'gold', n: 2 } },
    { type: 'gain', cause: a, from: a, to: stack(1, 'silver'), what: { r: 'silver', n: 2 } },
    { type: 'gain', cause: b, from: b, to: stack(0, 'silver'), what: { r: 'silver', n: 1 } },
  ]);
  const members = plan.atoms.filter(a => a.op === 'stage' && a.kind === 'member');
  const firstLands = plan.atoms.filter(a => a.op === 'land' && a.r === 'gold');
  expect(members[0].at).toBeGreaterThanOrEqual(Math.max(...firstLands.map(a => a.at)) - 1);
  const memberLands = plan.atoms.filter(a => a.op === 'piece' && a.from.uid === 101);
  expect(members[1].at).toBeGreaterThanOrEqual(Math.max(...memberLands.map(a => a.at + a.dur)) - 1);
  expect(plan.handoff).toBeGreaterThanOrEqual(Math.max(...plan.atoms.filter(a => a.op === 'land').map(a => a.at)) - 1);
  for (const stage of members) {
    const pieces = plan.atoms.filter(a => a.op === 'piece' && a.from.uid === stage.place.uid);
    expect(pieces.length).toBeGreaterThan(0);
    expect(Math.min(...pieces.map(a => a.at))).toBeGreaterThanOrEqual(stage.at + stage.dur - 1);
  }
});

it('routes ordinary resources through their matching rim while keeping member and rival transfers sourced', () => {
  const action = { kind: 'space', pid: 0, key: '0-0' }, a = member(0, 101);
  const plan = chain([
    { type: 'gain', cause: action, from: action, to: stack(0, 'gold'), what: { r: 'gold', n: 1 } },
    { type: 'pay', cause: action, from: stack(0, 'silver'), to: action, what: { r: 'silver', n: 1 } },
    { type: 'transfer', cause: a, from: stack(1, 'gold'), to: stack(0, 'gold'), what: { r: 'gold', n: 1 } },
    { type: 'gain', cause: a, from: a, to: stack(0, 'silver'), what: { r: 'silver', n: 1 } },
  ]);
  const pieces = plan.atoms.filter(a => a.op === 'piece');
  expect(pieces.find(a => a.r === 'gold' && !a.take).from).toEqual({ kind: 'rim', r: 'gold' });
  expect(pieces.find(a => a.pay).to).toEqual({ kind: 'rim', r: 'silver' });
  expect(pieces.find(a => a.take).from).toEqual(stack(1, 'gold'));
  expect(pieces.find(a => a.from.uid === 101).from.kind).toBe('stage');
});


it('plans both swap members repeatedly without mutating engine effects', () => {
  const before = sceneQ({ quadrants: ['gold', 'silver'] });
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const move = (uid, from, to) => Object.freeze({ type: 'member-move', cause,
    from: { kind: 'crowd', pid: from }, to: { kind: 'crowd', pid: to }, what: { uid, worth: 1 } });
  const effects = [move(101, 0, 1), move(102, 1, 0)];
  const after = { ...before, moves: before.moves + 1, effects };
  const first = planChain(before, after), second = planChain(before, after);
  expect(second).toEqual(first);
  const chips = first.atoms.filter(a => a.op === 'chip');
  expect(chips.map(a => [a.uid, a.from.pid, a.to.pid])).toEqual([[101, 0, 1], [102, 1, 0]]);
  expect(chips.map(a => a.via)).toEqual([0, 1]);
  expect(chips.every(a => a.swap && a.hide)).toBe(true);
  expect(chips[0].at).toBe(chips[1].at);
});

it('pairs a color-changing steal into one gain rather than separate loss and gain flights', () => {
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const plan = chain([
    { type: 'pay', cause, from: stack(1, 'gold'), to: cause, what: { r: 'gold', n: 1 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'magenta'), what: { r: 'magenta', n: 1 } },
  ]);
  const pieces = plan.atoms.filter(a => a.op === 'piece');
  expect(pieces).toHaveLength(1);
  expect(pieces[0]).toMatchObject({ from: stack(1, 'gold'), to: stack(0, 'magenta'), turn: 'magenta', take: true });
});


it('shows one direct transfer per stolen unit when several colors become one magenta gain', () => {
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const plan = chain([
    { type: 'pay', cause, from: stack(1, 'gold'), to: cause, what: { r: 'gold', n: 1 } },
    { type: 'pay', cause, from: stack(1, 'silver'), to: cause, what: { r: 'silver', n: 2 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'magenta'), what: { r: 'magenta', n: 3 } },
  ]);
  const pieces = plan.atoms.filter(a => a.op === 'piece');
  // (Cory, 2026-10-18: a steal shows what's taken at once) one gold, and the two silver as one handful with its count
  expect(pieces).toHaveLength(2);
  expect(pieces.every(a => a.take && a.turn === 'magenta' && a.from.pid === 1 && a.to.pid === 0)).toBe(true);
  expect(pieces.reduce((sum, a) => sum + a.n, 0)).toBe(3);
  expect(pieces.find(a => a.n === 2).bundle).toBe(true);
});


it('shows round-start income after minions return when closing a same-move scoring snapshot', () => {
  setMotionSpeed('steady');
  const before = sceneQ({ quadrants: ['gold', 'silver'], members: [['gold.banker']] });
  before.round = 1;
  const players = before.players.map(p => ({ ...p, res: { ...p.res } }));
  players[0].res.gold = (players[0].res.gold || 0) + 3;
  const after = { ...before, round: 2, players, slots: {},
    log: [...before.log, `${players[0].name}'s Banker: +3 gold.`],
    // This belongs to the original closing move and must not replay on summary dismissal.
    effects: [{ type: 'gain', cause: { kind: 'space', pid: 0, key: '0-0' },
      from: { kind: 'space', key: '0-0' }, to: stack(0, 'gold'), what: { r: 'gold', n: 99 } }],
  };
  const plan = planChain(before, after);
  const home = plan.atoms.find(a => a.op === 'home');
  expect(home).toBeTruthy();
  const gains = plan.atoms.filter(a => a.op === 'piece');
  expect(gains.reduce((sum, a) => sum + a.n, 0)).toBe(3);
  expect(gains.every(a => a.from.kind === 'member' && a.from.def === 'gold.banker' && a.from.pid === 0)).toBe(true);
  expect(Math.min(...gains.map(a => a.at))).toBeGreaterThan(0);
  expect(plan.handoff).toBeGreaterThanOrEqual(Math.max(...plan.atoms.filter(a => a.op === 'land').map(a => a.at)) - 1);
});


it('keeps stolen colors on victim-to-thief flights and sources inherent Magenta from its rim', () => {
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const effects = [
    { type: 'gain', cause, from: cause, to: stack(0, 'magenta'), what: { r: 'magenta', n: 1 } },
    { type: 'pay', cause, from: stack(1, 'gold'), to: cause, what: { r: 'gold', n: 2 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'gold'), what: { r: 'gold', n: 2 } },
    { type: 'pay', cause, from: stack(2, 'silver'), to: cause, what: { r: 'silver', n: 1 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'silver'), what: { r: 'silver', n: 1 } },
  ];
  const before = JSON.stringify(effects);
  const pieces = chain(effects).atoms.filter(a => a.op === 'piece');
  const magenta = pieces.filter(a => a.r === 'magenta');
  expect(magenta).toHaveLength(1);
  expect(magenta[0].from).toEqual({ kind: 'rim', r: 'magenta' });
  const theft = pieces.filter(a => a.take);
  // the two gold leave together, as one handful (a steal shows what's taken at once)
  expect(theft).toHaveLength(2);
  expect(theft.reduce((sum, a) => sum + a.n, 0)).toBe(3);
  expect(theft.every(a => a.from.kind === 'stack' && a.from.r === a.to.r && !a.turn)).toBe(true);
  expect(theft.filter(a => a.r === 'gold').every(a => a.from.pid === 1)).toBe(true);
  expect(theft.find(a => a.r === 'silver').from.pid).toBe(2);
  expect(JSON.stringify(effects)).toBe(before);
});

it('flies a mixed-color ransom payment directly from payer to recipient without conversion', () => {
  const cause = { kind: 'space', pid: 1, key: '0-4' };
  const pieces = chain([
    { type: 'pay', cause, from: stack(1, 'gold'), to: cause, what: { r: 'gold', n: 2 } },
    { type: 'pay', cause, from: stack(1, 'silver'), to: cause, what: { r: 'silver', n: 1 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'gold'), what: { r: 'gold', n: 2 } },
    { type: 'gain', cause, from: cause, to: stack(0, 'silver'), what: { r: 'silver', n: 1 } },
  ]).atoms.filter(a => a.op === 'piece');
  expect(pieces).toHaveLength(3);
  expect(pieces.every(a => a.from.pid === 1 && a.to.pid === 0 && a.from.r === a.to.r && !a.turn && !a.pay)).toBe(true);
});


it('opens a new round as separate beats: minions home, then income seat by seat, then round-start hooks, then the shop', () => {
  setMotionSpeed('steady');
  const before = sceneQ({ quadrants: ['gold', 'silver'], members: [['gold.banker'], ['gold.merchant']], slots: { '0-0': 0, '0-1': 1, '1-0': 0 } });
  before.round = 1;
  const pre = { type: 'followers', cause: { kind: 'contest' }, from: { kind: 'rim' }, to: { kind: 'count', pid: 0 }, what: { n: 4 } };
  before.effects = [pre];
  const [u0, u1] = [before.players[0].members[0], before.players[1].members[0]];
  const round = { kind: 'round', round: 2 };
  const bank = (pid, uid) => ({ kind: 'member', pid, uid, def: pid ? 'gold.merchant' : 'gold.banker' });
  const seg = [
    ...before.shop.map(uid => ({ type: 'shop-out', cause: round, from: { kind: 'shop' }, to: { kind: 'pile' }, what: { uid } })),
    { type: 'gain', cause: bank(0, u0), from: bank(0, u0), to: stack(0, 'gold'), what: { r: 'gold', n: 3 } },
    { type: 'gain', cause: bank(1, u1), from: bank(1, u1), to: stack(1, 'gold'), what: { r: 'gold', n: 3 } },
    // a round-start hook that takes: it plays after the income
    { type: 'transfer', cause: bank(1, u1), from: stack(0, 'gold'), to: stack(1, 'gold'), what: { r: 'gold', n: 1 } },
  ];
  const shop = before.pile.slice(0, before.shop.length);
  const after = { ...before, round: 2, slots: {}, squats: {}, shop, effects: [pre, ...seg] };
  const plan = planChain(before, after, { mine: [0] });
  const home = plan.atoms.find(a => a.op === 'home');
  expect(home.at).toBe(0);
  const income = plan.atoms.filter(a => a.op === 'piece' && a.from.kind === 'member');
  expect(income.length).toBeGreaterThan(0);
  expect(Math.min(...income.map(a => a.at))).toBeGreaterThan(0);
  expect(plan.atoms.filter(a => a.op === 'hop').length).toBe(2);
  const hook = plan.atoms.find(a => a.op === 'tug');
  const incomeLands = plan.atoms.filter(a => a.op === 'land' && !a.take && a.to.kind === 'stack');
  expect(hook.at).toBeGreaterThan(Math.min(...incomeLands.map(a => a.at)));
  const refill = plan.atoms.find(a => a.op === 'refill');
  expect(refill.n).toBe(before.shop.length);
  expect(refill.at).toBeGreaterThanOrEqual(hook.at);
  expect(plan.total).toBeGreaterThan(refill.at);
  // nothing from before the round's start (the scored board's own stream) replays
  expect(plan.atoms.some(a => a.fol)).toBe(false);
});

it('a recruit flies to the hub, is read there, then flies on to its buyer before its worth lands (Cory, 10-18)', () => {
  const cause = { kind: 'recruit', pid: 0, uid: 77, index: 0 };
  const plan = chain([
    { type: 'pay', cause, from: stack(0, 'gold'), to: { kind: 'shop', uid: 77 }, what: { r: 'gold', n: 2 } },
    { type: 'recruit', cause, from: { kind: 'shop', uid: 77 }, to: { kind: 'crowd', pid: 0 }, what: { uid: 77, worth: 1 } },
  ]);
  const card = plan.atoms.find(a => a.op === 'card');
  expect(card.toHub).toBeGreaterThan(0);
  expect(card.show).toBeGreaterThanOrEqual(1);
  expect(card.fromHub).toBeGreaterThan(0);
  const worth = plan.atoms.find(a => a.op === 'piece' && a.fol);
  expect(worth.at).toBeGreaterThanOrEqual(card.at + card.lift + card.toHub + card.show + card.fromHub - 1);
});

it('says what a steal takes at once: the victim pile is tagged as the take starts, and 2 or more leave as one handful', () => {
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const plan = chain([{ type: 'transfer', cause, from: stack(1, 'gold'), to: stack(0, 'gold'), what: { r: 'gold', n: 3 } }]);
  const tug = plan.atoms.find(a => a.op === 'tug');
  expect(tug).toMatchObject({ n: 3, r: 'gold', owner: 1 });
  const pieces = plan.atoms.filter(a => a.op === 'piece');
  expect(pieces).toHaveLength(1);
  expect(pieces[0]).toMatchObject({ n: 3, bundle: true, take: true });
  expect(pieces[0].at).toBeGreaterThanOrEqual(tug.at);
});

it('plays an undone placement backwards: your minion home and its pieces back where they came from, quicker, nothing landing again (H24)', () => {
  setMotionSpeed('steady');
  const restored = sceneQ({ quadrants: ['gold', 'silver'], res: [{ gold: 2 }] });
  const undone = { ...restored, moves: restored.moves + 1, slots: { ...restored.slots, '0-0': 0 },
    effects: [{ type: 'gain', cause: { kind: 'space', pid: 0, key: '0-0' }, from: { kind: 'space', key: '0-0' }, to: stack(0, 'gold'), what: { r: 'gold', n: 2 } }] };
  expect(isUndo(undone, restored)).toBe(true);
  expect(isUndo(restored, undone)).toBe(false);
  const fwd = planChain(restored, undone, { mine: [0] });
  const back = rewindPlan(fwd);
  // only motion: no lands (no count steps, no sounds), no pulses or stage cards
  expect(new Set(back.atoms.map(a => a.op))).toEqual(new Set(['piece', 'minion']));
  const fp = fwd.atoms.filter(a => a.op === 'piece'), bp = back.atoms.filter(a => a.op === 'piece');
  expect(bp.length).toBe(fp.length);
  for (const a of bp) { expect(a.from.kind).toBe('stack'); expect(a.to.kind).not.toBe('stack'); }
  // the minion came first in the move, so it goes home last
  const m = back.atoms.find(a => a.op === 'minion');
  expect(m.at).toBeGreaterThanOrEqual(Math.max(...bp.map(a => a.at)));
  expect(back.total).toBeLessThan(fwd.total);
  expect(back.total).toBeGreaterThan(0);
});

it('flies a gain of 12 as 12 coins in one stream, its last landing when the single bundle did (12 coins animate as 12)', async () => {
  const { flyPath } = await import('../../../v4/game/flight.js');
  const { streamGap, MO } = await import('../../../v4/motion.js');
  const cause = { kind: 'space', pid: 0, key: '0-0' };
  const plan = chain([{ type: 'gain', cause, from: cause, to: stack(0, 'gold'), what: { r: 'gold', n: 12 } }]);
  const piece = plan.atoms.find(a => a.op === 'piece'), land = plan.atoms.find(a => a.op === 'land');
  expect(piece).toMatchObject({ n: 12, bundle: true });
  // every coin leaves within the stream window
  expect(piece.stream).toBe(Math.round(11 * streamGap(12)));
  expect(piece.stream).toBeLessThanOrEqual(MO.streamSpread);
  expect(land.by).toBe(12);
  // a stream of 3 or fewer is the usual singles; followers keep their single bundle
  expect(chain([{ type: 'gain', cause, from: cause, to: stack(0, 'gold'), what: { r: 'gold', n: 3 } }]).atoms.filter(a => a.op === 'piece')).toHaveLength(3);
  const fol = chain([{ type: 'followers', cause, from: cause, to: { kind: 'count', pid: 0 }, what: { n: 10 } }]).atoms.find(a => a.op === 'piece');
  expect(fol.stream).toBeUndefined();
  // on screen: twelve whole coins, not a bundle's two fading echoes
  document.body.innerHTML = '';
  const fake = { finished: Promise.resolve(), addEventListener() {}, cancel() {} };
  const had = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = () => fake;
  try { flyPath('<i></i>', 'piece-flight', { left: 0, top: 0, width: 16, height: 16 }, { left: 300, top: 200, width: 16, height: 16 }, { duration: 200, trail: 11, trailGap: 12, full: true }); }
  finally { HTMLElement.prototype.animate = had; }
  const inner = [...document.querySelectorAll('.piece-flight .path-inner')];
  expect(inner).toHaveLength(12);
  expect(inner.every(e => !e.style.opacity || e.style.opacity === '1')).toBe(true);
});
