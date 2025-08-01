// COULD USE import <item> from "<library>"; instead


// Bring in Express, a library that helps us easily make a web server
const express = require('express');

// Bring in the built-in HTTP module (Express uses it under the hood)
const http = require('http');

// Bring in Socket.io so we can talk to the browser in real time
const { Server } = require('socket.io');

// Create an Express app — this will handle incoming requests (like "get index.html")
const app = express();

// Create an HTTP server using our Express app
// This is like combining a waiter (Express) and the kitchen (HTTP server)
const server = http.createServer(app);

// connects file paths?
//! Need to research further
const path = require('path');

// Add Socket.io to the server so we can talk to players in real-time
const io = new Server(server);

// import logic function library
const { playerMap, games, createNewGame, generateDeck } = require('./functions-data');
let { gamesNumber } = require('./functions-data');

// Tell the server: "Serve the files in the client/ folder to anyone who visits"
app.use(express.static(path.join(__dirname + '/../client')));


/**
 * 
 */
// When someone connects with Socket.io (like opening the game), run this function
//? 'connection' is a built in event for socket.io
io.on('connection', socket => {
  // Log a message in the terminal showing the connected user
  console.log('user connected:', socket.id);


  /**
   * 
   */
  // when user requests to see rooms (presses start), fetch roomcodes and send
  socket.on('get-rooms', () => {
    const roomList = Object.keys(games);
    socket.emit('show-rooms', roomList);
  });


  /**
   * 
   */
  // creates a new game, then emits event for user to autojoin the game
  // roomID will follow natural number naming method
  socket.on('create-game', () => {
    const roomCode = String(gamesNumber++);
    createNewGame(roomCode);
    console.log(`Created new game for room ${roomCode}`);
    const roomList = Object.keys(games); // to update roomList for eveyone else
    io.emit('show-rooms-bool', roomList); // to update roomList for eveyone else
    ////console.log("Updated room list for everyone");
    socket.emit('game-created', roomCode); // make creator auto-join
  });


  /**
   * 
   */
  // Join a room
  socket.on('join-game', roomCode => {
    ////console.log("order to join game recieved from: " + socket.id);
    // check for game existance
    const game = games[roomCode];
    //console.log("Game variable join game: ", game);
    if (!game) {
      socket.emit('invalid-room', roomCode);
      console.log("Join-game error: game room" + roomCode + "doesnt exist");
      return;
    }

    const playerCount = Object.keys(game.players).length;

    // check for room player space
    if (playerCount >= 2) return socket.emit('room-full', roomCode);

    // join the player's socket to the room
    socket.join(roomCode);
    ////console.log("user " + socket.id + " socket attached to room " + roomCode);
    // store roomCode for player in map while in room
    playerMap[socket.id] = { roomCode: roomCode };
    ////console.log("user " + socket.id + " logged in playerMap: " + playerMap[socket.id].roomCode);

    // ask for name
    ////console.log("Going to ask player to input a name now");
    socket.emit('playerName-prompt');
    ////console.log("Player asked for a name");
  });


  /**
   * 
   */
  // Receive player's name and finalize join
  socket.on('playerName-input', playerName => {
    ////console.log("Name input recieved: " + playerName);
    // check if the player is in a room or not
    // while simultanuously fetching roomcode from map
    const roomCode = playerMap[socket.id]?.roomCode;
    ////console.log("user to map: " + socket.id);
    ////console.log("room code: " + roomCode);
    //todo condiser handling this gracefully
    //todo === undefined might be too specific
    //! Do not make it !roomCode as they start from room 0, wich will cuase eternal shutdown
    if (roomCode === undefined) return console.log("error in roomCode logged on map: DNE");

    // make sure game is created at said roomcode
    // fetch said game and store its reference
    const game = games[roomCode];
    if (!game) return console.log("error in game instance: DNE");

    // Register player in game object
    game.players[socket.id] = {
      id: socket.id,
      name: playerName,
      order: Object.keys(game.players).length + 1,
      totalScore: [0],
      handDeck: [],
      collectedDeck: [],
      cardsInPlay: [],
      surs: 0,
      surActivate: true
    };
    console.log(playerName + " has been initialized in room " + roomCode);

    game.sockets ??= new Set(); // start a new socket record set if new game
    game.sockets.add(socket.id); // record the player's id in the set

    //todo when you add a central naming system implement this line in the 
    //todo      main menu to keep a better map
    playerMap[socket.id].name = playerName; // add the players name to the map

    console.log(`${playerName} joined room ${roomCode}`);

    //console.log("Game variable playername input: ", game);

    // add player to player list by refreshing full list in lobby
    const playerNames = Object.values(game.players).map(id => id.name);
    whoIsConnectedTo(roomCode); // check who is connected
    console.log("Refreshing player list: " + playerNames);
    io.to(roomCode).emit('player-list-refresh', playerNames);

    // Enable start if 2 players
    if (Object.keys(game.players).length === 2) {
      io.to(roomCode).emit('enable-start');
      console.log("There are 2 players in lobby");
    } else {
      //todo implement on clinet side
      socket.emit('WaitingForPlayers');
    }
  });




  /**
   * 
   */
  // Start game
  socket.on('start-game', () => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly

    console.log("Game started in room " + roomCode + " by: id: " + socket.id
      + " name: " + game.players[socket.id].name);

    whoIsConnectedTo(roomCode);

    // Game setup:

    game.deck = generateDeck(); // generate new shuffled deck
    game.tableCards = []; // initialize table cards

    // store players as an array sorted by their order element
    //todo research sort() more its very interesting
    game.orderedPlayers = Object.values(game.players).sort((id1, id2) => id1.order - id2.order);
    const players = game.orderedPlayers;

    // initialize round counter
    game.currentRound = 1;

    // go to game screen from lobby
    //todo Limits only to 2 players
    io.to(players[0].id).emit('activate-game-screen', players[0].name, players[1].name);
    io.to(players[1].id).emit('activate-game-screen', players[1].name, players[0].name);

    dealCardsStart(game);

    // send game update
    io.to(players[0].id).emit('game-update', players[0].surs, players[0].handDeck, null, game.tableCards, null, players[1].handDeck.length, players[1].surs, true);
    io.to(players[1].id).emit('game-update', players[1].surs, players[1].handDeck, null, game.tableCards, null, players[0].handDeck.length, players[0].surs, false);
  });


  // Handle card play
  socket.on('play-card', (playedCard) => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly
    const player1 = game.orderedPlayers[0];
    const player2 = game.orderedPlayers[1];
    const cardPlayer = player1.id === socket.id ? player1 : player2;
    const opponent = cardPlayer.id === player1.id ? player2 : player1;

    // console.log("card player: " + cardPlayer.name);
    // console.log("opponent: " + opponent.name);

    // add card to play area
    cardPlayer.cardsInPlay.push(playedCard);
    // remove card from hand
    cardPlayer.handDeck.forEach((card, i) => {
      if (card.val === playedCard.val && card.suit === playedCard.suit) {
        cardPlayer.handDeck.splice(i, 1);
      }
    });

    // update game
    //! ////////////////////////////////////////////////////////////////////////
    updateGame(game, cardPlayer, opponent, true);
    //! ////////////////////////////////////////////////////////////////////////
    // console.log("updated game from played card state");

    //! ////////////////////////////////////////////////////////////////////////
    checkValidity(game, cardPlayer);
    //! ////////////////////////////////////////////////////////////////////////
  });



  socket.on('add-to-play', (addedCard) => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly
    const player1 = game.orderedPlayers[0];
    const player2 = game.orderedPlayers[1];
    const cardPlayer = player1.id === socket.id ? player1 : player2;
    const opponent = cardPlayer.id === player1.id ? player2 : player1;

    // console.log("card player: " + cardPlayer.name);
    // console.log("opponent: " + opponent.name);

    // put card into play area
    cardPlayer.cardsInPlay.push(addedCard);

    // remove from table
    game.tableCards.forEach((card, i) => {
      if (card.val === addedCard.val && card.suit === addedCard.suit) {
        game.tableCards.splice(i, 1);
      }
    });

    // send game update
    // v same as socket.emit (for clarity)
    //! ////////////////////////////////////////////////////////////////////////
    updateGame(game, cardPlayer, opponent, true);
    //! ////////////////////////////////////////////////////////////////////////
    // console.log("updated game from added to play");

    /*
    // check if the player cards are claimable
    let sum = 0;
    cardPlayer.cardsInPlay.forEach((card) => {
      sum += card.val
    });
    */

    // console.log(cardPlayer.cardsInPlay.length);
    //! ////////////////////////////////////////////////////////////////////////
    checkValidity(game, cardPlayer);
    //! ////////////////////////////////////////////////////////////////////////
  });


  // if the first card is clicked back into the deck:
  // ONLY ALLOWED IF THE FIRST CARD IS THE ONLY CARD IN PLAY
  socket.on('back-to-deck', (firstCard) => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly
    const player1 = game.orderedPlayers[0];
    const player2 = game.orderedPlayers[1];
    const cardPlayer = player1.id === socket.id ? player1 : player2;
    const opponent = cardPlayer.id === player1.id ? player2 : player1;

    // console.log("card player: " + cardPlayer.name);
    // console.log("opponent: " + opponent.name);

    // allow only if first card is the only card in play:
    if (cardPlayer.cardsInPlay.length === 1) {
      cardPlayer.handDeck.push(firstCard); // add to hand
      cardPlayer.cardsInPlay.splice(0, 1); // remove from play area
    }

    // send game update
    // v same as socket.emit (for clarity)
    //! ////////////////////////////////////////////////////////////////////////
    updateGame(game, cardPlayer, opponent, true);
    //! ////////////////////////////////////////////////////////////////////////
    // console.log("updated game from added to play");

  });



  // to remove a card from play area back to table
  socket.on('remove-from-play', (removedCard) => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly
    const player1 = game.orderedPlayers[0];
    const player2 = game.orderedPlayers[1];
    const cardPlayer = player1.id === socket.id ? player1 : player2;
    const opponent = cardPlayer.id === player1.id ? player2 : player1;

    // console.log("card player: " + cardPlayer.name);
    // console.log("opponent: " + opponent.name);


    //todo maybe put this in the following if statement to ensure higher security?
    // put card into table
    game.tableCards.push(removedCard);

    // remove from play area
    cardPlayer.cardsInPlay.forEach((card, i) => {
      if (card.val === removedCard.val && card.suit === removedCard.suit) {
        cardPlayer.cardsInPlay.splice(i, 1);
      }
    });

    // update game
    //! ////////////////////////////////////////////////////////////////////////
    updateGame(game, cardPlayer, opponent, true);
    //! ////////////////////////////////////////////////////////////////////////
    // console.log("updated game from remove from play");

    /*
    // check if the player cards are claimable 
    let sum = 0;
    cardPlayer.cardsInPlay.forEach((card) => {
      sum += card.val
    });
  */

    //! ////////////////////////////////////////////////////////////////////////
    checkValidity(game, cardPlayer);
    //! ////////////////////////////////////////////////////////////////////////
  });

  function checkValidity(game, cardPlayer) {

    // gather sum of card to check if = 11 later 
    let sum = 0;
    cardPlayer.cardsInPlay.forEach((card) => {
      sum += card.val
    });

    // check if the table only consists of Q and K (to enable Jack to be pushed to table)
    let tableAllBigger11 = true;
    for (const card of game.tableCards) {
      if (card.val < 11) {
        tableAllBigger11 = false;
        break;
      }
    }


    firstCard = cardPlayer.cardsInPlay[0];

    console.log("********************");
    console.log(game.tableCards.length);
    console.log(tableAllBigger11);
    console.log(firstCard.val);
    console.log("********************");

    if (cardPlayer.cardsInPlay.length === 1 && firstCard.val != 11) { // to allow for adding 1 card to table
      socket.emit('show-to-table-btn');
    } else if (cardPlayer.cardsInPlay.length === 1 && firstCard.val === 11 &&
      (tableAllBigger11 || game.tableCards.length === 0)) { // allow to push Jack to table
      socket.emit('show-to-table-btn');
    } else if (sum === 11 && firstCard.val <= 10) { // check if they add up to 11
      socket.emit('show-collect-btn');
    } else if (firstCard.val >= 11) { // check if first card is J Q K
      if (firstCard.val === 11) { // if its J
        // make player add all non Q K card into play area before can click done
        // check for existence of any number/J cards in table
        let invalid = false;
        game.tableCards.forEach(card => {
          if (card.val <= 11) {
            invalid = true;
          }
        });
        // check if there are any Q K cards in play area
        cardPlayer.cardsInPlay.forEach(card => {
          if (card.val > 11) {
            invalid = true;
          }
        });

        if (!invalid) {
          socket.emit('show-collect-btn');
        }

      } else if (firstCard.val === 12) { // if its Q
        // check that there is only 1 other card in the play area and that its also a Q
        if (cardPlayer.cardsInPlay.length === 2 && cardPlayer.cardsInPlay[1].val === 12) {
          socket.emit('show-collect-btn');
        }

      } else if (firstCard.val === 13) { // if its K
        // check that there is only 1 other card in the play area and that its also a K
        if (cardPlayer.cardsInPlay.length === 2 && cardPlayer.cardsInPlay[1].val === 13) {
          socket.emit('show-collect-btn');
        }
      }
    }
  }


  // either claims card or sends card into table
  socket.on('finalize-turn', () => {
    // store roomCode from map, and game from roomCode
    const roomCode = playerMap[socket.id]?.roomCode;
    // console.log("Room fetched from socket " + socket.id + ": " + roomCode);
    const game = games[roomCode];
    if (!game) return; // todo handle gracefuly
    const player1 = game.orderedPlayers[0];
    const player2 = game.orderedPlayers[1];
    const cardPlayer = player1.id === socket.id ? player1 : player2;
    const opponent = cardPlayer.id === player1.id ? player2 : player1;

    // console.log("card player: " + cardPlayer.name);
    // console.log("opponent: " + opponent.name);

    // if theres 1 card in play:
    if (cardPlayer.cardsInPlay.length === 1) {
      // push it to table:
      game.tableCards.push(cardPlayer.cardsInPlay[0]);
      // remove it from play
      cardPlayer.cardsInPlay.splice(0, 1);

    } else { // if theres multiple cards in play

      // if the table was cleared and NOT by a Jack, then 
      if (cardPlayer.cardsInPlay[0].val != 11 && game.tableCards.length === 0) {
        if (opponent.surs > 0) { // check if opp has positive surs, subtract 1 from theirs
          opponent.surs--;
        } else if (cardPlayer.surActivate) { // if opp has 0 surs, get 1 sur
          cardPlayer.surs++;
        }
      }
      // add all card from play to collected deck
      cardPlayer.collectedDeck.push(...cardPlayer.cardsInPlay);
      // clear play area
      cardPlayer.cardsInPlay.length = 0;
      // assign this player as the player who captured last
      game.lastCapture = cardPlayer;
    }

    // if both players have emptied their deck, deal 4 cards to each
    if (cardPlayer.handDeck.length === 0 && opponent.handDeck.length === 0) {

      // as long as the main deck isnt empty
      if (game.deck.length != 0) {
        // deal 2 decks of 4 cards into an array
        const hands = [game.deck.splice(0, 4), game.deck.splice(0, 4)];

        // give hands to players
        cardPlayer.handDeck = hands[0];
        opponent.handDeck = hands[1];

        // update game
        //! ////////////////////////////////////////////////////////////////////
        updateGame(game, cardPlayer, opponent, false);
        //! ////////////////////////////////////////////////////////////////////
      } else { // if theres no more cards in the main deck
        // This is where the new round should be initiated, scores calculated

        // give the player who captured the last card everything else on the table
        game.lastCapture.collectedDeck.push(...game.tableCards);

        // calculate player 1 score

        let clubCounter = 0;
        let sum = 0;
        // O(n)
        cardPlayer.collectedDeck.forEach(card => {

          // count all clubs (7=7 point)
          if (card.suit === 'C') {
            clubCounter++;
          }

          // count all Aces (1 point each)
          if (card.val === 1) {
            sum++;

            // Count all Js (1 point each)
          } else if (card.val === 11) {
            sum++;

            // Check for 2 of clubs (2 points)
          } else if (card.val === 2 && card.suit === 'C') {
            sum += 2;

            // Check for 10 of diamonds (3 points)
          } else if (card.val === 10 && card.suit === 'D') {
            sum += 3;
          }
        });

        if (clubCounter >= 7) { //  add clubs to sum
          sum += 7;
        }



        // Add all surs 
        let cardPlayerScore = sum + cardPlayer.surs * 5;

        // console.log("Sum %d:", sum);
        // console.log("Sum %d:", sum);


        // calculate player 2 score (should be = 20 - player1 score (without surs))
        // let actual logic be ^ subtraction but copy code from P1 to make sure its true
        let opponentScore = (20 - sum) + opponent.surs * 5;

        // once scores are calculated:
        // player.totalScore = [total score, round1, round 2, ...]
        cardPlayer.totalScore[0] += cardPlayerScore;
        cardPlayer.totalScore[game.currentRound] = cardPlayerScore;
        opponent.totalScore[0] += opponentScore;
        opponent.totalScore[game.currentRound] = opponentScore;

        let CPTotScore = cardPlayer.totalScore[0];
        let oppTotScore = opponent.totalScore[0];
        console.log("Total CP Score: %d", CPTotScore);
        console.log("Total opp Score: %d", oppTotScore);

        // check for score higher than or eq 50 for a player, disable Sur
        // player.surActivate
        if (CPTotScore >= 50) {
          cardPlayer.surActivate = false;
        }
        if (oppTotScore >= 50) {
          opponent.surActivate = false;
        }

        // check for score higher than or eq to 62 for a player, they win.
        //! //////////////////////////////////////////////////////
        // todo update to include more statistics
        if (CPTotScore >= 62 && oppTotScore >= 62) {
          if (CPTotScore > oppTotScore) {
            io.to(roomCode).emit('show-end-screen', cardPlayer.name);
          } else {
            io.to(roomCode).emit('show-end-screen', opponent.name);
          }
        } else if (CPTotScore >= 62) {
          io.to(roomCode).emit('show-end-screen', cardPlayer.name);
        } else if (oppTotScore >= 62) {
          io.to(roomCode).emit('show-end-screen', opponent.name);
        }

        //* start a new round

        // change order attribut in each player struct (switch orders within players)
        let playerOneId = game.orderedPlayers[0].id; // id of player order 1
        game.players[playerOneId].order = 2;

        let playerTwoId = game.orderedPlayers[1].id;
        game.players[playerTwoId].order = 1;

        // flip player orders within the ordered players array in the game struct
        [game.orderedPlayers[0], game.orderedPlayers[1]] = [game.orderedPlayers[1], game.orderedPlayers[0]];

        let player1 = game.orderedPlayers[0];
        let player2 = game.orderedPlayers[1];

        // reset table cards
        game.tableCards.length = 0;

        // make new game deck
        game.deck = generateDeck();

        // increase round counter
        game.currentRound++;

        // reset lastCapture
        game.lastCapture = {};

        // reset players' collected deck, cards in play, hand deck ((safety measure))
        player1.collectedDeck.length = 0;
        player1.handDeck.length = 0;
        player1.cardsInPlay.length = 0;
        player2.collectedDeck.length = 0;
        player2.handDeck.length = 0;
        player2.cardsInPlay.length = 0;

        // DONT reactivate sur gainig ability

        // reset sur count
        player1.surs = 0;
        player2.surs = 0;


        dealCardsStart(game);

        // update game
        // since we are here, the card player who played the last card was the 2nd player in order
        // that 2nd player is now the first player in roder
        //! ////////////////////////////////////////////////////////////////////////
        updateGame(game, player1, player2, true);
        //! ////////////////////////////////////////////////////////////////////////

      }

    } else {
      // update game
      //! /////////////////////////////////////////////////////////////
      updateGame(game, cardPlayer, opponent, false);
      //! /////////////////////////////////////////////////////////////
      // console.log("updated game from finalize turn");
    }
  });

  function dealCardsStart(game) {
    // deal cards to table
    const table = game.deck.splice(0, 4);

    // make sure no Jacks appear on first table hand
    for (let i = 0; i < table.length; ++i) {
      while (table[i].val === 11) {
        const j = Math.floor(Math.random() * (game.deck.length + 1));
        game.deck.splice(j, 0, table[i]); // push the J into a random spot in the deck
        table[i] = game.deck.splice(0, 1)[0];
      }
    }

    // finalize table deal
    game.tableCards = table;

    // deal 2 decks of 4 cards into an array
    const hands = [game.deck.splice(0, 4), game.deck.splice(0, 4)];

    // give hands to players
    game.orderedPlayers[0].handDeck = hands[0];
    game.orderedPlayers[1].handDeck = hands[1];
  }



  // when user leaves after game is over
  //! Untested
  socket.on('leave-game', () => {
    const playerInfo = playerMap[socket.id];
    if (!playerInfo) return;

    const roomCode = playerInfo.roomCode;
    const game = games[roomCode];
    if (game?.players[socket.id]) {

      delete game.players[socket.id];
      game.sockets?.delete(socket.id);

      if (Object.keys(game.players).length === 0) { // if there are no more players, delete the roomCode game
        delete games[roomCode];
        const roomList = Object.keys(games); // to update roomList for eveyone else
        io.emit('show-rooms-bool', roomList); // to update roomList for eveyone else
      }
    }
  });

  // updates game for carPlayer-opponent dependant functions
  function updateGame(game, player1, player2, keepTurn) {
    io.to(player1.id).emit('game-update', player1.surs, player1.handDeck, player1.cardsInPlay, game.tableCards, player2.cardsInPlay, player2.handDeck.length, player2.surs, keepTurn);
    io.to(player2.id).emit('game-update', player2.surs, player2.handDeck, player2.cardsInPlay, game.tableCards, player1.cardsInPlay, player1.handDeck.length, player1.surs, !keepTurn);
  }


  // Optional: handle disconnect
  socket.on('disconnect', () => {
    const playerInfo = playerMap[socket.id];
    if (!playerInfo) return;

    const roomCode = playerInfo.roomCode;
    const game = games[roomCode];
    if (game?.players[socket.id]) {
      delete game.players[socket.id];
      game.sockets?.delete(socket.id);
    }

    delete playerMap[socket.id];
    console.log(`${socket.id} disconnected from room ${roomCode}`);
  });
});


