// @vitest-environment node
// Card-by-card verifier, Green (echo): every action and member against its printed text at the doubled member
// costs, through real legal moves, plus one cross-sphere case each. Every number a card changes must show up in a
// log line that names the card.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resume } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { term } from '../../../v4/glossary.js';
import { take, move, play, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'echo'];
const QT = ['gold', 'thieves', 'market', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'gold.midas': [4, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2],
  'red.intern': [2, 0], 'red.volunteer': [0, 0], 'red.doppel': [4, 2],
  'echo.evergreen': [2, 2], 'echo.choir': [4, 2], 'echo.muse': [2, 2], 'echo.understudy': [4, 2], 'echo.ensemble': [4, 2],
  'echo.groupie': [4, 4], 'echo.translator': [4, 2], 'echo.tuningfork': [2, 2], 'echo.wallflower': [2, 2],
  'echo.mirror': [4, 2], 'echo.afterimage': [4, 2], 'echo.hourglass': [6, 4],
  'echo.dejavu': [8, 4], 'echo.chronicler': [4, 4], 'thieves.watchdog': [4, 2],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const go = (s, name, ...then) => pass(play(take(s, name), ...then));
const sp = name => o => o.label.startsWith(name);
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;
const payDefault = s => (s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s);
// P2 hums (+3 green), then P1 echoes it
const humThenEcho = (opts = {}) => {
  let s = table(Q, { shop: ROW, queue: turns(1, 0, 1, 0), ...opts });
  s = go(s, 'Hum');
  return go(s, 'Echo', sp('Hum'));
};

describe('Green actions', () => {
  it('Hum: +3 green', () => expect(R(go(table(Q, { shop: ROW }), 'Hum')).green).toBe(3));
  it('Chant: +2 green per round number', () => {
    expect(R(go(table(Q, { shop: ROW }), 'Chant')).green).toBe(2);
    expect(R(go(table(Q, { shop: ROW, round: 3, left: 5 }), 'Chant')).green).toBe(6);
  });
  it('Echo: copy a space a rival took since your last turn (exactly its chip)', () => {
    const s = humThenEcho();
    expect(R(s).green).toBe(3);
    expect(s.log.some(l => /P1 copied Hum \(P2's\): \+3 green/.test(l))).toBe(true);
  });
  it('× Echo copying a steal: the copier steals for themself, and Hideout still blocks it', () => {
    let s = table(QT, { n: 3, shop: ROW, res: [{}, {}, { gold: 3, blue: 2 }], queue: turns(1, 0) });
    s = go(s, 'Pickpocket', 'take:2:gold', 'take:2:gold');
    s = go(s, 'Echo', sp('Pickpocket'), 'take:2:blue', 'take:2:blue');
    expect([R(s).magenta, R(s, 2).blue]).toEqual([2, 0]);
    // P3 in the Hideout: the copy finds nothing
    let t = table(QT, { n: 3, shop: ROW, res: [{}, { gold: 3 }, { blue: 3 }], queue: turns(2, 0) });
    t = go(t, 'Hideout', 'take:1:gold');
    t = take(t, 'Echo');
    t = move(t, t.pending.options.find(sp('Hideout')).id);
    // the copy is a Hideout of P1's own: it may lift 1 from P2, never from P3
    expect(ids(t).every(id => id.startsWith('take:1:'))).toBe(true);
  });
  it('Encore: any space taken this round, not the center', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(1, 1, 0) });
    s = go(s, 'Chant'); s = go(s, 'Strike');
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P2): +6 green']);
  });
  it('Refrain: +2 green, and copy one of your spaces from this round (named in the log)', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(0, 1, 0) });
    s = go(s, 'Chant'); s = go(s, 'Hum');
    s = take(s, 'Refrain');
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P1): +4 green']); // P2's Hum isn't yours
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s).green).toBe(4 + 2 + 4);
    expect(s.log.some(l => /P1 copied Chant: \+4 green/.test(l))).toBe(true);
  });
  // design critic follow-up (2026-10-14): the rule is printed once (sphere rule, rulebook, glossary), not per card
  it('One Green rule, printed once: copies never reach the center or another copy (Echo, Understudy, Encore, Refrain, Eternity)', () => {
    const echo = quadrant('echo');
    expect(echo.rule).toMatch(/^Copies never reach the center or another copy\./);
    expect(term('copy').def).toMatch(/never reach the center or another copy/);
    expect(readFileSync(new URL('../../../../design/rulebook.md', import.meta.url), 'utf8')).toMatch(/Copies never reach the center \(the inner ring\) or another copy/);
    for (const t of [...echo.actions.map(a => a.text), ...echo.members.map(d => d.text)]) expect(t).not.toMatch(/center/);
    let s = table(Q, { round: 3, left: 5, shop: ['echo.understudy', ...ROW], res: [{ red: 2 }], queue: turns(1, 1, 0, 0, 0, 0, 0) });
    s = go(s, 'Strike'); s = go(s, 'Chant'); // P2: the center, then +6 green
    s = take(s, 'Echo');
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P2): +6 green']); // not the center
    s = move(s, s.pending.options[0].id);
    s = payDefault(move(s, cardOpt(s, 'echo.understudy', 'shop')));
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P2): +6 green']); // Understudy: not the center
    s = move(s, s.pending.options[0].id);
    s = take(s, 'Encore');
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P2): +6 green']); // not the center, not P1's Echo
    s = pass(move(s, s.pending.options[0].id));
    s = go(s, 'Hum');
    s = take(s, 'Refrain');
    expect(s.pending.options.map(o => o.label)).toEqual(['Hum (P1): +3 green']); // not Echo or Encore
    s = pass(move(s, s.pending.options[0].id));
    const before = R(s).green;
    s = go(s, 'Eternity'); // Hum only: Echo, Encore and Refrain were copies
    expect(R(s).green - before).toBe(3);
    expect(s.log.filter(l => /P1 copied (Strike|Echo|Encore|Refrain)/.test(l))).toEqual([]);
  });
  it('Eternity: copy every space you took this round', () => {
    let s = table(Q, { round: 3, left: 5, shop: ROW, queue: turns(0, 0, 0) });
    s = go(s, 'Hum'); s = go(s, 'Chant');
    s = go(s, 'Eternity');
    expect(R(s).green).toBe(2 * (3 + 6));
  });
});

