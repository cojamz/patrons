// The app root catches a crash in the game screen: a plain recovery screen instead of a blank page, and no reload loop
// (the tab forgets it was mid-game, and "Start a new game" sets the save aside with its record kept).
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../../v4/App.jsx';
import { newGame } from '../../../v4/session/record.js';
import { saveLocal, loadLocal, staleSave } from '../../../v4/saved.js';

// the game screen blows up on render, as a content bug would
vi.mock('../../../v4/game/GameScreen.jsx', () => ({ default: () => { throw new Error('GameScreen exploded'); } }));

const quiet = e => e.preventDefault(); // React (dev) rethrows caught render errors through window 'error'
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', quiet);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.removeEventListener('error', quiet); });

describe('crash at the app root', () => {
  it('a reload mid-game that crashes shows the recovery screen once, then never auto-resumes into it again', () => {
    const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];
    saveLocal({ seats, speed: 'normal' }, newGame({ seats, seed: 6 }));
    sessionStorage.setItem('patrons.v4.inGame', '1'); // the tab was in this game when it reloaded
    render(<App />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('GameScreen exploded')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy game record' })).toBeTruthy();
    expect(sessionStorage.getItem('patrons.v4.inGame')).toBe(null);
    // a reload now lands on home with Resume still there (it may have been a one-off), not in a crash loop
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: /Resume game/ })).toBeTruthy();
    // resuming crashes again; "Start a new game" sets the save aside and brings the home screen back
    fireEvent.click(screen.getByRole('button', { name: /Resume game/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Start a new game' }));
    expect(screen.getByRole('button', { name: 'Play on this device' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Resume game/ })).toBe(null);
    expect(loadLocal()).toBe(null);
    expect(staleSave()).toMatchObject({ reason: 'crash', message: 'GameScreen exploded' });
  });
});
