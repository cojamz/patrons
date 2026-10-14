# Two-device online check (emulator), 2026-10-14

Laptop host + iPhone 13 guest (Chromium emulation), real Firebase SDK on the RTDB emulator with the repo's rules, frozen e9c28bc. Production Firebase and Netlify are blocked from this container. Key shots in design/eval/two-device/. Saved by the foreman.

The two-device check passed all 7 steps, with one step partial. It ran on the frozen HEAD **e9c28bc64ac16ec8de266d255799763fe3a42871**, served on :5320, with the RTDB emulator on :9124 using the repo's rules and the real Firebase SDK. Cory was on a 1270×700 laptop and Pia on an iPhone 13 with touch. One full game, Classic table, 2 bots, 182 moves. Shots are in /tmp/qa-2dev/shots/ and the logs (console.log, events.log) are in /tmp/qa-2dev/.

1. **PASS.** Copy link put the correct invite URL on the clipboard, the phone link filled in the code, and the host saw Pia within 20 ms. Both screens entered the game within 2 s of Start. (002-host-lobby, 005-pia-lobby, 010-pia-game-start)
2. **PASS.** Every move appeared on the other device: median about 25 ms, max 576 ms (localhost). (021-pia-sees-kickback, 025-pia-sees-buy)
3. **PASS.** I reloaded Pia after she placed and before she bought. She was back in her seat on "Your turn — recruit or buy" 1.5 s later, with no moves lost, and finished the turn. (028 before, 029-pia-after-reload)
4. **PASS.** The host saw "Pia is offline" within 0.5 s. At about 15–23 s he got "Pia left. Let a bot play for them?" and tapped it, and a bot played her turn. After unlock she caught up in 1.7 s with her seat back. (046-host-offer-bot, 049-pia-after-unlock)
5. **PASS.** Back opened "Leave this game?", she stayed in the game with her seat saved, and "Keep playing" returned her to her extra turn. (058-pia-back-confirm)
6. **PARTIAL.** Hosting moved to Pia in 0.4 s and she saw "Cory is offline; waiting for them to come back". At 15 s she got the bot offer for Cory, the game went on, and Cory caught up 0.6 s after waking and later played his own turns. But Cory wasn't really the host by this point: Pia's phone had already taken hosting after step 4 (problem 2 below), and I had to move it back first. (pia-during-host-sleep / pia-offer-bot-cory shots, 066–069)
7. **PASS.** Both screens showed "Bot 3 wins with 74"; Bot 4 63, Pia 47, Cory 46; 182 moves on each. (080-host-results, 081-pia-results)

**Console errors:** only the expected ERR_INTERNET_DISCONNECTED while offline, plus one Firebase warning: "transaction at …/hostId failed: disconnect" (problem 2). No page errors.

**Worst three problems for a real player, worst first:**
1. **Phone setup pick is buried.** On her first turn Pia sees "Your turn — pick a starting resource" but no buttons. They sit below the fold under a large empty gap, and once scrolled to, the shop cards cover most of them (only a thin top strip of each circle is tappable). The cause is that the choice panel's positioning rule in lamp.css only applies at 861 px wide and up. (012, 015-pia-scrolled)
2. **A guest phone waking from sleep takes the host role from a healthy laptop.** Her own clock says the host's heartbeat is stale before the fresh one arrives (online.js `hostStale`/`elect`). The phone then hosts the game, so its next sleep stalls everyone for about 15 s.
3. **The phone board is hard to read.** From round II the wheel labels pile on top of each other; rival seats overlap badges with follower counts ("1NE", "2T"); the follower-buy buttons are only 54–78 × 24 px; the results screen is a narrow off-centre column with names overlapping scores. Smaller things: the shop hint says "hover" on a phone; on Back, "Leave" is the filled button; the host's round-end replay held his turn about 20 s while Pia only saw "Cory is placing a minion···".

**What this can't cover:** the production Firebase project and its deployed rules, real anonymous sign-in, the Netlify build and link, real mobile networks (latency, half-open sockets, iOS killing background tabs), and Safari/WebKit (this was Chromium with iPhone emulation). The emulation also leaves `(pointer: coarse)` and `(hover: none)` false, so the touch-only code paths keyed on those didn't run. Lock and sleep were faked with setOffline plus a visibilitychange event. I didn't edit any repo source, and the emulator, preview server and driver are all stopped.
