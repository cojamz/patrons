// Scoring truth, as the screen shows it: for seeded mixed-table games, every round-end card (RoundEnd) and every
// contest standings card (ContestStandings, the board's hover/tap layer) shows the winners and counts the engine
// scored, checked three ways: the engine's record, what was actually awarded (contest followers), and an
// independent oracle that counts each rule off the table at the moment of scoring.
import { expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { quadrant } from '../../../../engine/v4/index.js';
import RoundEnd from '../../../../v4/game/RoundEnd.jsx';
import { ContestStandings } from '../../../../v4/game/Info.jsx';
import { parseRoundEnd, standings, isRoundEnd } from '../../../../v4/format.js';
import { oracleCount, oracleWinners, playMixedGames } from '../../../engine/v4/contest-oracle.js';

const ids = s => (s ? s.split(',').filter(Boolean).map(Number) : []);

/** Plays games g0..g0+n-1 and checks every round-end card and a sample of live standings cards. */
export function checkContestTruth(g0, n) {
  let cards = 0, live = 0;
  playMixedGames(n, {
    g0, botEvery: 16,
    onMove(s, g) {
      if (s.over || s.round < 1 || s.moves % 23) return;
      for (const st of standings(s)) {
        const { container } = render(<ContestStandings state={s} st={st} />);
        for (const li of container.querySelectorAll('[data-pid]')) {
          const p = s.players[Number(li.dataset.pid)];
          const want = oracleCount(s, st.qid, p);
          if (want != null) expect(Number(li.dataset.count), `game ${g} live ${st.qid} ${p.name}`).toBe(want);
        }
        const leads = [...container.querySelectorAll('[data-lead="1"]')].map(li => Number(li.dataset.pid)).sort((a, b) => a - b);
        const w = oracleWinners(s, st.qid);
        if (w) expect(leads, `game ${g} live ${st.qid} leaders`).toEqual(w);
        cleanup();
        live++;
      }
    },
    onScored({ before, after, moment, record, prize, game }) {
      const line = after.log.filter(isRoundEnd).pop();
      const info = { result: parseRoundEnd(after, line), start: before, after, board: moment };
      const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
      const rows = [...container.querySelectorAll('li[data-qid]')];
      expect(rows.map(r => r.dataset.qid)).toEqual(after.quadrants);
      for (const li of rows) {
        const qid = li.dataset.qid;
        const shown = ids(li.dataset.winners).sort((a, b) => a - b);
        const where = `game ${game} round ${record.round} ${qid}`;
        // 1. the engine's record of the round
        expect(shown, `${where}: record`).toEqual([...record.results.find(c => c.qid === qid).winners].sort((a, b) => a - b));
        // 2. the oracle, counting the rule off the table as it was scored
        const w = oracleWinners(moment, qid);
        if (w) expect(shown, `${where}: oracle`).toEqual(w);
        // every count shown is the rule's own count
        for (const span of li.querySelectorAll('[data-pid]')) {
          const want = oracleCount(moment, qid, moment.players[Number(span.dataset.pid)]);
          if (want != null) expect(Number(span.dataset.count), `${where}: count for seat ${span.dataset.pid}`).toBe(want);
        }
        // the tiebreak is named in the rule's own words (Purple: "purple breaks ties", never "purple members")
        const tb = quadrant(qid).scoring.tiebreak;
        if (tb) expect(li.textContent).toContain(tb.text);
        expect(li.textContent).not.toMatch(/purple members/);
      }
      // 3. what was awarded: each player's contest followers grew by exactly the prizes shown for them
      for (const p of after.players) {
        const shownWins = rows.filter(li => ids(li.dataset.winners).includes(p.id)).length;
        expect(after.players[p.id].contest - before.players[p.id].contest, `game ${game}: ${p.name} awarded`).toBe(shownWins * prize);
      }
      cleanup();
      cards++;
    },
  });
  expect(cards).toBeGreaterThanOrEqual(n * 2);
  expect(live).toBeGreaterThan(n);
}
