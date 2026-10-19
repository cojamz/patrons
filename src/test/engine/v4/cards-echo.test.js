// @vitest-environment node
// Green's six actions and twelve current members, with legacy removed-card replay coverage retained.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { contextFor, memberCount, resume } from '../../../engine/v4/core.js';
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
  'echo.evergreen': [1, 3], 'echo.choir': [4, 2], 'echo.muse': [2, 2], 'echo.understudy': [4, 2], 'echo.ensemble': [3, 3],
  'echo.groupie': [4, 4], 'echo.translator': [4, 2], 'echo.tuningfork': [2, 2], 'echo.wallflower': [2, 2],
  'echo.mirror': [4, 2], 'echo.afterimage': [4, 2], 'echo.hourglass': [2, 2], 'echo.dejavu': [8, 2],
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
  it.each([1, 2, 3])('Build Up in round %i: round + inherent green', round => {
    expect(R(go(table(Q, { round, shop: ROW }), 'echo.chant')).green).toBe(round + 1);
  });
  it('Chorus counts other occupied Green actions, plus inherent green', () => {
    let s = table(Q, { shop: ROW, queue: turns(1, 0) });
    s = go(s, 'echo.chant');
    s = go(s, 'echo.hum');
    expect([R(s).green, R(s, 1).green]).toEqual([2, 2]);
  });
  it('Echo copies the printed chip and also gains its own inherent green', () => {
    const s = buildThenEcho();
    expect(R(s).green).toBe(3);
    expect(s.log.some(l => l.includes('P1 copied Build Up') && l.includes('+2 green'))).toBe(true);
  });
  it('Encore offers rival actions and occupied centers, never your own', () => {
    let s = table(Q, { round: 3, left: 6, shop: ROW, res: [{}, { gold: 2 }], queue: turns(0, 1, 1, 0) });
    s = go(s, 'echo.chant'); s = go(s, 'gold.rush'); s = go(s, 'gold.strike');
    s = take(s, 'echo.encore');
    expect(s.pending.options.map(o => o.label)).toEqual(['Golden Years (P2): +6 gold', 'Double Down (P2): +8 gold']);
  });
  it('Reprise offers only your actions, excludes itself, and adds inherent green', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(0, 1, 0) });
    s = go(s, 'echo.chant'); s = go(s, 'echo.hum');
    s = take(s, 'echo.refrain');
    expect(s.pending.options.map(o => o.label)).toEqual(['Build Up (P1): +3 green']);
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s).green).toBe(7);
  });
  it('one shared copy rule explains fresh choices and forbids revisiting the chain', () => {
    expect(quadrant('echo').rule).toMatch(/Copying a copy lets you choose again/);
    expect(term('copy').def).toMatch(/choose again/);
    expect(readFileSync(new URL('../../../../design/rulebook.md', import.meta.url), 'utf8')).toMatch(/choose again/);
    expect(quadrant('echo').rule).toMatch(/already in its chain/);
    for (const d of quadrant('echo').actions) expect(d.text).toContain('+1 green');
  });
  it('Greatest Hits copies all your ordinary actions in order and adds one green', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(0, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    s = go(s, 'echo.eternity');
    expect(R(s)).toMatchObject({ gold: 12, green: 9 });
    expect(s.log.filter(l => /^P1 copied /.test(l)).map(l => l.split(':')[0])).toEqual(['P1 copied Golden Years', 'P1 copied Build Up']);
  });
  it('Greatest Hits includes prior copy actions and lets their target be chosen again', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(0, 1, 0, 0) });
    s = go(s, 'gold.rush'); s = go(s, 'echo.chant');
    s = go(s, 'echo.refrain', sp('gold.rush'));
    s = take(s, 'echo.eternity');
    expect(s.pending.prompt).toMatch(/Reprise/);
    s = pass(play(s, sp('gold.rush')));
    expect(R(s)).toMatchObject({ gold: 24, green: 3 });
  });
  it('an Agents-protected plan explains why its actions are skipped', () => {
    let s = table(Q, { round: 3, members: [['echo.agents']], queue: turns(0, 0) });
    s = go(s, 'gold.rush');
    const plan = ownPlan(contextFor(s), s.players[0]);
    expect(plan.take).toEqual([]);
    expect(plan.skip.map(x => x.why)).toEqual(['protected']);
    s = go(s, 'echo.eternity');
    expect(R(s)).toMatchObject({ gold: 6, green: 1 });
    expect(s.log.some(l => l.includes('Agents prevents copying'))).toBe(true);
  });
  it('Echo redoes stealing for its copier and still respects Lie Low', () => {
    let s = table(QT, { n: 3, shop: ROW, res: [{}, {}, { gold: 3, blue: 2 }], queue: turns(1, 0) });
    s = go(s, 'thieves.pickpocket', 'take:2:gold', 'take:2:gold');
    s = go(s, 'echo.echo', sp('thieves.pickpocket'), 'take:2:blue', 'take:2:blue');
    expect([R(s).magenta, R(s, 2).blue, R(s).green]).toEqual([2, 0, 1]);
    let t = table(QT, { n: 3, shop: ROW, res: [{}, { gold: 3 }, { blue: 3 }], queue: turns(2, 0) });
    t = go(t, 'thieves.hideout', 'take:1:gold');
    t = play(take(t, 'echo.echo'), sp('thieves.hideout'));
    expect(ids(t).every(id => id.startsWith('take:1:'))).toBe(true);
  });
});

