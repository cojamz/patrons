// Previews on screen never stall: the cards a hovered space would unlock brighten when the space's dry run lands (the shop
// subscribes to the preview store), and a preview worker that fails or goes silent hands its work to the main thread
// (never an endless "You'd get: …").
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { createHover, whyLine, raceAfter, SpaceCard } from '../../../v4/game/HoverCards.jsx';
import { YoudGet, requestPreviews, peekPreview, _setPreviewWorker, previewWords, cachedPreview, youdWords } from '../../../v4/game/Info.jsx';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { tickScene } from '../../../../e2e/v4/lib/tick-save.mjs';

afterEach(() => { cleanup(); vi.useRealTimers(); _setPreviewWorker(null); });
const scene = (() => { for (let k = 4; k < 24; k++) { const sc = tickScene(k); if (sc) return sc; } return null; })();
const fresh = () => ({ ...scene.state }); // a new state object: nothing cached for it yet

describe('previews reach the screen', () => {
  // Cory, 2026-10-15 ("hovers feel laggy"): a hover lands complete in one frame. It used to ask for the dry run and
  // brighten the cards when it landed a moment later; a miss is now worked out at once, in the hover's own render
  it('the card a hovered space unlocks brightens in the same frame as the hover, even with nothing cached (no badge over its portrait: w2a #37)', () => {
    expect(scene).not.toBeNull();
    vi.useFakeTimers();
    const s = fresh();
    expect(peekPreview(s, 0, ...scene.key.split('-').map(Number))).toBeUndefined(); // nothing cached for this table
    const hover = createHover();
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} hover={hover} />);
    const el = document.createElement('div');
    act(() => { hover.onSpaceHover(scene.key, el); });
    expect(peekPreview(s, 0, ...scene.key.split('-').map(Number))).toBeTruthy(); // worked out at once, no timer ran
    const lit = [...container.querySelectorAll('.lt-card[data-after]')];
    expect(lit.map(c => Number(c.dataset.uid))).toEqual(expect.arrayContaining(scene.uids));
    expect(lit.every(c => !c.classList.contains('dim'))).toBe(true);
    expect(container.querySelectorAll('.lt-card .tick').length).toBe(0); // brightened, never badged
    hover.dispose();
  });

  it("a space's hover card is whole on its first render: its \"You'd get\" is never a placeholder that fills in later (Cory: hovers feel laggy)", () => {
    const fake = { postMessage() {}, terminate() {} }; // a worker that would answer late (never, here)
    _setPreviewWorker(fake);
    const s = fresh();
    const { container } = render(<SpaceCard state={s} me={0} spaceKey={scene.key} />);
    expect(container.querySelector('.youd-get.pending')).toBeNull();
    expect(container.querySelector('[data-youd-get]').getAttribute('data-youd-get')).not.toBe('');
  });

  it("a worker that errors (its file 404s after a deploy) hands the dry run to the main thread", () => {
    vi.useFakeTimers();
    const fake = { postMessage() {}, terminate() {} };
    _setPreviewWorker(fake);
    const s = fresh();
    const [q, i] = scene.key.split('-').map(Number);
    const { container } = render(<YoudGet state={s} pid={0} q={q} i={i} />);
    expect(container.textContent).toMatch(/You’d get: …/);
    act(() => { fake.onerror(new Event('error')); vi.advanceTimersByTime(50); });
    expect(container.querySelector('[data-youd-get]').textContent).not.toMatch(/…$/);
    expect(peekPreview(s, 0, q, i)).toBeTruthy();
  });

  it('a worker that never answers is given up on, and the preview still arrives', () => {
    vi.useFakeTimers();
    const fake = { postMessage() {}, terminate: vi.fn() };
    _setPreviewWorker(fake);
    const s = fresh();
    const [q, i] = scene.key.split('-').map(Number);
    requestPreviews(s, 0, [scene.key]);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(peekPreview(s, 0, q, i)).toBeUndefined(); // still waiting: a slow worker isn't duplicated at once
    act(() => { vi.advanceTimersByTime(4500); });
    expect(fake.terminate).toHaveBeenCalled();
    expect(peekPreview(s, 0, q, i)).toBeTruthy();
  });

  it('the Why line names each member once: a choice\'s branches repeated it (Snap Up: "Gardener … · Gardener … · Gardener …")', () => {
    expect(whyLine(['Gardener: +1 blue, +1 yellow', 'Gardener: +1 green, +1 yellow', 'Planner: next member costs 2 less']))
      .toBe('Gardener: depends on your pick · Planner: next member costs 2 less');
    expect(whyLine(['Underdog: no ×2', 'Underdog: no ×2'])).toBe('Underdog: no ×2');
  });

  it('the rivals line prints only what is sure: no "−1 to 0" per color, even when no pick of yours decides it (w3b: Lie Low)', () => {
    const z = [0, 0];
    const st = { resources: ['gold', 'red', 'blue', 'green'], players: [{}, {}, {}, {}] };
    const pv = { you: { res: { gold: [2, 2], red: z, blue: z, green: z }, followers: z, members: z, turns: z }, others: { res: { gold: [-1, 0], red: [-1, 0], blue: [-1, 0], green: z }, followers: z, members: z }, asks: [], theirAsks: [], exact: true, partial: false };
    expect(previewWords(pv, st).others).toBeNull();
    const gift = { ...pv, others: { res: { gold: [1, 1], red: z, blue: z, green: z }, followers: z, members: z } };
    expect(previewWords(gift, st).others).toBe('rivals +1 gold in all');
  });

  it('a contest line never reads a pick off its first branch: Kickback\'s +1 goes to the one you pick (w3b #10), in plain words (w3a #28)', () => {
    const T = ['gold', 'red', 'market', 'echo'];
    const q = T.indexOf('gold'), i = quadrant('gold').actions.findIndex(a => a.key === 'jv');
    const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
    let s = createGame({ seats, seed: 4, quadrants: T });
    const rand = seededRandom(4);
    const ready = st => st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === `slot:${q}-${i}`);
    for (let n = 0; n < 400 && !ready(s); n++) s = applyMove(s, chooseBotMove(s, rand));
    expect(ready(s)).toBe(true);
    const pv = cachedPreview(s, 0, q, i);
    const r = raceAfter(s, pv.race, 'gold', 0, true);
    expect(r.you).toMatch(new RegExp(`^You’d have ${s.players[0].res.gold + 3}\\b`));
    // every rival at what they hold now (the gift isn't theirs yet), and the gift said once
    for (const o of s.players.slice(1)) expect(r.them.some(t => t.text === `${o.name} has ${o.res.gold}`)).toBe(true);
    expect(r.tail).toBe(', and +1 goes to the one you pick');
    expect([r.you, ...r.them.map(t => t.text), r.tail].join(' ')).not.toMatch(/·/);
  });

  it('a forecast never promises what only your best pick gives, and a swap is never "nothing" (w4 skeptic #10, A#35)', () => {
    const st = { resources: ['gold', 'red', 'blue', 'green'], players: [{}, {}, {}, {}], cards: {} };
    const z = [0, 0];
    const res = (red, f = 0, m = 0) => ({ res: { gold: 0, red, blue: 0, green: 0 }, followers: f, members: m, turns: 0, discount: 0, swapped: 1, joined: [] });
    // Even Swap: +1 red sure; a follower only if you swap for a member worth more
    const even = { exact: false, tied: false, partial: false, asks: ['x'], theirAsks: [], you: { res: { gold: z, red: [1, 1], blue: z, green: z }, followers: [0, 1], members: z, turns: z, discount: z },
      others: { res: { gold: z, red: z, blue: z, green: z }, followers: [-1, 0], members: z }, best: res(1, 1), likely: res(1, 1) };
    expect(youdWords(even, st).text).toBe('+1 red, up to +1 follower, 1 member swapped');
    // Swap Sides: the counts don't move, but a member does
    const sides = { exact: true, tied: true, partial: false, asks: ['x'], theirAsks: [], you: { res: { gold: z, red: z, blue: z, green: z }, followers: z, members: z, turns: z, discount: z },
      others: { res: { gold: z, red: z, blue: z, green: z }, followers: z, members: z }, best: res(0), likely: res(0) };
    expect(youdWords(sides, st).text).toBe('1 member swapped');
  });
});
