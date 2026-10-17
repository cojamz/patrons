import { afterEach, expect, it } from 'vitest';
import { planChain } from '../../../v4/game/director.js';
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
  expect(pieces).toHaveLength(3);
  expect(pieces.every(a => a.take && a.turn === 'magenta' && a.from.pid === 1 && a.to.pid === 0)).toBe(true);
  expect(pieces.reduce((sum, a) => sum + a.n, 0)).toBe(3);
});