// Pick a port: use an environment variable if available (like on Heroku), or 3000 for local testing
const PORT = process.env.PORT || 3000;

// Start the server and print a message when it’s ready
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


// Debugging function used to validate user connection to a room
async function whoIsConnectedTo(roomCode) {
  console.log("Printing all connected sockets to room " + roomCode + ":");
  // const sockets = await io.of('/').adapter.sockets(new Set([roomCode]));
  const socketsInRoom = await io.in(roomCode).allSockets();
  console.log([...socketsInRoom]); // Set of socket IDs in the room
}


// console debugging:
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  if (input === 'games') {
    console.dir(games, { depth: 0 });

  } else if (input.startsWith('game ')) {
    const roomCode = input.split(' ')[1];
    console.dir(games[roomCode], { depth: 1 });

  } else if (input.startsWith('table ')) {
    const roomCode = input.split(' ')[1];
    if (games[roomCode]) {
      console.dir(games[roomCode].tableCards, { depth: null });
    } else {
      console.log("Game " + roomCode + " doesn't exist");
    }

  } else if (input.startsWith('players ')) {
    const roomCode = input.split(' ')[1];
    if (games[roomCode]) {
      console.dir(games[roomCode].players, { depth: null });
    } else {
      console.log("Game " + roomCode + " doesn't exist");
    }

  } else if (input.startsWith('where is ')) { // find player room location through socket.id
    const socketId = input.split(' ')[2];
    console.log(io.sockets.sockets.get(socketId).rooms);

  } else if (input.startsWith('who is connected ')) {
    const roomCode = input.split(' ')[3];
    whoIsConnectedTo(roomCode);

  } else {
    console.log('Unknown command');
  }
});



