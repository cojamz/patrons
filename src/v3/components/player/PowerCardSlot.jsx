/**
 * PowerCardSlot — Owned power card in the player panel.
 *
 * These are trophies. Each card is a miniature collectible with:
 *   - God-colored card frame with inset border
 *   - Prominent icon in a glowing medallion
 *   - Card name and god attribution
 *   - Hover reveals full description in a rich tooltip
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { godColors, base, godMeta } from '../../styles/theme';
import { powerCards } from '../../../engine/v3/data/powerCards';
import CardPixelIcon from '../icons/CardPixelIcon';

export default function PowerCardSlot({ cardId, slotIndex, isEmpty, isTriggered = false }) {
  const [hovered, setHovered] = useState(false);

  if (isEmpty || !cardId) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg"
        style={{
          width: '110px',
          height: '72px',
          border: '1.5px dashed rgba(168, 162, 158, 0.1)',
          background: 'rgba(255, 255, 255, 0.008)',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          border: '1.5px dashed rgba(168, 162, 158, 0.1)',
          marginBottom: '4px',
        }} />
        <span style={{ fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', color: base.textMuted, opacity: 0.2 }}>
          Empty
        </span>
      </div>
    );
  }

  const card = powerCards[cardId];
  if (!card) return null;

  const colors = godColors[card.god] || godColors.gold;
  const meta = godMeta[card.god];

  return (
    <>
      <motion.div
        className="relative rounded-lg"
        initial={{ opacity: 0, scale: 0.7, rotateY: -15 }}
        animate={isTriggered ? {
          opacity: 1,
          scale: [1, 1.08, 1],
          rotateY: 0,
        } : {
          opacity: 1,
          scale: 1,
          rotateY: 0,
        }}
        transition={isTriggered
          ? { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
          : { type: 'spring', stiffness: 250, damping: 20, delay: slotIndex * 0.1 }
        }
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '110px',
          height: '72px',
          flexShrink: 0,
          cursor: 'default',
          perspective: '600px',
        }}
      >
        {/* Card frame — layered borders for depth */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={isTriggered ? {
            boxShadow: [
              `0 2px 12px rgba(0,0,0,0.5), 0 0 1px ${colors.primary}44, 0 0 0px ${colors.primary}00`,
              `0 2px 12px rgba(0,0,0,0.5), 0 0 20px ${colors.primary}, 0 0 30px ${colors.glow}`,
              `0 2px 12px rgba(0,0,0,0.5), 0 0 1px ${colors.primary}44, 0 0 0px ${colors.primary}00`,
            ],
            borderColor: [colors.primary + '55', colors.light, colors.primary + '55'],
          } : {}}
          transition={isTriggered ? { duration: 0.8 } : {}}
          style={{
            background: `linear-gradient(160deg, ${colors.primary}40 0%, ${colors.primary}15 40%, rgba(12,10,9,0.95) 100%)`,
            border: `1.5px solid ${colors.primary}55`,
            boxShadow: `
              0 2px 12px rgba(0,0,0,0.5),
              0 0 1px ${colors.primary}44,
              inset 0 0 0 1px rgba(255,255,255,0.03)
            `,
          }}
        />

        {/* Inner frame inset */}
        <div
          className="absolute rounded pointer-events-none"
          style={{
            top: '3px', left: '3px', right: '3px', bottom: '3px',
            border: `1px solid ${colors.primary}22`,
            borderRadius: '5px',
          }}
        />

        {/* God glow — top-left radial */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${colors.glow} 0%, transparent 50%)`,
            opacity: 0.5,
          }}
        />

        {/* Content layout */}
        <div className="relative z-10 flex flex-col items-center h-full" style={{ padding: '6px 6px 4px' }}>
          {/* Icon medallion */}
          <div
            style={{
              width: '30px', height: '30px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.surface} 30%, rgba(0,0,0,0.5) 100%)`,
              border: `1.5px solid ${colors.primary}66`,
              boxShadow: `0 0 10px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CardPixelIcon
              cardId={cardId}
              size={22}
              color={colors.light}
              glowColor={colors.primary}
            />
          </div>

          {/* Card name */}
          <span style={{
            fontSize: '9px', fontWeight: 700, lineHeight: 1.1,
            color: colors.text, textAlign: 'center',
            marginTop: '3px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            {card.name}
          </span>

          {/* God attribution */}
          <span style={{
            fontSize: '7px', fontWeight: 600, lineHeight: 1,
            color: colors.primary, opacity: 0.6,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginTop: '1px',
          }}>
            {meta?.name || card.god}
          </span>
        </div>
      </motion.div>

      {/* Hover tooltip — portaled to body so transforms don't break fixed positioning */}
      {createPortal(
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: '280px',
                borderRadius: '12px',
                background: '#0a0908',
                border: `2px solid ${colors.primary}`,
                boxShadow: `0 20px 60px rgba(0, 0, 0, 1), 0 0 0 4px rgba(0, 0, 0, 0.9), 0 0 24px ${colors.glow}`,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Header with god color gradient */}
              <div style={{
                padding: '12px 16px 10px',
                background: `linear-gradient(135deg, ${colors.surface} 0%, rgba(12,10,9,0.9) 100%)`,
                borderBottom: `1px solid ${colors.primary}33`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.surface} 30%, rgba(0,0,0,0.5) 100%)`,
                    border: `1.5px solid ${colors.primary}55`,
                    boxShadow: `0 0 12px ${colors.glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CardPixelIcon cardId={cardId} size={28} color={colors.light} glowColor={colors.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                      {card.name}
                    </div>
                    <div style={{
                      fontSize: '9px', color: colors.primary, opacity: 0.7,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px',
                    }}>
                      {meta?.name || card.god} Power Card
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ padding: '10px 16px 14px' }}>
                <div style={{ fontSize: '12px', lineHeight: 1.6, color: base.textSecondary }}>
                  {card.description}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
