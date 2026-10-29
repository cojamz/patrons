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
| red.mob | cheering crowd (5) | young man, centre | deep | front | cheering, mouth open, eyes open |
| | | freckled woman, auburn hair | freckled | side left | smile |
| | | man with the pennant | olive | side right | cheering |
| | | two faces peeking (reuse olive / freckled ramps) | olive, freckled | back | smile / laughing |
| red.movementpenalty | referee | man, moustache, penalty card | golden | solo | stern, level |
| red.panel | judges (3) | head judge, cropped hair, score card "10" | verydeep | front | pleased smile |
| | | bald man, moustache | fair | behind left | eyebrows up, "o" mouth |
| | | woman with a bun | tan | behind right | level, unconvinced |
| red.patriarch | family elder | white hair and beard, cane | olive | solo | proud |
| red.proselytizer | street preachers | woman, cropped hair, gold hoop, pamphlet | deep | front (right) | mid-pitch, mouth open |
| | | partner, pamphlet stack | fair | behind | smile |
| red.recruitbonus | gift-givers | woman, hair puff, gold present | warmtan | front | delighted, eyes closed |
| | | man in a paper party hat | olive | behind | smile |
| red.twins | twin kids | both: bowl cut, striped sweater | freckled (both: twins) | front / behind | small smiles |
| red.volunteer | eager volunteer | teen, blonde pigtails, hand up, name tag | freckled | solo | eager, brows up, smile |
| thieves.accomplice | loot carrier | young man, flat cap, sack | olive | solo | sheepish (brows up, smile) |
| thieves.crew | heist crew | woman, beanie, domino mask | tan | front | pleased one-sided smile |
| | | partner, beanie, mask | golden | behind | eyes sliding sideways |
| thieves.cutpurse | pickpocket | teen, newsboy cap, coin pouch | warmtan | solo | sly glance, crooked smile |
| thieves.desperado | desperate outlaw | sunburnt, stubble, wide hat, bandana | palepink | solo | worried |
| thieves.doubleagent | spy | side part, dark glasses, ID card | brown | solo | calm, unreadable |
| thieves.extortionist | collector | bald, round glasses, ledger | porcelain | solo | stern, patient |
| thieves.fixer | fixer | woman, ponytail, key ring | coolbrown | solo | knowing side-glance, one-sided smile |
| thieves.grifter | con man | boater, pencil moustache, fanned cards | tan | solo | sly glance, smooth smile |
| thieves.kingpin | crime boss (reference) | old boss, fedora, cigar | fair | solo | stern |
| thieves.robinhood | hero outlaw | pointed cap, feather, bow, beard | verydeep | solo | big open laugh |
| thieves.shoplifter | innocent-looking thief | grandmother, white bun, handbag + baguette | freckled | solo | serene, eyes closed, sweet smile |
| thieves.snitch | informant (comic) | man, collar up, sweat bead, open hand by mouth | deep | solo | worried, whispering |
| thieves.sticky | jewel magpie | woman, long hair, ring on every finger | golden | solo | laughing |
| thieves.watchdog | bodyguards | woman, dark glasses, earpiece | deep | front | calm, small closed smile |
| | | big bald man, dark glasses | warmtan | behind | stern |

Checks:
- Shady magenta roles by tone: light (Kingpin fair, Extortionist porcelain, Desperado palepink, Shoplifter freckled),
  medium (Accomplice olive, Cutpurse warmtan, Grifter tan, Sticky golden, Crew tan/golden), deep (Fixer coolbrown,
  Double Agent brown, Snitch deep). Heroes and protectors span tones too (Robin Hood verydeep, Bodyguard deep front).
- The darkest person in every group card is in front: Loyalists (brown), Mentor (tan), Mob (deep), Panel (verydeep),
  Proselytizer (deep), Recruit Bonus (warmtan), Bodyguard (deep). Twins share a tone.
- Mob: a cheering home crowd with a pennant, three tones over five faces, no torches, no fists, no scowls.
- Snitch (deep) is comic and nervous; his hand is open by his mouth (a whisper), never a raised fist.
- No cultural costume on any role; the hats are a fedora, flat/newsboy caps, a boater, a cowboy hat, a party hat and
  Robin Hood's cap.
- All 12 SKINS tones are used across the batch.
