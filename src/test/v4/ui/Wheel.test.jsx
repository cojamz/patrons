// The wheel never feeds its own layout back into a render loop (React #185, "Maximum update depth exceeded"): a
// frozen build crashed 2 of 5 hot-seat runs when the rim's engraved text was measured after every render and its
// length wobbled by a fraction of a pixel. Here text measures differently on every call, the wheel goes through a
// few game states and both looks, and no render may loop or throw.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import Wheel, { clauses, deniedText } from '../../../v4/game/Wheel.jsx';

const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Wheel', () => {
  it('a wobbling text measure never loops the rim into React #185, in either look', () => {
    // every measurement of every text or element comes back a little different from the last
    let n = 0;
    const wobble = () => 100 + (n++ % 3) * 0.7; // a period that never lines up with the number of rims
    const proto = (typeof SVGElement !== 'undefined' ? SVGElement : Element).prototype;
    const had = 'getComputedTextLength' in proto;
    proto.getComputedTextLength = wobble;
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () { const r = rect.call(this); const w = 452 + (n++ % 2); return { ...r, x: 0, y: 0, left: 0, top: 0, right: w, bottom: w, width: w, height: w, toJSON() {} }; };
    const errors = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a.map(String).join(' ')); });
    try {
      for (const look of ['panels', 'sockets']) {
        let s = createGame({ seats, seed: 7, quadrants: ['red', 'yellow', 'market', 'thieves'] });
        const rand = seededRandom(7);
        const props = st => ({ state: st, legal: new Map(), onPick: () => {}, flash: new Set(), facing: 0, onFacing: () => {}, look });
        const view = render(<Wheel {...props(s)} />);
        for (let step = 0; step < 6; step++) {
          for (let k = 0; k < 5 && !s.over; k++) s = applyMove(s, chooseBotMove(s, rand));
          act(() => { view.rerender(<Wheel {...props(s)} />); });
        }
        expect(view.container.querySelectorAll('[data-rim-text]').length).toBe(4);
        view.unmount();
      }
    } finally {
      Element.prototype.getBoundingClientRect = rect;
      if (!had) delete proto.getComputedTextLength;
    }
    expect(errors.filter(e => /Maximum update depth|#185|getSnapshot should be cached/.test(e))).toEqual([]);
  });

  it('prints each tiebreak on its rim, compactly, with the full sentence in the rim label', () => {
    const s = createGame({ seats, seed: 3, quadrants: ['red', 'yellow', 'market', 'gold'] });
    const { container } = render(<Wheel state={s} legal={new Map()} onPick={() => {}} flash={new Set()} facing={0} onFacing={() => {}} />);
    const rim = q => container.querySelector(`[data-plaque="${q}"]`).textContent;
    expect(rim('red')).toMatch(/ties: red/);
    expect(rim('yellow')).toMatch(/ties: yellow/);
    expect(rim('market')).not.toMatch(/ties:/); // Blue scores most blue, no tiebreak (Cory dropped badged, 2026-10-15)
    expect(rim('gold')).not.toMatch(/ties/);
    // the full sentence is in the rim's label (and its hover card), no native <title>: that tooltip sat on top of the
    // hover card, saying it twice (design pod, 2026-10-15)
    expect(container.querySelector('[data-rim="red"]').getAttribute('aria-label')).toMatch(/Red members break ties\./);
    expect(container.querySelector('[data-rim="red"] title')).toBeNull();
  });

  it('says why a space can’t be taken, and splits a yield into short clauses', () => {
    const s = createGame({ seats, seed: 3 });
    s.round = 1; s.slots = { '0-0': 1 };
    expect(deniedText(s, '0-0', 0)).toBe('Taken by P2');
    expect(deniedText(s, '0-0', 1)).toBe('Taken by you');
    const ring2 = s.quadrants.map((qid, q) => q).flatMap(q => [3, 4, 5].map(i => `${q}-${i}`)).find(k => deniedText(s, k) === 'Opens in round II');
    expect(ring2).toBeTruthy();
    expect(deniedText(s, '0-1', 0)).toBe(null);
    expect(clauses('+2 green +1 blue')).toEqual(['+2 green', '+1 blue']);
    expect(clauses('+3 gold · gift 1')).toEqual(['+3 gold', 'gift 1']);
    expect(clauses('+1 gold/member')).toEqual(['+1 gold', '/member']);
  });

  // Online, a placement waits for "Place here" on its card (no Undo online). A choice answered on a space (a copy's
  // target) has no such button: its click used to only pin the card, so it did nothing, and the online e2e circled the
  // lit spaces until it timed out (quiet-w3-44e22bd: Sleepwalker's "copy which of your spaces"). It picks at once now,
  // and the space stays lit as chosen while the move crosses to the host, until the table moves on.
  it('online: a placement waits for its confirm; a space picked for a choice goes at once and stays lit until the table moves', () => {
    for (const look of ['panels', 'sockets']) {
      const s = createGame({ seats, seed: 3 });
      s.round = 1;
      const picks = [];
      const props = (st, legal) => ({ state: st, legal, onPick: id => picks.push(id), flash: new Set(), facing: 0, onFacing: () => {}, confirmPlace: true, look });
      const place = render(<Wheel {...props(s, new Map([['0-0', 'slot:0-0']]))} />);
      fireEvent.click(place.container.querySelector('[data-slot="0-0"]'));
      expect(picks).toEqual([]); // the card's confirm sends it
      expect(place.container.querySelector('[data-slot="0-0"]').classList.contains('sel')).toBe(true);
      place.unmount();

      const legal = new Map([['0-1', 'space:now:0-1'], ['0-2', 'space:now:0-2']]);
      const pick = render(<Wheel {...props(s, legal)} />);
      fireEvent.click(pick.container.querySelector('[data-slot="0-1"]'));
      expect(picks).toEqual(['space:now:0-1']);
      const lit = () => [...pick.container.querySelectorAll('[data-slot].sel')].map(e => e.getAttribute('data-slot'));
      expect(lit()).toEqual(['0-1']);
      if (look === 'panels') expect(pick.container.querySelector('[data-cell="0-1"]').classList.contains('sel')).toBe(true);
      // the move lands: a new table, nothing lit as chosen
      act(() => { pick.rerender(<Wheel {...props({ ...s, moves: (s.moves || 0) + 1 }, new Map())} />); });
      expect(lit()).toEqual([]);
      pick.unmount();
      picks.length = 0;
    }
  });
});
