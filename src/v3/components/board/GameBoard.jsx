/**
 * GameBoard — Main game layout for Patrons v3.
 *
 * Gods have two states: FOCUSED (full detail) and COLLAPSED (summary).
 * One god is focused at a time. Collapsed gods show occupation at a glance.
 * Clicking a collapsed god focuses it. Auto-focuses on interaction.
 *
 * Layout adapts: focused god gets more space, collapsed gods compress.
 */
import React, { useState, useCallback, useEffect } from 'react';
import GodArea from './GodArea';
import { useGame } from '../../hooks/useGame';
import { base } from '../../styles/theme';

const GOD_LAYOUT = ['gold', 'black', 'green', 'yellow'];

export default function GameBoard() {
  const { game } = useGame();
  const [focusedGod, setFocusedGod] = useState(null);

  const activeGods = game?.gods || GOD_LAYOUT;

  // Default focus to first god on mount
  useEffect(() => {
    if (activeGods.length > 0 && focusedGod === null) {
      setFocusedGod(activeGods[0]);
    }
  }, [activeGods, focusedGod]);

  // Auto-focus when a god is interacted with (track via godsAccessedThisTurn)
  useEffect(() => {
    if (!game) return;
    const accessed = game.godsAccessedThisTurn || [];
    if (accessed.length > 0) {
      const lastAccessed = accessed[accessed.length - 1];
      if (activeGods.includes(lastAccessed)) {
        setFocusedGod(lastAccessed);
      }
    }
  }, [game?.godsAccessedThisTurn?.length]);

  const handleFocus = useCallback((godColor) => {
    setFocusedGod(godColor);
  }, []);

  if (!game) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{ background: base.board, color: base.textMuted }}
      >
        <span className="text-lg">Waiting for game...</span>
      </div>
    );
  }

  // Compute grid layout based on god count and focus
  const godCount = activeGods.length;
  const getGridStyle = () => {
    if (godCount <= 2) {
      // Side by side: focused gets 3fr, collapsed gets 2fr
      return {
        gridTemplateColumns: activeGods.map(g =>
          g === focusedGod ? '3fr' : '2fr'
        ).join(' '),
        gridTemplateRows: '1fr',
      };
    }
    // 3-4 gods: vertical columns, accordion style — focused gets more width
    return {
      gridTemplateColumns: activeGods.map(g =>
        g === focusedGod ? '2.5fr' : '1fr'
      ).join(' '),
      gridTemplateRows: '1fr',
    };
  };

  return (
    <div
      className="relative w-full"
      style={{ background: base.board, height: 'calc(100vh - 208px)' }}
    >
      {/* Stone texture noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)',
          backgroundSize: '4px 4px',
          opacity: 0.6,
        }}
      />

      {/* Secondary texture layer for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.03) 0%, transparent 60%)',
        }}
      />

      {/* God grid with focus-aware sizing */}
      <div
        className="relative z-10 grid gap-3 p-3 w-full h-full"
        style={{
          ...getGridStyle(),
          transition: 'grid-template-columns 0.3s ease, grid-template-rows 0.3s ease',
        }}
      >
        {activeGods.map(godColor => (
          <GodArea
            key={godColor}
            godColor={godColor}
            isFocused={godColor === focusedGod}
            onFocus={() => handleFocus(godColor)}
          />
        ))}
      </div>
    </div>
  );
}
