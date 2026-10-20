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
  expect(theft).toHaveLength(3);
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
