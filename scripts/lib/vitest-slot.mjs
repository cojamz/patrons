// vitest globalSetup (vitest.config.js): a whole-suite `vitest run` started outside check:v4 (no filter, or a
// directory such as src/test/engine/v4) takes a check slot, 1 unit like a quick check, and waits its turn with an ETA.
// Before this, agents' bare `npx vitest run src/test/...` runs (six at once at 03:33 on 2026-10-15) were invisible to
// the slots and loaded the box more than the gates did. A run of named files never waits; neither does watch mode,
// a run inside check:v4 (it holds its own slot: V4_IN_CHECK) or V4_NO_SLOT=1. The slot is released when vitest exits.
import { existsSync, statSync } from 'node:fs';

export default async function vitestSlot() {
  const argv = process.argv.slice(2);
  if (process.env.V4_IN_CHECK || process.env.V4_NO_SLOT || !argv.includes('run')) return;
  const filters = argv.slice(argv.indexOf('run') + 1).filter(a => !a.startsWith('-') && !/^\d+$/.test(a));
  const isDir = a => { try { return existsSync(a) && statSync(a).isDirectory(); } catch { return false; } };
  if (filters.length && !filters.some(isDir)) return; // named files (or name filters): a targeted run
  const { acquireSlot } = await import('./slots.mjs');
  await acquireSlot(`vitest run ${filters.join(' ') || '(everything)'} in ${process.cwd()}`, { kind: 'vitest', weight: 1 });
}
