// Every motion budget in the game, in one place. The CSS twins are the --mo-* tokens at the top of v4.css, scaled by
// --mo-scale. Audit and targets: design/eval/perf/motion-audit.md; the motion language: design/prototypes/motion/.
//
// Two kinds of motion (Cory, 2026-10-15):
//  - What answers your hand stays instant at every speed: a press, a hover, the wheel's spin, the first frame of your
//    minion leaving. Input shows a response within 100ms.
//  - What tells what happened is a show: "whenever somebody does something it should be obvious, and it triggers a
//    chain of animations ... all timed well, paced well, and obvious". Its every duration and gap scales with the
//    viewer's animation speed (the ☰ menu): Quick, Steady or Relaxed (the default, Cory's v0.5 call).
//    A click or Space skips the rest of a chain to its end.

/**
 * The viewer's animation speed: how much every "show" duration is multiplied by, against the base budgets below (the
 * motion language's first Steady table, design/prototypes/motion/grammar.md §4). Cory's play note (morning fixes,
 * 2026-10-16): "Animations are too fast even on Relaxed". So Steady plays a little slower than that table (×1.2), and
 * Relaxed is twice Steady (×2.4). Quick keeps its own numbers. What answers your hand never reads this.
 * Cory, 2026-10-15 evening: "still just a touch slower on animations": Steady ×1.38 and Relaxed ×3.2, 15% slower each.
 * Cory, 2026-10-15 22:45: "animations are still too fast (but good)": Steady ×1.62 and Relaxed ×3.75, about a sixth slower.
 */
export const SPEEDS = { quick: 0.5, steady: 1.62, relaxed: 3.75 };
export const SPEED_NAMES = { quick: 'Quick', steady: 'Steady', relaxed: 'Relaxed' };
export const DEFAULT_SPEED = 'relaxed';
const KEY = 'patrons.v4.motionSpeed';

const urlSpeed = () => {
  try {
    const q = new URLSearchParams(globalThis.location?.search || '');
    const v = q.get('speed');
    if (v && SPEEDS[v]) return v;
    // a test or tool fast-forwarding the bots (?botDelay=) plays its chains quick unless it says otherwise
    if (q.get('botDelay')) return 'quick';
  } catch { /* no location */ }
  return null;
};
function readSpeed() {
  const u = urlSpeed();
  if (u) return u;
  try { const v = globalThis.localStorage && localStorage.getItem(KEY); if (v && SPEEDS[v]) return v; } catch { /* private window */ }
  return DEFAULT_SPEED;
}
let speed = readSpeed();
const subs = new Set();
// --mo-scale: the speed (what scales both ways); --mo-slow: the same, never below 1 (what Quick leaves as it was)
const applyCss = () => {
  try {
    if (typeof document === 'undefined') return;
    const st = document.documentElement.style;
    st.setProperty('--mo-scale', String(SPEEDS[speed]));
    st.setProperty('--mo-slow', String(Math.max(1, SPEEDS[speed])));
  } catch { /* jsdom */ }
};
applyCss();

export const motionSpeed = () => speed;
export const speedScale = () => SPEEDS[speed] ?? 1;
/** A hold or show that Quick leaves as it is and Steady and Relaxed stretch (a turn card's moment, a floating +N). */
export const slowed = ms => Math.round(ms * Math.max(1, speedScale()));
/** Change the viewer's speed (kept in this browser; a ?speed= in the address wins for that page). */
export function setMotionSpeed(s) {
  if (!SPEEDS[s] || s === speed) return;
  speed = s;
  try { localStorage.setItem(KEY, s); } catch { /* private window */ }
  applyCss();
  for (const fn of subs) fn(s);
}
export const onMotionSpeed = fn => { subs.add(fn); return () => subs.delete(fn); };
/** A speed's name from the one setting or an old save's bot speed ("fast" / "normal" / "slow"). */
export const speedName = s => ({ fast: 'quick', normal: 'steady', slow: 'relaxed' }[s] || (SPEEDS[s] ? s : DEFAULT_SPEED));

