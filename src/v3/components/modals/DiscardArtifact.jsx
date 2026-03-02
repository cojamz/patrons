/**
 * DiscardArtifact — Modal for choosing which artifact to discard when
 * buying a new one at full capacity.
 *
 * Shows current artifacts as cards, highlights the new one being acquired.
 */
import React from 'react';
import { motion } from 'motion/react';
import Modal from './Modal';
import ArtifactImage from '../icons/ArtifactImage';
import { godColors, base } from '../../styles/theme';

export default function DiscardArtifact({ decision, onSubmit, onCancel }) {
  const options = decision.options || [];

  return (
    <Modal isOpen={true} title={decision.title || 'Replace an Artifact'} onClose={onCancel}>
      <p
        className="text-sm mb-4 text-center"
        style={{ color: base.textSecondary }}
      >
        Your artifact slots are full. Choose one to discard and replace.
      </p>

      {/* New artifact preview */}
      {decision.newCardId && (
        <div
          className="flex items-center gap-3 mb-5 p-3 rounded-lg"
          style={{
            background: 'rgba(220, 220, 240, 0.06)',
            border: '1px solid rgba(220, 220, 240, 0.15)',
          }}
        >
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: base.textMuted }}>
            New
          </span>
          <span className="text-sm font-semibold" style={{ color: '#E0E0F0' }}>
            {decision.title?.replace('Replace an artifact with ', '') || decision.newCardId}
          </span>
          {decision.description && (
            <span className="text-xs ml-auto" style={{ color: base.textMuted }}>
              {decision.description}
            </span>
          )}
        </div>
      )}

      {/* Current artifacts to choose from */}
      <div className="flex flex-col gap-2">
        {options.map(option => {
          const colors = godColors[option.god] || godColors.gold;

          return (
            <motion.button
              key={option.id}
              onClick={() => onSubmit(option.id)}
              className="flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-150"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${colors.primary}33`,
              }}
              whileHover={{
                backgroundColor: 'rgba(225, 29, 72, 0.08)',
                borderColor: 'rgba(225, 29, 72, 0.3)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <ArtifactImage cardId={option.id} size={32} color={colors.light} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: colors.light }}>
                  {option.name}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: base.textMuted }}
                >
                  {option.description}
                </div>
              </div>
              <span
                className="text-[10px] uppercase tracking-wider font-semibold flex-shrink-0 px-2 py-1 rounded"
                style={{
                  color: 'rgba(225, 29, 72, 0.8)',
                  background: 'rgba(225, 29, 72, 0.1)',
                }}
              >
                Discard
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-full mt-4 py-2 text-xs font-medium uppercase tracking-wider rounded-lg transition-colors duration-150"
        style={{
          color: base.textMuted,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        Cancel
      </button>
    </Modal>
  );
}
