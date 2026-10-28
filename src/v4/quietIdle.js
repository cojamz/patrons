// Keep the idle table cheap: React 18 listens at its root (and at every portal target, here document.body) for every
// event type it knows, 'animationiteration' included, though nothing in the game uses onAnimationIteration. Once any
// node listens for that event, Chromium wakes the main thread at each iteration of every running CSS animation to fire
// it, and each wake restyles every animated element. The seats' idle loops (members breathing, minions bobbing,
// leaders scheming: one animation each, ~60 by round III) then cost 20-30% of a 4x-throttled CPU while the table just
// waits; without the listener they run on the compositor and cost ~1% (design/eval/perf/idle-after.md).
// So these targets ignore registrations for that one event. Must run before React mounts or renders a portal.
const DROP = new Set(['animationiteration', 'webkitAnimationIteration']);

export function muteIterationEvents(target) {
  if (!target || target.__quietIdle) return target;
  const add = target.addEventListener;
  Object.defineProperty(target, 'addEventListener', {
    configurable: true,
    writable: true,
    value(type, ...rest) { return DROP.has(type) ? undefined : add.call(this, type, ...rest); },
  });
  Object.defineProperty(target, '__quietIdle', { value: true });
  return target;
}
