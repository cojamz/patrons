# Tone-to-role audit, batch a (red + magenta, 26 portraits)

Rules applied: groups mix tones; the darkest person in every group card is in front, lit, and at least as friendly as
anyone behind; shady roles span tones; people behind are mid tones (a pale tone one step darker reads grey/ill);
deep and very deep faces carry a warm highlight (forehead, cheekbone, nose bridge) and warm lips so they read at 1x.

| id | role | person | tone | place | expression |
|---|---|---|---|---|---|
| red.headhunter | recruiter (sly) | woman, black bob, business card | warmtan | solo | sly side-glance, one-sided smile |
| red.host | party host | balding man, moustache, coupe | coolbrown | solo | laughing, eyes closed |
| red.loyalists | loyal pair | woman, short natural hair, hand on heart | brown | front | proud closed smile |
| | | old man, white hair, hand on her shoulder | fair | behind | laughing, eyes closed |
| red.mentor | teacher + student | mentor, grey beard, glasses, open book | tan | front | kind smile |
| | | protégé, spiky hair | golden | behind | eager, looking at the book, mouth open |
| red.mob | cheering crowd (5) | young man, centre | deep | front | beaming, closed smile, lit forehead and cheek |
| | | freckled woman, auburn hair, waving an open hand | freckled | side left | closed-happy eyes, smile |
| | | man with the cream star pennant | olive | side right | smile |
| | | two faces peeking (reuse olive / freckled ramps) | olive, freckled | back | smile / laughing |
| red.movementpenalty | referee | man, moustache, penalty card | golden | solo | stern, level |
| red.panel | judges (3) | head judge, cropped hair, score card "10" | verydeep | front | pleased smile |
| | | bald man, moustache | fair | behind left | eyebrows up, "o" mouth |
| | | woman with a bun | tan | behind right | level, unconvinced |
| red.patriarch | family elder | white hair and beard, cane | tan (swapped with Grifter, round 2) | solo | proud |
| red.proselytizer | street preachers | woman, cropped hair, gold hoop, heart pamphlet | deep | front (right) | warm closed smile |
| | | partner, pamphlet stack | fair | behind | smile |
| red.recruitbonus | gift-givers | woman, hair puff, gold present with a red bow (no strap) | warmtan | front | delighted, both eyes closed arcs |
| | | man in a paper party hat | olive | behind | smile |
| red.twins | twin kids | both: bowl cut, striped sweater | freckled (both: twins) | front / behind | small smiles |
| red.volunteer | eager volunteer | teen, two hair puffs, sign-up clipboard, name tag (no raised hand: it read as a fist) | deep (swapped with Snitch, round 2) | solo | eager, brows up, smile |
| thieves.accomplice | loot carrier | young man, flat cap, sack | olive | solo | sheepish (brows up, smile) |
| thieves.crew | heist crew | woman, beanie, domino mask | tan | front | pleased one-sided smile |
| | | partner, beanie, mask | golden | behind | eyes sliding sideways |
| thieves.cutpurse | pickpocket | teen, newsboy cap, coin pouch | warmtan | solo | sly glance, crooked smile |
| thieves.desperado | desperate outlaw | sunburnt, stubble, wide hat, bandana | palepink | solo | worried |
| thieves.doubleagent | spy | side part, dark glasses, ID card | brown | solo | calm, unreadable |
| thieves.extortionist | collector | bald, round glasses (both eyes alike), ledger with gold coins | porcelain | solo | stern, patient |
| thieves.fixer | fixer | woman, ponytail, silver phone at her ear | coolbrown | solo | knowing side-glance, one-sided smile |
| thieves.grifter | con man | boater, pencil moustache, fanned cards | olive (round 2: dandy-swindler costume never on brown or deep skin) | solo | sly glance, smooth smile |
| thieves.kingpin | crime boss (reference) | old boss, fedora, cigar | fair | solo | stern |
| thieves.robinhood | hero outlaw | pointed cap, feather, bow, clean-shaven | verydeep | solo | wide closed smile, iris eyes |
| thieves.shoplifter | innocent-looking thief | grandmother, white bun, handbag + baguette | freckled | solo | serene, eyes closed, sweet smile |
| thieves.snitch | informant (comic) | ginger man, collar up, sweat bead, open hand by mouth | freckled (round 2: comic coward cast light) | solo | worried, lips pursed |
| thieves.sticky | jewel magpie | woman, long hair, ring on every finger | golden | solo | laughing |
| thieves.watchdog | bodyguards | woman, dark glasses, earpiece | deep | front | calm, small closed smile |
| | | big bald man, dark glasses | warmtan | behind | stern |

Checks:
- Shady magenta roles by tone (round 2): light (Kingpin fair, Extortionist porcelain, Desperado palepink, Shoplifter
  freckled, Snitch freckled), medium (Accomplice olive, Grifter olive, Cutpurse warmtan, Sticky golden, Crew tan/golden),
  deep (Fixer coolbrown, Double Agent brown), both cool and competent. Heroes, protectors and everyday roles carry the
  deep tones too (Robin Hood and the head judge verydeep; Bodyguard, Mob, Proselytizer and Volunteer deep).
- The darkest person in every group card is in front: Loyalists (brown), Mentor (tan), Mob (deep), Panel (verydeep),
  Proselytizer (deep), Recruit Bonus (warmtan), Bodyguard (deep). Twins share a tone.
- Mob: a cheering home crowd with a pennant, three tones over five faces, no torches, no fists, no scowls.
- Snitch (deep) is comic and nervous; his hand is open by his mouth (a whisper), never a raised fist.
- No cultural costume on any role; the hats are a fedora, flat/newsboy caps, a boater, a cowboy hat, a party hat and
  Robin Hood's cap.
- All 12 SKINS tones are used across the batch.

Round 2 (after the critic, average 5.75):
- Very deep and deep faces use the skin's new tall warm D for one forehead cluster and one cheekbone plane joined to the
  nose bridge (very deep also gets a lit upper-left plane and a lighter jaw); the wood-ramp highlight workaround is gone.
- No open lipped mouth on any deep face; no light row under a mouth (lip highlights removed from every smile).
- No raised fists anywhere: the Volunteer's raised hand read as one at 48px, so she holds a clipboard instead.
- No plus or cross shapes: gift ribbon strap removed (bow only), pamphlet mark is a heart, pennant is cream with a star.
- The lid-bar eye is now on 3 front faces of 26 (Headhunter, Movement Penalty, Cutpurse) plus two small faces behind (Panel right, Mob back left).
