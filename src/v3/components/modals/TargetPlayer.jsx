/**
 * TargetPlayer — Player targeting modal for steal/interaction actions.
 *
 * Shows targetable players as cards with name, favor, and resource totals
 * so the player can make an informed targeting decision.
 *
 * Props:
 *   decision  — { type: 'targetPlayer', playerId, options: [playerIds] }
 *   onSubmit  — called with the selected player id
 */
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Modal from './Modal';
import ResourceIcon from '../icons/ResourceIcon';
import WorkerIcon from '../icons/WorkerIcon';
import { useGame } from '../../hooks/useGame';
import { godColors, playerColors, base } from '../../styles/theme';
import { cardReveal } from '../../styles/animations';

export default function TargetPlayer({ decision, onSubmit, onCancel }) {
  const { game } = useGame();
  const [selected, setSelected] = useState(null);

  const targetPlayers = useMemo(() => {
    if (!game) return [];
    const options = decision.options || [];
    return game.players
      .filter(p => options.includes(p.id))
      .map(p => ({
        ...p,
        totalResources: Object.values(p.resources || {}).reduce((s, v) => s + v, 0),
      }));
  }, [game, decision]);

  const activeResources = useMemo(() => {
    if (!game) return ['gold', 'black', 'green', 'yellow'];
    return game.activeGods || ['gold', 'black', 'green', 'yellow'];
  }, [game]);

  const handleSubmit = () => {
    if (selected === null) return;
    onSubmit(selected);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={decision.title || 'Choose a target'}
      godColor={decision._godColor}
    >
      <div className="space-y-3">
        {targetPlayers.map((player, i) => {
          const pColors = playerColors[player.id] || playerColors[0];
          const isSelected = selected === player.id;

          return (
            <motion.button
              key={player.id}
              custom={i}
              variants={cardReveal}
              initial="initial"
              animate="animate"
              onClick={() => setSelected(player.id)}
              className="w-full text-left rounded-lg p-4 transition-all duration-150"
              style={{
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelected ? pColors.primary : 'rgba(255, 255, 255, 0.05)'}`,
                boxShadow: isSelected ? `0 0 20px ${pColors.primary}20, inset 0 0 20px ${pColors.primary}08` : 'none',
                cursor: 'pointer',
              }}
              whileHover={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: { duration: 0.15 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                {/* Left: player identity */}
                <div className="flex items-center gap-3">
                  <WorkerIcon playerId={player.id} size={28} />
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: pColors.light }}
                    >
                      {player.name || pColors.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.25L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
                          fill="#E8C547"
                          opacity="0.8"
                        />
                      </svg>
                      <span
                        className="text-xs font-medium tabular-nums"
                        style={{ color: godColors.yellow.text }}
                      >
                        {player.glory ?? 0} Favor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: resource breakdown */}
                <div className="flex items-center gap-2">
                  {activeResources.map(type => (
                    <div key={type} className="flex items-center gap-1">
                      <ResourceIcon type={type} size={14} />
                      <span
                        className="text-xs tabular-nums font-medium"
                        style={{ color: godColors[type].text, opacity: 0.8 }}
                      >
                        {player.resources?.[type] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total resources bar */}
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((player.totalResources / 20) * 100, 100)}%`,
                      backgroundColor: pColors.primary,
                      opacity: 0.5,
                    }}
                  />
                </div>
                <span className="text-[10px] tabular-nums" style={{ color: base.textMuted }}>
                  {player.totalResources} total
                </span>
              </div>
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
              ? (playerColors[selected]?.primary || 'rgba(212, 168, 67, 0.9)')
              : 'rgba(255, 255, 255, 0.05)',
            color: selected !== null ? '#1C1917' : base.textMuted,
            cursor: selected !== null ? 'pointer' : 'default',
            boxShadow: selected !== null ? '0 4px 16px rgba(0, 0, 0, 0.3)' : 'none',
          }}
          whileHover={selected !== null ? { scale: 1.03 } : {}}
          whileTap={selected !== null ? { scale: 0.97 } : {}}
        >
          {selected !== null
            ? `Target ${(game?.players.find(p => p.id === selected)?.name) || playerColors[selected]?.name || 'Player'}`
            : 'Select a Player'
          }
        </motion.button>
      </div>
    </Modal>
  );
}
