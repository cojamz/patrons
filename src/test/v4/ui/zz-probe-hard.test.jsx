import { it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../../v4/App.jsx';
it('probe', () => {
  localStorage.clear();
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Play on this device' }));
  fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[2]);
  fireEvent.click(screen.getAllByRole('radio', { name: 'Empty' })[3]);
  fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  console.log('PROBE recovery:', !!container.querySelector('[data-recovery]'), 'game:', !!container.querySelector('.app.game'), 'pl:', container.querySelectorAll('.pl').length, 'seat-ish:', container.querySelectorAll('[data-pid]').length);
});
