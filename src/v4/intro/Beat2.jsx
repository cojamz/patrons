// Beat 2 — "You and your minions have learned to tap into mysterious powers to gain influence and followers."
// STUB (end state only): the beat-2 agent replaces this file. Spec: design/prototypes/intro2/storyboard.md.
import { At, LEAD, Lead, Mini, Fol, FSLOT, ringTL, ArcaneFloor, Z, useCast } from './shared.jsx';

export const shots = [{ t: 0, cam: [0, -4, Z.mid], d: 1200, lamp: [0, -2, 210, 150] }];

export default function Beat2() {
  const { you } = useCast();
  return (
    <>
      <At x={-44} y={11}><ArcaneFloor w={88} h={10} /></At>
      <At x={LEAD[0]} y={LEAD[1]}><Lead emoji={you} /></At>
      {[0, 1, 2].map(i => { const [x, y] = ringTL(i); return <At key={i} x={x} y={y}><Mini emoji={you} /></At>; })}
      {[0, 1, 2].map(j => { const [x, y] = FSLOT(j, 0); return <At key={j} x={x} y={y}><Fol /></At>; })}
    </>
  );
}
