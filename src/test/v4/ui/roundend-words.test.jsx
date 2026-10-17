// The round summary and the results agree with each other and say what they count (live panel r1, cf23306):
//   - round III's summary said 72 where the results said 73: its totals left out the end-game bonuses ("still to add")
//   - "This round —" beside a player who recruited 3: parts that cancel out (members in, followers lost) showed a dash
//   - the results said "7 members" in a hover and "10 members" beside the name: cards counted in one, members in the other
//   - "P3 picks first: Front-runner" never said what Front-runner is; "Most purple" never said most what
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, memberCount, cardDef } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { parseRoundEnd, isRoundEnd, newLogLines, scoringSnapshot, roundGains } from '../../../v4/format.js';
import { ruleWords } from '../../../v4/shorts.js';
import RoundEnd from '../../../v4/game/RoundEnd.jsx';
import Results from '../../../v4/game/Results.jsx';

afterEach(cleanup);

/** Every round end of a bot game, as the table shows it: { info, start } per round, and the finished state. */
function play(seed, quadrants) {
  const rand = seededRandom(seed);
  let s = createGame({ seats: ['Ana', 'Bo', 'Cy'].map(name => ({ name, kind: 'bot' })), seed, ...(quadrants ? { quadrants } : {}) });
  let start = s;
  const ends = [];
  for (let k = 0; k < 4000 && !s.over; k++) {
    const prev = s;
    s = applyMove(s, chooseBotMove(s, rand));
    const end = newLogLines(prev, s).filter(isRoundEnd).pop();
    if (end) { ends.push({ result: parseRoundEnd(s, end), start, after: s, board: scoringSnapshot(prev, s) }); start = s; }
  }
  return { ends, over: s };
}
const totals = container => Object.fromEntries([...container.querySelectorAll('[data-total]')].map(e => [e.dataset.total.split(':')[0], Number(e.dataset.total.split(':')[1])]));

