// @vitest-environment jsdom
// The piece pool (eng-audit S3.2): a landed piece goes back to a small pool by its look and the next one that looks the
// same reuses it, with no trace of its last flight; a sweep returns pieces in the air; landings and skips are unchanged.
import { afterEach, beforeEach, expect, it } from 'vitest';
import { flyPath, clearFlights, landAll, motionPending, piecePoolSize, drainPiecePool, PIECE_POOL_CAP } from '../../../v4/game/flight.js';

let made = [];
class FakeEffect { constructor(target, frames) { this.target = target; this.frames = frames; } }
function fakeAnimate(frames, opts) {
  const ev = new EventTarget();
  let resolve;
  const anim = {
    effect: new FakeEffect(this, frames), opts, playState: 'running',
    finished: new Promise(r => { resolve = r; }),
    addEventListener: (...a) => ev.addEventListener(...a),
    finish() { if (this.playState !== 'running') return; this.playState = 'finished'; resolve(this); ev.dispatchEvent(new Event('finish')); },
    cancel() { if (this.playState !== 'running') return; this.playState = 'idle'; ev.dispatchEvent(new Event('cancel')); },
  };
  made.push(anim);
  return anim;
}
const R = (left, top) => ({ left, top, width: 16, height: 16 });
const ghosts = () => document.querySelectorAll('.ghost-layer');

beforeEach(() => { made = []; drainPiecePool(); document.body.innerHTML = ''; Element.prototype.animate = fakeAnimate; document.body.animate = fakeAnimate; });
afterEach(() => { landAll(); clearFlights(0); delete Element.prototype.animate; delete document.body.animate; });

it('a 12-coin stream reuses the pieces of the last one: no new nodes, same paths, nothing left over', () => {
  const html = '<svg viewBox="0 0 8 8"><rect width="8" height="8"/></svg>';
  const first = flyPath(html, 'piece-flight piece-res', R(0, 0), R(200, 100), { path: 'arc', duration: 300, label: '×12', trail: 11, trailGap: 20, full: true, turnTo: '<i class="t"></i>' });
  const nodes = [...ghosts()];
  expect(nodes).toHaveLength(12);
  const frames1 = made.map(a => JSON.stringify(a.effect.frames));
  for (const a of [...made]) a.finish();
  expect(ghosts()).toHaveLength(0);
  expect(piecePoolSize()).toBe(12);
  // the old animations let go of the nodes, and the extras of the last flight are gone
  for (const a of made) expect(a.effect.target).toBe(null);
  expect(first.playState).toBe('finished');
  made = [];
  flyPath(html, 'piece-flight piece-res', R(0, 0), R(200, 100), { path: 'arc', duration: 300, trail: 11, trailGap: 20, full: true });
  const again = [...ghosts()];
  expect(again).toHaveLength(12);
  expect(again.every(n => nodes.includes(n))).toBe(true);
  expect(piecePoolSize()).toBe(0);
  // in the same order (later pieces on top), each fresh: no label, no colour turn, its own place and birth
  for (const n of again) {
    expect(n.querySelector('.bundle-n, .path-turn')).toBe(null);
    expect(n.style.left).toBe('0px');
    expect(n.dataset.born).toBeTruthy();
    expect(n.firstChild.innerHTML).toBe('<svg viewBox="0 0 8 8"><rect width="8" height="8"></rect></svg>');
  }
  // the same path and timing as a fresh flight (the turn and label were the only extras of the first)
  const plain = made.map(a => JSON.stringify(a.effect.frames));
  expect(frames1.filter(f => plain.includes(f)).length).toBeGreaterThan(0);
  expect(made.filter(a => a.effect.target === again[3] || a.effect.target === again[3].firstChild).map(a => a.opts.delay)).toEqual([60, 60]);
});

it('a trail piece keeps its echo look only for its own flight', () => {
  const html = '<i></i>';
  flyPath(html, 'piece-flight piece-fol', R(0, 0), R(50, 0), { trail: 2, trailGap: 30 });
  expect(ghosts()[1].firstChild.style.opacity).toBe('0.6');
  for (const a of [...made]) a.finish();
  flyPath(html, 'piece-flight piece-fol', R(0, 0), R(50, 0), {});
  expect(ghosts()).toHaveLength(1);
  expect(ghosts()[0].firstChild.getAttribute('style')).toBe(null);
});

it('different looks never share a piece', () => {
  flyPath('<i class="a"></i>', 'piece-flight', R(0, 0), R(50, 0), {});
  for (const a of [...made]) a.finish();
  flyPath('<i class="b"></i>', 'piece-flight', R(0, 0), R(50, 0), {});
  flyPath('<i class="a"></i>', 'piece-flight', R(0, 0), R(50, 0), { path: 'line' });
  expect(piecePoolSize()).toBe(1);
  expect(ghosts()[0].querySelector('.b')).toBeTruthy();
  expect(ghosts()[1].className).toContain('path-line');
});

it('a sweep returns pieces in the air to the pool; their landings still come when their flights end', async () => {
  const lead = flyPath('<i></i>', 'piece-flight', R(0, 0), R(50, 0), { trail: 3, full: true });
  expect(ghosts()).toHaveLength(4);
  clearFlights(0);
  expect(ghosts()).toHaveLength(0);
  expect(piecePoolSize()).toBe(4);
  expect(lead.playState).toBe('running');
  expect(motionPending()).toBe(true);
  let landed = false;
  lead.finished.then(() => { landed = true; });
  landAll();
  await Promise.resolve();
  expect(landed).toBe(true);
  expect(motionPending()).toBe(false);
  // a stale event of the swept flight does nothing to the piece's next flight
  flyPath('<i></i>', 'piece-flight', R(0, 0), R(50, 0), {});
  expect(ghosts()).toHaveLength(1);
  lead.cancel(); lead.finish();
  expect(ghosts()).toHaveLength(1);
});

it('a skip lands every piece at once and they all leave the table', () => {
  flyPath('<i></i>', 'piece-flight', R(0, 0), R(50, 0), { trail: 5, full: true, fade: true });
  expect(motionPending()).toBe(true);
  landAll();
  expect(ghosts()).toHaveLength(0);
  expect(motionPending()).toBe(false);
});

it('the pool keeps at most its cap', () => {
  flyPath('<i></i>', 'piece-flight', R(0, 0), R(50, 0), { trail: PIECE_POOL_CAP + 10, full: true });
  for (const a of [...made]) a.finish();
  expect(piecePoolSize()).toBe(PIECE_POOL_CAP);
});
