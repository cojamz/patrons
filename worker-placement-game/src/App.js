import React from 'react';
import { GameProvider, useGame } from './GameContext';
import GameLayer from './components/GameLayer';
import PlayerCard from './components/PlayerCard';
import './App.css';

const gameData = {
  red: {
    title: "Worker Manipulation",
    icon: "🔴",
    actions: [
      { id: 'gain3red', title: 'Gain 3 Red', description: 'Round 1', round: 1 },
      { id: 'gain2red', title: 'Gain 2 Red', description: 'Round 1', round: 1 },
      { id: 'redHybrid1', title: '+1 Red + Swap Workers', description: '(Both players get actions) - Round 1', round: 1 },
      { id: 'redRepeatAction', title: 'Repeat an Action', description: '(That one of your workers is on) - Round 1', round: 1 },
      { id: 'forceRedPlacement', title: 'Other Players Must Place on Red', description: '(Until red layer is full) - Round 2', round: 2 },
      { id: 'redHybrid2', title: '+1 Red + Swap Workers', description: '(Only you get action) - Round 2', round: 2 }
    ]
  },
  yellow: {
    title: "Resource Manipulation", 
    icon: "🟡",
    actions: [
      { id: 'gain3yellow', title: 'Gain 3 Different Colored Cubes', description: 'Round 1', round: 1 },
      { id: 'gain2yellow', title: 'Gain 2 Different Colored Cubes', description: 'Round 1', round: 1 },
      { id: 'stealCube', title: 'Steal 1 Cube', description: 'Round 1', round: 1 },
      { id: 'yellowHybrid1', title: '+1 Yellow + Trade 2 Cubes', description: '(For 2 any colors) - Round 1', round: 1 },
      { id: 'steal2Cubes', title: 'Steal 2 Cubes', description: '(From any player) - Round 2', round: 2 },
      { id: 'yellowHybrid2', title: '+1 Yellow + Double Next Gain', description: '(Doesn\'t stack with shop) - Round 2', round: 2 }
    ]
  },
  blue: {
    title: "Defense",
    icon: "🔵", 
    actions: [
      { id: 'gain3blue', title: 'Gain 3 Blue', description: 'Round 1', round: 1 },
      { id: 'gain2blue', title: 'Gain 2 Blue', description: 'Round 1', round: 1 },
      { id: 'blueHybrid1', title: '+1 Blue + Move Worker', description: '(They don\'t get benefit) - Round 1', round: 1 },
      { id: 'everyoneReturn1', title: 'Each Other Player Returns 1 Cube', description: 'Round 1', round: 1 },
      { id: 'blueHybrid2', title: '+1 Blue + Move 2 Workers', description: '(They don\'t get benefit) - Round 2', round: 2 },
      { id: 'everyoneReturn2', title: 'Each Other Player Returns 2 Cubes', description: 'Round 2', round: 2 }
    ]
  },
  purple: {
    title: "Timing/Order",
    icon: "🟣",
    actions: [
      { id: 'gain3purple', title: 'Gain 3 Purple', description: 'Round 1', round: 1 },
      { id: 'gain2purple', title: 'Gain 2 Purple', description: 'Round 1', round: 1 },
      { id: 'playTwoWorkers', title: 'Play Your Next Two Workers', description: 'Round 1', round: 1 },
      { id: 'purpleShopHybrid', title: '+1 Purple + Any Round 1 Shop Benefit', description: 'Round 1', round: 1 },
      { id: 'extraWorkers', title: 'Gain 2 Extra Workers Next Round', description: 'Round 2', round: 2 },
      { id: 'purpleHybrid2', title: '+1 Purple + Choose Turn Order', description: '(For next round) - Round 2', round: 2 }
    ]
  }
};

function GameBoard() {
  const { state, dispatch } = useGame();
  
  const handleEndTurn = () => {
    const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
    
    if (!state.workerPlacedThisTurn && currentPlayer.workersLeft > 0) {
      const confirmSkip = window.confirm('You haven\'t placed a worker this turn. Are you sure you want to end your turn?');
      if (!confirmSkip) return;
    }
    
    dispatch({ type: 'END_TURN' });
  };
  
  const handleAdvanceRound = () => {
    if (state.round < 3) {
      dispatch({ type: 'ADVANCE_ROUND' });
    } else {
      alert('Game is already at Round 3 (final round)');
    }
  };
  
  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  const totalWorkers = state.players.reduce((sum, p) => sum + p.workersLeft, 0);
  const totalSpaces = Object.values(gameData).reduce((sum, layer) => 
    sum + layer.actions.filter(action => action.round <= state.round).length, 0
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Worker Placement Game - Round {state.round}
          </h1>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="text-xl font-semibold text-blue-600 mb-2">
              Current Player: Player {state.currentPlayer}
            </div>
            <div className="text-gray-600">
              Round {state.round}: {totalWorkers} Workers | {totalSpaces} Action Spaces
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Snake Draft Order: {state.turnOrder.join(' → ')} → {state.turnOrder.slice().reverse().join(' → ')}
            </div>
          </div>
        </div>
        
        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {state.players.map(player => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              isCurrentPlayer={player.id === state.currentPlayer}
            />
          ))}
        </div>
        
        {/* Game Layers */}
        <div className="space-y-6 mb-8">
          {Object.entries(gameData).map(([color, data]) => (
            <GameLayer
              key={color}
              color={color}
              title={data.title}
              icon={data.icon}
              actions={data.actions}
              round={state.round}
            />
          ))}
        </div>
        
        {/* Control Buttons */}
        <div className="text-center">
          <button 
            onClick={handleEndTurn}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg mr-4 transition-colors"
          >
            End Turn
          </button>
          <button 
            onClick={handleAdvanceRound}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 transition-colors"
          >
            Advance to Round {Math.min(state.round + 1, 3)}
          </button>
          <button 
            onClick={handleResetGame}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Reset Game
          </button>
          <div className="text-sm text-gray-600 mt-4">
            Place worker → Buy from shops → End turn
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameBoard />
    </GameProvider>
  );
}

export default App;