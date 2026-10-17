// The turn card and the "since your last turn" strip (trail.js, format.js turnStory/effectStory), three fixes:
//  1. an extra turn says which card gave it, on the turn that gets it and on the extra turn itself (Cory: "Log did not
//     indicate a Night Owl turn");
//  2. what a member used before the placement did is told as that member's, never as the space's own result (final
//     panel S#6 / game-skeptic w4 #6: "You took Spree · +3 gold · 3 gold from P2", the gold from Tribute Band's copy);
//  3. a steal that arrives as magenta is one line naming each rival and what they lost, not "+2 magenta" and the same
//     coins again as "from P2", "from P3" (pod list; as the paired Magenta flight shows it, ae2fc11a).
import { describe, expect, it } from 'vitest';
import { applyMove, actionAt } from '../../../engine/v4/index.js';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { actionName } from '../../engine/v4/helpers.js';
import { createTrail, feed, liveStory } from '../../../v4/game/trail.js';

/** Drive a hand-made table through real moves (with the effects the play session records), feeding every state. */
function table(opts, me = null) {
  let s = sceneQ(opts);
  if (opts.order) s.order = opts.order;
  const t = createTrail(me);
  feed(t, s);
  const lives = [], states = [s];
  const mv = pick => {
    const o = typeof pick === 'function' ? s.pending.options.find(pick) : s.pending.options.find(x => x.id === pick);
    if (!o) throw new Error(`no ${pick} in ${s.pending.kind}: ${s.pending.options.map(x => x.id).join(', ')}`);
    s = applyMove(s, { player: s.pending.player, option: o.id }, { effects: opts.effects !== false });
    feed(t, s);
    states.push(s);
    const l = liveStory(t);
    if (l) lives.push(l);
  };
  const d = {
    t, lives, states, mv,
    get s() { return s; },
    take: name => mv(x => x.kind === 'slot' && actionAt(s, x.q, x.i).name === actionName(name)),
    use: () => mv(x => /^use:/.test(x.id)),
    first: () => mv(s.pending.options[0].id),
    // answer the choices with their first option and pass the buys, until the next placement (or the game's end)
    on: () => { while (s.pending && s.pending.kind !== 'place') mv(s.pending.kind === 'buy' ? 'pass' : s.pending.options[0].id); },
  };
  return d;
}
const lastLive = d => d.lives[d.lives.length - 1];

describe('an extra turn names the card that gave it', () => {
  it('Night Owl: the turn that earns it and the extra turn itself both say so, on the card and in the strip', () => {
    const d = table({ quadrants: ['gold', 'red', 'purple', 'green'], round: 2, left: 1, members: [['purple.nightowl']],
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }], order: [0, 1] }, 1);
    d.take('purple.hourly');
    d.on();
    expect(d.s.log).toContain("P1's Night Owl: P1 takes an extra turn.");
    d.take('purple.windup');
    d.on();
    const [earn, extra] = d.t.stories;
    expect(earn.lines).toContain('Night Owl: an extra turn after this one');
    expect(earn.lines).not.toContain('an extra turn');
    expect(earn.short).toContain('Night Owl: an extra turn after this one');
    // the extra turn's own card leads with why it happened, and so does its line in the strip
    expect(extra.head).toBe(`P1 took ${actionName('purple.windup')}`);
    expect(extra.lines[0]).toBe('Night Owl: extra turn');
    expect(extra.text.startsWith(`P1 took ${actionName('purple.windup')} · Night Owl: extra turn`)).toBe(true);
    expect(extra.short.startsWith('Night Owl: extra turn')).toBe(true);
    // and the live card as the extra turn is played
    expect(lastLive(d).lines[0]).toBe('Night Owl: extra turn');
    // a turn in the round's order says nothing of the kind
    const next = d.t.stories.length;
    expect(d.s.pending.player).toBe(1);
    d.take(d.s.pending.options.find(o => o.kind === 'slot').label);
    d.on();
    for (const st of d.t.stories.slice(next)) expect(st.text).not.toMatch(/extra turn/);
  });

  it('Go-Getter, used before the placement: its card leads the head and names the turn it gives', () => {
    const d = table({ quadrants: ['gold', 'red', 'purple', 'green'], round: 2, left: 1, members: [['purple.secondwind']],
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }], order: [0, 1] }, 1);
    d.use();
    d.take('purple.hourly');
    d.on();
    d.take('purple.windup');
    d.on();
    const [earn, extra] = d.t.stories;
    expect(earn.head).toBe(`P1 used Go-Getter, then took ${actionName('purple.hourly')}`);
    expect(earn.lines).toContain('Go-Getter: an extra turn after this one');
    expect(extra.lines[0]).toBe('Go-Getter: extra turn');
  });

  it('Crunch Time: the turns it moves up say they were taken now, not that they are extra', () => {
    const d = table({ quadrants: ['gold', 'red', 'purple', 'green'], round: 3, left: 3,
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }],
      order: [0, 1, 0, 1, 0, 1] }, 1);
    d.take('purple.rally');
    d.on();
    expect(d.s.pending.player).toBe(0);
    d.take(d.s.pending.options.find(o => o.kind === 'slot').label);
    d.on();
    const moved = d.t.stories[1];
    expect(moved.actor).toBe(0);
    expect(moved.lines[0]).toBe('Crunch Time: next turn, now');
    expect(moved.text).not.toMatch(/extra turn/);
  });
});

