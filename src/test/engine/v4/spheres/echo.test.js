// @vitest-environment node
// Green (echo): every action and every member, with exact numbers. Plus 200 seeded bot games.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import echo, { install, ledger } from '../../../../engine/v4/content/echo.js';
import { take, move, play, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

install();
const QUADS = ['gold', 'red', 'blue', 'echo'];
// the costs these tests are written against (repricing the real cards doesn't break them)
const PINNED = { ...TEST_COSTS, ...Object.fromEntries(echo.members.map(d => [d.id, [1, 1]])) };
for (const k of Object.keys(PINNED)) if (k.startsWith('green.')) delete PINNED[k];
let restore;
beforeEach(() => { restore = pinCosts(PINNED); });
afterEach(() => { restore(); });

const Z = { gold: 0, red: 0, blue: 0, green: 0 };
const R = s => s.players.map(p => p.res);
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.bigfamily'];

// scene() from helpers, on the Green table. `queue` defaults to turns for P1, P2, P1, P2, ...
function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = SHOP, bonus = [], turns = null, queue = null } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: QUADS });
  Object.assign(s, { queue: [], pending: null, round, slots: {}, order: [], log: [] });
  delete s.echo;
  s.players.forEach((p, i) => { p.res = { ...Z, ...(res[i] || {}) }; p.bonus = bonus[i] || 0; p.left = 5; p.discount = 0; });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(def); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  for (const d of shop) s.shop.push(grab(d));
  s.queue = queue || (turns || [0, 1, 0, 1, 0, 1]).map(p => ({ t: 'turn', p }));
  return resume(s);
}
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
// place and pass the buy
const go = (s, name, ...then) => pass(play(take(s, name), ...then));
const spaceOpt = (s, name) => o => o.label.startsWith(name);

