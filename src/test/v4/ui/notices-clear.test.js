import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Notices on the table go away by themselves (Cory, live: "The middle ring opened this round" lingered, Oct 27; "the
// notification about swapping members wont go away", Oct 28). Every status line on the game screen either fades
// (data-brief, with a fade rule in the CSS) or is listed here with what clears it. A new notice fails until it's one
// or the other.
const GAME = join(__dirname, '../../../v4/game');
const CLEARED = {
  'className={`turn-card': 'folds after it has held (TurnCard life)',
  'className={`say ${note.tone}': 'setNote clears on a timer',
  'className="toast"': 'showToast clears on a timer',
  'stolen.filter(': 'setStolen removes each note on a timer',
  'className="caption"': 'the wheel clears its caption on a timer',
  'className="deny-note"': 'the wheel clears its deny note on a timer',
  'className="pay-nudge"': 'lives only inside the open pay sheet',
  'className="pay-receipt"': 'lives only inside the open pay sheet',
  'className="ld-loose"': 'lives only inside the open rearrange card',
};

describe('notices clear by themselves', () => {
  const lines = readdirSync(GAME).filter(f => f.endsWith('.jsx')).flatMap(f =>
    readFileSync(join(GAME, f), 'utf8').split('\n').filter(l => l.includes('role="status"')).map(l => ({ f, l })));
  const css = readdirSync(GAME).filter(f => f.endsWith('.css')).map(f => readFileSync(join(GAME, f), 'utf8')).join('\n');

  it('every status line fades or has a known clear', () => {
    const stuck = lines.filter(({ l }) => !l.includes('data-brief') && !Object.keys(CLEARED).some(k => l.includes(k)));
    expect(stuck.map(({ f, l }) => `${f}: ${l.trim().slice(0, 120)}`)).toEqual([]);
  });

  it('every fading notice has a fade rule', () => {
    for (const { l } of lines.filter(x => x.l.includes('data-brief'))) {
      const cls = l.match(/className="([\w-]+)/)[1];
      expect(css, `${cls} has data-brief but no fade`).toMatch(new RegExp(`\\.${cls}\\[data-brief\\]\\{animation:brief-out`));
    }
  });
});
