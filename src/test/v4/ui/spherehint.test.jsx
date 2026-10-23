// A sphere's setup hint says its round I spaces in words: the follower mark reads "follower" after a 1 and
// "followers" otherwise (plain-words pass: Sob Story read "+1 per rival with more follower"). The table's chips open
// that card like any hover in the game (w4b #24: a native title showed nothing).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { sphereHint, LocalSetup } from '../../../v4/screens/Screens.jsx';

afterEach(cleanup);

describe('setup sphere hints', () => {
  it('pluralise the follower mark where the words are plural', () => {
    const t = sphereHint('trading');
    expect(t).toMatch(/into followers/);
    expect(t).toMatch(/\+1 follower and/);
    expect(t).not.toMatch(/@f|more follower\b/);
  });

  it('a table chip opens what its sphere does', async () => {
    render(<LocalSetup onStart={() => {}} onBack={() => {}} />);
    const chip = document.querySelector('.table-chip');
    expect(chip).not.toBeNull();
    expect(chip.getAttribute('title')).toBeNull();
    fireEvent.click(chip);
    await act(() => new Promise(r => setTimeout(r, 120)));
    const card = document.querySelector('[data-chip-card]');
    expect(card).not.toBeNull();
    expect(card.textContent).toMatch(/at round end\. *Its round I spaces: /);
  });
});
