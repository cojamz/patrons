// The initiation (beat 3's recruit): the member card (back: the cult mark) rises at CARD and flips; two gold glyphs
// arc from the pile into its cost; the leader beckons; the member steps off the card into a small ring of arcane
// light at INIT_RING; it bows to the leader; the cult's mark (your emoji) blooms above its head; it walks to its slot
// in the crowd once the mark has sunk into it, and "+1 [follower]" rises. One thing at a time, slow and eased.
// Spec: design/prototypes/intro2/storyboard.md (beat 3). Every time below is relative to `at` (the beat-3 ms it starts).
import { Act, CARD, INIT_RING, MSLOT, PILE, YOU_MEMBERS, Emblem, Fol, Frames, Member, Res, ArcaneFloor, ArcaneRing, useCast } from './shared.jsx';

/** The moments (ms after `at`). */
export const T = {
  rise: 0, // the card rises, back up (500)
  flip: 400, // it turns over (2 × 180)
  pay: 600, // the two glyphs leave the pile, 100 apart (600 each): Beat3 hides its pile glyphs then
  beckon: 1200, // the leader beckons (BECKON)
  ring: 1250, // the ring of light fades in (400)
  step: 1450, // the member steps off the card into the ring (520); the empty card fades behind it (from 1600, 350)
  bow: 2050, // it bows: bow1, bow2 (held), bow1, up (to 2620)
  mark: 2200, // the cult's mark blooms above its head mid-bow (360, back ease), holds, and sinks into it (2700, 200)
  walk: 2800, // it walks to its slot (550, three little steps)
  plus: 3350, // "+1 [follower]" rises beside it (400), holds, fades (3900–4150)
};
/** Length from the card rising to the "+1" gone (ms). */
export const DURATION = 4150;
/** The leader's beckon, relative to `at`, for Beat3's leader frame sequence: [ms, pose]. */
export const BECKON = [[1200, 'beckonA'], [1330, 'beckonB'], [1460, 'beckonA'], [1590, 'beckonB'], [1720, 'beckonA'], [1850, 'idle']];
/** When the member starts its walk to the slot (relative to `at`; 550 ms): Beat3 steps the followers back to row 34
 * over the same 550 ms, so they make room as it comes. */
export const SETTLE = T.walk;
export const WALK_MS = 550;

// ---------- the card (26 × 36 world units, drawn inline: paper face, walnut back) ----------
const W = 26, H = 36;
const box = { position: 'absolute', display: 'block' };
const CardBack = ({ emoji }) => (
  <span style={{ ...box, position: 'relative', width: W, height: H, borderRadius: 2.5, overflow: 'hidden',
    background: 'radial-gradient(circle at 50% 46%, #3a2c40, #241a20 62%, #1c1418)',
    boxShadow: 'inset 0 0 0 1px rgba(170,140,255,.32), 0 0 0 .5px rgba(0,0,0,.6), 0 3px 6px -2px rgba(0,0,0,.7)' }}>
    <span style={{ ...box, left: 2, top: 2, width: W - 4, height: H - 4, borderRadius: 1.5, boxShadow: 'inset 0 0 0 .5px rgba(246,215,126,.35)' }} />
    <span style={{ ...box, left: W / 2 - 4, top: H / 2 - 5, transform: 'scale(2)', transformOrigin: '50% 50%' }}><Emblem emoji={emoji} /></span>
  </span>
);
// the face: gold band, a warm art panel the member stands on, two cost slots the glyphs drop into
const SLOT = [[3, 25], [14, 25]]; // 9 × 9 slot top-lefts on the card
const CardFace = () => (
  <span style={{ ...box, position: 'relative', width: W, height: H, borderRadius: 2.5, overflow: 'hidden',
    background: 'linear-gradient(180deg, #f4ebd7, #eadfc4)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 0 0 .5px rgba(80,60,30,.45), 0 3px 6px -2px rgba(0,0,0,.7)' }}>
    <span style={{ ...box, left: 0, right: 0, top: 0, height: 2, background: '#c99327' }} />
    <span style={{ ...box, left: 1.5, top: 3.5, width: W - 3, height: 20, borderRadius: 1.5,
      background: 'radial-gradient(circle at 50% 72%, #ecd6a2, #e6d8b6 72%)', boxShadow: 'inset 0 0 0 .5px rgba(42,31,23,.2)' }} />
    {SLOT.map(([x, y], i) => <span key={i} style={{ ...box, left: x, top: y, width: 9, height: 9, borderRadius: '50%', boxShadow: 'inset 0 0 0 .6px rgba(42,31,23,.45)' }} />)}
  </span>
);

