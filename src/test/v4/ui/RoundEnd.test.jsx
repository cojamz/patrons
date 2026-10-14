// Round end is a moment: the table holds on a scoring card until it's dismissed, then catches up.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { createLocalSession } from '../../../v4/session/local.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(cleanup);

describe('round end card', () => {
  it('appears when a round ends, lists each quadrant, and holds the table until dismissed', async () => {
    const session = createLocalSession({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed: 4, botDelayMs: 1 });
    // a viewer with no seats of their own: the card would auto-advance after 4s, so it must be visible before then
    const { container } = render(<GameScreen session={session} pace={0} />);
    const dlg = await waitFor(() => screen.getByRole('dialog', { name: /Round I scoring/ }), { timeout: 20000 });
    expect(within(dlg).getAllByRole('listitem')).toHaveLength(4);
    const held = session.getState().moves;
    // behind the card the board stays as it was scored: round I, workers still on their spaces
    expect(container.querySelector('header .round').textContent).toMatch(/Round I\b/);
    expect(container.querySelectorAll('.slot .worker').length).toBeGreaterThan(0);
    fireEvent.click(within(dlg).getByRole('button', { name: /Start round II/ }));
    expect(screen.queryByRole('dialog', { name: /Round I scoring/ })).toBeNull();
    await waitFor(() => expect(container.querySelector('header .round').textContent).toMatch(/Round II/));
    session.destroy();
    expect(held).toBeGreaterThan(0);
  }, 30000);
});
