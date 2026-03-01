/**
 * Modal — Base modal with glassmorphism "Divine Antiquity" styling.
 *
 * Dark glass panel with warm border, animated entrance/exit.
 * All other modals compose this as their shell.
 *
 * Props:
 *   isOpen     — controls visibility (AnimatePresence key)
 *   onClose    — called on backdrop click (null = not dismissible)
 *   title      — header text in cream/gold
 *   children   — modal body content
 *   godColor   — optional god color key ('gold', 'black', 'green', 'yellow')
 *                 tints the title bar accent line
 *   wide       — optional, renders wider modal for content-heavy views
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { godColors, base } from '../../styles/theme';
import { modalBackdrop, modalContent } from '../../styles/animations';

export default function Modal({ isOpen, onClose, title, children, godColor, wide = false }) {
  const accent = godColor ? godColors[godColor] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            backgroundColor: 'rgba(12, 10, 9, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={onClose || undefined}
        >
          {/* Content panel */}
          <motion.div
            className={`relative flex flex-col rounded-xl ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'} max-h-[85vh] mx-4`}
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(28, 25, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* God-colored accent line at top */}
            {accent && (
              <div
                className="absolute top-0 left-4 right-4 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent.primary}, transparent)`,
                  opacity: 0.6,
                }}
              />
            )}

            {/* Title bar */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2
                  className="text-lg font-semibold tracking-wide"
                  style={{
                    color: accent ? accent.text : base.textPrimary,
                  }}
                >
                  {title}
                </h2>

                {/* Close button (only if dismissible) */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150"
                    style={{
                      color: base.textMuted,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = base.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = base.textMuted;
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Divider */}
            {title && (
              <div
                className="mx-6 h-px"
                style={{ backgroundColor: base.divider }}
              />
            )}

            {/* Body — scrollable if content overflows */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
