/**
 * ChooseColor — Color selection modal for Distill, Plunder, etc.
 *
 * Shows available colors as styled buttons with god-themed colors.
 *
 * Props:
 *   decision  — { type: 'chooseColor', options: [colorStrings], title, targetResources?, playerResources? }
 *   onSubmit  — called with the selected color string
 *   onCancel  — cancel handler
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import Modal from './Modal';
import ResourceIcon from '../icons/ResourceIcon';
import { useGame } from '../../hooks/useGame';
import { godColors, base } from '../../styles/theme';
import { cardReveal } from '../../styles/animations';

export default function ChooseColor({ decision, onSubmit, onCancel }) {
  const { game } = useGame();
  const [selected, setSelected] = useState(null);
  const options = decision.options || [];
  const targetResources = decision.targetResources || {};
  const playerResources = decision.playerResources || {};

  const handleSubmit = () => {
    if (selected === null) return;
    onSubmit(selected);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={decision.title || 'Choose a color'}
      godColor={decision._godColor}
    >
      <div className="grid grid-cols-2 gap-3">
        {options.map((color, i) => {
          const colors = godColors[color] || godColors.gold;
          const isSelected = selected === color;
          const resourceCount = targetResources[color] || playerResources[color] || null;

          return (
            <motion.button
              key={color}
              custom={i}
              variants={cardReveal}
              initial="initial"
              animate="animate"
              onClick={() => setSelected(color)}
              className="flex flex-col items-center gap-2 rounded-lg p-4 transition-all duration-150"
              style={{
                backgroundColor: isSelected ? `${colors.surface}` : 'rgba(255, 255, 255, 0.02)',
                border: `1.5px solid ${isSelected ? colors.primary : 'rgba(255, 255, 255, 0.06)'}`,
                boxShadow: isSelected
                  ? `0 0 20px ${colors.glow}, inset 0 0 12px ${colors.glow}`
                  : 'none',
                cursor: 'pointer',
              }}
              whileHover={{
                backgroundColor: `${colors.surface}`,
                transition: { duration: 0.15 },
              }}
              whileTap={{ scale: 0.95 }}
            >
              <ResourceIcon type={color} size={28} />
              <span
                className="text-sm font-semibold capitalize"
                style={{ color: colors.text }}
              >
                {color}
              </span>
              {resourceCount !== null && (
                <span
                  className="text-xs tabular-nums"
                  style={{ color: base.textMuted }}
                >
                  ({resourceCount} available)
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="mt-5 flex justify-center">
        <motion.button
          onClick={handleSubmit}
          disabled={selected === null}
          className="px-8 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
          style={{
            backgroundColor: selected !== null
              ? (godColors[selected]?.primary || 'rgba(212, 168, 67, 0.9)')
              : 'rgba(255, 255, 255, 0.05)',
            color: selected !== null ? '#1C1917' : base.textMuted,
            cursor: selected !== null ? 'pointer' : 'default',
            boxShadow: selected !== null
              ? `0 4px 16px rgba(0, 0, 0, 0.3), 0 0 12px ${godColors[selected]?.glow || 'transparent'}`
              : 'none',
          }}
          whileHover={selected !== null ? { scale: 1.03 } : {}}
          whileTap={selected !== null ? { scale: 0.97 } : {}}
        >
          {selected !== null
            ? `Choose ${selected.charAt(0).toUpperCase() + selected.slice(1)}`
            : 'Select a Color'
          }
        </motion.button>
      </div>
    </Modal>
  );
}
