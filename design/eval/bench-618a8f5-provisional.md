# Bench pooled on 618a8f5 (2 runs, 2026-10-15 ~06:50 UTC): provisional

**The anchor check fails.** Hard-20 beats 3 Normal only 27.1% and 24.5% of the time (n=96 each). Earlier content gave 37% and 47%, and the bench needs 32%. So the two bots aren't distinct instruments on this content, and "both agree" flags are mostly the Normal bot alone. **No reprices from this run.** The likely cause: core.js now offers member uses in the place step, which Hard's rollouts may handle badly. The bench session is bisecting and fixing the bots, then rerunning.

What the instrument still says (Normal, pooled), as context for Cory's calls:
- Pure follower buyer: 10.0% and 9.4% against 3 Normal, 6–8% against 3 Hard-20. That's below the 15–30% band, so members beat buying followers by a wide margin.
- Front-runner (2, "always pick first"): fair at 2.3 and 1.0 (n about 300 each), roughly its price.
- Blue (market), fair price (Normal): Snob 10 → 3.5, Reseller 12 → 5.8, Patroness 8 → 3.4, Talent Scout 4 → −1.0 (bots likely under-use it), Onlooker 10 → 7.6, Curator 4 → 2.2. These match the member feel audit (Snob, Reseller and Patroness feel and read weak). Blue's spaces sit low: Snap Up about 2u, Spree in round III 0.9u (band 5–9), Show Off in round II 1.4u. A Blue specialist wins 17–18% against Normal.
- Elsewhere, too dear: Midas, Patriarch, Heiress, Extra Hand, Straggler, Tycoon and others. Too cheap: Tinker 6 → 10–13, Hustler 2 → 7, Lender 2 → 6.5, Mole 4 → 6.6, Volunteer 0 → 3.4–5.
