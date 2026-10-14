// @vitest-environment node
// Rule-benders (guest members) and the Release base rule: each one alone, then with Purple extra turns,
// Echo copies, Doppelganger and Magenta theft.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor, cardDef } from '../../../engine/v4/core.js';
import { defById } from '../../../engine/v4/content/index.js';
import { extraTurns, onBoard } from '../../../engine/v4/content/purple.js';
import { move, uidOf, ids, hasOpt } from './helpers.js';

const DEFAULT = ['gold', 'red', 'blue', 'green'];
function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], queue = null, slots = {}, quadrants = DEFAULT, rules = {}, order = null } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants, rules });
  s.queue = []; s.pending = null; s.round = round; s.slots = { ...slots }; s.squats = {}; s.log = [];
  s.order = order || [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = 3;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: 0 }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const cost = id => defById(id).s + defById(id).w;
const choose = (s, pred) => { const o = s.pending.options.find(pred); if (!o) throw new Error(`no option; have ${ids(s).join(', ')}`); return move(s, o.id); };
const passBuys = s => { while (s.pending?.kind === 'buy') s = move(s, 'pass'); return s; };
const pickAny = s => { while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id); return s; };
const JV = '0-0', RUSH = '0-1';

describe('guest members join the deck', () => {
  it('rule-benders are in the shared deck by default, and out with rules.guests off', () => {
    const on = createGame({ seats: [{}, {}], seed: 3 });
    const off = createGame({ seats: [{}, {}], seed: 3, rules: { guests: false } });
    const has = s => Object.values(s.cards).some(c => c.def === 'benders.squatter');
    expect(has(on)).toBe(true);
    expect(has(off)).toBe(false);
    expect(Object.keys(on.cards).length - Object.keys(off.cards).length).toBe(7);
  });
  it('a bender whose color is not on the table is paid in any colors', () => {
    // Squatter leans Magenta; the default table has no magenta
    const s = scene({ res: [{ red: 5, blue: 5 }], shop: ['benders.squatter'], queue: [{ t: 'buy', p: 0 }] });
    s.current = 0;
    expect(hasOpt(s, `card:${uidOf(s, 'benders.squatter', 'shop')}`)).toBe(true);
    const t = move(s, `card:${uidOf(s, 'benders.squatter', 'shop')}`);
    expect(R(t).red + R(t).blue).toBe(10 - cost('benders.squatter'));
  });
  it('a bender whose color is on the table counts as that sphere’s member and pays its colored part in it', () => {
    const s = scene({ quadrants: ['gold', 'red', 'purple', 'green'], res: [{ red: 20 }], shop: ['benders.frontrunner'], queue: [{ t: 'buy', p: 0 }] });
    expect(ids(s)).not.toContain(`card:${uidOf(s, 'benders.frontrunner', 'shop')}`);
    const t = scene({ quadrants: ['gold', 'red', 'purple', 'green'], members: [['benders.frontrunner']] });
    expect(contextFor(t).countMembersOfColor(t.players[0], 'purple')).toBe(1);
  });
});

