// The intro (Cory's four-beat script): shows once per browser on a new game, Skip closes it, the flag sticks (and
// storage failures don't break it), Esc/tap only work after the first beat, replay always works, reduced motion gets
// a still storyboard, and the line's box never changes height between beats.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import Intro, { IntroGate, introOnGameStart, replayIntro, introSeen } from '../../../v4/Intro.jsx';

const FLAG = 'patrons.v4.introSeen';
const dialog = () => document.querySelector('[data-intro]');
const line = () => document.querySelector('.intro-line.now').textContent;
const LINES = [
  'You are a cult leader.',
  'You and your minions have learned to tap into mysterious powers to gain influence and followers.',
  'Take actions granted by the mysterious powers to add to your resources, recruit new members, and become more powerful.',
  'After three rounds, the cult with the most followers (including members!) wins!',
];
const media = reduce => vi.stubGlobal('matchMedia', q => ({ matches: reduce && /reduced-motion/.test(q), media: q, addEventListener() {}, removeEventListener() {} }));

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('intro', () => {
  it('shows on the first game start, Skip closes it, and it never shows on a later start', () => {
    render(<IntroGate />);
    expect(dialog()).toBe(null);
    act(() => introOnGameStart());
    expect(dialog()).toBeTruthy();
    expect(screen.getByRole('dialog', { name: /Cults in twenty seconds/ })).toBeTruthy();
    expect(line()).toBe(LINES[0]);
    expect(document.querySelectorAll('.intro-dots i')).toHaveLength(4);
    expect(localStorage.getItem(FLAG)).toBe('1');
    expect(introSeen()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
    act(() => vi.advanceTimersByTime(300));
    expect(dialog()).toBe(null);
    act(() => introOnGameStart());
    expect(dialog()).toBe(null);
    // the menu's "Replay intro" shows it again
    act(() => replayIntro());
    expect(dialog()).toBeTruthy();
  });

  it('plays its four beats on its own, in Cory\'s words, each line held at least 3.5 s, then waits on Begin', () => {
    const onClose = vi.fn();
    render(<Intro onClose={onClose} still={false} />);
    expect(dialog().dataset.beat).toBe('1');
    expect(line()).toBe(LINES[0]);
    const starts = [0]; // when each beat showed (ms)
    for (let t = 100; t <= 30000 && starts.length < 4; t += 100) {
      act(() => vi.advanceTimersByTime(100));
      const b = Number(dialog().dataset.beat);
      if (b > starts.length) { starts.push(t); expect(b).toBe(starts.length); expect(line()).toBe(LINES[b - 1]); }
    }
    expect(starts).toHaveLength(4);
    for (let i = 1; i < 4; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(3500); // each line held ≥ 3.5 s
    expect(starts[3]).toBeGreaterThan(12000); // ~20–25 s in all: beats 1–3, then the last plays and waits
    expect(starts[3]).toBeLessThan(20000);
    act(() => vi.advanceTimersByTime(30000));
    expect(dialog().dataset.beat).toBe('4');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc and a tap anywhere close it only after the first beat', () => {
    const onClose = vi.fn();
    render(<Intro onClose={onClose} still={false} />);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.click(dialog());
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3600)); // beat 2
    expect(dialog().dataset.beat).toBe('2');
    fireEvent.click(dialog());
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
    const onClose2 = vi.fn();
    render(<Intro onClose={onClose2} still={false} />);
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(dialog().dataset.beat).toBe('2');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(300));
    expect(onClose2).toHaveBeenCalledTimes(1);
  });

  it('keys go to the intro, not to the table underneath', () => {
    const under = vi.fn();
    addEventListener('keydown', under);
    render(<Intro onClose={() => {}} still={false} />);
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Skip intro' }), { key: 'a' });
    removeEventListener('keydown', under);
    expect(under).not.toHaveBeenCalled();
  });

  it('with reduced motion it is a still storyboard: no clock, Next and Back, Begin at the end', () => {
    media(true);
    const onClose = vi.fn();
    render(<Intro onClose={onClose} />);
    expect(dialog().dataset.intro).toBe('still');
    act(() => vi.advanceTimersByTime(30000));
    expect(dialog().dataset.beat).toBe('1');
    expect(screen.getByRole('button', { name: 'Back' }).disabled).toBe(true);
    expect(line()).toBe(LINES[0]);
    // each still shows its beat at rest: one scene, nothing scheduled
    expect(document.querySelectorAll('.intro-scene')).toHaveLength(1);
    expect(document.querySelector('[data-scene="1"] [data-pose="scheme"]')).toBeTruthy(); // the scheming look, held
    for (let i = 2; i <= 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(dialog().dataset.beat).toBe(String(i));
      expect(line()).toBe(LINES[i - 1]);
      expect(document.querySelectorAll('.intro-scene')).toHaveLength(1);
      expect(document.querySelector(`[data-scene="${i}"]`)).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(dialog().dataset.beat).toBe('3');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    // a tap on the storyboard itself does nothing (only the buttons act)
    fireEvent.click(dialog());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocked storage: it still shows once per page load, and never throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    render(<IntroGate />);
    act(() => introOnGameStart()); // shows unless this page load already showed it
    if (dialog()) { fireEvent.click(screen.getByRole('button', { name: 'Skip intro' })); act(() => vi.advanceTimersByTime(300)); }
    act(() => introOnGameStart());
    expect(dialog()).toBe(null);
    act(() => replayIntro());
    expect(dialog()).toBeTruthy();
  });

  it('the line sits in a box as tall as the longest line, so nothing jumps between beats', () => {
    render(<Intro onClose={() => {}} still={false} />);
    const lines = [...document.querySelectorAll('.intro-lines .intro-line')];
    expect(lines.map(l => l.textContent)).toEqual(LINES); // every line is in the box, one shown
    expect(lines.filter(l => l.classList.contains('now'))).toHaveLength(1);
    expect(lines.filter(l => !l.classList.contains('now')).every(l => l.getAttribute('aria-hidden') === 'true')).toBe(true);
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect([...document.querySelectorAll('.intro-lines .intro-line')].map(l => l.textContent)).toEqual(LINES);
  });

  it('?intro=0 never shows it on a game start; ?intro=1 always does', () => {
    render(<IntroGate />);
    history.replaceState(null, '', '/?intro=0');
    localStorage.clear();
    act(() => introOnGameStart());
    expect(dialog()).toBe(null);
    history.replaceState(null, '', '/?intro=1');
    act(() => introOnGameStart());
    expect(dialog()).toBeTruthy();
    history.replaceState(null, '', '/');
  });
});
