/**
 * ActionChoice — Action picker modal for repeat/copy mechanics.
 *
 * Shows a list of available actions the player can repeat or copy.
 * Each action displays its god icon, name, effect description, and
 * god-colored accent. Supports both single-pick and multi-pick modes.
 *
 * Props:
 *   decision  — { type: 'actionChoice' | 'actionChoices', options: [actionIds], count? }
 *   onSubmit  — called with actionId (single) or [actionIds] (multi)
 */
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Modal from './Modal';
import GodIcon from '../icons/GodIcon';
import { useGame } from '../../hooks/useGame';
import { godColors, base, godMeta } from '../../styles/theme';
import { cardReveal } from '../../styles/animations';
import gods from '../../../engine/v3/data/gods.js';

// Build a flat lookup of actionId -> action data
const actionLookup = {};
for (const god of Object.values(gods)) {
  for (const action of god.actions) {
    actionLookup[action.id] = { ...action, godColor: god.color, godName: god.name };
  }
}

export default function ActionChoice({ decision, onSubmit, onCancel }) {
  const { game } = useGame();
  const isMulti = decision.type === 'actionChoices';
  const maxCount = isMulti ? (decision.count || 1) : 1;

  // Single mode: one selected id. Multi mode: set of selected ids.
  const [selected, setSelected] = useState(isMulti ? new Set() : null);

  const actionOptions = useMemo(() => {
    return (decision.options || []).map(id => {
      const data = actionLookup[id];
      if (data) return data;
      // Fallback for unknown action ids
      return {
        id,
        name: id,
        effect: '',
        godColor: null,
        godName: 'Unknown',
        tier: 0,
      };
    });
  }, [decision.options]);

  const handleSelect = (actionId) => {
    if (isMulti) {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(actionId)) {
          next.delete(actionId);
        } else if (next.size < maxCount) {
          next.add(actionId);
        }
        return next;
      });
    } else {
      setSelected(actionId);
    }
  };

  const canSubmit = isMulti
    ? selected.size === maxCount
    : selected !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isMulti) {
      onSubmit(Array.from(selected));
    } else {
      onSubmit(selected);
    }
  };

  const title = isMulti
    ? (decision.title || `Choose ${maxCount} action${maxCount !== 1 ? 's' : ''} to repeat`)
    : (decision.title || 'Choose an action');

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={title}
      godColor={decision._godColor}
      wide={true}
    >
      {/* Selection counter for multi mode */}
      {isMulti && (
        <div className="flex items-center justify-center mb-4">
          <span
            className="text-xl font-bold tabular-nums"
            style={{ color: selected.size === maxCount ? base.positiveLight : base.textPrimary }}
          >
            {selected.size}
          </span>
          <span className="text-base mx-2" style={{ color: base.textMuted }}>/</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: base.textSecondary }}>
            {maxCount}
          </span>
          <span className="text-sm ml-2" style={{ color: base.textMuted }}>selected</span>
        </div>
      )}

      {/* Action list */}
      <div className="space-y-2">
        {actionOptions.map((action, i) => {
          const colors = action.godColor ? godColors[action.godColor] : null;
          const isChosen = isMulti ? selected.has(action.id) : selected === action.id;
          const isDisabled = isMulti && !isChosen && selected.size >= maxCount;

          return (
            <motion.button
              key={action.id}
              custom={i}
              variants={cardReveal}
              initial="initial"
              animate="animate"
              onClick={() => !isDisabled && handleSelect(action.id)}
              className="w-full text-left rounded-lg p-3.5 transition-all duration-150"
              style={{
                backgroundColor: isChosen
                  ? (colors ? colors.surface : 'rgba(255, 255, 255, 0.06)')
                  : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isChosen
                  ? (colors ? colors.border : 'rgba(255, 255, 255, 0.15)')
                  : 'rgba(255, 255, 255, 0.05)'}`,
                boxShadow: isChosen && colors
                  ? `0 0 16px ${colors.glow}, inset 0 0 16px ${colors.surface}`
                  : 'none',
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? 'default' : 'pointer',
              }}
              whileHover={!isDisabled ? {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: { duration: 0.15 },
              } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
              <div className="flex items-start gap-3">
                {/* God icon */}
                {action.godColor && (
                  <div className="flex-shrink-0 mt-0.5">
                    <GodIcon god={action.godColor} size={28} />
                  </div>
                )}

                {/* Action info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colors ? colors.text : base.textPrimary }}
                    >
                      {action.name}
                    </span>

                    {/* Tier badge */}
                    {action.tier > 0 && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: base.textMuted,
                        }}
                      >
                        {'I'.repeat(action.tier)}
                      </span>
                    )}

                    {/* Multi-select checkbox indicator */}
                    {isMulti && (
                      <div
                        className="ml-auto flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors duration-150"
                        style={{
                          borderColor: isChosen
                            ? (colors ? colors.primary : base.textPrimary)
                            : 'rgba(255, 255, 255, 0.15)',
                          backgroundColor: isChosen
                            ? (colors ? colors.primary : 'rgba(255, 255, 255, 0.2)')
                            : 'transparent',
                        }}
                      >
                        {isChosen && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke={base.textDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Effect description */}
                  {action.effect && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: base.textSecondary }}>
                      {action.effect}
                    </p>
                  )}

                  {/* God name label */}
                  {action.godColor && (
                    <span
                      className="text-[10px] mt-1.5 inline-block uppercase tracking-wider"
                      style={{ color: colors ? colors.primary : base.textMuted, opacity: 0.6 }}
                    >
                      {godMeta[action.godColor]?.name || action.godName}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-5 flex justify-center">
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
          {isMulti
            ? `Confirm ${selected.size} Action${selected.size !== 1 ? 's' : ''}`
            : 'Confirm Action'
          }
        </motion.button>
      </div>
    </Modal>
  );
}
