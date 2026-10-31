// A space's contests after taking it, from the dry run's branches (previewSpace's samples): what the space card's
// contest line reads. One branch per pick, so a count a pick decides (Kickback's +1 to a rival you choose) is known to
// depend on it rather than read off the first branch (w3b #10: "You 4 · P2 3" assumed the gift went to P2).
import { contestTable } from '../../engine/v4/index.js';

/**
 * [{ qid, rule, prize, winners, rows, counts: { [pid]: [count per branch] }, scores: { [pid]: [score per branch] },
 *    wins: { [pid]: [won per branch] }, sole: [one winner per branch] }], rows and winners from the first branch.
 */
export function raceOf(samples) {
  if (!samples || !samples.length) return null;
  const tables = samples.map(s => contestTable(s));
  return tables[0].map(c => {
    const per = tables.map(t => t.find(x => x.qid === c.qid));
    const counts = {}, scores = {}, wins = {};
    for (const r of c.rows) {
      const at = x => x.rows.find(y => y.player === r.player) || r;
      counts[r.player] = per.map(x => at(x).count);
      scores[r.player] = per.map(x => at(x).score);
      wins[r.player] = per.map(x => x.winners.includes(r.player));
    }
    return { qid: c.qid, rule: c.rule, prize: c.prize, winners: c.winners, rows: c.rows, counts, scores, wins, sole: per.map(x => x.winners.length === 1) };
  });
}

/** Attach the race to a fresh preview and drop the branch tables (they're big, and a worker posts the preview back). */
export function withRace(pv) {
  if (!pv) return pv;
  pv.race = raceOf(pv.samples || (pv.sample ? [pv.sample] : null));
  delete pv.sample;
  delete pv.samples;
  return pv;
}
