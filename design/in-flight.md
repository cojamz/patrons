# Current work — October 21

Public **v0.8.10** /3ff1ac753ebc8d57d7ef98541923fba663cde472 (Pages main 5ba1b6f): shop cards show their total cost as a faint number in the top-right corner (Cory, 2026-10-21). Pages deploy succeeded; github.io wasn't reachable from the publishing box, so the stamp was confirmed from main's play/build.json. No active helper/browser/owned preview.

Quick check on the branch already fails before this change: 3 UI unit tests (deck pile count, "Your turn is over" header, Echo auto-copy) and hotseat's type-scale list (16px shop-card footers, 15px "Done, no buy", 30px follower-rate number). Not caused by v0.8.10; next thread should fix or re-pin them to Cory's current intent.

Next: Cory playtest; existing motion/phone wording/round summary, legacy test migration and Magenta member/color work remain open.
