# Purple Layer Redesign

**Date:** 2025-11-15
**Status:** Actions approved - Shops need rework
**Current State:** Design only - NOT implemented

---

## Problem Statement

Current Purple layer ("Timing/Order") has significant issues:
1. **Turn manipulation** (skip turns, extra turns) disrupts game flow
2. **"Play more workers"** creates complex state management (Critical Rule #4)
3. **Breaks with Red** - Repeating "play more workers" spirals out of control
4. **Confusing timing** - "Take back worker" effects are unclear

---

## New Design Concept

**Purple: Worker Efficiency**

**Core Identity:** Your workers work smarter through strategic positioning and sequencing.

**Key Principles:**
- ✅ Rewards WHERE you place workers (diversity vs concentration)
- ✅ Rewards WHEN you place workers (sequencing within turn)
- ✅ No turn manipulation or complex state
- ✅ Clean interactions with Red (no spirals)
- ✅ Scales naturally R1→R2→R3

**Three Strategic Paths:**
1. **Diversity** - Spread workers across many layers
2. **Concentration** - Stack workers on few layers
3. **Total Presence** - Just have lots of workers placed

---

## APPROVED ACTIONS (7 total)

### Round 1 (4 actions)

#### 1. AMPLIFY ⭐
```javascript
{
    id: 'purpleAmplify',
    title: '+1 🟣 per worker you\'ve placed',
    description: '(This round)',
    round: 1
}
```
**Strategy:** Sequencing - place this last in your turn for maximum benefit
**Range:** 0-3 purple typically
**Design Note:** Teaches sequencing mechanic clearly

---

#### 2. RAINBOW ⭐
```javascript
{
    id: 'purpleRainbow',
    title: 'Gain 1 resource of each color',
    description: '(Where you have workers, max 5)',
    round: 1
}
```
**Strategy:** Diversity - spread across layers
**Range:** 1-5 different resources
**Design Note:** Unique effect, doesn't give purple but creates interesting play pattern

---

#### 3. SYNERGY ⭐
```javascript
{
    id: 'purpleSynergy',
    title: 'Choose layer: +1 🟣 +2 color per worker',
    description: '(Per worker you have there)',
    round: 1
}
```
**Strategy:** Concentration - target specific layer
**Example:** 3 workers on Red = 3 purple + 6 red
**Design Note:** Player choice creates interesting targeting decision

---

#### 4. PRESENCE ⭐
```javascript
{
    id: 'purplePresence',
    title: '+1 🟣 per worker on board',
    description: '(Min 2)',
    round: 1
}
```
**Strategy:** Total presence - just have workers placed
**Range:** 2-8 purple across full game
**Design Note:** Reliable baseline option that stays thematic

---

### Round 2 (2 actions)

#### 5. MAXIMIZE ⭐
```javascript
{
    id: 'purpleMaximize',
    title: '+3 🟣 per worker on best layer',
    description: '(Your most-populated layer)',
    round: 2
}
```
**Strategy:** Concentration - big payoff for stacking
**Range:** 3-9 purple typically
**Design Note:** Scaled-up concentration reward

---

#### 6. NETWORK ⭐
```javascript
{
    id: 'purpleNetwork',
    title: '+1 resource per worker on board',
    description: '(Any colors, your workers)',
    round: 2
}
```
**Strategy:** Total presence - converts workers to resources
**Range:** 3-10 resources
**Design Note:** Pure flexibility, universally useful

---

### Round 3 (1 action)

#### 7. MASTER PLACEMENT ⭐
```javascript
{
    id: 'purpleMaster',
    title: '+2 VP per different layer',
    description: '(Where you have workers)',
    round: 3
}
```
**Strategy:** Diversity - rewards spreading all game
**Range:** 4-16 VP (2-8 layers)
**Design Note:** Clear identity, strong climactic payoff

---

## SHOPS (Need Rework) ❌

**Current proposals NOT approved:**
- Shop 1: Quick Boost - Too boring
- Shop 2: Amplified Positioning - Okay but not exciting
- Shop 3: Network Mastery - Functional but uninspired

**Design Goals for New Shop Proposals:**
- Should feel like "worker efficiency" benefits
- Should create interesting decisions
- Should scale appropriately with cost
- Need more creative mechanics

**Ideas to Explore:**
- Worker enhancement (make workers more powerful)
- Positioning manipulation (move workers, swap positions)
- Combo effects (trigger multiple workers)
- Resource conversion engines
- VP bonuses tied to positioning

---

## VP SHOP (Tentative)

**Proposed:**
```javascript
{
    cost: '7 purple',
    vp: '6 + 1 per worker on board'
}
```
**Range:** 11-16 VP typically
**Status:** Needs review alongside shop redesign

**Current Purple VP Shop (for reference):**
```javascript
{
    cost: '6 purple',
    vp: 5
}
```

---

## Implementation Notes

**Files to Modify:**
- `src/data/allGameLayers.js` - Action definitions
- `src/data/shopData.js` - Shop definitions and VP shop
- `src/App.jsx` - executeAction() function (new action implementations)
- `src/App.jsx` - executeShopBenefit() function (new shop implementations)

**Code Removals Needed:**
- Remove "play more workers" state management
- Remove "skip turn" / "extra turn" logic
- Remove "take back worker" logic
- Clean up purple-specific critical rules (#4)

**Testing Focus:**
- Test all 7 actions work correctly
- Verify counting logic (workers on layers, different layers, etc.)
- Test Red interactions (repeating actions should be fine now)
- Verify shops work as intended (once redesigned)

---

## Alternative Action Ideas (Not Selected)

### Round 1 Alternatives:
- **Cascade** - +2 🟣 per worker placed, max +8 (stronger but capped)
- **Spread** - +1 🟣 per different layer (simpler than Rainbow but less interesting)
- **Focus** - +3 🟣 if 2+ workers on same layer, else +1 (too binary)
- **Efficient** - Gain 2 🟣 + 2 resources (boring, doesn't fit theme)

### Round 2 Alternatives:
- **Monopoly** - If 3+ workers on one layer: +8 🟣 and +3 VP (too swingy)
- **Stronghold** - Choose layer with 2+ workers, double that color (too powerful)
- **Orchestrate** - +3 VP + 1 VP per different layer (no resources/purple)
- **Web** - +2 🟣 per worker, convert purple→any (complex two-step)

### Round 3 Alternatives:
- **Perfect Network** - +3 VP per worker on best layer, +1 per other (might be too strong)
- **Grand Efficiency** - +10 VP if 5+ layers, else +4 VP (too swingy)
- **Culmination** - Workers = VP + resources (might be too strong, no strategic preference)

---

## Design Philosophy

**What Makes These Actions Good:**
1. **Clear counting** - "Count X, get Y" is easy to understand
2. **Visible game state** - No hidden information, count workers on board
3. **Strategic choices** - Diversity vs concentration creates real decisions
4. **Clean interactions** - No breaking combos with Red or other layers
5. **Sequencing matters** - When you place purple worker creates tactical depth
6. **Scales naturally** - R1→R2→R3 feels like natural progression

**Avoided Pitfalls:**
- ❌ No turn manipulation (skip/extra turns)
- ❌ No complex state tracking (play more workers)
- ❌ No confusing timing (take back workers)
- ❌ No breaking combos (with Red repeats)
- ❌ No hidden information (everything countable from board)

---

## Next Steps

1. ✅ Actions designed and approved
2. ❌ Redesign shops with more creative mechanics
3. ⏸️ Review VP shop alongside new shops
4. ⏸️ Create implementation plan once shops finalized
5. ⏸️ Implement in code
6. ⏸️ Test thoroughly (especially Red interactions)
7. ⏸️ Playtest and balance

---

## Questions to Resolve

- Should VP shop be variable (based on positioning) or fixed?
- How powerful should shops be compared to actions?
- Should shops enhance workers or provide direct benefits?
- Any other layers need review while we're redesigning purple?

---

**Status:** Ready to revisit shop design when ready
