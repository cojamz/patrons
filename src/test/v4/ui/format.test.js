// Display helpers that read the engine's state and log.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, followers, quadrant } from '../../../engine/v4/index.js';
import { effectStory, turnGroups, membersWhy, roundGains, firstPickWhy, logSections, parseRoundEnd, newLogLines, winSentence, breakdown, costParts, explainLine, promptFor, traceLine, currentTurn } from '../../../v4/format.js';
import { createTrail, feed } from '../../../v4/game/trail.js';
import { contextFor } from '../../../engine/v4/core.js';

const seats = [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const play = seed => { let s = createGame({ seats, seed }); while (!s.over) s = applyMove(s, chooseBotMove(s, () => 0.4)); return s; };

describe('v4 format helpers', () => {
  it('parses a round-end line into one row per quadrant', () => {
    const s = createGame({ seats, seed: 1 });
    const L = q => quadrant(q).scoring.label;
    const r = parseRoundEnd(s, `Round II ends. ${L('gold')}: Ana & Bo +4 · ${L('red')}: Cy +4`);
    expect(r.round).toBe('II');
    expect(r.rows).toHaveLength(4);
    expect(r.rows.find(x => x.qid === 'gold').winners).toEqual([0, 1]);
    expect(r.rows.find(x => x.qid === 'red').winners).toEqual([2]);
    expect(r.rows.find(x => x.qid === 'blue').winners).toEqual([]);
    expect(parseRoundEnd(s, 'Round I ends. No one scored.').rows.every(x => !x.winners.length)).toBe(true);
  });

  it('says what moved a player\'s member followers: new members, a swap, members lost (w3a #19)', () => {
    expect(membersWhy({ joined: 2, left: 0, swapped: false })).toBe('from new members');
    expect(membersWhy({ joined: 1, left: 1, swapped: true })).toBe('from a swap');
    expect(membersWhy({ joined: 0, left: 1, swapped: false })).toBe('from members lost');
    expect(membersWhy({ joined: 2, left: 1, swapped: true })).toBe('from members in and out');
    // a real swap, from both sides: the one who traded and the one traded with
    let found = 0;
    for (let seed = 1; seed < 40 && !found; seed++) {
      let s = createGame({ seats, seed, quadrants: ['red', 'gold', 'market', 'echo'] });
      let start = s;
      while (!s.over && !found) {
        const before = s;
        s = applyMove(s, chooseBotMove(s, () => 0.4));
        if (s.round !== before.round) start = s;
        const line = newLogLines(before, s).find(l => / traded .+ for .+'s /.test(l));
        if (!line) continue;
        const [, a, b] = line.match(/^(.+?) traded .+ for (.+?)'s /);
        for (const n of [a, b]) {
          const g = roundGains(start, s, s.players.find(p => p.name === n), 0);
          expect(g.swapped).toBe(true);
        }
        found++;
      }
    }
    expect(found).toBe(1);
  });

  it('the log reads newest turn first, each turn top-down (w3b #49), with no bare passes (w3a #34)', () => {
    const st = { players: [{ name: 'P1' }, { name: 'P2' }] };
    const lines = ['P1 took Kickback (Gold).', 'P1 recruited Banker.', 'P2 took Redistribute (Magenta).', 'P2 stole 2 gold from P1.', 'P2 passed.', 'Round I ends. Most gold: P1 +2'];
    expect(turnGroups(st, lines)).toEqual([[5], [2, 3], [0, 1]]);
    // a round's opening line heads the pay-outs logged just before it
    expect(turnGroups(st, ["P2's Investor: +2 gold.", 'Round II begins. P1 picks first.', 'P1 took Kickback (Gold).'])).toEqual([[2], [1, 0]]);
    // a real game: every line but the passes, once each
    const s = play(2);
    for (const sec of logSections(s)) {
      const got = turnGroups(s, sec.lines).flat().sort((a, b) => a - b);
      expect(got).toEqual(sec.lines.map((l, j) => j).filter(j => !/^\S+ passed\.$/.test(sec.lines[j])));
    }
  });

  it('a turn card tells the space\'s own result first, then what members added (w3a #36: "Hustler: +3● / +3●")', () => {
    const s = createGame({ seats, seed: 1 });
    const fx = [
      { type: 'gain', to: { pid: 0 }, what: { r: 'gold', n: 3 }, cause: { kind: 'member', uid: 1, def: 'gold.hustler', pid: 0 } },
      { type: 'gain', to: { pid: 0 }, what: { r: 'gold', n: 3 }, cause: { kind: 'space' } },
    ];
    const st = effectStory(s, s, 0, null, fx);
    expect(st.lines.slice(0, 2)).toEqual(['+3 gold', 'Hustler: +3 gold']);
  });

  it('finds new log lines even when lines repeat', () => {
    const a = { log: ['x', 'P1 passed.', 'y', 'P1 passed.'] };
    const b = { log: [...a.log, 'P2 passed.', 'P1 passed.'] };
    expect(newLogLines(a, b)).toEqual(['P2 passed.', 'P1 passed.']);
    const trimmed = { log: [...a.log.slice(2), 'z'] };
    expect(newLogLines(a, trimmed)).toEqual(['z']);
  });

  it('explains the win in one sentence that names the winner and the margin', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = play(seed);
      const text = winSentence(s);
      const w = s.players[s.ranking[0]];
      expect(text).toMatch(new RegExp(`^${w.name} (won|and)`));
      expect(text.split('. ').length).toBe(1);
      const b = breakdown(s, w);
      expect(b.self + b.members + b.contests + b.bought + b.effects + b.endGame).toBe(followers(s, w));
    }
  });

  it('a member whose color is not on the table costs "any" (no color nobody can hold)', () => {
    const s = createGame({ seats, seed: 1 }); // classic table: no magenta
    const def = { quadrant: 'thieves', s: 6, w: 2 };
    expect(costParts(def)).toEqual([{ color: 'magenta', n: 6 }, { color: 'any', n: 2 }]);
    expect(costParts(def, s.resources)).toEqual([{ color: 'any', n: 8 }]);
    expect(costParts({ quadrant: 'gold', s: 2, w: 2 }, s.resources)).toEqual([{ color: 'gold', n: 2 }, { color: 'any', n: 2 }]);
  });

  it('tells every placement on its own card: the space actually taken, gross amounts, who it touched, recruits', () => {
    // one card per placement (RC1 panel: a snake double read "You took Golden Years · paid 6 gold" after Reprise, paid 10)
    let s = createGame({ seats: [...seats, { name: 'Di', kind: 'bot' }], seed: 11 });
    const trail = createTrail(0);
    let doubles = 0;
    for (let k = 0; k < 3000 && !s.over; k++) { s = applyMove(s, chooseBotMove(s, () => 0.4)); feed(trail, s); }
    let recruits = 0, touched = 0;
    trail.stories.forEach((st, i) => {
      const prev = trail.stories[i - 1];
      if (prev && prev.actor === st.actor && prev.round === st.round) doubles++;
      const name = s.players[st.actor].name;
      expect(st.text.startsWith(st.actor === 0 ? 'You' : name)).toBe(true);
      // exactly one placement per card, and the head names it
      expect(st.text.match(/ (took|joined) /g) || []).toHaveLength(st.space ? 1 : 0);
      if (st.space) expect(st.head).toMatch(new RegExp(`${st.space.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      for (const id of st.touched) { touched++; expect(st.text).toMatch(new RegExp(`(from |· |: )${id === 0 ? 'you' : s.players[id].name} `)); }
      if (/recruited /.test(st.text)) { recruits++; expect(st.text).toMatch(/recruited [^·]+\((paid [^)]+|free)\)/); }
    });
    expect(trail.stories.length).toBeGreaterThan(40);
    expect(doubles).toBeGreaterThan(0);
    expect(recruits).toBeGreaterThan(0);
    expect(touched).toBeGreaterThan(0);
  });
  it('a placement after a payment never nets: what was paid is the price, what the space gave is told apart', () => {
    let s = createGame({ seats, seed: 5 });
    const trail = createTrail(0);
    for (let k = 0; k < 3000 && !s.over; k++) { s = applyMove(s, chooseBotMove(s, () => 0.4)); feed(trail, s); }
    const all = s.log.join('\n');
    let n = 0;
    for (const st of trail.stories) for (const l of st.lines) {
      const m = l.match(/^recruited (.+?) \(paid (.+)\)$/);
      if (!m) continue;
      n++;
      // the paid amount is the price the engine logged, never a net of the turn's other gains
      expect(all).toContain(`recruited ${m[1]} (${m[2]})`);
    }
    expect(n).toBeGreaterThan(3);
  });
  it('told from the effect stream: what cost you names its cause (Raider), and no line repeats', () => {
    // wave-2 blocker: P2's Raider bought 3 of the tester's followers and the strip never said so
    const four = [...seats, { name: 'Di', kind: 'bot' }];
    let found = null;
    for (let seed = 1; seed < 12 && !found; seed++) {
      let s = createGame({ seats: four, seed, quadrants: ['trading', 'gold', 'red', 'blue'] });
      const states = [s];
      while (!s.over) { s = applyMove(s, chooseBotMove(s, () => 0.4), { effects: true }); states.push(s); }
      const raid = s.log.find(l => /Raider bought \d+ followers? from/.test(l));
      if (!raid) continue;
      const victim = s.players.find(p => raid.includes(`from ${p.name} `)).id;
      const t = createTrail(victim);
      for (const x of states) feed(t, x);
      found = { t, n: Number(raid.match(/bought (\d+)/)[1]) };
    }
    expect(found).toBeTruthy();
    const st = found.t.stories.find(x => /Raider took/.test(x.hit || ''));
    expect(st).toBeTruthy();
    expect(st.short.startsWith(`Raider took ${found.n} of your followers`)).toBe(true);
    for (const x of found.t.stories) {
      expect(new Set(x.lines).size).toBe(x.lines.length);
      // your own turn never reads as something done to you
      if (x.actor === found.t.me) expect(x.hit).toBe('');
    }
  });
  it('a member that fires gets its own line, and its amount comes off the gross (Tax Collector: P2 +1 gold)', () => {
    const s = createGame({ seats, seed: 3 });
    const P = s.players;
    expect(traceLine("Bo's Tax Collector: +1 gold.", P, s.resources)).toMatchObject({ owner: 1, target: 1, card: 'Tax Collector', res: { gold: 1 } });
    expect(traceLine('Cy +1 silver (Ana\'s Retinue).', P, [...s.resources, 'silver'])).toMatchObject({ owner: 0, target: 2, card: 'Retinue', res: { silver: 1 } });
    expect(traceLine("Ana's next member costs 4 less.", P, s.resources)).toBeNull();
    expect(traceLine("Ana's Underdog: gold gain 4 → 8.", P, s.resources)).toBeNull();
  });
  it('a Goody Bags line reads as two gains, never as a gift from "P4 took 2 magenta and"', () => {
    const s = createGame({ seats, seed: 3, quadrants: ['gold', 'red', 'silver', 'thieves'] });
    s.log = [];
    quadrant('silver').handlers.gift(contextFor(s), s.players[0], 'magenta', { mine: 2 });
    const i = s.log.findIndex(l => /and gave everyone else/.test(l));
    expect(s.log[i]).toBe('Ana took 2 magenta and gave everyone else 1 magenta.');
    expect(explainLine(s.log, i).text).toBe('Ana gains 2 magenta; everyone else gains 1 magenta.');
    expect(explainLine(s.log, i).gift).toBeUndefined();
  });

  it('prompts with a short verb phrase: the snake turnaround is "your turn again", not an extra turn', () => {
    let s = createGame({ seats, seed: 3 });
    // walk to a placement that follows the same player's own placement (the snake's turn)
    let again = null, buy = null, other = null;
    for (let n = 0; n < 400 && !(again && buy && other); n++) {
      const pr = s.pending && promptFor(s, s.pending.player === 0);
      if (pr && s.pending.kind === 'buy' && s.pending.player === 0 && !buy) buy = pr;
      if (pr && s.pending.kind === 'place' && s.pending.player === 0 && pr.lead) again = pr;
      if (pr && s.pending.kind === 'place' && s.pending.player !== 0 && /again/.test(pr.text)) other = { pr, name: s.players[s.pending.player].name };
      s = applyMove(s, chooseBotMove(s, () => 0.4));
    }
    expect(again).toBeTruthy();
    expect(`${again.lead}${again.text}`).toBe('Your turn again (snake order) — place a minion');
    expect(JSON.stringify(again)).not.toMatch(/extra/i);
    expect(other.pr.text).toBe(`${other.name} again (snake order)`);
    expect(buy.text).toBe('Recruit or buy');
    expect(buy.sub).toMatch(/^A member from the shop, or followers/); // finishes the headline, never repeats it (design pod)
    // nobody else's turn ever reads as yours
    expect(promptFor(s, false).text).not.toMatch(/^Your|^Extra/);
  });

  it('an extra turn from a card is told as one, naming the card or space that gave it', () => {
    let found = null;
    for (let seed = 1; seed < 40 && !found; seed++) {
      let s = createGame({ seats, seed, quadrants: ['gold', 'purple', 'echo', 'silver'] });
      for (let n = 0; n < 3000 && !s.over && !found; n++) {
        const t = s.pending && s.pending.kind === 'place' && currentTurn(s);
        if (t && t.again && t.kind === 'extra') found = { t, pr: promptFor(s, true), name: s.players[s.pending.player].name };
        s = applyMove(s, chooseBotMove(s, () => 0.4));
      }
    }
    expect(found).toBeTruthy();
    expect(found.t.why).toBeTruthy();
    expect(`${found.pr.lead}${found.pr.text}`).toBe(`Extra turn (${found.t.why}): place one more minion`);
  });

  it('the log: a round opens at the last round\'s end, so its round-start lines are in it (w2a #27)', () => {
    const log = ['P1 picks gold.', 'Round I begins. P1 picks first.', 'P1 took Rush (Gold).', 'Round I ends. Most gold: P1 +2', 'P2\'s Minimalist: +1 blue.', 'Round II begins. P2 picks first.', 'P2 took Rush (Gold).'];
    const secs = logSections({ log });
    expect(secs.map(x => x.title)).toEqual(['Setup', 'Round I', 'Round II']);
    expect(secs[1].lines[secs[1].lines.length - 1]).toMatch(/^Round I ends/);
    expect(secs[2].lines[0]).toMatch(/Minimalist/);
    for (const x of secs) x.lines.forEach((l, j) => expect(log[x.start + j]).toBe(l)); // start indexes the log
  });

  it('a long question in the headline says what it asks, never "Choose below" (RC1 round 3 #55)', () => {
    const s = createGame({ seats, seed: 3 });
    const at = prompt => ({ ...s, pending: { kind: 'choose', player: 1, prompt, options: [{ id: 'a', label: 'Pay 4' }, { id: 'b', label: 'Let it go' }] } });
    expect(promptFor(at('Cy holds your Magnate to ransom: pay 4 to keep it?'), true).text).toBe('Cy holds Magnate: keep it for 4?');
    expect(promptFor(at('Bo: take 6 more from the release, in any colors'), true).text).toBe('take 6 more from the release, in any colors');
  });

  it('who picks first says why: the member that makes them, else fewest followers; round I is drawn (w3a A2)', () => {
    const s = createGame({ seats, seed: 5 });
    const uid = Object.keys(s.cards).map(Number).find(u => s.cards[u].def === 'benders.frontrunner');
    const at = (round, members) => ({ ...s, round, players: s.players.map((p, i) => (i === 1 ? { ...p, members } : p)) });
    if (uid != null) expect(firstPickWhy(at(2, [uid]), 1)).toBe('Front-runner');
    expect(firstPickWhy(at(2, []), 1)).toBe('fewest followers');
    expect(firstPickWhy(at(1, []), 1)).toBeNull();
  });
});

