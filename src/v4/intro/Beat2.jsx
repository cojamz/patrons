// Beat 2 — "You and your minions have learned to tap into mysterious powers to gain influence and followers."
// It opens where beat 1 rests (the leader alone, scheming) as the camera pulls back. The leader's hands part and the
// three minions pop out from behind it to their RING spots, one by one, and idle with a 1-unit bob. Then the
// mysterious powers: a violet pool spreads on the floor and a soft column of light rises behind the cult. Last, three
// followers walk in out of the dark to the front of the cult (FSLOT 0–2), and everything holds while the line lands.
import { Act, At, LEAD, LeadFrames, Mini, Fol, FSLOT, RING, ringTL, ArcaneFloor, ArcaneColumn, Z, useCast } from './shared.jsx';

/** How long this beat plays (ms; added by the shell owner). */
export const DURATION = 5200;
export const shots = [{ t: 0, cam: [0, -4, Z.mid], d: 1200, lamp: [0, -2, 210, 150] }];

/** The leader lets go of its steepled hands (beat 1's last pose) just as the minions come out. */
const RELEASE = [[0, 'scheme'], [210, 'steeple'], [300, 'idle']];

/** Minions pop out left, top, right; then each idles with the kit's 1-unit bob (.in-bob), on its own period, its
 * first step ~300 ms after it lands. */
const POP = [300, 480, 660];
const POP_MS = 450;
const BOB = [1800, 2100, 1950]; // ms per bob (down half, up half)
function minionTrack(i) {
  const [x, y] = ringTL(i);
  const from = [-8 + RING[i][0] * 0.15, -8 + RING[i][1] * 0.15]; // tucked behind the leader's body
  return [{ x: from[0], y: from[1], s: 0.55, o: 0 }, [POP[i], POP_MS, { x, y, s: 1 }, 'back'], [POP[i], 140, { o: 1 }, 'sine']];
}
const bobStyle = i => ({ '--bob': `${BOB[i]}ms`, '--bob-d': `${POP[i] + POP_MS + 300 - BOB[i] / 2}ms` });

/** Followers walk in from the dark edges (left, right, left) with little hops, and stand in front of the cult. */
const WALK = [
  { at: 2300, from: [-86, 20] },
  { at: 2550, from: [80, 20] },
  { at: 2800, from: [-92, 20] },
];
const WALK_MS = 1400;
function followerTrack(j) {
  const [x, y] = FSLOT(j, 0);
  const { at, from } = WALK[j];
  return [{ x: from[0], y: from[1], o: 0 }, [at, WALK_MS, { x, y }, 'sine', 0, 8], [at, 600, { o: 1 }, 'sine']];
}

export default function Beat2() {
  const { you } = useCast();
  return (
    <>
      {/* the mysterious powers: a violet pool spreads on the floor, and soft light rises behind each minion */}
      <Act track={[{ x: -50, y: 7, o: 0, sx: 0.5 }, [1300, 1000, { o: 1, sx: 1 }, 'sine']]} origin="50% 50%"><ArcaneFloor w={100} h={16} /></Act>
      {[0, 1, 2].map(i => <Act key={`c${i}`} track={[{ x: RING[i][0] - 14, y: RING[i][1] + 9 - 34, o: 0, sy: 0.2 }, [1500 + 90 * i, 1100, { o: 1, sy: 1 }, 'out']]}><ArcaneColumn w={28} h={34} /></Act>)}
      {/* beat 1's floor shadow, carried over as it rests */}
      <At x={-20} y={12} className="in-shadow"><span className="in-floor" style={{ width: 40, height: 6 }} /></At>
      {/* the minions come out from behind the leader (drawn before it, so it covers them as they emerge) */}
      {[0, 1, 2].map(i => <Act key={`m${i}`} track={minionTrack(i)} origin="50% 50%"><span className="in-bob" style={bobStyle(i)}><Mini emoji={you} /></span></Act>)}
      <At x={LEAD[0]} y={LEAD[1]}><LeadFrames emoji={you} seq={RELEASE} stillAs="idle" /></At>
      {[0, 1, 2].map(j => <Act key={`f${j}`} track={followerTrack(j)}><Fol /></Act>)}
    </>
  );
}
