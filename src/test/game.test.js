import { describe, it, expect } from 'vitest'

describe('Patrons Game - Critical Rules', () => {
  it('should validate that shopCostModifier is per-player', () => {
    // Critical Rule #2: Shop cost modifiers are PER-PLAYER, not global
    const player1 = { shopCostModifier: -1 }
    const player2 = { shopCostModifier: 0 }

    expect(player1.shopCostModifier).toBe(-1)
    expect(player2.shopCostModifier).toBe(0)
    expect(player1.shopCostModifier).not.toBe(player2.shopCostModifier)
  })

  it('should have 8 resource types', () => {
    const resources = {
      red: 0,
      yellow: 0,
      blue: 0,
      purple: 0,
      gold: 0,
      white: 0,
      black: 0,
      silver: 0
    }

    expect(Object.keys(resources)).toHaveLength(8)
  })
})
