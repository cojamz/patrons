// @vitest-environment node
// Hard's game plan and its notes from earlier games (mind.js): picked early, kept, steering the artifact pick, and
// memory that credits what finished well.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, isLegal, followers } from '../../../engine/v4/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { newMemory, learnFromGame, learned, planFor, planNudge, STYLES, fitValueModel, modelValues, PRIOR } from '../../../engine/v4/mind.js';
import { seededRandom } from '../../../engine/v4/rng.js';

const TABLE = ['red', 'echo', 'thieves', 'purple'];
const toFirst = (s, kind) => { while (s.pending && s.pending.kind !== kind) s = applyMove(s, chooseBotMove(s, () => 0.5, { level: 'normal' })); return s; };

describe('Hard plan', () => {
  it('picks two table colors and a style at its first decision, and takes its first color\'s artifact', () => {
    const s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }, { kind: 'bot' }, { kind: 'bot' }], seed: 7, quadrants: TABLE });
    expect(s.pending.kind).toBe('setup');
    const mind = {};
    const m = chooseBotMove(s, seededRandom(1), { level: 'hard', maxMs: Infinity, budget: 20, mind });
    expect(isLegal(s, m)).toBe(true);
    expect(STYLES).toContain(mind.plan.style);
    expect(mind.plan.colors).toHaveLength(2);
    mind.plan.colors.forEach(q => expect(TABLE).toContain(q));
    expect(m.option).toBe(`color:${mind.plan.colors[0]}`);
    expect(mind.log[0].change).toBe('start');
  });

  it('keeps its plan within a round and nudges toward its colors', () => {
    let s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }], seed: 3, quadrants: ['red', 'thieves'] });
    s = toFirst(s, 'place');
    const me = s.pending.player, mind = {};
    const a = planFor(s, me, mind, seededRandom(2));
    expect(planFor(s, me, mind, seededRandom(9))).toBe(a);
    const slot = s.pending.options.find(o => o.kind === 'slot' && s.quadrants[o.q] === a.colors[0]);
    expect(planNudge(s, a, null, slot)).toBeGreaterThan(0);
  });

  it('memory credits what finished above the table and fades older games', () => {
    let s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }], seed: 5, quadrants: ['red', 'thieves'] });
    const rand = seededRandom(5);
    while (!s.over) s = applyMove(s, chooseBotMove(s, rand, { level: 'normal' }));
    const mem = newMemory();
    const seats = [{ plan: { style: 'engine', colors: ['red', 'thieves'] } }, { plan: { style: 'followers', colors: ['thieves', 'red'] } }];
    learnFromGame(mem, s, seats);
    const [a, b] = s.players.map(p => followers(s, p));
    expect(mem.games).toBe(1);
    expect(Math.sign(learned(mem, 'styles', 'engine'))).toBe(Math.sign(a - b));
    expect(mem.last.winner).toBe(a >= b ? 0 : 1);
    const n = mem.styles.engine.n;
    learnFromGame(mem, s, [{}, {}]);
    expect(mem.styles.engine.n).toBeCloseTo(n * 0.97);
  });

  it('a whole Hard game with plans and notes is legal and repeats for a seed', () => {
    const run = () => {
      let s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }], seed: 11, quadrants: ['red', 'echo'] });
      const rand = seededRandom(11), minds = [{ memory: newMemory() }, { memory: newMemory() }], moves = [];
      while (!s.over) {
        const m = chooseBotMove(s, rand, { level: 'hard', maxMs: Infinity, budget: 12, mind: minds[s.pending.player] });
        expect(isLegal(s, m)).toBe(true);
        moves.push(m.option);
        s = applyMove(s, m);
      }
      return moves.join();
    };
    expect(run()).toBe(run());
  });

  it('a value model starts at normal\'s yardstick and learns a part that pays', () => {
    expect(fitValueModel([]).rounds[2].w.map(v => Math.round(v * 100) / 100)).toEqual(PRIOR);
    // final followers = followers + liquid + 3 per member: the member weight climbs from 0 toward 3
    const rand = seededRandom(3), samples = [];
    for (let i = 0; i < 400; i++) {
      const x = [rand() * 30, 0, rand() * 20, rand() * 8, rand() * 10, Math.floor(rand() * 8), rand() * 15];
      samples.push({ round: 2, x, y: x[0] + x[2] + 3 * x[5] });
    }
    const m = fitValueModel(samples);
    expect(m.rounds[2].w[5]).toBeGreaterThan(2);
    expect(modelValues(m, 2, [[10, 0, 5, 0, 0, 2, 0]])[0]).toBeGreaterThan(18);
  });
});
