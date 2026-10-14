// How much seeded play the heavy test blocks do: a game count, never a wall-clock budget.
// `npm run check:v4 -- --fast` (and CI) sets V4_GAMES=fast: each block plays the first few of its seeds (the same ones
// every run, cycling seat counts), enough to catch a crash or a broken invariant in seconds. Without it, every game is
// played (`npm run check:v4`, before a release, or `V4_GAMES=full npx vitest run src/test/engine/v4`).
export const FAST = process.env.V4_GAMES === 'fast';
/** `full` games normally; in the fast gate `fast` games (default a tenth, at least 3 so 2, 3 and 4 seats all play). */
export const games = (full, fast = Math.max(3, Math.ceil(full / 10))) => (FAST ? Math.min(full, fast) : full);