describe('Green current members', () => {
  it('Busker gives two green on recruit and at round start, naming the source', () => {
    let s = table(Q, { shop: ['echo.evergreen', ...ROW], res: [{ green: 4 }], queue: turns(0) });
    s = move(take(s, 'red.turnout'), cardOpt(s, 'echo.evergreen'));
    expect(R(s).green).toBe(3); // Gather's red pays part of the wild cost; Busker still pays exactly 2 green.
    expect(named(s, 'Busker').length).toBe(1);
    const t = table(Q, { members: [['echo.evergreen']], queue: [{ t: 'round', r: 2 }] });
    expect(R(t).green).toBe(2);
  });
  it('Muse hears another player’s copy even if it was not its owner’s action', () => {
    const s = buildThenEcho({ n: 3, members: [[], [], ['echo.muse']] });
    expect(R(s, 2).green).toBe(1);
    expect(named(s, 'Muse')).toEqual(["P3's Muse: +1 green."]);
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
  it('Tribute Band copies all this round’s actions once per game', () => {
    let s = table(Q, { round: 2, shop: ROW, members: [['echo.dejavu']], queue: turns(0, 0) });
    s = go(s, 'gold.rush'); s = take(s, 'echo.chant');
    const uid = uidIn(s, 'echo.dejavu', 0);
    s = move(s, 'use:' + uid);
    expect(R(s)).toMatchObject({ gold: 8, green: 6 });
    expect(s.cards[uid].used).toBe(true);
    expect(ids(s)).not.toContain('use:' + uid);
  });
  it('Doppelganger becomes a copy without firing its copied Recruit, retaining future round-start hooks', () => {
    let s = table(Q, { shop: ['echo.doppel', ...ROW], members: [['echo.evergreen']], res: [{ green: 5 }], queue: turns(0, 0) });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'echo.doppel'));
    s = move(s, cardOpt(s, 'echo.evergreen', 0));
    expect(s.cards[uidIn(s, 'echo.doppel', 0)].copy).toBe('echo.evergreen');
    expect(R(s).green).toBe(1); // Default payment leaves one green; copying does not recruit Busker again.
    s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(R(s).green).toBe(5);
  });
  it('Impostor chooses only a rival’s members and adopts printed quantity', () => {
    let s = table(Q, { round: 3, shop: ['echo.impostor', ...ROW], members: [['echo.muse'], ['red.bigfamily']], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.impostor'));
    expect(s.pending.options.map(o => o.id)).toEqual([cardOpt(s, 'red.bigfamily', 1)]);
    s = move(s, s.pending.options[0].id);
    expect(s.cards[uidIn(s, 'echo.impostor', 0)].copy).toBe('red.bigfamily');
    expect(memberCount(s, s.players[0])).toBe(4);
  });
  it('Connector counts weighted non-green members, on recruit and at round start', () => {
    let s = table(Q, { round: 3, shop: ['echo.connector', ...ROW], members: [['red.twins', 'echo.muse']], queue: turns(0, 0) });
    s = move(take(s, 'red.take'), cardOpt(s, 'echo.connector'));
    expect(R(s).green).toBe(2);
    s.queue = [{ t: 'round', r: 3 }]; s = resume(s);
    expect(R(s).green).toBe(4);
  });
  it('Agents has two followers and two members; Bait loss/gain rules are explicit', () => {
    const agents = quadrant('echo').members.find(d => d.key === 'agents');
    expect([agents.f, agents.n]).toEqual([2, 2]);
    const bait = quadrant('echo').members.find(d => d.key === 'bait');
    expect(bait.text).toMatch(/loses 1 follower.*you gain 1 follower/);
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
    s = move(take(s, 'market.showroom'), cardOpt(s, 'echo.muse'));
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
  it('Wallflower doubles copied gains only while tied for fewest followers', () => {
    for (const [extra, expected] of [[[], 5], [['red.twins'], 3]]) {
      const s = buildThenEcho({ members: [['echo.wallflower', ...extra]], bonus: [0, 2] });
      expect(R(s).green).toBe(expected);
    }
  });
  it('Mime recruits with green equal to the richest rival', () => {
    let s = table(Q, { n: 3, shop: ['echo.mirror', ...ROW], res: [{ green: 4, red: 2 }, { green: 5 }, { green: 2 }] });
    s = move(take(s, 'market.showroom'), cardOpt(s, 'echo.mirror'));
    expect(R(s).green).toBe(5);
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
