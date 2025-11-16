// @ts-check
import React, { useState, useContext, createContext, useReducer, useEffect } from 'react';
import './firebase-compat.js';
import { PLAYER_EMOJIS, COLOR_EMOJIS, RESOURCE_TYPES, QUAD_NAMES, MAX_RECONNECT_ATTEMPTS, INITIAL_RECONNECT_DELAY, getRandomPlayerEmojis } from './data/constants.js';
import { allGameLayers, selectGameLayers } from './data/allGameLayers.js';
import { shopData, shopCosts, vpShopData } from './data/shopData.js';
import { gameReducer, initialState } from './state/gameReducer.js';

/**
 * @typedef {Object} Resources
 * @property {number} red
 * @property {number} yellow
 * @property {number} blue
 * @property {number} purple
 * @property {number} gold
 * @property {number} white
 * @property {number} black
 * @property {number} silver
 */

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} emoji
 * @property {Resources} resources
 * @property {number} workersLeft
 * @property {string[]} effects
 * @property {number} victoryPoints
 * @property {Object.<string, number>} vpSources
 * @property {number} shopCostModifier - PER-PLAYER shop cost modifier (NOT global!)
 */

/**
 * @typedef {Object} GameState
 * @property {number} currentPlayer
 * @property {number} turnDirection
 * @property {('basic'|'advanced'|null)} gameMode
 * @property {Player[]} players
 * @property {Object.<string, number>} occupiedSpaces
 * @property {number} round
 * @property {number[]} turnOrder
 * @property {boolean} workerPlacedThisTurn
 * @property {number} workersToPlace
 * @property {boolean} shopUsedAfterWorkers
 * @property {any} modal
 * @property {any[]} actionLog
 * @property {any} gameLayers
 * @property {Object.<string, boolean>} automaticVPs
 * @property {Object.<string, boolean>} closedShops
 * @property {Object.<number, number>} skippedTurns
 * @property {number[]} playersOutOfWorkers
 * @property {Object.<number, boolean>} waitingForOthers
 * @property {any[]} roundActions
 * @property {boolean} roundAdvancing
 * @property {string|null} roomCode
 * @property {number|null} myPlayerId
 * @property {string} myPlayerName
 * @property {Object} connectedPlayers
 * @property {boolean} isHost
 * @property {boolean} gameStarted
 * @property {string} connectionStatus
 * @property {boolean} gameOver
 * @property {boolean} syncingFromFirebase
 * @property {number} stateVersion
 * @property {any[]} notifications
 * @property {Object} pendingPlacements
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB0c0iUOG3llUzLd9FhQ6Qc1qCB0DoajVw",
    authDomain: "cornycolonies.firebaseapp.com",
    databaseURL: "https://cornycolonies-default-rtdb.firebaseio.com",
    projectId: "cornycolonies",
    storageBucket: "cornycolonies.firebasestorage.app",
    messagingSenderId: "566795956627",
    appId: "1:566795956627:web:585b66a3277696f3b0b866"
};

// Initialize Firebase (will use demo mode for now)
let database = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
    }
} catch (error) {
    console.log('Firebase not available, using local mode');
}

// Game Context
const GameContext = createContext();

// PLAYER_EMOJIS now imported from ./data/constants.js

// getRandomPlayerEmojis, initialState, and gameReducer now imported from ./state/gameReducer.js

function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Store references for debugging
    if (window.location.search.includes('test=true') || window.location.search.includes('debug=true')) {
        window.lastKnownState = state;
        window.lastKnownDispatch = dispatch;
    }

    return React.createElement(GameContext.Provider, { value: { state, dispatch } }, children);
}

function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

        // Multiplayer Functions
        function generateRoomCode() {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        
        function createRoom(dispatch, playerName) {
            const roomCode = generateRoomCode();
            const playerId = 1; // Host is always player 1
            
            if (database) {
                dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connecting' });
                
                const roomRef = database.ref(`rooms/${roomCode}`);
                
                // Add timeout to prevent infinite loading
                const timeout = setTimeout(() => {
                    console.error('Room creation timeout');
                    alert('Failed to create room - connection timeout. Please try local mode or set up Firebase.');
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                }, 5000); // 5 second timeout
                
                roomRef.set({
                    host: playerId,
                    gameState: {
                        ...initialState,
                        gameStarted: false
                    },
                    players: {
                        [playerId]: {
                            id: playerId,
                            name: playerName,
                            connected: true,
                            joinedAt: Date.now()
                        }
                    }
                }).then(() => {
                    clearTimeout(timeout);
                    dispatch({ type: 'SET_ROOM_INFO', roomCode, isHost: true });
                    dispatch({ type: 'SET_MY_PLAYER_INFO', playerId, playerName });
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connected' });
                    
                    // Listen for player updates
                    setupRoomListeners(roomCode, dispatch, playerId);
                }).catch(error => {
                    clearTimeout(timeout);
                    console.error('Error creating room:', error);
                    alert('Failed to create room. Firebase is not properly configured. Please use local mode for now.');
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                });
            } else {
                alert('Multiplayer requires Firebase setup. Please use local mode for now.');
                dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
            }
        }
        
        function joinRoom(dispatch, roomCode, playerName) {
            if (database) {
                dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connecting' });
                
                // Add timeout to prevent infinite loading
                const timeout = setTimeout(() => {
                    console.error('Room join timeout');
                    alert('Failed to join room - connection timeout. Please try local mode or check the room code.');
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                }, 5000); // 5 second timeout
                
                const roomRef = database.ref(`rooms/${roomCode}`);
                roomRef.once('value').then(snapshot => {
                    clearTimeout(timeout);
                    if (snapshot.exists()) {
                        const roomData = snapshot.val();
                        const players = roomData.players || {};
                        
                        // Find available player slot (1-4)
                        let playerId = null;
                        for (let i = 1; i <= 4; i++) {
                            if (!players[i] || !players[i].connected) {
                                playerId = i;
                                break;
                            }
                        }
                        
                        if (playerId) {
                            // Join the room
                            roomRef.child(`players/${playerId}`).set({
                                id: playerId,
                                name: playerName,
                                connected: true,
                                joinedAt: Date.now()
                            }).then(() => {
                                dispatch({ type: 'SET_ROOM_INFO', roomCode, isHost: false });
                                dispatch({ type: 'SET_MY_PLAYER_INFO', playerId, playerName });
                                dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connected' });
                                
                                // Load current game state
                                if (roomData.gameState) {
                                    dispatch({ type: 'SYNC_GAME_STATE', gameState: roomData.gameState });
                                }
                                
                                // Listen for updates
                                setupRoomListeners(roomCode, dispatch, playerId);
                            });
                        } else {
                            alert('Room is full (4 players max)');
                            dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                        }
                    } else {
                        alert('Room not found');
                        dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                    }
                }).catch(error => {
                    console.error('Error joining room:', error);
                    alert('Failed to join room');
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                });
            } else {
                alert('Firebase not available. Using local mode.');
            }
        }
        
        // Reconnection state
        let reconnectTimeout = null;
        let reconnectAttempts = 0;
        // MAX_RECONNECT_ATTEMPTS and INITIAL_RECONNECT_DELAY imported from ./data/constants.js

        function attemptReconnect(roomCode, dispatch, myPlayerId) {
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error('Max reconnection attempts reached');
                dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'disconnected' });
                alert('Connection lost. Please refresh the page to rejoin.');
                return;
            }
            
            reconnectAttempts++;
            const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
            
            console.log(`Attempting to reconnect (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
            
            reconnectTimeout = setTimeout(() => {
                database.ref(`rooms/${roomCode}/players/${myPlayerId}/connected`).set(true)
                    .then(() => {
                        console.log('Reconnection successful');
                        reconnectAttempts = 0;
                        dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connected' });
                    })
                    .catch(error => {
                        console.error('Reconnection failed:', error);
                        attemptReconnect(roomCode, dispatch, myPlayerId);
                    });
            }, delay);
        }
        
        function setupRoomListeners(roomCode, dispatch, myPlayerId) {
            if (!database) return;
            
            const roomRef = database.ref(`rooms/${roomCode}`);
            
            // Listen for player changes
            roomRef.child('players').on('value', snapshot => {
                const players = snapshot.val() || {};
                dispatch({ type: 'UPDATE_CONNECTED_PLAYERS', connectedPlayers: players });
                
                // Check if host disconnected and transfer host status
                const connectedPlayers = Object.values(players).filter(p => p.connected);
                const currentHost = connectedPlayers.find(p => p.id === 1);
                
                if (!currentHost && connectedPlayers.length > 0) {
                    // Original host (player 1) disconnected, make lowest ID the new host
                    const newHost = connectedPlayers.reduce((lowest, player) => 
                        player.id < lowest.id ? player : lowest
                    );
                    
                    if (newHost.id === myPlayerId) {
                        // I become the new host
                        dispatch({ type: 'SET_ROOM_INFO', roomCode: roomCode, isHost: true });
                        console.log(`Player ${myPlayerId} is now the host`);
                    }
                }
            });
            
            // Listen for game state changes
            let lastProcessedTimestamp = 0;
            roomRef.child('gameState').on('value', snapshot => {
                const gameState = snapshot.val();
                if (gameState) {
                    // Skip if this is an older update we've already processed
                    if (gameState.timestamp && gameState.timestamp <= lastProcessedTimestamp) {
                        console.log('Skipping older gameState update:', gameState.timestamp, '<=', lastProcessedTimestamp);
                        return;
                    }
                    
                    console.log('Firebase gameState update received:', {
                        round: gameState.round,
                        currentPlayer: gameState.currentPlayer,
                        gameOver: gameState.gameOver,
                        lastUpdatedBy: gameState.lastUpdatedBy,
                        timestamp: gameState.timestamp,
                        occupiedSpaces: gameState.occupiedSpaces,
                        players: gameState.players?.map(p => ({ 
                            id: p.id, 
                            resources: p.resources, 
                            workersLeft: p.workersLeft 
                        }))
                    });
                    
                    lastProcessedTimestamp = gameState.timestamp || Date.now();
                    dispatch({ type: 'SYNC_GAME_STATE', gameState });
                }
            });
            
            // Handle disconnection
            roomRef.child(`players/${myPlayerId}/connected`).onDisconnect().set(false);
            
            // Monitor connection state
            const connectedRef = database.ref('.info/connected');
            connectedRef.on('value', snapshot => {
                if (snapshot.val() === true) {
                    console.log('Firebase connection established');
                    if (reconnectTimeout) {
                        clearTimeout(reconnectTimeout);
                        reconnectTimeout = null;
                    }
                    reconnectAttempts = 0;
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'connected' });
                } else {
                    console.log('Firebase connection lost');
                    dispatch({ type: 'UPDATE_CONNECTION_STATUS', status: 'reconnecting' });
                    attemptReconnect(roomCode, dispatch, myPlayerId);
                }
            });
        }
        
        // Track if we're currently syncing to prevent loops
        let isSyncing = false;
        
        function syncGameState(roomCode, gameState) {
            if (database && roomCode && !isSyncing) {
                isSyncing = true;
                
                console.log('syncGameState - Syncing to Firebase:', {
                    roomCode: roomCode,
                    round: gameState.round,
                    currentPlayer: gameState.currentPlayer,
                    gameOver: gameState.gameOver,
                    lastUpdatedBy: gameState.lastUpdatedBy,
                    occupiedSpaces: gameState.occupiedSpaces,
                    players: gameState.players?.map(p => ({ 
                        id: p.id, 
                        resources: p.resources, 
                        workersLeft: p.workersLeft 
                    }))
                });
                
                // Specifically log Player 1's resources being sent
                const player1 = gameState.players?.find(p => p.id === 1);
                if (player1) {
                    console.log('syncGameState - Player 1 resources being sent:', player1.resources);
                }
                
                // Add timestamp if not already present
                const syncData = {
                    ...gameState,
                    lastUpdatedBy: gameState.lastUpdatedBy || null,
                    timestamp: gameState.timestamp || Date.now(),
                    gameLayers: gameState.gameLayers || null
                };
                
                database.ref(`rooms/${roomCode}/gameState`).set(syncData)
                    .then(() => {
                        isSyncing = false;
                    })
                    .catch(error => {
                        console.error('Failed to sync game state:', error);
                        // If sync fails due to NaN or other issues, log the problematic data
                        console.error('Problematic game state:', gameState);
                        isSyncing = false;
                    });
            }
        }
        
        function startMultiplayerGame(roomCode, gameLayers = null, gameMode = 'basic') {
            if (database && roomCode) {
                // Get current connected players and initialize proper game state
                database.ref(`rooms/${roomCode}/players`).once('value', (snapshot) => {
                    const connectedPlayers = snapshot.val() || {};
                    const playerCount = Object.keys(connectedPlayers).length;
                    
                    // Create proper player objects with all required fields
                    const players = [];
                    Object.values(connectedPlayers).forEach((player, index) => {
                        players.push({
                            id: player.id,
                            name: player.name,
                            resources: { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 },
                            workersLeft: 4,
                            effects: [],
                            victoryPoints: 0
                        });
                    });
                    
                    // Initialize automatic VPs based on active layers
                    let automaticVPs = {};
                    if (gameLayers && gameLayers.blue) {
                        automaticVPs.blue = true;
                    }
                    
                    // WHITE AUTOMATIC VP: If white is in play, all players start with 5 VP
                    let initialPlayers = players;
                    if (gameLayers && gameLayers.white) {
                        initialPlayers = players.map(player => ({
                            ...player,
                            victoryPoints: player.victoryPoints + 5
                        }));
                    }
                    
                    // Initialize complete game state
                    const gameState = {
                        currentPlayer: 1,
                        turnDirection: 1,
                        players: initialPlayers,
                        occupiedSpaces: {},
                        round: 1,
                        turnOrder: players.map(p => p.id),
                        workerPlacedThisTurn: false,
                        workersToPlace: 1,
                        actionLog: [],
                        gameStarted: true,
                        gameLayers: gameLayers,
                        gameMode: gameMode,
                        automaticVPs: automaticVPs,
                        closedShops: {},
                        shopUsedAfterWorkers: false,
                        playersOutOfWorkers: [],
                        skippedTurns: {},
                        waitingForOthers: {},
                        roundActions: [],
                        gameOver: false,
                        timestamp: Date.now(),
                        lastUpdatedBy: 'host-start'
                    };
                    
                    console.log('Starting multiplayer game with state:', {
                        players: gameState.players.length,
                        gameLayers: gameLayers ? Object.keys(gameLayers) : 'null',
                        gameMode: gameMode,
                        automaticVPs: automaticVPs
                    });
                    
                    database.ref(`rooms/${roomCode}/gameState`).set(gameState)
                        .then(() => {
                            console.log('Game state successfully written to Firebase');
                            // Force an immediate sync for all clients
                            database.ref(`rooms/${roomCode}/lastUpdate`).set(Date.now());
                        })
                        .catch(error => {
                            console.error('Failed to write game state to Firebase:', error);
                        });
                });
            }
        }

        // Room Lobby Component
        function RoomLobby() {
            const { state, dispatch } = useGame();
            const [playerName, setPlayerName] = useState('');
            const [roomCodeInput, setRoomCodeInput] = useState('');
            const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join', 'gameMode'
            const [selectedGameMode, setSelectedGameMode] = useState(null); // 'basic' or 'advanced'
            
            const handleCreateRoom = () => {
                if (!playerName.trim()) {
                    alert('Please enter your name');
                    return;
                }
                createRoom(dispatch, playerName.trim());
            };
            
            const handleJoinRoom = () => {
                if (!playerName.trim()) {
                    alert('Please enter your name');
                    return;
                }
                if (!roomCodeInput.trim()) {
                    alert('Please enter room code');
                    return;
                }
                joinRoom(dispatch, roomCodeInput.trim().toUpperCase(), playerName.trim());
            };
            
            const handlePlayLocal = () => {
                setMode('gameMode');
            };
            
            const handleStartWithMode = (gameMode) => {
                // For local play, use 4 players
                const selectedLayers = selectGameLayers(4, gameMode);
                dispatch({ type: 'SET_GAME_MODE', mode: gameMode });
                dispatch({ type: 'SET_GAME_LAYERS', layers: selectedLayers });
                dispatch({ type: 'START_GAME' });
            };
            
            return React.createElement('div', { 
                className: 'min-h-screen flex items-center justify-center p-4'
            }, React.createElement('div', {
                className: 'glass rounded-xl shadow-2xl p-8 max-w-md w-full'
            }, [
                React.createElement('div', { key: 'header', className: 'text-center mb-8' }, [
                    React.createElement('h1', { 
                        key: 'title',
                        className: 'text-3xl font-bold text-gray-800 mb-2' 
                    }, 'Patrons'),
                    React.createElement('p', { 
                        key: 'subtitle',
                        className: 'text-gray-600' 
                    }, 'Choose your game mode')
                ]),
                
                mode === 'menu' && React.createElement('div', { key: 'menu', className: 'space-y-4' }, [
                    React.createElement('input', {
                        key: 'name',
                        type: 'text',
                        placeholder: 'Enter your name',
                        value: playerName,
                        onChange: (e) => setPlayerName(e.target.value),
                        className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }),
                    React.createElement('button', {
                        key: 'create',
                        onClick: () => setMode('create'),
                        className: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, '🎮 Create Online Game'),
                    React.createElement('button', {
                        key: 'join',
                        onClick: () => setMode('join'),
                        className: 'w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, '🚪 Join Online Game'),
                    React.createElement('button', {
                        key: 'local',
                        onClick: handlePlayLocal,
                        className: 'w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, '💻 Play Local (Same Device)')
                ]),
                
                mode === 'create' && React.createElement('div', { key: 'create', className: 'space-y-4' }, [
                    React.createElement('h3', { 
                        key: 'title',
                        className: 'text-xl font-bold text-center mb-4' 
                    }, 'Create Room'),
                    React.createElement('input', {
                        key: 'name',
                        type: 'text',
                        placeholder: 'Enter your name',
                        value: playerName,
                        onChange: (e) => setPlayerName(e.target.value),
                        className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }),
                    React.createElement('button', {
                        key: 'create',
                        onClick: handleCreateRoom,
                        disabled: state.connectionStatus === 'connecting',
                        className: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:transform-none'
                    }, state.connectionStatus === 'connecting' ? 'Creating...' : 'Create Room'),
                    React.createElement('button', {
                        key: 'back',
                        onClick: () => setMode('menu'),
                        className: 'w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Back')
                ]),
                
                mode === 'join' && React.createElement('div', { key: 'join', className: 'space-y-4' }, [
                    React.createElement('h3', { 
                        key: 'title',
                        className: 'text-xl font-bold text-center mb-4' 
                    }, 'Join Room'),
                    React.createElement('input', {
                        key: 'name',
                        type: 'text',
                        placeholder: 'Enter your name',
                        value: playerName,
                        onChange: (e) => setPlayerName(e.target.value),
                        className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }),
                    React.createElement('input', {
                        key: 'code',
                        type: 'text',
                        placeholder: 'Enter room code',
                        value: roomCodeInput,
                        onChange: (e) => setRoomCodeInput(e.target.value.toUpperCase()),
                        className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
                    }),
                    React.createElement('button', {
                        key: 'join',
                        onClick: handleJoinRoom,
                        disabled: state.connectionStatus === 'connecting',
                        className: 'w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:transform-none'
                    }, state.connectionStatus === 'connecting' ? 'Joining...' : 'Join Room'),
                    React.createElement('button', {
                        key: 'back',
                        onClick: () => setMode('menu'),
                        className: 'w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Back')
                ]),
                
                mode === 'gameMode' && React.createElement('div', { key: 'gameMode', className: 'space-y-4' }, [
                    React.createElement('h3', { 
                        key: 'title',
                        className: 'text-xl font-bold text-center mb-4' 
                    }, 'Select Game Mode'),
                    React.createElement('div', { 
                        key: 'description',
                        className: 'text-sm text-gray-600 text-center mb-6 space-y-2' 
                    }, [
                        React.createElement('p', { key: 'basic' }, 
                            'Basic: Play with the classic 4 colors (Red, Yellow, Blue, Purple)'),
                        React.createElement('p', { key: 'advanced' }, 
                            'Advanced: Play with 4 randomly selected colors from all 8 available')
                    ]),
                    React.createElement('button', {
                        key: 'basic',
                        onClick: () => handleStartWithMode('basic'),
                        className: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, '🎯 Basic Mode'),
                    React.createElement('button', {
                        key: 'advanced',
                        onClick: () => handleStartWithMode('advanced'),
                        className: 'w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, '🚀 Advanced Mode'),
                    React.createElement('button', {
                        key: 'back',
                        onClick: () => setMode('menu'),
                        className: 'w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Back')
                ])
            ]));
        }
        
        // Connected Players Component
        function ConnectedPlayers() {
            const { state, dispatch } = useGame();
            const connectedCount = Object.keys(state.connectedPlayers).length;
            const [showGameModeSelection, setShowGameModeSelection] = useState(false);
            const [selectedGameMode, setSelectedGameMode] = useState('basic');
            
            const handleStartGame = () => {
                if (connectedCount >= 2) {
                    setShowGameModeSelection(true);
                } else {
                    alert('Need at least 2 players to start');
                }
            };
            
            const handleLeaveRoom = () => {
                if (confirm('Are you sure you want to leave the room?')) {
                    window.location.reload();
                }
            };
            
            // Only show the full connected players card before game starts
            if (!state.gameStarted) {
                return React.createElement('div', {
                    className: 'glass rounded-lg p-4 mb-6'
                }, [
                React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-4' }, [
                    React.createElement('div', { key: 'info' }, [
                        React.createElement('h3', { 
                            key: 'title',
                            className: 'text-lg font-bold text-gray-800' 
                        }, `Room: ${state.roomCode}`),
                        React.createElement('p', { 
                            key: 'count',
                            className: 'text-sm text-gray-600' 
                        }, `${connectedCount}/4 players connected`)
                    ]),
                    React.createElement('button', {
                        key: 'leave',
                        onClick: handleLeaveRoom,
                        className: 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm'
                    }, 'Leave')
                ]),
                React.createElement('div', { key: 'players', className: 'grid grid-cols-2 gap-2 mb-4' }, 
                    Object.values(state.connectedPlayers).map(player => 
                        React.createElement('div', {
                            key: player.id,
                            className: `p-2 rounded border-2 ${player.connected ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'} ${player.id === state.myPlayerId ? 'ring-2 ring-blue-400' : ''}`
                        }, [
                            React.createElement('div', { 
                                key: 'name',
                                className: 'font-semibold' 
                            }, `Player ${player.id}: ${player.name}`),
                            React.createElement('div', { 
                                key: 'status',
                                className: `text-xs ${player.connected ? 'text-green-600' : 'text-gray-500'}` 
                            }, player.connected ? '🟢 Connected' : (
                                player.id === state.myPlayerId && state.connectionStatus === 'reconnecting' 
                                    ? '🟡 Reconnecting...' 
                                    : '🔴 Disconnected'
                            )),
                            player.id === state.myPlayerId && React.createElement('div', { 
                                key: 'you',
                                className: 'text-xs text-blue-600 font-bold' 
                            }, '(You)')
                        ])
                    )
                ),
                state.isHost && !state.gameStarted && !showGameModeSelection && React.createElement('button', {
                    key: 'start',
                    onClick: handleStartGame,
                    disabled: connectedCount < 2,
                    className: 'w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200'
                }, connectedCount >= 2 ? 'Start Game' : 'Need 2+ Players to Start'),
                
                showGameModeSelection && React.createElement('div', { key: 'gameMode', className: 'space-y-3 mt-4' }, [
                    React.createElement('h4', { 
                        key: 'title',
                        className: 'text-md font-bold text-center' 
                    }, 'Select Game Mode'),
                    React.createElement('div', { key: 'buttons', className: 'flex gap-2' }, [
                        React.createElement('button', {
                            key: 'basic',
                            onClick: () => {
                                console.log('Starting game with', connectedCount, 'players in basic mode');
                                const selectedLayers = selectGameLayers(connectedCount, 'basic');
                                console.log('Selected layers:', Object.keys(selectedLayers));
                                dispatch({ type: 'SET_GAME_MODE', mode: 'basic' });
                                dispatch({ type: 'SET_GAME_LAYERS', layers: selectedLayers });
                                startMultiplayerGame(state.roomCode, selectedLayers, 'basic');
                                dispatch({ type: 'START_GAME' });
                                console.log('Game started successfully');
                            },
                            className: 'flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm'
                        }, 'Basic'),
                        React.createElement('button', {
                            key: 'advanced',
                            onClick: () => {
                                console.log('Starting game with', connectedCount, 'players in advanced mode');
                                const selectedLayers = selectGameLayers(connectedCount, 'advanced');
                                console.log('Selected layers:', Object.keys(selectedLayers));
                                dispatch({ type: 'SET_GAME_MODE', mode: 'advanced' });
                                dispatch({ type: 'SET_GAME_LAYERS', layers: selectedLayers });
                                startMultiplayerGame(state.roomCode, selectedLayers, 'advanced');
                                dispatch({ type: 'START_GAME' });
                                console.log('Game started successfully');
                            },
                            className: 'flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg text-sm'
                        }, 'Advanced'),
                        React.createElement('button', {
                            key: 'cancel',
                            onClick: () => setShowGameModeSelection(false),
                            className: 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm'
                        }, 'Cancel')
                    ])
                ])
            ]);
            }
            
            // During game, return null (room code will be shown in header)
            return null;
        }

        // Action Space Component - Enhanced with compact mode and round indicators
        // Notification Display Component
        function NotificationDisplay({ notifications, myPlayerId }) {
            const relevantNotifications = notifications.filter(n => 
                !n.forPlayer || n.forPlayer === myPlayerId
            );
            
            if (relevantNotifications.length === 0) return null;
            
            return React.createElement('div', {
                className: 'fixed top-4 right-4 z-50 space-y-2'
            }, relevantNotifications.slice(-3).map(notification => // Show last 3
                React.createElement('div', {
                    key: notification.id,
                    className: 'bg-gray-800 text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105',
                    style: { minWidth: '300px' }
                }, [
                    React.createElement('div', { key: 'header', className: 'flex items-center gap-2 mb-1' }, [
                        React.createElement('span', { key: 'icon', className: 'text-2xl' }, notification.icon || '📢'),
                        React.createElement('span', { key: 'title', className: 'font-bold' }, notification.title)
                    ]),
                    React.createElement('div', { key: 'message', className: 'text-sm opacity-90' }, notification.message),
                    React.createElement('div', { key: 'time', className: 'text-xs opacity-60 mt-1' }, 
                        `${Math.floor((Date.now() - notification.timestamp) / 1000)}s ago`
                    )
                ])
            ));
        }
        
        function ActionSpace({ actionId, title, description, round, available = true, compact = false }) {
            const { state, dispatch } = useGame();
            const isOccupied = state.occupiedSpaces[actionId];
            const occupyingPlayer = isOccupied ? state.players.find(p => p.id === isOccupied) : null;
            const isPending = state.pendingPlacements && state.pendingPlacements[actionId];
            
            const handleClick = async () => {
                if (isOccupied || !available) return;
                
                // Validate multiplayer turn
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                // Optimistic locking - immediately mark space as pending
                if (state.roomCode) {
                    // Check if another player is already trying to place here
                    if (state.pendingPlacements && state.pendingPlacements[actionId]) {
                        alert('Another player is placing a worker here!');
                        return;
                    }
                    // Mark this space as pending
                    dispatch({ type: 'SET_PENDING_PLACEMENT', actionId, playerId: state.myPlayerId });
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                
                // Check if player can place workers
                if (state.workersToPlace <= 0) {
                    alert('You have already placed all your workers this turn. End your turn or buy from shops.');
                    return;
                }
                
                // Only check physical workers if we don't have bonus placement workers
                if (currentPlayer.workersLeft <= 0 && state.workersToPlace <= 1) {
                    alert('You have no workers left to place!');
                    return;
                }
                
                // Check if current player has a "must place on red" effect
                const mustPlaceOnRed = currentPlayer.effects && 
                    currentPlayer.effects.some(effect => effect.includes('Must place on red layer'));
                
                // Debug logging for force red issue
                if (mustPlaceOnRed) {
                    console.log('FORCE_RED_DEBUG - Current player must place on red:', currentPlayer.id, currentPlayer.effects);
                }
                
                if (mustPlaceOnRed) {
                    // Check if this action is on the red layer
                    const redLayer = state.gameLayers && state.gameLayers.red;
                    const isRedAction = redLayer && redLayer.actions.some(a => a.id === actionId);
                    
                    console.log('FORCE_RED_DEBUG - Checking action:', actionId,
                              'Red layer exists:', !!redLayer,
                              'Is red action:', isRedAction);
                    
                    if (!isRedAction) {
                        // Check if red layer is full (only considering actions available in current round)
                        const availableRedActions = redLayer ? 
                            redLayer.actions.filter(a => a.round <= state.round).map(a => a.id) : [];
                        const redIsFull = availableRedActions.length === 0 || 
                            availableRedActions.every(id => state.occupiedSpaces[id]);
                        
                        console.log('FORCE_RED_DEBUG - Available red actions for round', state.round, ':', availableRedActions,
                                  'Red is full:', redIsFull);
                        
                        if (!redIsFull) {
                            alert('You must place workers on the red layer until it is full!');
                            return;
                        } else {
                            // Red is full, clear the force red effect from all players
                            console.log('Red layer is full, clearing force red effects');
                            state.players.forEach(p => {
                                if (p.effects && p.effects.some(e => e.includes('Must place on red layer'))) {
                                    dispatch({
                                        type: 'UPDATE_PLAYER_EFFECTS',
                                        playerId: p.id,
                                        effects: p.effects.filter(e => !e.includes('Must place on red layer'))
                                    });
                                }
                            });
                        }
                    }
                }
                
                // Validate swap worker actions - prevent placing if no workers to swap
                if (actionId === 'redHybrid1' || actionId === 'redHybrid2') {
                    // Check if player has other workers on the board to swap
                    const playerWorkersOnBoard = Object.entries(state.occupiedSpaces)
                        .filter(([spaceId, playerId]) => playerId === state.currentPlayer && spaceId !== actionId)
                        .length;
                    
                    if (playerWorkersOnBoard === 0) {
                        // Check if this is the only available action
                        const availableActions = [];
                        Object.entries(state.gameLayers || {}).forEach(([color, layer]) => {
                            layer.actions.forEach(action => {
                                if (action.round <= state.round && !state.occupiedSpaces[action.id]) {
                                    availableActions.push(action.id);
                                }
                            });
                        });
                        
                        if (availableActions.length > 1) {
                            const proceed = confirm('WARNING: You have no other workers on the board to swap! This action will only give you the resource bonus. Continue anyway?');
                            if (!proceed) return;
                        }
                        // If this is the only action available, allow placement
                    }
                }
                
                // Validate take back worker action - prevent if no workers on non-purple quads
                if (actionId === 'gain2purpleTakeBack') {
                    // Check if player has workers on non-purple quads
                    const nonPurpleWorkers = Object.entries(state.occupiedSpaces)
                        .filter(([spaceId, playerId]) => {
                            if (playerId !== state.currentPlayer) return false;
                            // Check if this action is NOT in the purple quad
                            const isPurpleAction = state.gameLayers['purple'] && 
                                state.gameLayers['purple'].actions.some(a => a.id === spaceId);
                            return !isPurpleAction;
                        }).length;
                    
                    if (nonPurpleWorkers === 0) {
                        // Check if this is the only available action
                        const availableActions = [];
                        Object.entries(state.gameLayers || {}).forEach(([color, layer]) => {
                            layer.actions.forEach(action => {
                                if (action.round <= state.round && !state.occupiedSpaces[action.id]) {
                                    availableActions.push(action.id);
                                }
                            });
                        });
                        
                        if (availableActions.length > 1) {
                            const proceed = confirm('WARNING: You have no workers on non-purple quads to take back! This action will only give you the purple resources. Continue anyway?');
                            if (!proceed) return;
                        }
                    }
                }
                
                // Validate play more workers actions - warn if not enough workers
                if (actionId === 'playTwoWorkers' && currentPlayer.workersLeft < 2) {
                    const proceed = confirm(`WARNING: You only have ${currentPlayer.workersLeft} worker(s) left. You won't be able to place 2 workers. Continue anyway?`);
                    if (!proceed) return;
                }
                
                if (actionId === 'playThreeWorkers' && currentPlayer.workersLeft < 3) {
                    const proceed = confirm(`WARNING: You only have ${currentPlayer.workersLeft} worker(s) left. You won't be able to place 3 workers. Continue anyway?`);
                    if (!proceed) return;
                }
                
                // Validate extra turn action - warn if already have extra turn
                if (actionId === 'gain4purpleWaitAll') {
                    const hasExtraTurnEffect = (currentPlayer.effects || []).some(effect => 
                        effect.includes('Will take an extra turn after this one')
                    );
                    const hasExtraTurns = (currentPlayer.extraTurns || 0) > 0;
                    
                    if (hasExtraTurnEffect || hasExtraTurns) {
                        const proceed = confirm('WARNING: You already have an extra turn queued! This action will have no additional effect. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Validate white spend resources actions
                if (actionId === 'spend2AnyFor3VP') {
                    const totalGems = Object.values(currentPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                    if (totalGems < 2) {
                        const proceed = confirm('WARNING: You need at least 2 resources to use this action. You only have ' + totalGems + '. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                if (actionId === 'spend1AnyFor2VP') {
                    const totalGems = Object.values(currentPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                    if (totalGems < 1) {
                        const proceed = confirm('WARNING: You need at least 1 resource to use this action. You have none. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Store action info before placing worker, in case we need to undo
                const workerInfo = { actionId, playerId: state.currentPlayer };
                
                try {
                    dispatch({ type: 'PLACE_WORKER', actionId });
                    
                    // Get fresh state after worker placement for repeat actions
                    const freshState = { 
                        ...state, 
                        occupiedSpaces: { ...state.occupiedSpaces, [actionId]: state.currentPlayer },
                        players: state.players.map(p => 
                            p.id === state.currentPlayer 
                                ? { ...p, workersLeft: p.workersLeft - 1 }
                                : p
                        ),
                        workerPlacedThisTurn: true,
                        workersToPlace: Math.max(0, state.workersToPlace - 1)
                    };
                    const freshPlayer = freshState.players.find(p => p.id === state.currentPlayer);
                    
                    // Pass worker info to executeAction so it can undo if needed
                    await executeAction(actionId, freshPlayer, dispatch, freshState, state.gameLayers, 0, workerInfo);
                    
                    const message = `Action completed: ${actionId} for Player ${currentPlayer.id}`;
                    dispatch({ type: 'ADD_LOG', message });
                    console.log(message);
                } finally {
                    // Always clear pending placement
                    if (state.roomCode) {
                        dispatch({ type: 'CLEAR_PENDING_PLACEMENT', actionId });
                    }
                }
            };
            
            const getRoundStyle = () => {
                if (round === 1) return 'bg-gray-100 border-gray-300';
                if (round === 2) return 'bg-green-100 border-green-500';
                if (round === 3) return 'bg-yellow-100 border-yellow-500';
                return 'bg-gray-100 border-gray-300';
            };
            
            const getAvailabilityStyle = () => {
                if (!available) return 'opacity-60 cursor-not-allowed bg-gray-200 border-gray-400';
                if (isOccupied) return 'bg-red-50 border-red-500 cursor-not-allowed';
                if (isPending) return 'bg-yellow-50 border-yellow-500 cursor-wait animate-pulse';
                return 'hover:bg-blue-50 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-150 border-blue-300';
            };
            
            const getRoundIndicator = () => {
                const baseStyle = "absolute top-0.5 left-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white shadow";
                switch (round) {
                    case 1: return `${baseStyle} bg-gray-500`;
                    case 2: return `${baseStyle} bg-green-500`;
                    case 3: return `${baseStyle} bg-yellow-600`;
                    default: return `${baseStyle} bg-gray-500`;
                }
            };
            
            const getCardSize = () => {
                return compact ? 'p-3 min-h-20' : 'p-4 min-h-32';
            };

            const getTextSize = () => {
                return compact ? {
                    title: 'text-xs',
                    desc: 'text-xs'
                } : {
                    title: 'text-sm',
                    desc: 'text-xs'
                };
            };
            
            const textSizes = getTextSize();
            
            return React.createElement('div', {
                className: `relative border-2 rounded-lg flex flex-col p-1.5 min-h-[60px] transition-all duration-150 shadow-sm ${getRoundStyle()} ${getAvailabilityStyle()}`,
                onClick: handleClick
            }, [
                // Round indicator badge
                React.createElement('div', {
                    key: 'round-indicator',
                    className: getRoundIndicator()
                }, `R${round}`),
                // Worker if occupied
                occupyingPlayer && React.createElement('div', {
                    key: 'worker',
                    className: `absolute top-0.5 right-0.5 text-xl drop-shadow-lg`
                }, occupyingPlayer.emoji || occupyingPlayer.id),
                // Title
                React.createElement('div', {
                    key: 'title',
                    className: `font-bold text-xs mb-0.5 px-5 text-center ${!available ? 'text-gray-500' : 'text-gray-900'}`
                }, title),
                // Description
                React.createElement('div', {
                    key: 'desc',
                    className: `text-xs text-center px-1 ${!available ? 'text-gray-400' : 'text-gray-600'} leading-tight`
                }, description)
            ]);
        }

        // Simplified action execution
        async function executeAction(actionId, player, dispatch, currentState, gameLayers, recursionDepth = 0, workerInfo = null) {
            // Prevent infinite loops
            if (recursionDepth > 5) {
                dispatch({ type: 'ADD_LOG', message: '⚠️ Max recursion depth reached - stopping to prevent infinite loop' });
                return;
            }
            
            // Show recursion depth for complex chains
            if (recursionDepth > 0) {
                dispatch({ type: 'ADD_LOG', message: `↳ Action chain depth: ${recursionDepth}` });
            }
            
            const basicGains = {
                'gain3red': { red: 3 },
                'gain2red': { red: 2 },
                'gain3blue': { blue: 3 },
                'gain2blue': { blue: 2 },
                'gain3purple': { purple: 3 },
                'gain2purple': { purple: 2 },
                'gain2gold': { gold: 2 },
                'gain1gold': { gold: 1 },
                'gain3white': { white: 3 },
                'gain2white': { white: 2 },
                'gain3black': { black: 3 },
                'gain2black': { black: 2 },
                'gain3silver': { silver: 3 },
                'gain2silver': { silver: 2 }
                // Note: gain3yellow and gain2yellow are NOT basic gains - they have special logic
            };
            
            if (basicGains[actionId]) {
                let resources = { ...basicGains[actionId] };
                
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    // Double all gains
                    Object.keys(resources).forEach(color => {
                        resources[color] *= 2;
                    });
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${player.id}: ${actionId} → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')} (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${player.id}: ${actionId} → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                // RED AUTOMATIC VP: Award 1 VP for red layer actions
                if (actionId.includes('red')) {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: player.id,
                        vp: 1,
                        source: 'redAction'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                }
                
                return;
            }
            
            // Yellow layer actions with player choice
            if (actionId === 'gain3yellow') {
                // For extra workers, always give resources to the worker owner
                const actualPlayerId = workerInfo?.playerId || player.id;
                const actualPlayer = currentState.players.find(p => p.id === actualPlayerId);
                
                // If this is from Red R2 shop placement, show modal to the placed worker's owner
                const isPlacedByOther = workerInfo && workerInfo.placedBy && workerInfo.placedBy !== actualPlayerId;
                const modalTitle = isPlacedByOther 
                    ? `Your worker was placed! Select 3 Resources (⭐ Colors):`
                    : 'Select 3 Resources (⭐ Colors)';
                
                const selectedGems = await showGemSelection(
                    dispatch, 
                    modalTitle, 
                    3, 
                    null, 
                    workerInfo,
                    isPlacedByOther ? actualPlayerId : null
                );
                console.log('gain3yellow - selectedGems:', selectedGems);
                
                if (!selectedGems) {
                    // If cancelled, give default resources
                    const resources = { red: 1, yellow: 1, blue: 1 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: actualPlayerId, resources });
                    const message = `Player ${actualPlayerId}: gain3yellow → +1 red, +1 yellow, +1 blue (default)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const resources = selectedGems;
                console.log('gain3yellow - resources object before processing:', resources);
                console.log('gain3yellow - actualPlayerId:', actualPlayerId);
                console.log('gain3yellow - actualPlayer:', actualPlayer);
                
                // Filter out zero values to ensure clean resource update
                const filteredResources = {};
                Object.entries(resources).forEach(([color, amount]) => {
                    if (amount > 0) {
                        filteredResources[color] = amount;
                    }
                });
                console.log('gain3yellow - filteredResources (zeros removed):', filteredResources);
                
                // Check for doubling effect on the actual player
                const hasDoubleEffect = (actualPlayer.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    // Double all gains
                    Object.keys(filteredResources).forEach(color => {
                        filteredResources[color] *= 2;
                    });
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: actualPlayerId,
                        effects: (actualPlayer.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${actualPlayerId}: ${actionId} → +${Object.entries(filteredResources).map(([color, amount]) => `${amount} ${color}`).join(', ')} (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${actualPlayerId}: ${actionId} → +${Object.entries(filteredResources).map(([color, amount]) => `${amount} ${color}`).join(', ')}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                console.log('gain3yellow - About to dispatch UPDATE_RESOURCES with:', {
                    type: 'UPDATE_RESOURCES',
                    playerId: actualPlayerId,
                    resources: filteredResources
                });
                
                try {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: actualPlayerId,
                        resources: filteredResources
                    });
                    console.log('gain3yellow - UPDATE_RESOURCES dispatched successfully');
                } catch (error) {
                    console.error('gain3yellow - Error dispatching UPDATE_RESOURCES:', error);
                }
                
                return;
            }
            
            // Similar implementation for gain2yellow
            if (actionId === 'gain2yellow') {
                console.log('gain2yellow - Starting for player', player.id, 'workerInfo:', workerInfo);
                
                // For extra workers, always give resources to the worker owner
                const actualPlayerId = workerInfo?.playerId || player.id;
                const actualPlayer = currentState.players.find(p => p.id === actualPlayerId);
                
                console.log('gain2yellow - actualPlayerId:', actualPlayerId, 'actualPlayer:', actualPlayer);
                
                // If this is from Red R2 shop placement, show modal to the placed worker's owner
                const isPlacedByOther = workerInfo && workerInfo.placedBy && workerInfo.placedBy !== actualPlayerId;
                const modalTitle = isPlacedByOther 
                    ? `Your worker was placed! Select 2 Resources (⭐ Colors):`
                    : 'Select 2 Resources (⭐ Colors)';
                
                const selectedGems = await showGemSelection(
                    dispatch, 
                    modalTitle, 
                    2, 
                    null, 
                    workerInfo,
                    isPlacedByOther ? actualPlayerId : null
                );
                
                console.log('gain2yellow - selectedGems:', selectedGems);
                
                if (!selectedGems) {
                    // If cancelled, give default resources
                    const resources = { red: 1, yellow: 1 };
                    console.log('gain2yellow - Using default resources:', resources);
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: actualPlayerId, resources });
                    const message = `Player ${actualPlayerId}: gain2yellow → +1 red, +1 yellow (default)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const resources = selectedGems;
                console.log('gain2yellow - resources object:', resources);
                
                // Check for doubling effect on the actual player
                const hasDoubleEffect = (actualPlayer.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    // Double all gains
                    Object.keys(resources).forEach(color => {
                        resources[color] *= 2;
                    });
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: actualPlayerId,
                        effects: (actualPlayer.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${actualPlayerId}: ${actionId} → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')} (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${actualPlayerId}: ${actionId} → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                console.log('gain2yellow - About to dispatch UPDATE_RESOURCES with:', {
                    playerId: actualPlayerId,
                    resources: resources
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: actualPlayerId,
                    resources
                });
                return;
            }
            
            
            // Purple layer - Play two workers (immediately)
            if (actionId === 'playTwoWorkers') {
                // Calculate how many workers we can actually add
                const workersAvailable = player.workersLeft;
                const workersToAdd = Math.min(2, workersAvailable);
                
                if (workersToAdd === 0) {
                    const message = `Player ${player.id}: playTwoWorkers → No workers left to place`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Add workers that can be placed this turn (limited by available workers)
                dispatch({
                    type: 'ADD_WORKERS_TO_PLACE',
                    count: workersToAdd
                });
                
                dispatch({
                    type: 'ADD_EFFECT',
                    playerId: player.id,
                    effect: `Can place ${workersToAdd} more worker${workersToAdd > 1 ? 's' : ''} this turn`
                });
                
                const message = `Player ${player.id}: playTwoWorkers → Can now place ${workersToAdd} MORE worker${workersToAdd > 1 ? 's' : ''} this turn`;
                dispatch({ type: 'ADD_LOG', message });
                console.log(message);
                return;
            }
            
            // NEW PURPLE LAYER ACTIONS
            if (actionId === 'gain4purpleSkip') {
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                let purpleGain = 4;
                
                if (hasDoubleEffect) {
                    purpleGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: purpleGain }
                });
                
                // Set skip for next turn
                const newSkippedTurns = { ...currentState.skippedTurns };
                newSkippedTurns[player.id] = (newSkippedTurns[player.id] || 0) + 1;
                dispatch({
                    type: 'SET_SKIPPED_TURNS',
                    skippedTurns: newSkippedTurns
                });
                
                const message = `Player ${player.id}: gain4purpleSkip → +${purpleGain} purple${hasDoubleEffect ? ' (DOUBLED!)' : ''}, will skip next turn (total skips: ${newSkippedTurns[player.id]})`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            if (actionId === 'gain2purpleTakeBack') {
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                let purpleGain = 2;
                
                if (hasDoubleEffect) {
                    purpleGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: purpleGain }
                });
                
                // Find workers on different quad (non-purple)
                const occupiedByPlayer = Object.entries(currentState.occupiedSpaces || {})
                    .filter(([actionId, playerId]) => {
                        if (playerId !== player.id) return false;
                        // Check if this action is in the purple quad
                        const isPurpleAction = gameLayers['purple'] && 
                            gameLayers['purple'].actions.some(a => a.id === actionId);
                        return !isPurpleAction;
                    });
                
                if (occupiedByPlayer.length > 0) {
                    // Group by layer
                    const workersByLayer = {};
                    occupiedByPlayer.forEach(([actionId, playerId]) => {
                        const layer = Object.keys(gameLayers).find(color => 
                            gameLayers[color].actions.some(a => a.id === actionId)
                        );
                        if (layer) {
                            if (!workersByLayer[layer]) workersByLayer[layer] = [];
                            workersByLayer[layer].push(actionId);
                        }
                    });
                    
                    // Show options from different layers
                    const options = [];
                    Object.entries(workersByLayer).forEach(([layer, actions]) => {
                        actions.forEach(actionId => {
                            const action = gameLayers[layer].actions.find(a => a.id === actionId);
                            if (action) {
                                options.push({
                                    label: `${layer} - ${action.title}`,
                                    value: actionId
                                });
                            }
                        });
                    });
                    
                    if (options.length > 0) {
                        const choice = await showChoice(dispatch, 'Choose a worker to take back', options);
                        if (choice) {
                            // Remove worker and give it back
                            dispatch({
                                type: 'REMOVE_WORKER',
                                actionId: choice,
                                playerId: player.id
                            });
                            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Took back worker from ${choice}` });
                        }
                    }
                }
                
                const message = `Player ${player.id}: gain2purpleTakeBack → +${purpleGain} purple${hasDoubleEffect ? ' (DOUBLED!)' : ''} + take back worker`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            if (actionId === 'gain5purpleSkip') {
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                let purpleGain = 5;
                
                if (hasDoubleEffect) {
                    purpleGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: purpleGain }
                });
                
                // Set skip for NEXT turn, not this turn
                const newSkippedTurns = { ...currentState.skippedTurns };
                newSkippedTurns[player.id] = (newSkippedTurns[player.id] || 0) + 1;
                dispatch({
                    type: 'SET_SKIPPED_TURNS',
                    skippedTurns: newSkippedTurns
                });
                
                const message = `Player ${player.id}: gain5purpleSkip → +${purpleGain} purple${hasDoubleEffect ? ' (DOUBLED!)' : ''}, will skip next turn (total skips: ${newSkippedTurns[player.id]})`;
                dispatch({ type: 'ADD_LOG', message });
                
                // Don't force end turn - let player continue placing workers if they have more to place
                return;
            }
            
            if (actionId === 'playThreeWorkers') {
                // Calculate how many workers we can actually add
                const workersAvailable = player.workersLeft;
                const workersToAdd = Math.min(3, workersAvailable);
                
                if (workersToAdd === 0) {
                    const message = `Player ${player.id}: playThreeWorkers → No workers left to place`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Add workers that can be placed this turn (limited by available workers)
                dispatch({
                    type: 'ADD_WORKERS_TO_PLACE',
                    count: workersToAdd
                });
                
                dispatch({
                    type: 'ADD_EFFECT',
                    playerId: player.id,
                    effect: `Can place ${workersToAdd} more worker${workersToAdd > 1 ? 's' : ''} this turn`
                });
                
                const message = `Player ${player.id}: playThreeWorkers → Can now place ${workersToAdd} MORE worker${workersToAdd > 1 ? 's' : ''} this turn`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            if (actionId === 'gain4purpleWaitAll') {
                // Give 4 purple resources
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: 4 }
                });
                
                // Grant an extra turn
                dispatch({
                    type: 'ADD_EFFECT',
                    playerId: player.id,
                    effect: 'Will take an extra turn after this one'
                });
                
                // Actually grant the extra turn
                dispatch({
                    type: 'UPDATE_PLAYER',
                    playerId: player.id,
                    updates: { extraTurns: (player.extraTurns || 0) + 1 }
                });
                
                const message = `Player ${player.id}: gain4purpleWaitAll → +4 purple + extra turn after this one`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Purple layer - Extra workers next round
            if (actionId === 'extraWorkers') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: 1 }
                });
                
                dispatch({
                    type: 'ADD_EFFECT',
                    playerId: player.id,
                    effect: 'Will get 2 extra workers next round'
                });
                
                console.log(`Player ${player.id} will get 2 extra workers next round`);
                return;
            }
            
            // Purple layer - ⭐ Round 1 Shop Benefit
            if (actionId === 'purpleShopHybrid') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: 1 }
                });
                
                const shopOptions = [
                    { label: '🔴 R1: Repeat worker action', value: 'red1' },
                    { label: '🟡 R1: Double next gain', value: 'yellow1' },
                    { label: '🔵 R1: Close ⭐ shop this round', value: 'blue1' },
                    { label: '🟣 R1: Take an extra turn after this one', value: 'purple1' }
                ];
                
                const choice = await showChoice(dispatch, 
                    'Choose ⭐ Round 1 shop benefit', 
                    shopOptions
                );
                
                if (choice) {
                    switch(choice) {
                        case 'red1':
                            // Execute repeat action immediately
                            await executeRepeatAction(player, dispatch, currentState, gameLayers);
                            break;
                        case 'yellow1':
                            dispatch({
                                type: 'ADD_EFFECT',
                                playerId: player.id,
                                effect: 'Next gain will be doubled'
                            });
                            break;
                        case 'blue1':
                            dispatch({
                                type: 'ADD_EFFECT',
                                playerId: player.id,
                                effect: 'Can close ⭐ shop this round'
                            });
                            break;
                        case 'purple1':
                            dispatch({
                                type: 'ADD_EFFECT',
                                playerId: player.id,
                                effect: 'Will take an extra turn after this one'
                            });
                            // Actually grant the extra turn
                            dispatch({
                                type: 'UPDATE_PLAYER',
                                playerId: player.id,
                                updates: { extraTurns: (player.extraTurns || 0) + 1 }
                            });
                            break;
                    }
                    
                    const effectNames = {
                        'red1': 'Repeat worker action',
                        'yellow1': 'Double next gain',
                        'blue1': 'Close shop ability',
                        'purple1': 'Extra turn'
                    };
                    
                    const message = `Player ${player.id}: purpleShopHybrid → +1 purple + ${effectNames[choice]}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                return;
            }
            
            // Purple layer - Choose turn order
            if (actionId === 'purpleHybrid2') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { purple: 1 }
                });
                
                const orderOptions = [
                    { label: '1 → 2 → 3 → 4', value: [1, 2, 3, 4] },
                    { label: '4 → 3 → 2 → 1', value: [4, 3, 2, 1] },
                    { label: '2 → 1 → 4 → 3', value: [2, 1, 4, 3] },
                    { label: '3 → 4 → 1 → 2', value: [3, 4, 1, 2] }
                ];
                
                const newOrder = await showChoice(dispatch, 
                    'Choose new turn order for next round', 
                    orderOptions
                );
                
                if (newOrder) {
                    // Apply the turn order change immediately for next round
                    dispatch({
                        type: 'SET_TURN_ORDER',
                        turnOrder: newOrder
                    });
                    
                    const message = `Player ${player.id}: purpleHybrid2 → +1 purple + set turn order to ${newOrder.join(' → ')}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                return;
            }
            
            // Red layer - Repeat an action
            if (actionId === 'redRepeatAction') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { red: 1 }
                });
                
                // RED AUTOMATIC VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'redAction'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                
                const logMessage = `DEBUG: Occupied spaces: ${JSON.stringify(currentState.occupiedSpaces)}`;
                dispatch({ type: 'ADD_LOG', message: logMessage });
                
                // Find all occupied spaces that belong to the current player
                // Exclude: repeat actions and swap actions to prevent confusing chains
                const excludedActions = [
                    // Red actions that could cause infinite loops
                    'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                    // Blue actions that could cause recursion through shops
                    'blueAnyShopBenefit', // Blue R3 - could select Red R3 shop
                    // Victory shops - already purchased, can't repeat
                    'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                    'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
                ];
                const playerSpaces = Object.entries(currentState.occupiedSpaces)
                    .filter(([spaceId, playerId]) => 
                        playerId === player.id && !excludedActions.includes(spaceId)
                    )
                    .map(([spaceId]) => spaceId);
                
                const debugMessage = `DEBUG: Player spaces to repeat: ${playerSpaces.join(', ')}`;
                dispatch({ type: 'ADD_LOG', message: debugMessage });
                
                if (playerSpaces.length === 0) {
                    const message = `Player ${player.id}: redRepeatAction → +1 red (no valid workers to repeat - swap/repeat actions excluded)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Always show selection UI for all workers
                const repeatOptions = playerSpaces.map(spaceId => {
                    // Find the action details
                    let actionTitle = spaceId;
                    for (const layerData of Object.values(gameLayers)) {
                        const action = layerData.actions.find(a => a.id === spaceId);
                        if (action) {
                            actionTitle = action.title;
                            break;
                        }
                    }
                    return {
                        label: `Repeat: ${actionTitle}`,
                        value: spaceId
                    };
                });
                
                const choice = await showChoice(dispatch, 
                    'Choose an action to repeat', 
                    repeatOptions
                );
                
                if (choice) {
                    // Find the action title for better logging
                    let actionTitle = choice;
                    for (const layerData of Object.values(gameLayers)) {
                        const action = layerData.actions.find(a => a.id === choice);
                        if (action) {
                            actionTitle = action.title;
                            break;
                        }
                    }
                    
                    const message = `Player ${player.id}: redRepeatAction → +1 red + repeating ${actionTitle}`;
                    dispatch({ type: 'ADD_LOG', message });
                    
                    // Execute the chosen action again
                    await executeAction(choice, player, dispatch, currentState, gameLayers, recursionDepth + 1, workerInfo);
                }
                return;
            }
            
            // RED LAYER ACTIONS
            
            // Red hybrid actions - swap workers
            if (actionId === 'redHybrid1' || actionId === 'redHybrid2') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { red: 1 }
                });
                
                // RED AUTOMATIC VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'redAutomatic'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                
                // Find workers that can be swapped
                const allWorkers = Object.entries(currentState.occupiedSpaces);
                if (allWorkers.length < 2) {
                    const message = `Player ${player.id}: ${actionId} → +1 red (not enough workers to swap)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Current player chooses their own worker to swap
                // IMPORTANT: Exclude ALL swap actions to prevent chaining
                const myWorkers = allWorkers.filter(([spaceId, pid]) => 
                    pid === player.id && spaceId !== actionId && spaceId !== 'redHybrid1' && spaceId !== 'redHybrid2'
                );
                const otherWorkers = allWorkers.filter(([spaceId, pid]) => 
                    pid !== player.id && spaceId !== actionId && spaceId !== 'redHybrid1' && spaceId !== 'redHybrid2'
                );
                
                if (myWorkers.length === 0 || otherWorkers.length === 0) {
                    const message = `Player ${player.id}: ${actionId} → +1 red (need valid workers from both players - swap actions excluded)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const myWorkerOptions = myWorkers.map(([spaceId, playerId]) => {
                    // Find the action title
                    let actionTitle = spaceId;
                    for (const [color, layer] of Object.entries(gameLayers)) {
                        const action = layer.actions.find(a => a.id === spaceId);
                        if (action) {
                            actionTitle = `${color} - ${action.title}`;
                            break;
                        }
                    }
                    return {
                        label: `Your worker on: ${actionTitle}`,
                        value: { spaceId, playerId }
                    };
                });
                
                const worker1 = await showChoice(dispatch, 'Choose your worker to swap', myWorkerOptions, false, workerInfo);
                if (!worker1) return;
                
                // Current player chooses which other worker to swap with
                // (In multiplayer, this is still the current player's choice)
                const otherWorkerOptions = otherWorkers.map(([spaceId, playerId]) => {
                    // Find the action title
                    let actionTitle = spaceId;
                    for (const [color, layer] of Object.entries(gameLayers)) {
                        const action = layer.actions.find(a => a.id === spaceId);
                        if (action) {
                            actionTitle = `${color} - ${action.title}`;
                            break;
                        }
                    }
                    const otherPlayer = currentState.players.find(p => p.id === playerId);
                    const playerName = otherPlayer ? `${otherPlayer.name} ${otherPlayer.emoji || ''}` : `Player ${playerId}`;
                    return {
                        label: `${playerName}'s worker on: ${actionTitle}`,
                        value: { spaceId, playerId }
                    };
                });
                
                const worker2 = await showChoice(dispatch, `Choose another player's worker to swap with`, otherWorkerOptions, false, workerInfo);
                if (!worker2) return;
                
                // Perform the swap
                const newOccupiedSpaces = { ...currentState.occupiedSpaces };
                newOccupiedSpaces[worker1.spaceId] = worker2.playerId;
                newOccupiedSpaces[worker2.spaceId] = worker1.playerId;
                
                dispatch({
                    type: 'UPDATE_OCCUPIED_SPACES',
                    occupiedSpaces: newOccupiedSpaces
                });
                
                // Log the swap
                const otherPlayerId = worker2.playerId;
                dispatch({ 
                    type: 'ADD_LOG', 
                    message: `Workers swapped between actions` 
                });
                
                // Execute actions for the affected players
                // IMPORTANT: Skip actions that would interfere with the swap itself or create paradoxes
                // Only skip actions that place additional workers (which could create loops)
                const skipActions = ['playTwoWorkers', 'playThreeWorkers'];
                
                if (actionId === 'redHybrid1') {
                    // Both players get actions where their workers END UP
                    // Note: In multiplayer, only execute actions for the current player to avoid UI conflicts
                    if (currentState.roomCode) {
                        // In multiplayer, only current player gets their new action
                        dispatch({ type: 'ADD_LOG', message: `In multiplayer, only current player gets the swap benefit` });
                        if (!skipActions.includes(worker2.spaceId)) {
                            await executeAction(worker2.spaceId, player, dispatch, currentState, gameLayers, recursionDepth + 1);
                        } else {
                            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Cannot execute ${worker2.spaceId} from swap (would interfere with swap)` });
                        }
                    } else {
                        // In single player, both get actions
                        if (!skipActions.includes(worker1.spaceId)) {
                            await executeAction(worker1.spaceId, currentState.players.find(p => p.id === worker2.playerId), dispatch, currentState, gameLayers, recursionDepth + 1);
                        }
                        if (!skipActions.includes(worker2.spaceId)) {
                            await executeAction(worker2.spaceId, currentState.players.find(p => p.id === worker1.playerId), dispatch, currentState, gameLayers, recursionDepth + 1);
                        }
                    }
                } else {
                    // R2: Only current player gets action of where they MOVE TO (not where they were)
                    if (!skipActions.includes(worker2.spaceId)) {
                        await executeAction(worker2.spaceId, player, dispatch, currentState, gameLayers, recursionDepth + 1);
                    } else {
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Cannot execute ${worker2.spaceId} from swap (would interfere with swap)` });
                    }
                }
                
                const message = `Player ${player.id}: ${actionId} → +1 red + swapped workers`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Force red placement
            if (actionId === 'forceRedPlacement') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { red: 1 }
                });
                
                // RED AUTOMATIC VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'redAction'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                
                // Add effect to ALL OTHER players
                currentState.players.forEach(p => {
                    if (p.id !== player.id) {
                        dispatch({
                            type: 'ADD_EFFECT',
                            playerId: p.id,
                            effect: `Must place on red layer (forced by Player ${player.id})`
                        });
                    }
                });
                
                const message = `Player ${player.id}: forceRedPlacement → +1 red + forcing red placement on others`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Red R3 - Repeat all your worker actions
            if (actionId === 'redRepeatAll') {
                // RED AUTOMATIC VP for the action itself
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'redAction'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                
                // Find all spaces occupied by current player
                // Exclude: repeat actions and swap actions to prevent confusing chains
                const excludedActions = [
                    // Red actions that could cause infinite loops
                    'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                    // Blue actions that could cause recursion through shops
                    'blueAnyShopBenefit', // Blue R3 - could select Red R3 shop
                    // Purple actions that manipulate turn order/workers
                    'playTwoWorkers', 'playThreeWorkers', 'gain4purpleWaitAll',
                    // Note: Skip turn actions CAN be repeated - they just add more skips
                    'gain2purpleTakeBack', // Taking back workers is personal
                    // Victory shops - these are one-time purchases, not repeatable actions
                    'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                    'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
                ];
                // Debug logging
                console.log('redRepeatAll - All occupied spaces:', currentState.occupiedSpaces);
                console.log('redRepeatAll - Current player:', player.id);
                
                const playerSpaces = Object.entries(currentState.occupiedSpaces)
                    .filter(([spaceId, occupyingPlayerId]) => {
                        const isPlayerSpace = occupyingPlayerId === player.id;
                        const isExcluded = excludedActions.includes(spaceId);
                        const isCurrentAction = spaceId === actionId;
                        console.log(`Checking ${spaceId}: player=${occupyingPlayerId}, isPlayerSpace=${isPlayerSpace}, isExcluded=${isExcluded}, isCurrentAction=${isCurrentAction}`);
                        return isPlayerSpace && !isExcluded && !isCurrentAction;
                    })
                    .map(([spaceId]) => spaceId);
                
                if (playerSpaces.length === 0) {
                    const message = `Player ${player.id}: redRepeatAll → No other workers to repeat`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: redRepeatAll → Will repeat ${playerSpaces.length} actions` });
                
                // Let player choose order of execution
                const remainingActions = [...playerSpaces];
                while (remainingActions.length > 0) {
                    // Build options for remaining actions
                    const actionOptions = remainingActions.map(spaceId => {
                        let actionTitle = spaceId;
                        for (const [color, layer] of Object.entries(gameLayers)) {
                            const action = layer.actions.find(a => a.id === spaceId);
                            if (action) {
                                actionTitle = `${color} - ${action.title}`;
                                break;
                            }
                        }
                        return {
                            label: actionTitle,
                            value: spaceId
                        };
                    });
                    
                    // Show choice modal
                    const choice = await showChoice(
                        dispatch, 
                        `Choose next action to repeat (${remainingActions.length} remaining)`,
                        actionOptions,
                        false,
                        workerInfo
                    );
                    
                    if (!choice) {
                        // Player cancelled - stop repeating
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Stopped repeating actions` });
                        break;
                    }
                    
                    // Execute the chosen action
                    await executeAction(choice, player, dispatch, currentState, gameLayers, recursionDepth + 1);
                    
                    // Remove from remaining actions
                    const index = remainingActions.indexOf(choice);
                    if (index > -1) {
                        remainingActions.splice(index, 1);
                    }
                }
                
                return;
            }
            
            // YELLOW LAYER ACTIONS
            
            // Trade all resources action (formerly steal2Gems)
            if (actionId === 'steal2Gems') {
                // Count total resources the player has
                const totalResources = Object.values(player.resources).reduce((sum, amount) => sum + amount, 0);
                
                if (totalResources === 0) {
                    const message = `Player ${player.id}: Trade All ⭐ for ⭐ → No resources to trade`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Let player choose new resources equal to their total
                const newResources = await showGemSelection(
                    dispatch,
                    `Trade all ${totalResources} resources for new ones`,
                    totalResources,
                    null,
                    workerInfo
                );
                
                if (!newResources) {
                    const message = `Player ${player.id}: Trade All ⭐ for ⭐ → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Clear all current resources
                const clearResources = {};
                Object.keys(player.resources).forEach(color => {
                    if (player.resources[color] > 0) {
                        clearResources[color] = -player.resources[color];
                    }
                });
                
                // Apply the clear
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: clearResources
                });
                
                // Add new resources
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: newResources
                });
                
                const message = `Player ${player.id}: Trade All ⭐ for ⭐ → Traded ${totalResources} resources`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Steal 3 resources action
            if (actionId === 'steal3Gems') {
                const stealCount = 3;
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                if (otherPlayers.length === 0) {
                    const message = `Player ${player.id}: ${actionId} → No other players to steal from`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Filter players who have resources
                const targetOptions = otherPlayers
                    .filter(p => Object.values(p.resources).some(amount => amount > 0))
                    .map(p => ({
                        label: `Player ${p.id} (${Object.entries(p.resources).filter(([,amt]) => amt > 0).map(([color, amt]) => `${amt} ${color}`).join(', ')})`,
                        value: p.id
                    }));
                
                if (targetOptions.length === 0) {
                    const message = `Player ${player.id}: ${actionId} → No players have resources to steal`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose target player
                const targetId = await showChoice(dispatch, 'Choose player to steal from', targetOptions, false, workerInfo);
                if (!targetId) {
                    const message = `Player ${player.id}: ${actionId} → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const targetPlayer = otherPlayers.find(p => p.id === targetId);
                
                // Attacker chooses which resources to steal
                const selectedGems = await showStealGems(
                    dispatch, 
                    `Steal up to ${stealCount} resources from Player ${targetId}`,
                    targetPlayer,
                    stealCount,
                    workerInfo
                );
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: ${actionId} → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Transfer the resources
                const stolenResources = [];
                Object.entries(selectedGems).forEach(([color, count]) => {
                    if (count > 0) {
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: targetId,
                            resources: { [color]: -count }
                        });
                        
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: player.id,
                            resources: { [color]: count }
                        });
                        
                        stolenResources.push(`${count} ${color}`);
                    }
                });
                
                const message = `Player ${player.id}: ${actionId} → Stole ${stolenResources.join(', ')} from Player ${targetId}`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Yellow hybrid actions
            if (actionId === 'yellowHybrid1') {
                // Gain 2 resources of any color
                const selectedGem = await showGemSelection(dispatch, 'Choose 2 Resources (⭐ Color)', 2, null, workerInfo);
                
                if (!selectedGem) {
                    // If cancelled, give default resource
                    const resources = { yellow: 2 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: yellowHybrid1 → +2 yellow (default)` });
                    return;
                }
                
                const resources = selectedGem;
                
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    // Double all gains
                    Object.keys(resources).forEach(color => {
                        resources[color] *= 2;
                    });
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${player.id}: yellowHybrid1 → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')} (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${player.id}: yellowHybrid1 → +${Object.entries(resources).map(([color, amount]) => `${amount} ${color}`).join(', ')}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources
                });
                
                return;
            }
            
            if (actionId === 'yellowHybrid2') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { yellow: 1 }
                });
                
                dispatch({
                    type: 'ADD_EFFECT',
                    playerId: player.id,
                    effect: 'Next gain will be doubled'
                });
                
                const message = `Player ${player.id}: yellowHybrid2 → +1 yellow + next gain doubled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Yellow R3 - Swap all resources with another player
            if (actionId === 'yellowSwapResources') {
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                if (otherPlayers.length === 0) {
                    const message = `Player ${player.id}: yellowSwapResources → No other players to swap with`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const swapOptions = otherPlayers.map(p => ({
                    label: `Player ${p.id} (${Object.entries(p.resources).filter(([,amt]) => amt > 0).map(([color, amt]) => `${amt} ${color}`).join(', ') || 'no resources'})`,
                    value: p.id
                }));
                
                const targetPlayerId = await showChoice(dispatch, 'Choose player to swap all resources with', swapOptions, false, workerInfo);
                
                if (targetPlayerId) {
                    const targetPlayer = otherPlayers.find(p => p.id === targetPlayerId);
                    const playerResources = { ...player.resources };
                    const targetResources = { ...targetPlayer.resources };
                    
                    // Swap resources
                    dispatch({
                        type: 'SET_RESOURCES',
                        playerId: player.id,
                        resources: targetResources
                    });
                    
                    dispatch({
                        type: 'SET_RESOURCES',
                        playerId: targetPlayerId,
                        resources: playerResources
                    });
                    
                    const message = `Player ${player.id}: yellowSwapResources → Swapped all resources with Player ${targetPlayerId}`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                return;
            }
            
            // BLUE LAYER ACTIONS
            
            // Blue shop benefit actions - gain any shop benefit even if closed
            // Blue R1 shop benefit action
            if (actionId === 'blueR1ShopBenefit') {
                console.log('Executing blueR1ShopBenefit for player', player.id);
                
                // First give the base benefit - no resource gain for this action
                // The benefit is getting a free R1 shop effect
                
                // List all available R1 shops from active game layers only
                const shopOptions = [];
                const colors = currentState.gameLayers ? Object.keys(currentState.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
                
                console.log('Available game layers:', colors);
                
                const colorEmojis = {
                    red: '🔴', yellow: '🟡', blue: '🔵', purple: '🟣',
                    gold: '🟨', white: '⚪', black: '⚫', silver: '🩶'
                };
                
                const quadGroups = {
                    'red': 'Red/Yellow',
                    'yellow': 'Red/Yellow',
                    'blue': 'Blue/Purple',
                    'purple': 'Blue/Purple',
                    'gold': 'Gold/White',
                    'white': 'Gold/White',
                    'black': 'Black/Silver',
                    'silver': 'Black/Silver'
                };
                
                colors.forEach(color => {
                    // Get shop data for description
                    const shopInfo = {
                        red: { 1: 'Repeat a worker\'s action' },
                        yellow: { 1: 'Double your next gain action' },
                        blue: { 1: 'Toggle any shop (open/closed)' },
                        purple: { 1: 'Take an extra turn after this one' },
                        gold: { 1: '1 Gold + 1 ⭐ = 2 Gold' },
                        white: { 1: 'Lose 1 VP, Gain 1 ⭐' },
                        black: { 1: 'Steal 1 VP from another player' },
                        silver: { 1: 'Gain 2 VP' }
                    };
                    
                    const group = quadGroups[color];
                    
                    shopOptions.push({
                        label: `${color} R1: ${shopInfo[color][1]}`,
                        shortLabel: `${colorEmojis[color]} ${shopInfo[color][1]}`,
                        value: { color, round: 1 },
                        group: group
                    });
                });
                
                // Function to check if red shop can be executed
                const canExecuteRedShop = () => {
                    const excludedActions = [
                        'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                        'blueAnyShopBenefit', 'blueR1ShopBenefit',
                        'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                        'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
                    ];
                    
                    const validSpaces = Object.entries(currentState.occupiedSpaces)
                        .filter(([spaceId, pid]) => 
                            pid === player.id && !excludedActions.includes(spaceId)
                        );
                    
                    return validSpaces.length > 0;
                };
                
                // Filter out red shop if it can't be executed
                const filteredOptions = shopOptions.filter(option => {
                    if (option.value.color === 'red' && option.value.round === 1) {
                        return canExecuteRedShop();
                    }
                    return true;
                });
                
                if (filteredOptions.length === 0) {
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: No valid R1 shop benefits available` });
                    return;
                }
                
                const choice = await showChoice(dispatch, 'Choose any R1 shop benefit (ignores closed status)', filteredOptions, true, workerInfo);
                
                if (choice) {
                    console.log('Player chose shop:', choice.color, 'R', choice.round);
                    
                    // Execute the shop benefit without paying cost
                    await executeShopBenefit(choice.color, choice.round, player, dispatch, currentState, recursionDepth + 1);
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Executed ${choice.color} R1 shop benefit` });
                    
                    // BLUE AUTOMATIC VP: Check if blue layer is active
                    if (currentState.automaticVPs && currentState.automaticVPs.blue) {
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: player.id,
                            vp: 1,
                            source: 'blueShopUsage'
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (blue automatic VP for shop use)` });
                    }
                } else {
                    console.log('Player cancelled R1 shop selection');
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Cancelled R1 shop benefit selection` });
                }
                
                return;
            }
            
            // Blue any shop benefit action (R3)
            if (actionId === 'blueAnyShopBenefit') {
                console.log('Executing blueAnyShopBenefit for player', player.id);
                
                // List all available shops from active game layers only
                const shopOptions = [];
                const colors = currentState.gameLayers ? Object.keys(currentState.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
                
                console.log('Available game layers:', colors);
                
                const shopInfo = {
                    red: {
                        1: 'Repeat a worker\'s action',
                        2: 'Place the next player\'s worker',
                        3: 'Repeat all actions taken this round'
                    },
                    yellow: {
                        1: 'Double your next gain action',
                        2: 'Gain 5 ⭐',
                        3: 'Gain 7 ⭐'
                    },
                    blue: {
                        1: 'Close any shop this round',
                        2: 'Toggle the status of all shops',
                        3: 'Gain any shop benefit'
                    },
                    purple: {
                        1: 'Take an extra turn',
                        2: 'Play 2 more workers',
                        3: 'Play all remaining workers'
                    },
                    gold: {
                        1: '1 gold + 1 any → 2 gold',
                        2: '2 gold + 2 any → 4 gold',
                        3: '3 gold + 3 any → 2x gold'
                    },
                    white: {
                        1: 'Pay 1 VP → Gain 1 any gem',
                        2: 'Pay 3 VP → Skip next player',
                        3: 'Pay 5 VP → Move a worker'
                    },
                    black: {
                        1: 'Steal 1 VP from a player',
                        2: 'Steal 3 VP from a player',
                        3: 'Steal 5 VP from a player'
                    },
                    silver: {
                        1: 'Gain 2 VP',
                        2: 'Gain 4 VP, pick player for 4 VP',
                        3: 'Gain 7 silver, others get 2'
                    }
                };
                
                const colorEmojis = {
                    red: '🔴', yellow: '🟡', blue: '🔵', purple: '🟣',
                    gold: '🟨', white: '⚪', black: '⚫', silver: '🩶'
                };
                
                colors.forEach(color => {
                    // Each color gets its own group for proper column display
                    const group = color.charAt(0).toUpperCase() + color.slice(1);
                    
                    // R1 shops
                    shopOptions.push({
                        label: `${color} R1: ${shopInfo[color][1]}`,
                        shortLabel: `R1: ${shopInfo[color][1]}`,
                        value: { color, round: 1 },
                        group: group
                    });
                    // R2 shops
                    shopOptions.push({
                        label: `${color} R2: ${shopInfo[color][2]}`,
                        shortLabel: `R2: ${shopInfo[color][2]}`,
                        value: { color, round: 2 },
                        group: group
                    });
                    // R3 shops
                    // IMPORTANT: Exclude Blue R3 to prevent infinite recursion
                    if (!(color === 'blue' && actionId === 'blueAnyShopBenefit')) {
                        shopOptions.push({
                            label: `${color} R3: ${shopInfo[color][3]}`,
                            shortLabel: `R3: ${shopInfo[color][3]}`,
                            value: { color, round: 3 },
                            group: group
                        });
                    }
                    // Victory shops - include all VP shops
                    // VP values vary by color
                    const vpShopData = {
                        red: { cost: '5 red', vp: 5 },
                        yellow: { cost: '5 ⭐', vp: 3 },
                        blue: { cost: '5 blue', vp: 5 },
                        purple: { cost: '6 purple', vp: 5 },
                        white: { cost: '4 white', vp: 4 },
                        black: { cost: '6 black', vp: 'Steal 2 from each' },
                        silver: { cost: '6 silver', vp: 8 },
                        gold: null // Gold has no VP shop
                    };
                    
                    if (vpShopData[color]) {
                        const vpData = vpShopData[color];
                        shopOptions.push({
                            label: `Victory: ${typeof vpData.vp === 'number' ? vpData.vp + ' VP' : vpData.vp}`,
                            shortLabel: `Victory: ${typeof vpData.vp === 'number' ? vpData.vp + ' VP' : vpData.vp}`,
                            value: { color, round: 'vp' },
                            group: group
                        });
                    }
                });
                
                const choice = await showChoice(dispatch, 'Choose any shop benefit (ignores closed status)', shopOptions, true, workerInfo);
                
                if (choice) {
                    // Execute the shop benefit without paying cost
                    if (choice.round === 'vp') {
                        // Handle VP shops
                        if (choice.color === 'black') {
                            // Black VP shop: Steal 2 VP from each other player
                            const otherPlayers = state.players.filter(p => p.id !== player.id);
                            otherPlayers.forEach(otherPlayer => {
                                const vpToSteal = Math.min(2, otherPlayer.victoryPoints);
                                if (vpToSteal > 0) {
                                    dispatch({
                                        type: 'UPDATE_VP',
                                        playerId: otherPlayer.id,
                                        vp: -vpToSteal,
                                        source: 'blackSteal'
                                    });
                                    dispatch({
                                        type: 'UPDATE_VP',
                                        playerId: player.id,
                                        vp: vpToSteal,
                                        source: 'blackSteal'
                                    });
                                }
                            });
                            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black Victory shop → Stole 2 VP from each other player` });
                        } else {
                            // Regular VP shops
                            const vpAmounts = {
                                red: 5, yellow: 3, blue: 5, purple: 5,
                                white: 4, silver: 8
                            };
                            const vpGain = vpAmounts[choice.color] || 3;
                            dispatch({
                                type: 'UPDATE_VP',
                                playerId: player.id,
                                vp: vpGain,
                                source: 'victoryShop'
                            });
                            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: ${choice.color} Victory shop → +${vpGain} VP` });
                        }
                    } else {
                        // Execute regular shop effect
                        console.log('Blue R3: About to execute shop benefit for', choice.color, 'R' + choice.round);
                        // Use currentState instead of state to avoid stale closure
                        await executeShopBenefit(choice.color, choice.round, player, dispatch, currentState, recursionDepth + 1);
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Executed ${choice.color} R${choice.round} shop benefit` });
                    }
                    
                    // BLUE AUTOMATIC VP: Player gets 1 VP when using any shop benefit
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: player.id,
                        vp: 1,
                        source: 'blueShopUsage'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (used a shop benefit)` });
                }
                
                return;
            }
            
            // Blue reduce costs action
            if (actionId === 'blueReduceCosts') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { blue: 1 }
                });
                
                // Add cost reduction for this player only
                dispatch({
                    type: 'ADD_SHOP_COST_MODIFIER',
                    playerId: player.id,
                    modifier: -1
                });
                
                const message = `Player ${player.id}: blueReduceCosts → +1 blue + your shop costs reduced by 1 ⭐`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Blue increase costs action
            if (actionId === 'blueIncreaseCosts') {
                // Give player 2 blue resources
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { blue: 2 }
                });
                
                // Add cost increase for ALL OTHER players this round - this should stack if repeated
                currentState.players.forEach(p => {
                    if (p.id !== player.id) {
                        dispatch({
                            type: 'ADD_SHOP_COST_MODIFIER',
                            playerId: p.id,
                            modifier: 2
                        });
                    }
                });
                
                const message = `Player ${player.id}: blueIncreaseCosts → +2 blue, all other players' shop costs increased by 2 ⭐`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Blue toggle shops action
            if (actionId === 'blueToggleShops') {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { blue: 2 }
                });
                
                // Toggle all shops (flip status)
                dispatch({
                    type: 'FLIP_ALL_SHOPS'
                });
                
                const message = `Player ${player.id}: blueToggleShops → +2 blue + all shops toggled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // GOLD LAYER ACTIONS
            
            // Convert 2 ⭐ to 2 Gold
            if (actionId === 'convert2AnyTo2Gold') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                
                // Count non-gold gems for conversion
                const nonGoldGems = Object.entries(currentPlayer.resources)
                    .filter(([color, amount]) => color !== 'gold' && amount > 0)
                    .reduce((sum, [color, amount]) => sum + amount, 0);
                if (nonGoldGems < 2) {
                    const message = `Player ${player.id}: convert2AnyTo2Gold → Need at least 2 gems`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose 2 gems to convert  
                const selectedGems = await showGemSelection(dispatch, 'Choose 2 gems to convert to Gold', 2, currentPlayer, workerInfo);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: convert2AnyTo2Gold → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove selected gems and add 2 gold
                const resources = { gold: 2 };
                Object.entries(selectedGems).forEach(([color, amount]) => {
                    resources[color] = -amount;
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                const message = `Player ${player.id}: convert2AnyTo2Gold → Converted 2 gems to 2 gold`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Convert 1 ⭐ to 1 Gold
            if (actionId === 'convert1AnyTo1Gold') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                
                // Count non-gold gems for conversion
                const nonGoldGems = Object.entries(currentPlayer.resources)
                    .filter(([color, amount]) => color !== 'gold' && amount > 0)
                    .reduce((sum, [color, amount]) => sum + amount, 0);
                if (nonGoldGems < 1) {
                    const message = `Player ${player.id}: convert1AnyTo1Gold → Need at least 1 gem`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose 1 gem to convert
                const selectedGems = await showGemSelection(dispatch, 'Choose 1 gem to convert to Gold', 1, currentPlayer, workerInfo);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: convert1AnyTo1Gold → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove selected gem and add 1 gold
                const resources = { gold: 1 };
                Object.entries(selectedGems).forEach(([color, amount]) => {
                    resources[color] = -amount;
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                const message = `Player ${player.id}: convert1AnyTo1Gold → Converted 1 gem to 1 gold`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Gain 3 Gold, Skip Next Turn
            if (actionId === 'gain3goldSkip') {
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                let goldGain = 3;
                
                if (hasDoubleEffect) {
                    goldGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { gold: goldGain }
                });
                
                // Set skip for next turn
                const newSkippedTurns = { ...currentState.skippedTurns };
                newSkippedTurns[player.id] = (newSkippedTurns[player.id] || 0) + 1;
                dispatch({
                    type: 'SET_SKIPPED_TURNS',
                    skippedTurns: newSkippedTurns
                });
                
                const message = `Player ${player.id}: gain3goldSkip → +${goldGain} gold${hasDoubleEffect ? ' (DOUBLED!)' : ''}, will skip next turn (total skips: ${newSkippedTurns[player.id]})`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Convert 3 ⭐ to 3 Gold
            if (actionId === 'convert3AnyTo3Gold') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                
                // Count non-gold gems for conversion
                const nonGoldGems = Object.entries(currentPlayer.resources)
                    .filter(([color, amount]) => color !== 'gold' && amount > 0)
                    .reduce((sum, [color, amount]) => sum + amount, 0);
                if (nonGoldGems < 3) {
                    const message = `Player ${player.id}: convert3AnyTo3Gold → Need at least 3 gems`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose 3 gems to convert
                const selectedGems = await showGemSelection(dispatch, 'Choose 3 gems to convert to Gold', 3, currentPlayer, workerInfo);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: convert3AnyTo3Gold → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove selected gems and add 3 gold
                const resources = { gold: 3 };
                Object.entries(selectedGems).forEach(([color, amount]) => {
                    resources[color] = -amount;
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                const message = `Player ${player.id}: convert3AnyTo3Gold → Converted 3 gems to 3 gold`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Gain VP for Each Gold You Have
            if (actionId === 'goldVPPerGold') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                const goldAmount = currentPlayer.resources.gold || 0;
                if (goldAmount > 0) {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: player.id,
                        vp: goldAmount,
                        source: 'goldVPPerGold'
                    });
                    const message = `Player ${player.id}: goldVPPerGold → +${goldAmount} VP (1 per gold)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${player.id}: goldVPPerGold → No gold, no VP gained`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                return;
            }
            
            // WHITE LAYER ACTIONS - Victory Points
            
            // Gain 3 VP
            if (actionId === 'gain3vp') {
                let vpGain = 3;
                
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    vpGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${player.id}: gain3vp → +${vpGain} VP (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${player.id}: gain3vp → +${vpGain} VP`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: vpGain,
                    source: 'whiteAction'
                });
                return;
            }
            
            // Gain 2 VP
            if (actionId === 'gain2vp') {
                let vpGain = 2;
                
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    vpGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                    
                    const message = `Player ${player.id}: gain2vp → +${vpGain} VP (DOUBLED!)`;
                    dispatch({ type: 'ADD_LOG', message });
                } else {
                    const message = `Player ${player.id}: gain2vp → +${vpGain} VP`;
                    dispatch({ type: 'ADD_LOG', message });
                }
                
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: vpGain,
                    source: 'whiteAction'
                });
                return;
            }
            
            // Spend 1 ⭐ for 2 VP
            if (actionId === 'spend1AnyFor2VP') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                const totalGems = Object.values(currentPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                if (totalGems < 1) {
                    const message = `Player ${player.id}: spend1AnyFor2VP → Need at least 1 gem`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose 1 gem to spend
                const selectedGems = await showGemSelection(dispatch, 'Choose 1 gem to spend for 2 VP', 1, currentPlayer, workerInfo);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: spend1AnyFor2VP → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove selected gem
                const resources = {};
                Object.entries(selectedGems).forEach(([color, amount]) => {
                    resources[color] = -amount;
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                // Gain 2 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 2,
                    source: 'whiteAction'
                });
                
                const message = `Player ${player.id}: spend1AnyFor2VP → Spent 1 gem for 2 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Spend 2 ⭐ for 3 VP
            if (actionId === 'spend2AnyFor3VP') {
                // Get fresh player state
                const currentPlayer = currentState.players.find(p => p.id === player.id);
                const totalGems = Object.values(currentPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                if (totalGems < 2) {
                    const message = `Player ${player.id}: spend2AnyFor3VP → Need at least 2 gems`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose 2 gems to spend
                const selectedGems = await showGemSelection(dispatch, 'Choose 2 gems to spend for 3 VP', 2, currentPlayer, workerInfo);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: spend2AnyFor3VP → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove selected gems
                const resources = {};
                Object.entries(selectedGems).forEach(([color, amount]) => {
                    resources[color] = -amount;
                });
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: resources
                });
                
                // Gain 3 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 3,
                    source: 'whiteAction'
                });
                
                const message = `Player ${player.id}: spend2AnyFor3VP → Spent 2 gems for 3 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Lose 1 VP, Gain 2 ⭐
            if (actionId === 'lose1VPGain2Any') {
                if (player.victoryPoints < 1) {
                    const message = `Player ${player.id}: lose1VPGain2Any → Need at least 1 VP`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Lose 1 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: -1,
                    source: 'whiteAction'
                });
                
                let gemsToGain = 2;
                
                // Check for doubling effect
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    gemsToGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                // Choose gems to gain
                const selectedGems = await showGemSelection(dispatch, `Choose ${gemsToGain} gems to gain`, gemsToGain, null, workerInfo);
                
                if (!selectedGems) {
                    // If cancelled, give default resources
                    const defaultGems = {};
                    const colors = currentState.gameLayers ? Object.keys(currentState.gameLayers) : ['red', 'blue'];
                    for (let i = 0; i < gemsToGain && i < colors.length; i++) {
                        defaultGems[colors[i]] = (defaultGems[colors[i]] || 0) + 1;
                    }
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources: defaultGems });
                    const message = `Player ${player.id}: lose1VPGain2Any → -1 VP, +${gemsToGain} gems (default)${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: selectedGems
                });
                
                const message = `Player ${player.id}: lose1VPGain2Any → -1 VP, gained ${gemsToGain} gems${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Lose 2 VP, Gain 4 ⭐
            if (actionId === 'lose2VPGain4Any') {
                if (player.victoryPoints < 2) {
                    const message = `Player ${player.id}: lose2VPGain4Any → Need at least 2 VP`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Lose 2 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: -2,
                    source: 'whiteAction'
                });
                
                // Choose 4 gems to gain
                const selectedGems = await showGemSelection(dispatch, 'Choose 4 gems to gain', 4, null, workerInfo);
                
                if (!selectedGems) {
                    // If cancelled, give default resources
                    const resources = { red: 1, yellow: 1, blue: 1, purple: 1 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                    const message = `Player ${player.id}: lose2VPGain4Any → -2 VP, +1 of each color (default)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: selectedGems
                });
                
                const message = `Player ${player.id}: lose2VPGain4Any → -2 VP, gained 4 gems`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Gain 5 VP and 5 ⭐
            if (actionId === 'gain5VPAnd5Any') {
                // Gain 5 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 5,
                    source: 'whiteAction'
                });
                
                // Choose 5 gems to gain
                const selectedGems = await showGemSelection(dispatch, 'Choose 5 gems to gain', 5);
                
                if (!selectedGems) {
                    // If cancelled, give default resources
                    const resources = { red: 1, yellow: 1, blue: 1, purple: 1, gold: 1 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                    const message = `Player ${player.id}: gain5VPAnd5Any → +5 VP, +1 of each color (default)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: selectedGems
                });
                
                const message = `Player ${player.id}: gain5VPAnd5Any → +5 VP and 5 gems`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // BLACK LAYER ACTIONS
            
            // Steal 1 VP from another player
            if (actionId === 'blackSteal1VP') {
                // Give 1 black resource
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { black: 1 }
                });
                
                // Choose a player to steal from (can steal from players with 0 or negative VP)
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                if (otherPlayers.length === 0) {
                    const message = `Player ${player.id}: blackSteal1VP → +1 black (no other players)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Show all players with their VP (including negative)
                const targetPlayer = await selectTargetPlayer(
                    dispatch,
                    'Choose a player to steal 1 VP from',
                    currentState.players,
                    player.id,
                    workerInfo
                );
                
                if (!targetPlayer) {
                    const message = `Player ${player.id}: blackSteal1VP → +1 black (cancelled)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove 1 VP from target
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: targetPlayer.id,
                    vp: -1,
                    source: 'blackSteal'
                });
                
                // Add 1 VP to current player
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'blackSteal'
                });
                
                const message = `Player ${player.id}: blackSteal1VP → +1 black, stole 1 VP from Player ${targetPlayer.id}`;
                dispatch({ type: 'ADD_LOG', message });
                
                // BLACK AUTOMATIC VP: Gain 1 VP when stealing
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'blackAutomatic'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
                
                return;
            }
            
            // Steal 2 ⭐ from another player
            if (actionId === 'blackSteal2Any') {
                // Choose a player to steal from
                const otherPlayers = currentState.players.filter(p => {
                    if (p.id === player.id) return false;
                    const totalGems = Object.values(p.resources).reduce((sum, amount) => sum + amount, 0);
                    return totalGems > 0;
                });
                
                if (otherPlayers.length === 0) {
                    const message = `Player ${player.id}: blackSteal2Any → No players with gems to steal from`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const targetPlayer = await selectTargetPlayer(dispatch, 'Choose a player to steal 2 gems from', currentState.players, player.id, workerInfo);
                
                if (!targetPlayer) {
                    const message = `Player ${player.id}: blackSteal2Any → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose gems to steal
                const targetTotalGems = Object.values(targetPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                const stealCount = Math.min(2, targetTotalGems);
                
                if (stealCount === 0) {
                    const message = `Player ${player.id}: blackSteal2Any → Player ${targetPlayer.id} has no gems`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const stolenGems = await showStealGems(dispatch, `Choose ${stealCount} gems to steal from Player ${targetPlayer.id}`, targetPlayer, stealCount, workerInfo);
                
                if (!stolenGems) {
                    const message = `Player ${player.id}: blackSteal2Any → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Remove gems from target
                const negativeResources = {};
                Object.entries(stolenGems).forEach(([color, amount]) => {
                    negativeResources[color] = -amount;
                });
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: targetPlayer.id,
                    resources: negativeResources
                });
                
                // Add gems to current player
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: stolenGems
                });
                
                const message = `Player ${player.id}: blackSteal2Any → Stole ${Object.entries(stolenGems).map(([color, amount]) => `${amount} ${color}`).join(', ')} from Player ${targetPlayer.id}`;
                dispatch({ type: 'ADD_LOG', message });
                
                // BLACK AUTOMATIC VP: Gain 1 VP when stealing
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'blackAutomatic'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
                
                return;
            }
            
            // Steal a Worker from another player
            if (actionId === 'blackStealWorker') {
                // Give 1 black resource
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { black: 1 }
                });
                
                const stealCount = 4;
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                if (otherPlayers.length === 0) {
                    const message = `Player ${player.id}: blackStealWorker → +1 black (no other players to steal from)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Filter players who have resources
                const targetOptions = otherPlayers
                    .filter(p => Object.values(p.resources).some(amount => amount > 0))
                    .map(p => ({
                        label: `Player ${p.id} (${Object.entries(p.resources).filter(([,amt]) => amt > 0).map(([color, amt]) => `${amt} ${color}`).join(', ')})`,
                        value: p.id
                    }));
                
                if (targetOptions.length === 0) {
                    const message = `Player ${player.id}: blackStealWorker → +1 black (no players have resources to steal)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Choose target player
                const targetId = await showChoice(dispatch, 'Choose player to steal 4 resources from', targetOptions, false, workerInfo);
                if (!targetId) {
                    const message = `Player ${player.id}: blackStealWorker → +1 black (cancelled)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                const targetPlayer = otherPlayers.find(p => p.id === targetId);
                
                // Calculate max stealable resources
                const targetTotalGems = Object.values(targetPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                const actualStealCount = Math.min(stealCount, targetTotalGems);
                
                // Attacker chooses which resources to steal
                const selectedGems = await showStealGems(
                    dispatch, 
                    `Steal up to ${actualStealCount} resources from Player ${targetId}`,
                    targetPlayer,
                    actualStealCount,
                    workerInfo
                );
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: blackStealWorker → +1 black (cancelled)`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Transfer the resources
                const stolenResources = [];
                Object.entries(selectedGems).forEach(([color, count]) => {
                    if (count > 0) {
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: targetId,
                            resources: { [color]: -count }
                        });
                        
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: player.id,
                            resources: { [color]: count }
                        });
                        
                        stolenResources.push(`${count} ${color}`);
                    }
                });
                
                const message = `Player ${player.id}: blackStealWorker → +1 black, stole ${stolenResources.join(', ')} from Player ${targetId}`;
                dispatch({ type: 'ADD_LOG', message });
                
                // BLACK AUTOMATIC VP: Gain 1 VP when stealing
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'blackAutomatic'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
                
                return;
            }
            
            // All other players lose 2 VP
            if (actionId === 'blackAllLose2VP') {
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: otherPlayer.id,
                        vp: -2,
                        source: 'blackPenalty'
                    });
                });
                
                const message = `Player ${player.id}: blackAllLose2VP → All other players lose 2 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // All other players lose 4 VP
            if (actionId === 'blackAllLose4VP') {
                // Give 2 black resources
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { black: 2 }
                });
                
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: otherPlayer.id,
                        vp: -4,
                        source: 'blackPenalty'
                    });
                });
                
                const message = `Player ${player.id}: blackAllLose4VP → +2 black, all other players lose 4 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // SILVER LAYER ACTIONS
            
            // +4 Silver, Other Players Get +1 Silver
            if (actionId === 'silver4Others1') {
                // Give current player 4 silver
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { silver: 4 }
                });
                
                // Give other players 1 silver each
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: otherPlayer.id,
                        resources: { silver: 1 }
                    });
                });
                
                const message = `Player ${player.id}: silver4Others1 → +4 silver, all other players +1 silver`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +3 Silver, Other Players Get +1 Silver
            if (actionId === 'silver3Others1') {
                // Give current player 3 silver
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { silver: 3 }
                });
                
                // Give other players 1 silver each
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: otherPlayer.id,
                        resources: { silver: 1 }
                    });
                });
                
                const message = `Player ${player.id}: silver3Others1 → +3 silver, all other players +1 silver`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +2 Silver + 1 ⭐ Color, Other Players Get 1 of Same Color
            if (actionId === 'silver2Plus1Others') {
                // Give current player 2 silver
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { silver: 2 }
                });
                
                // Choose 1 gem of any color
                const selectedGems = await showGemSelection(dispatch, 'Choose 1 gem (others will get the same)', 1, null, workerInfo, player.id);
                
                if (!selectedGems) {
                    // If cancelled, give default red
                    const resources = { red: 1 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                    
                    // Give other players 1 red
                    const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                    otherPlayers.forEach(otherPlayer => {
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: otherPlayer.id,
                            resources: { red: 1 }
                        });
                    });
                    
                    const message = `Player ${player.id}: silver2Plus1Others → +2 silver +1 red, others +1 red`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Give current player the selected gem
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: selectedGems
                });
                
                // Give other players the same color
                const chosenColor = Object.keys(selectedGems)[0];
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: otherPlayer.id,
                        resources: { [chosenColor]: 1 }
                    });
                });
                
                const message = `Player ${player.id}: silver2Plus1Others → +2 silver +1 ${chosenColor}, others +1 ${chosenColor}`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +2 VP, Pick Another Player to Also Gain +2 VP
            if (actionId === 'silver2VPBoth') {
                // Give current player 2 VP
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 2,
                    source: 'silverAction'
                });
                
                // Choose another player to give 2 VP
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                const targetPlayer = await selectTargetPlayer(dispatch, 'Choose a player to also gain 2 VP', currentState.players, player.id, workerInfo);
                
                if (!targetPlayer) {
                    // If cancelled, pick first other player
                    const firstOther = otherPlayers[0];
                    if (firstOther) {
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: firstOther.id,
                            vp: 2,
                            source: 'silverAction'
                        });
                        const message = `Player ${player.id}: silver2VPBoth → +2 VP, Player ${firstOther.id} +2 VP`;
                        dispatch({ type: 'ADD_LOG', message });
                    } else {
                        const message = `Player ${player.id}: silver2VPBoth → +2 VP (no other players)`;
                        dispatch({ type: 'ADD_LOG', message });
                    }
                    return;
                }
                
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: targetPlayer.id,
                    vp: 2,
                    source: 'silverAction'
                });
                
                const message = `Player ${player.id}: silver2VPBoth → +2 VP, Player ${targetPlayer.id} +2 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +2 Silver, Take Back Two Workers, Each Other Player Takes Back One
            if (actionId === 'silverTakeBack2') {
                // Give current player 2 silver
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { silver: 2 }
                });
                
                // Take back 2 workers for current player
                const occupiedByPlayer = Object.entries(currentState.occupiedSpaces || {})
                    .filter(([actionId, playerId]) => playerId === player.id);
                
                let workersReturned = 0;
                for (let i = 0; i < Math.min(2, occupiedByPlayer.length); i++) {
                    const [workerAction] = occupiedByPlayer[i];
                    dispatch({
                        type: 'REMOVE_WORKER',
                        actionId: workerAction,
                        playerId: player.id
                    });
                    workersReturned++;
                }
                
                // Each other player takes back 1 worker
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    const theirWorkers = Object.entries(currentState.occupiedSpaces || {})
                        .filter(([actionId, playerId]) => playerId === otherPlayer.id);
                    
                    if (theirWorkers.length > 0) {
                        const [workerAction] = theirWorkers[0];
                        dispatch({
                            type: 'REMOVE_WORKER',
                            actionId: workerAction,
                            playerId: otherPlayer.id
                        });
                    }
                });
                
                const message = `Player ${player.id}: silverTakeBack2 → +2 silver, took back ${workersReturned} workers, others took back 1`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +3 Silver + 2 ⭐ Color, Other Players Get 1 of That Color
            if (actionId === 'silver3Plus2Others1') {
                // Give current player 3 silver
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { silver: 3 }
                });
                
                // Choose 1 color to get 2 of (must be same color)
                const selectedGems = await showGemSelection(dispatch, 'Choose 1 color to get 2 gems of (others will get 1 of that color)', 1, null, workerInfo, player.id);
                
                if (!selectedGems) {
                    // If cancelled, give default red
                    const resources = { red: 2 };
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                    
                    // Give other players 1 red
                    const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                    otherPlayers.forEach(otherPlayer => {
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: otherPlayer.id,
                            resources: { red: 1 }
                        });
                    });
                    
                    const message = `Player ${player.id}: silver3Plus2Others1 → +3 silver +2 red, others +1 red`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
                
                // Give current player 2 of the selected color
                const chosenColor = Object.keys(selectedGems)[0];
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: player.id,
                    resources: { [chosenColor]: 2 }
                });
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: otherPlayer.id,
                        resources: { [chosenColor]: 1 }
                    });
                });
                
                const message = `Player ${player.id}: silver3Plus2Others1 → +3 silver +2 ${chosenColor}, others +1 ${chosenColor}`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // +8 VP, Others +3 Silver
            if (actionId === 'silver8VPOthers3S') {
                // Give current player 8 VP
                let vpGain = 8;
                
                // Check for doubling effect on VP
                const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
                if (hasDoubleEffect) {
                    vpGain *= 2;
                    
                    // Remove the doubling effect after use
                    dispatch({
                        type: 'UPDATE_PLAYER_EFFECTS',
                        playerId: player.id,
                        effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                    });
                }
                
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: vpGain,
                    source: 'silverAction'
                });
                
                // Give 3 silver to each other player
                const otherPlayers = currentState.players.filter(p => p.id !== player.id);
                otherPlayers.forEach(otherPlayer => {
                    dispatch({
                        type: 'UPDATE_RESOURCES',
                        playerId: otherPlayer.id,
                        resources: { silver: 3 }
                    });
                });
                
                const message = `Player ${player.id}: silver8VPOthers3S → +${vpGain} VP${hasDoubleEffect ? ' (DOUBLED!)' : ''}, each other player +3 silver`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            console.log(`Player ${player.id} executed action: ${actionId}`);
        }

        // Custom Modal Components
        function Modal({ isOpen, onClose, children }) {
            React.useEffect(() => {
                if (isOpen) {
                    // Use requestAnimationFrame to ensure DOM is ready
                    requestAnimationFrame(() => {
                        // Calculate scrollbar width to prevent layout shift
                        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
                        
                        // Apply padding to body and html to prevent shift
                        document.body.style.paddingRight = `${scrollbarWidth}px`;
                        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
                        document.body.classList.add('modal-open');
                        
                        // Also apply to any fixed positioned elements
                        const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
                        fixedElements.forEach(el => {
                            el.dataset.originalPadding = el.style.paddingRight || '';
                            el.style.paddingRight = `${scrollbarWidth}px`;
                        });
                    });
                    
                    return () => {
                        document.body.classList.remove('modal-open');
                        document.body.style.paddingRight = '';
                        document.documentElement.style.paddingRight = '';
                        const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
                        fixedElements.forEach(el => {
                            el.style.paddingRight = el.dataset.originalPadding || '';
                            delete el.dataset.originalPadding;
                        });
                    };
                }
            }, [isOpen]);
            
            if (!isOpen) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden',
                onClick: onClose
            }, React.createElement('div', {
                className: 'glass rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto',
                onClick: (e) => e.stopPropagation()
            }, children));
        }

        function ChoiceModal({ title, options, onSelect, onCancel, columnMode = false }) {
            const { dispatch } = useGame();
            
            const handleSelect = (option) => {
                dispatch({ type: 'HIDE_MODAL' });
                onSelect(option);
            };
            
            const handleCancel = () => {
                dispatch({ type: 'HIDE_MODAL' });
                if (onCancel) onCancel();
            };
            
            // If columnMode is true and options have groups, render in columns
            if (columnMode && options.some(opt => opt.group)) {
                // Group options by their group property
                const groupedOptions = options.reduce((groups, option) => {
                    const group = option.group || 'Other';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(option);
                    return groups;
                }, {});
                
                const quadColors = {
                    'Red/Yellow': 'from-red-400 to-yellow-400',
                    'Blue/Purple': 'from-blue-400 to-purple-400',
                    'Gold/White': 'from-yellow-500 to-gray-100',
                    'Black/Silver': 'from-gray-800 to-gray-400',
                    // Individual quad colors
                    'Red Quad': 'from-red-400 to-red-500',
                    'Yellow Quad': 'from-yellow-400 to-yellow-500',
                    'Blue Quad': 'from-blue-400 to-blue-500',
                    'Purple Quad': 'from-purple-400 to-purple-500',
                    'Gold Quad': 'from-yellow-500 to-yellow-600',
                    'White Quad': 'from-gray-100 to-gray-200',
                    'Black Quad': 'from-gray-800 to-gray-900',
                    'Silver Quad': 'from-gray-400 to-gray-500'
                };
                
                return React.createElement('div', { className: 'text-center' }, [
                    React.createElement('h3', { 
                        key: 'title', 
                        className: 'text-xl font-bold text-gray-800 mb-4' 
                    }, title),
                    React.createElement('div', { 
                        key: 'columns', 
                        className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto' 
                    }, Object.entries(groupedOptions).map(([groupName, groupOptions]) => 
                        React.createElement('div', {
                            key: groupName,
                            className: 'space-y-2'
                        }, [
                            React.createElement('h4', {
                                key: 'header',
                                className: `text-sm font-bold text-gray-700 mb-2 p-1 rounded bg-gradient-to-r ${quadColors[groupName] || 'from-gray-200 to-gray-300'}`
                            }, groupName),
                            ...groupOptions.map((option, index) => 
                                React.createElement('button', {
                                    key: `${groupName}-${index}`,
                                    onClick: () => handleSelect(option.value || option),
                                    className: 'w-full text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold py-1 px-2 rounded-md shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-left',
                                    title: option.label || option
                                }, option.label || option.shortLabel || option)
                            )
                        ])
                    )),
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        className: 'w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Cancel')
                ]);
            }
            
            // Default single column mode
            return React.createElement('div', { className: 'text-center' }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-xl font-bold text-gray-800 mb-4' 
                }, title),
                React.createElement('div', { 
                    key: 'options', 
                    className: 'space-y-2 mb-6' 
                }, options.map((option, index) => 
                    React.createElement('button', {
                        key: index,
                        onClick: () => handleSelect(option.value || option),
                        className: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                    }, option.label || option)
                )),
                React.createElement('button', {
                    key: 'cancel',
                    onClick: handleCancel,
                    className: 'w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                }, 'Cancel')
            ]);
        }

        function ConfirmModal({ title, message, onConfirm, onCancel }) {
            const { dispatch } = useGame();
            
            const handleConfirm = () => {
                dispatch({ type: 'HIDE_MODAL' });
                onConfirm();
            };
            
            const handleCancel = () => {
                dispatch({ type: 'HIDE_MODAL' });
                if (onCancel) onCancel();
            };
            
            return React.createElement('div', { className: 'text-center' }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-xl font-bold text-gray-800 mb-2' 
                }, title),
                React.createElement('p', { 
                    key: 'message', 
                    className: 'text-gray-600 mb-6' 
                }, message),
                React.createElement('div', { 
                    key: 'buttons', 
                    className: 'flex gap-3' 
                }, [
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        className: 'flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Cancel'),
                    React.createElement('button', {
                        key: 'confirm',
                        onClick: handleConfirm,
                        className: 'flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Confirm')
                ])
            ]);
        }

        // Round Transition Modal Component
        function RoundTransitionModal({ round, players }) {
            const { state, dispatch } = useGame();
            
            const handleClose = () => {
                dispatch({ type: 'HIDE_MODAL' });
                // After closing, advance the round
                dispatch({ type: 'ADVANCE_ROUND' });
            };
            
            // Calculate total resources for each player
            const getPlayerResources = (player) => {
                return Object.entries(player.resources)
                    .filter(([_, amount]) => amount > 0)
                    .map(([color, amount]) => {
                        const colorEmojis = {
                            red: '🔴', yellow: '🟡', blue: '🔵', purple: '🟣',
                            gold: '🟨', white: '⚪', black: '⚫', silver: '🩶'
                        };
                        return `${amount}${colorEmojis[color]}`;
                    })
                    .join(' ');
            };
            
            // Sort players by VP
            const sortedPlayers = [...players].sort((a, b) => b.victoryPoints - a.victoryPoints);
            
            return React.createElement('div', { className: 'text-center max-w-2xl' }, [
                React.createElement('h2', { 
                    key: 'title', 
                    className: 'text-3xl font-bold text-gray-800 mb-6' 
                }, `Starting Round ${round}`),
                
                React.createElement('h3', { 
                    key: 'subtitle', 
                    className: 'text-xl font-semibold text-gray-700 mb-4' 
                }, 'Current Standings'),
                
                React.createElement('div', { 
                    key: 'players', 
                    className: 'space-y-3 mb-6' 
                }, sortedPlayers.map((player, index) => 
                    React.createElement('div', {
                        key: player.id,
                        className: `p-4 rounded-lg ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-100'}`
                    }, [
                        React.createElement('div', { 
                            key: 'header',
                            className: 'flex items-center justify-between mb-2' 
                        }, [
                            React.createElement('div', { 
                                key: 'name',
                                className: 'flex items-center gap-2' 
                            }, [
                                React.createElement('span', { 
                                    key: 'emoji',
                                    className: 'text-2xl' 
                                }, player.emoji || '🎮'),
                                React.createElement('span', { 
                                    key: 'text',
                                    className: 'font-semibold text-lg' 
                                }, player.name || `Player ${player.id}`),
                                index === 0 && React.createElement('span', { 
                                    key: 'crown',
                                    className: 'text-xl' 
                                }, '👑')
                            ]),
                            React.createElement('div', { 
                                key: 'vp',
                                className: 'text-xl font-bold text-green-600' 
                            }, `${player.victoryPoints} VP`)
                        ]),
                        React.createElement('div', { 
                            key: 'resources',
                            className: 'text-sm text-gray-600' 
                        }, getPlayerResources(player) || 'No resources')
                    ])
                )),
                
                React.createElement('button', {
                    key: 'close',
                    onClick: handleClose,
                    className: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                }, 'Continue to Round ' + round)
            ]);
        }

        // Gem Selection Modal Component
        function GemSelectionModal({ title, maxGems, onSelect, onCancel, availableResources }) {
            const { state, dispatch } = useGame();
            const [selectedGems, setSelectedGems] = React.useState({});
            const [totalSelected, setTotalSelected] = React.useState(0);
            
            // Get active colors from game layers
            const activeColors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
            
            // Initialize selectedGems with active colors
            React.useEffect(() => {
                const initialGems = {};
                activeColors.forEach(color => {
                    initialGems[color] = 0;
                });
                setSelectedGems(initialGems);
            }, []);
            
            const gemColorData = {
                red: { emoji: '🔴', gradient: 'from-red-500 to-red-600' },
                yellow: { emoji: '🟡', gradient: 'from-yellow-400 to-yellow-500' },
                blue: { emoji: '🔵', gradient: 'from-blue-500 to-blue-600' },
                purple: { emoji: '🟣', gradient: 'from-purple-500 to-purple-600' },
                gold: { emoji: '🟨', gradient: 'from-yellow-600 to-yellow-700' },
                white: { emoji: '⚪', gradient: 'from-gray-200 to-gray-300' },
                black: { emoji: '⚫', gradient: 'from-gray-700 to-gray-900' },
                silver: { emoji: '🩶', gradient: 'from-gray-400 to-gray-500' }
            };
            
            const gemColors = activeColors.map(color => ({
                color,
                emoji: gemColorData[color].emoji,
                gradient: gemColorData[color].gradient
            }));
            
            const handleGemClick = (color) => {
                // Check if we have resources available for this color
                const alreadySelected = selectedGems[color] || 0;
                const available = availableResources ? (availableResources[color] || 0) : Infinity;
                
                if (totalSelected < maxGems && alreadySelected < available) {
                    const newSelectedGems = { ...selectedGems, [color]: selectedGems[color] + 1 };
                    const newTotal = totalSelected + 1;
                    setSelectedGems(newSelectedGems);
                    setTotalSelected(newTotal);
                    
                    // Auto-close when limit reached
                    if (newTotal === maxGems) {
                        setTimeout(() => {
                            dispatch({ type: 'HIDE_MODAL' });
                            onSelect(newSelectedGems);
                        }, 300);
                    }
                }
            };
            
            const handleRemoveGem = (color) => {
                if (selectedGems[color] > 0) {
                    setSelectedGems({ ...selectedGems, [color]: selectedGems[color] - 1 });
                    setTotalSelected(totalSelected - 1);
                }
            };
            
            const handleConfirm = () => {
                dispatch({ type: 'HIDE_MODAL' });
                onSelect(selectedGems);
            };
            
            const handleCancel = () => {
                dispatch({ type: 'HIDE_MODAL' });
                if (onCancel) onCancel();
            };
            
            return React.createElement('div', { className: 'text-center' }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-xl font-bold text-gray-800 mb-2' 
                }, title),
                React.createElement('p', { 
                    key: 'progress', 
                    className: 'text-gray-600 mb-4'
                }, `Selected: ${totalSelected}/${maxGems}`),
                
                // Gem selection grid
                React.createElement('div', {
                    key: 'gem-grid',
                    className: 'grid grid-cols-4 gap-4 mb-4'
                }, gemColors.map(({ color, emoji, gradient }) => {
                    const alreadySelected = selectedGems[color] || 0;
                    const available = availableResources ? (availableResources[color] || 0) : Infinity;
                    const canSelect = totalSelected < maxGems && alreadySelected < available;
                    
                    return React.createElement('div', {
                        key: color,
                        className: 'text-center'
                    }, [
                        React.createElement('button', {
                            key: `${color}-button`,
                            onClick: () => handleGemClick(color),
                            disabled: !canSelect,
                            className: `w-16 h-16 rounded-lg bg-gradient-to-r ${gradient} ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} transition-all duration-200 flex items-center justify-center text-2xl shadow-lg relative`
                        }, [
                            React.createElement('span', { key: 'emoji' }, emoji),
                            availableResources && available > 0 && React.createElement('span', {
                                key: 'count',
                                className: 'absolute -bottom-2 right-0 bg-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md'
                            }, available - alreadySelected)
                        ]),
                        React.createElement('div', {
                            key: `${color}-count`,
                            className: 'mt-2 font-semibold text-gray-700'
                        }, selectedGems[color] > 0 ? `×${selectedGems[color]}` : '')
                    ])
                })),
                
                // Selected gems display
                totalSelected > 0 && React.createElement('div', {
                    key: 'selected-display',
                    className: 'mb-4 p-3 bg-gray-100 rounded-lg'
                }, [
                    React.createElement('p', {
                        key: 'selected-label',
                        className: 'text-sm text-gray-600 mb-2'
                    }, 'Selected gems:'),
                    React.createElement('div', {
                        key: 'selected-gems',
                        className: 'flex justify-center gap-2 flex-wrap'
                    }, Object.entries(selectedGems).flatMap(([color, count]) => 
                        Array(count).fill(null).map((_, i) => {
                            const gemInfo = gemColors.find(g => g.color === color);
                            return React.createElement('button', {
                                key: `${color}-${i}`,
                                onClick: () => handleRemoveGem(color),
                                className: 'text-xl hover:scale-125 transition-transform cursor-pointer',
                                title: 'Click to remove'
                            }, gemInfo.emoji);
                        })
                    ))
                ]),
                
                // Buttons
                React.createElement('div', { 
                    key: 'buttons', 
                    className: 'flex gap-3' 
                }, [
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        className: 'flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Cancel'),
                    React.createElement('button', {
                        key: 'confirm',
                        onClick: handleConfirm,
                        disabled: totalSelected === 0,
                        className: `flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${totalSelected === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
                    }, 'Confirm')
                ])
            ]);
        }

        // Steal Gems Modal Component
        function StealGemsModal({ title, targetPlayer, maxGems, onSelect, onCancel }) {
            const { state, dispatch } = useGame();
            const [selectedGems, setSelectedGems] = React.useState({});
            const [totalSelected, setTotalSelected] = React.useState(0);
            
            // Get active colors from game layers
            const activeColors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
            
            // Initialize selectedGems with active colors
            React.useEffect(() => {
                const initialGems = {};
                activeColors.forEach(color => {
                    initialGems[color] = 0;
                });
                setSelectedGems(initialGems);
            }, []);
            
            const gemColorData = {
                red: { emoji: '🔴', gradient: 'from-red-500 to-red-600' },
                yellow: { emoji: '🟡', gradient: 'from-yellow-400 to-yellow-500' },
                blue: { emoji: '🔵', gradient: 'from-blue-500 to-blue-600' },
                purple: { emoji: '🟣', gradient: 'from-purple-500 to-purple-600' },
                gold: { emoji: '🟨', gradient: 'from-yellow-600 to-yellow-700' },
                white: { emoji: '⚪', gradient: 'from-gray-200 to-gray-300' },
                black: { emoji: '⚫', gradient: 'from-gray-700 to-gray-900' },
                silver: { emoji: '🩶', gradient: 'from-gray-400 to-gray-500' }
            };
            
            const gemColors = activeColors.map(color => ({
                color,
                emoji: gemColorData[color].emoji,
                gradient: gemColorData[color].gradient
            }));
            
            const handleGemClick = (color) => {
                const availableCount = targetPlayer.resources[color] || 0;
                const alreadySelected = selectedGems[color];
                
                if (totalSelected < maxGems && alreadySelected < availableCount) {
                    const newSelectedGems = { ...selectedGems, [color]: selectedGems[color] + 1 };
                    const newTotal = totalSelected + 1;
                    setSelectedGems(newSelectedGems);
                    setTotalSelected(newTotal);
                    
                    // Auto-close when limit reached
                    if (newTotal === maxGems) {
                        setTimeout(() => {
                            dispatch({ type: 'HIDE_MODAL' });
                            onSelect(newSelectedGems);
                        }, 300);
                    }
                }
            };
            
            const handleRemoveGem = (color) => {
                if (selectedGems[color] > 0) {
                    setSelectedGems({ ...selectedGems, [color]: selectedGems[color] - 1 });
                    setTotalSelected(totalSelected - 1);
                }
            };
            
            const handleConfirm = () => {
                dispatch({ type: 'HIDE_MODAL' });
                onSelect(selectedGems);
            };
            
            const handleCancel = () => {
                dispatch({ type: 'HIDE_MODAL' });
                if (onCancel) onCancel();
            };
            
            return React.createElement('div', { className: 'text-center' }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-xl font-bold text-gray-800 mb-2' 
                }, title),
                React.createElement('p', { 
                    key: 'target', 
                    className: 'text-gray-600 mb-2'
                }, `Stealing from Player ${targetPlayer.id}`),
                React.createElement('p', { 
                    key: 'progress', 
                    className: 'text-gray-600 mb-4'
                }, `Selected: ${totalSelected}/${maxGems}`),
                
                // Target player's available gems
                React.createElement('div', {
                    key: 'available-label',
                    className: 'text-sm text-gray-600 mb-2'
                }, 'Available gems:'),
                
                // Gem selection grid
                React.createElement('div', {
                    key: 'gem-grid',
                    className: 'grid grid-cols-4 gap-4 mb-4'
                }, gemColors.map(({ color, emoji, gradient }) => {
                    const available = targetPlayer.resources[color] || 0;
                    const selected = selectedGems[color];
                    const remaining = available - selected;
                    const canSelect = totalSelected < maxGems && remaining > 0;
                    
                    return React.createElement('div', {
                        key: color,
                        className: 'text-center'
                    }, [
                        React.createElement('button', {
                            key: `${color}-button`,
                            onClick: () => handleGemClick(color),
                            disabled: !canSelect,
                            className: `w-16 h-16 rounded-lg bg-gradient-to-r ${gradient} ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} transition-all duration-200 flex items-center justify-center text-2xl shadow-lg relative`
                        }, [
                            React.createElement('span', { key: 'emoji' }, emoji),
                            available > 0 && React.createElement('span', {
                                key: 'count',
                                className: 'absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md'
                            }, available)
                        ]),
                        React.createElement('div', {
                            key: `${color}-info`,
                            className: 'mt-2 text-sm text-gray-700'
                        }, selected > 0 ? `Taking ${selected}` : remaining > 0 ? `${remaining} left` : 'None')
                    ]);
                })),
                
                // Selected gems display
                totalSelected > 0 && React.createElement('div', {
                    key: 'selected-display',
                    className: 'mb-4 p-3 bg-gray-100 rounded-lg'
                }, [
                    React.createElement('p', {
                        key: 'selected-label',
                        className: 'text-sm text-gray-600 mb-2'
                    }, 'Gems to steal:'),
                    React.createElement('div', {
                        key: 'selected-gems',
                        className: 'flex justify-center gap-2 flex-wrap'
                    }, Object.entries(selectedGems).flatMap(([color, count]) => 
                        Array(count).fill(null).map((_, i) => {
                            const gemInfo = gemColors.find(g => g.color === color);
                            return React.createElement('button', {
                                key: `${color}-${i}`,
                                onClick: () => handleRemoveGem(color),
                                className: 'text-xl hover:scale-125 transition-transform cursor-pointer',
                                title: 'Click to remove'
                            }, gemInfo.emoji);
                        })
                    ))
                ]),
                
                // Buttons
                React.createElement('div', { 
                    key: 'buttons', 
                    className: 'flex gap-3' 
                }, [
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        className: 'flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200'
                    }, 'Cancel'),
                    React.createElement('button', {
                        key: 'confirm',
                        onClick: handleConfirm,
                        disabled: totalSelected === 0,
                        className: `flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${totalSelected === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
                    }, 'Confirm')
                ])
            ]);
        }

        // Helper functions for custom prompts
        function showChoice(dispatch, title, options, columnMode = false, workerInfo = null, targetPlayerId = null) {
            return new Promise((resolve) => {
                dispatch({
                    type: 'SHOW_MODAL',
                    modal: {
                        type: 'choice',
                        title,
                        options,
                        columnMode,
                        targetPlayerId, // Who should see this modal (null = current player)
                        onSelect: resolve,
                        onCancel: () => {
                            // If this modal was triggered by placing a worker, undo the placement
                            if (workerInfo) {
                                dispatch({ type: 'UNDO_LAST_WORKER', ...workerInfo });
                            }
                            resolve(null);
                        }
                    }
                });
            });
        }

        function showConfirm(dispatch, title, message, workerInfo = null) {
            return new Promise((resolve) => {
                dispatch({
                    type: 'SHOW_MODAL',
                    modal: {
                        type: 'confirm',
                        title,
                        message,
                        onConfirm: () => resolve(true),
                        onCancel: () => {
                            // If this modal was triggered by placing a worker, undo the placement
                            if (workerInfo) {
                                dispatch({ type: 'UNDO_LAST_WORKER', ...workerInfo });
                            }
                            resolve(false);
                        }
                    }
                });
            });
        }

        function showGemSelection(dispatch, title, maxGems, availableResources, workerInfo = null, targetPlayerId = null) {
            return new Promise((resolve) => {
                dispatch({
                    type: 'SHOW_MODAL',
                    modal: {
                        type: 'gemSelection',
                        title,
                        maxGems,
                        availableResources,
                        targetPlayerId, // Who should see this modal
                        onSelect: resolve,
                        onCancel: () => {
                            // If this modal was triggered by placing a worker, undo the placement
                            if (workerInfo) {
                                dispatch({ type: 'UNDO_LAST_WORKER', ...workerInfo });
                            }
                            resolve(null);
                        }
                    }
                });
            });
        }

        function showStealGems(dispatch, title, targetPlayer, maxGems, workerInfo = null, targetPlayerId = null) {
            return new Promise((resolve) => {
                dispatch({
                    type: 'SHOW_MODAL',
                    modal: {
                        type: 'stealGems',
                        title,
                        targetPlayer,
                        maxGems,
                        targetPlayerId, // Who should see this modal
                        onSelect: resolve,
                        onCancel: () => {
                            // If this modal was triggered by placing a worker, undo the placement
                            if (workerInfo) {
                                dispatch({ type: 'UNDO_LAST_WORKER', ...workerInfo });
                            }
                            resolve(null);
                        }
                    }
                });
            });
        }

        // Helper function to select target player (replaces undefined showPlayerSelection)
        async function selectTargetPlayer(dispatch, title, players, currentPlayerId, workerInfo = null) {
            const otherPlayers = players.filter(p => p.id !== currentPlayerId);
            
            if (otherPlayers.length === 0) {
                return null;
            }
            
            const playerOptions = otherPlayers.map(p => {
                // Format player info with resources
                const resourceInfo = Object.entries(p.resources)
                    .filter(([, amount]) => amount > 0)
                    .map(([color, amount]) => `${amount} ${color}`)
                    .join(', ') || 'no resources';
                
                return {
                    label: `${p.name || `Player ${p.id}`} ${p.emoji || ''} (${resourceInfo}, ${p.victoryPoints || 0} VP)`,
                    value: p.id
                };
            });
            
            const targetId = await showChoice(dispatch, title, playerOptions, false, workerInfo);
            return targetId ? players.find(p => p.id === targetId) : null;
        }

        // End Turn Button Component
        function EndTurnButton({ onEndTurn }) {
            const { state, dispatch } = useGame();
            const currentPlayer = state.players.find(p => p.id === state.currentPlayer);

            // Phase should automatically change to shop2 when all workers for turn are placed
            // This button is a fallback in case something goes wrong

            const getButtonText = () => {
                // Check if in shopping phase (workers done, shop not used)
                const inShoppingPhase = state.workersToPlace === 0 && !state.shopUsedAfterWorkers;

                if (inShoppingPhase) {
                    return '✓ Skip Shopping & End Turn';
                }
                return 'End Turn';
            };

            // Button should be disabled if no worker placed (unless special conditions)
            const canEndWithoutWorker = currentPlayer && currentPlayer.workersLeft === 0;
            const isButtonDisabled = !state.workerPlacedThisTurn && !canEndWithoutWorker;

            // Check if player is in "turn complete" phase (all workers placed, haven't ended turn)
            const isTurnComplete = state.workersToPlace === 0 && state.workerPlacedThisTurn;

            return React.createElement('button', {
                onClick: onEndTurn,
                disabled: isButtonDisabled,
                className: `font-bold py-1.5 px-3 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap text-sm ${
                    isButtonDisabled
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : isTurnComplete
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl'
                }`
            }, getButtonText());
        }

        // Execute repeat action from red shop
        async function executeRepeatAction(player, dispatch, state, gameLayers, recursionDepth = 0) {
            // Find all occupied spaces that belong to the current player
            // Exclude: repeat actions and swap actions to prevent confusing chains
            const excludedActions = [
                // Red actions that could cause infinite loops
                'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                // Blue actions that could cause recursion through shops
                'blueAnyShopBenefit', 'blueR1ShopBenefit',
                // Victory shops - already purchased, can't repeat
                'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
            ];
            
            const playerSpaces = Object.entries(state.occupiedSpaces)
                .filter(([spaceId, pid]) => 
                    pid === player.id && !excludedActions.includes(spaceId)
                )
                .map(([spaceId]) => spaceId);
            
            if (playerSpaces.length === 0) {
                const message = `Player ${player.id}: Red shop → No valid workers to repeat (swap/repeat actions excluded)`;
                dispatch({ type: 'ADD_LOG', message });
                return false; // Return false to indicate failure
            }
            
            // Always show choice UI, even if only one option
            if (playerSpaces.length >= 1) {
                // Multiple options, let player choose
                const repeatOptions = playerSpaces.map(spaceId => {
                    let actionTitle = spaceId;
                    for (const layerData of Object.values(gameLayers)) {
                        const action = layerData.actions.find(a => a.id === spaceId);
                        if (action) {
                            actionTitle = action.title;
                            break;
                        }
                    }
                    return {
                        label: `Repeat: ${actionTitle}`,
                        value: spaceId
                    };
                });
                
                const choice = await showChoice(dispatch, 
                    'Choose an action to repeat', 
                    repeatOptions
                );
                
                if (choice) {
                    // Find the action title for the log message
                    let actionTitle = choice;
                    for (const layerData of Object.values(gameLayers)) {
                        const action = layerData.actions.find(a => a.id === choice);
                        if (action) {
                            actionTitle = action.title;
                            break;
                        }
                    }
                    
                    const message = `Player ${player.id}: Red shop → Repeating ${actionTitle}`;
                    dispatch({ type: 'ADD_LOG', message });
                    
                    // RED AUTOMATIC VP for using red shop
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: player.id,
                        vp: 1,
                        source: 'redAutomatic'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action` });
                    
                    // Create an updated state with the current player state
                    const currentPlayerState = state.players.find(p => p.id === player.id);
                    const updatedState = {
                        ...state,
                        players: state.players.map(p => p.id === player.id ? currentPlayerState : p)
                    };
                    await executeAction(choice, currentPlayerState, dispatch, updatedState, gameLayers, recursionDepth + 1);
                    return true; // Return true to indicate success
                }
            }
            return false; // Return false if no choice made
        }

        // Execute yellow 3 shop effect
        async function executeYellow3Shop(player, dispatch, state) {
            console.log('executeYellow3Shop - Starting for player', player.id);
            
            // Gain 7 resources ⭐ colors - using GemSelectionModal
            const selectedGems = await showGemSelection(
                dispatch,
                'Choose 7 gems of any color',
                7
            );
            
            if (!selectedGems) {
                const message = `Player ${player.id}: Yellow R3 shop → Cancelled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            console.log('executeYellow3Shop - Player', player.id, 'selected gems:', selectedGems);
            
            // Check for doubling effect
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let finalGems = { ...selectedGems };
            
            if (hasDoubleEffect) {
                // Double all gems
                Object.keys(finalGems).forEach(color => {
                    finalGems[color] *= 2;
                });
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: finalGems
            });
            
            const totalGems = Object.values(finalGems).reduce((sum, amount) => sum + amount, 0);
            const message = `Player ${player.id}: Yellow R3 shop → Gained ${totalGems} gems${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute yellow 2 shop effect
        async function executeYellow2Shop(player, dispatch, state) {
            console.log('executeYellow2Shop - Starting for player', player.id);
            
            // Gain 5 resources ⭐ colors - using GemSelectionModal
            const selectedGems = await showGemSelection(
                dispatch,
                'Choose 5 gems of any color',
                5
            );
            
            if (!selectedGems) {
                const message = `Player ${player.id}: Yellow R2 shop → Cancelled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            console.log('executeYellow2Shop - Player', player.id, 'selected gems:', selectedGems);
            
            // Check for doubling effect
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let finalGems = { ...selectedGems };
            
            if (hasDoubleEffect) {
                // Double all gems
                Object.keys(finalGems).forEach(color => {
                    finalGems[color] *= 2;
                });
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: finalGems
            });
            
            const totalGems = Object.values(finalGems).reduce((sum, amount) => sum + amount, 0);
            const message = `Player ${player.id}: Yellow R2 shop → Gained ${totalGems} gems${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute blue 1 shop effect - Toggle any shop (open/closed)
        async function executeBlue1Shop(player, dispatch, state) {
            // List all shops from active game layers only
            const shopOptions = [];
            const colors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
            
            const shopData = {
                red: {
                    1: 'Repeat a worker\'s action',
                    2: 'Place the next player\'s worker',
                    3: 'Repeat all actions taken this round'
                },
                yellow: {
                    1: 'Double your next gain action',
                    2: 'Gain 5⭐',
                    3: 'Gain 7⭐'
                },
                blue: {
                    1: 'Toggle any shop (open/closed)',
                    2: 'Toggle all shop statuses',
                    3: 'Gain any shop benefit'
                },
                purple: {
                    1: 'Take an extra turn',
                    2: 'Play 2 more workers this turn',
                    3: 'Play all remaining workers'
                },
                gold: {
                    1: '1 Gold + 1 Any = 2 Gold',
                    2: '2 Gold + 2 Any = 4 Gold',
                    3: '3 Gold + 3 Any = Double Your Gold'
                },
                white: {
                    1: 'Lose 1 VP, Gain 1 ⭐',
                    2: 'Lose 3 VP, Skip next player\'s turn',
                    3: 'Lose 5 VP, Move worker to action'
                },
                black: {
                    1: 'Steal 1 VP from another player',
                    2: 'Steal 3 VP from another player',
                    3: 'Steal 5 VP from another player'
                },
                silver: {
                    1: 'Gain 2 VP',
                    2: 'Gain 4 VP, Pick Another Player to Gain 4 VP',
                    3: 'Gain 7 Silver, Each Other Player Gains 2 Silver'
                }
            };
            
            const shopCosts = {
                red: { 1: '1🔴+2⭐', 2: '2🔴+2⭐', 3: '4🔴+4⭐' },
                yellow: { 1: '1🟡+1⭐', 2: '2🟡+2⭐', 3: '3🟡+3⭐' },
                blue: { 1: '1🔵+1⭐', 2: '2🔵+2⭐', 3: '3🔵+3⭐' },
                purple: { 1: '1🟣+2⭐', 2: '2🟣+2⭐', 3: '3🟣+3⭐' },
                gold: { 1: '1🟨+1⭐', 2: '2🟨+2⭐', 3: '3🟨+3⭐' },
                white: { 1: '1VP', 2: '2VP', 3: '3VP' },
                black: { 1: '1⚫+1⭐', 2: '2⚫+2⭐', 3: '3⚫+3⭐' },
                silver: { 1: '1🩶+1⭐', 2: '2🩶+2⭐', 3: '3🩶+3⭐' }
            };
            
            const colorEmojis = {
                red: '🔴', yellow: '🟡', blue: '🔵', purple: '🟣',
                gold: '🟨', white: '⚪', black: '⚫', silver: '🩶'
            };
            
            // Map of quad display names
            const quadNames = {
                'red': 'Red Quad',
                'yellow': 'Yellow Quad',
                'blue': 'Blue Quad',
                'purple': 'Purple Quad',
                'gold': 'Gold Quad',
                'white': 'White Quad',
                'black': 'Black Quad',
                'silver': 'Silver Quad'
            };
            
            // Organize shops by individual quad (color)
            colors.forEach(color => {
                const quadName = quadNames[color] || color;
                
                // R1 shops
                const isClosedR1 = state.closedShops[`${color}1`];
                const availableR1 = state.round >= 1;
                shopOptions.push({
                    label: `${colorEmojis[color]} R1 ${isClosedR1 ? '(Closed)' : '(Open)'}: ${shopData[color][1]} - Cost: ${shopCosts[color][1]}`,
                    shortLabel: `${isClosedR1 ? '🚫' : '✅'} R1: ${shopCosts[color][1]}`,
                    value: `${color}1`,
                    group: quadName
                });
                
                // R2 shops - show all but indicate if not available
                const isClosedR2 = state.closedShops[`${color}2`];
                const availableR2 = state.round >= 2;
                shopOptions.push({
                    label: `${colorEmojis[color]} R2 ${isClosedR2 ? '(Closed)' : '(Open)'}: ${shopData[color][2]} - Cost: ${shopCosts[color][2]}${!availableR2 ? ' (Available Round 2)' : ''}`,
                    shortLabel: `${isClosedR2 ? '🚫' : '✅'} R2: ${shopCosts[color][2]}`,
                    value: `${color}2`,
                    group: quadName
                });
                
                // R3 shops - show all but indicate if not available
                const isClosedR3 = state.closedShops[`${color}3`];
                const availableR3 = state.round >= 3;
                shopOptions.push({
                    label: `${colorEmojis[color]} R3 ${isClosedR3 ? '(Closed)' : '(Open)'}: ${shopData[color][3]} - Cost: ${shopCosts[color][3]}${!availableR3 ? ' (Available Round 3)' : ''}`,
                    shortLabel: `${isClosedR3 ? '🚫' : '✅'} R3: ${shopCosts[color][3]}`,
                    value: `${color}3`,
                    group: quadName
                });
                
                // Victory shops (always available)
                const isClosedVP = state.closedShops[`${color}vp`];
                const vpCost = color === 'purple' ? '4🟣' : (color === 'yellow' ? '4⭐' : `4${color === 'red' ? '🔴' : '🔵'}`);
                const vpPoints = color === 'yellow' ? '3' : '5';
                shopOptions.push({
                    label: `${isClosedVP ? 'Closed' : 'Open'} ${vpCost} - ${vpPoints} Victory Points`,
                    shortLabel: `${isClosedVP ? '🚫' : '✅'} VP: ${vpCost}`,
                    value: `${color}vp`,
                    group: quadName
                });
            });
            
            const choice = await showChoice(dispatch, 'Choose a shop to toggle (Closed/Open)', shopOptions, true);
            
            if (choice) {
                const isCurrentlyClosed = state.closedShops[choice];
                if (isCurrentlyClosed) {
                    // Open the shop
                    dispatch({
                        type: 'OPEN_SHOP',
                        shopId: choice
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Opened ${choice} shop` });
                } else {
                    // Close the shop
                    dispatch({
                        type: 'CLOSE_SHOP',
                        shopId: choice
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Closed ${choice} shop` });
                }
            }
        }
        
        // Execute blue 3 shop effect - Gain any shop benefit (even if closed)
        async function executeBlue3Shop(player, dispatch, state, recursionDepth = 0) {
            // This is the same as blueAnyShopBenefit action
            await executeAction('blueAnyShopBenefit', player, dispatch, state, state.gameLayers, recursionDepth);
        }
        
        // Execute gold 1 shop effect - 1 Gold + 1 ⭐ = 2 Gold (gain 2 gold)
        async function executeGold1Shop(player, dispatch, state) {
            const goldAmount = player.resources.gold || 0;
            const totalGems = Object.values(player.resources).reduce((sum, amt) => sum + amt, 0);
            
            if (goldAmount < 1 || totalGems < 2) {
                const message = `Player ${player.id}: Gold R1 shop → Need 1 gold + 1 ⭐ resource`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // If player only has gold, auto-pay with gold
            const nonGoldResources = Object.entries(player.resources)
                .filter(([color, amount]) => color !== 'gold' && amount > 0)
                .reduce((sum, [, amount]) => sum + amount, 0);
            
            let selectedGems;
            if (nonGoldResources === 0 && goldAmount >= 2) {
                // Only has gold, auto-select gold for the any cost
                selectedGems = { gold: 1 };
            } else {
                // Choose 1 gem to pay (can be any color including gold)
                selectedGems = await showGemSelection(dispatch, 'Choose 1 ⭐ resource to pay', 1, player);
                
                if (!selectedGems) {
                    const message = `Player ${player.id}: Gold R1 shop → Cancelled`;
                    dispatch({ type: 'ADD_LOG', message });
                    return;
                }
            }
            
            // Pay the cost first
            const costResources = { gold: -1 };
            Object.entries(selectedGems).forEach(([color, amount]) => {
                costResources[color] = costResources[color] ? costResources[color] - amount : -amount;
            });
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: costResources
            });
            
            // Then apply the gain with doubling check
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let goldGain = 2;
            
            if (hasDoubleEffect) {
                goldGain *= 2;
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: { gold: goldGain }
            });
            
            const message = `Player ${player.id}: Gold R1 shop → Paid 1 gold + 1 resource, gained ${goldGain} gold${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute gold 2 shop effect - 2 Gold + 2 ⭐ = 4 Gold (gain 4 gold)
        async function executeGold2Shop(player, dispatch, state) {
            const goldAmount = player.resources.gold || 0;
            const totalGems = Object.values(player.resources).reduce((sum, amt) => sum + amt, 0);
            
            if (goldAmount < 2 || totalGems < 4) {
                const message = `Player ${player.id}: Gold R2 shop → Need 2 gold + 2 ⭐ resources`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Choose 2 gems to pay (can be any color including gold)
            const selectedGems = await showGemSelection(dispatch, 'Choose 2 ⭐ resources to pay', 2, player);
            
            if (!selectedGems) {
                const message = `Player ${player.id}: Gold R2 shop → Cancelled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Pay the cost first
            const costResources = { gold: -2 };
            Object.entries(selectedGems).forEach(([color, amount]) => {
                costResources[color] = costResources[color] ? costResources[color] - amount : -amount;
            });
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: costResources
            });
            
            // Then apply the gain with doubling check
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let goldGain = 4;
            
            if (hasDoubleEffect) {
                goldGain *= 2;
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: { gold: goldGain }
            });
            
            const message = `Player ${player.id}: Gold R2 shop → Paid 2 gold + 2 resources, gained ${goldGain} gold${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute gold 3 shop effect - 3 Gold + 3 ⭐ = Double Your Gold (multiply current gold by 2)
        async function executeGold3Shop(player, dispatch, state) {
            const goldAmount = player.resources.gold || 0;
            const totalGems = Object.values(player.resources).reduce((sum, amt) => sum + amt, 0);
            
            if (goldAmount < 3 || totalGems < 6) {
                const message = `Player ${player.id}: Gold R3 shop → Need 3 gold + 3 ⭐ resources`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Choose 3 gems to pay (can be any color including gold)
            const selectedGems = await showGemSelection(dispatch, 'Choose 3 ⭐ resources to pay', 3, player);
            
            if (!selectedGems) {
                const message = `Player ${player.id}: Gold R3 shop → Cancelled`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Pay the cost first
            const costResources = { gold: -3 };
            Object.entries(selectedGems).forEach(([color, amount]) => {
                costResources[color] = costResources[color] ? costResources[color] - amount : -amount;
            });
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: costResources
            });
            
            // Calculate the gain (double the original gold amount)
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let goldGain = goldAmount * 2; // This doubles the original amount
            
            if (hasDoubleEffect) {
                // If doubling effect is active, the gain is quadrupled (2x from shop, 2x from effect)
                goldGain *= 2;
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: { gold: goldGain }
            });
            
            const finalGold = goldAmount - 3 + goldGain;
            const message = `Player ${player.id}: Gold R3 shop → Paid 3 gold + 3 resources, gold went from ${goldAmount} to ${finalGold}${hasDoubleEffect ? ' (DOUBLE DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute white 1 shop effect - Lose 1 VP, Gain 1 ⭐
        async function executeWhite1Shop(player, dispatch, state) {
            if (player.victoryPoints < 1) {
                const message = `Player ${player.id}: White R1 shop → Need at least 1 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Lose 1 VP
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: -1,
                source: 'whiteShop'
            });
            
            // Choose 1 gem to gain
            let gemsToGain = 1;
            
            // Check for doubling effect
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            if (hasDoubleEffect) {
                gemsToGain *= 2;
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            const selectedGems = await showGemSelection(dispatch, `Choose ${gemsToGain} gem${gemsToGain > 1 ? 's' : ''} to gain`, gemsToGain);
            
            if (!selectedGems) {
                // If cancelled, give default gems
                const resources = { red: gemsToGain };
                dispatch({ type: 'UPDATE_RESOURCES', playerId: player.id, resources });
                const message = `Player ${player.id}: White R1 shop → -1 VP, +${gemsToGain} red (default)${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: selectedGems
            });
            
            const message = `Player ${player.id}: White R1 shop → -1 VP, gained ${gemsToGain} gem${gemsToGain > 1 ? 's' : ''}${hasDoubleEffect ? ' (DOUBLED!)' : ''}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute white 2 shop effect - Lose 3 VP, Skip next player's turn
        async function executeWhite2Shop(player, dispatch, state) {
            if (player.victoryPoints < 3) {
                const message = `Player ${player.id}: White R2 shop → Need at least 3 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Lose 3 VP
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: -3,
                source: 'whiteShop'
            });
            
            // Determine next player
            const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
            const nextIndex = (currentIndex + state.turnDirection + state.turnOrder.length) % state.turnOrder.length;
            const nextPlayerId = state.turnOrder[nextIndex];
            
            // Set skip for next player
            const newSkippedTurns = { ...state.skippedTurns };
            newSkippedTurns[nextPlayerId] = (newSkippedTurns[nextPlayerId] || 0) + 1;
            dispatch({
                type: 'SET_SKIPPED_TURNS',
                skippedTurns: newSkippedTurns
            });
            
            const message = `Player ${player.id}: White R2 shop → -2 VP, Player ${nextPlayerId} will skip next turn`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute white 3 shop effect - Lose 3 VP, Move worker to unclaimed action
        async function executeWhite3Shop(player, dispatch, state) {
            if (player.victoryPoints < 3) {
                const message = `Player ${player.id}: White R3 shop → Need at least 3 VP`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Find player's workers
            const playerWorkers = Object.entries(state.occupiedSpaces)
                .filter(([actionId, playerId]) => playerId === player.id)
                .map(([actionId]) => actionId);
            
            if (playerWorkers.length === 0) {
                const message = `Player ${player.id}: White R3 shop → No workers to move`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            // Choose worker to move
            const workerOptions = playerWorkers.map(actionId => {
                // Find the action details
                let actionTitle = actionId;
                for (const [color, layer] of Object.entries(state.gameLayers || {})) {
                    const action = layer.actions.find(a => a.id === actionId);
                    if (action) {
                        actionTitle = `${color} - ${action.title}`;
                        break;
                    }
                }
                return {
                    label: actionTitle,
                    value: actionId
                };
            });
            
            const workerToMove = await showChoice(dispatch, 'Choose a worker to move', workerOptions);
            if (!workerToMove) return;
            
            // Find all unclaimed actions
            const allActions = [];
            Object.entries(state.gameLayers || {}).forEach(([color, layer]) => {
                layer.actions.forEach(action => {
                    if (action.round <= state.round && !state.occupiedSpaces[action.id]) {
                        allActions.push({
                            label: `${color} - ${action.title}`,
                            value: action.id,
                            color
                        });
                    }
                });
            });
            
            if (allActions.length === 0) {
                const message = `Player ${player.id}: White R3 shop → No unclaimed actions available`;
                dispatch({ type: 'ADD_LOG', message });
                return;
            }
            
            const newAction = await showChoice(dispatch, 'Choose an unclaimed action to move to', allActions);
            if (!newAction) return;
            
            // Lose 3 VP
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: -3,
                source: 'whiteShop'
            });
            
            // Move the worker
            const newOccupiedSpaces = { ...state.occupiedSpaces };
            delete newOccupiedSpaces[workerToMove];
            newOccupiedSpaces[newAction] = player.id;
            
            dispatch({
                type: 'UPDATE_OCCUPIED_SPACES',
                occupiedSpaces: newOccupiedSpaces
            });
            
            // Execute the new action with updated state
            const updatedState = {
                ...state,
                occupiedSpaces: newOccupiedSpaces
            };
            await executeAction(newAction, player, dispatch, updatedState, state.gameLayers, 0);
            
            const message = `Player ${player.id}: White R3 shop → -3 VP, moved worker to ${newAction}`;
            dispatch({ type: 'ADD_LOG', message });
        }
        
        // Execute black 1 shop effect - Steal 1 VP from another player
        async function executeBlack1Shop(player, dispatch, state) {
            const otherPlayers = state.players.filter(p => p.id !== player.id);
            
            if (otherPlayers.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R1 shop → No other players` });
                return;
            }
            
            const targetPlayer = await selectTargetPlayer(
                dispatch,
                'Choose a player to steal 1 VP from',
                state.players,
                player.id
            );
            
            if (!targetPlayer) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R1 shop → Cancelled` });
                return;
            }
            
            // Remove 1 VP from target
            dispatch({
                type: 'UPDATE_VP',
                playerId: targetPlayer.id,
                vp: -1,
                source: 'blackShop'
            });
            
            // Add 1 VP to current player
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: 1,
                source: 'blackShop'
            });
            
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R1 shop → Stole 1 VP from Player ${targetPlayer.id}` });
            
            // BLACK AUTOMATIC VP: Gain 1 VP when stealing
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: 1,
                source: 'blackAutomatic'
            });
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
        }
        
        // Execute black 2 shop effect - Steal 3 VP from another player
        async function executeBlack2Shop(player, dispatch, state) {
            const otherPlayers = state.players.filter(p => p.id !== player.id);
            
            if (otherPlayers.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R2 shop → No other players` });
                return;
            }
            
            const targetPlayer = await selectTargetPlayer(
                dispatch,
                'Choose a player to steal 3 VP from',
                state.players,
                player.id
            );
            
            if (!targetPlayer) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R2 shop → Cancelled` });
                return;
            }
            
            const vpToSteal = Math.min(3, targetPlayer.victoryPoints);
            
            // Remove VP from target
            dispatch({
                type: 'UPDATE_VP',
                playerId: targetPlayer.id,
                vp: -vpToSteal,
                source: 'blackShop'
            });
            
            // Add VP to current player
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: vpToSteal,
                source: 'blackShop'
            });
            
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R2 shop → Stole ${vpToSteal} VP from Player ${targetPlayer.id}` });
            
            // Send notification in multiplayer
            if (state.roomCode) {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    notification: {
                        type: 'steal',
                        icon: '⚫',
                        title: 'VP Stolen!',
                        message: `${player.name || `Player ${player.id}`} stole ${vpToSteal} VP from you`,
                        forPlayer: targetPlayer.id
                    }
                });
            }
            
            // BLACK AUTOMATIC VP: Gain 1 VP when stealing
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: 1,
                source: 'blackAutomatic'
            });
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
        }
        
        // Execute black 3 shop effect - Steal 5 VP from another player
        async function executeBlack3Shop(player, dispatch, state) {
            const otherPlayers = state.players.filter(p => p.id !== player.id);
            
            if (otherPlayers.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R3 shop → No other players` });
                return;
            }
            
            const targetPlayer = await selectTargetPlayer(
                dispatch,
                'Choose a player to steal 5 VP from',
                state.players,
                player.id
            );
            
            if (!targetPlayer) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R3 shop → Cancelled` });
                return;
            }
            
            const vpToSteal = Math.min(5, targetPlayer.victoryPoints);
            
            // Remove VP from target
            dispatch({
                type: 'UPDATE_VP',
                playerId: targetPlayer.id,
                vp: -vpToSteal,
                source: 'blackShop'
            });
            
            // Add VP to current player
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: vpToSteal,
                source: 'blackShop'
            });
            
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Black R3 shop → Stole ${vpToSteal} VP from Player ${targetPlayer.id}` });
            
            // BLACK AUTOMATIC VP: Gain 1 VP when stealing
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: 1,
                source: 'blackAutomatic'
            });
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP (Black automatic: stealing bonus)` });
        }
        
        // Execute silver 2 shop effect - Gain 4 VP, Pick Another Player to Gain 4 VP
        async function executeSilver2Shop(player, dispatch, state) {
            // Give current player 4 VP
            dispatch({
                type: 'UPDATE_VP',
                playerId: player.id,
                vp: 4,
                source: 'silverShop'
            });
            
            const otherPlayers = state.players.filter(p => p.id !== player.id);
            
            if (otherPlayers.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP (no other players)` });
                return;
            }
            
            // If only one other player, they automatically get it
            if (otherPlayers.length === 1) {
                const targetPlayer = otherPlayers[0];
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: targetPlayer.id,
                    vp: 4,
                    source: 'silverShop'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP, Player ${targetPlayer.id} +4 VP` });
                return;
            }
            
            // Choose a player to give 4 VP
            const targetPlayer = await selectTargetPlayer(dispatch, 'Choose a player to give 4 VP', state.players, player.id);
            
            if (!targetPlayer) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP (gift cancelled)` });
                return;
            }
            
            // In multiplayer, let the recipient acknowledge the gift
            if (state.roomCode && targetPlayer.id !== player.id) {
                const giftGiverInfo = `${player.name || `Player ${player.id}`} ${player.emoji || ''}`;
                const accepted = await showChoice(
                    dispatch,
                    `${giftGiverInfo} wants to give you 4 VP! 🎁`,
                    [
                        { label: 'Graciously Accept (+4 VP)', value: true },
                        { label: 'Politely Decline', value: false }
                    ],
                    false,
                    null,
                    targetPlayer.id // Target player sees this
                );
                
                if (accepted) {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: targetPlayer.id,
                        vp: 4,
                        source: 'silverShop'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP, Player ${targetPlayer.id} accepted +4 VP gift! 🎉` });
                } else {
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP, Player ${targetPlayer.id} declined the gift` });
                }
            } else {
                // Single player: auto-accept
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: targetPlayer.id,
                    vp: 4,
                    source: 'silverShop'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R2 shop → +4 VP, gave Player ${targetPlayer.id} +4 VP` });
            }
        }
        
        // Execute silver 3 shop effect - Gain 7 Silver, Each Other Player Gains 2 Silver
        async function executeSilver3Shop(player, dispatch, state) {
            // Check for doubling effect (only for current player)
            const hasDoubleEffect = (player.effects || []).some(effect => effect.includes('Next gain will be doubled'));
            let silverAmount = 7;
            
            if (hasDoubleEffect) {
                silverAmount *= 2;
                
                // Remove the doubling effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: player.id,
                    effects: (player.effects || []).filter(effect => !effect.includes('Next gain will be doubled'))
                });
            }
            
            // Give current player silver
            dispatch({
                type: 'UPDATE_RESOURCES',
                playerId: player.id,
                resources: { silver: silverAmount }
            });
            
            // Give all other players 2 silver (not doubled)
            const otherPlayers = state.players.filter(p => p.id !== player.id);
            otherPlayers.forEach(otherPlayer => {
                dispatch({
                    type: 'UPDATE_RESOURCES',
                    playerId: otherPlayer.id,
                    resources: { silver: 2 }
                });
            });
            
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R3 shop → +${silverAmount} silver${hasDoubleEffect ? ' (DOUBLED!)' : ''}, all other players +2 silver` });
        }
        
        // Execute any shop benefit by shop ID
        async function executeShopBenefit(shopColor, shopRound, player, dispatch, state, recursionDepth = 0) {
            const shopId = `${shopColor}${shopRound}`;
            
            switch(shopId) {
                case 'red1':
                    // Repeat a worker's action
                    const repeatSuccess = await executeRepeatAction(player, dispatch, state, state.gameLayers, recursionDepth);
                    if (!repeatSuccess) {
                        // Action was cancelled or failed
                        return false;
                    }
                    break;
                case 'red2':
                    // Place the next player's worker immediately
                    await executeRed2Shop(player, dispatch, state);
                    break;
                case 'red3':
                    // Repeat all actions taken this round
                    await executeRed3Shop(player, dispatch, state, recursionDepth);
                    break;
                case 'yellow1':
                    dispatch({
                        type: 'ADD_EFFECT',
                        playerId: player.id,
                        effect: 'Next gain will be doubled'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Yellow R1 shop → Next gain will be doubled` });
                    break;
                case 'yellow2':
                    await executeYellow2Shop(player, dispatch, state);
                    break;
                case 'yellow3':
                    await executeYellow3Shop(player, dispatch, state);
                    break;
                case 'blue1':
                    await executeBlue1Shop(player, dispatch, state);
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Blue R1 shop → Toggle any shop (open/closed)` });
                    break;
                case 'blue2':
                    // Toggle all shop statuses (flip open/closed)
                    dispatch({ 
                        type: 'FLIP_ALL_SHOPS',
                        playerId: player.id,
                        playerName: player.name
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Blue R2 shop → All shops toggled!` });
                    break;
                case 'blue3':
                    await executeBlue3Shop(player, dispatch, state);
                    break;
                case 'purple1':
                    dispatch({
                        type: 'ADD_EFFECT',
                        playerId: player.id,
                        effect: 'Will take an extra turn after this one'
                    });
                    // Actually grant the extra turn
                    dispatch({
                        type: 'UPDATE_PLAYER',
                        playerId: player.id,
                        updates: { extraTurns: (player.extraTurns || 0) + 1 }
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Purple R1 shop → Will take an extra turn after this one` });
                    break;
                case 'purple2':
                    // Calculate how many workers we can actually add
                    const workersAvailable = player.workersLeft;
                    const workersToAdd = Math.min(2, workersAvailable);
                    
                    if (workersToAdd === 0) {
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Purple R2 shop → No workers left to place` });
                        break;
                    }
                    
                    dispatch({
                        type: 'ADD_WORKERS_TO_PLACE',
                        count: workersToAdd
                    });
                    dispatch({
                        type: 'ADD_EFFECT',
                        playerId: player.id,
                        effect: `Can place ${workersToAdd} more worker${workersToAdd > 1 ? 's' : ''} this turn`
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Can place ${workersToAdd} more worker${workersToAdd > 1 ? 's' : ''}${workersToAdd < 2 ? ' (limited by available workers)' : ''} this turn!` });
                    break;
                case 'purple3':
                    const workersRemaining = player.workersLeft;
                    if (workersRemaining > 0) {
                        dispatch({
                            type: 'ADD_WORKERS_TO_PLACE',
                            count: workersRemaining
                        });
                        dispatch({
                            type: 'ADD_EFFECT',
                            playerId: player.id,
                            effect: `Can place ${workersRemaining} more workers this turn`
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Can place all ${workersRemaining} remaining workers!` });
                    }
                    break;
                case 'gold1':
                    // 1 Gold + 1 ⭐ = 2 Gold
                    await executeGold1Shop(player, dispatch, state);
                    break;
                case 'gold2':
                    // 2 Gold + 2 ⭐ = 4 Gold
                    await executeGold2Shop(player, dispatch, state);
                    break;
                case 'gold3':
                    // 3 Gold + 3 ⭐ = Double Your Gold
                    await executeGold3Shop(player, dispatch, state);
                    break;
                case 'white1':
                    // Lose 1 VP, Gain 1 ⭐
                    await executeWhite1Shop(player, dispatch, state);
                    break;
                case 'white2':
                    // Lose 3 VP, Skip next player's turn
                    await executeWhite2Shop(player, dispatch, state);
                    break;
                case 'white3':
                    // Lose 5 VP, Move worker to unclaimed action
                    await executeWhite3Shop(player, dispatch, state);
                    break;
                case 'black1':
                    // Steal 1 VP from another player
                    await executeBlack1Shop(player, dispatch, state);
                    break;
                case 'black2':
                    // Steal 3 VP from another player
                    await executeBlack2Shop(player, dispatch, state);
                    break;
                case 'black3':
                    // Steal 5 VP from another player
                    await executeBlack3Shop(player, dispatch, state);
                    break;
                case 'silver1':
                    // Gain 2 VP
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: player.id,
                        vp: 2,
                        source: 'silverShop'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Silver R1 shop benefit → +2 VP` });
                    break;
                case 'silver2':
                    // Gain 4 VP, Pick Another Player to Gain 4 VP
                    await executeSilver2Shop(player, dispatch, state);
                    break;
                case 'silver3':
                    // Gain 7 Silver, Each Other Player Gains 2 Silver
                    await executeSilver3Shop(player, dispatch, state);
                    break;
                default:
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Shop benefit ${shopId} not implemented yet` });
            }
            return true; // Return true by default for successful execution
        }
        
        // Execute red 2 shop effect - Place the next player's worker
        async function executeRed2Shop(player, dispatch, state) {
            // Find the next player in turn order who has workers
            const currentIndex = state.turnOrder.indexOf(player.id);
            let searchIndex = currentIndex;
            let nextPlayer = null;
            let nextPlayerId = null;
            let attemptCount = 0;
            let searchDirection = state.turnDirection;
            
            // Keep searching for a player with workers
            while (!nextPlayer && attemptCount < state.players.length) {
                searchIndex = searchIndex + searchDirection;
                
                // Handle snake draft reversal
                if (searchDirection === 1 && searchIndex >= state.turnOrder.length) {
                    // At the end going forward - reverse direction
                    searchDirection = -1;
                    searchIndex = state.turnOrder.length - 1;
                } else if (searchDirection === -1 && searchIndex < 0) {
                    // At the beginning going backward - reverse direction
                    searchDirection = 1;
                    searchIndex = 0;
                }
                
                nextPlayerId = state.turnOrder[searchIndex];
                const candidatePlayer = state.players.find(p => p.id === nextPlayerId);
                
                // Check if this player can place workers
                if (candidatePlayer && 
                    candidatePlayer.workersLeft > 0 && 
                    (!state.skippedTurns || state.skippedTurns[nextPlayerId] === 0)) {
                    nextPlayer = candidatePlayer;
                    break;
                }
                
                attemptCount++;
            }
            
            if (!nextPlayer) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R2 shop → No players with workers remaining in turn order` });
                return;
            }
            
            // Show available actions for the next player's worker
            const availableActions = [];
            Object.entries(state.gameLayers || {}).forEach(([color, layer]) => {
                layer.actions.forEach(action => {
                    if (action.round <= state.round && !state.occupiedSpaces[action.id]) {
                        availableActions.push({
                            label: `${color} - ${action.title}`,
                            value: action.id,
                            color: color
                        });
                    }
                });
            });
            
            if (availableActions.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R2 shop → No available actions` });
                return;
            }
            
            // Current player chooses where to place opponent's worker
            const choice = await showChoice(
                dispatch, 
                `Choose where to place Player ${nextPlayerId}'s worker (they have ${nextPlayer.workersLeft} workers left)`,
                availableActions
            );
            
            if (choice) {
                // Place the worker
                dispatch({ type: 'PLACE_WORKER', actionId: choice, playerId: nextPlayerId });
                
                // Update next player's workers
                dispatch({
                    type: 'UPDATE_PLAYER',
                    playerId: nextPlayerId,
                    updates: { workersLeft: nextPlayer.workersLeft - 1 }
                });
                
                // Execute the action for the next player, with info about who placed them
                const placementInfo = {
                    actionId: choice,
                    playerId: nextPlayerId,
                    placedBy: player.id
                };
                await executeAction(choice, nextPlayer, dispatch, state, state.gameLayers, 0, placementInfo);
                
                // Find action details for clearer messaging
                let actionDetails = choice;
                for (const [color, layer] of Object.entries(state.gameLayers || {})) {
                    const action = layer.actions.find(a => a.id === choice);
                    if (action) {
                        actionDetails = `${color} - ${action.title}`;
                        break;
                    }
                }
                
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R2 shop → Placed Player ${nextPlayerId}'s worker on ${actionDetails}` });
                
                // Send notification in multiplayer
                if (state.roomCode) {
                    dispatch({
                        type: 'ADD_NOTIFICATION',
                        notification: {
                            type: 'worker_placed',
                            icon: '🔴',
                            title: 'Worker Placed For You!',
                            message: `${player.name || `Player ${player.id}`} placed your worker on ${actionDetails}`,
                            forPlayer: nextPlayerId
                        }
                    });
                }
            }
        }
        
        // Execute red 3 shop effect - Repeat all actions taken this round by any player
        async function executeRed3Shop(player, dispatch, state, recursionDepth = 0) {
            // Get all players who have placed workers this round
            const playersWithWorkers = [];
            const playerWorkerCounts = {};
            
            Object.entries(state.occupiedSpaces).forEach(([actionId, playerId]) => {
                if (!playerWorkerCounts[playerId]) {
                    playerWorkerCounts[playerId] = [];
                    playersWithWorkers.push(playerId);
                }
                playerWorkerCounts[playerId].push(actionId);
            });
            
            // Filter to only other players (not including yourself)
            const otherPlayersWithWorkers = playersWithWorkers.filter(pid => pid !== player.id);
            
            if (otherPlayersWithWorkers.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → No other players have placed workers!` });
                return;
            }
            
            // Let player choose which other player's workers to copy
            const playerOptions = otherPlayersWithWorkers.map(pid => {
                return {
                    label: `Player ${pid} (${playerWorkerCounts[pid].length} worker${playerWorkerCounts[pid].length > 1 ? 's' : ''})`,
                    value: pid
                };
            });
            
            const targetPlayerId = await showChoice(dispatch, 'Choose a player whose worker actions to repeat', playerOptions);
            
            if (!targetPlayerId) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → Cancelled` });
                return;
            }
            
            // Get all actions for the selected player
            const targetActions = playerWorkerCounts[targetPlayerId];
            
            // Build action options with details, excluding problematic actions
            const excludedActions = [
                // Red actions that could cause infinite loops
                'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                // Blue actions that could cause recursion through shops
                'blueAnyShopBenefit', // Blue R3 - could select Red R3 shop
                // Purple actions that manipulate turn order/workers
                'playTwoWorkers', 'playThreeWorkers', 'gain4purpleWaitAll',
                // Note: Skip turn actions CAN be repeated - they just add more skips
                'gain2purpleTakeBack', // Taking back workers is personal
                // Victory shops - these are one-time purchases, not repeatable actions
                'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
            ];
            const actionOptions = targetActions
                .filter(actionId => !excludedActions.includes(actionId))
                .map(actionId => {
                    let actionTitle = actionId;
                    let layerColor = '';
                    
                    Object.entries(state.gameLayers || {}).forEach(([color, layer]) => {
                        const action = layer.actions.find(a => a.id === actionId);
                        if (action) {
                            actionTitle = action.title;
                            layerColor = color;
                        }
                    });
                    
                    return {
                        label: `${layerColor} - ${actionTitle}`,
                        value: actionId
                    };
                });
            
            if (actionOptions.length === 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → No valid actions to repeat (swap/repeat actions excluded)` });
                return;
            }
            
            // Let player choose order of execution
            dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → Will repeat ${actionOptions.length} actions from Player ${targetPlayerId}` });
            
            const remainingActions = [...actionOptions];
            while (remainingActions.length > 0) {
                // Show choice modal for next action
                const choice = await showChoice(
                    dispatch,
                    `Choose next action to repeat from Player ${targetPlayerId} (${remainingActions.length} remaining)`,
                    remainingActions,
                    false
                );
                
                if (!choice) {
                    // Player cancelled - stop repeating
                    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Stopped repeating actions` });
                    break;
                }
                
                // Execute the chosen action
                console.log(`Red R3 shop - Executing action ${choice} for player ${player.id}`);
                await executeAction(choice, player, dispatch, state, state.gameLayers, recursionDepth + 1);
                
                // RED AUTOMATIC VP: Gain 1 VP for red action
                dispatch({
                    type: 'UPDATE_VP',
                    playerId: player.id,
                    vp: 1,
                    source: 'redAutomatic'
                });
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for red action (repeat)` });
                
                // Remove from remaining actions
                const index = remainingActions.findIndex(opt => opt.value === choice);
                if (index > -1) {
                    remainingActions.splice(index, 1);
                }
            }
            
            const repeatedActions = actionOptions;
            
            if (repeatedActions.length > 0) {
                dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → Repeated ${repeatedActions.length} actions from Player ${targetPlayerId}!` });
            }
        }

        // Effect activation function
        async function activateEffect(effect, playerId, effectIndex, dispatch, state) {
            const player = state.players.find(p => p.id === playerId);
            
            if (effect.includes('Can repeat a worker\'s action')) {
                // Find all occupied spaces that belong to the player
                const playerSpaces = Object.entries(state.occupiedSpaces)
                    .filter(([spaceId, pid]) => pid === playerId)
                    .map(([spaceId]) => spaceId);
                
                if (playerSpaces.length === 0) {
                    alert('No workers to repeat!');
                    return;
                }
                
                if (playerSpaces.length === 1) {
                    // Auto-select the only option
                    const spaceId = playerSpaces[0];
                    let actionTitle = spaceId;
                    for (const layerData of Object.values(gameLayers)) {
                        const action = layerData.actions.find(a => a.id === spaceId);
                        if (action) {
                            actionTitle = action.title;
                            break;
                        }
                    }
                    
                    const message = `Player ${playerId}: Used shop effect to repeat ${actionTitle}`;
                    dispatch({ type: 'ADD_LOG', message });
                    
                    // Execute the action again
                    await executeAction(spaceId, player, dispatch, state, gameLayers);
                } else {
                    // Multiple options, let player choose
                    const repeatOptions = playerSpaces.map(spaceId => {
                        let actionTitle = spaceId;
                        for (const layerData of Object.values(gameLayers)) {
                            const action = layerData.actions.find(a => a.id === spaceId);
                            if (action) {
                                actionTitle = action.title;
                                break;
                            }
                        }
                        return {
                            label: `Repeat: ${actionTitle}`,
                            value: spaceId
                        };
                    });
                    
                    const choice = await showChoice(dispatch, 
                        'Choose an action to repeat', 
                        repeatOptions
                    );
                    
                    if (choice) {
                        const message = `Player ${playerId}: Used shop effect to repeat ${choice}`;
                        dispatch({ type: 'ADD_LOG', message });
                        
                        // Execute the chosen action again
                        await executeAction(choice, player, dispatch, state, gameLayers);
                    }
                }
                
                // Remove the effect after use
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: playerId,
                    effects: (player.effects || []).filter((_, i) => i !== effectIndex)
                });
                
            } else if (effect.includes('Can close ⭐ shop this round')) {
                // Choose which shop to close
                const shopOptions = [
                    { label: 'Red Shop', value: 'red' },
                    { label: 'Yellow Shop', value: 'yellow' },
                    { label: 'Blue Shop', value: 'blue' },
                    { label: 'Purple Shop', value: 'purple' }
                ];
                
                const shopToClose = await showChoice(dispatch, 'Choose shop to close this round', shopOptions);
                if (shopToClose) {
                    dispatch({
                        type: 'ADD_EFFECT',
                        playerId: playerId,
                        effect: `${shopToClose.charAt(0).toUpperCase() + shopToClose.slice(1)} shop is closed this round`
                    });
                    
                    dispatch({ type: 'ADD_LOG', message: `Player ${playerId}: Closed ${shopToClose} shop for this round` });
                }
                
                // Remove the activatable effect
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: playerId,
                    effects: (player.effects || []).filter((_, i) => i !== effectIndex)
                });
                
            } else if (effect.includes('Will take an extra turn after this one')) {
                // Check if player is already at the end of snake (would get 2 turns naturally)
                const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
                const isAtSnakeEnd = (state.turnDirection === 1 && currentIndex === state.turnOrder.length - 1) ||
                                   (state.turnDirection === -1 && currentIndex === 0);
                
                if (isAtSnakeEnd) {
                    alert('You are already at the end of the turn snake and will get another turn naturally. Extra turn effect not needed.');
                } else {
                    // Apply extra turn effect
                    dispatch({
                        type: 'ADD_EFFECT',
                        playerId: state.currentPlayer,
                        effect: 'Will take an extra turn after this one'
                    });
                    
                    dispatch({ type: 'ADD_LOG', message: `Player ${state.currentPlayer}: Will take an extra turn after this one` });
                }
                
                // Remove the activatable effect regardless
                dispatch({
                    type: 'UPDATE_PLAYER_EFFECTS',
                    playerId: playerId,
                    effects: (player.effects || []).filter((_, i) => i !== effectIndex)
                });
                
            } else if (effect.includes('Can undo the last player\'s turn')) {
                alert('Undo turn effect not implemented yet');
            }
        }

        // Get effect button for activatable effects
        function getEffectButton(effect, playerId, effectIndex, state, dispatch) {
            
            const activatableEffects = [
                'Can repeat a worker\'s action',
                'Can close ⭐ shop this round',
                'Will take an extra turn after this one',
                'Can undo the last player\'s turn'
            ];
            
            const isActivatable = activatableEffects.some(ae => effect.includes(ae));
            const isCurrentPlayer = state.currentPlayer === playerId;
            
            if (isActivatable && isCurrentPlayer) {
                return React.createElement('button', {
                    key: 'activate',
                    onClick: () => activateEffect(effect, playerId, effectIndex, dispatch, state),
                    className: 'bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded ml-2'
                }, 'Use');
            }
            
            return null;
        }

        // Parse player effects into display format
        function parseEffects(effects = []) {
            return effects.map(effect => {
                if (effect.includes('Next gain will be doubled')) {
                    return {
                        type: 'double_gain',
                        label: '2× Next Gain',
                        trigger: 'Next Turn',
                        icon: '⚡',
                        color: 'bg-yellow-100 text-yellow-800'
                    };
                }
                if (effect.includes('Skip next turn') || effect.includes('skip turn')) {
                    return {
                        type: 'skip_turn',
                        label: 'Skip Next Turn',
                        trigger: 'Next Turn',
                        icon: '⏭️',
                        color: 'bg-purple-100 text-purple-800'
                    };
                }
                if (effect.includes('extra turn') || effect.includes('Take another turn')) {
                    return {
                        type: 'extra_turn',
                        label: 'Extra Turn',
                        trigger: 'After This Turn',
                        icon: '🔄',
                        color: 'bg-green-100 text-green-800'
                    };
                }
                if (effect.includes('play') && effect.includes('more workers')) {
                    return {
                        type: 'extra_workers',
                        label: 'Extra Workers',
                        trigger: 'This Turn',
                        icon: '👥',
                        color: 'bg-blue-100 text-blue-800'
                    };
                }
                // Generic fallback
                return {
                    type: 'other',
                    label: effect.substring(0, 20),
                    trigger: 'Pending',
                    icon: '📋',
                    color: 'bg-gray-100 text-gray-800'
                };
            }).filter(Boolean);
        }

        // Active Effects Component
        function ActiveEffects({ effects }) {
            const parsedEffects = parseEffects(effects);

            if (parsedEffects.length === 0) return null;

            return React.createElement('div', {
                key: 'active-effects',
                className: 'space-y-1'
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'text-xs font-semibold text-gray-700 mb-1'
                }, '⚡ Active Effects'),

                ...parsedEffects.map((effect, idx) =>
                    React.createElement('div', {
                        key: idx,
                        className: `text-xs px-2 py-1 rounded ${effect.color} flex justify-between items-center`
                    }, [
                        React.createElement('span', {
                            key: 'label',
                            className: 'font-semibold'
                        }, `${effect.icon} ${effect.label}`),

                        React.createElement('span', {
                            key: 'trigger',
                            className: 'text-xs opacity-75'
                        }, effect.trigger)
                    ])
                )
            ]);
        }

        // Player Card Component - Compact Horizontal Bar
        function PlayerCard({ player, isCurrentPlayer, onEndTurn, turnPosition }) {
            const { state, dispatch } = useGame();

            // Get active colors from current game layers
            const activeColors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];

            const gemIcons = {
                red: '🔴', yellow: '🟡', blue: '🔵', purple: '🟣',
                gold: '🟨', white: '⚪', black: '⚫', silver: '🩶'
            };
            
            return React.createElement('div', {
                className: `flex flex-col gap-2 px-4 py-3 rounded-lg glass shadow ${isCurrentPlayer ? 'ring-2 ring-blue-400' : ''}`,
            }, [
                // Row 1: Name + Emoji + VP
                React.createElement('div', { key: 'row1', className: 'flex items-center gap-3' }, [
                    // Name + Emoji
                    React.createElement('div', { key: 'name', className: 'font-bold text-base whitespace-nowrap' }, [
                        React.createElement('span', { key: 'emoji', className: 'text-xl mr-1' }, player.emoji || '👤'),
                        player.name,
                        isCurrentPlayer && React.createElement('span', { key: 'indicator', className: 'ml-1' }, '🎯')
                    ]),
                    // VP
                    React.createElement('div', { key: 'vp', className: 'text-lg font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded whitespace-nowrap' },
                        `${player.victoryPoints}VP`
                    )
                ]),

                // Active Effects Display
                player.effects && player.effects.length > 0 &&
                React.createElement(ActiveEffects, { key: 'effects', effects: player.effects }),

                // Phase Indicator (only for current player)
                isCurrentPlayer && (() => {
                    let phaseText = '';
                    let phaseColor = '';

                    if (state.workersToPlace > 0) {
                        phaseText = `Place Worker (${state.workersToPlace} remaining)`;
                        phaseColor = 'bg-blue-100 text-blue-800';
                    } else if (!state.shopUsedAfterWorkers) {
                        phaseText = 'Shopping Phase (Optional)';
                        phaseColor = 'bg-purple-100 text-purple-800';
                    } else {
                        phaseText = 'Ready to End Turn';
                        phaseColor = 'bg-green-100 text-green-800';
                    }

                    return React.createElement('div', {
                        key: 'phase',
                        className: `text-sm font-semibold px-3 py-1.5 rounded-lg ${phaseColor} text-center`
                    }, phaseText);
                })(),

                // Row 2: Resources + Workers + End Turn
                React.createElement('div', { key: 'row2', className: 'flex items-center gap-3' }, [
                    // Resources - compact horizontal
                    React.createElement('div', { key: 'resources', className: 'flex gap-1' },
                        activeColors.map(color =>
                            React.createElement('div', {
                                key: color,
                                className: 'text-sm font-medium'
                            }, `${gemIcons[color]}${player.resources[color] || 0}`)
                        )
                    ),
                    // Workers (emoji x count format)
                    React.createElement('div', { key: 'workers', className: 'text-base whitespace-nowrap font-medium' },
                        player.workersLeft > 0 ? `${player.emoji || '👤'} × ${player.workersLeft}` : ''
                    ),
                    // End Turn Button (only for current player, always show after workers placed)
                    isCurrentPlayer && state.workersToPlace === 0 &&
                    React.createElement(EndTurnButton, { key: 'end-turn', onEndTurn })
                ])
            ]);
        }

        // Game Layer Component - Card-focused layout with shops at top
        function GameLayer({ color, title, icon, actions, round }) {
            const { state } = useGame();
            const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
            
            const getLayerStyle = () => {
                const baseStyle = "glass rounded-lg shadow-md p-3 border-t-8 hover:shadow-lg transition-all duration-200 h-full flex flex-col";
                switch (color) {
                    case 'red': return `${baseStyle} border-t-red-500 bg-red-50 bg-opacity-30`;
                    case 'yellow': return `${baseStyle} border-t-yellow-500 bg-yellow-50 bg-opacity-30`;
                    case 'blue': return `${baseStyle} border-t-blue-500 bg-blue-50 bg-opacity-30`;
                    case 'purple': return `${baseStyle} border-t-purple-500 bg-purple-50 bg-opacity-30`;
                    case 'gold': return `${baseStyle} border-t-yellow-600 bg-yellow-50 bg-opacity-30`;
                    case 'white': return `${baseStyle} border-t-gray-300 bg-gray-50 bg-opacity-30`;
                    case 'black': return `${baseStyle} border-t-gray-800 bg-gray-100 bg-opacity-30`;
                    case 'silver': return `${baseStyle} border-t-gray-400 bg-gray-50 bg-opacity-30`;
                    default: return `${baseStyle} border-t-gray-500`;
                }
            };
            
            const getIconColor = () => {
                switch (color) {
                    case 'red': return 'text-red-500';
                    case 'yellow': return 'text-yellow-500';
                    case 'blue': return 'text-blue-500';
                    case 'purple': return 'text-purple-500';
                    case 'gold': return 'text-yellow-600';
                    case 'white': return 'text-gray-600';
                    case 'black': return 'text-gray-800';
                    case 'silver': return 'text-gray-400';
                    default: return 'text-gray-500';
                }
            };
            
            // Show all actions, not just available ones
            const availableActions = actions; // Remove filtering to show all actions
            
            return React.createElement('div', { className: getLayerStyle() }, [
                // Card Header - Layer title, automatic VP (centered), and round indicator
                React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-2' }, [
                    // Color name
                    React.createElement('h2', { key: 'title', className: `text-lg font-bold ${getIconColor()}` },
                        `${icon} ${color.charAt(0).toUpperCase() + color.slice(1)}`),
                    // Automatic VP (centered)
                    React.createElement('div', { key: 'auto-vp', className: 'text-sm font-bold text-gray-900 flex items-center gap-1' }, [
                        React.createElement('span', { key: 'trophy' }, '🏆'),
                        React.createElement('span', { key: 'text' }, getAutomaticVPText(color))
                    ]),
                    // Round indicator
                    React.createElement('span', { key: 'round', className: 'text-gray-700 text-xs bg-white px-2 py-0.5 rounded shadow-sm font-semibold' },
                        `R${round}`)
                ]),

                // Shops Section - Compact horizontal layout
                React.createElement('div', { key: 'shops', className: 'mb-1.5 bg-white bg-opacity-20 rounded-lg p-1.5' }, [
                    React.createElement('div', { key: 'shop-header', className: 'text-xs font-semibold text-gray-800 mb-1 px-0.5' }, '🏪 Shops'),
                    React.createElement('div', { key: 'shop-grid', className: 'grid grid-cols-4 gap-1' }, [
                        React.createElement(CompactShop, { key: 'shop-r1', color, round: 1, label: 'R1', currentRound: round }),
                        React.createElement(CompactShop, { key: 'shop-r2', color, round: 2, label: 'R2', currentRound: round }),
                        React.createElement(CompactShop, { key: 'shop-r3', color, round: 3, label: 'R3', currentRound: round }),
                        React.createElement(CompactVictoryShop, { key: 'shop-vp', color })
                    ])
                ]),
                
                // Action Spaces Section - Below shops
                React.createElement('div', { key: 'actions-section', className: 'flex-1' }, [
                    React.createElement('h3', { key: 'actions-title', className: 'text-xs font-semibold mb-1 text-gray-800 px-0.5' }, '⚡ Actions'),
                    React.createElement('div', { key: 'actions', className: 'grid grid-cols-3 gap-1' }, 
                        availableActions.map(action => 
                            React.createElement(ActionSpace, {
                                key: action.id,
                                actionId: action.id,
                                title: action.title,
                                description: action.description,
                                round: action.round,
                                available: action.round <= round,
                                compact: true // New prop for smaller action spaces
                            })
                        )
                    )
                ])
            ]);
        }

        // Regular Shop Component
        function RegularShop({ color, round }) {
            const { state, dispatch } = useGame();
            
            const shopData = {
                red: {
                    1: { cost: { red: 1, any: 2 }, effect: 'Repeat a worker\'s action' },
                    2: { cost: { red: 2, any: 2 }, effect: 'Place the next player\'s worker' },
                    3: { cost: { red: 4, any: 4 }, effect: 'Repeat all actions taken this round by ⭐ player' }
                },
                yellow: {
                    1: { cost: { yellow: 1, any: 1 }, effect: 'Double your next gain action' },
                    2: { cost: { yellow: 2, any: 2 }, effect: 'Gain 5⭐' },
                    3: { cost: { yellow: 3, any: 3 }, effect: 'Gain 7⭐' }
                },
                blue: {
                    1: { cost: { blue: 1, any: 1 }, effect: 'Close ⭐ shop this round' },
                    2: { cost: { blue: 2, any: 2 }, effect: 'Gain a shop benefit then close that shop' },
                    3: { cost: { blue: 3, any: 3 }, effect: 'Flip the status of all shops, including victory shops' }
                },
                purple: {
                    1: { cost: { purple: 1, any: 2 }, effect: 'Take an extra turn after this one' },
                    2: { cost: { purple: 2, any: 2 }, effect: 'Play 2 more workers this turn' },
                    3: { cost: { purple: 3, any: 3 }, effect: 'Play the rest of your workers' }
                },
                gold: {
                    1: { cost: { gold: 1, any: 1 }, effect: '1 Gold + 1 ⭐ = 2 Gold' },
                    2: { cost: { gold: 2, any: 2 }, effect: '2 Gold + 2 ⭐ = 4 Gold' },
                    3: { cost: { gold: 3, any: 3 }, effect: '3 Gold + 3 ⭐ = Double Your Gold' }
                },
                white: {
                    1: { cost: { vp: 1 }, effect: 'Gain 1 ⭐' },
                    2: { cost: { vp: 2 }, effect: 'Skip Next Player\'s Turn' },
                    3: { cost: { vp: 3 }, effect: 'Move Worker to Unclaimed Action' }
                },
                black: {
                    1: { cost: { black: 1, any: 1 }, effect: 'Steal 1 VP from another player' },
                    2: { cost: { black: 2, any: 2 }, effect: 'Steal 3 VP from another player' },
                    3: { cost: { black: 3, any: 3 }, effect: 'Steal 5 VP from another player' }
                },
                silver: {
                    1: { cost: { silver: 1, any: 1 }, effect: '1 Silver + 1 Any = 2 VP' },
                    2: { cost: { silver: 2, any: 2 }, effect: 'Gain 4 VP, Pick Another Player to Gain 4 VP' },
                    3: { cost: { silver: 3, any: 3 }, effect: 'Gain 7 Silver, Each Other Player Gains 2 Silver' }
                }
            };
            
            const handlePurchase = async (shopRound) => {
                // Validate multiplayer turn
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                // Check if this shop is closed
                const shopId = `${color}${shopRound}`;
                if (state.closedShops[shopId]) {
                    alert(`${color.charAt(0).toUpperCase() + color.slice(1)} R${shopRound} shop is closed!`);
                    return;
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                const shop = shopData[color][shopRound];
                
                // Check if player has enough resources
                const vpRequired = shop.cost.vp || 0;
                const colorRequired = shop.cost[color] || 0;
                let anyRequired = shop.cost.any || 0;
                
                // Apply player's cost modifier
                anyRequired = Math.max(0, anyRequired + (currentPlayer.shopCostModifier || 0));
                
                // For WHITE shops that cost VP
                if (vpRequired > 0) {
                    if (currentPlayer.victoryPoints < vpRequired) {
                        alert(`Need ${vpRequired} VP. You have ${currentPlayer.victoryPoints}.`);
                        return;
                    }
                }
                
                // For shops that cost specific color resources
                if (colorRequired > 0 && currentPlayer.resources[color] < colorRequired) {
                    alert(`Need ${colorRequired} ${color} gems. You have ${currentPlayer.resources[color]}.`);
                    return;
                }
                
                if (anyRequired > 0) {
                    const totalAllGems = Object.values(currentPlayer.resources).reduce((sum, amount) => sum + amount, 0);
                    const totalAvailableForAny = totalAllGems - colorRequired; // Subtract the specific color requirement
                    
                    if (totalAvailableForAny < anyRequired) {
                        alert(`Need ${anyRequired} additional gems of ⭐ color. You have ${totalAvailableForAny} available.`);
                        return;
                    }
                }
                
                // Special validation for Purple R1 shop - warn if already have extra turn
                if (color === 'purple' && shopRound === 1) {
                    const hasExtraTurnEffect = (currentPlayer.effects || []).some(effect => 
                        effect.includes('Will take an extra turn after this one')
                    );
                    const hasExtraTurns = (currentPlayer.extraTurns || 0) > 0;
                    
                    if (hasExtraTurnEffect || hasExtraTurns) {
                        const proceed = confirm('WARNING: You already have an extra turn queued! This purchase will have no additional effect. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Special validation for Yellow R1 shop - warn if already have double effect
                if (color === 'yellow' && shopRound === 1) {
                    const hasDoubleEffect = (currentPlayer.effects || []).some(effect => 
                        effect.includes('Next gain will be doubled')
                    );
                    
                    if (hasDoubleEffect) {
                        const proceed = confirm('WARNING: You already have the double gain effect active! This purchase will have no additional effect. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Special validation for Purple R2/R3 shops - warn about worker availability
                if (color === 'purple' && shopRound === 2) {
                    if (currentPlayer.workersLeft < 2) {
                        const proceed = confirm(`WARNING: You only have ${currentPlayer.workersLeft} worker(s) left. You need at least 2 to fully benefit from this shop. Continue anyway?`);
                        if (!proceed) return;
                    }
                }
                
                if (color === 'purple' && shopRound === 3) {
                    if (currentPlayer.workersLeft === 0) {
                        const proceed = confirm('WARNING: You have no workers left! This shop will have no effect. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Special validation for Blue R1 shop - warn if all shops closed
                if (color === 'blue' && shopRound === 1) {
                    const allShops = [];
                    const colors = state.gameLayers ? Object.keys(state.gameLayers) : [];
                    colors.forEach(c => {
                        for (let r = 1; r <= 3; r++) {
                            allShops.push(`${c}${r}`);
                        }
                    });
                    
                    const openShops = allShops.filter(shopId => !state.closedShops[shopId]);
                    if (openShops.length === 0) {
                        const proceed = confirm('WARNING: All shops are already closed! This shop will have no effect. Continue anyway?');
                        if (!proceed) return;
                    }
                }
                
                // Special validation for Red R1 shop - warn if no good workers to repeat
                if (color === 'red' && shopRound === 1) {
                    const playerWorkers = Object.entries(state.occupiedSpaces)
                        .filter(([actionId, playerId]) => playerId === currentPlayer.id);
                    
                    if (playerWorkers.length === 0) {
                        const proceed = confirm('WARNING: You have no workers on the board to repeat actions from! Continue anyway?');
                        if (!proceed) return;
                    } else {
                        // Check if any of the worker actions are repeatable (exclude problematic ones)
                        const excludedActions = ['redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2'];
                        const repeatableWorkers = playerWorkers.filter(([actionId]) => 
                            !excludedActions.includes(actionId)
                        );
                        
                        if (repeatableWorkers.length === 0) {
                            const proceed = confirm('WARNING: All your workers are on non-repeatable actions (swap/repeat actions). You will have limited options. Continue anyway?');
                            if (!proceed) return;
                        }
                    }
                }
                
                // Deduct VP cost if applicable
                if (vpRequired > 0) {
                    dispatch({ 
                        type: 'UPDATE_VP', 
                        playerId: currentPlayer.id, 
                        vp: -vpRequired,
                        source: 'shopCost'
                    });
                }
                
                // Deduct the specific color cost
                const resourceCost = {};
                if (colorRequired > 0) {
                    resourceCost[color] = -colorRequired;
                }
                
                // Deduct "any" cost - let player choose colors
                if (anyRequired > 0) {
                    // Create a copy of resources to track what's available for "any" cost
                    const availableForAny = {...currentPlayer.resources};
                    
                    // IMPORTANT: Only exclude the color gems if they're actually required
                    // For purple R1 shop: colorRequired = 1, so we should only exclude 1 purple gem
                    if (colorRequired > 0 && color in availableForAny) {
                        availableForAny[color] = Math.max(0, availableForAny[color] - colorRequired);
                    }
                    
                    // Use gem selection modal for better UX
                    const selectedGems = await showGemSelection(
                        dispatch,
                        `Choose ${anyRequired} ${anyRequired === 1 ? 'gem' : 'gems'} to spend`,
                        anyRequired,
                        availableForAny  // Pass available resources to limit selection
                    );
                    
                    if (selectedGems) {
                        // Add selected gems to resource cost
                        Object.entries(selectedGems).forEach(([gemColor, count]) => {
                            resourceCost[gemColor] = (resourceCost[gemColor] || 0) - count;
                        });
                    } else {
                        // If cancelled, auto-select resources
                        let remaining = anyRequired;
                        const activeColors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
                        
                        // For better UX, prioritize non-shop colors first when auto-selecting
                        const sortedColors = activeColors.sort((a, b) => {
                            // Put the shop's color last to avoid taking more than required
                            if (a === color) return 1;
                            if (b === color) return -1;
                            return 0;
                        });
                        
                        for (const c of sortedColors) {
                            if (remaining <= 0) break;
                            const currentAmount = currentPlayer.resources[c];
                            const alreadySpent = resourceCost[c] ? -resourceCost[c] : 0;
                            const available = currentAmount - alreadySpent;
                            const take = Math.min(available, remaining);
                            if (take > 0) {
                                resourceCost[c] = (resourceCost[c] || 0) - take;
                                remaining -= take;
                            }
                        }
                    }
                }
                
                // Debug logging for Purple shop cost issue
                if (color === 'purple' && shopRound === 1) {
                    console.log('PURPLE_SHOP_DEBUG - Final resourceCost:', resourceCost, 
                              'Player had:', currentPlayer.resources,
                              'Shop cost was:', cost);
                }
                
                dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: resourceCost });
                
                // Create updated state with cost deducted for shop effects
                const updatedPlayerResources = { ...currentPlayer.resources };
                Object.entries(resourceCost).forEach(([resColor, amount]) => {
                    updatedPlayerResources[resColor] = Math.max(0, updatedPlayerResources[resColor] + amount);
                });
                
                const updatedPlayer = { ...currentPlayer, resources: updatedPlayerResources };
                const updatedPlayers = state.players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
                const updatedState = { ...state, players: updatedPlayers };
                
                // Apply the shop effect immediately
                switch(`${color}${shopRound}`) {
                    case 'red1':
                        // Repeat a worker's action - execute immediately
                        await executeRepeatAction(updatedPlayer, dispatch, updatedState, state.gameLayers);
                        break;
                    case 'red2':
                        dispatch({
                            type: 'ADD_EFFECT',
                            playerId: currentPlayer.id,
                            effect: 'Can place the next player\'s worker'
                        });
                        break;
                    case 'yellow1':
                        dispatch({
                            type: 'ADD_EFFECT',
                            playerId: currentPlayer.id,
                            effect: 'Next gain will be doubled'
                        });
                        break;
                    case 'yellow2':
                        // Gain 5 resources ⭐ colors + everyone gains resource - execute immediately
                        await executeYellow2Shop(currentPlayer, dispatch, state);
                        break;
                    case 'yellow3':
                        // Gain 9 resources ⭐ colors + everyone gains 1 each - execute immediately
                        await executeYellow3Shop(currentPlayer, dispatch, state);
                        break;
                    case 'red3':
                        // Repeat all actions taken this round by any player - execute immediately
                        await executeRed3Shop(currentPlayer, dispatch, state);
                        break;
                    case 'blue1':
                        // Close any shop this round - let player choose
                        await executeBlue1Shop(currentPlayer, dispatch, state);
                        break;
                    case 'blue2':
                        // Flip all shops immediately
                        dispatch({ type: 'FLIP_ALL_SHOPS' });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: All shops flipped!` });
                        break;
                    case 'blue3':
                        // Gain any shop benefit (even if closed) - execute immediately
                        await executeBlue3Shop(currentPlayer, dispatch, state);
                        break;
                    case 'purple1':
                        // Add effect for visual feedback
                        dispatch({
                            type: 'ADD_EFFECT',
                            playerId: currentPlayer.id,
                            effect: 'Will take an extra turn after this one'
                        });
                        // Actually grant the extra turn
                        dispatch({
                            type: 'UPDATE_PLAYER',
                            playerId: currentPlayer.id,
                            updates: { extraTurns: (updatedPlayer.extraTurns || 0) + 1 }
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Purple R1 shop → Will take an extra turn after this one` });
                        break;
                    case 'purple2':
                        // Play 2 more workers this turn
                        dispatch({
                            type: 'SET_WORKERS_TO_PLACE',
                            count: 2
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Can place 2 more workers this turn!` });
                        break;
                    case 'purple3':
                        // Play the rest of your workers
                        const workersRemaining = currentPlayer.workersLeft;
                        if (workersRemaining > 0) {
                            dispatch({
                                type: 'SET_WORKERS_TO_PLACE',
                                count: workersRemaining
                            });
                            dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Can place all ${workersRemaining} remaining workers!` });
                        }
                        break;
                    case 'silver1':
                        // 1 Silver + 1 ⭐ = 2 VP
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: 2,
                            source: 'silverShop'
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Silver R1 shop → +2 VP` });
                        break;
                    case 'silver2':
                        // Gain 4 VP, Pick Another Player to Gain 4 VP
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: 4,
                            source: 'silverShop'
                        });
                        
                        // Choose another player to give 4 VP
                        const targetPlayer = await selectTargetPlayer(dispatch, 'Choose a player to also gain 4 VP', state.players, currentPlayer.id);
                        
                        if (targetPlayer) {
                            dispatch({
                                type: 'UPDATE_VP',
                                playerId: targetPlayer.id,
                                vp: 4,
                                source: 'silverShop'
                            });
                            dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Silver R2 shop → +4 VP, Player ${targetPlayer.id} +4 VP` });
                        } else {
                            // If cancelled, pick first other player
                            const firstOther = otherPlayers[0];
                            if (firstOther) {
                                dispatch({
                                    type: 'UPDATE_VP',
                                    playerId: firstOther.id,
                                    vp: 4,
                                    source: 'silverShop'
                                });
                                dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Silver R2 shop → +4 VP, Player ${firstOther.id} +4 VP` });
                            } else {
                                dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Silver R2 shop → +4 VP (no other players)` });
                            }
                        }
                        break;
                    case 'silver3':
                        // Gain 7 Silver, Each Other Player Gains 2 Silver
                        dispatch({
                            type: 'UPDATE_RESOURCES',
                            playerId: currentPlayer.id,
                            resources: { silver: 7 }
                        });
                        
                        // Give other players 2 silver each
                        const otherPlayersSilver = state.players.filter(p => p.id !== currentPlayer.id);
                        otherPlayersSilver.forEach(otherPlayer => {
                            dispatch({
                                type: 'UPDATE_RESOURCES',
                                playerId: otherPlayer.id,
                                resources: { silver: 2 }
                            });
                        });
                        
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Silver R3 shop → +7 silver, all other players +2 silver` });
                        break;
                }
                
                const message = `Player ${currentPlayer.id}: Bought ${color} R${shopRound} shop`;
                dispatch({ type: 'ADD_LOG', message });
                console.log(message);
                
                // BLUE AUTOMATIC VP: Player gets 1 VP when they activate a shop effect
                if (state.automaticVPs?.blue) {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: currentPlayer.id,
                        vp: 1,
                        source: 'blueAutomatic'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +1 VP (activated a shop effect)` });
                }
            };
            
            const round1Shop = shopData[color][1];
            const round2Shop = shopData[color][2];
            
            return React.createElement('div', { 
                className: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-3 shadow-md hover:shadow-lg transition-all' 
            }, [
                React.createElement('div', { key: 'title', className: 'text-center font-bold text-yellow-700 mb-2 text-sm' }, `🛒 ${color.charAt(0).toUpperCase() + color.slice(1)}`),
                
                React.createElement('div', { key: 'round1', className: 'text-xs mb-2' }, [
                    React.createElement('div', { key: 'desc', className: 'mb-1 text-yellow-800' }, 
                        `R1: ${round1Shop.effect.length > 20 ? round1Shop.effect.substring(0, 20) + '...' : round1Shop.effect}`),
                    React.createElement('button', {
                        key: 'btn',
                        onClick: () => handlePurchase(1),
                        className: 'bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors w-full'
                    }, 'Buy R1')
                ]),
                
                round >= 2 && React.createElement('div', { key: 'round2', className: 'text-xs' }, [
                    React.createElement('div', { key: 'desc', className: 'mb-1 text-yellow-800' }, 
                        `R2: ${round2Shop.effect.length > 20 ? round2Shop.effect.substring(0, 20) + '...' : round2Shop.effect}`),
                    React.createElement('button', {
                        key: 'btn',
                        onClick: () => handlePurchase(2),
                        className: 'bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors w-full',
                        disabled: color === 'purple'
                    }, color === 'purple' ? 'TBD' : 'Buy R2')
                ])
            ]);
        }

        // Get automatic VP text for each layer
        function getAutomaticVPText(color) {
            switch(color) {
                case 'red':
                    return '🏆 +1 VP each time you use or repeat a red layer action';
                case 'yellow':
                    return '🏆 +1 VP per different color gem at end of each round';
                case 'blue':
                    return '🏆 Get 1 VP when you activate a shop effect';
                case 'purple':
                    return '🏆 First & last to run out of workers each round get 4 VP';
                case 'white':
                    return '🏆 All players start game with 5 VP when white is in play';
                case 'gold':
                    return '🏆 +1 VP per gold gem at end of each round';
                case 'black':
                    return '🏆 +1 VP whenever you steal from another player';
                case 'silver':
                    return '🏆 End of Round: Most VP get 3 Silver, others get 2 VP';
                default:
                    return '';
            }
        }
        
        // Get VP breakdown text for tooltip
        function getVPBreakdown(vpSources) {
            if (!vpSources || Object.keys(vpSources).length === 0) return 'No VP yet';
            return Object.entries(vpSources)
                .map(([source, amount]) => `${getVPSourceName(source)}: ${amount}`)
                .join(', ');
        }
        
        // Get VP breakdown display for hover tooltip
        function getVPBreakdownDisplay(vpSources) {
            if (!vpSources || Object.keys(vpSources).length === 0) {
                return React.createElement('div', {}, 'No VP yet');
            }
            
            return React.createElement('div', {}, 
                Object.entries(vpSources).map(([source, amount]) => 
                    React.createElement('div', { key: source }, 
                        `${getVPSourceName(source)}: ${amount} VP`
                    )
                )
            );
        }
        
        // Get friendly name for VP source
        function getVPSourceName(source) {
            switch(source) {
                case 'redAction': return '🔴 Red Actions';
                case 'yellowDiversity': return '🟡 Resource Diversity';
                case 'blueShopUsage': return '🔵 Shop Usage';
                case 'purpleWorkers': return '🟣 Worker Timing';
                case 'victoryShop': return '🏆 Victory Shops';
                case 'shopPurchase': return '🏪 Shop Purchases';
                case 'whiteStarting': return '⚪ Starting VP';
                case 'whiteAction': return '⚪ White Actions';
                case 'whiteShop': return '⚪ White Shops';
                case 'goldAutomatic': return '🟨 Gold Resources';
                case 'goldVPPerGold': return '🟨 Gold Action';
                case 'blackAutomatic': return '⚫ Stealing Bonus';
                case 'blackSteal': return '⚫ Stolen VP';
                case 'blackShop': return '⚫ Black Shop';
                case 'blackVictoryShop': return '⚫ Victory Shop';
                case 'blackPenalty': return '⚫ Black Penalty';
                case 'silverAutomatic': return '🩶 Silver Automatic';
                case 'silverAction': return '🩶 Silver Actions';
                case 'silverShop': return '🩶 Silver Shops';
                default: return '❓ Other';
            }
        }
        
        // Compact Shop Component
        function CompactShop({ color, round, label, currentRound }) {
            const { state, dispatch } = useGame();

            // Define shop data inline to ensure it's being used
            const inlineShopData = {
                red: {
                    1: { cost: { red: 1, any: 2 }, effect: 'Repeat one of your worker\'s actions' },
                    2: { cost: { red: 2, any: 2 }, effect: 'Place the next player\'s worker for them' },
                    3: { cost: { red: 4, any: 4 }, effect: 'Repeat all actions you took this round' }
                },
                yellow: {
                    1: { cost: { yellow: 1, any: 1 }, effect: 'Double your next resource gain' },
                    2: { cost: { yellow: 2, any: 2 }, effect: 'Gain 5 resources (any colors)' },
                    3: { cost: { yellow: 3, any: 3 }, effect: 'Gain 7 resources (any colors)' }
                },
                blue: {
                    1: { cost: { blue: 1, any: 1 }, effect: 'Open or close any one shop' },
                    2: { cost: { blue: 2, any: 2 }, effect: 'Flip all shops (open ↔ closed)' },
                    3: { cost: { blue: 3, any: 3 }, effect: 'Use any shop benefit for free' }
                },
                purple: {
                    1: { cost: { purple: 1, any: 2 }, effect: 'Take an extra turn after this one' },
                    2: { cost: { purple: 2, any: 2 }, effect: 'Place 2 more workers this turn' },
                    3: { cost: { purple: 3, any: 3 }, effect: 'Place all your remaining workers now' }
                },
                gold: {
                    1: { cost: { gold: 1, any: 1 }, effect: 'Trade: 1 Gold + 1 Any → 2 Gold' },
                    2: { cost: { gold: 2, any: 2 }, effect: 'Trade: 2 Gold + 2 Any → 4 Gold' },
                    3: { cost: { gold: 3, any: 3 }, effect: 'Trade: 3 Gold + 3 Any → Double your Gold' }
                },
                white: {
                    1: { cost: { vp: 1 }, effect: 'Lose 1 VP, gain 1 resource (any color)' },
                    2: { cost: { vp: 2 }, effect: 'Lose 3 VP, next player skips their turn' },
                    3: { cost: { vp: 3 }, effect: 'Lose 5 VP, move one worker to any action' }
                },
                black: {
                    1: { cost: { black: 1, any: 1 }, effect: 'Steal 1 VP from any player' },
                    2: { cost: { black: 2, any: 2 }, effect: 'Steal 3 VP from any player' },
                    3: { cost: { black: 3, any: 3 }, effect: 'Steal 5 VP from any player' }
                },
                silver: {
                    1: { cost: { silver: 1, any: 1 }, effect: 'Gain 2 VP' },
                    2: { cost: { silver: 2, any: 2 }, effect: 'You and another player each gain 4 VP' },
                    3: { cost: { silver: 3, any: 3 }, effect: 'Gain 7 Silver, all others gain 2 Silver' }
                }
            };

            const shop = inlineShopData[color][round];
            const shopId = `${color}${round}`;
            const isClosed = state.closedShops[shopId];

            // A shop is available if it's not closed
            // Since we now initialize future shops as closed, opening them makes them available
            const isAvailable = !isClosed;
            const vpCost = shop.cost.vp || 0;
            const colorCost = shop.cost[color] || 0;

            const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
            const anyCost = Math.max(0, (shop.cost.any || 0) + (currentPlayer?.shopCostModifier || 0));
            
            const handlePurchase = async () => {
                if (isClosed) {
                    alert('This shop is closed!');
                    return;
                }
                
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                // Check shop availability - shops can only be used AFTER all workers are placed
                if (state.workersToPlace > 0) {
                    // Still have workers to place - cannot use shop
                    alert('You must finish placing all your workers before using a shop!');
                    return;
                }

                if (state.shopUsedAfterWorkers) {
                    // Already used shop this turn
                    alert('You have already used a shop this turn!');
                    return;
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                
                // Check resources
                if (vpCost > 0) {
                    if (currentPlayer.victoryPoints < vpCost) {
                        alert(`Need ${vpCost} VP. You have ${currentPlayer.victoryPoints}.`);
                        return;
                    }
                } else if (currentPlayer.resources[color] < colorCost) {
                    alert(`Need ${colorCost} ${color} gems.`);
                    return;
                }
                
                const totalGems = Object.values(currentPlayer.resources).reduce((sum, amt) => sum + amt, 0);
                const requiredForAny = vpCost > 0 ? totalGems : totalGems - colorCost;
                if (requiredForAny < anyCost) {
                    alert(`Need ${anyCost} additional gems.`);
                    return;
                }
                
                // Special validation for red R1 shop - must have valid actions to repeat
                if (color === 'red' && round === 1) {
                    const excludedActions = [
                        'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
                        'blueAnyShopBenefit', 'blueR1ShopBenefit',
                        'redVictoryShop', 'yellowVictoryShop', 'blueVictoryShop', 'purpleVictoryShop',
                        'goldVictoryShop', 'whiteVictoryShop', 'blackVictoryShop', 'silverVictoryShop'
                    ];
                    
                    const validSpaces = Object.entries(state.occupiedSpaces)
                        .filter(([spaceId, pid]) => 
                            pid === currentPlayer.id && !excludedActions.includes(spaceId)
                        );
                    
                    if (validSpaces.length === 0) {
                        alert('You have no valid workers to repeat! Swap and repeat actions cannot be repeated.');
                        return;
                    }
                }
                
                // Simple cost deduction (full implementation in RegularShop)
                const resourceCost = {};
                if (colorCost > 0) {
                    resourceCost[color] = -colorCost;
                }
                
                // Deduct any cost - let player choose colors
                if (anyCost > 0) {
                    // Create a copy of resources to track what's available for "any" cost
                    const availableForAny = {...currentPlayer.resources};
                    
                    // IMPORTANT: Only exclude the color gems if they're actually required
                    // For purple R1 shop: colorCost = 1, so we should only exclude 1 purple gem
                    if (colorCost > 0 && color in availableForAny) {
                        availableForAny[color] = Math.max(0, availableForAny[color] - colorCost);
                    }
                    
                    // Use gem selection modal for better UX
                    const selectedGems = await showGemSelection(
                        dispatch,
                        `Choose ${anyCost} ${anyCost === 1 ? 'gem' : 'gems'} to spend`,
                        anyCost,
                        availableForAny  // Pass available resources that exclude already-spent color gems
                    );
                    
                    if (selectedGems) {
                        // Add selected gems to resource cost
                        Object.entries(selectedGems).forEach(([gemColor, count]) => {
                            resourceCost[gemColor] = (resourceCost[gemColor] || 0) - count;
                        });
                    } else {
                        // If cancelled, return without completing purchase
                        return;
                    }
                }
                
                // Now deduct VP cost after all selections are confirmed
                if (vpCost > 0) {
                    dispatch({ 
                        type: 'UPDATE_VP', 
                        playerId: currentPlayer.id, 
                        vp: -vpCost,
                        source: 'shopCost'
                    });
                }
                
                // Deduct resource costs
                dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: resourceCost });
                
                // Execute shop effect
                const shopSuccess = await executeShopBenefit(color, round, currentPlayer, dispatch, state, 0);
                
                // If shop benefit was cancelled, refund the costs
                if (!shopSuccess) {
                    // Refund VP cost
                    if (vpCost > 0) {
                        dispatch({ 
                            type: 'UPDATE_VP', 
                            playerId: currentPlayer.id, 
                            vp: vpCost,
                            source: 'shopRefund'
                        });
                    }
                    
                    // Refund resource costs (negate the negative values)
                    const refundResources = {};
                    Object.entries(resourceCost).forEach(([resColor, cost]) => {
                        refundResources[resColor] = -cost; // Negate negative to make positive
                    });
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: refundResources });
                    
                    dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Shop purchase cancelled - costs refunded` });
                    return;
                }
                
                // Track shop usage
                dispatch({ type: 'USE_SHOP' });
                
                // Blue automatic VP - player gets VP when they activate a shop effect
                dispatch({ type: 'UPDATE_VP', playerId: currentPlayer.id, vp: 1, source: 'blueShopUsage' });
                dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +1 VP (activated a shop effect)` });
            };
            
            const getColorEmoji = () => {
                switch(color) {
                    case 'red': return '🔴';
                    case 'yellow': return '🟡';
                    case 'blue': return '🔵';
                    case 'purple': return '🟣';
                    case 'gold': return '🟨';
                    case 'white': return '⚪';
                    case 'black': return '⚫';
                    case 'silver': return '🩶';
                    default: return '⚪';
                }
            };
            
            const getBgGradient = () => {
                if (!isAvailable) return 'bg-gray-100';
                switch(color) {
                    case 'red': return 'bg-gradient-to-br from-red-50 to-red-100';
                    case 'yellow': return 'bg-gradient-to-br from-yellow-50 to-yellow-100';
                    case 'blue': return 'bg-gradient-to-br from-blue-50 to-blue-100';
                    case 'purple': return 'bg-gradient-to-br from-purple-50 to-purple-100';
                    case 'gold': return 'bg-gradient-to-br from-yellow-100 to-amber-100';
                    case 'white': return 'bg-gradient-to-br from-gray-50 to-gray-100';
                    case 'black': return 'bg-gradient-to-br from-gray-700 to-gray-800';
                    case 'silver': return 'bg-gradient-to-br from-gray-200 to-gray-300';
                    default: return 'bg-white';
                }
            };
            
            const getBorderColor = () => {
                if (!isAvailable) return 'border-gray-300';
                switch(color) {
                    case 'red': return 'border-red-300';
                    case 'yellow': return 'border-yellow-300';
                    case 'blue': return 'border-blue-300';
                    case 'purple': return 'border-purple-300';
                    case 'gold': return 'border-amber-400';
                    case 'white': return 'border-gray-400';
                    case 'black': return 'border-gray-600';
                    case 'silver': return 'border-gray-400';
                    default: return 'border-gray-300';
                }
            };
            
            return React.createElement('div', {
                className: `relative rounded-lg ${getBgGradient()} ${getBorderColor()} border-2 transition-all flex flex-col shadow hover:shadow-md overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`,
            }, [
                // Header bar with round and cost
                React.createElement('div', {
                    key: 'header',
                    className: 'bg-white bg-opacity-80 px-2 py-1 flex items-center justify-between border-b ' + getBorderColor()
                }, [
                    React.createElement('span', { key: 'round-label', className: 'text-xs font-bold text-gray-900' },
                        `R${round}`
                    ),
                    React.createElement('div', { key: 'cost', className: 'text-sm font-bold flex items-center gap-0.5' },
                        vpCost > 0 ? [
                            React.createElement('span', { key: 'vp', className: 'text-purple-700' }, `${vpCost}VP`),
                            anyCost > 0 && React.createElement('span', { key: 'any', className: 'text-gray-600' }, `+${anyCost}⭐`)
                        ] : [
                            colorCost > 0 && React.createElement('span', { key: 'color' }, `${colorCost}${getColorEmoji()}`),
                            colorCost > 0 && anyCost > 0 && React.createElement('span', { key: 'plus', className: 'text-gray-600' }, '+'),
                            anyCost > 0 && React.createElement('span', { key: 'any', className: 'text-gray-600' }, `${anyCost}⭐`)
                        ]
                    )
                ]),
                // Effect description
                React.createElement('div', {
                    key: 'effect',
                    className: `p-1.5 text-xs font-medium ${color === 'black' ? 'text-white' : 'text-gray-900'} leading-tight text-center min-h-[45px] flex items-center justify-center`
                },
                    shop.effect
                ),
                // Buy button
                React.createElement('button', {
                    key: 'btn',
                    onClick: handlePurchase,
                    className: `py-1 text-xs font-bold transition-all ${!isAvailable ? 'bg-gray-400 cursor-not-allowed text-gray-600' : 'bg-green-500 hover:bg-green-600 text-white'}`,
                    disabled: !isAvailable
                }, !isAvailable ? '🔒' : 'BUY')
            ]);
        }
        
        // Compact Victory Shop Component
        function CompactVictoryShop({ color }) {
            const { state, dispatch } = useGame();
            
            const shopData = {
                red: { cost: 4, vp: 5 },
                yellow: { cost: 4, vp: 3 },
                blue: { cost: 4, vp: 5 },
                purple: { cost: 4, vp: 5 },
                white: { cost: 4, vp: 4 },
                black: { cost: 6, vp: 0, special: 'steal2FromEach' },
                silver: { cost: 6, vp: 8 }
            };
            
            // Gold doesn't have a VP shop
            if (color === 'gold') {
                return null;
            }
            
            const shop = shopData[color];
            const shopId = `${color}vp`;
            const isClosed = state.closedShops[shopId];
            
            // Get current player first
            const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
            // Calculate actualCost for display
            const displayCost = (color === 'black' || color === 'white') ? shop.cost : Math.max(0, shop.cost + (currentPlayer?.shopCostModifier || 0));
            
            const handlePurchase = () => {
                if (isClosed) {
                    alert('This shop is closed!');
                    return;
                }
                
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                // Check shop availability - shops can only be used AFTER all workers are placed
                if (state.workersToPlace > 0) {
                    // Still have workers to place - cannot use shop
                    alert('You must finish placing all your workers before using a shop!');
                    return;
                }

                if (state.shopUsedAfterWorkers) {
                    // Already used shop this turn
                    alert('You have already used a shop this turn!');
                    return;
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                // Apply cost modifier to all gem-based VP shops (not black which has special cost)
                const actualCost = (color === 'black' || color === 'white') ? shop.cost : Math.max(0, shop.cost + (currentPlayer.shopCostModifier || 0));
                
                if (color === 'yellow') {
                    const totalGems = Object.values(currentPlayer.resources).reduce((sum, amt) => sum + amt, 0);
                    if (totalGems < actualCost) {
                        alert(`Need ${actualCost} gems total.`);
                        return;
                    }
                } else {
                    if (currentPlayer.resources[color] < actualCost) {
                        alert(`Need ${actualCost} ${color} gems.`);
                        return;
                    }
                }
                
                // Deduct cost (simplified)
                const resourceCost = {};
                if (color === 'yellow') {
                    let remaining = actualCost;
                    ['red', 'yellow', 'blue', 'purple'].forEach(c => {
                        const take = Math.min(currentPlayer.resources[c], remaining);
                        if (take > 0) {
                            resourceCost[c] = -take;
                            remaining -= take;
                        }
                    });
                } else {
                    resourceCost[color] = -actualCost;
                }
                
                dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: resourceCost });
                
                // Handle special BLACK victory shop
                if (color === 'black' && shop.special === 'steal2FromEach') {
                    // Steal 2 VP from each other player
                    const otherPlayers = state.players.filter(p => p.id !== currentPlayer.id);
                    let totalVPStolen = 0;
                    
                    otherPlayers.forEach(otherPlayer => {
                        const vpToSteal = Math.min(2, otherPlayer.victoryPoints);
                        if (vpToSteal > 0) {
                            dispatch({
                                type: 'UPDATE_VP',
                                playerId: otherPlayer.id,
                                vp: -vpToSteal,
                                source: 'blackVictoryShop'
                            });
                            totalVPStolen += vpToSteal;
                        }
                    });
                    
                    if (totalVPStolen > 0) {
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: totalVPStolen,
                            source: 'blackVictoryShop'
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Black Victory Shop → Stole ${totalVPStolen} VP (2 from each player)` });
                        
                        // BLACK AUTOMATIC VP: Gain 1 VP when stealing
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: 1,
                            source: 'blackAutomatic'
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +1 VP (Black automatic: stealing bonus)` });
                    } else {
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Black Victory Shop → No VP to steal` });
                    }
                } else {
                    // Normal victory shop
                    dispatch({ type: 'UPDATE_VP', playerId: currentPlayer.id, vp: shop.vp, source: 'victoryShop' });
                }
                
                // Track shop usage
                dispatch({ type: 'USE_SHOP' });
                
                // Blue automatic VP - player gets VP when they activate a shop effect
                dispatch({ type: 'UPDATE_VP', playerId: currentPlayer.id, vp: 1, source: 'blueShopUsage' });
                dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +1 VP (activated a shop effect)` });
            };
            
            const getColorEmoji = () => {
                switch(color) {
                    case 'red': return '🔴';
                    case 'yellow': return '🟡';
                    case 'blue': return '🔵';
                    case 'purple': return '🟣';
                    case 'gold': return '🟨';
                    case 'white': return '⚪';
                    case 'black': return '⚫';
                    case 'silver': return '🩶';
                    default: return '⚪';
                }
            };
            
            const getBgGradient = () => {
                if (isClosed) return 'bg-gray-100';
                return 'bg-gradient-to-br from-emerald-50 to-emerald-100';
            };
            
            const getVPText = () => {
                if (color === 'black' && shop.special === 'steal2FromEach') {
                    return 'Steal 2 VP from each player';
                }
                return `Gain ${shop.vp} Victory Points`;
            };
            
            return React.createElement('div', { 
                className: `p-2 rounded-lg ${getBgGradient()} border-2 border-emerald-400 transition-all flex flex-col shadow-sm hover:shadow-md ${isClosed ? 'opacity-50' : ''}` 
            }, [
                React.createElement('div', { key: 'header', className: 'flex items-center justify-between mb-1' }, [
                    React.createElement('div', { key: 'vp-label', className: 'text-xs font-bold text-emerald-700' }, 
                        '🏆 VP'
                    ),
                    React.createElement('div', { key: 'cost', className: 'text-xs font-bold' }, 
                        color === 'yellow' ? `${displayCost}⭐` : `${displayCost}${getColorEmoji()}`
                    )
                ]),
                React.createElement('div', { key: 'effect', className: 'text-xs text-gray-700 font-medium leading-tight mb-2 min-h-[2rem]' }, 
                    getVPText()
                ),
                React.createElement('button', {
                    key: 'btn',
                    onClick: handlePurchase,
                    className: `text-xs py-1 px-2 rounded font-semibold transition-all ${isClosed ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow'}`,
                    disabled: isClosed
                }, 'Buy')
            ]);
        }
        
        // Victory Shop Component
        function VictoryShop({ color }) {
            const { state, dispatch } = useGame();
            
            const shopData = {
                red: { cost: { red: 4 }, vp: 5 },
                yellow: { cost: { any: 4 }, vp: 3 },
                blue: { cost: { blue: 4 }, vp: 5 },
                purple: { cost: { purple: 4 }, vp: 5 },
                white: { cost: { white: 4 }, vp: 5 },
                black: { cost: { black: 6 }, vp: 0, special: 'steal2FromEach' },
                silver: { cost: { silver: 6 }, vp: 8 }
            };
            
            const shopId = `${color}vp`;
            const isClosed = state.closedShops[shopId];
            
            const handlePurchase = () => {
                // Check if shop is closed
                if (isClosed) {
                    alert('This shop is closed!');
                    return;
                }
                
                // Validate multiplayer turn
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                const shop = shopData[color];
                
                if (color === 'yellow') {
                    // Yellow VP shop costs 4 ⭐ gems (modified by shopCostModifier)
                    const baseCost = 4;
                    const actualCost = Math.max(0, baseCost + (currentPlayer.shopCostModifier || 0));
                    const totalGems = Object.values(currentPlayer.resources).reduce((sum, count) => sum + count, 0);
                    
                    if (totalGems < actualCost) {
                        alert(`Need ${actualCost} resources of ⭐ color. You have ${totalGems}.`);
                        return;
                    }
                    
                    // Deduct gems proportionally
                    const resourceCost = {};
                    let remaining = actualCost;
                    const colors = ['red', 'yellow', 'blue', 'purple', 'gold', 'white', 'black', 'silver'];
                    
                    for (const color of colors) {
                        const take = Math.min(currentPlayer.resources[color], remaining);
                        if (take > 0) {
                            resourceCost[color] = -take; // Negative to subtract
                        }
                        remaining -= take;
                        if (remaining === 0) break;
                    }
                    
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: resourceCost });
                } else {
                    const requiredAmount = shop.cost[color];
                    if (currentPlayer.resources[color] < requiredAmount) {
                        alert(`Need ${requiredAmount} ${color} gems. You have ${currentPlayer.resources[color]}.`);
                        return;
                    }
                    
                    const resourceCost = {};
                    resourceCost[color] = -requiredAmount; // Negative to subtract
                    dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer.id, resources: resourceCost });
                }
                
                // Handle special BLACK victory shop
                if (color === 'black' && shop.special === 'steal2FromEach') {
                    // Steal 2 VP from each other player
                    const otherPlayers = state.players.filter(p => p.id !== currentPlayer.id);
                    let totalVPStolen = 0;
                    let playersStolen = 0;
                    
                    otherPlayers.forEach(otherPlayer => {
                        const vpToSteal = Math.min(2, otherPlayer.victoryPoints);
                        if (vpToSteal > 0) {
                            dispatch({
                                type: 'UPDATE_VP',
                                playerId: otherPlayer.id,
                                vp: -vpToSteal,
                                source: 'blackVictoryShop'
                            });
                            totalVPStolen += vpToSteal;
                            playersStolen++;
                        }
                    });
                    
                    if (totalVPStolen > 0) {
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: totalVPStolen,
                            source: 'blackVictoryShop'
                        });
                        console.log(`Player ${currentPlayer.id}: Black Victory Shop → Stole ${totalVPStolen} VP (2 from each player)`);
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Black Victory Shop → Stole ${totalVPStolen} VP (2 from each player)` });
                        
                        // BLACK AUTOMATIC VP: Gain 1 VP per player stolen from
                        dispatch({
                            type: 'UPDATE_VP',
                            playerId: currentPlayer.id,
                            vp: playersStolen,
                            source: 'blackAutomatic'
                        });
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +${playersStolen} VP (Black automatic: stealing bonus, 1 per player)` });
                    } else {
                        console.log(`Player ${currentPlayer.id}: Black Victory Shop → No VP to steal`);
                        dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: Black Victory Shop → No VP to steal` });
                    }
                } else {
                    // Normal victory shop
                    dispatch({ type: 'UPDATE_VP', playerId: currentPlayer.id, vp: shop.vp, source: 'victoryShop' });
                    console.log(`Player ${currentPlayer.id} bought ${shop.vp} victory points from ${color} shop`);
                }
                
                // BLUE AUTOMATIC VP: Player gets 1 VP when they activate a shop effect
                if (state.automaticVPs?.blue) {
                    dispatch({
                        type: 'UPDATE_VP',
                        playerId: currentPlayer.id,
                        vp: 1,
                        source: 'blueAutomatic'
                    });
                    dispatch({ type: 'ADD_LOG', message: `Player ${currentPlayer.id}: +1 VP (activated a shop effect)` });
                }
            };
            
            const shop = shopData[color];
            // For display, we need to get the current player to show their specific cost
            const displayPlayer = state.players.find(p => p.id === state.currentPlayer);
            const baseYellowCost = 4;
            const actualCost = color === 'yellow' 
                ? Math.max(0, baseYellowCost + (displayPlayer?.shopCostModifier || 0)) 
                : (shop.cost[color] || shop.cost);
            
            return React.createElement('div', { 
                className: `bg-gradient-to-br from-green-100 to-green-200 border-2 ${isClosed ? 'border-red-400 opacity-60' : 'border-green-400'} rounded-lg p-3 shadow-md hover:shadow-lg transition-all` 
            }, [
                React.createElement('div', { key: 'title', className: 'text-center font-bold text-green-700 mb-2 text-sm' }, 
                    isClosed ? 'Victory (Closed)' : '🏆 Victory'),
                React.createElement('div', { key: 'cost', className: 'text-center text-xs mb-2 text-green-800' }, 
                    React.createElement('strong', {}, 
                        color === 'black' && shop.special === 'steal2FromEach' 
                            ? `6 Black: Steal 2 VP from Each Player`
                            : displayPlayer 
                                ? `${color === 'yellow' ? `${actualCost} ⭐` : `${actualCost} ${color.charAt(0).toUpperCase() + color.slice(1)}`}: ${shop.vp} VP`
                                : `${color === 'yellow' ? `${baseYellowCost} ⭐` : `${shop.cost[color] || shop.cost} ${color.charAt(0).toUpperCase() + color.slice(1)}`}: ${shop.vp} VP`)),
                React.createElement('div', { key: 'button', className: 'text-center' }, 
                    React.createElement('button', {
                        onClick: handlePurchase,
                        className: `${isClosed ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-1 rounded text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all`
                    }, isClosed ? 'Closed' : 'Buy'))
            ]);
        }

        // allGameLayers and selectGameLayers now imported from ./data/allGameLayers.js

        // Main Game Board Component
        function GameBoard() {
            const { state, dispatch } = useGame();
            
            // Use a ref to track sync timeout
            const syncTimeoutRef = React.useRef(null);
            
            // Use a ref to always have access to the latest state
            const stateRef = React.useRef(state);
            stateRef.current = state;
            
            // Clear justSyncedFromFirebase flag after a short delay
            useEffect(() => {
                if (state.justSyncedFromFirebase) {
                    const clearTimer = setTimeout(() => {
                        dispatch({ type: 'CLEAR_SYNC_FLAG' });
                    }, 100);
                    return () => clearTimeout(clearTimer);
                }
            }, [state.justSyncedFromFirebase]);
            
            // Sync state to Firebase whenever state changes (debounced)
            useEffect(() => {
                if (state.roomCode && state.gameStarted && !state.justSyncedFromFirebase) {
                    // Clear any pending sync
                    if (syncTimeoutRef.current) {
                        clearTimeout(syncTimeoutRef.current);
                    }
                    
                    // Debounce the sync by 200ms
                    syncTimeoutRef.current = setTimeout(() => {
                        // Use the ref to get the latest state
                        const currentState = stateRef.current;
                        const syncData = {
                            currentPlayer: currentState.currentPlayer,
                            turnDirection: currentState.turnDirection,
                            players: currentState.players,
                            occupiedSpaces: currentState.occupiedSpaces,
                            round: currentState.round,
                            turnOrder: currentState.turnOrder,
                            workerPlacedThisTurn: currentState.workerPlacedThisTurn,
                            workersToPlace: currentState.workersToPlace,
                            actionLog: currentState.actionLog,
                            gameStarted: currentState.gameStarted,
                            gameLayers: currentState.gameLayers,
                            closedShops: currentState.closedShops,
                            shopUsedAfterWorkers: currentState.shopUsedAfterWorkers,
                            playersOutOfWorkers: currentState.playersOutOfWorkers,
                            skippedTurns: currentState.skippedTurns,
                            waitingForOthers: currentState.waitingForOthers,
                            roundActions: currentState.roundActions,
                            gameOver: currentState.gameOver,
                            automaticVPs: currentState.automaticVPs,
                            pendingPlacements: currentState.pendingPlacements || {},
                            // Don't include myPlayerId in sync data - it's local to each client
                            lastUpdatedBy: currentState.myPlayerId,
                            timestamp: Date.now()
                        };
                        console.log('Syncing game state to Firebase:', {
                            myPlayerId: currentState.myPlayerId,
                            currentPlayer: syncData.currentPlayer,
                            gameLayers: syncData.gameLayers ? Object.keys(syncData.gameLayers) : null,
                            gameStarted: syncData.gameStarted
                        });
                        syncGameState(currentState.roomCode, syncData);
                    }, 200);
                }
                
                // Cleanup timeout on unmount
                return () => {
                    if (syncTimeoutRef.current) {
                        clearTimeout(syncTimeoutRef.current);
                    }
                };
            }, [state.currentPlayer, state.players, state.occupiedSpaces, state.round, state.actionLog, state.workersToPlace, state.gameLayers, state.closedShops, state.shopUsedAfterWorkers, state.playersOutOfWorkers, state.skippedTurns, state.waitingForOthers, state.roundActions, state.gameOver, state.automaticVPs, state.pendingPlacements]);
            
            const handleEndTurn = async () => {
                // Validate multiplayer turn
                if (state.roomCode && state.myPlayerId !== state.currentPlayer) {
                    alert('It\'s not your turn!');
                    return;
                }
                
                const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
                
                if (state.workersToPlace > 0) {
                    const workersRemaining = state.workersToPlace;
                    const confirmSkip = await showConfirm(dispatch, 
                        'End Turn Early?',
                        `You can still place ${workersRemaining} more worker${workersRemaining > 1 ? 's' : ''} this turn. Are you sure you want to end your turn?`
                    );
                    if (!confirmSkip) return;
                }
                
                dispatch({ type: 'END_TURN' });
            };
            
            const handleAdvanceRound = () => {
                if (state.round < 3) {
                    // Show the round transition modal
                    dispatch({ 
                        type: 'SHOW_MODAL',
                        modal: {
                            type: 'roundTransition',
                            round: state.round + 1,
                            players: state.players
                        }
                    });
                } else {
                    alert('Game is already at Round 3 (final round)');
                }
            };
            
            const handleResetGame = () => {
                dispatch({ type: 'RESET_GAME', preserveEmojis: true });
            };
            
            // If no layers selected yet, show loading or use default layers for local play
            if (!state.gameLayers) {
                console.log('No game layers found. State:', {
                    roomCode: state.roomCode,
                    gameStarted: state.gameStarted,
                    gameLayers: state.gameLayers,
                    myPlayerId: state.myPlayerId,
                    currentPlayer: state.currentPlayer
                });
                if (!state.roomCode) {
                    // Local play - use 4 layers
                    console.log('Local play - selecting 4 layers');
                    const selectedLayers = selectGameLayers(4);
                    dispatch({ type: 'SET_GAME_LAYERS', layers: selectedLayers });
                }
                return React.createElement('div', { 
                    className: 'min-h-screen flex items-center justify-center' 
                }, React.createElement('div', {
                    className: 'text-center glass rounded-xl p-8'
                }, [
                    React.createElement('h2', { key: 'title', className: 'text-2xl font-bold mb-4' }, 'Setting up game layers...'),
                    React.createElement('div', { key: 'spinner', className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto' }),
                    React.createElement('div', { key: 'debug', className: 'text-sm text-gray-600 mt-4' }, [
                        React.createElement('div', { key: 'line1' }, 
                            `Room: ${state.roomCode || 'None'}, Started: ${state.gameStarted}`),
                        React.createElement('div', { key: 'line2' }, 
                            `You are Player ${state.myPlayerId}, Current Turn: Player ${state.currentPlayer}`)
                    ])
                ]));
            }
            
            console.log('GameBoard rendering with layers:', Object.keys(state.gameLayers));

            const totalWorkers = state.players.reduce((sum, p) => sum + p.workersLeft, 0);
            const totalSpaces = Object.values(state.gameLayers).reduce((sum, layer) => 
                sum + layer.actions.filter(action => action.round <= state.round).length, 0
            );
            
            return React.createElement('div', { className: 'min-h-screen p-4 overflow-x-hidden w-full max-w-full' }, [
                // Notification Display
                React.createElement(NotificationDisplay, {
                    key: 'notifications',
                    notifications: state.notifications,
                    myPlayerId: state.myPlayerId
                }),
                
                React.createElement('div', { key: 'container', className: 'w-full px-6' }, [
                    // Single row: Round + Player Turn + Room Code + All Player Cards
                    React.createElement('div', { key: 'top-bar', className: 'flex items-stretch gap-3 mb-4' }, [
                        // Round indicator
                        React.createElement('div', {
                            key: 'round',
                            className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg shadow flex items-center gap-2'
                        }, [
                            React.createElement('span', { key: 'icon', className: 'text-lg' }, '🎲'),
                            React.createElement('span', { key: 'text', className: 'text-base font-bold' }, `Round ${state.round}`)
                        ]),
                        // Current player indicator
                        state.currentPlayer && React.createElement('div', {
                            key: 'current-turn',
                            className: 'bg-gray-700 text-white px-4 py-3 rounded-lg shadow flex items-center gap-2'
                        }, [
                            React.createElement('span', { key: 'icon', className: 'text-base' }, '👉'),
                            React.createElement('span', { key: 'text', className: 'text-base font-bold' },
                                `${state.players.find(p => p.id === state.currentPlayer)?.name}'s Turn`
                            )
                        ]),
                        // Room code badge (if in multiplayer)
                        state.roomCode && React.createElement('div', {
                            key: 'room-badge',
                            className: 'bg-gray-700 text-white px-4 py-3 rounded-lg shadow flex items-center gap-2'
                        }, [
                            React.createElement('span', { key: 'icon', className: 'text-base' }, '🏠'),
                            React.createElement('span', { key: 'text', className: 'text-base font-bold' }, `Room: ${state.roomCode}`)
                        ]),
                        // Player Cards - in the same row
                        ...state.turnOrder.map((playerId, index) => {
                            const player = state.players.find(p => p.id === playerId);
                            return React.createElement(PlayerCard, {
                                key: player.id,
                                player,
                                isCurrentPlayer: player.id === state.currentPlayer,
                                onEndTurn: handleEndTurn,
                                turnPosition: index + 1
                            });
                        })
                    ]),

                    // Main game area
                    React.createElement('div', { key: 'game-area', className: 'w-full' }, [

                    // Game Layers - 2x2 Grid Layout
                    React.createElement('div', { key: 'players-placeholder', className: 'hidden' }, 
                        state.turnOrder.map((playerId, index) => {
                            const player = state.players.find(p => p.id === playerId);
                            return React.createElement(PlayerCard, {
                                key: player.id,
                                player,
                                isCurrentPlayer: player.id === state.currentPlayer,
                                onEndTurn: handleEndTurn,
                                turnPosition: index + 1 // 1-based position
                            });
                        })
                    ),
                    
                    // Game Layers - 2x2 Grid Layout
                    React.createElement('div', { key: 'layers', className: 'grid grid-cols-2 gap-6 mb-6' }, 
                        Object.entries(state.gameLayers).map(([color, layer]) => 
                            React.createElement(GameLayer, {
                                key: color,
                                color: color,
                                title: layer.title,
                                icon: layer.icon,
                                actions: layer.actions,
                                round: state.round
                            })
                        )
                    ),
                    
                    // Control Buttons
                    React.createElement('div', { key: 'controls', className: 'text-center glass rounded-lg p-4 shadow-lg' }, [
                        React.createElement('button', {
                            key: 'advance',
                            onClick: handleAdvanceRound,
                            className: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg mr-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                        }, `Advance to Round ${Math.min(state.round + 1, 3)}`),
                        React.createElement('button', {
                            key: 'reset',
                            onClick: handleResetGame,
                            className: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200'
                        }, 'Reset Game'),
                        React.createElement('div', { key: 'instructions', className: 'text-gray-600 mt-3 text-sm' }, 
                            'Place worker → Buy from shops → End turn (button under current player)'),
                        state.actionLog.length > 0 && React.createElement('div', { key: 'action-log', className: 'mt-4 p-3 bg-gray-100 rounded-lg max-h-32 overflow-y-auto' }, [
                            React.createElement('div', { key: 'log-title', className: 'font-bold text-gray-700 mb-2 text-sm' }, 'Action Log (Last 10):'),
                            ...state.actionLog.map((log, index) => 
                                React.createElement('div', { 
                                    key: index, 
                                    className: 'text-xs text-gray-600 mb-1 font-mono' 
                                }, log)
                            )
                        ])
                    ])
                ]), // Close game-area div array
                    // Waiting indicator when waiting for another player's decision
                    state.waitingForPlayer && state.myPlayerId === state.currentPlayer && 
                        React.createElement('div', { 
                            key: 'waiting-indicator',
                            className: 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50' 
                        }, [
                            React.createElement('div', { className: 'flex items-center space-x-3' }, [
                                React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600' }),
                                React.createElement('div', { className: 'text-yellow-800 font-semibold' }, 
                                    `Waiting for Player ${state.waitingForPlayer} to make a choice...`)
                            ])
                        ]),
                    // Show when another player has a modal open in multiplayer
                    state.modal && state.roomCode && state.modal.targetPlayerId && 
                        state.modal.targetPlayerId !== state.myPlayerId &&
                        React.createElement('div', { 
                            key: 'modal-waiting-indicator',
                            className: 'fixed bottom-4 right-4 bg-blue-100 border-2 border-blue-400 rounded-lg p-3 shadow-lg z-40' 
                        }, [
                            React.createElement('div', { className: 'flex items-center space-x-2' }, [
                                React.createElement('div', { className: 'animate-pulse rounded-full h-3 w-3 bg-blue-600' }),
                                React.createElement('div', { className: 'text-blue-800 text-sm font-medium' }, 
                                    `Player ${state.modal.targetPlayerId} is making a decision...`)
                            ])
                        ]),
                    // Modal System - Show to current player OR targeted player
                    state.modal && (!state.roomCode || 
                        state.myPlayerId === state.currentPlayer || 
                        state.modal.targetPlayerId === state.myPlayerId) && React.createElement(Modal, { 
                        key: 'modal', 
                        isOpen: true, 
                        onClose: () => dispatch({ type: 'HIDE_MODAL' }) 
                    }, state.modal.type === 'choice' 
                        ? React.createElement(ChoiceModal, state.modal)
                        : state.modal.type === 'gemSelection'
                        ? React.createElement(GemSelectionModal, state.modal)
                        : state.modal.type === 'stealGems'
                        ? React.createElement(StealGemsModal, state.modal)
                        : state.modal.type === 'roundTransition'
                        ? React.createElement(RoundTransitionModal, state.modal)
                        : React.createElement(ConfirmModal, state.modal)
                    )
                ]) // Close container div array
            ]); // Close min-h-screen div array
        }

        // Win Screen Component
        function WinScreen() {
            const { state, dispatch } = useGame();
            
            // Sort players by VP (highest to lowest)
            const sortedPlayers = [...state.players].sort((a, b) => b.victoryPoints - a.victoryPoints);
            const winner = sortedPlayers[0];
            
            const handlePlayAgain = () => {
                if (state.roomCode) {
                    // For multiplayer, just reset to lobby
                    dispatch({ type: 'RESET_GAME' });
                } else {
                    // For local, reload the page
                    window.location.reload();
                }
            };
            
            return React.createElement('div', { 
                className: 'min-h-screen bg-gradient-to-br from-yellow-100 via-purple-100 to-blue-100 flex items-center justify-center p-4' 
            }, React.createElement('div', {
                className: 'glass rounded-xl p-8 max-w-2xl w-full text-center'
            }, [
                React.createElement('h1', { 
                    key: 'title',
                    className: 'text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent' 
                }, 'Game Over!'),
                
                React.createElement('div', {
                    key: 'winner',
                    className: 'text-6xl mb-4'
                }, '🎉'),
                
                React.createElement('h2', {
                    key: 'winner-name',
                    className: 'text-3xl font-bold mb-6'
                }, `${winner.name} ${winner.emoji || '👤'} Wins!`),
                
                React.createElement('div', {
                    key: 'winner-score',
                    className: 'text-2xl mb-8 text-gray-700'
                }, `Final Score: ${winner.victoryPoints} VP`),
                
                React.createElement('div', {
                    key: 'standings',
                    className: 'mb-8'
                }, [
                    React.createElement('h3', {
                        key: 'standings-title',
                        className: 'text-xl font-semibold mb-4'
                    }, 'Final Standings'),
                    
                    React.createElement('div', {
                        key: 'players-list',
                        className: 'space-y-3'
                    }, sortedPlayers.map((player, index) => 
                        React.createElement('div', {
                            key: player.id,
                            className: `glass rounded-lg p-3 flex items-center justify-between ${index === 0 ? 'ring-2 ring-yellow-400' : ''}`
                        }, [
                            React.createElement('div', {
                                key: 'left',
                                className: 'flex items-center gap-3'
                            }, [
                                React.createElement('div', {
                                    key: 'rank',
                                    className: 'text-2xl font-bold'
                                }, index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`),
                                React.createElement('div', {
                                    key: 'name',
                                    className: 'text-lg'
                                }, `${player.name} ${player.emoji || '👤'}`)
                            ]),
                            React.createElement('div', {
                                key: 'score',
                                className: 'text-xl font-semibold'
                            }, `${player.victoryPoints} VP`)
                        ])
                    ))
                ]),
                
                React.createElement('button', {
                    key: 'play-again',
                    onClick: handlePlayAgain,
                    className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transform hover:scale-105 transition-all'
                }, state.roomCode ? 'Back to Lobby' : 'Play Again')
            ]));
        }

        // Main App Component
        function App() {
            return React.createElement(GameProvider, {}, 
                React.createElement(MainApp, {})
            );
        }
        
        function MainApp() {
            const { state } = useGame();
            
            // Add error boundary
            try {
                // Show room lobby if not in a game
                if (!state.gameStarted) {
                    // If connected to a room but game hasn't started, show waiting room
                    if (state.roomCode) {
                        return React.createElement('div', { className: 'min-h-screen p-4 overflow-x-hidden w-full max-w-full' }, [
                            React.createElement(ConnectedPlayers, { key: 'players' }),
                            React.createElement('div', { 
                                key: 'waiting',
                                className: 'text-center mt-8' 
                            }, [
                                React.createElement('div', {
                                    key: 'spinner',
                                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'
                                }),
                                React.createElement('h2', {
                                    key: 'text',
                                    className: 'text-xl text-gray-600'
                                }, state.isHost ? 'Waiting for you to start the game...' : 'Waiting for host to start the game...')
                            ])
                        ]);
                    }
                    
                    // Show room lobby for initial connection
                    return React.createElement(RoomLobby, {});
                }
                
                // Show win screen if game is over
                if (state.gameOver) {
                    return React.createElement(WinScreen, {});
                }
                
                // Show game board with multiplayer info if in a room
                return React.createElement('div', { className: 'min-h-screen' }, [
                    state.roomCode && React.createElement(ConnectedPlayers, { key: 'players' }),
                    React.createElement(GameBoard, { key: 'game' })
                ]);
            } catch (error) {
                console.error('Render error:', error);
                console.error('Error stack:', error.stack);
                console.error('Game state at error:', state);
                return React.createElement('div', { 
                    className: 'min-h-screen flex items-center justify-center p-4' 
                }, React.createElement('div', {
                    className: 'glass rounded-xl p-8 text-center'
                }, [
                    React.createElement('h1', { 
                        key: 'title',
                        className: 'text-2xl font-bold text-red-600 mb-4' 
                    }, 'Game Error'),
                    React.createElement('p', { 
                        key: 'message',
                        className: 'text-gray-600 mb-4' 
                    }, 'Something went wrong. Check browser console for details.'),
                    React.createElement('div', {
                        key: 'error-details',
                        className: 'text-sm text-gray-500 mb-4 p-2 bg-gray-100 rounded'
                    }, `Error: ${error.message}`),
                    React.createElement('button', {
                        key: 'reload',
                        onClick: () => window.location.reload(),
                        className: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
                    }, 'Reload Game')
                ]));
            }
        }

        // Debug functions for testing
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true' || urlParams.get('debug') === 'true') {
            // Expose debug functions to window for test suite
            window.debugGetState = () => {
                const appElement = document.getElementById('root')._reactRootContainer;
                if (!appElement) return null;
                
                // Get the current state from React component
                let currentState = null;
                const traverse = (node) => {
                    if (!node) return;
                    if (node.memoizedState && node.memoizedState.element && 
                        node.memoizedState.element.type && 
                        node.memoizedState.element.type.name === 'App') {
                        // Found App component, get its state
                        if (node.memoizedState.memoizedState) {
                            currentState = node.memoizedState.memoizedState[0];
                        }
                    }
                    if (node.child) traverse(node.child);
                    if (node.sibling) traverse(node.sibling);
                };
                
                if (appElement._internalRoot) {
                    traverse(appElement._internalRoot.current);
                }
                
                return currentState || window.lastKnownState || null;
            };
            
            window.debugDispatch = (action) => {
                if (window.lastKnownDispatch) {
                    window.lastKnownDispatch(action);
                    return true;
                }
                return false;
            };
            
            window.debugLog = (message) => {
                console.log('[DEBUG]', message);
            };
            
            console.log('Debug mode enabled. Available functions: debugGetState(), debugDispatch(action), debugLog(message)');
        }

        // Render the app

export default App;