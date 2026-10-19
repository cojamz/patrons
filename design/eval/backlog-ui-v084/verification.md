# v0.8.4 backlog UI batch

Runtime source `1acee1a6c9db85d8dda4381389ffe751eacca525`; Pages main `70c0fa4`. Publisher verified public manifest and byte-identical HTML.

Three independent agents handled payment layout, member hover lists and details toggle. Root integrated and ran immutable scoped checks.52 UI checks + production build PASS;6 actual browser flows (three each desktop1270×700 and iPhone13) PASS. Payment test compares exact engine resource/member/shop outcome; choice test toggles details off/on without size changes; member list checks costs right of names and full ability presence. Existing8 viewport/color shop-sizing cases passed on ecd0d0d, immediately before only the scoped payment ink fix.

Visual review caught an existing `.ability{color:var(--ink)}` pale-on-paper defect: words were invisible while colored glyphs remained. Scoped payment ink restores readable14/20 text. Final browser test asserts dark computed ability color. Screenshots wait finite card entrance animations; translucent intermediate cards are not final visual evidence.

Final local production screenshots inspected on desktop and phone. Public six-flow verification retained in public-browser.log. All source changes are UI-only; no balance/engine, whole-suite, large sim or performance claim. Payment dialog retains modal focus; removing forced details does not make the hidden background controls accessible through a modal.

Next design discussion: Magenta proposed, not locked. Broad animations and other older backlog remain open.
