// App flow: Home → Play on this device → setup → game, with the real local session.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../../v4/App.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => { localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0); }); // seed 0: the human picks first, so this flow test never waits for a bot

describe('v4 app', () => {
  it('goes from Home through local setup into a game', async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
    // turn P3 and P4 off: 2 seats
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[2]);
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[3]);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    // two chairs at the table hold a cult; the other two stay empty
    expect(container.querySelectorAll('.lt-seat[data-pid]')).toHaveLength(2);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(/starting resource/i);
    await waitFor(() => expect(container.querySelectorAll('[data-option^="color:"]')).toHaveLength(2), { timeout: 10000 });
  });

  it('needs at least 2 seats to start', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
    for (const b of screen.getAllByRole('radio', { name: 'Empty' }).slice(1)) fireEvent.click(b);
    expect(screen.getByRole('button', { name: 'Start' }).disabled).toBe(true);
  });
});
