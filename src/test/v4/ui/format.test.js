// Display helpers that read the engine's state and log.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, followers, quadrant, defById } from '../../../engine/v4/index.js';
import { turnStory, foldRepeats, effectStory, turnGroups, membersWhy, membersParts, roundGains, firstPickWhy, logSections, parseRoundEnd, newLogLines, winSentence, breakdown, costParts, explainLine, promptFor, traceLine, currentTurn, plainLine, RING_NOTE } from '../../../v4/format.js';
import { createTrail, feed } from '../../../v4/game/trail.js';
import { contextFor, useIdle } from '../../../engine/v4/core.js';

const seats = [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const play = seed => { let s = createGame({ seats, seed }); while (!s.over) s = applyMove(s, chooseBotMove(s, () => 0.4)); return s; };

describe('v4 format helpers', () => {
  it('parses a round-end line into one row per quadrant', () => {
    const s = createGame({ seats, seed: 1 });
    const L = q => quadrant(q).scoring.label;
    const r = parseRoundEnd(s, `Round II ends. ${L('gold')}: Ana & Bo +4 · ${L('red')}: Cy +4`);
    expect(r.round).toBe('II');
    expect(r.rows).toHaveLength(3); // three players, three spheres (Cory, 2026-10-15)
    expect(r.rows.find(x => x.qid === 'gold').winners).toEqual([0, 1]);
    expect(r.rows.find(x => x.qid === 'red').winners).toEqual([2]);
    expect(r.rows.find(x => x.qid === 'market').winners).toEqual([]);
    expect(parseRoundEnd(s, 'Round I ends. No one scored.').rows.every(x => !x.winners.length)).toBe(true);
  });

  it('says what moved a player\'s member followers: new members, a swap, members lost (w3a #19)', () => {
    expect(membersWhy({ joined: 2, left: 0, swapped: false })).toBe('from new members');
    expect(membersWhy({ joined: 1, left: 1, swapped: true })).toBe('from a swap');
    expect(membersWhy({ joined: 0, left: 1, swapped: false })).toBe('from members that left');
    // new members and losses said apart, never one "in and out" sum
    expect(membersParts({ joined: 4, left: 1, swapped: false, members: 10, lost: 1, gained: 11 })).toEqual(['+11 from new members', '−1 from members that left']);
    expect(membersParts({ joined: 1, left: 1, swapped: true, members: -1, lost: 3, gained: 2 })).toEqual(['−1 from a swap']);
    expect(membersParts({ joined: 2, left: 0, swapped: false, members: 2, lost: 0, gained: 2 })).toEqual(['+2 from new members']);
    // A third player can exchange two rivals: attribute the swap to both owners, not the actor.
    const start = createGame({ seats, seed: 1, quadrants: ['red', 'gold', 'market', 'echo'] });
    const [a, b] = start.shop.splice(0, 2);
    start.players[1].members.push(a); start.players[2].members.push(b);
    const end = structuredClone(start);
    expect(contextFor(end).swapMembers(end.players[0], a, b)).toBe(true);
    end.log.push(`Ana swapped Bo's ${defById(start.cards[a].def).name} and Cy's ${defById(start.cards[b].def).name}.`);
    expect(roundGains(start, end, end.players[0], 0).swapped).toBe(false);
    for (const p of end.players.slice(1)) expect(roundGains(start, end, p, 0).swapped).toBe(true);
  });

  it('the log reads newest turn first, each turn top-down (w3b #49), with no bare passes (w3a #34)', () => {
    const st = { players: [{ name: 'P1' }, { name: 'P2' }] };
    const lines = ['P1 took Kickback (Gold).', 'P1 recruited Banker.', 'P2 took Redistribute (Magenta).', 'P2 stole 2 gold from P1.', 'P2 passed.', 'Round I ends. Most gold: P1 +2'];
    expect(turnGroups(st, lines)).toEqual([[5], [2, 3], [0, 1]]);
    // a minion that joins a rival's space starts a turn too, and says whose doing it is (Squatter), never a copy
    expect(turnGroups(st, ['P1 took Kickback (Gold).', 'P2 joined P1 on Kickback (Gold).', 'P2 recruited Banker.'])).toEqual([[1, 2], [0]]);
    expect(explainLine(['P2 joined P1 on Kickback (Gold).'], 0).text).toBe('P2 joined P1 on Kickback (Squatter).');
    // a member's trigger that repeats is said once, at its newest, with how many times (w4b #29: Tipster after every move)
    const tip = ['P1 took Kickback (Gold).', "P3's Tipster: +1 white.", 'P2 took Rush (Gold).', "P3's Tipster: +1 white.", 'P1 took Haggle (White).', "P3's Tipster: +1 white."];
    const f = foldRepeats(tip, turnGroups(st, tip));
    expect(f.groups).toEqual([[4, 5], [2], [0]]);
    expect(f.times.get(5)).toBe(3);
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

  it('the strip names what you got on a rival\'s turn and the members that paid it (wave-2 A#3, B#46)', () => {
    const s = createGame({ seats, seed: 1 });
    // Bo's turn: the space gives Bo 3 silver and you (Ana) 1; your Silversmith and Cy's Caterer add 1 each
    const fx = [
      { type: 'gain', to: { pid: 1 }, what: { r: 'silver', n: 3 }, cause: { kind: 'space' } },
      { type: 'gain', to: { pid: 0 }, what: { r: 'silver', n: 1 }, cause: { kind: 'space' } },
      { type: 'gain', to: { pid: 0 }, what: { r: 'silver', n: 1 }, cause: { kind: 'member', uid: 1, def: 'silver.silversmith', pid: 0 } },
      { type: 'gain', to: { pid: 0 }, what: { r: 'gold', n: 1 }, cause: { kind: 'member', uid: 2, def: 'gold.taxman', pid: 2 } },
    ];
    const st = effectStory(s, s, 1, 0, fx);
    expect(st.gift).toBe(`you +2 silver +1 gold (Silversmith, Cy's ${defById('gold.taxman').name})`);
    expect(st.short.startsWith(st.gift)).toBe(true);
    // on the turn card it leads, right after the space's own result, and isn't told again in its parts
    expect(st.lines.slice(0, 2)).toEqual(['+3 silver', st.gift]);
    expect(st.lines.some(l => /^(Your )?Silversmith:|^you \+1 silver$/.test(l))).toBe(false);
    // your own turn names no gift
    expect(effectStory(s, s, 0, 0, fx).gift).toBe('');
    // the log's story (an online guest's table, no effect stream) says it too
    const end = structuredClone(s);
    end.log = [...s.log, 'Bo took Kickback (Gold).', "Ana's Tax Collector: +1 gold."];
    end.players[1].res.gold = (end.players[1].res.gold || 0) + 3;
    end.players[0].res.gold = (end.players[0].res.gold || 0) + 2;
    const ts = turnStory(s, end, 1, 0);
    expect(ts.gift).toBe('you +2 gold (Tax Collector)');
    expect(ts.short.startsWith('you +2 gold (Tax Collector)')).toBe(true);
    expect(ts.lines.slice(0, 2)).toEqual(['+3 gold', 'you +2 gold (Tax Collector)']);
    expect(ts.lines.some(l => /^(Your )?Tax Collector:|^you \+\d gold$/.test(l))).toBe(false);
  });

  it('a member used before placing leads the turn card\'s head, in order (w4 skeptic #6)', () => {
    let found = 0;
    for (let seed = 1; seed < 80 && !found; seed++) {
      let s = createGame({ seats: [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }], seed, quadrants: ['gold', 'red', 'echo', 'yellow'] });
      for (let k = 0; k < 1500 && !s.over && !found; k++) {
        const pend = s.pending;
        // a use that would change nothing (Stunt Double with nothing to copy) is muted on screen, not a story
        const use = pend && pend.kind === 'place' && pend.options.find(o => String(o.id).startsWith('use:') && !useIdle(s, s.players[pend.player], o.uid));
        if (use) {
          const start = s, pid = pend.player, name = s.players[pid].name;
          let t = applyMove(s, { player: pid, option: use.id });
          // a copier with nothing to copy keeps its use and says so ("Bo's Stunt Double has nothing to copy."): no use
          // happened, so the head rightly says only what was taken; this guard is about a use that went through
          if (!t.cards[use.uid]?.used) { s = applyMove(s, chooseBotMove(s, () => 0.4)); continue; }
          // only the Use so far: "Ana used X", never a bare "Ana"
          const mid = turnStory(start, t, pid);
          if (mid) expect(mid.head).toMatch(new RegExp(`^${name} used \\S`));
          for (let j = 0; j < 20 && t.pending && t.pending.player === pid && t.pending.kind !== 'place'; j++) t = applyMove(t, chooseBotMove(t, () => 0.4));
          if (t.pending && t.pending.kind === 'place' && t.pending.player === pid) {
            const slot = t.pending.options.find(o => String(o.id).startsWith('slot:'));
            if (slot) {
              t = applyMove(t, { player: pid, option: slot.id });
              const st = turnStory(start, t, pid);
              expect(st.head).toMatch(new RegExp(`^${name} used .+, then took .+`));
              expect(st.lines.some(l => /^used /.test(l))).toBe(false); // said once, in the head
              found++;
            }
          }
        }
        s = applyMove(s, chooseBotMove(s, () => 0.4));
      }
    }
    expect(found).toBe(1);
  });

  it('the strip names a swap and whose member it was (w4 A#62: "Swap Sides · bought 10")', () => {
    const s = createGame({ seats, seed: 1 });
    const [u1, u2] = Object.keys(s.cards).map(Number);
    const fx = [
      { type: 'member-move', what: { uid: u1 }, from: { pid: 0 }, to: { pid: 1 }, cause: { kind: 'space' } },
      { type: 'member-move', what: { uid: u2 }, from: { pid: 1 }, to: { pid: 0 }, cause: { kind: 'space' } },
      { type: 'followers', what: { n: 10 }, to: { kind: 'count', pid: 1 }, cause: { kind: 'buy', tier: 'top' } },
    ];
    const st = effectStory(s, s, 1, 0, fx);
    expect(st.short).toMatch(/took your .+, gave .+ to you/);
    expect(st.short).not.toMatch(/bought/);
  });

  it('Promote names both directions of the shop exchange without calling it a release', () => {
    const s = createGame({ seats, seed: 1 });
    const [u1, u2] = Object.keys(s.cards).map(Number);
    const cause = { kind: 'space', pid: 0, key: '0-0' };
    const story = effectStory(s, s, 0, 0, [
      { type: 'release', what: { uid: u1 }, from: { kind: 'crowd', pid: 0 }, to: { kind: 'shop', uid: u1 }, cause },
      { type: 'recruit', what: { uid: u2 }, from: { kind: 'shop', uid: u2 }, to: { kind: 'crowd', pid: 0 }, cause },
    ]);
    expect(story.short).toMatch(/gave .+ to the shop, took the shop's/);
    expect(story.short).not.toMatch(/released/);
  });

  it("Red's swap with the shop names the member that left and the one that came (backlog 2026-10-21)", () => {
    // real moves from bot games: every "X swapped A's Y and Shop's Z." turn tells both Y and Z
    let seen = 0, rival = 0;
    for (let seed = 1; seed <= 40 && seen < 4; seed++) {
      let s = createGame({ seats, seed });
      while (!s.over) {
        const n = applyMove(s, chooseBotMove(s, () => 0.4), { effects: true });
        const line = n.log.slice(s.log.length).map(l => l.match(/^(\w+) swapped (\w+)'s (.+) and Shop's (.+)\.$/)).find(Boolean);
        // the game's last move also tells the game-end scoring ("you +6 followers (Tycoon) · swapped …"): judge the rest
        // (Even Swap may also trade two shop members' places, 'swapped Shop's X and Shop's Y': no member left a cult, so
        // there's nothing to name here; bots pick it since their swaps are scored for real, 2026-10-21. todo.md tracks its story line.)
        if (line && !n.over && line[2] !== 'Shop') {
          const [, actorName, ownerName, out, inc] = line;
          const actor = n.players.findIndex(p => p.name === actorName), owner = n.players.findIndex(p => p.name === ownerName);
          for (const me of [actor, (actor + 1) % 3]) {
            const st = effectStory(s, n, actor, me, n.effects);
            expect(st.short).toContain(out);
            expect(st.short).toContain(inc);
            expect(st.text).toContain(out);
            expect(st.text).toContain(inc);
          }
          if (owner !== actor) {
            rival++;
            // a Movement Penalty hit may follow on the same line ("…, Movement Penalty took 1 of your followers"), never a repeat
            const short = effectStory(s, n, actor, owner, n.effects).short;
            expect(short.startsWith(`swapped your ${out} for the shop's ${inc}`)).toBe(true);
            expect(short.split(`swapped your ${out}`).length).toBe(2);
          } else expect(effectStory(s, n, actor, actor, n.effects).short).toBe(`gave ${out} to the shop, took the shop's ${inc}`);
          seen++;
        }
        s = n;
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(rival).toBeGreaterThan(0);
  });

  it('a gain that came in another color names the member that changed it (w4 skeptic #18)', () => {
    const s = createGame({ seats, seed: 1 });
    const end = structuredClone(s);
    end.log = [...s.log, 'Ana took Bandwagon (Red).', "Ana's Midas: 6 red comes as 6 gold."];
    end.players[0].res.gold = (end.players[0].res.gold || 0) + 6;
    const st = turnStory(s, end, 0);
    expect(st.short).toMatch(/^\+6 gold \(Midas\)/);
  });

  it('the log names a space by the words the board shows on it too (panel r1: "Encore"; wave-2 B#3: "which is Crime Wave?")', () => {
    const log = ['Round II begins. Bo picks first.', 'P1 took Encore (Green).', "Cy copied Rising Tide (Di's): +6 silver.", 'P1 took Kickback (Gold).', 'P1 took Nowhere (Gold).'];
    expect(plainLine(log, 1)).toBe('P1 took Encore (Copy an action with a rival minion).');
    expect(plainLine(log, 2)).toBe('Cy copied Di\'s Rising Tide (Gain silver: half the top rival’s): +6 silver.');
    expect(plainLine(log, 3)).toBe('P1 took Kickback (+3 gold, +1 gold to a rival).');
    expect(plainLine(log, 4)).toBe('P1 took Nowhere (Gold).'); // no such space: the line as the engine wrote it
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

  it('explains when members decide a follower tie, and when the win is shared', () => {
    const s = createGame({ seats, seed: 1 });
    const cards = Object.keys(s.cards).map(Number).filter(uid => {
      const d = defById(s.cards[uid].def);
      return d.f === 1 && d.n === 1;
    });
    s.players.forEach(p => { p.members = []; p.bonus = 0; });
    s.players[0].members = cards.slice(0, 2);
    s.players[1].members = cards.slice(2, 3);
    s.players[1].bonus = 1;
    s.ranking = [0, 1, 2];
    expect(followers(s, s.players[0])).toBe(followers(s, s.players[1]));
    expect(winSentence(s)).toBe('Ana won the 3-follower tie with 2 members.');
    s.players[1].members = cards.slice(2, 4);
    s.players[1].bonus = 0;
    expect(winSentence(s)).toBe('Ana and Bo tie on 3 followers and 2 members.');
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
      // a minion joining a rival's space says whose doing it is: "… joined Bo on Recruit a Member (Squatter)"
      if (st.space) expect(st.head).toMatch(new RegExp(`${st.space.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(Squatter\\))?$`));
      for (const id of st.touched) { touched++; expect(st.text).toMatch(new RegExp(`(from |· |: )${id === 0 ? 'you' : s.players[id].name}( |$)`)); }
      if (/recruited /.test(st.text)) { recruits++; expect(st.text).toMatch(/recruited [^·]+\((paid [^)]+|free)\)/); }
    });
    expect(trail.stories.length).toBeGreaterThan(40);
    expect(doubles).toBeGreaterThan(0);
    expect(recruits).toBeGreaterThan(0);
    expect(touched).toBeGreaterThan(0);
  });
  it('a placement after a payment never nets: what was paid is the price, what the space gave is told apart', () => {
    let s = createGame({ seats, seed: 5 });
    const trail = createTrail(0), allLogs = new Set(s.log);
    for (let k = 0; k < 3000 && !s.over; k++) { s = applyMove(s, chooseBotMove(s, () => 0.4)); feed(trail, s); s.log.forEach(l => allLogs.add(l)); }
    let n = 0;
    for (const st of trail.stories) for (const l of st.lines) {
      const m = l.match(/^recruited (.+?) \(paid (.+)\)$/);
      if (!m) continue;
      n++;
      // the paid amount is the price the engine logged, never a net of the turn's other gains
      // (a recruit from the pile reads "recruited X from the pile with Insider (price)")
      expect([...allLogs].some(l => l.includes(`recruited ${m[1]} `) && l.slice(l.indexOf(' (') + 2).split(/[;)]/)[0] === m[2].split(';')[0]), `${l} :: ${JSON.stringify([...allLogs].filter(x => x.includes('recruited ')))}`).toBe(true);
    }
    expect(n).toBeGreaterThan(3);
  });
  it('told from the effect stream: what cost you names its cause (Raider), and no line repeats', () => {
    // wave-2 blocker: P2's Raider bought 3 of the tester's followers and the strip never said so
    const four = [...seats, { name: 'Di', kind: 'bot' }];
    let found = null;
    for (let seed = 1; seed < 60 && !found; seed++) {
      let s = createGame({ seats: four, seed, quadrants: ['trading', 'gold', 'red', 'blue'] });
      const states = [s];
      while (!s.over) { s = applyMove(s, chooseBotMove(s, () => 0.4), { effects: true }); states.push(s); }
      const raid = s.log.find(l => /Raider stole \d+ followers? from/.test(l));
      if (!raid) continue;
      const victim = s.players.find(p => raid.includes(`from ${p.name} `)).id;
      const t = createTrail(victim);
      for (const x of states) feed(t, x);
      found = { t, n: Number(raid.match(/stole (\d+)/)[1]) };
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
    // walk to a placement that follows the same player's own placement (the snake's turn); seeded games, so try a few
    let s = null, again = null, buy = null, other = null;
    for (let seed = 3; seed < 20 && !(again && buy && other); seed++) {
    s = createGame({ seats, seed });
    for (let n = 0; n < 400 && !s.over && !(again && buy && other); n++) {
      const pr = s.pending && promptFor(s, s.pending.player === 0);
      if (pr && s.pending.kind === 'buy' && s.pending.player === 0 && !buy) buy = pr;
      if (pr && s.pending.kind === 'place' && s.pending.player === 0 && pr.lead) again = pr;
      if (pr && s.pending.kind === 'place' && s.pending.player !== 0 && /again/.test(pr.text)) other = { pr, name: s.players[s.pending.player].name };
      s = applyMove(s, chooseBotMove(s, () => 0.4));
    }
    }
    expect(again).toBeTruthy();
    expect(`${again.lead}${again.text}`).toBe('Your turn again (snake order) — place a minion');
    expect(JSON.stringify(again)).not.toMatch(/extra/i);
    expect(other.pr.text).toBe(`${other.name} again (snake order)`);
    expect(buy.text).toBe('Recruit a member or followers');
    expect(buy.sub == null || /^…or use /.test(buy.sub)).toBe(true); // one line for one step: no subtitle saying it again (blind testers, 2026-10-15)
    // nobody else's turn ever reads as yours
    expect(promptFor(s, false).text).not.toMatch(/^Your|^Extra/);
  });

  it('your first placement of each round says which rings are open; later placements and rivals\' turns do not (first play)', () => {
    const seen = {};
    let s = createGame({ seats, seed: 7 });
    while (!s.over) {
      const pend = s.pending;
      if (pend && pend.kind === 'place' && !(currentTurn(s) || {}).again) {
        const pr = promptFor(s, pend.player === 0);
        const first = !Object.values(s.slots).includes(pend.player);
        if (pend.player === 0 && !/use/.test(pr.sub || '')) {
          expect(pr.text).toBe('Place a minion on a glowing space');
          if (first) { expect(pr.sub).toBe(RING_NOTE[s.round]); seen[s.round] = true; } else expect(pr.sub).toBeUndefined();
        }
        if (pend.player !== 0) expect(pr.sub).toBeUndefined();
      }
      s = applyMove(s, chooseBotMove(s, () => 0.4));
    }
    expect(Object.keys(seen).length).toBeGreaterThan(0);
    expect(RING_NOTE[1]).toMatch(/inner rings open in rounds II and III/);
    for (const r of [1, 2, 3]) expect(RING_NOTE[r].length).toBeLessThanOrEqual(48); // one short line at 900px
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
    expect(promptFor(at('Shake Down: pay Cy 4 to keep Magnate?'), true).text).toBe('Cy holds Magnate: keep it for 4?');
    expect(promptFor(at('Shake Down: pay Cy 4 (2 red, 2 gold) to keep Magnate?'), true).text).toBe('Cy holds Magnate: keep it for 4 (2 red, 2 gold)?');
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