// Each budget at Steady. Scaled ones (SHOW) are multiplied by the speed when read; the rest answer your hand.
const BASE = {
  /** the wheel turning to its next quarter (arrow key, swipe, fling, settle after a drag) */
  spin: 300,
  /** hover cards: open at once, close a beat after the pointer leaves (HoverCards.jsx) */
  hoverOpen: 0,
  hoverClose: 150,
  /** a keyword's tip (Info.jsx): a hair of intent, so sweeping across a sentence doesn't flash every term */
  tipOpen: 50,
  /** the chosen space lights before anything moves (the selection, made obvious) */
  select: 140,
  /** a minion travels from its slot in the seat to the space (it shows on the space as it lands) */
  minionFly: 380,
  /** a member acknowledges that it's acting (a hop) before what it gives leaves it */
  hop: 200,
  /** a recruited card lifts off the shop and flies to its new owner's crowd, which then glows */
  cardFly: 420,
  chipGlow: 500,
  /** every gain and payment: one piece per unit flies from its source to where it lands, this far apart (flight.js) */
  pieceFly: 340,
  pieceStagger: 55,
  pieceMax: 10,
  pieceBump: 240,
  /** in a chain, the next step starts when this much of the one before has played (overlap, never all at once) */
  overlap: 0.7,
  /** a chain holds its end a moment before the next thing happens */
  chainHold: 220,
  /** the cards left in the shop slide to their new places */
  shopSlide: 260,
  /** a new card is dealt off the deck into its slot (per card, plus a stagger) */
  deal: 340,
  dealStagger: 50,
  /** a new round sends the wheel's minions home (per minion, plus a stagger) */
  minionsHome: 380,
  minionsHomeStagger: 35,
  /** a number counting up or down: base + per step, capped (Tick.jsx; the round summary passes its own) */
  tickBase: 300,
  tickPer: 30,
  tickMax: 550,
  /** a seat's members and leader react to what just happened (CultSeat.jsx) */
  react: 900,
  /** the "Nothing you can afford" toast waits for your recruit to land */
  afterFlight: 420,
  /** the Reckoning's prize token, plaque to winner (its pacing is the Reckoning's own) */
  reckonToken: 640,
  /** a new kind of step ignores a second press near the first for this long (the double-tap guard) */
  stepLock: 400,
  /** the same option twice within this is one double-click */
  doubleClick: 350,
};
const SHOW = new Set(['select', 'minionFly', 'hop', 'cardFly', 'chipGlow', 'pieceFly', 'pieceStagger', 'pieceBump', 'chainHold', 'shopSlide',
  'deal', 'dealStagger', 'minionsHome', 'minionsHomeStagger', 'tickBase', 'tickPer', 'tickMax', 'react', 'afterFlight', 'reckonToken']);

// The chain's own numbers, from the motion language's table (design/prototypes/motion/grammar.md §4): Quick's own,
// and the base (the old Steady) that Steady and Relaxed multiply by their speed, so Relaxed is always twice Steady.
// Where a key is here, it wins over BASE × scale.
const TABLE = {
  //            quick  base
  ownStamp:    [100,   140],  // your minion stands in the door at once, then settles
  trail:       [140,   180],  // your minion's trail from the column
  minionFly:   [220,   280],  // a rival's minion flight
  readHold:    [60,    90],   // after a rival places: which space, before anything flies
  pulse:       [50,    90],   // a source about to give
  hop:         [120,   180],  // a member acts
  choicePoint: [100,   160],  // a rival's choice: what they chose lights before its effect flies (grammar S3)
  setupRest:   [60,    160],  // between two players' starting picks: each pick lands and is read before the next lights
  lead:        [40,    60],   // hop or pulse → first piece leaves
  tug:         [60,    90],   // a stack being taken from
  pieceStagger:[35,    50],
  bundleTrail: [20,    30],
  // 4 or more resources fly as that many coins, one after the next inside this window however many there are (Cory:
  // "12 coins animate as 12, any count"): 4 coins ~54ms apart at Steady, 12 about 15ms apart
  streamSpread:[50,    80],
  fan:         [25,    40],   // groups, colors, seats in one beat
  settle:      [140,   180],
  roll:        [160,   240],  // a bundle's number rolling on landing
  cardLift:    [80,    100],
  rivalBuyHold:[0,     0],    // a rival's buy: the card stays lifted while its coins fly in (the telegraph)
  passHold:    [0,     0],  // a turn-ending pass with nothing to show
  cardFly:     [260,   340],
  ring:        [200,   260],
  worthHop:    [180,   200],  // a new member's worth, chip → follower count
  accept:      [100,   160],  // a rate or space's press-pop in an exchange
  swap:        [280,   420],
  shopSlide:   [180,   240],
  deal:        [220,   300],
  colorTurn:   [60,    80],   // a piece that changes colour on its way turns at its midpoint (grammar §2)
  sortBeat:    [350,   500],  // a new round's chairs re-sort into its order (lamp.css slides them .35s × --mo-slow) and are read
  rowOut:      [100,   160],  // a whole fresh row: each old card drops away toward the pile (grammar B4)
  rowOutStagger: [15,  25],
  dealStagger: [30,    40],
  breath:      [60,    70],   // between one player's turn and the next
  minionsHome: [260,   340],
  minionsHomeStagger: [20, 30],
  incomeSeat:  [120,   200],
  // a rival's step that showed something stays up at least this long before another player's step (grammar §5)
  stepFloor:   [350,   400],
  // the Reckoning (grammar B6, about 1.6s a rim at the base speed): the counts stamp in seat by seat and tick up, the
  // leader hops, the prize arcs from the rim to the winner's count, which rolls as it lands; a rest; the next rim
  reckonStagger: [60,  100],
  reckonTick:  [200,   300],
  reckonRest:  [60,    120],
  reckonQuiet: [150,   250],  // a rim nobody scores: it pulses once, dim, and the Reckoning moves on
  // the round's end as its own beat before the first rim lights: "Round II ends" stamps in at the wheel's centre and is
  // read (wave 4 #6: the scoring began while the player looked away)
  reckonLead:  [450,   800],
  lingerDelta: [1800, 2600],  // a seat's follower change stays readable under its count (panel r3)
  // the end-game scoring on the results' cults (taste rule 11; game/FinalScore.jsx): the results are read, then every
  // seat in step: the leader's followers pop, then each member's people one figure after the next, then the followers
  // members grant at game end; each seat's total ticks up as each pop lands
  scoreLead:   [150,   250],  // the results open and are read before the first pop
  scoreFan:    [30,    50],   // seat to seat within one pop
  scoreStep:   [140,   200],  // one figure's pop to the next
  scoreBeat:   [200,   300],  // between the beats (followers, members, grants)
  scorePop:    [450,   600],  // a pop's life: it rises over the head, holds, and fades (about three alive at once)
  reckonGap:   [300,   450],  // the round's last move at rest before "Round I ends" comes up (panel r1)
  // a passed turn's card holds its moment, then folds into its chair (GameScreen's TurnCard; lamp.css's fold is
  // --mo-slow scaled to match)
  turnCardHold: [2600, 2600],
  turnCardFold: [500,  500],
  // the action stage (stage.js): the space taken flies out to the hub as a card, a member steps off its seat beside it,
  // what they give flows from there; when the chain ends the stage holds a moment, then each flies home
  stageIn:     [150,   180],
  stageHold:   [220,   180],
  stageOut:    [160,   240],
  // a recruit holds at the hub, its rule readable, before it flies on to its buyer (Cory, 2026-10-18)
  recruitShow: [200,   300],
};
/** A budget at the viewer's speed: Quick's own number, else the base times the speed. */
const atSpeed = ([quick, base]) => (speed === 'quick' ? quick : Math.round(base * speedScale()));

