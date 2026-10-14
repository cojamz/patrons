// A recruited card visibly travels from the shop to its new owner's strip.
// The shop snapshots its cards' markup after each render; when a card leaves the shop for a player, a ghost
// copy flies from that card's shop cell to the player's strip and fades as it lands.
import { reducedMotion } from './Tick.jsx';

export function snapshotShop(root) {
  const snap = new Map();
  if (!root) return snap;
  root.querySelectorAll('.shop .card[data-uid]').forEach((el, index) => snap.set(Number(el.dataset.uid), { html: el.outerHTML, index }));
  return snap;
}

export function flyCards(root, snap, moves) {
  if (!root || reducedMotion() || typeof document === 'undefined' || !document.body.animate) return;
  const cells = [...root.querySelectorAll('.shop .card[data-uid]')];
  for (const { uid, to } of moves) {
    const s = snap.get(uid);
    const cell = s && (cells[s.index] || cells[cells.length - 1]);
    const target = root.querySelector(`.pl[data-pid="${to}"] .chips`) || root.querySelector(`.pl[data-pid="${to}"]`);
    if (!s || !cell || !target) continue;
    const a = cell.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) continue;
    const ghost = document.createElement('div');
    ghost.className = 'flight';
    ghost.innerHTML = s.html;
    Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px,${dy * 0.55}px) scale(.7)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px,${dy}px) scale(.25)`, opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)' });
    const done = () => ghost.remove();
    anim.onfinish = done;
    anim.oncancel = done;
    setTimeout(done, 800);
  }
}
