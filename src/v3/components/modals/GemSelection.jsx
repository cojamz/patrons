/**
 * GemSelection — Resource picker modal for paying costs or choosing gains.
 *
 * Shows a grid of the 4 resource types with large clickable gem icons.
 * Player increments/decrements each type. Can't exceed what they own.
 * Submit enabled only when selection matches the required count.
 *
 * Props:
 *   decision  — { type: 'gemSelection', count: N, title: string }
 *   onSubmit  — called with { gold: N, black: N, green: N, yellow: N }
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import Modal from './Modal';
import ResourceIcon from '../icons/ResourceIcon';
import { useGame } from '../../hooks/useGame';
import { godColors, base } from '../../styles/theme';
import { cardReveal } from '../../styles/animations';

const RESOURCE_ORDER = ['gold', 'black', 'green', 'yellow'];

export default function GemSelection({ decision, onSubmit, onCancel }) {
  const { game } = useGame();

  // Find the player who must decide
  const player = useMemo(() => {
    if (!game) return null;
    const pid = decision._playerId ?? game.currentPlayer;
    return game.players.find(p => p.id === pid);
  }, [game, decision]);

  const [selection, setSelection] = useState({ gold: 0, black: 0, green: 0, yellow: 0 });
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  const required = decision.count || 0;

  // Filter to only active god colors
  const activeResources = useMemo(() => {
    if (!game) return RESOURCE_ORDER;
    const gods = game.gods || RESOURCE_ORDER;
    return RESOURCE_ORDER.filter(r => gods.includes(r));
  }, [game]);

  // Detect if this is a "pay" selection (limited by owned) or "gain" (unlimited)
  const isStealSelection = !!decision._isSteal;
  const isPaySelection = useMemo(() => {
    if (isStealSelection) return false;
    const title = (decision.title || '').toLowerCase();
    return title.includes('pay') || title.includes('trade') || title.includes('spend') || title.includes('cost');
  }, [decision.title, isStealSelection]);

  // For steal selections, use target's resources as limits
  const targetResources = decision.targetResources || null;

  // Total resources the player actually owns (for pay selections)
  const totalOwned = useMemo(() => {
    if (!player) return 0;
    return Object.values(player.resources || {}).reduce((sum, v) => sum + v, 0);
  }, [player]);

  const cannotAfford = isPaySelection && totalOwned < required;

  // Auto-skip: if this is a pay/trade selection and the player has 0 resources, auto-submit empty
  useEffect(() => {
    if (!isPaySelection || required === 0) return;
    if (!player) return;
    if (totalOwned === 0) {
      onSubmit({});
    }
  }, [isPaySelection, required, player, totalOwned, onSubmit]);

  const increment = (type) => {
    if (total >= required) return;
    // Limit by owned resources when paying, or target resources when stealing
    if (isPaySelection) {
      const owned = player?.resources?.[type] || 0;
      if (selection[type] >= owned) return;
    }
    if (isStealSelection && targetResources) {
      const available = targetResources[type] || 0;
      if (selection[type] >= available) return;
    }
    setSelection(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrement = (type) => {
    if (selection[type] <= 0) return;
    setSelection(prev => ({ ...prev, [type]: prev[type] - 1 }));
  };

  const canSubmit = total === required || (cannotAfford && total === totalOwned && total > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Only send non-zero entries
    const answer = {};
    for (const [key, val] of Object.entries(selection)) {
      if (val > 0) answer[key] = val;
    }
    onSubmit(answer);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={(decision.title || `Choose ${required} blessing${required !== 1 ? 's' : ''}`).replace(/\bGlory\b/g, 'Favor').replace(/\bresources\b/gi, 'blessings').replace(/\bresource\b/gi, 'blessing')}
      godColor={decision._godColor}
    >
      {/* Selection counter */}
      <div className="flex items-center justify-center mb-5">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: canSubmit ? base.positiveLight : base.textPrimary }}
        >
          {total}
        </span>
        <span className="text-lg mx-2" style={{ color: base.textMuted }}>/</span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: base.textSecondary }}>
          {required}
        </span>
        <span className="text-sm ml-2" style={{ color: base.textMuted }}>selected</span>
      </div>

      {/* Insufficient resources warning */}
      {cannotAfford && (
        <div
          className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            border: '1px solid rgba(225, 29, 72, 0.2)',
            color: base.negativeLight,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7" cy="10" r="0.5" fill="currentColor" />
          </svg>
          Not enough blessings — need {required} but you only have {totalOwned}
        </div>
      )}

      {/* Resource grid */}
      <div className="grid grid-cols-2 gap-3">
        {activeResources.map((type, i) => {
          const colors = godColors[type];
          const owned = player?.resources?.[type] || 0;
          const targetOwned = targetResources?.[type] || 0;
          const selected = selection[type];
          const atMax = total >= required || (isPaySelection && selected >= owned) || (isStealSelection && selected >= targetOwned);
          const isEmpty = isPaySelection && owned === 0;

          return (
            <motion.div
              key={type}
              custom={i}
              variants={cardReveal}
              initial="initial"
              animate="animate"
              className="flex flex-col items-center rounded-lg p-4 transition-colors duration-150"
              style={{
                backgroundColor: selected > 0 ? colors.surface : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${selected > 0 ? colors.border : 'rgba(255, 255, 255, 0.05)'}`,
                opacity: isEmpty ? 0.3 : 1,
              }}
            >
              {/* Resource color name */}
              <span
                className="text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: colors.text, opacity: 0.7 }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>

              {/* Large gem icon */}
              <div className="relative mb-2">
                <ResourceIcon type={type} size={48} glow={selected > 0} />
              </div>

              {/* Owned count */}
              <span className="text-xs mb-3" style={{ color: base.textMuted }}>
                {isStealSelection ? 'They have: ' : 'You have: '}
                <span style={{ color: colors.text }}>{isStealSelection ? targetOwned : owned}</span>
              </span>

              {/* Increment / decrement controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrement(type)}
                  disabled={selected <= 0}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold transition-all duration-150"
                  style={{
                    backgroundColor: selected > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    color: selected > 0 ? base.textPrimary : base.textMuted,
                    border: `1px solid ${selected > 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}`,
                    cursor: selected > 0 ? 'pointer' : 'default',
                    opacity: selected > 0 ? 1 : 0.4,
                  }}
                >
                  -
                </button>

                <span
                  className="text-xl font-bold tabular-nums w-6 text-center"
                  style={{ color: selected > 0 ? colors.text : base.textMuted }}
                >
                  {selected}
                </span>

                <button
                  onClick={() => increment(type)}
                  disabled={atMax}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold transition-all duration-150"
                  style={{
                    backgroundColor: !atMax ? colors.surface : 'rgba(255, 255, 255, 0.03)',
                    color: !atMax ? colors.text : base.textMuted,
                    border: `1px solid ${!atMax ? colors.border : 'rgba(255, 255, 255, 0.05)'}`,
                    cursor: !atMax ? 'pointer' : 'default',
                    opacity: !atMax ? 1 : 0.4,
                  }}
                >
                  +
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-5 flex justify-center gap-3">
        {cannotAfford && (
          <motion.button
            onClick={() => onSubmit({})}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: base.negativeLight,
              border: '1px solid rgba(225, 29, 72, 0.25)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.97 }}
          >
            Skip
          </motion.button>
        )}
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-8 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
          style={{
            backgroundColor: canSubmit
              ? (decision._godColor ? godColors[decision._godColor].primary : 'rgba(212, 168, 67, 0.9)')
              : 'rgba(255, 255, 255, 0.05)',
            color: canSubmit ? base.textDark : base.textMuted,
            cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit ? '0 4px 16px rgba(0, 0, 0, 0.3)' : 'none',
          }}
          whileHover={canSubmit ? { scale: 1.03 } : {}}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
        >
          {cannotAfford && total > 0 ? `Pay ${total} of ${required}` : 'Confirm Selection'}
        </motion.button>
      </div>
    </Modal>
  );
}
