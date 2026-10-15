// Previews on screen never stall: the shop's "✓ after <space>" tick appears when the space's dry run lands (the shop
// subscribes to the preview store), and a preview worker that fails or goes silent hands its work to the main thread
// (never an endless "You'd get: …").
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { createHover } from '../../../v4/game/HoverCards.jsx';
import { YoudGet, requestPreviews, peekPreview, _setPreviewWorker } from '../../../v4/game/Info.jsx';
import { tickScene } from '../../../../e2e/v4/lib/tick-save.mjs';

afterEach(() => { cleanup(); vi.useRealTimers(); _setPreviewWorker(null); });
const scene = (() => { for (let k = 4; k < 24; k++) { const sc = tickScene(k); if (sc) return sc; } return null; })();
const fresh = () => ({ ...scene.state }); // a new state object: nothing cached for it yet

describe('previews reach the screen', () => {
  it('the shop ticks the card a hovered space unlocks once the preview lands', () => {
    expect(scene).not.toBeNull();
    vi.useFakeTimers();
    const s = fresh();
    const hover = createHover();
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} hover={hover} />);
    const el = document.createElement('div');
    act(() => { hover.onSpaceHover(scene.key, el); });
    expect(peekPreview(s, 0, ...scene.key.split('-').map(Number))).toBeUndefined(); // not there yet: asked for, not computed
    expect(container.querySelectorAll('.lt-card .tick').length).toBe(0);
    act(() => { vi.advanceTimersByTime(50); });
    const ticked = [...container.querySelectorAll('.lt-card')].filter(c => c.querySelector('.tick')).map(c => Number(c.dataset.uid));
    expect(ticked).toEqual(expect.arrayContaining(scene.uids));
    expect(container.querySelector('.lt-card .tick').textContent).toMatch(/^after /); // words, no ✓ (design pod)
    hover.dispose();
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
});
