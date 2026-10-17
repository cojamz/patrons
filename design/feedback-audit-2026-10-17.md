# Play-feedback audit — 2026-10-17

Original: `play-feedback-2026-10-17-original.txt`. All 113 nonempty notes retained in order. Clear fixes ship independently; ambiguous design calls wait for Cory. Source6c1e97eb is verified live (main/playf71fd9a). Implementation, verification and deployment remain separate statuses. Frozen checks:1203passed/1skipped, build, full hotseat and online browser games, phone touch390/412. Public desktop/phone UI and full source stamp verified. New animation/card follow-ups are not live.

| # | Feedback | Classification | Owner | Status / evidence |
|---|---|---|---|---|
| 1 | Hover over in the glossary | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 2 | Blue is going to translate to member synergy | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 3 | Colors have synergy | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 4 | Starting resources? Remove | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Replaced two starting picks with the clarified Round-I-only draft (core.js; oct17-explicit). |
| 5 | Draft 1 to start the round | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: One resource each, reverse firstOrder, no replacement; final color assigned automatically. |
| 6 | Make pants taller | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 7 | Outer circle looks dim, colors don’t look bright enough | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Rim color mixture brightened and inactive-rim opacity raised; frozen and public desktop/phone visual checks passed. |
| 8 | Default to members for scoring | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 9 | Asking for confirmation to place - NO. Only on phone/small screen | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Desktop direct placement; small screens retain confirmation (GameScreen confirmPlace={!wide}). |
| 10 | The extras should count as members | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Printed memberWeight counts in quantities, colored contests, recruit counters and previews; hooks once per card. |
| 11 | Frontrunner neutral too cheap | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 12 | Done no buy is in a weird spot not visible needs to be easier to click | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Done/no-buy is a full-width 44px target below follower buys. |
| 13 | Safe this round maybe better icon | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 14 | Snap up - pay for member in the shop - member cards got changed into bigger cards. Also why also have the pop up window | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Snap Up uses the shop as the sole recruit surface; skip preserved; duplicate GiftCard removed. |
| 15 | Toggle option for view of member card in shop with more info vs less | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Persisted compact/details shop view, with full abilities in detailed mode. |
| 16 | Sort toggle needs to be more fluid, one click not two click spots | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: One whole cost/color switch target. |
| 17 | Recluse not in blue | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 18 | Steal one each (no conditions) | Confirmed fix / clarified rule | Magenta rules | LIVE6c1e97eb: Redistribute no longer requires richer rivals; exact legal-resource choices tested. |
| 19 | Help yourself should scale moment | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 20 | Round 3 actions | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 21 | Revelers too expensive | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 22 | Desperado | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 23 | Sticky fingers and desperado combo | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 24 | Extra Hand - Probably fine | Preserve / positive feedback | Codex | Verified / preserved: Preserved; no balance change requested. |
| 25 | Extortionist is out of whack | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 26 | Steal when you buy a member - should be essential to magenta | Investigate / design idea | Magenta rules | Partial / not shipped: Recruit-theft hooks verified for paid/free recruitment; Accomplice/Light Fingers are currently culled. Recurring own-recruit theft design needs binding. |
| 27 | Should EVERY wheel just be members reward? I think yes | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 28 | Run some games without the follower shop | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 29 | Rising Tide +2 | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Rising Tide gifts each rival 2 silver before measuring the richest pile. |
| 30 | Knob tweak on shakedown | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 31 | Shakedown didnt seem to work? Counted as a misclick | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 32 | “You lose your tie for silver” is unnecessary | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Removed payment tie-loss prose; engine legality unchanged. |
| 33 | Show Off is trash | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 34 | Snap up is good | Preserve / positive feedback | Codex | Verified / preserved: Preserved Snap Up; duplicate UI corrected under #14. |
| 35 | Blue: rearrange the shop and then buy a bunch | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 36 | Silver is pretty close | Preserve / positive feedback | Codex | Verified / preserved: Preserved; no blanket Silver redesign. |
| 37 | Bodyguard is good | Preserve / positive feedback | Codex | Verified / preserved: Preserved Bodyguard. |
| 38 | Remove all cost reduction stuff in shop for now | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 39 | Player card hover over with all members needs to be better visually organizd. Its very close. Maybe member word rework will help | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Member hover rows show costs and clearer color/spacing organization. |
| 40 | Release needs to go entirely | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Release off for normal new games and removed from UI; legacy engine fixtures explicitly opt in. |
| 41 | Crime wave not named correctly or text is wrong | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 42 | Too many words in the hover over on actions we dont need to tell players how it will help them | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Action hovers retain exact rules, gains and causes; remove advice/contest prediction rows. |
| 43 | Retinue more followers | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 44 | Sounds and animation sound off | Investigate / design idea | UI | Partial / not shipped: Wheel cold-layout cache implemented and layout-equivalence checked; browser timing pending. Broader sound/motion pass remains. |
| 45 | Redistribute - more elegant solution | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 46 | Sequencing of member effects is not always intuitive | Investigate / design idea | UI | Partial / not shipped: Online state sequencing corrected; full member-effect choreography remains open. |
| 47 | Silver round 2 actions need work | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 48 | Freelancer maybe more expensive | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 49 | Grifter is kinda cool | Preserve / positive feedback | Codex | Verified / preserved: Preserved Grifter concept; choice/log defects corrected. |
| 50 | Start of round needs dedicated animations | Investigate / design idea | UI | Open: queued for investigation or balance/design work; not shipped. |
| 51 | Log doesnt show what was gained for taking show off | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Show Off now logs actual gain color/amount, including conversion. |
| 52 | Silver puts the game on steroids, needs some counterweight | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 53 | Desperado double let me pick twice instead of doubling the steal from one person | Confirmed fix / clarified rule | Magenta rules | LIVE6c1e97eb: Doubled steal takes 2 from the selected rival; base doubles before additions. |
| 54 | Lie Low should protect members and resources | Confirmed fix / clarified rule | Magenta rules | LIVE6c1e97eb: Lie Low protects members and resources (ransom, trade, steal regressions). |
| 55 | Maybe discount is good/fun | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 56 | Discount needs to show where its coming from | Question / hold | Codex | Partial / not shipped: Existing payment metadata retained; whether to keep/remove discounts and the desired origin display remain unresolved. |
| 57 | Get rid of release a member | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Same explicit Release removal as #40. |
| 58 | Why is squatter in magenta | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 59 | This should straight up steal | Question / hold | Magenta rules | Open: needs specific design answer or referent; not silently changed. |
| 60 | Should on recruit trigger | Question / hold | Magenta rules | Open: needs specific design answer or referent; not silently changed. |
| 61 | Grifter didnt give me an options | Confirmed fix / clarified rule | Magenta rules | LIVE6c1e97eb: Grifter now offers resource choices while retaining its richest-rival rule. |
| 62 | Multiplayer log isnt updating | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Online snapshots no longer sit behind local animation pacing; log/ownership update together. |
| 63 | Grifter log doesnt say what I took | Confirmed fix / clarified rule | Magenta rules | LIVE6c1e97eb: Grifter logs chosen resource/color under its own name. |
| 64 | It should show cost in hover over | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Member hover rows include costs. |
| 65 | Take 3 from opponent instead of one from each | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 66 | Hold court a little out of whack | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 67 | Robin Hood maybe needs to scale? | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 68 | Good deed possible misclick | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 69 | Kingpin - magenta doesnt gain enough resources. Maybe like King of Thieves? Based more on members. But shouldnt compete with ring competition? | Investigate / design idea | Magenta rules | Open: queued for investigation or balance/design work; not shipped. |
| 70 | Maybe showing a member number | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Visible weighted member count on seats; display and engine share quantity. |
| 71 | That is not yellow | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 72 | Intro Offer either in trash or not in Gold | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 73 | Should shop refresh in between rounds? | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Market refresh between rounds implemented; no new draft after Round I. |
| 74 | Are there two freelancers | Investigate / design idea | Codex | Verified / preserved: Source audit: one Freelancer definition/copy; no accidental duplicate reproduced. |
| 75 | Front runner purple not neutral? Whats happening with the neutrals | Question / hold | Codex | Verified / preserved: Source audit: Front-runner is a purple-leaning guest, rendered colorless when Purple absent; placement decision still open. |
| 76 | Late bloomers need two people in the pics | Investigate / design idea | UI | Open: queued for investigation or balance/design work; not shipped. |
| 77 | Lets actually keep # of ghosts. I know I had | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 78 | Catch up should be better | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 79 | Is frontrunner too strong or weak? Balance test. Not important | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 80 | Purple kernel is there, but needs rework | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 81 | Shop should refresh between rounds | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Whole market cycles old row to deck bottom and refills; conservation regression. |
| 82 | 8 is a lot for alchemist | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 83 | Squatter should be a little cheaper | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 84 | Yellow gets weak during lower person game | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 85 | Neutrals got shuffled into other colors? | Question / hold | Codex | Verified / preserved: Guests intentionally render their assigned color only when that sphere is on the table; desired neutral policy remains open. |
| 86 | Rebranding members into assets | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 87 | Overseer is a little weird doesnt fit | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 88 | Peddler + 1 of each color | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Peddler gains 1 of every table color, including yellow. |
| 89 | Game popped up repeatedly when “Collect Debts” is taken. Player said it felt like a rude reminder | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Background prompts and dialogs no longer steal focus; document-focus guards tested. |
| 90 | “Cory again snake order” displaying on multiplayer screen when not Cory’s turn | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Online headline no longer holds the previous actor while authoritative turn advances. |
| 91 | You see in advance round end bonus | Question / hold | UI | Open: needs specific design answer or referent; not silently changed. |
| 92 | Catch up, plan ahead, rush hour | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 93 | Correct to double then add, rather than add then double, in general, unless it should unambiguously be otherwise. For example, should prospector say “after” | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Theft base doubles before flat additions; printed Sticky/Desperado text updated. Gain modifiers already double before after-gain bonuses. |
| 94 | Weaver - 5 or more | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Weaver triggers at 5+ followers; exact 5-buy and 1-buy regressions. |
| 95 | Feastmaker more members - chefs? | Question / hold | Codex | Open: needs specific design answer or referent; not silently changed. |
| 96 | Yellow basically doesnt want members - maybe something there? | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 97 | Top up is too bad in Round 3, and even Round 2 | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 98 | I took multiple actions and then for some reason the middle player went twice? As if to balance out the turns? Its weird | Investigate / design idea | Multiplayer | Open: queued for investigation or balance/design work; not shipped. |
| 99 | Crunch time took 2 “Next” turns - maybe correct in terms of balance but led to non-intuitive turns in snake draft. | Investigate / design idea | Multiplayer | Open: queued for investigation or balance/design work; not shipped. |
| 100 | Lamplighter is too expensive | Investigate / design idea | Codex | Open: queued for investigation or balance/design work; not shipped. |
| 101 | Night Owl should be 2 followers | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Night Owl printed follower value is 2. |
| 102 | Log did not indicate a night owl turn | Firm change | Multiplayer | Partial / not shipped: Named Night Owl grant and visible subsequent-turn log verified with actual-engine UI test; new wording/display feedback still welcome. |
| 103 | Trade Seeds - one at a time. As expected. | Preserve / positive feedback | Codex | Verified / preserved: Trade Seeds already swaps one resource at a time; preserved. |
| 104 | If i buy go getter on last turn can i use | Investigate / design idea | Multiplayer | Open: queued for investigation or balance/design work; not shipped. |
| 105 | Rush hour doesnt show what you’d actually get like other actions do | Confirmed fix / clarified rule | UI | LIVE6c1e97eb: Rush Hour live panel includes the newly placed minion and shows actual payout. |
| 106 | Something is definitely fucked up in multiplayer games with the glowing spaces. Sometimes it seems as though it doesnt even think its my turn | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Immediate online ownership/legal-option snapshots; multi-client and frozen browser checks pending. |
| 107 | Magenta animations are awkward - shows multiple animation for the same resource gain? | Investigate / design idea | UI | Open: queued for investigation or balance/design work; not shipped. |
| 108 | Members with multiple “people” should count as additional members | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Same clarified printed-weight rule as #10, preserving explicit larger member counts. |
| 109 | Yeah when things are lit or not is all off | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Same online stale-snapshot correction as #106. |
| 110 | The swapping animation for members via actions should have them go to them middle, just clearly swap between the player cards. Maybe a LITTLE exaggerated… | Firm change | UI | Open: queued for investigation or balance/design work; not shipped. |
| 111 | Steal UI isn’t particularly intuitive. Well, the UI is maybe intuitive but sometimes wording on the cards isnt | Investigate / design idea | UI | Open: queued for investigation or balance/design work; not shipped. |
| 112 | Didn’t we say end of round sphere rewards should divide up evenly on a tie? | Confirmed fix / clarified rule | Codex | LIVE6c1e97eb: Clarified: every tied leader receives half the round prize, independent of tie count. |
| 113 | Sometimes turn status is desync’d or wrong | Confirmed fix / clarified rule | Multiplayer | LIVE6c1e97eb: Online header, legal options and log use current authoritative snapshot. |