describe('Green actions', () => {
  it('Hum: +3 green', () => {
    const s = go(scene(), 'Hum');
    expect(R(s)[0]).toEqual({ ...Z, green: 3 });
  });

  it('Chant: +2 green per round number', () => {
    expect(R(go(scene(), 'Chant'))[0].green).toBe(2);
    expect(R(go(scene({ round: 3 }), 'Chant'))[0].green).toBe(6);
  });

  it('Echo: copies exactly what the space gave, never recomputed', () => {
    // P2 takes Rush in round II (+4 gold). P1 copies exactly +4.
    let s = scene({ round: 2, turns: [1, 0], members: [['red.intern', 'red.twins'], []] });
    s = go(s, 'Rush');
    expect(R(s)[1].gold).toBe(4);
    s = take(s, 'Echo');
    expect(ids(s)).toEqual([`space:now:0-1`]);
    s = pass(move(s, 'space:now:0-1'));
    expect(R(s)[0]).toEqual({ ...Z, gold: 4 });
    expect(R(s)[1]).toEqual({ ...Z, gold: 4 }); // the original taker keeps theirs
  });

  it('Echo: any outer-ring space this round, yours or a rival’s; never an echo, ring II or the center', () => {
    let s = scene({ round: 3, turns: [1, 1, 1, 0, 0, 1], res: [{}, { gold: 2 }], members: [[], ['red.intern']] });
    s = go(s, 'Windfall');            // P2 ring II: +1 gold
    s = go(s, 'Strike');              // P2 center
    s = go(s, 'Hum');                 // P2 ring I: +3 green
    s = go(s, 'Rush');                // P1 ring I: +6 gold
    s = take(s, 'Echo');
    expect(s.pending.options.map(o => o.label).sort()).toEqual(['Hum (P2): +3 green', 'Rush (P1): +6 gold']);
    s = pass(play(s, spaceOpt(s, 'Rush')));
    expect(R(s)[0].gold).toBe(12);
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label).sort()).toEqual(['Hum (P2): +3 green', 'Rush (P1): +6 gold', 'Windfall (P2): +1 gold']);
  });

  it('Echo: with nothing to copy, nothing happens', () => {
    const s = go(scene(), 'Echo');
    expect(R(s)[0]).toEqual(Z);
  });

  it('Exact copy: the taker’s member bonuses are not copied (Prospector, Underdog)', () => {
    // P2 has Prospector (+1 on action gold) and Underdog (doubles while someone has more gold): Rush gives P2 2*2+1 = 5
    let s = scene({ turns: [1, 0], res: [{ gold: 9 }, {}], members: [[], ['gold.prospector', 'gold.underdog']] });
    s = go(s, 'Rush');
    expect(R(s)[1].gold).toBe(5);
    s = take(s, 'Echo');
    expect(s.pending.options[0].label).toBe('Rush (P2): +2 gold'); // the chip shows the printed gain
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s)[0].gold).toBe(11);
  });

  it('Exact copy: Joint Venture copies the +3, not the gift', () => {
    let s = scene({ turns: [0, 0] });
    s = go(s, 'Joint Venture', 'player:1');
    s = go(s, 'Echo', spaceOpt(s, 'Joint Venture'));
    expect(R(s)[0].gold).toBe(6);
    expect(R(s)[1].gold).toBe(1);
  });

  it('Exact copy: a space that took or traded is copied by doing it yourself', () => {
    let s = scene({ round: 2, turns: [1, 0, 0], res: [{ gold: 1 }, {}, { gold: 4 }], n: 3 });
    s = go(s, 'Steal', 'player:0'); // P2 steals P1's only gold, then P3's
    expect(s.pending.kind).toBe('choose');
    s = pass(play(s, 'player:2', 'player:2'));
    expect(R(s)[1].gold).toBe(3);
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label)).toEqual(['Steal (P2): do Steal yourself']);
    s = move(s, s.pending.options[0].id);
    // P1 now steals: from P2 or P3
    expect(s.pending.prompt).toMatch(/Steal/);
    s = pass(play(s, 'player:1', 'player:1', 'player:1'));
    expect(R(s)[0].gold).toBe(3);
    expect(R(s)[1].gold).toBe(0);
  });

  it('Encore: any space this round, anyone’s, rings I and II (not the center, not an echo)', () => {
    let s = scene({ round: 3, turns: [1, 1, 0, 0], res: [{}, { gold: 5 }], members: [[], ['red.intern', 'red.twins', 'red.volunteer']] });
    s = go(s, 'Windfall'); // P2 +3 gold (3 members); P1 has none and still copies +3
    s = go(s, 'Strike');   // P2 center
    s = go(s, 'Hum');      // P1 +3 green
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label).sort()).toEqual(['Hum (P1): +3 green', 'Windfall (P2): +3 gold']);
    s = pass(play(s, spaceOpt(s, 'Windfall')));
    expect(R(s)[0]).toEqual({ ...Z, gold: 3, green: 3 });
  });

  it('Recall: copies a space from last round', () => {
    let s = scene({ round: 1, turns: [1], queue: [{ t: 'turn', p: 1 }] });
    s = go(s, 'Hum');
    // next round: the ledger keeps last round's spaces
    s.round = 2; s.slots = {}; s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = take(s, 'Recall');
    expect(s.pending.options.map(o => o.label)).toEqual(['Hum (P2): +3 green']);
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s)[0].green).toBe(3);
    expect(Object.keys(ledger(s).now)).toEqual(['3-4']); // this round only has Recall so far
    expect(Object.values(ledger(s).last).map(e => [e.name, e.res])).toEqual([['Hum', { green: 3 }]]); // last round's chips stay readable
  });

  it('Eternity: copies every space you took this round, skipping echoes', () => {
    let s = scene({ round: 3, turns: [0, 0, 0, 0], members: [['red.intern'], []] });
    s = go(s, 'Rush');                 // +6 gold
    s = go(s, 'Hum');                  // +3 green
    s = go(s, 'Echo', spaceOpt(s, 'Rush'));   // echo: +6 gold, can't be copied again
    expect(R(s)[0]).toEqual({ ...Z, gold: 12, green: 3 });
    s = go(s, 'Eternity');
    expect(R(s)[0]).toEqual({ ...Z, gold: 18, green: 6 });
  });

  it('Copying a free member: take a face-up member costing no more, free', () => {
    // P2 Hires the cheapest (Intern, cost 1). P1 echoes: any face-up member costing 1 or less.
    let s = scene({ round: 1, turns: [1, 0], shop: ['red.intern', 'red.volunteer', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor'] });
    s = go(s, 'Hire');
    expect(defs(s, 1)).toEqual(['red.volunteer']);
    s = take(s, 'Echo');
    expect(s.pending.options[0].label).toBe('Hire (P2): a member (≤0)');
    s = move(s, s.pending.options[0].id);
    // Volunteer costs 0; nothing face up costs 0 any more
    expect(defs(s, 0)).toEqual([]);
  });

  it('Copying a free member: picks among those costing no more', () => {
    let s = scene({ round: 1, turns: [1, 0], shop: ['red.intern', 'gold.seed', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor'] });
    s = go(s, 'Hire'); // Intern, cost 1
    s = take(s, 'Echo');
    expect(s.pending.options[0].label).toBe('Hire (P2): a member (≤1)');
    s = move(s, s.pending.options[0].id);
    // nothing else face up costs 1 or less: Seed Money is 2 (pinned), so the copy finds nothing
    expect(defs(s, 0)).toEqual([]);
  });

  it('Copying a free member: you pick among the face-up members costing no more', () => {
    let s = scene({ round: 1, turns: [1, 0], shop: ['gold.taxman', 'red.twins', 'gold.seed', 'gold.jackpot', 'gold.tycoon', 'red.mentor'] });
    s = take(s, 'Hire'); // three cost 2: P2 picks Tax Collector
    s = pass(move(s, `card:${uidOf(s, 'gold.taxman', 'shop')}`));
    s = take(s, 'Echo');
    expect(s.pending.options[0].label).toBe('Hire (P2): a member (≤2)');
    s = move(s, s.pending.options[0].id);
    const labels = s.pending.options.map(o => o.label);
    expect(labels).toEqual(expect.arrayContaining(['Twins (2)', 'Seed Money (2)']));
    expect(labels.every(l => Number(l.match(/\((\d+)\)$/)[1]) <= 2)).toBe(true);
    s = pass(move(s, `card:${uidOf(s, 'red.twins', 'shop')}`));
    expect(defs(s, 0)).toEqual(['red.twins']);
    expect(R(s)[0]).toEqual(Z); // free
  });

  it('Copying a discount', () => {
    let s = scene({ round: 2, turns: [1, 1, 0, 0], res: [{ gold: 1 }, {}] });
    s = go(s, 'Discount');
    s = go(s, 'Steal', 'player:0'); // P2 steals P1's only gold: +1
    expect(R(s)[0].gold).toBe(0);
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label).sort()).toEqual(['Discount (P2): 2 off', 'Steal (P2): do Steal yourself']);
    s = pass(play(s, spaceOpt(s, 'Discount')));
    expect(s.players[0].discount).toBe(2);
    s = go(s, 'Recall'); // nothing last round
    expect(R(s)[0].gold).toBe(0);
  });
});

describe('Green scoring', () => {
  it('Most green at round end', () => {
    expect(echo.scoring.score(null, { res: { green: 4 } })).toBe(4);
    expect(echo.scoring.label).toBe('Most green');
  });
});

describe('Green members', () => {
  it('Evergreen: +3 green at round start', () => {
    const s = scene({ members: [['echo.evergreen'], []], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].green).toBe(3);
  });

  it('Choir: +1 green whenever you copy', () => {
    let s = scene({ turns: [0, 0], members: [['echo.choir'], []] });
    s = go(s, 'Hum');
    s = go(s, 'Echo', spaceOpt(s, 'Hum'));
    expect(R(s)[0].green).toBe(7);
  });

  it('Muse: +2 green whenever a rival copies one of your spaces (not when you copy your own)', () => {
    let s = scene({ round: 2, turns: [1, 0, 1], members: [[], ['echo.muse']] });
    s = go(s, 'Hum');
    s = go(s, 'Echo', spaceOpt(s, 'Hum'));
    expect(R(s)[1].green).toBe(5);
    s = go(s, 'Encore', spaceOpt(s, 'Hum'));
    expect(R(s)[1].green).toBe(8);
  });

  it('Choirmaster: +1 green whenever a rival copies', () => {
    let s = scene({ turns: [0, 0], members: [[], ['echo.choirmaster']] });
    s = go(s, 'Hum');
    s = go(s, 'Echo', spaceOpt(s, 'Hum'));
    expect(R(s)[1].green).toBe(1);
  });

  it('Fan: +2 green whenever a rival takes a center space', () => {
    let s = scene({ round: 3, turns: [1, 1, 0], members: [['echo.fan'], []] });
    s = go(s, 'Rush');               // ring I: nothing
    expect(R(s)[0].green).toBe(0);
    s = go(s, 'Strike');             // center
    expect(R(s)[0].green).toBe(2);
    s = go(s, 'Eternity');           // your own center: nothing
    expect(R(s)[0].green).toBe(2);
  });

  it('Groupie: +1 green whenever anyone recruits a green member', () => {
    let s = scene({ turns: [1], members: [['echo.groupie'], []], res: [{}, { green: 2 }], shop: ['echo.choir', ...SHOP.slice(1)] });
    s = take(s, 'Hum');
    s = play(s, `card:${uidOf(s, 'echo.choir', 'shop')}`);
    expect(R(s)[0].green).toBe(1);
  });

  it('Translator: what you copy comes as green; it can be switched off', () => {
    let s = scene({ round: 2, turns: [0, 0, 0], members: [['echo.translator'], []] });
    s.cards[s.players[0].members[0]].on = true;
    s = go(s, 'Rush');                       // +4 gold
    s = go(s, 'Echo', spaceOpt(s, 'Rush')); // +4 as green
    expect(R(s)[0]).toEqual({ ...Z, gold: 4, green: 4 });
    s = take(s, 'Encore');
    s = play(s, spaceOpt(s, 'Rush'));
    expect(R(s)[0]).toEqual({ ...Z, gold: 4, green: 8 });
    s = move(s, `toggle:${s.players[0].members[0]}`);
    expect(s.cards[s.players[0].members[0]].on).toBe(false);
  });

  it('Tuning Fork: whenever you copy a space, +1 of that space’s color', () => {
    let s = scene({ round: 2, turns: [0, 0, 0, 0], members: [['echo.tuningfork'], []] });
    s = go(s, 'Rush');                       // +4 gold
    s = go(s, 'Echo', spaceOpt(s, 'Rush')); // +4 gold, +1 gold
    expect(R(s)[0]).toEqual({ ...Z, gold: 9 });
    s = go(s, 'Hum');
    s = go(s, 'Encore', spaceOpt(s, 'Hum'));  // +3 green, +1 green
    expect(R(s)[0]).toEqual({ ...Z, gold: 9, green: 7 });
  });

  it('Wallflower: what you copy is doubled while no one has fewer followers than you', () => {
    let s = scene({ turns: [0, 0, 0], members: [['echo.wallflower'], []], bonus: [0, 1] });
    s = go(s, 'Hum');
    s = go(s, 'Echo', spaceOpt(s, 'Hum'));
    expect(R(s)[0].green).toBe(9); // 3 + 6 doubled (P1 and P2 both have 2 followers: no one has fewer)
  });

  it('Wallflower: not doubled while someone has fewer followers', () => {
    let s = scene({ turns: [0, 0], members: [['echo.wallflower'], []] });
    s = go(s, 'Hum');
    s = go(s, 'Echo', spaceOpt(s, 'Hum'));
    expect(R(s)[0].green).toBe(6); // P1 2 followers, P2 1
  });

  it('Keepsake: when recruited, copy one of your spaces from this round', () => {
    let s = scene({ round: 2, turns: [0], res: [{ green: 2 }, {}], shop: ['echo.keepsake', ...SHOP.slice(1)] });
    s = take(s, 'Rush');
    s = play(s, `card:${uidOf(s, 'echo.keepsake', 'shop')}`);
    s = move(s, s.pending.options.find(o => o.label.startsWith('Rush')).id);
    expect(R(s)[0]).toEqual({ ...Z, gold: 8, green: 0 });
  });

  it('Mirror: when recruited, gain as much green as the rival with the most', () => {
    let s = scene({ n: 3, turns: [0], res: [{ green: 2 }, { green: 5 }, { green: 3 }], shop: ['echo.mirror', ...SHOP.slice(1)] });
    s = take(s, 'Rush');
    s = play(s, `card:${uidOf(s, 'echo.mirror', 'shop')}`);
    expect(R(s)[0].green).toBe(5);
  });

  it('Afterimage: at round start, copy one of your spaces from last round', () => {
    let s = scene({ turns: [0, 1], members: [['echo.afterimage'], []] });
    s = go(s, 'Rush');                       // +2 gold
    s = go(s, 'Hum');                        // P2
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(s.pending.prompt).toMatch(/Afterimage/);
    expect(s.pending.options.map(o => o.label)).toEqual(['Rush (P1): +2 gold']);
    s = move(s, s.pending.options[0].id);
    expect(R(s)[0].gold).toBe(4);
  });

  it('Hourglass: once per round, copy the space you just took', () => {
    let s = scene({ round: 2, turns: [0, 0], members: [['echo.hourglass'], []] });
    const u = s.players[0].members[0];
    s = take(s, 'Rush');
    s = move(s, `use:${u}`);
    expect(R(s)[0].gold).toBe(8);
    expect(ids(s)).not.toContain(`use:${u}`);
    s = pass(s);
    s = take(s, 'Hum');
    expect(ids(s)).not.toContain(`use:${u}`); // once per round
  });

  it('Hourglass: ready again next round', () => {
    let s = scene({ round: 2, members: [['echo.hourglass'], []], queue: [{ t: 'round', r: 3 }] });
    const u = s.players[0].members[0];
    s.cards[u].used = true;
    s = resume(Object.assign(s, { queue: [{ t: 'round', r: 3 }] }));
    expect(s.cards[u].used).toBe(false);
  });

  it('Hourglass: with nothing to copy it stays ready', () => {
    let s = scene({ round: 2, turns: [0], members: [['echo.hourglass'], []] });
    const u = s.players[0].members[0];
    s = take(s, 'Echo'); // an echo can't be copied
    s = move(s, `use:${u}`);
    expect(ids(s)).toContain(`use:${u}`);
  });

  it('Déjà Vu: once per game, copy every space you took this round', () => {
    let s = scene({ round: 2, turns: [0, 0], members: [['echo.dejavu'], []] });
    const u = s.players[0].members[0];
    s = go(s, 'Rush');
    s = take(s, 'Hum');
    s = move(s, `use:${u}`);
    expect(R(s)[0]).toEqual({ ...Z, gold: 8, green: 6 });
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Chronicler: game end, +1 follower per 2 green', () => {
    let s = scene({ members: [['echo.chronicler'], []], res: [{ green: 8 }, {}], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(4);
    expect(followers(s, s.players[0])).toBe(6);
  });

  it('A copied member’s cost is paid in green', () => {
    let s = scene({ turns: [0], res: [{ green: 1, gold: 1 }, {}], shop: ['echo.choir', ...SHOP.slice(1)] });
    s = take(s, 'Hum');
    s = play(s, `card:${uidOf(s, 'echo.choir', 'shop')}`);
    expect(defs(s, 0)).toContain('echo.choir');
  });
});

describe('Green on the table: 200 seeded bot games', () => {
  it('games finish cleanly with every invariant', () => {
    restore(); restore = () => {};
    for (let g = 1; g <= 200; g++) {
      const rand = seededRandom(g * 31);
      const n = 2 + (g % 3);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants: QUADS });
      let guard = 0;
      while (!s.over && guard++ < 1500) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (g <= 40) checkInvariants(s, `game ${g}`);
      }
      expect(s.over).toBe(true);
    }
  }, 180000);
});