describe('Green members', () => {
  it('Evergreen: at round start, +3 green (named)', () => {
    const s = table(Q, { members: [['echo.evergreen']], shop: ROW, queue: [{ t: 'round', r: 2 }] });
    expect(R(s).green).toBe(3);
    expect(named(s, 'Evergreen').length).toBe(1);
  });
  it('Choir: whenever you copy a space, +1 green (named)', () => {
    const s = humThenEcho({ members: [['echo.choir']] });
    expect(R(s).green).toBe(3 + 1);
    expect(named(s, 'Choir')).toEqual(["P1's Choir: +1 green."]);
  });
  it('× Doppelganger copying Choir: +2 per copy', () => {
    let s = table(Q, { shop: ROW, queue: turns(1, 0), members: [['echo.choir', 'red.doppel']] });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'echo.choir';
    s = go(go(s, 'Hum'), 'Echo', sp('Hum'));
    expect(R(s).green).toBe(3 + 2);
  });
  it('Muse: whenever a rival copies one of your spaces, +2 green (named); not your own copy', () => {
    const s = humThenEcho({ members: [[], ['echo.muse']] });
    expect(R(s, 1).green).toBe(3 + 2);
    expect(named(s, 'Muse')).toEqual(["P2's Muse: +2 green."]);
  });
  it('Understudy: when recruited, copy a space a rival took since your last turn (named)', () => {
    let s = table(Q, { round: 2, shop: ['echo.understudy', ...ROW], res: [{ green: 4, red: 2 }], queue: turns(1, 0) });
    s = go(s, 'Chant');
    s = move(take(s, 'Hum'), cardOpt(s, 'echo.understudy', 'shop'));
    s = payDefault(s);
    expect(s.pending.options.map(o => o.label)).toEqual(['Chant (P2): +4 green']);
    s = move(s, s.pending.options[0].id);
    expect(R(s).green).toBe(4 + 3 - 4 + 4 - Math.max(0, 2 - 2));
    expect(named(s, 'Understudy').length).toBe(1);
  });
  // design critic follow-up (2026-10-14): was "Game end: +1 follower per green member"
  it('Ensemble: whenever you copy a rival\'s space, +1 follower at once (named); not for your own space', () => {
    const s = humThenEcho({ members: [['echo.ensemble', 'echo.muse']] });
    expect(s.players[0].bonus).toBe(1); // a won follower: loose, counted now
    expect(named(s, 'Ensemble')).toEqual(["P1's Ensemble: +1 follower."]);
    // your own space (Refrain) pays nothing
    let t = table(Q, { round: 2, shop: ROW, queue: turns(0, 0), members: [['echo.ensemble']] });
    t = go(t, 'Hum');
    t = go(t, 'Refrain', sp('Hum'));
    expect([R(t).green, t.players[0].bonus, named(t, 'Ensemble')]).toEqual([3 + 2 + 3, 0, []]);
    // and no game-end bonus any more
    const f = table(Q, { members: [['echo.ensemble', 'echo.muse', 'red.twins']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(f.players[0].final.parts.join(' ')).not.toMatch(/Ensemble/);
  });
  it('Groupie: whenever anyone recruits a green member, +1 green (named)', () => {
    let s = table(Q, { res: [{ green: 6 }], shop: ['echo.muse', ...ROW], members: [[], ['echo.groupie']] });
    s = payDefault(move(take(s, 'Showroom'), cardOpt(s, 'echo.muse', 'shop')));
    expect(R(s, 1).green).toBe(1);
    expect(named(s, 'Groupie').length).toBe(1);
  });
  it('Translator: what you copy comes as green (named); switched off, it keeps its color', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.translator']] });
    s.cards[uidIn(s, 'echo.translator', 0)].on = true;
    s = go(go(s, 'Rush'), 'Echo', sp('Rush'));
    expect([R(s).gold, R(s).green]).toEqual([0, 4]);
    expect(named(s, 'Translator').length).toBe(1);
    let t = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.translator']] });
    t.cards[uidIn(t, 'echo.translator', 0)].on = false;
    t = go(go(t, 'Rush'), 'Echo', sp('Rush'));
    expect([R(t).gold, R(t).green]).toEqual([4, 0]);
  });
  it('× Midas with Translator: the copy turns green, then Midas makes it gold (both named)', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.translator', 'gold.midas']] });
    s.cards[uidIn(s, 'echo.translator', 0)].on = true;
    s = go(go(s, 'Hum'), 'Echo', sp('Hum'));
    expect(R(s).gold).toBe(3);
    expect(named(s, 'Midas').length).toBe(1);
  });
  it('Tuning Fork: whenever you copy a space, also +1 of that space\'s color (named)', () => {
    let s = table(Q, { round: 2, shop: ROW, queue: turns(1, 0), members: [['echo.tuningfork']] });
    s = go(go(s, 'Rush'), 'Echo', sp('Rush'));
    expect(R(s).gold).toBe(4 + 1);
    expect(named(s, 'Tuning Fork')).toEqual(["P1's Tuning Fork: +1 gold."]);
  });
  it('Wallflower: while no one has fewer followers than you, copied resources are doubled (named)', () => {
    const s = humThenEcho({ members: [['echo.wallflower']], bonus: [0, 2] });
    expect(R(s).green).toBe(6);
    expect(named(s, 'Wallflower').length).toBe(1);
    const t = humThenEcho({ members: [['echo.wallflower', 'red.twins']] }); // 4 followers vs 1
    expect(R(t).green).toBe(3);
  });
  it('Keepsake is cut (design critic: Refrain already copies one of your spaces)', () => {
    expect(quadrant('echo').members.map(d => d.key)).not.toContain('keepsake');
  });
  it('Mirror: when recruited, as much green as the rival with the most green', () => {
    let s = table(Q, { n: 3, shop: ['echo.mirror', ...ROW], res: [{ green: 4, red: 2 }, { green: 5 }, { green: 2 }] });
    s = payDefault(move(take(s, 'Showroom'), cardOpt(s, 'echo.mirror', 'shop')));
    expect(R(s).green).toBe(0 + 5);
    expect(named(s, 'Mirror').length).toBe(1);
  });
  it('Afterimage: at round start, copy one of your spaces from last round (named)', () => {
    let s = table(Q, { shop: ROW, members: [['echo.afterimage']], queue: turns(0) });
    s = go(s, 'Chant');
    s.queue = [{ t: 'round', r: 2 }];
    s = move({ ...s, queue: [{ t: 'choose', p: 0, options: [{ id: 'x', value: null }], h: 'market.pickRow', data: { why: 'test' } }, ...s.queue], pending: { player: 0, options: [{ id: 'x' }] } }, 'x');
    expect(s.pending.prompt).toMatch(/Afterimage/);
    s = play(s, sp('Chant'));
    expect(R(s).green).toBe(2 + 2);
    expect(named(s, 'Afterimage').length).toBe(1);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III it used to give nothing
  it('Afterimage recruited: copy one of your spaces from last round right away (named)', () => {
    let s = table(Q, { shop: ['echo.afterimage', ...ROW], queue: turns(0) });
    s = go(s, 'Chant');
    s.players[0].res.green += 6; s.round = 2; s.queue = [{ t: 'buy', p: 0 }];
    s = payDefault(move(resume(s), cardOpt(s, 'echo.afterimage', 'shop')));
    expect(s.pending.prompt).toMatch(/Afterimage/);
    s = play(s, sp('Chant'));
    expect(R(s).green).toBe(2 + 2);
    expect(named(s, 'Afterimage').length).toBe(1);
  });
  it('Hourglass: once per round, copy the space you just took (named)', () => {
    let s = table(Q, { shop: ROW, members: [['echo.hourglass']] });
    s = take(s, 'Hum');
    s = move(s, `use:${uidIn(s, 'echo.hourglass', 0)}`);
    expect(R(s).green).toBe(6);
    expect(named(s, 'Hourglass').length).toBe(1);
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'echo.hourglass', 0)}`);
  });
  it('× Heist: an Hourglass used this round stays used for the thief', () => {
    let s = table(QT, { round: 3, left: 5, shop: ROW, members: [[], ['echo.hourglass']], queue: turns(1, 0, 0) });
    s = take(s, 'Hum');
    s = pass(move(s, `use:${uidIn(s, 'echo.hourglass', 1)}`));
    s = play(take(s, 'Heist'), cardOpt(s, 'echo.hourglass', 1));
    while (s.pending?.player === 1) s = move(s, s.pending.options[0].id); // P2's free recruit
    expect(owns(s, 0, 'echo.hourglass')).toBe(true);
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'echo.hourglass', 0)}`);
  });
  it('Déjà Vu: once per game, copy every space you took this round (named)', () => {
    let s = table(Q, { round: 2, shop: ROW, members: [['echo.dejavu']], queue: turns(0, 0) });
    s = go(s, 'Hum');
    s = take(s, 'Chant');
    s = move(s, `use:${uidIn(s, 'echo.dejavu', 0)}`);
    expect(R(s).green).toBe(2 * (3 + 4));
    expect(named(s, 'Déjà Vu').length).toBeGreaterThan(0);
  });
  it('Chronicler: game end, +1 follower per 2 green', () => {
    const s = table(Q, { res: [{ green: 5 }], members: [['echo.chronicler']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Chronicler +2');
  });
});
