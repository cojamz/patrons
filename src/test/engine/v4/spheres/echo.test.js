// @vitest-environment node
// Green table regressions: exact action yields, free recruits, discounts, legacy ledger and complete seeded games.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor, memberCount } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import echo, { ledger } from '../../../../engine/v4/content/echo.js';
import { take, move, play, uidOf, ids, actionName } from '../helpers.js';
import { table, useCosts } from '../cards-helpers-b.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';
import { FULL_DECK } from '../../../../engine/v4/content/cull.js';

const GAMES = games(200);
const QUADS = ['gold', 'red', 'blue', 'echo'];
describe('Green table scenarios', () => {
useCosts({
  'red.intern': [1, 0], 'red.volunteer': [0, 0], 'red.twins': [1, 1],
  'gold.taxman': [1, 1], 'gold.seed': [2, 0],
});
const Z = { gold: 0, red: 0, blue: 0, green: 0 };
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.bigfamily'];
const R = (s, i = 0) => s.players[i].res;
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const scene = ({ turns = [0, 1, 0, 1, 0, 1], ...opts } = {}) => table(QUADS, {
  left: 8, shop: SHOP, queue: turns.map(p => ({ t: 'turn', p })), ...opts,
});
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const go = (s, name, ...then) => pass(play(take(s, name), ...then));
const target = id => o => o.kind === 'space' && o.label.startsWith(actionName(id));
const chooseTarget = (s, id) => play(s, target(id));

describe('Green table action boundaries', () => {
  it.each([1, 2, 3])('Build Up pays %i plus one inherent green', round => {
    expect(R(go(scene({ round }), 'echo.chant')).green).toBe(round + 1);
  });
  it('Echo can copy your immediately previous action on a consecutive turn', () => {
    let s = scene({ turns: [1, 0, 0] });
    s = go(s, 'echo.chant'); s = go(s, 'gold.rush');
    s = go(s, 'echo.echo', target('gold.rush'));
    expect(R(s)).toEqual({ ...Z, gold: 4, green: 1 });
  });
  it('Echo uses only the immediately previous action, including when that action is a copy', () => {
    let s = scene({ round: 2, turns: [1, 1, 0] });
    s = go(s, 'gold.rush');
    s = go(s, 'echo.refrain', target('gold.rush'));
    s = take(s, 'echo.echo');
    expect(s.pending.options).toHaveLength(1);
    expect(s.pending.options[0].label).toMatch(/^Reprise /);
    s = move(s, s.pending.options[0].id);
    // A fresh Reprise by P1 has no prior own action to choose, and cannot revisit Echo.
    expect(s.pending.kind).not.toBe('choose');
    expect(R(s)).toEqual({ ...Z, green: 2 });
  });
  it.each(['echo.echo', 'echo.encore', 'echo.refrain', 'echo.eternity'])('%s still gives inherent green with no copy target', action => {
    const s = go(scene({ round: 3 }), action);
    expect(R(s)).toEqual({ ...Z, green: 1 });
  });
  it('an occupied center copies its printed gain, without recalculating the copier’s wealth', () => {
    let s = scene({ round: 3, turns: [0, 1, 0, 0], res: [{ gold: 3 }] });
    s = go(s, 'gold.strike'); s = go(s, 'echo.chant'); s = go(s, 'gold.rush');
    s = go(s, 'echo.eternity');
    expect(R(s)).toEqual({ ...Z, gold: 21, green: 1 });
  });
  it('the original owner’s passive bonuses never enter the chip', () => {
    let s = scene({ turns: [1, 0], res: [{ gold: 9 }], members: [[], ['gold.prospector', 'gold.underdog']] });
    s = go(s, 'gold.rush');
    expect(R(s, 1).gold).toBe(5);
    s = take(s, 'echo.echo');
    expect(s.pending.options[0].label).toBe('Golden Years (P2): +2 gold');
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s)).toEqual({ ...Z, gold: 11, green: 1 });
  });
  it('copying Kickback copies the printed self-gain without giving a second gift', () => {
    let s = scene({ turns: [1, 0] });
    s = go(s, 'gold.jv', 'player:0');
    s = go(s, 'echo.echo', target('gold.jv'));
    expect([R(s).gold, R(s, 1).gold]).toEqual([4, 3]);
  });
  it('copying a steal offers the copier’s own victim choices and drains exactly those victims', () => {
    let s = scene({ round: 2, turns: [1, 0, 0], res: [{ gold: 1 }, {}, { gold: 4 }], n: 3 });
    s = go(s, 'gold.steal', 'player:0');
    s = pass(play(s, 'player:2', 'player:2'));
    s = chooseTarget(take(s, 'echo.encore'), 'gold.steal');
    expect(s.pending.prompt).toMatch(/Collect Debts/);
    s = pass(play(s, 'player:1', 'player:1', 'player:1'));
    expect([R(s).gold, R(s, 1).gold, R(s, 2).gold]).toEqual([3, 0, 2]);
  });
  it('Encore excludes your ordinary actions but includes a rival’s center', () => {
    let s = scene({ round: 3, turns: [1, 1, 0, 0], res: [{}, { gold: 5 }], members: [[], ['red.intern', 'red.twins', 'red.volunteer']] });
    s = go(s, 'gold.windfall'); s = go(s, 'gold.strike'); s = go(s, 'echo.chant');
    s = take(s, 'echo.encore');
    expect(s.pending.options.map(o => o.label).sort()).toEqual(['Double Down (P2): +9 gold', 'Tithe (P2): +4 gold']);
    s = pass(chooseTarget(s, 'gold.windfall'));
    expect(R(s)).toEqual({ ...Z, gold: 4, green: 5 });
  });
  it('Reprise copies an own action and leaves a rival’s actions unavailable', () => {
    let s = scene({ round: 2, turns: [0, 1, 0] });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    s = take(s, 'echo.refrain');
    expect(s.pending.options.map(o => o.label)).toEqual(['Golden Years (P1): +4 gold']);
    s = pass(chooseTarget(s, 'gold.rush'));
    expect(R(s)).toEqual({ ...Z, gold: 8, green: 1 });
  });
  it('last round’s ledger survives the new round without leaking old targets into current choices', () => {
    let s = scene({ turns: [1] });
    s = go(s, 'echo.chant');
    s.round = 2; s.slots = {}; s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = go(s, 'gold.rush');
    expect(Object.keys(ledger(s).now)).toEqual(['0-1']);
    expect(Object.values(ledger(s).last).map(e => [e.name, e.res])).toEqual([['Build Up', { green: 2 }]]);
  });
  it('a copied free recruit reports no eligible card instead of hanging', () => {
    let s = scene({ turns: [1, 0], shop: ['red.intern', 'red.volunteer', ...SHOP.slice(0, 4)] });
    s = go(s, 'red.hire');
    expect(defs(s, 1)).toEqual(['red.volunteer']);
    s = take(s, 'echo.echo');
    expect(s.pending.options[0].label).toBe('Open Door (P2): a free member (none face up)');
    s = move(s, s.pending.options[0].id);
    expect(defs(s, 0)).toEqual([]);
    expect(s.pending?.kind).not.toBe('choose');
  });
  it('a positive free-recruit price cap also reports when no eligible card remains', () => {
    let s = scene({ turns: [1, 0], shop: ['red.intern', 'gold.seed', ...SHOP.slice(0, 4)] });
    s = go(s, 'red.hire');
    s = take(s, 'echo.echo');
    expect(s.pending.options[0].label).toBe('Open Door (P2): a member costing 1 or less (none face up)');
    s = move(s, s.pending.options[0].id);
    expect(defs(s, 0)).toEqual([]);
  });
  it('a copied free recruit offers only eligible face-up members and costs no resources', () => {
    let s = scene({ turns: [1, 0], shop: ['gold.taxman', 'red.twins', 'gold.seed', ...SHOP.slice(0, 3)] });
    s = take(s, 'red.hire');
    s = pass(move(s, 'card:' + uidOf(s, 'gold.taxman', 'shop')));
    s = chooseTarget(take(s, 'echo.echo'), 'red.hire');
    const labels = s.pending.options.map(o => o.label);
    expect(labels).toEqual(expect.arrayContaining(['Twins (2)', 'Treasurer (2)']));
    expect(labels.every(l => Number(l.match(/\((\d+)\)$/)[1]) <= 2)).toBe(true);
    s = pass(move(s, 'card:' + uidOf(s, 'red.twins', 'shop')));
    expect(defs(s, 0)).toEqual(['red.twins']);
    expect(R(s)).toEqual({ ...Z, green: 1 });
  });
  it('copying a discount grants its printed discount without spending the copier’s resources', () => {
    let s = scene({ round: 2, turns: [1, 1, 0], res: [{ gold: 1 }] });
    s = go(s, 'gold.discount'); s = go(s, 'gold.steal', 'player:0');
    s = go(s, 'echo.encore', target('gold.discount'));
    expect(s.players[0].discount).toBe(4);
    expect(R(s)).toEqual({ ...Z, green: 1 });
  });
});

