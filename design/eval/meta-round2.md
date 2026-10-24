# Meta synthesis, round 2

Inputs: ui-critic (4da59a3, C), boardgame-enthusiast (4fa162a, C+), engineer (4fa162a, "close, not ready tonight"), all from before Cory's 22:00 calls. Checked against decisions.md and the code at 7a669cf. Old card names in [brackets].

## Where it stands
All three agree the bones are good: the wheel and snake draft are elegant, the hovers ("you'd get", live standings) are the best thing on screen, the round-III chain was the enthusiast's high point, and the online core (host-checked moves, rejoin, bot stand-ins, handover) is solid. What fails is legibility and trust: you can't see which spaces you can take, why your numbers moved, or which rule decided a tie. Scoring pays holding and bulk buying more than building. No friends build has been verified on a stable link or the real Firebase.

## Themes
1. **Rules that decide outcomes aren't printed where you look.**
   - Enthusiast: lost a full-sets ring to "yellow breaks ties".
   - Critic: a "buried in the rulebook" list (loose followers, minimum 1 to score, Release limits, copies skip the centre).
   - Code: the rim drops bracketed text (format.js:23 `shortLabel`), so even Red's tiebreak, which Cory ordered printed (decisions line 199), is gone. Each sphere's rule ("Whatever you steal turns magenta", thieves.js:115) appears nowhere in the game.
   - Fix: print every tiebreak on the rim ("MOST FULL SETS · +2 · ties: yellow"), put each sphere's rule in its rim hover and on its spaces, and add a gate.
2. **A space doesn't show whether you can take it.**
   - Critic: the open space differed only by darker text; the dashed rings, which mean taken, read as the "glow"; misclicks were silent.
   - Enthusiast: his minion sometimes wasn't drawn. Cory: "I still don't like the actions."
   - Fix: Cory's action pick ships with three states (lit = yours to take; dim with the owner on it; hatched = not open), "Taken by P3" with a shake, and a gate that legal spaces are the brightest thing on the wheel.
3. **You can't tell what changed or why.**
   - Critic: Good Deed [Alms] gave him 2 magenta and his seat showed nothing; a member silently raised Kickback's yield.
   - Enthusiast: New Faces [Restock] swept away the card he was about to buy.
   - Engineer: the screen parses English log lines; it can't name causes.
   - Fix: the turn card now diffs each turn with "you" lines (`turnStory`, unseen on a frozen build); add the cause beside a bent number ("Kickback +5: +3, Hustler +2").
4. **Turn order and the lead are hidden.**
   - Enthusiast: "P3 picks first" though P2 had fewer followers; extra turns say "snake order".
   - Critic: ~3 s comparing corner numbers; no "leads by".
   - Fix, inside Cory's corner layout: each cult shows its place in the order; the leader's cult says "leads by 5"; the round-start line gives the reason; an extra turn names its card.
   - Replay that game first: it may be a display bug.
5. **What gets reviewed isn't what friends will play.**
   - Engineer: 144 commits in 6 hours, no stable verified link, nothing run against production Firebase.
   - Both blind reviewers judged builds Cory's calls overtook within the hour; their tabs crashed three times (box at 15 of 16 GB).
   - Fix: item 1.

## Already addressed
- **Round III cut off by the clock:** Cory's call; the game always ends after round III, 10-for-10 unlimited (core.js `TIERS`).
- **Rim figures read as minions:** Cory's inline-emoji call (Wheel.jsx).
- **"Who owns this space?":** Cory's minions-on-the-action call (the text under a minion waits on the action look).
- **Engineering:** effect-blind hash (b74e66c), Back confirms (cbb4cdc), heartbeat (209a85f), "Try again" (7a669cf), preview warm-up (9722b32), end-screen tie, harness leaks, dead tests, dist/, CI line.
- **Not yet:** online Rejoin on the crash screen (uncommitted), ShopCards' re-render on preview, the extra-turn prompt.

