# Portrait options, round 3: five kinds of little scenes (Cory, Oct 29 11:07am)

Cory picked little scenes ("definitely little scenes is the way to go either way"). About the current scene samples (design/prototypes/art-v3/_renders/scene/sheet.png; compare /mnt/project-files/portrait-sweep/scenes-vs-live.png) he said: "They still look a little rough around the edges. but this is better. like what is the white line on this launderer's head?" (her hairband read as a stray line). And: "you can use higher pixel density to make it look less like shit AI while still keeping the pixelated feel? give it a show... Maybe give me 5 different 'styles' of little scenes".

## Goals
1. A little scene: the people plus a setting that names the role at a glance.
2. Still clearly pixel art (hard pixels, limited palette, no gradients, no anti-aliasing blur), but finer: 64x64 or 96x96 grid as your style says.
3. Not AI-looking: no strange angles, no mystery marks (every pixel cluster is a thing you could name), no mottled or dithered skin, no stepped "rendered" face planes, no motion lines, consistent outlines, props sit in hands properly.
4. The five styles must look clearly different from each other, not five tweaks of one.

## The same 4 members in every style
- Kingpin (magenta, 1 person): crime boss at his desk; cash, lamp. A cigar only if it clearly reads as one.
- Mob (red, 5 people): an angry villagers' mob: pitchforks (3 tines) and a torch held in visible fists, shouting. Mixed skin tones; a light or mid face leads in the middle; the darkest face is never the angriest. No rope, nothing else.
- Tiebreaker (grey, 1 person): a referee in a striped shirt flipping a coin on a pitch. Very deep skin. The coin is a clean disc, no motion lines; the hand clearly holds or flicks it.
- Launderers (grey, 2 people): laundry first: washer with bills in the round porthole, clothesline with a shirt and banknotes pegged, a basket of bills. Nothing on heads that reads as a stray line (no thin hairbands).

## Rules carried over (read design/prototypes/art-v3/critique/lessons-from-batches.md and design/taste.md)
Wide skin-tone range; nothing insensitive (no caricature, no tooth pixels or tooth rows, no open-lipped mouths on deep faces, no light band under a dark nose, no bulging eye-whites on deep skin, no crosses or plus shapes). At most 24 colors per portrait.

## Format and tools
art-v4 format: each style is round3/<letter>/art.py defining STYLE (title, short, sub) and PORTRAITS = [(id, name, fn)] where fn() returns (grid rows, palette dict); '.' is transparent; card colour behind is #e9dcc4. lib.py is a small drawing kit (C class: px, rect, ell, ring, poly, line, outline…); round2/c/art.py is the current little-scenes code to learn from.
Build and render only your own style, so parallel artists don't collide:
  cd design/prototypes/art-v4 && OUT=round3-<letter> python3 build.py round3 <letter> && OUT=round3-<letter> python3 render.py round3
That writes round3/<letter>/sheet.png, <id>-8x.png, and round3-<letter>.png. Look at your renders at 96 and 32 px every pass and fix what reads wrong.
