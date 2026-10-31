# UI research: information access in digital board games

*2026-10-14. The research half of the design pod. The goal: every piece of information a player needs is one glance or one tap away.*

**Bottom line**
- No existing skill grades board-game information access. The good design-review skills are tuned for SaaS dashboards and landing pages, and the game-UX skills are tuned for HUDs in action and free-to-play games.
- So we built our own critic, `.claude/agents/ui-critic.md`. It borrows the best mechanics from those skills: Playwright play by sight, letter grades driven by severity, "never read source", and a scored checklist. Its rubric comes from how the best digital board games handle information.

**Limits of this research.** The session's egress policy blocked WebFetch on most article hosts (GDC Vault, TouchArcade, Game UI Database, blogs). Skill repos were read in full from raw.githubusercontent.com. Game claims come from web-search summaries of the linked pages. Claims marked *(unverified)* rest on my own knowledge of the games.

---

## 1. Skills and prompts reviewed

| Candidate | What it does | Quality signals | License | Fit for a board game |
|---|---|---|---|---|
| **Anthropic `frontend-design`** ([skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design)) | Building, not reviewing. Ground the design in the subject's own world, plan tokens, then review the plan against the brief before coding. It lists the tells of generated UI: the SaaS-card kit, all-caps eyebrows, scattered fade-ins. | First-party. The base that Impeccable started from. | Apache-2.0 | **Good, for building.** "Spend your boldness in one place" and "motion that answers a person's action" suit us. Its review step is light. |
| **Anthropic Design plugin** ([knowledge-work-plugins/design](https://github.com/anthropics/knowledge-work-plugins/tree/main/design)): `design-critique`, `accessibility-review`, `ux-copy` and others | Critique in five parts: a 2-second first impression, usability, hierarchy, consistency, accessibility. It outputs severity tables. | First-party, in the Anthropic Directory. | Apache-2.0 | **Medium.** It is built around Figma and screenshots, and it has no gameplay or touch-parity checks. `ux-copy` is useful for prompt and log wording. |
| **OneRedOak `design-review` agent** ([repo](https://github.com/OneRedOak/claude-code-workflows/tree/main/design-review)) | A Playwright agent with 7 phases: interaction, responsiveness at 1440/768/375, polish, WCAG AA, robustness, code health, console. Triage runs Blocker, High, Medium, Nit. | About 3.8k stars ([sourcepulse](https://www.sourcepulse.org/projects/12217828)). Widely copied. | MIT | **Low to medium.** Its principles file is an "S-Tier SaaS Dashboard" checklist (Stripe, Linear). It reads the diff, so it isn't blind. We borrowed the live-environment-first phases. |
| **Impeccable** ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)) | A skill with 24 commands, including `critique`, `audit`, `polish`, `distill`, `harden` and `onboard`. `critique` scores Nielsen's 10 heuristics 0–4, adds an 8-item cognitive-load checklist and persona red flags, and backs them with 59 deterministic "AI slop" detectors. | Very popular. Written by the creator of jQuery UI. A mature rubric ([critique.md](https://github.com/pbakaus/impeccable/blob/main/skill/reference/critique.md)). | Apache-2.0 | **Medium.** The cognitive-load checklist (at most 4 options per decision, "does the user need to remember info from another screen?") transfers directly. The rest targets the web and SaaS. The `npx impeccable install` route writes PRODUCT.md and DESIGN.md into the repo. |
| **Vercel Web Interface Guidelines** ([guidelines](https://github.com/vercel-labs/web-interface-guidelines), [skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)) | Over 100 concrete rules, audited against code in `file:line` format. Examples: 44px targets on mobile, `touch-action: manipulation`, gestures that have tap alternatives, "no dead zones", tooltip timing, `prefers-reduced-motion`, never `transition: all`. | Vercel. Very widely installed. | MIT | **High, as a code-side companion.** It catches the craft floor that a blind critic can only observe. It reads code, so the build agent should use it, never the critic. |
| **gstack `design-review`** ([garrytan/gstack](https://github.com/garrytan/gstack/blob/main/design-review/SKILL.md)) | A designer's-eye QA in a browser, followed by a fix loop. It gives A–F grades over 10 weighted categories and a separate "AI slop" grade, cites Krug's laws, and rules "never read source code". | Garry Tan. 1,968 lines. | MIT | **Low to install, high to borrow.** It's heavy (telemetry, auto-commits, its own browser). We borrowed its grade arithmetic (start at A, drop by severity) and the rule "no relying on hover for discoverability". |
| **gstack-game `game-ux-review`** ([fagemx/gstack-game](https://github.com/fagemx/gstack-game)) | A game UX review: HUD priority tiers P0–P4, 1-second and 5-second tests, a "mindless choice audit", a "dead input test", input-method modes. | A port of gstack to games, with 29 skills. | MIT | **Medium.** It is the only game-specific reviewer, but it is aimed at real-time HUDs and free-to-play monetization. We borrowed the P0–P4 information-priority idea. |
| **awesome-gamedev-agent-skills `game-feel`** ([repo](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)) | Juice: eased tweens, squash and stretch, and a feedback bundle sized to how much the moment matters. | About 840 stars, maintained. | Apache-2.0 | **Low to medium.** It is aimed at action games, but "feedback scaled by importance" fits our "own moves snap" complaint. |
| **ui-ux-pro-max** ([nextlevelbuilder](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)) | A style, palette and font database for generating UI. | Huge star count ([anavem](https://www.anavem.com/skills/claude/ui-ux-pro-max-skill)), but stars measure discovery, not quality. | MIT | **Low.** It generates rather than critiques, and it is tuned for landing pages. |
| Others: Valgard `game-ui-design` (no license file), omer-metin `game-ui-design` (video-game HUDs), VectorLab UI/UX Skills (community plugin in the Anthropic Directory), Deque Axe (accessibility scanning) | | | | Low, or narrow. |

**Borrowed into `ui-critic`:**
- Play blind, by sight, never reading code (game-skeptic, gstack).
- Severity tiers and letter-grade arithmetic (gstack, OneRedOak).
- Cognitive-load and working-memory checks (Impeccable).
- Hover is never the only way in (gstack, Vercel).
- Measured 44px targets (Vercel, Apple).
- Information-priority tiers (gstack-game).
- Hodent's usability pillars as the critic's vocabulary.

## 2. How the best digital board games handle information

| Need | Who does it best | What they do | Source |
|---|---|---|---|
| Read any card | **Race for the Galaxy** (Temple Gates) | Zooming a card explains its icons automatically. A double tap expands it. | [BoardGameQuest](https://boardgamequest.com/race-for-the-galaxy-ios-review) |
| Know what's legal or affordable | **Race for the Galaxy**; the **Carcassonne** app | Cards you can afford glow. Carcassonne shows every possible tile placement. | [BoardGameQuest](https://boardgamequest.com/race-for-the-galaxy-ios-review), [Grider slides](https://www.slideshare.net/slideshow/board-gameconversion/17469822) |
| Undo | **Dominion** (Temple Gates) | Free undo until new information is revealed. Past that, undo is still allowed but disables achievements, and in multiplayer it asks the opponent. | [Erik Twice](https://eriktwice.com/en/2024/02/02/dominion-board-game-digital-app-review/), [BoardGameQuest](https://www.boardgamequest.com/dominion-digital-review/) |
| Phone legibility | **Dominion** | A "Jumbo mode" for readability on phones. | [Game Developer](https://www.gamedeveloper.com/press-release/play-dominion-free) |
| "What just happened" | **Hearthstone** | A history strip on the left holds the last 7–10 plays, blue for you and red for the opponent. Hovering one shows the details. | [Hearthstone wiki](https://hearthstone.wiki.gg/wiki/History) |
| Last move on the board | **Board Game Arena** (as a cautionary example) | Players have asked again and again to highlight the opponent's last move, because it's hard to tell what they did. | BGA requests [#14183](https://gl.boardgamearena.com/bug?id=14183), [#176524](https://it.boardgamearena.com/bug?id=176524) |
| Log and tooltips | **Board Game Arena** | Studio guidelines: put tooltips on every element, saying what it is and what clicking it does, but never use them for live state. The log should let players "follow the game story". A bug report shows tooltips covering the log. | [BGA Studio Guidelines](https://tr.doc.boardgamearena.com/BGA_Studio_Guidelines), [bug #56714](https://it.boardgamearena.com/bug?id=56714) |
| Preview before you commit | **Into the Breach** | Every enemy attack is shown in advance. An attack-order overlay shows the sequence, tile tooltips explain the board, and there is an undo-move button plus a limited reset-turn. | [Game Informer](https://gameinformer.com/b/features/archive/2018/02/27/23-tips-to-help-you-dominate-into-the-breach), [Pixel Twelve](https://pixeltwelve.com/guides/into-the-breach-beginner-guide-enemy-attacks-grid) |
| Telegraphed intent, keywords | **Slay the Spire** | An intent icon with numbers sits over each enemy. Keywords are gold in card text and get definition boxes beside the hovered card *(definition boxes unverified)*. | [Roy Tang](https://roytang.net/2019/02/slay-the-spire/), [StS wiki](https://slaythespire.wiki.gg/wiki/Module:Keywords/data) |
| Score attribution | **Balatro** | Each joker triggers in sequence, and the chips and mult counters update visibly. The cause is shown, not just the total. Counterpoint: there is no score preview before you play a hand, which critics flag. | [Aftermath on GMTK](https://aftermath.site/balatro-the-long-dark/), [Crosley](https://blakecrosley.com/guides/design/balatro) |
| Rules on demand | **Balatro** | One "Run Info" button lists every hand type with its base score, an example and its current level. | [CardGamer](https://cardgamer.com/games/getting-started-with-balatro/) |
| Status at a glance | **Through the Ages** (CGE, 2017 Golden Geek best app) | A summary banner across the top shows resources and production. | [BoardGameQuest](https://boardgamequest.com/through-the-ages-a-new-story-of-civilization-ios-review) |
| Opponent boards | **Wingspan** (as a counter-example) | Reviews say opponents' boards are hard to read, and patch notes fixed wrong "playable" highlights. Its final score breaks down by category, mirroring the paper scorepad. | [The Sixth Axis](https://www.thesixthaxis.com/2020/10/30/wingspan-review/), [BGA Wingspan help](https://en.doc.boardgamearena.com/Gamehelpwingspan) |
| Onboarding | **Root** (Dire Wolf) | Praised for its tutorial, which explains each faction's goal and how to win. | [Sprites & Dice](https://spritesanddice.com/reviews/root-digital-review) |
| How not to do it | **Terraforming Mars** (Asmodee) | Panned for an "uninformative interface". | [Common Sense Media](https://www.commonsensemedia.org/game-reviews/terraforming-mars) |
| Touch tooltips | **Material Design** guideline | On mobile a tooltip appears on long-press, stays while pressed and lingers about 1.5 s. Hover is the desktop-only equivalent. | [Material tooltips](https://material.io/go/design-tooltips) |

**Literature**
- **Celia Hodent, *The Gamer's Brain*.** Seven usability pillars: signs and feedback, clarity, form follows function, consistency, minimum workload, error prevention and recovery, flexibility. The engage-ability pillars sit beside them. Sources: [summary](https://medium.com/design-bootcamp/finding-a-framework-for-ux-in-gaming-key-takeaways-for-understanding-usability-in-celia-hodents-9c0fcfee85f7), [her Epic Games heuristics](https://celiahodent.com/ux-practices-epic-games/), [book](https://thegamersbrain.com/).
- **Nielsen's heuristics** ([NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/)). For us the key ones are visibility of system status and recognition rather than recall.
- **Krug's "don't make me think"**, as condensed in gstack: make clickable things obviously clickable, no hover-to-discover, and fix noise by removing things.
- **[Game UI Database](https://www.gameuidatabase.com/)** (Edd Coates). Version 2.0 holds over 55k screenshots and 1.7k videos across 1,341 games, filterable by screen type and HUD element ([Creative Bloq](https://creativebloq.com/3d/video-game-design/game-ui-database-20-is-the-ultimate-free-reference-tool-for-game-designers)). Use it to pull reference screens before a redesign.
- **GDC talks:**
  - Martin Grider, "Usability Lessons from Mobile Board Game Conversions" (2014), on touch paradigms and showing possible placements: [Vault](https://gdcvault.com/play/1020114/Usability-Lessons-from-Mobile-Board).
  - Randy Hoyt, "Cardboard Interfaces: UX for Board Games" (2018): [Vault](https://gdcvault.com/play/1024914/Board-Game-Design-Day-Cardboard).
  - Derek Sakamoto, "Hearthstone: How to Create an Immersive UI" (2015): [Vault](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an).
  - Matthew Davis, "Into the Breach Design Postmortem" (2019): [GDC](https://www.gdconf.com/news/get-inside-look-making-breach-gdc-2019).

## 3. Top 10 patterns to adopt

1. **Inspect anywhere:** any name, in any place (board, prompt, log, summary), opens the same full-text view with one tap or long-press. Best: Race for the Galaxy, Hearthstone's history.
2. **Keywords explained in place:** game terms get their definition right in the inspect view. Best: Slay the Spire.
3. **Legal and affordable at a glance:** playable options glow and the rest look inert, before any hover, with a cue that isn't colour alone. Best: Race for the Galaxy; Carcassonne's placements.
4. **Preview before commit:** show the exact gain, cost and VP of a placement before it is confirmed. Best: Into the Breach.
5. **Attributed, sequential deltas:** each score or resource change counts up at its source, one cause at a time, the same for you and for bots. Best: Balatro.
6. **Last move marked, plus a history strip:** the opponent's last change stays highlighted on the board, and a compact strip of recent plays in player colours opens details on tap. Best: Hearthstone. Missing in BGA.
7. **A log that tells the story:** actor, action, target, result, in game words, with tappable names, including automatic scoring. Best: Board Game Arena's guideline.
8. **Undo until information is revealed,** and the UI state is fully restored after the undo. Best: Dominion (Temple Gates).
9. **Status banner, plus one tap to any opponent:** your holdings and score are always visible, opponents show as a compact line, and one tap opens their full tableau. Best: Through the Ages. Wingspan is the counter-example.
10. **Auditable scoring:** one tap to a rules and score reference, a round-end summary that waits for you, and a final per-category breakdown that adds up by hand. Best: Balatro's Run Info and Wingspan's scorepad.

A hard rule that cuts across all ten: **touch parity.** Whatever hover reveals on the laptop, a long-press reveals on the phone, and something visible says so (Material Design guidance).

## 4. The rubric ("one glance, one tap")

The full rubric lives in `.claude/agents/ui-critic.md`. It has three parts:
- **A question test:** 14 questions a player asks mid-game, answered by sight, with the taps counted against a target (0 for whose turn, what to do and what's legal; 1 for "what does this do").
- **Checks:** 40 checks in six sections: glance, one tap, cause and effect, prevent and recover, legibility, intuitiveness.
- **Grading:** a grade that is capped at C+ if a player can't tell whose turn it is, what to do or what's legal.

The rubric would have caught every recurring complaint in HANDOFF §4:

| HANDOFF complaint | Check that catches it |
|---|---|
| Own moves snap while bots animate | C1, C2 |
| Phone is one long scrolling page | A5 (decision, costs and holdings in one viewport) |
| Shop text truncated while placing | E3, B2 |
| Bots too fast | C4 |
| Tiny text | E1 (measured) |
| "Placement undone" pill stuck | A2, D1 |
| Choice panel overlaps the buy row | E4 |

**How to use it.** Run `ui-critic` fresh, never reused, on the frozen panel build, alongside `game-skeptic`. Give it only the URL and, optionally, `design/rulebook.md`. It plays round I before reading the rulebook, so "buried in the rulebook" findings show what the screen fails to teach.

## 5. External skills worth installing (none installed)

| Skill | Source | Why |
|---|---|---|
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) (MIT) | A code-side audit for the build agent: touch targets, `touch-action`, reduced motion, focus, tooltip timing. It complements the blind critic. |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0), or the Anthropic Directory | The build agent loads it before any visual redesign, to avoid generic tells and keep boldness in one place. |
| Design plugin: `ux-copy` and `design-critique` | [anthropics/knowledge-work-plugins/design](https://github.com/anthropics/knowledge-work-plugins/tree/main/design) (Apache-2.0), or the Anthropic Directory | `ux-copy` for prompt, log and error wording, which feeds checks A2, C5 and D2. `design-critique` for quick screenshot critiques between panels. |
| `impeccable`, critique and polish only (optional) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) | Its Nielsen scoring and cognitive-load checklist are the most rigorous of the generic critiques. Install it in a branch first: it writes PRODUCT.md and DESIGN.md and a `.impeccable/` folder. |

Skip these:
- OneRedOak and gstack `design-review`: they are SaaS-tuned and read code, and gstack auto-commits. Their best ideas are already in `ui-critic`.
- ui-ux-pro-max: a generator, not a critic.
- The game-HUD skills: they target action games and game engines.
