// The initiation (beat 3's recruit, ~3.5 s): the member card (back: the cult mark) rises at CARD and flips; two gold
// glyphs arc from the pile into it; the leader beckons; the member steps off the card into a small ring of arcane
// light at INIT_RING; it bows to the leader; the cult's mark (your emoji) blooms above its head; it walks to its
// slot in the crowd and "+1 [follower]" rises. SKELETON (end state only): the initiation builder replaces the body.
// Spec: design/prototypes/intro2/storyboard.md (beat 3). Times below are relative to `at` (beat-3 ms it starts).
import { At, Member, MSLOT, YOU_MEMBERS } from './shared.jsx';

/** Length from the card rising to the "+1" fading (ms). */
export const DURATION = 3550;
/** The leader's beckon, relative to `at`, for Beat3's leader frame sequence: [ms, pose]. */
export const BECKON = [[1200, 'beckonA'], [1330, 'beckonB'], [1460, 'beckonA'], [1590, 'beckonB'], [1720, 'beckonA'], [1850, 'idle']];
/** When the member reaches its slot (relative to `at`): Beat3 steps the followers back to row 34 then. */
export const SETTLE = 2800;

/** <Initiation at={3100} member={YOU_MEMBERS[0]} slot={0} pile={[4, 5]} />: pile = the PILE slots paid from. */
export default function Initiation({ at = 3100, member = YOU_MEMBERS[0], slot = 0, pile = [4, 5] }) { // eslint-disable-line no-unused-vars
  const [x, y] = MSLOT(slot);
  return <At x={x} y={y}><Member id={member} /></At>;
}
