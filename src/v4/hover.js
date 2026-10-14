// A hover is real only from a mouse on a device that can hover. Touch browsers send a synthetic "mouse" enter at
// the last tap point (iOS sticky hover; Chrome's compat events after a layout change, e.g. right after Start), which
// once popped a space card over the wheel on phones. So: never on a hover-less device, and never just after a touch.
let lastTouch = -1e9;
if (typeof window !== 'undefined' && window.addEventListener) {
  const mark = e => { if (e.pointerType !== 'mouse') lastTouch = Date.now(); };
  window.addEventListener('pointerdown', mark, { capture: true, passive: true });
  window.addEventListener('pointerup', mark, { capture: true, passive: true });
  window.addEventListener('touchstart', () => { lastTouch = Date.now(); }, { capture: true, passive: true });
}
const hoverless = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
export const realHover = e => !!e && e.pointerType === 'mouse' && !hoverless() && Date.now() - lastTouch > 1000;