describe('Squatter: once per round, place on a space a rival already took', () => {
  it('offers rivals’ taken spaces, does the action, and only once per round', () => {
    let s = scene({ members: [['benders.squatter']], slots: { [JV]: 1, [RUSH]: 0 } });
    expect(ids(s)).toContain(`squat:${JV}`);
    expect(ids(s)).not.toContain(`squat:${RUSH}`); // your own space: no
    s = move(s, `squat:${JV}`);
    s = pickAny(s);
    expect(R(s).gold).toBe(3);
    expect(s.slots[JV]).toBe(1);
    expect(s.squats[JV]).toEqual([0]);
    s = passBuys(s);
    // next turn, same round: spent
    s.queue.unshift({ t: 'turn', p: 0 }); s = resume(s);
    expect(ids(s).some(id => id.startsWith('squat:'))).toBe(false);
  });
  it('a joined space takes no third worker, and a new round gives a new use', () => {
    const s0 = scene({ n: 3, members: [['red.doppel'], [], ['benders.squatter']], slots: { [JV]: 1 }, queue: [] });
    s0.cards[uidOf(s0, 'red.doppel', 0)].copy = 'benders.squatter';
    s0.queue = [{ t: 'turn', p: 2 }];
    let t = move(resume(s0), `squat:${JV}`); t = pickAny(t); t = passBuys(t);
    t.queue.unshift({ t: 'turn', p: 0 }); t = resume(t);
    expect(ids(t)).not.toContain(`squat:${JV}`);
    // a new round: the same card works again
    t.round = 2; t.slots = { [RUSH]: 1 }; t.squats = {}; t.queue = [{ t: 'turn', p: 2 }]; t = resume(t);
    expect(ids(t)).toContain(`squat:${RUSH}`);
  });
  it('the joined worker counts on the board for Purple', () => {
    let s = scene({ quadrants: ['gold', 'red', 'purple', 'green'], members: [['benders.squatter']], slots: { [JV]: 1 } });
    s = move(s, `squat:${JV}`); s = pickAny(s);
    expect(onBoard(contextFor(s), s.players[0])).toBe(1);
  });
  it('Echo can copy a space that was joined: the copy gives what the space gives', () => {
    const Q = ['gold', 'red', 'echo', 'purple'];
    let s = scene({ quadrants: Q, members: [['benders.squatter']], queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = move(s, `slot:${RUSH}`); s = passBuys(pickAny(s)); // P2 takes Rush (+2 gold)
    s = move(s, `squat:${RUSH}`); s = passBuys(pickAny(s)); // P1 joins it
    expect(R(s, 0).gold).toBe(2);
    s = move(s, 'slot:2-2'); // P2 takes Echo
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.some(o => o.label.startsWith('Rush'))).toBe(true);
    s = choose(s, o => o.label.startsWith('Rush'));
    expect(R(s, 1).gold).toBe(4);
  });
});

describe('Big Spender: once per round, buy twice in one turn', () => {
  it('a second buy follows a real first buy, once per round', () => {
    let s = scene({ members: [['benders.bigspender']], res: [{ gold: 4, red: 4, blue: 4, green: 4 }], queue: [{ t: 'buy', p: 0 }, { t: 'buy', p: 0, extra: true }, { t: 'endTurn', p: 0 }] });
    s.current = 0;
    s = move(s, 'tier:mid');
    expect(s.pending.kind).toBe('buy');
    expect(s.pending.extra).toBe(true);
    s = move(s, 'tier:mid');
    expect(s.players[0].bonus).toBe(6);
    expect(s.pending).toBe(null);
    expect(s.cards[uidOf(s, 'benders.bigspender', 0)].spent.extraBuy).toBe(1);
    // another turn this round: one buy only
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = move(s, s.pending.options[0].id); s = pickAny(s);
    s = move(s, 'tier:small');
    expect(s.pending?.kind).not.toBe('buy');
  });
  it('passing the first buy gives no second one', () => {
    let s = scene({ members: [['benders.bigspender']], res: [{ gold: 4, red: 4 }], rules: { release: false }, queue: [{ t: 'buy', p: 0 }, { t: 'buy', p: 0, extra: true }, { t: 'endTurn', p: 0 }] });
    s = move(s, 'pass');
    expect(s.pending).toBe(null);
    expect(s.cards[uidOf(s, 'benders.bigspender', 0)].spent).toBeUndefined();
  });
  it('with a Purple extra turn: the extra turn has its own buy, and Big Spender is still once per round', () => {
    let s = scene({ quadrants: ['gold', 'red', 'purple', 'green'], members: [['benders.bigspender']], res: [{ gold: 9, red: 9, purple: 2, green: 9 }], rules: { release: false } });
    extraTurns(contextFor(s), s.players[0], 1);
    s = move(s, `slot:${RUSH}`);
    s = move(s, 'tier:mid'); s = move(s, 'tier:mid'); // the double buy
    expect(s.players[0].bonus).toBe(6);
    expect(s.pending.kind).toBe('place'); // the extra turn
    expect(s.pending.player).toBe(0);
    s = move(s, `slot:${JV}`); s = pickAny(s);
    s = move(s, 'tier:mid');
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].bonus).toBe(9);
  });
});