/** The "+1 [follower]" that rises by the member once it has its place. */
const PlusOne = () => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 1.5, lineHeight: 1 }}>
    <b className="in-num" style={{ fontSize: 9, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>+1</b>
    <Fol />
  </span>
);

/**
 * <Initiation at={3100} member={YOU_MEMBERS[0]} slot={0} pile={[4, 5]} />: at = the beat-3 ms it starts; slot = the
 * MSLOT it ends in; pile = the two PILE slots it pays from (gold, the third landing's).
 */
export default function Initiation({ at = 3100, member = YOU_MEMBERS[0], slot = 0, pile = [4, 5] }) {
  const { you } = useCast();
  const t = k => at + T[k];
  const [cx, cy] = CARD;
  const [rx, ry] = INIT_RING;
  const [sx, sy] = MSLOT(slot);
  const onCard = [cx + 1, cy + 2]; // the member, standing on the card's art panel
  const inRing = [rx - 12, ry - 23]; // the bust's bottom row sits on the ring's centre line
  const flipOut = t('flip'), flipIn = t('flip') + 180;
  const cardGone = [t('step') + 150, 350, { o: 0 }, 'sine'];
  return (
    <>
      {/* the card: rises back-up, turns over, pays, and fades once its member has stepped off */}
      <Act track={[{ x: cx, y: cy + 8, o: 0 }, [t('rise'), 500, { y: cy, o: 1 }, 'out'], [flipOut, 180, { sx: 0 }, 'in']]} origin="50% 50%">
        <CardBack emoji={you} />
      </Act>
      <Act track={[{ x: cx, y: cy, sx: 0 }, [flipIn, 180, { sx: 1 }, 'out'], cardGone]} origin="50% 50%">
        <CardFace />
      </Act>
      {/* the price: two gold glyphs arc from the pile into the card's slots */}
      {pile.map((p, i) => {
        const [px, py] = PILE(p);
        const go = t('pay') + 100 * i;
        return (
          <Act key={p} track={[{ x: px - 4.5, y: py - 4.5, o: 0 }, [go, 1, { o: 1 }, 'lin'], [go, 600, { x: cx + SLOT[i][0], y: cy + SLOT[i][1] }, 'io', 12], cardGone]}>
            <Res r="gold" />
          </Act>
        );
      })}
      {/* the ring of arcane light, behind the member (its front half is drawn again over the bust's base) */}
      <Act track={[{ x: rx - 13, y: ry - 4, o: 0 }, [t('ring'), 400, { o: 1 }, 'sine'], [t('walk'), 450, { o: 0 }, 'sine']]} origin="50% 50%">
        <ArcaneFloor w={26} h={8} />
      </Act>
      <Act track={[{ x: rx - 13, y: ry - 4, o: 0 }, [t('ring'), 400, { o: 1 }, 'sine'], [t('walk'), 450, { o: 0 }, 'sine']]} origin="50% 50%">
        <ArcaneRing w={26} h={8} />
      </Act>
      {/* the member: turns over with the card, steps down into the ring, bows, walks to its place */}
      <Act track={[{ x: onCard[0], y: onCard[1], sx: 0 }, [flipIn, 180, { sx: 1 }, 'out'],
        [t('step'), 520, { x: inRing[0], y: inRing[1] }, 'io', 6],
        [t('walk'), WALK_MS, { x: sx, y: sy }, 'io', 0, 3]]} origin="50% 50%">
        <Frames seq={[[0, 'up'], [t('bow'), 'bow1'], [t('bow') + 120, 'bow2'], [t('bow') + 450, 'bow1'], [t('bow') + 570, 'up']]} stillAs="up">
          {pose => <Member id={member} pose={pose === 'up' ? null : pose} />}
        </Frames>
        {/* the cult's mark: blooms above its head mid-bow, holds, then sinks into it just before it walks */}
        <Act track={[{ x: 3, y: -11, o: 0, s: 0 }, [t('mark'), 360, { s: 1 }, 'back'], [t('mark'), 260, { o: 1 }, 'sine'],
          [t('walk') - 100, 200, { o: 0, y: -6 }, 'in']]} origin="50% 50%">
          <ArcaneFloor w={14} h={14} />
        </Act>
        <Act track={[{ x: 6, y: -8, o: 0, s: 0 }, [t('mark'), 360, { s: 1 }, 'back'], [t('mark'), 200, { o: 1 }, 'sine'],
          [t('walk') - 100, 200, { o: 0, y: -4, s: 0.5 }, 'in']]} origin="50% 50%">
          <Emblem emoji={you} />
        </Act>
      </Act>
      {/* the ring's front half, over the bust's base, so it stands in the light */}
      <Act track={[{ x: rx - 13, y: ry, o: 0 }, [t('ring'), 400, { o: 1 }, 'sine'], [t('walk'), 450, { o: 0 }, 'sine']]}>
        <span style={{ display: 'block', width: 26, height: 5, overflow: 'hidden', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: -4 }}><ArcaneRing w={26} h={8} /></span>
        </span>
      </Act>
      {/* +1 follower, beside its place */}
      <Act track={[{ x: sx + 23, y: sy + 6, o: 0 }, [t('plus'), 400, { y: sy, o: 1 }, 'out'], [t('plus') + 550, 250, { o: 0 }, 'in']]}>
        <PlusOne />
      </Act>
    </>
  );
}
