// @vitest-environment node
// Green's six actions and twelve current members, with legacy removed-card replay coverage retained.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyMove, contextFor, memberCount, resume } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { ledger, ownPlan } from '../../../engine/v4/content/echo.js';
import { term } from '../../../v4/glossary.js';
import { take, move, play, ids, actionName } from './helpers.js';
import { table, useCosts, named, uidIn } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'echo'];
const QT = ['gold', 'thieves', 'market', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'gold.midas': [4, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2],
  'red.intern': [2, 0], 'red.volunteer': [0, 0], 'echo.doppel': [3, 2],
  'echo.evergreen': [1, 3], 'echo.choir': [4, 2], 'echo.muse': [2, 2], 'echo.understudy': [2, 1], 'echo.ensemble': [3, 3],
  'echo.groupie': [4, 4], 'echo.translator': [4, 2], 'echo.tuningfork': [2, 2], 'echo.wallflower': [6, 3],
  'echo.mirror': [1, 1], 'echo.roadie': [1, 1], 'echo.afterimage': [4, 2], 'echo.hourglass': [2, 2], 'echo.dejavu': [8, 3],
  'echo.chronicler': [2, 3], 'thieves.watchdog': [4, 2],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const go = (s, name, ...then) => pass(play(take(s, name), ...then));
const sp = id => o => o.kind === 'space' && o.label.startsWith(actionName(id));
const cardOpt = (s, def, who = 'shop') => 'card:' + uidIn(s, def, who);
const N = k => actionName('echo.' + k);
const buildThenEcho = (opts = {}) => {
  let s = table(Q, { shop: ROW, queue: turns(1, 0, 1, 0), ...opts });
  return go(go(s, 'echo.chant'), 'echo.echo', sp('echo.chant'));
};

describe('Green current actions', () => {
  it.each([1, 2, 3])('Build Up in round %i: +3 / +4 / +5 green', round => {
    expect(R(go(table(Q, { round, shop: ROW }), 'echo.chant')).green).toBe(round + 2);
  });
  // Cover replaced Chorus (Cory, 2026-10-27): copy an action with no minion on it, +1 green
  it('Cover copies only an action with no minion on it, plus inherent green', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0) });
    s = go(s, 'echo.chant');
    s = take(s, 'echo.hum');
    expect(s.pending.prompt).toMatch(/^Cover:/);
    const keys = s.pending.options.map(o => o.value);
    expect(keys).not.toContain(`3-${quadrant('echo').actions.findIndex(a => a.key === 'chant')}`);
    expect(keys).not.toContain(`3-${quadrant('echo').actions.findIndex(a => a.key === 'hum')}`);
    s = pass(play(s, o => o.label.startsWith('Golden Years')));
    expect(R(s)).toMatchObject({ gold: 4, green: 1 });
  });
  // bots copied blind when every empty action was rated 2 (Claude, under Cory's go-with-your-gut, Oct 29)
  it('Cover rates each empty action by what it would give, so bots copy the best one', () => {
    const s = take(table(Q, { round: 2, shop: ROW, queue: turns(1, 0) }), 'echo.hum');
    const hint = name => s.pending.options.find(o => o.label.startsWith(name)).hint;
    expect(hint('Build Up')).toBeGreaterThan(hint('Echo'));
    expect(new Set(s.pending.options.map(o => o.hint)).size).toBeGreaterThan(1);
  });
  it('Echo copies the printed chip and also gains its own inherent green', () => {
    const s = buildThenEcho();
    expect(R(s).green).toBe(4); // Echo's own +1 plus Build Up's +3
    expect(s.log.some(l => l.includes('P1 copied Build Up') && l.includes('+3 green'))).toBe(true);
  });
  // Encore copies a rival member's On Recruit, not a space (Cory, 2026-10-28)
  it('Encore offers only rivals\' members with an On Recruit, and does it for you', () => {
    let s = table(Q, { round: 2, shop: ROW, members: [[], ['echo.evergreen', 'echo.agents', 'echo.hourglass']], queue: turns(0) });
    s = take(s, 'echo.encore');
    expect(s.pending.prompt).toMatch(/^Encore:/);
    expect(s.pending.options.map(o => o.label)).toEqual([expect.stringMatching(/^P2's Busker/)]);
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s).green).toBe(3); // Encore's own +1, Busker's +2
    expect(s.players[1].members.length).toBe(3); // Busker stays with P2
  });
  it('Reprise offers only your actions, excludes itself, and adds inherent green', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(0, 1, 0) });
    s = go(s, 'echo.chant'); s = go(s, 'gold.rush');
    s = take(s, 'echo.refrain');
    expect(s.pending.options.map(o => o.label)).toEqual(['Build Up (P1): +4 green']);
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s).green).toBe(9); // Build Up 4, Reprise's own +1, the copy 4
  });
  it('one shared copy rule explains fresh choices and forbids revisiting the chain', () => {
    expect(quadrant('echo').rule).toMatch(/Copying a copy lets you choose again/);
    expect(term('copy').def).toMatch(/choose again/);
    expect(readFileSync(new URL('../../../../design/rulebook.md', import.meta.url), 'utf8')).toMatch(/choose again/);
    expect(quadrant('echo').rule).toMatch(/already in its chain/);
    // Build Up's +1 green sits inside its by-round run (3 / 4 / 5); Echo and Reprise give +1 (back to +1, Cory, Oct 28)
    for (const d of quadrant('echo').actions) {
      if (d.key === 'chant') expect(d.text).toBe('+3 green in round I, +4 in round II, +5 in round III.');
      else if (d.key === 'echo' || d.key === 'refrain') expect(d.text).toContain('+1 green');
      else expect(d.text).toContain('+1 green');
    }
  });
  it('Greatest Hits copies all your ordinary actions in order and adds one green', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(0, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    s = go(s, 'echo.eternity', sp('gold.rush'));
    expect(R(s)).toMatchObject({ gold: 12, green: 11 });
    expect(s.log.filter(l => /^P1 copied /.test(l)).map(l => l.split(':')[0])).toEqual(['P1 copied Golden Years', 'P1 copied Build Up']);
  });
  // Cory's v0.9.1 playtest (Oct 27): "using squatter on greatest hits didnt seem to work… players actions werent copied"
  it('Squatter joining a rival\'s Greatest Hits copies every action with your minion', () => {
    const GH = `3-${quadrant('echo').actions.findIndex(a => a.key === 'eternity')}`;
    let s = table(Q, { round: 3, left: 5, shop: ROW, members: [['benders.squatter']], queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.eternity'); s = go(s, 'echo.chant');
    s = move(move(s, `use:${s.players[0].members[0]}`), `squat:${GH}`); // Party Crasher (Once per game since Oct 28)
    expect(s.pending.prompt).toBe('Greatest Hits: copy which next?');
    s = pass(play(s, sp('gold.rush')));
    expect(R(s)).toMatchObject({ gold: 12, green: 11 });
    expect(s.log.filter(l => /^P1 copied /.test(l)).map(l => l.split(':')[0])).toEqual(['P1 copied Golden Years', 'P1 copied Build Up']);
    // and a space you joined with Squatter is one of yours for Greatest Hits
    let t = table(Q, { round: 3, left: 5, shop: ROW, members: [['benders.squatter']], queue: turns(1, 0, 0) });
    t = go(t, 'gold.rush');
    t = pass(move(move(t, `use:${t.players[0].members[0]}`), 'squat:0-1'));
    t = go(t, 'echo.eternity');
    expect(R(t)).toMatchObject({ gold: 12, green: 1 });
  });
  it('Greatest Hits includes prior copy actions and lets their target be chosen again', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    s = go(s, 'echo.refrain', sp('gold.rush'));
    s = take(s, 'echo.eternity');
    expect(s.pending.prompt).toBe('Greatest Hits: copy which next?');
    s = play(s, sp('echo.refrain'));
    expect(s.pending.prompt).toMatch(/Reprise/);
    s = pass(play(s, sp('gold.rush')));
    expect(R(s)).toMatchObject({ gold: 24, green: 3 });
  });
  it('Agents: rivals can’t copy your actions, and you still can (Cory, 2026-10-29)', () => {
    let s = table(Q, { round: 3, members: [['echo.agents']], queue: turns(0, 1) });
    s = go(s, 'gold.rush');
    const plan = ownPlan(contextFor(s), s.players[0]);
    expect(plan.take.map(e => e.p)).toEqual([0]);
    expect(plan.skip).toEqual([]);
    s = go(s, 'echo.echo'); // P2's Echo can't copy P1's Gold Rush
    expect(R(s, 1).gold || 0).toBe(0);
    expect(R(s, 1).green).toBe(1);
  });
  it('Echo redoes stealing for its copier and still respects Lie Low', () => {
    let s = table(QT, { n: 3, shop: ROW, res: [{}, {}, { gold: 3, blue: 2 }], queue: turns(1, 0) });
    s = go(s, 'thieves.pickpocket', 'take:2:gold', 'take:2:gold', 'take:2:gold'); // round I: steal 3
    s = go(s, 'echo.echo', sp('thieves.pickpocket'), 'take:2:blue', 'take:2:blue', 'take:1:gold');
    // the copier steals for itself (blue stays blue) and gets Help Yourself's own +1 magenta
    expect([R(s).magenta, R(s).blue, R(s).gold, R(s, 2).blue, R(s).green]).toEqual([0, 2, 1, 0, 1]);
    // Lie Low no longer steals (Cory, 2026-10-22): P3 hides, P2 steals from P1, P1's copy of that steal can't reach P3
    let t = table(QT, { n: 3, shop: ROW, res: [{ red: 3 }, { gold: 3 }, { blue: 3 }], queue: turns(2, 1, 0) });
    t = go(t, 'thieves.hideout');
    t = go(t, 'thieves.pickpocket', 'take:0:red', 'take:0:red', 'take:0:red');
    t = play(take(t, 'echo.echo'), sp('thieves.pickpocket'));
    expect(ids(t).length).toBeGreaterThan(0);
    expect(ids(t).every(id => id.startsWith('take:1:'))).toBe(true);
  });
});

