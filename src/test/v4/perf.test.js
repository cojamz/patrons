// The ?trace=1 tracer (src/v4/perf.js) costs nothing when it's off: no patches, the transport passes through, the
// profiler is just its children. Its statistics helper is what every report's numbers come from.
import { describe, it, expect } from 'vitest';
import { PERF_ON, LAG_MS, perfTransport, PerfProfiler, traceSession, stats } from '../../v4/perf.js';

describe('perf tracer, off by default', () => {
  it('is off without ?trace=1 and adds no lag', () => {
    expect(PERF_ON).toBe(false);
    expect(LAG_MS).toBe(0);
    expect(typeof globalThis.__perf).toBe('undefined');
  });
  it('hands back the very same transport, profiler children and no session watcher', () => {
    const t = { push() {}, subscribe() {} };
    expect(perfTransport(t)).toBe(t);
    const child = { type: 'div' };
    expect(PerfProfiler({ id: 'x', children: child })).toBe(child);
    expect(traceSession({ subscribe: () => () => {} })).toBeUndefined();
  });
  it('summarises a list as n, p50, p95, max and mean', () => {
    expect(stats([])).toEqual({ n: 0, p50: null, p95: null, max: null, mean: null });
    const s = stats([10, 20, 30, 40, 1000]);
    expect(s).toMatchObject({ n: 5, p50: 30, p95: 1000, max: 1000, mean: 220 });
    expect(stats([5, null, NaN, 7]).n).toBe(2);
  });
});
