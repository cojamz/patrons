// App flow: Home → Play on this device → setup → game, with the real local session.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../../v4/App.jsx';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

describe('v4 app', () => {
  it('goes from Home through local setup into a game', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
    // turn P3 and P4 off: 2 seats
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[2]);
    fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[3]);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(container.querySelectorAll('.pl')).toHaveLength(2);
    expect(container.querySelector('[data-prompt]').textContent).toMatch(/starting resource/i);
    expect(container.querySelectorAll('.prompt [data-option]')).toHaveLength(4);
  });

  it('needs at least 2 seats to start', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
    for (const b of screen.getAllByRole('radio', { name: 'Empty' }).slice(1)) fireEvent.click(b);
    expect(screen.getByRole('button', { name: 'Start' }).disabled).toBe(true);
  });
});
