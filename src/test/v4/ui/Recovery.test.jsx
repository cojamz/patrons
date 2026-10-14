// Saves never crash-loop: an older-version or unreadable save is never resumed (not even by a reload mid-game), the
// player is told to start fresh with the game record still copyable, and a crash anywhere shows a recovery screen
// instead of a blank page.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import App from '../../../v4/App.jsx';
import { Recovered } from '../../../v4/Recovery.jsx';
import { newGame, step, reportProblem } from '../../../v4/session/record.js';
import { saveLocal, loadLocal, staleSave } from '../../../v4/saved.js';
import { chooseBotMove } from '../../../engine/v4/index.js';

const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];
const config = { seats, speed: 'normal' };
/** A game a few moves in, saved the way the app saves it, as if the tab was mid-game when it reloaded. */
function savedMidGame(mutate = st => st) {
  let st = newGame({ seats, seed: 12 });
  for (let i = 0; i < 6; i++) st = step(st, chooseBotMove(st));
  st = mutate(st);
  saveLocal(config, st);
  sessionStorage.setItem('patrons.v4.inGame', '1');
  return st;
}
let clip;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  clip = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: clip }, configurable: true });
});
afterEach(cleanup);

describe('stale saves', () => {
  it('a save from older rules content is not resumed, even by a reload mid-game; the player is told to start fresh', async () => {
    const st = savedMidGame(s => ({ ...s, build: { ...s.build, content: 'olderContent' } }));
    const { container } = render(<App />);
    expect(container.querySelector('.app.game')).toBe(null); // no auto-resume
    expect(screen.queryByRole('button', { name: /Resume game/ })).toBe(null);
    expect(screen.getByRole('button', { name: 'Play on this device' })).toBeTruthy();
    const note = container.querySelector('[data-notice="stale"]');
    expect(note.textContent).toMatch(/saved on an older version.*Start a fresh game/);
    // the old game's record is still there to copy
    fireEvent.click(screen.getByRole('button', { name: 'Copy game record' }));
    await waitFor(() => expect(clip).toHaveBeenCalled());
    const rec = JSON.parse(clip.mock.calls[0][0]);
    expect(rec).toMatchObject({ kind: 'patrons.v4.record', seed: 12, moves: st.history });
    expect(rec.state.moves).toBe(st.moves);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(container.querySelector('[data-notice]')).toBe(null);
    cleanup();
    render(<App />); // shown once
    expect(document.querySelector('[data-notice]')).toBe(null);
  });

  it('a save naming a card this build no longer has opens the home screen (no crash, no loop)', () => {
    savedMidGame(s => { const t = structuredClone(s); t.cards[Object.keys(t.cards)[0]].def = 'gold.killedCard'; return t; });
    const { container } = render(<App />);
    expect(container.querySelector('.app.game')).toBe(null);
    expect(screen.getByRole('button', { name: 'Play on this device' })).toBeTruthy();
    expect(container.querySelector('[data-notice="stale"]').textContent).toMatch(/couldn’t be opened/);
    expect(loadLocal()).toBe(null);
    expect(staleSave().reason).toBe('broken');
  });

  it('a save from this build still resumes straight into the game after a reload', () => {
    savedMidGame();
    const { container } = render(<App />);
    expect(container.querySelector('.app.game')).toBeTruthy();
    expect(container.querySelector('[data-notice]')).toBe(null);
  });
});

describe('crash recovery screen', () => {
  let boom;
  function Bomb() {
    if (boom) throw new Error('render exploded');
    return <p>fine again</p>;
  }
  // React (dev) rethrows the caught render error through window 'error'; keep jsdom from printing it as noise
  const quiet = e => e.preventDefault();
  beforeEach(() => { boom = true; vi.spyOn(console, 'error').mockImplementation(() => {}); window.addEventListener('error', quiet); });
  afterEach(() => { vi.restoreAllMocks(); window.removeEventListener('error', quiet); });

  it('a crash shows a plain recovery screen (not a blank page) and stops the reload loop', async () => {
    savedMidGame();
    render(<Recovered><Bomb /></Recovered>);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('render exploded')).toBeTruthy();
    expect(sessionStorage.getItem('patrons.v4.inGame')).toBe(null); // a reload won't auto-resume into it
    // start a new game: the save is set aside (record kept) and the app comes back, fresh
    boom = false;
    fireEvent.click(screen.getByRole('button', { name: 'Start a new game' }));
    expect(screen.getByText('fine again')).toBeTruthy();
    expect(loadLocal()).toBe(null);
    expect(staleSave()).toMatchObject({ reason: 'crash', message: 'render exploded' });
  });

  it('the recovery screen copies a record of the game on screen, with the error', async () => {
    // a real game on screen first, so the session has tracked its state
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[2]);
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[3]);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(container.querySelector('.app.game')).toBeTruthy();
    cleanup();
    render(<Recovered><Bomb /></Recovered>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy game record' }));
    await waitFor(() => expect(clip).toHaveBeenCalled());
    const rec = JSON.parse(clip.mock.calls[0][0]);
    expect(rec.kind).toBe('patrons.v4.record');
    expect(Array.isArray(rec.moves)).toBe(true);
    expect(rec.seats.map(s => s.name)).toEqual(['P1', 'P2']);
    expect(rec.error.message).toBe('render exploded');
  });
});

describe('problem notices', () => {
  it('a reported bot problem shows as a small notice that doesn’t block play, and can be dismissed', () => {
    const { container } = render(<App />);
    act(() => { reportProblem({ kind: 'bot', seat: 1, message: 'Bo hit a bug, so it made a plain move instead.' }); });
    const n = container.querySelector('[data-notice="bot"]');
    expect(n.getAttribute('role')).toBe('status'); // not a dialog
    expect(n.textContent).toMatch(/hit a bug/);
    expect(screen.getByRole('button', { name: 'Play on this device' })).toBeTruthy(); // the page under it still works
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(container.querySelector('[data-notice]')).toBe(null);
  });
});
