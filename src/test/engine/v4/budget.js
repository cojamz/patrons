// How much seeded play the heavy test blocks do: a game count, never a wall-clock budget. Every level plays the first
// N of a block's seeds (the same ones every run, cycling seat counts), so a red always reproduces. V4_GAMES picks it:
//   fast     check:v4 --quick / --fast (and CI): a tenth, at least 3 so 2, 3 and 4 seats all play. Catches a crash or
//            a broken invariant in seconds.
//   (unset)  the verdict (check:v4 --commit): blocks of up to 60 games play them all; bigger ones play half, at least
//            60. Strength, as the smallest per-game failure rate the sample catches with 95% confidence, 1 − 0.05^(1/n):
//              60 games 4.9% · 85 games 3.5% · 100 games 3.0% · 170 games 1.7% · 200 games 1.5%.
//            So a sphere's 200-game block plays 100 in the verdict (catches a bug in ≥3% of that table's games), and
//            the bot fuzz plays 85 per seat count (≥3.5% per seat count; ≥1.2% over its 255 games). A block that asserts
//            a rate over its games (Market's Spree share, Silver's takes a game) passes `verdict` = `full`: a rate
//            needs its whole sample.
//   full     check:v4 --full (the nightly / remote job, and before a release): every game, the strength above for the
//            full count. Also `V4_GAMES=full npx vitest run src/test/engine/v4`.
// Why the verdict halves the big blocks (2026-10-15, design/eval/harness-metrics.md): the bots cost ~0.35–0.7 s of CPU
// a game, and the full counts alone were ~800 s of CPU, most of a 10-minute verdict on this 4-CPU box.
export const LEVEL = process.env.V4_GAMES === 'fast' ? 'fast' : process.env.V4_GAMES === 'full' ? 'full' : 'verdict';
export const FAST = LEVEL === 'fast';
/** The smallest per-game failure rate that n independent games catch with 95% confidence. */
export const catches = n => 1 - 0.05 ** (1 / n);
/**
 * Games for a block of `full`: all of them at the full level, `fast` in the fast gate (default a tenth, at least 3),
 * `verdict` in the verdict (default: all up to 60, else half, at least 60).
 */
export const games = (full, fast = Math.max(3, Math.ceil(full / 10)), verdict = full <= 60 ? full : Math.max(60, Math.ceil(full / 2))) =>
  (LEVEL === 'full' ? full : LEVEL === 'fast' ? Math.min(full, fast) : Math.min(full, verdict));
