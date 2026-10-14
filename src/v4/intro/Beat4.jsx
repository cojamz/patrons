// Beat 4 — "After three rounds, the cult with the most followers (including members!) wins!"
// The camera pulls back to four cults side by side. Round marks tick I → II → III and each round the crowds grow
// (yours up close: new members drop in through arcane rings, followers pop in). Then the tally: every figure
// blinks as it's counted (the leader, then the members, then the followers) while its cult's number climbs; yours
// keeps climbing after the rivals stop. The crown drops onto the biggest, the rivals dim, and your leader laughs.
import { Act, At, Frames, Lead, LeadFrames, Member, Fol, Crown, Aura, ArcaneRing, COLS, RIVALS, YOU_MEMBERS, YOU_COUNTS,
  LEAD, LEAD_UP, MSLOT, FSLOT, memberRows, Z, useCast } from './shared.jsx';

export const shots = [{ t: 0, cam: [33, 13, Z.far], d: 1300, lamp: [33, 14, 260, 150] }];

// ---------- the timeline (ms into the beat) ----------
/** When each round's mark lights, and when that round's arrivals start (yours, then the rivals' quieter ones). */
const ROUND = [
  { lit: 250 },
  { lit: 1050, members: 1200, fols: 1700, rivals: 1300, back: null },
  { lit: 2250, members: 2400, fols: 3100, rivals: 2500, back: 2400 },
];
const GAP = { member: 190, fol: 130, rival: 90 };
const RIVALS_IN = 250; // the rivals fade up to .5 as the camera pulls back
const FULL = 3450; // the rivals come up to full for the tally
const TALLY = 3700; // the count starts (all four at once; the biggest keeps counting)
const STEP = 65; // ms per counted figure (slow enough to see the members counted)
const CROWN = 4950; // the crown drops (lands 420 ms later)
const DIM = 5050; // the rivals dim back to .5
const LAUGH = CROWN + 420; // your leader's scheming laugh, as the crown lands

// ---------- the four cults: members in join order; members and followers held after rounds I, II, III ----------
const CULTS = {
  a: { ...RIVALS.a, ox: COLS.a },
  you: { members: YOU_MEMBERS, m: YOU_COUNTS.m, f: YOU_COUNTS.f, ox: COLS.you, mine: true },
  b: { ...RIVALS.b, ox: COLS.b },
  c: { ...RIVALS.c, ox: COLS.c },
};
const firstRound = (n, counts) => counts.findIndex(c => n < c);
const total = cult => 1 + cult.m[2] + cult.f[2];
/** When the n-th counted figure (0 = the leader, then members, then followers) blinks. */
const countAt = n => TALLY + n * STEP;
const blink = n => [[countAt(n), 70, { f: 1.9 }, 'out'], [countAt(n) + 70, 320, { f: 1 }, 'sine']];

/** A member's track: present from the start, or arriving in its round (yours drop in; rivals' fade in). */
function memberTrack(cult, i) {
  const [x, y] = MSLOT(i);
  const at = [cult.ox + x, y];
  const r = firstRound(i, cult.m);
  const steps = blink(1 + i);
  if (r === 0) return { track: [{ x: at[0], y: at[1] }, ...steps], r, t: null };
  const k = i - cult.m[r - 1];
  if (cult.mine) {
    const t = ROUND[r].members + k * GAP.member;
    return { track: [{ x: at[0], y: at[1] - 9, o: 0 }, [t, 140, { o: 1 }, 'sine'], [t, 420, { y: at[1] }, 'out'], ...steps], r, t };
  }
  const t = ROUND[r].rivals + k * GAP.rival;
  return { track: [{ x: at[0], y: at[1], o: 0 }, [t, 520, { o: 1 }, 'sine'], ...steps], r, t };
}
/** A follower's track: it pops in (yours) or fades in (rivals), and steps back a row when the members grow a row. */
function followerTrack(cult, j) {
  const r = firstRound(j, cult.f);
  const rows = cult.m.map(memberRows);
  const [x, y] = FSLOT(j, rows[r]);
  const track = [{ x: cult.ox + x, y }];
  if (r > 0) {
    const k = j - cult.f[r - 1];
    if (cult.mine) {
      const t = ROUND[r].fols + k * GAP.fol;
      track[0] = { ...track[0], o: 0, s: 0.4 };
      track.push([t, 120, { o: 1 }, 'sine'], [t, 380, { s: 1 }, 'back']);
    } else {
      const t = ROUND[r].rivals + 260 + k * GAP.rival;
      track[0] = { ...track[0], o: 0 };
      track.push([t, 520, { o: 1 }, 'sine']);
    }
  }
  for (let q = r + 1; q < 3; q++) {
    if (rows[q] !== rows[q - 1]) track.push([ROUND[q].back, 480, { y: FSLOT(j, rows[q])[1] }, 'io', 0, 1]);
  }
  track.push(...blink(1 + cult.m[2] + j));
  return track;
}

