// You are "You" (meta round 2): your own lines in the Chronicle, the round summary and the results never use your
// seat's name; the verb right after agrees ("You have"), and other players' names are untouched.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { asYou } from '../../../v4/game/Info.jsx';
import Chronicle from '../../../v4/game/Chronicle.jsx';
import Results from '../../../v4/game/Results.jsx';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const word = name => new RegExp(`(^|[^\\p{L}\\p{N}])${name}(?![\\p{L}\\p{N}])`, 'u');

describe('asYou', () => {
  it('rewrites your name, your possessive and the verb after it; leaves others alone', () => {
    expect(asYou('Ana took Rush (Gold).', 'Ana')).toBe('You took Rush (Gold).');
    expect(asYou("Ana's Banker: +1 gold.", 'Ana')).toBe('Your Banker: +1 gold.');
    expect(asYou('Bo stole 2 gold from Ana.', 'Ana')).toBe('Bo stole 2 gold from you.');
    expect(asYou('Ana has no minions left.', 'Ana')).toBe('You have no minions left.');
    expect(asYou('Bo gives 1 red to Ana; Ana gets 2.', 'Ana')).toBe('Bo gives 1 red to you; you get 2.');
    expect(asYou('Anabel took Rush.', 'Ana')).toBe('Anabel took Rush.');
    expect(asYou('Bo took Rush.', 'Ana')).toBe('Bo took Rush.');
  });
});

describe('your own seat reads "You"', () => {
  const finish = seed => {
    const rand = seededRandom(seed);
    let s = createGame({ seats, seed });
    for (let k = 0; k < 3000 && !s.over; k++) s = applyMove(s, chooseBotMove(s, rand));
    return s;
  };
  it('in the Chronicle', () => {
    const s = finish(7);
    const { container } = render(<Chronicle state={s} meId={0} onClose={() => {}} />);
    const text = container.querySelector('.lt-chron').textContent;
    expect(text).not.toMatch(word('Ana'));
    expect(text).toMatch(/\bYou (took|recruited|bought|passed|placed|joined|picked)\b/);
    expect(text).toMatch(word('Bo'));
  });
  it('in the results', () => {
    const s = finish(8);
    const { container } = render(<Results state={s} meId={0} onPlayAgain={() => {}} onHome={() => {}} />);
    const text = container.querySelector('.results').textContent;
    expect(text).not.toMatch(word('Ana'));
    expect(container.querySelector('.res-t').textContent).toMatch(/You/);
  });
});
