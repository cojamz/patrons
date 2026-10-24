// One speed setting (decisions.md, 2026-10-15): setup's "Speed: Quick / Steady / Relaxed" is the same setting as the
// ☰ menu's; it sets the bots' pace and the animations. An old save's bot speed (fast / normal / slow) reads the same.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { LocalSetup } from '../../../v4/screens/Screens.jsx';
import { BOT, DEFAULT_SPEED, motionSpeed, setMotionSpeed, speedName } from '../../../v4/motion.js';

afterEach(() => { cleanup(); setMotionSpeed('steady'); });

describe('one speed setting', () => {
  it('setup offers Quick / Steady / Relaxed (no "Bot speed"), and a pick is the menu setting too', () => {
    setMotionSpeed('steady');
    let started = null;
    const { getByRole, queryByText } = render(<LocalSetup onStart={c => { started = c; }} onBack={() => {}} />);
    const group = getByRole('radiogroup', { name: 'Speed' });
    expect([...group.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Quick', 'Steady', 'Relaxed']);
    expect(group.querySelector('[aria-checked="true"]').textContent).toBe('Steady');
    expect(queryByText('Bot speed')).toBeNull();
    fireEvent.click(group.querySelectorAll('button')[2]);
    expect(motionSpeed()).toBe('relaxed');
    fireEvent.click(document.querySelector('[data-start]'));
    expect(started.speed).toBe('relaxed');
  });
  it('the bots keep one pace per speed, old saves included', () => {
    expect(BOT.pace[speedName('normal')]).toBe(BOT.pace.steady);
    expect(BOT.pace.quick).toBeLessThan(BOT.pace.steady);
    expect(BOT.pace.relaxed).toBeGreaterThan(BOT.pace.steady);
    expect(speedName('fast')).toBe('quick');
    expect(speedName('slow')).toBe('relaxed');
    expect(DEFAULT_SPEED).toBe('relaxed');
    expect(speedName('nonsense')).toBe('relaxed');
  });
});