describe('Freelancer: pay any member’s colored part in any colors', () => {
  it('lets a member with a gold part be paid in red', () => {
    const id = 'gold.tycoon';
    const need = cost(id);
    const s = scene({ res: [{ red: need }], shop: [id], queue: [{ t: 'buy', p: 0 }] });
    expect(ids(s)).not.toContain(`card:${uidOf(s, id, 'shop')}`);
    let t = scene({ members: [['benders.freelancer']], res: [{ red: need }], shop: [id], rules: { release: false }, queue: [{ t: 'buy', p: 0 }] });
    t = move(t, `card:${uidOf(t, id, 'shop')}`);
    expect(R(t).red).toBe(0);
    expect(t.players[0].members.length).toBe(2);
  });
});

describe('Insider: also recruit from the top 3 of the pile', () => {
  it('offers the top 3 of the pile (not the 4th) and takes the card from the pile', () => {
    let s = scene({ members: [['benders.insider']], res: [{ gold: 30, red: 30, blue: 30, green: 30 }], rules: { release: false }, queue: [{ t: 'buy', p: 0 }] });
    const top = s.pile.slice(0, 4);
    for (const u of top.slice(0, 3)) expect(ids(s)).toContain(`card:${u}`);
    expect(ids(s)).not.toContain(`card:${top[3]}`);
    s = move(s, `card:${top[1]}`);
    expect(s.players[0].members).toContain(top[1]);
    expect(s.pile).not.toContain(top[1]);
    expect(s.shop.length).toBe(6);
  });
  it('a Doppelganger copying Insider does not reach deeper', () => {
    let s = scene({ members: [['benders.insider', 'red.doppel']], res: [{ gold: 30, red: 30, blue: 30, green: 30 }], rules: { release: false }, queue: [{ t: 'buy', p: 0 }] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'benders.insider';
    expect(ids(s)).not.toContain(`card:${s.pile[3]}`);
  });
});

describe('Extra Hand: +1 worker in round III', () => {
  it('gives its holder one more turn in round III, after the snake; none in rounds I–II', () => {
    let s = scene({ members: [['benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    expect(s.players[0].left).toBe(6);
    expect(s.players[1].left).toBe(5);
    expect(s.order.length).toBe(11);
    expect(s.order.at(-1)).toBe(0);
    const t = scene({ members: [['benders.extrahand']], queue: [{ t: 'round', r: 2 }] });
    expect(t.players[0].left).toBe(4);
  });
  it('a Doppelganger copy adds another worker', () => {
    const s0 = scene({ members: [['benders.extrahand', 'red.doppel']], queue: [] });
    s0.cards[uidOf(s0, 'red.doppel', 0)].copy = 'benders.extrahand';
    s0.queue = [{ t: 'round', r: 3 }];
    const s = resume(s0);
    expect(s.players[0].left).toBe(7);
  });
  it('a turn task with a ring limit only offers spaces of that ring or lower (the weaker version’s hook)', () => {
    const s = scene({ round: 3, queue: [{ t: 'turn', p: 0, ring: 1 }] });
    expect(s.pending.options.every(o => o.q !== undefined && Number(o.i) <= 2)).toBe(true);
  });
});

describe('Front-runner: always pick first in a round', () => {
  it('moves its holder to the front, even when ahead', () => {
    const s = scene({ n: 3, members: [[], [], ['benders.frontrunner']], bonus: [0, 1, 9], order: [0, 1, 2], queue: [{ t: 'round', r: 2 }] });
    expect(s.order.slice(0, 3)).toEqual([2, 0, 1]);
  });
  it('two Front-runners keep their usual order between them (fewer followers first)', () => {
    const s0 = scene({ n: 3, members: [['benders.frontrunner'], [], ['red.doppel']], bonus: [5, 0, 2], order: [0, 1, 2], queue: [] });
    s0.cards[uidOf(s0, 'red.doppel', 2)].copy = 'benders.frontrunner';
    s0.queue = [{ t: 'round', r: 2 }];
    const s = resume(s0);
    expect(s.order.slice(0, 3)).toEqual([2, 0, 1]);
  });
});

describe('Straggler: after the last worker is placed, move one of yours to an unused space and do it', () => {
  it('moves a worker, resolves the new space, keeps the old effect, and frees the old space', () => {
    let s = scene({ round: 2, members: [['benders.straggler']], res: [{ gold: 3 }], slots: { [JV]: 0 }, queue: [{ t: 'allPlaced' }] });
    expect(s.pending.kind).toBe('choose');
    s = choose(s, o => o.id === `from:${JV}`);
    s = choose(s, o => o.value === RUSH);
    expect(R(s).gold).toBe(3 + 4); // Rush in round II
    expect(s.slots[JV]).toBeUndefined();
    expect(s.slots[RUSH]).toBe(0);
    expect(s.pending).toBe(null); // no buy
  });
  it('may stay put, and acts once per round', () => {
    let s = scene({ round: 2, members: [['benders.straggler']], slots: { [JV]: 0 }, queue: [{ t: 'allPlaced' }] });
    s = choose(s, o => o.id === 'no');
    expect(s.slots[JV]).toBe(0);
    let t = scene({ round: 2, members: [['benders.straggler']], slots: { [JV]: 0 }, queue: [{ t: 'allPlaced' }] });
    t = choose(t, o => o.id === `from:${JV}`); t = choose(t, o => o.value === RUSH);
    t.queue = [{ t: 'allPlaced' }]; t = resume(t);
    expect(t.pending).toBe(null);
  });
  it('round I fills every space, so there is nothing to move to', () => {
    const full = Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => [`${q}-${i}`, q % 2])));
    const s = scene({ members: [['benders.straggler']], slots: full, queue: [{ t: 'allPlaced' }] });
    expect(s.pending).toBe(null);
  });
  it('runs before the round’s contests', () => {
    const s = scene({ round: 2, members: [['benders.straggler']], slots: { [JV]: 0 }, queue: [{ t: 'round', r: 2 }] });
    const q = s.queue.map(t => t.t);
    expect(q.indexOf('allPlaced')).toBe(q.indexOf('endRound') - 1);
  });
});

describe('Release (base rule): once per round, release a member for its cost in any colors', () => {
  it('is offered in the buy step; the card goes to the bottom of the pile and you take its cost in colors you pick', () => {
    const id = 'red.bigfamily';
    let s = scene({ members: [[id]], queue: [{ t: 'turn', p: 0 }] });
    s = move(s, `slot:${RUSH}`);
    const uid = uidOf(s, id, 0);
    const before = followers(s, s.players[0]);
    s = move(s, `release:${uid}`);
    expect(s.pile.at(-1)).toBe(uid);
    expect(s.players[0].members).not.toContain(uid);
    expect(followers(s, s.players[0])).toBe(before - defById(id).f);
    expect(s.pending.kind).toBe('choose');
    s = move(s, 'one:blue');
    s = move(s, 'all:green');
    expect(R(s).blue).toBe(1);
    expect(R(s).green).toBe(cost(id) - 1);
    // back to the buy, without a second release
    expect(s.pending.kind).toBe('buy');
    expect(ids(s).some(i => i.startsWith('release:'))).toBe(false);
  });
  it('once per round: a later turn in the same round has no release; next round does', () => {
    let s = scene({ members: [['red.twins', 'red.bigfamily']], queue: [{ t: 'turn', p: 0 }] });
    s = move(s, `slot:${RUSH}`);
    s = move(s, `release:${uidOf(s, 'red.twins', 0)}`); s = move(s, 'all:red'); s = move(s, 'pass');
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = move(s, `slot:${JV}`); s = pickAny(s);
    expect(ids(s).some(i => i.startsWith('release:'))).toBe(false);
    s.round = 2; s.queue = [{ t: 'buy', p: 0 }]; s.current = 0; s = resume(s);
    expect(ids(s)).toContain(`release:${uidOf(s, 'red.bigfamily', 0)}`);
  });
  it('is a rule flag: off means no release option', () => {
    const s = scene({ members: [['red.bigfamily']], rules: { release: false }, queue: [{ t: 'buy', p: 0 }] });
    s.current = 0;
    expect(s.pending).toBe(null); // nothing to buy, nothing to release
  });
  it('the refund is not a gain (gold gain doublers like Underdog don’t touch it)', () => {
    let s = scene({ members: [['gold.underdog', 'red.bigfamily']], res: [{}, { gold: 9 }], queue: [{ t: 'buy', p: 0 }] });
    s.current = 0; s = resume(s);
    s = move(s, `release:${uidOf(s, 'red.bigfamily', 0)}`);
    s = move(s, 'all:gold');
    expect(R(s).gold).toBe(cost('red.bigfamily'));
  });
  it('a released Doppelganger forgets its copy; a released Squatter comes back unspent', () => {
    let s = scene({ members: [['red.doppel', 'benders.squatter']], queue: [{ t: 'buy', p: 0 }] });
    const d = uidOf(s, 'red.doppel', 0), q = uidOf(s, 'benders.squatter', 0);
    s.cards[d].copy = 'benders.squatter'; s.cards[q].spent = { squat: 1 };
    s.current = 0; s = resume(s);
    s = move(s, `release:${d}`); s = move(s, 'all:red');
    expect(s.cards[d]).toEqual({ uid: d, def: 'red.doppel' });
  });
  it('can fund this turn’s buy (release comes before buying)', () => {
    let s = scene({ members: [['red.bigfamily']], res: [{ red: 1 }], queue: [{ t: 'buy', p: 0 }] });
    s.current = 0; s = resume(s);
    expect(ids(s)).not.toContain('tier:mid');
    s = move(s, `release:${uidOf(s, 'red.bigfamily', 0)}`);
    s = move(s, 'all:blue');
    expect(ids(s)).toContain('tier:mid');
  });
});

describe('Doppelganger and Magenta theft with once-per-round benders', () => {
  it('a Doppelganger copying Squatter is a second squat in the round', () => {
    let s = scene({ members: [['benders.squatter', 'red.doppel']], slots: { [JV]: 1, [RUSH]: 1 }, rules: { release: false } });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'benders.squatter';
    s = move(s, `squat:${JV}`); s = passBuys(pickAny(s));
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    expect(ids(s)).toContain(`squat:${RUSH}`);
  });
  it('a stolen Big Spender that was used this round stays used for the thief; next round it works', () => {
    const Q = ['gold', 'red', 'thieves', 'green'];
    let s = scene({ quadrants: Q, members: [[], ['benders.bigspender']], res: [{ gold: 9, red: 9, green: 9, magenta: 9 }], rules: { release: false }, queue: [] });
    const u = uidOf(s, 'benders.bigspender', 1);
    s.cards[u].spent = { extraBuy: 1 };
    contextFor(s).steal(s.players[0], s.players[1], { uid: u });
    expect(s.players[0].members).toContain(u);
    s.queue = [{ t: 'buy', p: 0 }, { t: 'buy', p: 0, extra: true }]; s.current = 0; s = resume(s);
    s = move(s, 'tier:mid');
    expect(s.pending).toBe(null);
    s.round = 2; s.queue = [{ t: 'buy', p: 0 }, { t: 'buy', p: 0, extra: true }]; s.current = 0; s = resume(s);
    s = move(s, 'tier:mid');
    expect(s.pending?.extra).toBe(true);
  });
  it('Magenta’s Heist can take a Front-runner, and the turn order follows the card', () => {
    const s = scene({ n: 3, members: [['benders.frontrunner']], order: [0, 1, 2], queue: [] });
    contextFor(s).steal(s.players[2], s.players[0], { uid: uidOf(s, 'benders.frontrunner', 0) });
    s.queue = [{ t: 'round', r: 2 }];
    const t = resume(s);
    expect(t.order[0]).toBe(2);
  });
});

describe('bots play every bender and Release without breaking the game', () => {
  it('easy bots finish 20 games with all rules on', async () => {
    const { chooseBotMove } = await import('../../../engine/v4/bots.js');
    const { seededRandom } = await import('../../../engine/v4/rng.js');
    for (let g = 1; g <= 20; g++) {
      const rand = seededRandom(g);
      let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: g % 2 ? DEFAULT : ['gold', 'red', 'purple', 'echo'] });
      let k = 0;
      while (!s.over && k++ < 3000) s = applyMove(s, chooseBotMove(s, rand, { level: 'easy' }));
      expect(s.over).toBe(true);
      for (const p of s.players) for (const r of s.resources) expect(p.res[r]).toBeGreaterThanOrEqual(0);
      // every card is somewhere exactly once
      const seen = [...s.pile, ...s.shop, ...s.players.flatMap(p => p.members)];
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen.length).toBe(Object.keys(s.cards).length);
    }
  }, 60000);
});
void cardDef;
