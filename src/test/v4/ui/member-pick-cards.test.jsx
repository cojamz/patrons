import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createGame, cardDef } from '../../../engine/v4/index.js';
import ShopCards, { SORT_KEY, VIEW_KEY } from '../../../v4/game/ShopCards.jsx';
import { RuleText } from '../../../v4/game/Info.jsx';

afterEach(() => { cleanup(); localStorage.removeItem(SORT_KEY); localStorage.removeItem(VIEW_KEY); });
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];
const table = () => createGame({ seats, seed: 31 });

describe('member choice readability', () => {
  it('puts the full ability on each card during a member choice and keeps the engine option clickable', () => {
    const base = table();
    const options = base.shop.slice(0, 3).map(uid => ({ id: `take:${uid}`, kind: 'card', value: uid, target: { uid } }));
    const state = { ...base, pending: { kind: 'choose', player: 0, prompt: 'Hand-pick: take a member', options } };
    const onPick = vi.fn();
    const optionFor = key => options.find(o => key === `card:${o.value}`);
    const { container, rerender } = render(<ShopCards state={state} me={0} mySeats={[0]} optionFor={optionFor} onPick={onPick} />);
    expect(container.querySelector('[data-member-pick]')).not.toBeNull();
    expect(container.querySelectorAll('.lt-pick-ability')).toHaveLength(state.shop.length);
    for (const uid of state.shop) {
      const el = container.querySelector(`[data-uid="${uid}"]`);
      expect(el.querySelector('.lt-pick-ability').textContent.length).toBeGreaterThan(0);
      expect(el.getAttribute('data-hint')).toContain(cardDef(state, uid).text);
    }
    fireEvent.click(container.querySelector(`[data-option="${options[0].id}"]`));
    expect(onPick).toHaveBeenCalledWith(options[0].id);
    rerender(<ShopCards state={{ ...state, pending: { ...state.pending, kind: 'buy' } }} me={0} mySeats={[0]} optionFor={optionFor} onPick={onPick} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
    expect(container.querySelector('.lt-pick-ability')).toBeNull();
  });

  it('does not expand the shop for a choice elsewhere on the board or another player', () => {
    const base = table();
    const state = { ...base, pending: { kind: 'choose', player: 0, options: [{ id: 'color:red', kind: 'resource', value: 'red' }] } };
    const { container, rerender } = render(<ShopCards state={state} me={0} mySeats={[0]} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
    rerender(<ShopCards state={state} me={1} mySeats={[1]} optionFor={() => ({ id: 'irrelevant' })} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
  });

  it('lets the reader override automatic details during a member choice without changing the legal pick', () => {
    const base = table();
    const options = base.shop.slice(0, 3).map(uid => ({ id: `take:${uid}`, kind: 'card', value: uid, target: { uid } }));
    const state = { ...base, pending: { kind: 'choose', player: 0, options } };
    const onPick = vi.fn(), onViewChange = vi.fn();
    const optionFor = key => options.find(o => key === `card:${o.value}`);
    const props = { state, me: 0, mySeats: [0], optionFor, onPick, onViewChange };
    const { container, getByRole, rerender, unmount } = render(<ShopCards {...props} />);
    const toggle = getByRole('button', { name: 'Show member abilities' });
    expect(toggle.disabled).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggle);
    expect(container.querySelector('[data-view="compact"]')).not.toBeNull();
    expect(localStorage.getItem(VIEW_KEY)).toBe('compact');
    expect(onViewChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(container.querySelector(`[data-option="${options[0].id}"]`));
    expect(onPick).toHaveBeenCalledExactlyOnceWith(options[0].id);
    // Resolving one choice, then entering another, must not override that explicit choice.
    rerender(<ShopCards {...props} state={{ ...state, pending: { kind: 'buy', player: 0, options: [] } }} />);
    rerender(<ShopCards {...props} state={{ ...state, pending: { ...state.pending, options: [...options] } }} />);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    unmount();
    const again = render(<ShopCards {...props} />);
    expect(again.container.querySelector('[data-view="compact"]')).not.toBeNull();
  });
});


describe('shop reading controls', () => {
  it.each([
    ['rival turn', { kind: 'place', player: 1, options: [] }, 'rival'],
    ['payment', { kind: 'pay', player: 0, options: [] }, 'pay'],
    ['animation', { kind: 'buy', player: 0, options: [] }, 'animating'],
  ])('keeps details reversible during %s without taking a game action', (_label, pending, phase) => {
    const base = table(), onPick = vi.fn();
    const { container, getByRole } = render(<ShopCards state={{ ...base, pending }} me={0} mySeats={[0]} phase={phase} onPick={onPick} />);
    const toggle = getByRole('button', { name: 'Show member abilities' });
    expect(toggle.disabled).toBe(false);
    fireEvent.click(toggle);
    expect(container.querySelector('[data-view="details"]')).not.toBeNull();
    expect(localStorage.getItem(VIEW_KEY)).toBe('details');
    fireEvent.click(toggle);
    expect(container.querySelector('[data-view="compact"]')).not.toBeNull();
    expect(localStorage.getItem(VIEW_KEY)).toBe('compact');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('switches sort order with either half of one click target and remembers detailed cards', () => {
    const base = table();
    const props = { state: base, me: 0, mySeats: [0] };
    const { container, getByRole, unmount } = render(<ShopCards {...props} />);
    const sort = getByRole('switch', { name: 'Group members by color' });
    expect(sort.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sort.querySelector('span'));
    expect(sort.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sort.querySelector('span:last-child'));
    expect(sort.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(getByRole('button', { name: 'Show member abilities' }));
    expect(container.querySelectorAll('.lt-pick-ability')).toHaveLength(base.shop.length);
    expect(localStorage.getItem(VIEW_KEY)).toBe('details');
    unmount();
    const again = render(<ShopCards {...props} />);
    expect(again.container.querySelector('[data-view="details"]')).not.toBeNull();
  });

  it('does not repeat an expanded ability in a mouse hover and still recruits on a deliberate click', () => {
    localStorage.setItem(VIEW_KEY, 'details');
    const base = table();
    const onCardHover = vi.fn(), onPick = vi.fn();
    const options = base.shop.map(uid => ({ id: `card:${uid}`, kind: 'card', uid }));
    const state = { ...base, pending: { kind: 'buy', player: 0, options } };
    const { container } = render(<ShopCards state={state} me={0} mySeats={[0]} optionFor={key => options.find(o => o.id === key)} onPick={onPick} hover={{ onCardHover, subscribe: () => () => {}, space: null }} />);
    const card = container.querySelector('.lt-card[data-uid]');
    fireEvent.pointerEnter(card, { pointerType: 'mouse' });
    expect(onCardHover).not.toHaveBeenCalled();
    fireEvent.click(card);
    expect(onPick).toHaveBeenCalledWith(card.dataset.option);
  });

  it('prints a rule that grows by round by round in the details view (I +1 · II +2 · III +3), this round lit', () => {
    localStorage.setItem(VIEW_KEY, 'details');
    const base = table();
    const cards = { ...base.cards };
    let uid = Object.keys(cards).map(Number).find(u => cards[u].def === 'yellow.chefs' && !base.players.some(p => p.members.includes(u)));
    if (uid == null) { uid = Math.max(...Object.keys(cards).map(Number)) + 1; cards[uid] = { uid, def: 'yellow.chefs' }; }
    const state = { ...base, round: 2, cards, shop: [uid, ...base.shop.filter(u => u !== uid).slice(0, 6)] };
    const { container } = render(<ShopCards state={state} me={0} mySeats={[0]} />);
    const ability = container.querySelector(`.lt-card[data-uid="${uid}"] .lt-pick-ability`);
    const lines = [...ability.querySelectorAll('[data-round-line]')];
    // compact on the small card: the rounds side by side, the shared words once
    expect(lines.map(l => l.textContent.replace(/[\s·]+/g, ' ').trim())).toEqual(['I +1', 'II +2', 'III +3']);
    expect(ability.textContent.replace(/\s+/g, ' ')).toContain('III +3 of each color');
    expect(lines.filter(l => l.getAttribute('aria-current') === 'true').map(l => l.dataset.roundLine)).toEqual(['2']);
    expect(ability.textContent).not.toContain('per round number');
    // a rule with no round lines still reads as its sentence
    const plain = container.querySelector(`.lt-card[data-uid="${state.shop[1]}"] .lt-pick-ability`);
    if (!cardDef(state, state.shop[1]).byRound) expect(plain.querySelector('[data-round-line]')).toBeNull();
    expect(plain.textContent.length).toBeGreaterThan(0);
  });

  it('keeps one line per round when the rounds differ past their number, even on a small card', () => {
    // differing only in their number (a plural is the same word): one run, the last round's words once
    const same = render(<RuleText def={{ text: 'x', byRound: { lines: ['+1 follower', '+2 followers', '+3 followers'] } }} round={3} plain compact />);
    expect(same.container.querySelector('.by-round.compact')).not.toBeNull();
    expect(same.container.textContent.replace(/[\s·]+/g, ' ').trim()).toBe('I +1 II +2 III +3 followers');
    same.unmount();
    // the number isn't first ("Steal 1 resource."): a line per round
    const steal = render(<RuleText def={{ text: 'x', byRound: { lines: ['Steal 1 resource.', 'Steal 2 resources.', 'Steal 3 resources.'] } }} round={1} plain compact />);
    expect(steal.container.querySelector('.by-round.compact')).toBeNull();
    steal.unmount();
    const differ = { text: 'x', byRound: { lines: ['+3 silver. Each rival +1 silver.', '+6 silver. Each rival +2 silver.', '+9 silver. Each rival +3 silver.'] } };
    const { container } = render(<RuleText def={differ} round={2} plain compact />);
    expect(container.querySelector('.by-round.compact')).toBeNull();
    expect([...container.querySelectorAll('[data-round-line]')].map(l => l.getAttribute('aria-current'))).toEqual([null, 'true', null]);
  });
});