/** The cult's count, above its leader: blank, then 1, 2, 3 … as each figure is counted. */
function Tally({ cult }) {
  const n = total(cult);
  const seq = [[0, 'none'], ...Array.from({ length: n }, (_, i) => [countAt(i), i + 1])];
  return (
    <At x={cult.ox - 14} y={-45}>
      <Frames seq={seq}>{v => (
        <span style={{ display: 'block', width: 28, textAlign: 'center', fontFamily: 'Alegreya, Georgia, serif', fontWeight: 700, fontSize: 12, lineHeight: '12px', color: '#f3e6c8', textShadow: '0 1px 2px rgba(0,0,0,.6)', visibility: v === 'none' ? 'hidden' : 'visible' }}>{v === 'none' ? 0 : v}</span>
      )}</Frames>
    </At>
  );
}

/** A cult's members and followers, back to front (rows in order; the centre of a row stands in front). */
function Figures({ cult }) {
  const members = cult.members.map((id, i) => ({ id, i, ...memberTrack(cult, i) }))
    .sort((p, q) => (Math.floor(p.i / 3) - Math.floor(q.i / 3)) || ((p.i % 3 === 0) - (q.i % 3 === 0)));
  return (
    <>
      {cult.mine && members.filter(m => m.t != null).map(m => {
        const [x, y] = MSLOT(m.i);
        return (
          <Act key={`ring${m.i}`} origin="50% 50%" track={[{ x: x - 1, y: y + 18, o: 0 }, [m.t - 60, 160, { o: 1 }, 'sine'], [m.t + 420, 420, { o: 0 }, 'sine']]}>
            <ArcaneRing w={26} h={8} />
          </Act>
        );
      })}
      {members.map(m => <Act key={`m${m.i}`} track={m.track}><Member id={m.id} /></Act>)}
      {Array.from({ length: cult.f[2] }, (_, j) => <Act key={`f${j}`} track={followerTrack(cult, j)}><Fol /></Act>)}
    </>
  );
}

/** The round marks along the top: I, II, III, each lighting in its turn. */
const MARK_X = [13, 31, 49];
const markStyle = lit => ({
  display: 'block', width: 16, textAlign: 'center', fontFamily: 'Alegreya, Georgia, serif', fontWeight: 700, fontSize: 9, lineHeight: '9px',
  color: lit ? '#ffd99a' : 'rgba(203,184,148,.38)', textShadow: lit ? '0 0 4px rgba(255,217,154,.7)' : 'none',
});
function RoundMarks() {
  return ['I', 'II', 'III'].map((n, r) => (
    <span key={n}>
      <At x={MARK_X[r] - 8} y={-58} at={150} d={500}><span style={markStyle(false)}>{n}</span></At>
      <At x={MARK_X[r] - 8} y={-58} at={ROUND[r].lit} d={450}><span style={markStyle(true)}>{n}</span></At>
    </span>
  ));
}

const LAUGH_SEQ = [
  [0, 'idle'], [LAUGH, 'steeple'], [LAUGH + 140, 'scheme'],
  [LAUGH + 310, 'laughA'], [LAUGH + 440, 'laughB'], [LAUGH + 570, 'laughA'], [LAUGH + 700, 'laughB'], [LAUGH + 830, 'laughA'],
  [LAUGH + 960, 'scheme'],
];

export default function Beat4() {
  const cast = useCast();
  return (
    <>
      <RoundMarks />
      {['a', 'b', 'c'].map(k => {
        const cult = CULTS[k];
        return (
          <Act key={k} origin="0 0" track={[{ x: 0, y: 0, o: 0 }, [RIVALS_IN, 900, { o: 0.5 }, 'sine'], [FULL, 300, { o: 1 }, 'sine'], [DIM, 500, { o: 0.5 }, 'sine']]}>
            <Act track={[{ x: cult.ox + LEAD[0], y: LEAD[1] }, ...blink(0)]}><Lead emoji={cast[k]} /></Act>
            <Figures cult={cult} />
            <Tally cult={cult} />
          </Act>
        );
      })}
      <At x={-28} y={-30}><Aura w={56} h={56} /></At>
      <Act track={[{ x: LEAD_UP[0], y: LEAD_UP[1] }, ...blink(0)]}><LeadFrames emoji={cast.you} seq={LAUGH_SEQ} stillAs="laughB" /></Act>
      <Act track={[{ x: -6.5, y: -35, o: 0 }, [CROWN, 160, { o: 1 }, 'sine'], [CROWN, 420, { y: -25 }, 'in'], [CROWN + 420, 90, { sx: 1.18, sy: 0.72 }, 'out'], [CROWN + 510, 260, { sx: 1, sy: 1 }, 'back']]}>
        <Crown />
      </Act>
      <Tally cult={CULTS.you} />
      <Figures cult={CULTS.you} />
    </>
  );
}
