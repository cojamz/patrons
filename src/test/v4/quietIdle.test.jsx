// The idle table's CSS loops stay off the main thread only while no node listens for 'animationiteration'
// (src/v4/quietIdle.js): React's root and portal listeners must skip that one event and keep every other.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { act } from 'react';
import { muteIterationEvents } from '../../v4/quietIdle.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('muteIterationEvents', () => {
  afterEach(() => vi.restoreAllMocks());

  it('React registers no animationiteration listener on a muted root or portal target, and keeps the rest', async () => {
    const seen = [];
    const real = EventTarget.prototype.addEventListener;
    vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function (type, ...rest) {
      seen.push([this, type]);
      return real.call(this, type, ...rest);
    });
    const host = document.createElement('div');
    const portalTo = document.createElement('div');
    document.body.append(host, portalTo);
    muteIterationEvents(portalTo);
    const ends = [];
    const root = createRoot(muteIterationEvents(host));
    await act(async () => {
      root.render(<>
        <i data-k="a" onAnimationEnd={() => ends.push('root')} />
        {createPortal(<i data-k="b" onAnimationEnd={() => ends.push('portal')} />, portalTo)}
      </>);
    });
    const types = t => seen.filter(([el]) => el === t).map(([, ty]) => ty);
    for (const t of [host, portalTo]) {
      expect(types(t)).toContain('animationend');
      expect(types(t)).toContain('animationstart');
      expect(types(t)).toContain('click');
      expect(types(t)).not.toContain('animationiteration');
    }
    // the other animation events still reach React handlers
    host.querySelector('[data-k="a"]').dispatchEvent(new Event('animationend', { bubbles: true }));
    portalTo.querySelector('[data-k="b"]').dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(ends).toEqual(['root', 'portal']);
    await act(async () => root.unmount());
    host.remove(); portalTo.remove();
    // without the mute React does listen for it (so the check above is not vacuous)
    const plain = document.createElement('div');
    const r2 = createRoot(plain);
    expect(types(plain).some(t => /animationiteration/i.test(t))).toBe(true);
    r2.unmount();
  });

  it('is idempotent and leaves other targets alone', () => {
    const a = document.createElement('div');
    expect(muteIterationEvents(muteIterationEvents(a))).toBe(a);
    const b = document.createElement('div');
    expect(Object.prototype.hasOwnProperty.call(b, 'addEventListener')).toBe(false);
  });
});
