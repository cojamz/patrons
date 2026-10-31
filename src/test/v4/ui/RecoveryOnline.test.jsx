// A crash during an online game must not strand the table. "Start a new game" remounted the app but left the socket
// open, so the player still read as connected and the host was never offered "let a bot play for them". Online, the
// recovery screen offers Rejoin (a reload: a fresh connection, the same seat) and Leave (a reload without the seat,
// so the old connection closes and the seat reads as gone).
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Recovered } from '../../../v4/Recovery.jsx';

function Boom() { throw new Error('kaboom'); }
const SEAT = { code: 'ABCDE', playerId: 'p123', transport: 'firebase' };

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('recovery in an online game', () => {
  it('offers Rejoin (a reload that keeps the seat) instead of "Start a new game"', () => {
    sessionStorage.setItem('patrons.v4.online', JSON.stringify(SEAT));
    const reload = vi.fn();
    render(<Recovered reload={reload}><Boom /></Recovered>);
    expect(screen.queryByRole('button', { name: 'Start a new game' })).toBe(null);
    fireEvent.click(screen.getByRole('button', { name: 'Rejoin the game' }));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem('patrons.v4.online'))).toEqual(SEAT); // the reload rejoins this seat
  });

  it('Leave forgets the seat and reloads, so the old connection closes and the host can hand the seat to a bot', () => {
    sessionStorage.setItem('patrons.v4.online', JSON.stringify(SEAT));
    const reload = vi.fn();
    render(<Recovered reload={reload}><Boom /></Recovered>);
    fireEvent.click(screen.getByRole('button', { name: 'Leave this game' }));
    expect(sessionStorage.getItem('patrons.v4.online')).toBe(null);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('a local game still offers "Start a new game"', () => {
    render(<Recovered reload={vi.fn()}><Boom /></Recovered>);
    expect(screen.getByRole('button', { name: 'Start a new game' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rejoin the game' })).toBe(null);
  });
});
