// RC1 saboteur panel (triage item 19): a choice's buttons say what a click really does. "Take all 3 from P3" when P3
// holds 1 took 1; the Collect Debts tally reset on a reload; Social Climber read "Gold", "Red", "+2 blue", "+2 green".
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ChoicePrompt } from '../../../v4/game/parts.jsx';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { take, move } from '../../engine/v4/helpers.js';

afterEach(cleanup);
const CLASSIC = ['gold', 'red', 'market', 'echo'];
const show = s => render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />).container;

describe('choice labels say what happens', () => {
  it('Collect Debts: no "Take all 3" button for a rival holding only 1', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 3, round: 2, res: [{}, { gold: 1 }, {}] });
    s = take(s, 'gold.steal');
    const c = show(s);
    expect([...c.querySelectorAll('.take-all')].map(b => b.textContent)).toEqual([]);
    expect(c.textContent).not.toMatch(/Take all 3/);
  });
  it('Collect Debts: a lone rival holding 2 of 3 reads "Take 2 from P2 (all they have)"', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 3, round: 2, res: [{}, { gold: 2 }, {}] });
    s = take(s, 'gold.steal');
    expect([...show(s).querySelectorAll('.take-all')].map(b => b.textContent)).toEqual(['Take 2 from P2 (all they have)']);
  });
  it('Collect Debts: the tally survives a save and load ("1 of 3 taken")', () => {
    let s = sceneQ({ quadrants: CLASSIC, n: 3, round: 2, res: [{}, { gold: 1 }, { gold: 5 }] });
    s = take(s, 'gold.steal');
    s = move(s, 'player:2');
    const loaded = JSON.parse(JSON.stringify(s));
    expect(show(loaded).querySelector('.tally').textContent).toMatch(/^1 of 3 taken/);
  });
  // the engine's "+2 gold" reads as the plate writes it (Cory: dots, not color words): "+2" and the gold dot, titled
  it('color picks show the engine’s amount and its color as a dot ("+2●", never a bare "Gold" or the word)', () => {
    const s = sceneQ({ quadrants: CLASSIC });
    s.pending = { player: 0, kind: 'choose', prompt: 'Social Climber: +2 of which color?', options: s.resources.map(c => ({ id: `color:${c}`, label: `+2 ${c}`, kind: 'color', value: c })) };
    const btns = [...show(s).querySelectorAll('.opts button')];
    expect(btns.map(b => b.textContent.trim())).toEqual(['+2', '+2', '+2', '+2']);
    expect(btns.map(b => b.querySelector('.pip').getAttribute('title'))).toEqual(['2 gold', '2 red', '2 blue', '2 green']);
  });
});