describe('Green current members', () => {
  // Cory, 2026-10-28: Green grows to 16 (Wallflower at 10, Fan Club, Roadie)
  it('Wallflower doubles what every copy gives you, whatever your followers', () => {
    for (const extra of [[], ['red.twins']]) {
      const s = buildThenEcho({ members: [['echo.wallflower', ...extra]], bonus: [0, 2] });
      expect(R(s).green).toBe(7); // Echo's own +1, Build Up's +3 doubled
    }
  });
  it('Fan Club: +1 green per Green space with a minion when recruited', () => {
    let s = table(Q, { n: 3, shop: ['echo.mirror', ...ROW], res: [{ green: 1, red: 2 }], queue: turns(1, 2, 0) });
    s = go(s, 'echo.chant'); s = go(s, 'echo.echo', sp('echo.chant'));
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.mirror'));
    expect(s.players[0].members).toContain(uidIn(s, 'echo.mirror', 0));
    expect(R(s).green).toBe(2);
  });
  it('Roadie: round start, +1 green per Green member you have', () => {
    const start = members => { let s = table(Q, { members: [members] }); s.queue = [{ t: 'round', r: 2 }]; return R(resume(s)).green || 0; };
    expect(start(['echo.roadie', 'echo.muse', 'echo.ensemble', 'red.twins']) - start(['echo.muse', 'echo.ensemble', 'red.twins'])).toBe(4); // Roadie, Muse, Ensemble (2 members)
  });
  it('Busker gives two green on recruit and at round start, naming the source', () => {
    let s = table(Q, { shop: ['echo.evergreen', ...ROW], res: [{ green: 4 }], queue: turns(0) });
    s = move(take(s, 'red.turnout'), cardOpt(s, 'echo.evergreen'));
    expect(R(s).green).toBe(4); // Gather's red pays part of the wild cost; Busker still pays exactly 2 green.
    expect(named(s, 'Busker').length).toBe(1);
    const t = table(Q, { members: [['echo.evergreen']], queue: [{ t: 'round', r: 2 }] });
    expect(R(t).green).toBe(2);
  });
  it('Muse hears another player’s copy even if it was not its owner’s action', () => {
    const s = buildThenEcho({ n: 3, members: [[], [], ['echo.muse']] });
    expect(R(s, 2).green).toBe(1);
    expect(named(s, 'Muse')).toEqual(["P3's Muse: +1 green."]);
  });
  // Cory, 2026-10-28: a Doppelganger copying Muse gives its own +1 beside Muse's, each its own source
  it('Muse and a Doppelganger copying it each pay +1, each under its own card', () => {
    let s = table(Q, { n: 3, shop: ROW, queue: turns(1, 0, 1, 0), members: [[], [], ['echo.muse', 'echo.doppel']] });
    const dop = uidIn(s, 'echo.doppel', 2), muse = uidIn(s, 'echo.muse', 2);
    s.cards[dop].copy = 'echo.muse';
    s = take(go(s, 'echo.chant'), 'echo.echo');
    s = applyMove(s, { player: s.pending.player, option: s.pending.options.find(sp('echo.chant')).id }, { effects: true });
    expect(R(s, 2).green).toBe(2);
    expect(s.log.filter(l => l.startsWith('P3'))).toEqual(["P3's Muse: +1 green.", "P3's Doppelganger (as Muse): +1 green."]);
    const fx = (s.effects || []).filter(e => e && e.cause && e.cause.kind === 'member' && e.cause.pid === 2 && e.type === 'gain');
    expect(fx.map(e => e.cause.uid).sort()).toEqual([dop, muse].sort());
  });
  it('Impressionist gains the copied action’s color, separately from inherent green', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.tuningfork']] });
    s = go(go(s, 'gold.rush'), 'echo.echo', sp('gold.rush'));
    expect(R(s)).toMatchObject({ gold: 5, green: 1 });
    expect(named(s, 'Impressionist')).toEqual(["P1's Impressionist: +1 gold."]);
  });
  it('Ensemble gives a loose follower for your own action, never a rival’s', () => {
    const s = buildThenEcho({ members: [['echo.ensemble']] });
    expect(s.players[0].bonus).toBe(0);
    let t = table(Q, { round: 2, shop: ROW, queue: turns(0, 0), members: [['echo.ensemble']] });
    t = go(go(t, 'gold.rush'), 'echo.refrain', sp('gold.rush'));
    expect(t.players[0].bonus).toBe(1);
    expect(named(t, 'Ensemble')).toEqual(["P1's Ensemble: +1 follower."]);
    const f = table(Q, { members: [['echo.ensemble', 'echo.muse', 'red.twins']], queue: [{ t: 'finish' }] });
    expect(f.players[0].final.parts.join(' ')).not.toMatch(/Ensemble/);
  });
  it('Stunt Double copies the action just taken when recruited, and has no activation', () => {
    let s = table(Q, { shop: ['echo.hourglass', ...ROW], res: [{ green: 4 }], queue: turns(0, 0) });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.hourglass'));
    expect(R(s).gold).toBe(3); // Default payment spends one gold before Stunt copies the two-gold action.
    expect(named(s, 'Stunt Double').length).toBe(1);
    expect(ids(s).some(id => id.startsWith('use:'))).toBe(false);
  });
  it('Stunt Double recruited by an action copies that action and offers its choices again', () => {
    let s = table(Q, { round: 3, shop: ['echo.hourglass', ...ROW], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.hourglass'));
    expect(s.pending.kind).toBe('choose');
    s = pass(move(s, cardOpt(s, 'red.twins')));
    expect(s.players[0].members).toHaveLength(2);
  });
  it('taking Stunt Double fires Recruit and copies the still-resolving Heist with a fresh choice', () => {
    let s = table(QT, { round: 3, shop: ROW, res: [{ gold: 2 }], members: [[], ['echo.hourglass', 'thieves.crew']], queue: turns(1, 0, 0) });
    s = go(s, 'gold.rush');
    s = play(take(s, 'thieves.heist'), cardOpt(s, 'echo.hourglass', 1));
    expect(s.players[0].members).toContain(uidIn(s, 'echo.hourglass', 0));
    expect(ids(s).some(id => id.startsWith('use:'))).toBe(false);
    expect(s.pending.kind).toBe('choose');
    s = move(s, cardOpt(s, 'thieves.crew', 1));
    expect(s.players[0].members).toHaveLength(2);
    expect(named(s, 'Stunt Double').length).toBe(1);
    expect(s.recruits).toBe(3); // Stunt Double plus Crew's printed member quantity.
  });
  // Cory, 2026-10-28: Tribute Band plays a rival's actions, you pick whose (was: your own)
  it('Tribute Band does every action a rival has a minion on, once per game', () => {
    let s = table(Q, { round: 2, shop: ROW, members: [['echo.dejavu']], bonus: [0, 9], queue: turns(1, 1, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    const uid = uidIn(s, 'echo.dejavu', 0), before = R(s).green, gold = R(s).gold || 0;
    s = move(s, 'use:' + uid);
    expect(R(s).gold - gold).toBe(4); // P2's Golden Years
    expect(R(s).green - before).toBe(4); // P2's Build Up
    expect(s.cards[uid].used).toBe(true);
    expect(ids(s)).not.toContain('use:' + uid);
  });
  it('Tribute Band asks whose actions when several rivals have some', () => {
    let s = table(Q, { round: 2, n: 3, shop: ROW, members: [['echo.dejavu'], [], []], bonus: [0, 9, 9], queue: turns(1, 2, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    const before = R(s).green;
    s = move(s, 'use:' + uidIn(s, 'echo.dejavu', 0));
    expect(s.pending.prompt).toMatch(/^Tribute Band: whose actions/);
    expect(s.pending.options.map(o => o.label)).toEqual(['P2', 'P3']);
    s = move(s, 'player:2');
    expect(R(s).green - before).toBe(4); // P3's Build Up
  });
  // Cory, 2026-10-28: Doppelganger also does the copied member's On Recruit right then (was: never fired)
  it('Doppelganger becomes a copy and does its On Recruit at once, keeping its round-start hooks', () => {
    let s = table(Q, { shop: ['echo.doppel', ...ROW], members: [['echo.evergreen']], res: [{ green: 5 }], queue: turns(0, 0) });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.doppel'));
    s = move(s, cardOpt(s, 'echo.evergreen', 0));
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('echo.evergreen');
    expect(R(s).green).toBe(3); // default payment leaves one green, then the copied Busker's On Recruit: +2 green
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(R(s).green).toBe(7);
  });
  it('Doppelganger copying Connector pays Connector\'s On Recruit in round III', () => {
    let s = table(Q, { round: 3, shop: ['echo.doppel', ...ROW], members: [['echo.connector', 'red.twins', 'gold.taxman']], res: [{ green: 3, gold: 2 }], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.doppel'));
    const before = R(s).green;
    s = move(s, cardOpt(s, 'echo.connector', 0));
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('echo.connector');
    expect(R(s).green - before).toBe(4); // Triplets (3 members) and Tax Man: 4 non-green members
  });
  it('Impostors still becomes a copy without firing its copied On Recruit', () => {
    let s = table(Q, { round: 3, shop: ['echo.impostor', ...ROW], members: [[], ['echo.evergreen']], res: [{ green: 5 }], queue: turns(0, 0) });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.impostor'));
    const before = R(s).green;
    s = move(s, cardOpt(s, 'echo.evergreen', 1));
    expect(R(s).green).toBe(before);
  });
  it('Impostors chooses only a rival’s members and adopts printed quantity', () => {
    let s = table(Q, { round: 3, shop: ['echo.impostor', ...ROW], members: [['echo.muse'], ['red.bigfamily']], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.impostor'));
    expect(s.pending.options.map(o => o.id)).toEqual([cardOpt(s, 'red.bigfamily', 1)]);
    s = move(s, s.pending.options[0].id);
    expect(s.cards[uidIn(s, 'echo.impostor', 0)].copy).toBe('red.bigfamily');
    expect(memberCount(s, s.players[0])).toBe(5);
  });
  it('Connector counts weighted non-green members, on recruit and at round start', () => {
    let s = table(Q, { round: 3, shop: ['echo.connector', ...ROW], members: [['red.twins', 'echo.muse']], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.connector'));
    expect(R(s).green).toBe(3);
    s.queue = [{ t: 'round', r: 3 }]; s = resume(s);
    expect(R(s).green).toBe(6);
  });
  it('Agents has two followers and two members; Bait loss/gain rules are explicit', () => {
    const agents = quadrant('echo').members.find(d => d.key === 'agents');
    expect([agents.f, agents.n]).toEqual([2, 2]);
    const bait = quadrant('echo').members.find(d => d.key === 'bait');
    expect(bait.text).toMatch(/they −1 follower and you \+1 follower\./);
  });
  it('Chronicler scores weighted green members, ignoring held green', () => {
    const s = table(Q, { res: [{ green: 50 }], members: [['echo.chronicler', 'echo.agents', 'red.twins']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Chronicler +3');
  });
});

describe('legacy Green members remain readable in old records', () => {
  it('Choir and its Doppelganger each add one green per copy', () => {
    let s = table(Q, { shop: ROW, queue: turns(1, 0), members: [['echo.choir', 'echo.doppel']] });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'echo.choir';
    s = go(go(s, 'gold.rush'), 'echo.echo', sp('gold.rush'));
    expect(R(s)).toMatchObject({ gold: 2, green: 3 });
  });
  it('Understudy still copies the previous placement, not the current action', () => {
    let s = table(Q, { round: 2, shop: ['echo.understudy', ...ROW], res: [{ green: 4, red: 2 }], queue: turns(1, 0) });
    s = go(s, 'gold.rush');
    s = move(take(s, 'echo.chant'), cardOpt(s, 'echo.understudy'));
    expect(s.pending.options.map(o => o.label)).toEqual(['Golden Years (P2): +4 gold']);
    s = move(s, s.pending.options[0].id);
    expect(R(s).gold).toBe(4);
  });
  it('Groupie hears green recruitment', () => {
    let s = table(Q, { res: [{ green: 6 }], shop: ['echo.muse', ...ROW], members: [[], ['echo.groupie']] });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.muse'));
    expect(R(s, 1).green).toBe(1);
  });
  it('Translator converts the copied gain and can remain switched off', () => {
    for (const on of [true, false]) {
      let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.translator']] });
      s.cards[uidIn(s, 'echo.translator', 0)].on = on;
      s = go(go(s, 'gold.rush'), 'echo.echo', sp('gold.rush'));
      expect([R(s).gold, R(s).green]).toEqual(on ? [0, 5] : [4, 1]);
    }
  });
  it('Midas converts action gains even when Translator would otherwise make the copy green', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.translator', 'gold.midas']] });
    s.cards[uidIn(s, 'echo.translator', 0)].on = true;
    s = go(go(s, 'gold.rush'), 'echo.echo', sp('gold.rush'));
    expect(R(s)).toMatchObject({ gold: 5, green: 0 });
    expect(named(s, 'Midas').length).toBeGreaterThan(0);
  });
  it('Sleepwalker can copy the prior round’s printed chip on recruitment and round start', () => {
    for (const recruit of [true, false]) {
      let s = table(Q, { shop: recruit ? ['echo.afterimage', ...ROW] : ROW, members: recruit ? [] : [['echo.afterimage']], queue: turns(0) });
      s = go(s, 'gold.rush');
      if (recruit) {
        s.players[0].res.green += 6; s.round = 2; s.queue = [{ t: 'buy', p: 0 }];
        s = move(resume(s), cardOpt(s, 'echo.afterimage'));
      } else { s.queue = [{ t: 'round', r: 2 }]; s = resume(s); }
      expect(s.pending.prompt).toMatch(/Sleepwalker/);
      s = play(s, sp('gold.rush'));
      expect(R(s).gold).toBe(recruit ? 3 : 4); // Recruiting spends one gold; round-start activation is free.
      expect(Object.values(ledger(s).last)).toHaveLength(1);
    }
  });
});