describe('round summary and results (live panel r1)', () => {
  it('round III\'s totals are the results\' totals, end-game bonuses in', () => {
    let withBonus = 0;
    for (const seed of [3, 13]) {
      const { ends, over } = play(seed);
      const info = ends[ends.length - 1];
      expect(info.after.over).toBe(true);
      if (over.players.some(p => p.final.total)) withBonus++;
      const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
      const shown = totals(container);
      for (const p of over.players) expect(shown[p.id], `seed ${seed} ${p.name}`).toBe(followers(over, p));
      // and in the results' order
      expect([...container.querySelectorAll('[data-total]')].map(e => Number(e.dataset.total.split(':')[0]))).toEqual(over.ranking);
      const line = container.querySelector('.re-final');
      expect(line.textContent).not.toMatch(/still to add/);
      cleanup();
      const r = render(<Results state={over} onPlayAgain={() => {}} onHome={() => {}} />);
      const res = [...r.container.querySelectorAll('.res-t tbody tr .tot')].map(td => Number(td.textContent));
      expect(res).toEqual(over.ranking.map(id => shown[id]));
      cleanup();
    }
    expect(withBonus).toBeGreaterThan(0); // the case the panel saw: some end-game bonus
  });

  it('"This round" shows its parts even when they cancel out, never "—" over a recruit', () => {
    const { ends } = play(5);
    const info = ends[1];
    const p = info.after.players.find(x => roundGains(info.start, info.board || info.after, x, 0).members > 0);
    expect(p).toBeTruthy();
    const g = roundGains(info.start, info.board || info.after, p, 0);
    // the same round, but this player also lost as many followers as their new members brought (a sale, a raid)
    const start = structuredClone(info.start);
    start.players[p.id].bonus += g.members;
    const { container } = render(<RoundEnd info={{ ...info, start }} onNext={() => {}} autoMs={0} />);
    const cell = container.querySelector(`[data-this-round="${p.id}"]`);
    expect(cell.textContent).not.toBe('—');
    expect(cell.textContent).toMatch(new RegExp(`\\+${g.gained} from new members`));
    // followers, said as followers: never "+1 new members" (a count of members)
    expect(container.textContent).not.toMatch(/[+−]\d+ new members/);
  });

  it('the results count members one way: the rule\'s (a card that counts as 3 counts 3)', () => {
    const over = structuredClone(play(13, ['silver', 'red', 'gold', 'trading']).over);
    // Revelers ("Counts as 3 members") in a cult: 3 members on one card
    const rev = Object.values(over.cards).find(c => cardDef(over, c.uid).key === 'revelers');
    expect(rev).toBeTruthy();
    for (const x of over.players) x.members = x.members.filter(u => u !== rev.uid);
    const p = over.players[1];
    const before = memberCount(over, p);
    p.members.push(rev.uid);
    expect(memberCount(over, p) - before).toBe(3);
    const { container } = render(<Results state={over} onPlayAgain={() => {}} onHome={() => {}} />);
    expect(container.querySelector(`[data-members="${p.id}"]`).textContent).toBe(`${memberCount(over, p)} members`);
    // the cult cell's hover names the same count
    fireEvent.click(container.querySelector(`[data-cult="${p.id}"] [aria-label]`));
    const pop = [...document.querySelectorAll('.pop-card')].map(e => e.textContent).join(' ');
    expect(pop).toMatch(new RegExp(`their ${memberCount(over, p)} members`));
    expect(pop).not.toMatch(new RegExp(`their ${p.members.length} members`));
  });

  it('who picks first says why in words: a member, named as one', () => {
    const { ends } = play(5);
    const info = structuredClone(ends[0]);
    const first = info.after.order[0];
    const fr = Object.values(info.after.cards).find(c => cardDef(info.after, c.uid).key === 'frontrunner');
    expect(fr).toBeTruthy();
    info.after.players[first].members.push(fr.uid);
    const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
    expect(container.querySelector('[data-first-pick]').textContent).toMatch(/picks? first: (they|you) have Front-runner, a member who always picks first/);
    expect(container.querySelector('[data-round-news]').textContent).toMatch(/middle ring opens/);
  });

  it('the next round\'s turn order is said once as the snake it is, in names, "You" for the viewer (Cory\'s todo)', () => {
    const { ends } = play(5);
    for (const info of ends.filter(e => !e.after.over)) {
      const o = info.after.order.slice(0, 3), nm = id => info.after.players[id].name;
      const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
      expect(container.querySelector('[data-snake-order]').textContent).toBe(`Snake order: ${[...o, ...[...o].reverse()].map(nm).join(', ')} …`);
      cleanup();
      const me = o[2];
      const { container: c2 } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} meId={me} />);
      // the last of the first pass places twice in a row, at the turn: "You, You"
      expect(c2.querySelector('[data-snake-order]').textContent).toBe(`Snake order: ${nm(o[0])}, ${nm(o[1])}, You, You, ${nm(o[1])}, ${nm(o[0])} …`);
      cleanup();
    }
    // nothing to say once the game is over
    const last = ends[ends.length - 1];
    expect(last.after.over).toBe(true);
    const { container } = render(<RoundEnd info={last} onNext={() => {}} autoMs={0} />);
    expect(container.querySelector('[data-snake-order]')).toBeNull();
  });

  it('"bought" is the engine\'s count, the results\' number, never re-read from the log (round 3 skeptic: +5 for 4)', () => {
    const { ends } = play(5);
    const info = structuredClone(ends[1]);
    const at = info.board || info.after;
    const p = at.players.find(x => x.bought - info.start.players[x.id].bought > 0) || at.players[0];
    const eb = at.players[p.id].bought - info.start.players[p.id].bought;
    at.log.push(`${p.name} bought 1 follower (2 gold).`); // a line the engine's count doesn't hold
    const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
    const cell = container.querySelector(`[data-this-round="${p.id}"]`).textContent;
    if (eb) expect(cell).toMatch(new RegExp(`\\+${eb} bought`));
    else expect(cell).not.toMatch(/bought/);
  });

  it('a rule that counts a resource says so; one that counts members or sets keeps its words', () => {
    expect(ruleWords('purple', 'Most purple members')).toBe('Most purple members');
    expect(ruleWords('silver', 'Most silver')).toBe('Most silver resources');
    expect(ruleWords('trading', 'Most white members')).toBe('Most white members');
    expect(ruleWords('red', 'Most members')).toBe('Most members');
    expect(ruleWords('thieves', 'Most magenta members')).toBe('Most magenta members');
    expect(ruleWords('yellow', 'Most full sets')).toBe('Most full sets');
  });
});
