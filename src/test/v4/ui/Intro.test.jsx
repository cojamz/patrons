// The intro: shows once per browser on a new game, Skip closes it, the flag sticks (and storage failures don't
// break it), Esc/tap only work after the first beat, replay always works, reduced motion gets a still storyboard.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import Intro, { IntroGate, introOnGameStart, replayIntro, introSeen } from '../../../v4/Intro.jsx';

const FLAG = 'patrons.v4.introSeen';
const dialog = () => document.querySelector('[data-intro]');
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
    expect(screen.getByText(/You lead a little/)).toBeTruthy();
    expect(document.querySelectorAll('.intro-dots i')).toHaveLength(7);
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

  it('plays its seven beats on its own, then waits on Begin', () => {
    const onClose = vi.fn();
    render(<Intro onClose={onClose} still={false} />);
    expect(dialog().dataset.beat).toBe('1');
    act(() => vi.advanceTimersByTime(3000));
    expect(dialog().dataset.beat).toBe('2');
    expect(screen.getByText(/minion/)).toBeTruthy();
    for (let i = 0; i < 8; i++) act(() => vi.advanceTimersByTime(3200)); // each beat's clock starts as it shows
    expect(dialog().dataset.beat).toBe('7');
    expect(screen.getByText(/after round III wins/)).toBeTruthy();
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
    act(() => vi.advanceTimersByTime(2700)); // beat 2
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
    for (let i = 2; i <= 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(dialog().dataset.beat).toBe(String(i));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(dialog().dataset.beat).toBe('6');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    // a tap on the storyboard itself does nothing (only the buttons act)
    fireEvent.click(dialog());
    expect(onClose).not.toHaveBeenCalled();
    // counts show their final values at once
    expect(document.querySelector('.in-mine').textContent).toBe('16');
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
