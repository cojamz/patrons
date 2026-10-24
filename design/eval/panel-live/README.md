# Live blind panel (2026-10-15 evening)

Fresh blind testers played the newest merged head continuously while fixes landed. Each round had tester A, tester B and the skeptic.
Prompts were built by `fill.mjs` (`FAST=1` gives the fast rounds: round I at Steady, Quick after that, no quota, a 20-minute box). They add Cor's turn-clarity check: after each rival turn, say who gained what and why, from the board alone.

- r1, cf23306: A C, B C−, skeptic C−. Turn reads 5/23, 11/45 and 61% of parts.
- r2, 2b978c7 (remote box): skeptic C−, turn read 7/37. A and B were stopped.
- r3, b40abb9 (fast, about 35 min): A C+, B C+, skeptic C+. Ledger 45/48 honest. Turn reads about 30–55%.
- r4, 22b4d11 (rival turns one at a time): stopped unfinished when Cor played it himself and called it B+ ("laggy animations, slightly unable to tell what was happening"), then asked to stop grading.

Every run shared a 4-CPU box at load 4–17, so the testers' ms figures are tainted; speed comes from the quiet gate.
The lasting misses are turn clarity (gains, victims and recipients unreadable from the board), hovers that fill in over 2–4 bursts, answers 400–700 px from the eye, and nothing telling a player that buying followers wins.
