// Beat 3 — "Take actions granted by the mysterious powers to add to your resources, recruit new members, and become
// more powerful." STUB (end state only): the beat-3 agent replaces this file. Spec: design/prototypes/intro2/storyboard.md.
import { At, LEAD_UP, Lead, Mini, Crowd, Aura, space, onSpace, Z, useCast } from './shared.jsx';
import Initiation from './Initiation.jsx';

/** How long this beat plays before the next (ms). */
export const DURATION = 9300;
export const shots = [
  { t: 0, cam: [-44, 10, Z.one], d: 1100, lamp: [-46, 10, 240, 160] },
  { t: 3000, cam: [4, 11, Z.mid], d: 1000, lamp: [6, 6, 200, 150] },
];
export const stillShot = shots[0];

export default function Beat3() {
  const { you } = useCast();
  const spaces = [space('green', 0), space('blue', 1), space('gold', -1)];
  return (
    <>
      {spaces.map((s, i) => { const [x, y] = onSpace(s); return <At key={i} x={x} y={y}><Mini emoji={you} /></At>; })}
      <At x={-28} y={-30}><Aura w={56} h={56} /></At>
      <At x={LEAD_UP[0]} y={LEAD_UP[1]}><Lead emoji={you} /></At>
      <Initiation at={3100} />
      <Crowd members={[]} followers={6} rows={1} />
    </>
  );
}
