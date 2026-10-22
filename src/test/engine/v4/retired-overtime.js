// Overtime left the board on 2026-10-15 (Rush Hour took its space), but the cut extra-turn members (Foreman, Courier,
// Apprentice, Overseer, Corner-Cutter) and Bookkeeper's last-minion rule are still tested with its one extra turn.
// Call at the top of a test file: Purple carries Overtime as a 7th action for that file's tests only.
import { beforeAll, afterAll } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { RETIRED_OVERTIME, RETIRED_ROLLCALL } from '../../../engine/v4/content/purple.js';

export function useRetiredOvertime() {
  beforeAll(() => { quadrant('purple').actions.push(RETIRED_OVERTIME); });
  afterAll(() => { const a = quadrant('purple').actions; const i = a.indexOf(RETIRED_OVERTIME); if (i >= 0) a.splice(i, 1); });
}

// Roll Call left the board on 2026-10-22 (Right Away took its space). Tests that took it as a plain purple space keep
// it in that same space for that file's tests only, so the board's spaces and their places don't change.
export function useRetiredRollCall() {
  let i = -1, was;
  beforeAll(() => { const a = quadrant('purple').actions; i = a.findIndex(x => x.key === 'again'); was = a[i]; a[i] = RETIRED_ROLLCALL; });
  afterAll(() => { if (i >= 0) quadrant('purple').actions[i] = was; });
}
