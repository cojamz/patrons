// Cory, 2026-10-15: "once doppelganger has copied, it doesnt need the extra text anymore". A Doppelganger that has
// copied reads as the copy alone ("Copy of Broker: …"), in the seat list and on its hover card.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { defById } from '../../../engine/v4/index.js';
import { table, uidIn } from '../../engine/v4/cards-helpers-b.js';
import { memberRows } from '../../../v4/game/memberUse.js';
import { memberTimingWords } from '../../../v4/game/memberTiming.js';
import { MemberCard } from '../../../v4/game/Info.jsx';

afterEach(cleanup);

describe('a Doppelganger that has copied shows only the copy', () => {
  const s = table(['gold', 'echo', 'trading', 'silver'], { members: [['echo.doppel', 'trading.broker']], res: [{}, {}] });
  const uid = uidIn(s, 'echo.doppel', 0);
  s.cards[uid].copy = 'trading.broker';
  const broker = defById('trading.broker');
  const own = defById('echo.doppel').text;

  it('seat list: "Copy of Broker: <Broker’s text>", without its recruit text', () => {
    const row = memberRows(s, 0, 0).find(r => r.uids.includes(uid));
    expect(row.text).toBe(`Copy of Broker: ${broker.text}`);
    expect(row.text).not.toContain(own);
    expect(row.text).not.toMatch(/becomes a copy/);
  });

  it('hover card: Broker’s sentence, and "Copy of Broker"', () => {
    const { container } = render(<MemberCard state={s} uid={uid} me={0} />);
    const text = container.textContent;
    expect(container.querySelector('.mc-text').textContent).toContain(broker.text.replace(/\s+/g, ' ').slice(0, 20));
    expect(text).not.toMatch(/becomes a copy/);
    expect(container.querySelector('[data-copy-of]').textContent).toBe('Copy of Broker');
  });

  it('before it copies, it still reads its own rule', () => {
    const t = table(['gold', 'echo', 'trading', 'silver'], { members: [['echo.doppel']], res: [{}, {}] });
    const u = uidIn(t, 'echo.doppel', 0);
    expect(memberRows(t, 0, 0).find(r => r.uids.includes(u)).text).toBe(memberTimingWords(own));
  });
});