describe('a member used before the placement is told as its own, not as the space', () => {
  it('Tribute Band copying Collect Debts, then Spree: the gold is Tribute Band\'s (game-skeptic w4 #6)', () => {
    const d = table({ quadrants: ['gold', 'echo', 'market', 'red'], round: 3, left: 2, res: [{ gold: 2 }, { gold: 6 }],
      members: [['echo.dejavu']], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }] }, 0);
    const debts = actionName('gold.steal'), spree = actionName('market.spree');
    d.take('gold.steal');
    d.on();
    d.take(d.s.pending.options.find(o => o.kind === 'slot' && !/Spree/.test(o.label)).label);
    d.on();
    const before = d.lives.length;
    d.use();
    while (d.s.pending.kind === 'choose') d.first();
    // the card while the copy plays out: the member, never a bare "You" over the gold
    const mid = d.lives.slice(before).pop();
    expect(mid.head).toBe('You used Tribute Band');
    expect(mid.lines[0]).toMatch(/^Tribute Band: \+3 gold/);
    d.take('market.spree');
    const card = lastLive(d);
    expect(d.s.log).toContain(`P1's Tribute Band: P1 copies ${debts}: doing it again.`);
    expect(card.head).toBe(`You used Tribute Band, then took ${spree}`);
    // Spree gives nothing itself: no line of gold under it that isn't Tribute Band's
    expect(card.lines.some(l => /^Tribute Band: \+3 gold/.test(l))).toBe(true);
    expect(card.lines).not.toContain('+3 gold');
    expect(card.lines.filter(l => /gold/.test(l))).toHaveLength(1);
  });

  it('the same on a table joined at the start of that turn (a resumed game): told from its effects too', () => {
    const d = table({ quadrants: ['gold', 'echo', 'market', 'red'], round: 3, left: 2, res: [{ gold: 2 }, { gold: 6 }],
      members: [['echo.dejavu']], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }] }, 0);
    d.take('gold.steal');
    d.on();
    d.take(d.s.pending.options.find(o => o.kind === 'slot' && !/Spree/.test(o.label)).label);
    d.on();
    const from = d.states.length - 1;
    d.use();
    while (d.s.pending.kind === 'choose') d.first();
    d.take('market.spree');
    // a new table resumes at the turn's first state and is shown every state after it
    const t = createTrail(0);
    for (const x of d.states.slice(from)) feed(t, x);
    const card = liveStory(t);
    expect(card.head).toBe(`You used Tribute Band, then took ${actionName('market.spree')}`);
    expect(card.lines).toEqual(lastLive(d).lines);
    expect(card.lines).not.toContain('+3 gold');
  });
});

describe('a steal that arrives as magenta is told once', () => {
  // a fresh table each time (sceneQ runs the queue it is given in place)
  const opts = () => ({ quadrants: ['gold', 'thieves', 'market', 'red'], n: 3, round: 1, left: 2, res: [{}, { gold: 3 }, { red: 2 }],
    queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 2 }, { t: 'turn', p: 0 }] });
  const steal = effects => {
    const d = table({ ...opts(), effects }, 1);
    d.take('thieves.tipoff');
    d.on();
    return d.t.stories[0];
  };
  it('from the effects: one line naming each rival and the coins, no "+2 magenta" beside it', () => {
    const st = steal(true);
    expect(st.fx).toBe(true);
    expect(st.lines).toEqual(['1 gold from you, 1 red from P3, as magenta']);
    expect(st.hit).toBe('took 1 of your gold');
    expect(st.short).toBe('1 gold from you, 1 red from P3, as magenta');
  });
  it('from the log (no effects recorded): the same one line', () => {
    const st = steal(false);
    expect(st.fx).toBeUndefined();
    expect(st.lines).toEqual(['1 gold from you, 1 red from P3, as magenta']);
    expect(st.hit).toBe('took 1 of your gold');
    expect(st.short).toBe('1 gold from you, 1 red from P3, as magenta');
  });
  it('several coins from one rival, then from both (Help Yourself): still told once', () => {
    const d = table(opts(), 1);
    d.take('thieves.tipoff');
    d.on();
    for (let k = 0; k < 2; k++) { d.take(d.s.pending.options.find(o => o.kind === 'slot' && !/Redistribute/.test(o.label)).label); d.on(); }
    d.take('thieves.pickpocket');
    d.on();
    const st = d.t.stories[3];
    expect(st.lines[0]).toMatch(/^(\d+ (gold|red) from (you|P3), )+as magenta$/);
    expect(st.lines.some(l => /^\+\d+ magenta$/.test(l))).toBe(false);
    expect(st.lines.filter(l => / from (you|P3)/.test(l))).toHaveLength(1);
  });
});
