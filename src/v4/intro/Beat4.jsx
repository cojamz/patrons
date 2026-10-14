// Beat 4 — "After three rounds, the cult with the most followers (including members!) wins!"
// STUB (end state only): the beat-4 agent replaces this file. Spec: design/prototypes/intro2/storyboard.md.
import { At, LEAD, LEAD_UP, Lead, Crowd, Crown, COLS, RIVALS, YOU_MEMBERS, Z, useCast } from './shared.jsx';

export const shots = [{ t: 0, cam: [31, 13, Z.far], d: 1300, lamp: [31, 14, 260, 150] }];

export default function Beat4() {
  const c = useCast();
  return (
    <>
      {['a', 'b', 'c'].map(k => (
        <span key={k}>
          <At x={COLS[k] + LEAD[0]} y={LEAD[1]}><Lead emoji={c[k]} /></At>
          <Crowd ox={COLS[k]} members={RIVALS[k].members} followers={RIVALS[k].followers} />
        </span>
      ))}
      <At x={LEAD_UP[0]} y={LEAD_UP[1]}><Lead emoji={c.you} pose="laughB" /></At>
      <At x={-6.5} y={-25}><Crown /></At>
      <Crowd members={YOU_MEMBERS} followers={10} />
    </>
  );
}
