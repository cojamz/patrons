import React from 'react';
import { useGame } from '../GameContext';

const Shop = ({ color, type }) => {
  const { state, dispatch } = useGame();
  
  const shopData = {
    regular: {
      red: {
        1: { cost: { red: 1, any: 1 }, effect: 'Repeat a worker\'s action' },
        2: { cost: { red: 2, any: 2 }, effect: 'Place the next player\'s worker' }
      },
      yellow: {
        1: { cost: { yellow: 1, any: 1 }, effect: 'Double next gain' },
        2: { cost: { yellow: 2, any: 2 }, effect: 'Gain 4 cubes any colors + everyone gains cube of your choice' }
      },
      blue: {
        1: { cost: { blue: 1, any: 1 }, effect: 'Close any shop this round' },
        2: { cost: { blue: 2, any: 2 }, effect: 'Undo the last player\'s turn' }
      },
      purple: {
        1: { cost: { purple: 1, any: 1 }, effect: 'Take an extra turn after this one' },
        2: { cost: { purple: 2, any: 2 }, effect: 'Needs new effect (old one moved to R3)' }
      }
    },
    victory: {
      red: { cost: { red: 5 }, vp: 3 },
      yellow: { cost: { any: 7 }, vp: 3 },
      blue: { cost: { blue: 5 }, vp: 3 },
      purple: { cost: { purple: 5 }, vp: 3 }
    }
  };
  
  const getShopStyle = () => {
    if (type === 'victory') {
      return "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 rounded-lg p-3";
    }
    return "bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-3";
  };
  
  const handlePurchase = (round = null) => {
    const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
    
    if (type === 'victory') {
      // Victory point purchase logic
      const shopInfo = shopData.victory[color];
      // Add purchase logic here
      console.log(`Attempting to buy victory points from ${color} shop`);
    } else {
      // Regular shop purchase logic
      const shopInfo = shopData.regular[color][round];
      // Add purchase logic here
      console.log(`Attempting to buy ${color} shop round ${round}`);
    }
  };
  
  if (type === 'victory') {
    const shopInfo = shopData.victory[color];
    return (
      <div className={getShopStyle()}>
        <div className="text-center">
          <div className="font-bold text-green-700 mb-2">🏆 Victory Shop</div>
          <div className="text-sm mb-2">
            <strong>{color === 'yellow' ? '7 Any Color' : `5 ${color.charAt(0).toUpperCase() + color.slice(1)}`}:</strong> {shopInfo.vp} Victory Points
          </div>
          <button 
            onClick={() => handlePurchase()}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            Buy VP
          </button>
        </div>
      </div>
    );
  }
  
  // Regular shop
  const round1Shop = shopData.regular[color][1];
  const round2Shop = shopData.regular[color][2];
  
  return (
    <div className={getShopStyle()}>
      <div className="text-center">
        <div className="font-bold text-yellow-700 mb-2">🛒 {color.charAt(0).toUpperCase() + color.slice(1)} Shop</div>
        
        <div className="text-xs mb-2">
          <div className="mb-1">
            <strong>Round 1:</strong> {round1Shop.effect}
          </div>
          <button 
            onClick={() => handlePurchase(1)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors mr-1"
          >
            Buy R1
          </button>
        </div>
        
        {state.round >= 2 && (
          <div className="text-xs">
            <div className="mb-1">
              <strong>Round 2:</strong> {round2Shop.effect}
            </div>
            <button 
              onClick={() => handlePurchase(2)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors"
              disabled={color === 'purple'}
            >
              {color === 'purple' ? 'TBD' : 'Buy R2'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;