describe('Green table member boundaries', () => {
  it('Green contests count printed member quantity, including Agents, rather than resources', () => {
    const s = scene({ members: [['echo.agents']], res: [{}, { green: 40 }] });
    expect(echo.scoring.score(contextFor(s), s.players[0])).toBe(2);
    expect(echo.scoring.score(contextFor(s), s.players[1])).toBe(0);
    expect(echo.scoring.label).toBe('Most green members');
  });
  it('Busker and Connector do not pay recruit bonuses merely for being given to a player', () => {
    const s = scene({ members: [[], ['echo.evergreen', 'echo.connector']], turns: [0] });
    const ctx = contextFor(s);
    ctx.moveMember(uidOf(s, 'echo.evergreen', 1), s.players[1], s.players[0]);
    ctx.moveMember(uidOf(s, 'echo.connector', 1), s.players[1], s.players[0]);
    expect(R(s).green).toBe(0);
  });
  it('Muse never pays for its own owner’s copy', () => {
    let s = scene({ turns: [1, 0], members: [['echo.muse']] });
    s = go(s, 'gold.rush'); s = go(s, 'echo.echo', target('gold.rush'));
    expect(R(s).green).toBe(1);
  });
  it('Stunt Double is a recruit trigger, never a reusable buy-phase option', () => {
    let s = scene({ members: [['echo.hourglass']], turns: [0, 0] });
    s = take(s, 'gold.rush');
    expect(ids(s)).not.toContain('use:' + uidOf(s, 'echo.hourglass', 0));
    expect(R(s).gold).toBe(2);
  });
  it('an Agents copy retains its printed two-member/follower quantity', () => {
    const s = scene({ members: [['echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'echo.agents';
    expect(memberCount(s, s.players[0])).toBe(2);
    expect(followers(s, s.players[0])).toBe(3);
  });
  it('Tribute Band remains spent across a round change', () => {
    let s = scene({ members: [['echo.dejavu']], turns: [0] });
    s = take(s, 'gold.rush');
    const uid = uidOf(s, 'echo.dejavu', 0);
    s = move(s, 'use:' + uid);
    expect(s.cards[uid].used).toBe(true);
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(s.cards[uid].used).toBe(true);
  });
  it('Chronicler counts itself and weighted green members, ignoring non-green members', () => {
    const s = scene({ members: [['echo.chronicler', 'echo.agents', 'red.twins']], res: [{ green: 80 }], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Chronicler +3');
  });
});

});

describe('Green on the table: ' + GAMES + ' seeded bot games', () => {
  it('games finish cleanly with every invariant', () => {
    // Real costs and the real twelve-member Green deck: deterministic full games, with choices bounded by move count.
    const previous = FULL_DECK.tests;
    FULL_DECK.tests = false;
    try {
    for (let g = 1; g <= GAMES; g++) {
      const rand = seededRandom(g * 31);
      const n = 2 + (g % 3);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants: QUADS });
      let guard = 0;
      while (!s.over && guard++ < 1500) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (g <= 40) checkInvariants(s, 'game ' + g);
      }
      expect(s.over).toBe(true);
    }
    } finally { FULL_DECK.tests = previous; }
  });
});
