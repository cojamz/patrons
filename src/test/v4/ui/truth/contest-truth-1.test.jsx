// 200 seeded mixed-table games in four parallel files of 50 (see contest-truth.jsx): games 50–99.
import { describe, it } from 'vitest';
import { checkContestTruth } from './contest-truth.jsx';

describe('scoring truth on screen', () => {
  it('round-end cards and standings show the engine\'s winners and counts (games 50–99)', () => { checkContestTruth(50, 50); });
});