## Questions set aside
- Start-of-round draft: object, source, price and frequency; removal of starting resources waits for this.
- Multi-person cards: printed member count and scope of counting.
- Tie rewards: split pool vs previous full awards; remainder handling.
- “Make pants taller”, “that is not yellow”, “Desperado”, “round 3 actions”, “should on recruit trigger”, “take 3 from opponent”, and “keep # of ghosts” need a referent.
- Remove all cost reductions vs later maybe keep discounts/show their source.
- Assets terminology: entire game rename or category/subtype?
- Default/all sphere scoring by members: firm universal replacement or variant to test?
- Exploratory balance prices/reworks need proposed values and evidence, not invented live changes.

## Clarifications received
- Round I only: reverse the drawn turn order; draft one resource from each available color without replacement; first actor receives the remaining color.
- Printed follower value also counts as member quantity; retain an explicitly larger printed member count. Bonus followers do not add members.
- Any tie: each tied leader receives HALF the round prize (1 / 2 / 3), even for a three-way tie.

## Intake findings
- No duplicate Freelancer definition/copy found. Guest color changes are intentional under the current rules, not accidental shuffling.
- Recruit-theft hooks exist, but some relevant members are culled from normal decks. The intended recurring own-recruit design remains a question.
- 48 paired Normal-bot games with/without follower-shop choices completed; report: `eval/2026-10-17-no-follower-shop.md`. This is not human balance validation.
