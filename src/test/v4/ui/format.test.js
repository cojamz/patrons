// Display helpers that read the engine's state and log.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, followers, quadrant } from '../../../engine/v4/index.js';
import { parseRoundEnd, newLogLines, winSentence, breakdown, costParts, turnStory, explainLine, promptFor } from '../../../v4/format.js';
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

  it('tells every turn in one line: the action, what changed, who it touched, recruits and followers', () => {
    let s = createGame({ seats, seed: 11 });
    let start = null, told = 0, touched = 0, recruits = 0;
    for (let k = 0; k < 3000 && !s.over; k++) {
      const before = s;
      s = applyMove(s, chooseBotMove(s, () => 0.4));
      const actor = before.pending.player;
      if (!start || start.actor !== actor) start = { actor, state: before, mid: null };
      if (s.pending && s.pending.kind === 'buy' && s.pending.player === actor && !start.mid) start.mid = s;
      const passed = before.round >= 1 && s.round === before.round && !(s.pending && s.pending.player === actor);
      if (!passed) continue;
      const story = turnStory(start.state, s, actor, 0, start.mid);
      // the action's gains and the buy's cost are told apart: a recruit says what it cost
      const got = s.players[actor].members.length > before.players[actor].members.length || s.players[actor].members.some(u => !start.state.players[actor].members.includes(u));
      if (got && start.mid) expect(story.text).toMatch(/recruited [^·]+(\(paid [^)]+\))?/);
      start = null;
      const a0 = before.players[actor];
      expect(story).toBeTruthy();
      expect(story.text.startsWith(actor === 0 ? 'You' : a0.name)).toBe(true);
      told++;
      // every rival whose resources changed this turn is named in the line
      for (const id of story.touched) {
        touched++;
        expect(story.text).toMatch(new RegExp(`(from |· )${id === 0 ? 'you' : s.players[id].name} `));
      }
      if (/recruited /.test(story.text)) recruits++;
    }
    expect(told).toBeGreaterThan(20);
    expect(recruits).toBeGreaterThan(0);
    expect(touched).toBeGreaterThan(0);
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

  it('prompts with a short verb phrase: "Extra turn: place one more minion", "Recruit or buy" with the details under it', () => {
    let s = createGame({ seats, seed: 3 });
    // walk to a placement that follows the same player's own placement (the snake's turn): the extra-turn prompt
    let again = null, buy = null;
    for (let n = 0; n < 400 && !(again && buy); n++) {
      const pr = s.pending && promptFor(s, true);
      if (pr && s.pending.kind === 'buy' && !buy) buy = pr;
      if (pr && s.pending.kind === 'place' && pr.lead) again = pr;
      s = applyMove(s, chooseBotMove(s, () => 0.4));
    }
    expect(again).toBeTruthy();
    expect(`${again.lead}${again.text}`).toBe('Extra turn: place one more minion');
    expect(JSON.stringify(again)).not.toMatch(/snake/i);
    expect(buy.text).toBe('Recruit or buy');
    expect(buy.sub).toMatch(/Recruit a member or buy followers, or pass/);
    // nobody else's turn ever reads as yours
    expect(promptFor(s, false).text).not.toMatch(/^Your|^Extra/);
  });
});

