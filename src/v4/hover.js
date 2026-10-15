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
// A hover opens only when the pointer moved onto something. A card dealt (or a dialog closing) under a resting pointer
// sends an enter with no movement behind it: that's the table moving, not the player (motion review #25).
let lastMove = -1e9, mx = null, my = null;
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.clientX !== mx || e.clientY !== my) { mx = e.clientX; my = e.clientY; lastMove = Date.now(); }
  }, { capture: true, passive: true });
}
const hoverless = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
// A real arrival's enter comes before the move that carries it, at the new position; an enter the table caused (a card
// dealt under a resting pointer) comes at the position the pointer already rested at.
export const realHover = e => !!e && e.pointerType === 'mouse' && !hoverless() && Date.now() - lastTouch > 1000
  && (e.clientX !== mx || e.clientY !== my || Date.now() - lastMove < 60 || mx === null);
