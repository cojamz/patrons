import { it } from 'vitest';
import { render, act } from '@testing-library/react';
import Tick from '../../../../v4/game/Tick.jsx';
it('dbg', async () => {
  const { container, rerender } = render(<Tick value={3} float={false} />);
  console.log('raf?', typeof requestAnimationFrame, typeof matchMedia);
  act(() => { rerender(<Tick value={15} float={false} />); });
  const seen = [];
  for (let k = 0; k < 20; k++) { await act(() => new Promise(r => setTimeout(r, 30))); seen.push(container.querySelector('.tv').textContent + '/' + container.querySelector('.tv').childNodes.length); }
  console.log(seen.join(' '), container.innerHTML.slice(0, 200));
});
