
/*
* //? Array syntax works for objects ??
*
* games = {roomCode1, roomCode2, roomCode3, ....}
*
* roomCode# : {
*   roomName: "" //todo implement the naming feature
*   players: {},
*   orderedPlayers: [],
*   sockets: (), // set (.add, .has, .delete)
*   tableCards: [],
*   deck: generateDeck(),
*   ////currentPlayer: 1, // can be 1 or 2
*   currentRound: 1
*   lastCapture: (socket.id)
* };
*
* players = {id1, id2}   //todo, more to add later
*
* id# = { // id = socket.id
*   id: (socket.id) //todo yes its redundant but makes it easier
*   order: // can be 1 or 2 //? Using this once on init
*   name: (playerName),
*   ////currentScore: (int) // per round
*   totalScore: (array) // per game [total score, round1, round 2, ...]
*   handDeck: (array)
*   collectedDeck: (array)
*   cardsInPlay: (array)
*   surs: (int)
*   surActivate: (bool)
*   ////isMyTurn: (bool) //! Not using this rn
* };
*/

// Maps socket.id -> {name, roomCode}
const playerMap = {};

// Store all games by room code
// Object of objects
const games = {};

// number to control roomCode generation
// does NOT reflect current number of games
let gamesNumber = 0;

// Define a function to create a new game
function createNewGame(roomCode) {
  games[roomCode] = {
    players: {},
    orderedPlayers: [],
    tableCards: [],
    deck: [],
    ////currentTurn: 0,
    currentRound: 1
  };
}


// Define helper to generate a deck
function generateDeck() {
  //const suits = ['\u2665', '\u2666', '\u2663', '\u2660'];
  //const suits = ['♥', '♦', '♣', '♠'];
  const suits = ['H', 'D', 'C', 'S'];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const deck = []; // object array

  for (let suit of suits) {
    for (let val of values) {
      deck.push({ suit, val }); //! are theme elements accessible by .card and .val??
    }
  }

  return shuffle(deck);
}


// Fisher-Yates shuffle algorithm
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // swap cards
  }
  return deck;
}


module.exports = {
  playerMap,
  games,
  gamesNumber,
  createNewGame,
  generateDeck,
};