/** MO.x reads the budget at the viewer's speed (read it when you use it, never keep a copy). */
export const MO = {};
for (const k of new Set([...Object.keys(BASE), ...Object.keys(TABLE)])) {
  Object.defineProperty(MO, k, {
    enumerable: true,
    get: () => (TABLE[k] ? atSpeed(TABLE[k]) : SHOW.has(k) ? Math.round(BASE[k] * speedScale()) : BASE[k]),
  });
}
/** The gap between the coins of a stream of n (a gain or take of 4 or more resources flies as n coins): the usual
 *  stagger, tightened so the whole stream leaves within streamSpread. */
export const streamGap = n => (n > 1 ? Math.min(MO.pieceStagger, MO.streamSpread / (n - 1)) : 0);
/** A flight's length by its distance in px (the grammar: constant speed reads more honest than constant time). */
export function flightMs(d) {
  const x = Math.max(0, d || 0);
  if (speed === 'quick') return Math.round(Math.min(280, Math.max(160, 120 + 0.18 * x)));
  return Math.round(Math.min(440, Math.max(260, 200 + 0.30 * x)) * speedScale());
}
/** When the next beat starts, as a part of this beat's last flight: half (Quick), two-thirds (Steady and Relaxed). */
export const nextBeatAt = flight => (speed === 'quick' ? flight * 0.5 : flight * (2 / 3));

/**
 * Bots: how long each visible bot step stays on screen at least (placing, recruiting, buying, passing), by the table's
 * bot speed, and how long the session lets a bot think. A step's own chain of animations can hold it longer.
 */
const PACE = { quick: 350, steady: Math.round(600 * SPEEDS.steady), relaxed: Math.round(600 * SPEEDS.relaxed) };
export const BOT = {
  // by the one speed setting (Quick / Steady / Relaxed); an old save's bot speed (fast / normal / slow) reads the same
  pace: { ...PACE, fast: PACE.quick, normal: PACE.steady, slow: PACE.relaxed },
  think: { quick: 120, steady: 250, relaxed: 400, fast: 120, normal: 250, slow: 400 },
  get recruitExtra() { return slowed(150); },
  /** your own recruit that ends your turn gets this long on screen before the next player's move shows */
  get myRecruitHold() { return slowed(500); },
  /** catching up on moves that happened behind the round-end card */
  get catchUp() { return slowed(320); },
};

/** The spin's easing: a crisp ease-out (quartic). Most of the turn happens in the first frames. */
export const spinEase = k => 1 - Math.pow(1 - k, 4);
