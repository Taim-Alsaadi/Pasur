
socket.emit(event, data) 
    Sends only to the current socket (the sender).
    You want to reply privately to the player who sent the event.

io.to(room).emit(event, data)
    Sends to all sockets in a specific room.
    You want to broadcast to everyone in the room, including the sender.
    Used to target specific players
        io.to(id).emit(event, data)

socket.to(room).emit(event, data)
    Sends to everyone in the room except the sender.
    You want to exclude the sender from an update (rare in games like Pasur).

io.emit(event, data)
    Sends to every connected client across the whole server.
    usually not used



npm start → runs your server once.

npm run dev → runs it under nodemon (auto-restarts).

truth lies on the server, 
  - Shuffle and deal cards
  - Handle player moves (like “play a card”)
  - Validate moves and update game state accordingly
  - Detect scoring events like “Pasur” (capturing all  cards)
  - Track whose turn it i


Each card can be a simple object like this:
const card = {
  suit: 'H',      // Hearts (H), Spades (S), Diamonds (D), Clubs (C)
  rank: '5',      // 2-10, J, Q, K, A
  value: 5        // numeric value for game rules if needed
};

let deck = [];       // all 52 cards
let playerHand = []; // cards dealt to one player
let tableCards = []; // cards currently on the table

Example to create deck and shuffle:
function createDeck() {
  const suits = ['H', 'S', 'D', 'C'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

// Fisher-Yates shuffle algorithm
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // swap cards
  }
  return deck;
}

let deck = createDeck();
deck = shuffle(deck);
console.log(deck);











