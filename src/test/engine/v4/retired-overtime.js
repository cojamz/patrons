// Overtime left the board on 2026-10-15 (Rush Hour took its space), but the cut extra-turn members (Foreman, Courier,
// Apprentice, Overseer, Corner-Cutter) and Bookkeeper's last-minion rule are still tested with its one extra turn.
// Call at the top of a test file: Purple carries Overtime as a 7th action for that file's tests only.
import { beforeAll, afterAll } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { RETIRED_OVERTIME } from '../../../engine/v4/content/purple.js';

export function useRetiredOvertime() {
  beforeAll(() => { quadrant('purple').actions.push(RETIRED_OVERTIME); });
  afterAll(() => { const a = quadrant('purple').actions; const i = a.indexOf(RETIRED_OVERTIME); if (i >= 0) a.splice(i, 1); });
}
