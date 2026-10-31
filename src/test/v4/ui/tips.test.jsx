// A keyword inside an option (a choice button, a card) never eats the option's click: tapping "round start" in an
// option's text picks the option. The keyword still explains itself (its title: the definition). A keyword in plain
// text opens its definition on click, as before.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { CardText } from '../../../v4/game/Info.jsx';

afterEach(cleanup);

describe('keywords inside controls', () => {
  it('a click on a keyword inside an option button picks the option', () => {
    const pick = vi.fn();
    const { container } = render(<button type="button" data-option="card:7" onClick={pick}><CardText text="Now and at round start, +1 red per 2 members." /></button>);
    const t = container.querySelector('.term');
    expect(t).not.toBeNull();
    act(() => { fireEvent.click(t); });
    expect(pick).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-tip-body]')).toBeNull();
    expect(t.getAttribute('role')).toBeNull();
    expect(t.querySelector('.hitbox')).toBeNull();
    // its words for a long-press (touch); no native title, which on a desktop would sit on top of its hover card
    expect(t.getAttribute('data-hint')).toMatch(/on recruit: /i);
    expect(t.getAttribute('title')).toBeNull();
  });
  it('in plain text a keyword still opens its definition on click', () => {
    const { container } = render(<p><CardText text="Now and at round start, +1 red per 2 members." /></p>);
    const t = container.querySelector('.term');
    act(() => { fireEvent.click(t); });
    expect(document.querySelector('[data-tip-body]')).not.toBeNull();
    expect(document.querySelector('[data-tip-body]').classList.contains('passive')).toBe(false); // pinned definitions remain interactive
    expect(t.getAttribute('role')).toBe('button');
  });
});