## Tensions with Cory's calls
- **10-for-10 unlimited at 1:1 vs "always the right move".** The enthusiast won 30–27 with 24 of 30 followers bought. Measure big-followers' win rate on Classic with the unlimited buy (Normal bots, 4-thinker tables) against Cory's 15–30% band.
- **Tied leaders all score in full ("fine for now") vs "participation trophies".** A four-way tie at 1 silver paid everyone +2, and P2 scored 12 of his 16 from contests. Measure contests' share of each winner's followers and how often 3+ players share a ring (Normal bots, 300 games), then ask question 4.
- **Minions left seen, not counted vs "give me a number".** The critic took ~3 s counting tokens. Time the next blind panel.
- **Fewest followers picks first, plus Front-runner ("You always pick first", 2 purple), vs "the centre is a lottery".** Measure win rate by round-III pick position; price Front-runner on the fair-price screen (audit: 2 is fine; enthusiast: 6+).
- **No rescue clauses vs "the last pick is dead leftovers".** Bot stats can't settle this, by Cory's ruling. Have the next panel mark the picks that felt dead.
- **Loot stays magenta vs "felt unfair".** The rule stays; print it (item 3).

## Ranked list for the friends build (worst first)
1. **"Does the link even work?"** Freeze a commit, full gate plus online e2e on the emulator, publish as the friends PR; then Cory's 10 minutes on laptop and phone (join, reload mid-turn, lock 30 s, finish). Online + harness. M.
2. **"Which spaces can I take?"** The picked action look with its three states, the owner on the space, a shake when taken, a gate. Wheel/shell. M (after question 1).
3. **"Who knew yellow breaks ties?"** Tiebreaks on the rim, sphere rules in the rim hover, "(arrives as magenta)" on steal spaces, a gate. Wheel/shell + engine text. S.
4. **"Why did my stuff change?"** Verify the turn card's "you" line, then name the member that bent a number. Wheel/shell + seats. M.
5. **"Just buy 10-for-10 every round."** Run the first two tension measurements before the link is cut; Cory reads them. Engine content (remote). M.
6. **"The prompt is cut off."** Verb phrase only in the headline; gate: no ellipsis at 1270×700. Wheel/shell. S.
7. **"Who's next, who's winning?"** Theme 4's fix. Seats. S.
8. **"The tooltip covers what I need."** Dock the hover card in one fixed laptop spot (Cory's spec: never covers what you point at). Shop/seats/hover. M.
9. **"Gold or yellow?"** Each color's glyph in every coin, setup and pay included; darker setup labels (not seat shapes: Cory banned them). Shop/seats/hover. S.
10. **Online leftovers.** Commit Rejoin; memoize Wheel, CultSeat, ShopCards (~3 full renders per move on phones); test heartbeat handover. Online. M.
11. **"Who is P1?"** "You" everywhere; fix "(P4 took 2 magenta and)." and Redistribute's [Tip-off] "(roughly)"; one word for Release; 12px floor (the rim is 11px). Wheel/shell. S.
12. **"My own card ate my target."** New Faces' preview lists what it sweeps. Shop/seats/hover. S.
13. **Tabs crashed three times.** Likely the box; sample page memory over a full game in Playwright. Harness. S.
14. **Card flags to the fair-price screen**, Cory grades: Front-runner cheap; Shift Crew and Crew give 2 followers plus a member for 2; doublers are traps; Timekeeper [Patience] and Magnate weak. Engine content. M.

## Questions for Cory
1. Action spaces: 1 Spoils, 2 Vignettes or 3 Engraved? Default: 3, with the three states.
2. Measure the ~25% big-followers target against Normal bots on Classic, then check it with people? Default: yes.
3. Bandwagon [Turnout] ("+1 red per member recruited this round, by anyone") gave +8 red late in round I; the last round-I seat wins 31% (Normal bots, Green test tables), an edge older sims traced to Bandwagon. Tame it? Default: yes, re-run the line-183 variants on today's rules and bring one.
4. Contest ties: every tied leader keeps scoring in full? Default: keep, unless measurement shows contests are the meal; the alternative is splitting the prize, rounded down.

## Ideas for later
- The rim as live standings: heads ranked by count, the prize travelling to the winner at the Reckoning (critic).
- "Can still be overtaken by P2" on a contest a rival's member could still move (enthusiast).
- A signature round-III chain per quadrant, previewed on hover from round I (enthusiast).
- First pick in round III as a prize you can plan for (enthusiast).
- Rooms pinned to their exact build; typed engine events for the log, animations and online updates (engineer).
