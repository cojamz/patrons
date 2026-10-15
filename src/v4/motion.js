// Every motion budget in the game, in one place (Cory, 2026-10-15: "it just doesn't feel snappy", "the wheel spins
// really slow"). The CSS twins are the --mo-* tokens at the top of v4.css. Audit and targets: design/eval/perf/motion-audit.md.
// Rules: input answers within 100ms; hover opens at once; a spin is 250–350ms, crisp ease-out; flights are 200–350ms;
// decoration never blocks the next input; nothing you did waits on an animation before it shows its result.
// Bots are the one place paced for legibility, not speed. The Reckoning keeps its own pace (Reckoning.jsx).
export const MO = {
  /** the wheel turning to its next quarter (arrow key, swipe, fling, settle after a drag) */
  spin: 300,
  /** hover cards: open at once, close a beat after the pointer leaves (HoverCards.jsx) */
  hoverOpen: 0,
  hoverClose: 150,
  /** a keyword's tip (Info.jsx): a hair of intent, so sweeping across a sentence doesn't flash every term */
  tipOpen: 50,
  /** a rival's minion travels from its leader to the space (it shows on the space as it lands) */
  minionFly: 300,
  /** your own minion stands on the space at once; a quick trail from your leader says where it came from */
  minionTrail: 200,
  /** a recruited card lifts off the shop and flies to its new owner's chip, which then glows */
  cardFly: 340,
  chipGlow: 500,
  /** every gain and payment: one piece per unit flies from its source to where it lands, this far apart (flight.js) */
  pieceFly: 260,
  pieceStagger: 40,
  pieceMax: 10,
  pieceBump: 220,
  /** the cards left in the shop slide to their new places */
  shopSlide: 240,
  /** a new card is dealt off the deck into its slot (per card, plus a stagger) */
  deal: 300,
  dealStagger: 40,
  /** a new round sends the wheel's minions home (per minion, plus a stagger) */
  minionsHome: 340,
  minionsHomeStagger: 30,
  /** a number counting up or down: base + per step, capped (Tick.jsx; the round summary passes its own) */
  tickBase: 300,
  tickPer: 30,
  tickMax: 550,
  /** a seat's members and leader react to what just happened (CultSeat.jsx) */
  react: 700,
  /** the "Nothing you can afford" toast waits for your recruit to land */
  afterFlight: 360,
  /** a new kind of step ignores a second press near the first for this long (the double-tap guard) */
  stepLock: 400,
  /** the same option twice within this is one double-click */
  doubleClick: 350,
};

/**
 * Bots: how long each visible bot step stays on screen (placing, recruiting, buying, passing), by the table's speed,
 * and how long the session lets a bot think before it moves. A rival's recruit holds a little longer (its card flies).
 */
export const BOT = {
  pace: { slow: 1000, normal: 600, fast: 350 },
  think: { slow: 400, normal: 250, fast: 120 },
  recruitExtra: 150,
  /** your own recruit that ends your turn gets this long on screen before the next player's move shows */
  myRecruitHold: 500,
  /** catching up on moves that happened behind the round-end card */
  catchUp: 320,
};

/** The spin's easing: a crisp ease-out (quartic). Most of the turn happens in the first frames. */
export const spinEase = k => 1 - Math.pow(1 - k, 4);
