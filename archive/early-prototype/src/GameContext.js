import React, { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  currentPlayer: 1,
  turnDirection: 1,
  players: [
    { id: 1, name: "Player 1", resources: { red: 0, yellow: 0, blue: 0, purple: 0 }, workersLeft: 4, effects: [], victoryPoints: 0 },
    { id: 2, name: "Player 2", resources: { red: 0, yellow: 0, blue: 0, purple: 0 }, workersLeft: 4, effects: [], victoryPoints: 0 },
    { id: 3, name: "Player 3", resources: { red: 0, yellow: 0, blue: 0, purple: 0 }, workersLeft: 4, effects: [], victoryPoints: 0 },
    { id: 4, name: "Player 4", resources: { red: 0, yellow: 0, blue: 0, purple: 0 }, workersLeft: 4, effects: [], victoryPoints: 0 }
  ],
  occupiedSpaces: {},
  round: 1,
  turnOrder: [1, 2, 3, 4],
  workerPlacedThisTurn: false
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'PLACE_WORKER':
      return {
        ...state,
        occupiedSpaces: {
          ...state.occupiedSpaces,
          [action.actionId]: state.currentPlayer
        },
        players: state.players.map(player => 
          player.id === state.currentPlayer 
            ? { ...player, workersLeft: player.workersLeft - 1 }
            : player
        ),
        workerPlacedThisTurn: true
      };
    
    case 'UPDATE_RESOURCES':
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.playerId 
            ? { ...player, resources: { ...player.resources, ...action.resources } }
            : player
        )
      };
    
    case 'ADD_EFFECT':
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.playerId 
            ? { ...player, effects: [...player.effects, action.effect] }
            : player
        )
      };
    
    case 'END_TURN':
      const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
      let nextPlayer;
      let nextDirection = state.turnDirection;
      
      if (state.turnDirection === 1) {
        if (currentIndex === state.turnOrder.length - 1) {
          nextDirection = -1;
          nextPlayer = state.currentPlayer;
        } else {
          nextPlayer = state.turnOrder[currentIndex + 1];
        }
      } else {
        if (currentIndex === 0) {
          nextDirection = 1;
          nextPlayer = state.currentPlayer;
        } else {
          nextPlayer = state.turnOrder[currentIndex - 1];
        }
      }
      
      return {
        ...state,
        currentPlayer: nextPlayer,
        turnDirection: nextDirection,
        workerPlacedThisTurn: false
      };
    
    case 'ADVANCE_ROUND':
      return {
        ...state,
        round: state.round + 1,
        players: state.players.map(player => ({
          ...player,
          workersLeft: 3 + (state.round + 1) + (player.extraWorkersNextRound || 0),
          extraWorkersNextRound: 0
        })),
        occupiedSpaces: {},
        currentPlayer: 1,
        turnDirection: 1,
        workerPlacedThisTurn: false
      };
    
    case 'RESET_GAME':
      return initialState;
    
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}