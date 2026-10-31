import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { createGame } from '../../../engine/v4/index.js';
import Reckoning from '../../../v4/game/Reckoning.jsx';
import { scoredStandings } from '../../../v4/format.js';
import { MO } from '../../../v4/motion.js';
const chain = vi.hoisted(() => ({ running: false, end: null }));
vi.mock('../../../v4/game/director.js', () => ({
  chainRunning: () => chain.running,
  onChainEnd: cb => { chain.end = cb; return () => { chain.end = null; }; },
  onChainLanded: cb => { chain.landed = cb; return () => { chain.landed = null; }; },
}));
vi.mock('../../../v4/game/flight.js', async importOriginal => ({ ...(await importOriginal()), motionOK: () => true }));
vi.mock('../../../v4/format.js', async importOriginal => ({
  ...(await importOriginal()),
  scoredStandings: vi.fn(() => [{ qid: 'gold', rule: 'Most gold', prize: 2,
    rows: [{ id: 0, shown: 1 }, { id: 1, shown: 0 }], leaders: [0] }]),
}));
function info() {
  const s = createGame({ seats: [{ name: 'Ana' }, { name: 'Bo' }], seed: 4 });
  return { after: s, board: s, result: { round: 'I', rows: [{ qid: 'gold', winners: [0], v: 2 }] } };
}
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); chain.running = false; chain.end = null; });
describe('scoring enters directly', () => {
  it('shows the first competition immediately, with its round cue and no pre-screen', () => {
    vi.useFakeTimers();
    const { container } = render(<Reckoning info={info()} root={null} onDone={() => {}} />);
    expect(container.textContent).toContain('Round I scoring');
    expect(container.textContent).toContain('Most gold');
    expect(container.textContent).not.toMatch(/Round I ends/);
    expect(container.querySelector('.waiting')).toBe(null);
  });
  it('waits only for the active action chain, then starts without a fixed lead-in', () => {
    vi.useFakeTimers(); chain.running = true;
    const { container } = render(<Reckoning info={info()} root={null} onDone={() => {}} />);
    expect(container.querySelector('.waiting')).not.toBe(null);
    expect(container.textContent).not.toContain('Most gold');
    // A long Relaxed sequence remains authoritative; elapsed time never bypasses it.
    act(() => { vi.advanceTimersByTime(12000); });
    expect(container.querySelector('.waiting')).not.toBe(null);
    expect(container.textContent).not.toContain('Most gold');
    act(() => { chain.running = false; chain.end(); });
    expect(container.querySelector('.waiting')).toBe(null);
    expect(container.textContent).toContain('Most gold');
  });
  it('starts at the last landing, and on a table gone quiet when a later show took over the end (v0.9.807 hang)', () => {
    vi.useFakeTimers(); chain.running = true;
    const a = render(<Reckoning info={info()} root={null} onDone={() => {}} />);
    act(() => { chain.running = false; chain.landed(); });
    expect(a.container.textContent).toContain('Most gold');
    cleanup(); chain.running = true;
    const b = render(<Reckoning info={info()} root={null} onDone={() => {}} />);
    act(() => { chain.running = false; vi.advanceTimersByTime(600); }); // no end, no landing: the old show was adopted
    expect(b.container.textContent).toContain('Most gold');
  });
  it('finishes when the final count roll completes, without a trailing 400ms hold or recounts', () => {
    vi.useFakeTimers(); const onDone = vi.fn();
    render(<Reckoning info={info()} root={null} onDone={onDone} />);
    const end = MO.reckonStagger + MO.reckonTick + MO.hop + MO.roll + MO.reckonRest;
    act(() => { vi.advanceTimersByTime(end); });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(scoredStandings).toHaveBeenCalledTimes(1);
  });
});
