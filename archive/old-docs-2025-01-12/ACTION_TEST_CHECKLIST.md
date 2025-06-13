# Patrons Game Action Test Checklist

## Testing Instructions
1. Open the game in a browser
2. Test each action and check it off when verified working
3. Note any issues found

## Red Actions (Worker Manipulation)
- [ ] **gain3red** - Should give 3 red gems + 1 VP
- [ ] **gain2red** - Should give 2 red gems + 1 VP
- [ ] **redHybrid1** - Should give 1 red + swap workers (both players get actions) + 1 VP
- [ ] **redHybrid2** - Should give 1 red + swap workers (only you get action) + 1 VP
- [ ] **redRepeatAction** - Should give 1 red + repeat one of your workers' actions + 1 VP
- [ ] **forceRedPlacement** - Should give 1 red + force others to place on red + 1 VP
- [ ] **redRepeatAll** - Should repeat all your workers' actions + 1 VP

## Yellow Actions (Resource Manipulation)
- [ ] **gain3yellow** - Should let you pick 3 different colored gems
- [ ] **gain2yellow** - Should let you pick 2 different colored gems
- [ ] **steal2Gems** - Should let you steal 2 gems from other players
- [ ] **steal3Gems** - Should let you steal 3 gems from other players
- [ ] **yellowHybrid1** - Should give 1 yellow + let you trade any number of gems
- [ ] **yellowHybrid2** - Should give 1 yellow + double your next gain
- [ ] **yellowSwapResources** - Should swap all resources with another player

## Blue Actions (Shop Control)
- [ ] **gain3blue** - Should give 3 blue gems
- [ ] **gain2blue** - Should give 2 blue gems
- [ ] **blueShopBenefit1** - Should give any shop benefit (even if closed)
- [ ] **blueShopBenefit2** - Should give any shop benefit (even if closed)
- [ ] **blueReduceCosts** - Should give 1 blue + reduce all shop costs by 1
- [ ] **blueIncreaseCosts** - Should give 2 blue + increase all shop costs by 1
- [ ] **blueFlipShops** - Should give 1 blue + flip all shop statuses

## Purple Actions (Timing/Order)
- [ ] **gain3purple** - Should give 3 purple gems
- [ ] **gain2purple** - Should give 2 purple gems
- [ ] **playTwoWorkers** - Should let you place 2 more workers this turn
  - UI should show "Can place 2 workers this turn!" 
  - Should be able to place 2 workers before ending turn
- [ ] **purpleShopHybrid** - Should give 1 purple + any R1 shop benefit
- [ ] **extraWorkers** - Should give 1 purple + 2 extra workers next round
- [ ] **purpleHybrid2** - Should give 1 purple + let you choose turn order for next round

## Automatic VP Systems
- [ ] **Red VP** - Get 1 VP each time you use any red action
- [ ] **Yellow VP** - Get VP at end of round based on gem diversity (1 VP per different color)
- [ ] **Blue VP** - All players get 1 VP when anyone uses any shop
- [ ] **Purple VP** - First player out of workers gets 3 VP, last player gets 3 VP

## Shop Effects
- [ ] **Red R1** - 1 red + 1 any = Repeat a worker's action
- [ ] **Red R2** - 2 red + 2 any = Place the next player's worker
- [ ] **Red R3** - 3 red + 3 any = Repeat all actions taken this round by any player
- [ ] **Yellow R1** - 1 yellow + 1 any = Double next gain
- [ ] **Yellow R2** - 2 yellow + 2 any = Gain 5 gems + everyone gains 1
- [ ] **Yellow R3** - 3 yellow + 3 any = Gain 9 gems + everyone gains 1 each
- [ ] **Blue R1** - 1 blue + 1 any = Close any shop this round
- [ ] **Blue R2** - 2 blue + 2 any = Gain shop benefit then close it
- [ ] **Blue R3** - 3 blue + 3 any = Flip all shop statuses
- [ ] **Purple R1** - 1 purple + 1 any = Take an extra turn

## Victory Shops
- [ ] **Red Victory** - 5 red = 3 VP
- [ ] **Yellow Victory** - 5 any = 3 VP
- [ ] **Blue Victory** - 5 blue = 3 VP
- [ ] **Purple Victory** - 6 purple = 3 VP

## Edge Cases to Test
- [ ] Infinite loop prevention (red repeat actions)
- [ ] Shop cost modifications affect all players
- [ ] Closed shops can still be accessed via blue actions
- [ ] VP hover shows breakdown by source
- [ ] Turn order changes take effect next round
- [ ] Extra workers apply in following round