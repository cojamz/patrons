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
  it.each([1, 2, 3])('Build Up in round %i pays 3 / 4 / 5 green', round => {
    expect(R(go(scene({ round }), 'echo.chant')).green).toBe(round + 2);
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
    // A fresh Reprise by P1 has no prior own action to choose, and cannot revisit Echo. Echo +1, the copied Reprise +1.
    expect(s.pending.kind).not.toBe('choose');
    expect(R(s)).toEqual({ ...Z, green: 2 });
  });
  // Echo and Reprise give +1 green (Cory, Oct 28), Encore and Greatest Hits +1
  it.each([['echo.echo', 1], ['echo.encore', 1], ['echo.refrain', 1], ['echo.eternity', 1]])('%s still gives inherent green with no copy target', (action, green) => {
    const s = go(scene({ round: 3 }), action);
    expect(R(s)).toEqual({ ...Z, green });
  });
  it('Spree copied by Greatest Hits recruits after the whole chain, in the recruit step (Maxwell, Oct 26)', () => {
    let s = table(['gold', 'red', 'market', 'echo'], { round: 3, left: 8, shop: SHOP, queue: [0, 0, 0].map(p => ({ t: 'turn', p })) });
    s = go(s, 'market.spree');
    while (s.pending?.kind === 'buy') s = move(s, 'pass');
    s = go(s, 'gold.rush');
    const gold = R(s).gold;
    s = take(s, 'echo.eternity');
    expect(s.pending.prompt).toBe('Greatest Hits: copy which next?');
    s = chooseTarget(s, 'market.spree');
    expect(s.pending.kind).toBe('buy');
    expect(R(s).gold).toBeGreaterThan(gold);
    expect(s.pending.prompt).toMatch(/3 recruits left/);
  });
  it('Greatest Hits copies in the order you click its spaces (Cory, Oct 26)', () => {
    let s = scene({ round: 3, turns: [0, 0, 0, 0] });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant'); s = go(s, 'red.turnout');
    s = take(s, 'echo.eternity');
    expect(s.pending.prompt).toBe('Greatest Hits: copy which next?');
    expect(s.pending.options).toHaveLength(3);
    s = chooseTarget(s, 'echo.chant');
    expect(s.log.at(-1)).toMatch(/copied Build Up/);
    expect(s.pending.options.map(o => o.value).sort()).toHaveLength(2);
    s = chooseTarget(s, 'gold.rush');
    expect(s.log.some(l => /copied Golden Years|copies Golden Years/.test(l))).toBe(true);
  });
  it('an occupied center copies its printed gain, without recalculating the copier’s wealth', () => {
    let s = scene({ round: 3, turns: [0, 1, 0, 0], res: [{ gold: 3 }] });
    s = go(s, 'gold.strike'); s = go(s, 'echo.chant'); s = go(s, 'gold.rush');
    s = go(s, 'echo.eternity', target('gold.strike'));
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
    s = take(s, 'echo.echo');
    if (!/Collect Debts/.test(s.pending.prompt)) s = chooseTarget(s, 'gold.steal');
    expect(s.pending.prompt).toMatch(/Collect Debts/);
    s = pass(play(s, 'player:1', 'player:1', 'player:1'));
    expect([R(s).gold, R(s, 1).gold, R(s, 2).gold]).toEqual([3, 0, 2]);
  });
  // Encore copies a rival member's On Recruit (Cory, Oct 28): plain bodies have none, so it gives only its +1 green
  it('Encore with no rival On Recruit to copy gives only its own green', () => {
    let s = scene({ round: 3, turns: [1, 1, 0, 0], res: [{}, { gold: 5 }], members: [[], ['red.intern', 'red.twins', 'red.volunteer']] });
    s = go(s, 'gold.windfall'); s = go(s, 'gold.strike'); s = go(s, 'echo.chant');
    s = pass(take(s, 'echo.encore'));
    expect(R(s)).toEqual({ ...Z, green: 6 });
    expect(s.log.some(l => /no rival's member has an On Recruit/.test(l))).toBe(true);
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
    expect(Object.values(ledger(s).last).map(e => [e.name, e.res])).toEqual([['Build Up', { green: 3 }]]);
  });
  // Walk-In (Cory, 2026-10-27): recruit the top member of the deck, each rival +1 red. A copy does it again: the
  // copier recruits the deck's new top member, free, and the copy's rivals get their +1 red
  it('a copied Walk-In recruits the next top member of the deck, free', () => {
    let s = scene({ turns: [1, 0] });
    const [first, next] = s.pile;
    s = go(s, 'red.hire');
    expect(s.players[1].members).toEqual([first]);
    expect(R(s).red).toBe(1);
    s = take(s, 'echo.echo');
    expect(s.pending.options[0].label).toBe('Walk-In (P2): do Walk-In yourself');
    s = pass(move(s, s.pending.options[0].id));
    expect(s.players[0].members).toEqual([next]);
    expect([R(s).red, R(s).green, R(s, 1).red]).toEqual([2, 1, 2]); // nothing spent on the recruit
  });
  it('copying a discount grants its printed discount without spending the copier’s resources', () => {
    let s = scene({ round: 2, turns: [1, 1, 0], res: [{ gold: 1 }] });
    s = go(s, 'gold.steal', 'player:0'); s = go(s, 'gold.discount');
    s = take(s, 'echo.echo');
    if (s.pending?.kind === 'choose' && s.pending.options.some(o => o.label.startsWith('Intro Offer') || o.label.includes('discount'))) s = pass(move(s, s.pending.options[0].id));
    else s = pass(s);
    expect(s.players[0].discount).toBe(4);
    expect(R(s)).toEqual({ ...Z, green: 1 });
  });
});

describe('Green table member boundaries', () => {
  it('Green contests count held green resources while Agents retains its member quantity', () => {
    const s = scene({ members: [['echo.agents']], res: [{}, { green: 40 }] });
    expect(memberCount(s, s.players[0])).toBe(2);
    expect(echo.scoring.score(contextFor(s), s.players[0])).toBe(0);
    expect(echo.scoring.score(contextFor(s), s.players[1])).toBe(40);
    expect(echo.scoring.label).toBe('Most green');
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
