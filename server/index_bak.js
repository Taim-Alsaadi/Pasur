
// @ts-nocheck





// // COULD USE import <item> from "<library>"; instead


// // Bring in Express, a library that helps us easily make a web server
// const express = require('express');

// // Bring in the built-in HTTP module (Express uses it under the hood)
// const http = require('http');

// // Bring in Socket.io so we can talk to the browser in real time
// const { Server } = require('socket.io');

// // Create an Express app — this will handle incoming requests (like "get index.html")
// const app = express();

// // Create an HTTP server using our Express app
// // This is like combining a waiter (Express) and the kitchen (HTTP server)
// const server = http.createServer(app);

// // connects file paths?
// //! Need to research further
// const path = require('path');

// // Add Socket.io to the server so we can talk to players in real-time
// const io = new Server(server);

// // import logic function library
// const { games, createNewGame, generateDeck } = require('./functions-data');
// let { gamesNumber } = require('./functions-data');

// // Tell the server: "Serve the files in the client/ folder to anyone who visits"
// app.use(express.static(path.join(__dirname + '/../client')));

// // When someone connects with Socket.io (like opening the game), run this function
// //? 'connection' is a built in event for socket.io
// io.on('connection', socket => {
//   // Log a message in the terminal showing the connected user
//   console.log('user connected:', socket.id);


// // when user requests to see rooms (presses start), fetch roomcodes and send
// socket.on('get-rooms', () => {
//   const roomList = Object.keys(games);
//   socket.emit('show-rooms', roomList);
// });

// // creates a new game, then calls joinGame
// // roomID will follow natural number naming method
// socket.on('create-game', () => {
//   //! What if game create crashes? number still goes up
//   const roomCode = gamesNumber++;
//   console.log("GamesNumber: " + gamesNumber);
//   joinGame(roomCode, true);
// });

// // to join an already created game
// socket.on('join-game', roomCode => {
//   joinGame(roomCode, false);
// });


// function joinGame(roomCode, newGame) {
// // if asked for new game, create one
// if (newGame) {
//   createNewGame(roomCode);
//   console.log("********************************");
//   console.log(`Created new game for room ${roomCode}`);
//   const roomList = Object.keys(games); // to update roomList for eveyone else
//   io.emit('show-rooms-bool', roomList); // to update roomList for eveyone else
//   console.log("Updated room list for everyone");
//   console.log("********************************");
// }

// // create game variable to hold current game object
// // (see logic.js)
// const game = games[roomCode];


// // player count variable (before the current player is added)
// let playerCount = Object.keys(game.players).length;

// // if there are already 2 players in game, return room-full event
// if (playerCount >= 2) {
//   socket.emit('room-full', roomCode);
//   return;
// }

// // create mutable temp var to hold name and maintain scope
// let tempName = "";
// // ask for player name
// socket.emit('playerName-prompt');
// //recieve player name
// socket.on('playerName-input', playerNameInput => {
//   tempName = playerNameInput;

//   // save name to const variable
//   const playerName = tempName;

// // initialize current player object
// game.players[socket.id] = {};
// // assign name
// game.players[socket.id].name = playerName;
// // update playercount after join
// playerCount = Object.keys(game.players).length;
// // assign order based on player count
// game.players[socket.id].order = playerCount;


// // join player to socket.io room
// socket.join(roomCode);
// game.sockets ??= new Set();
// game.sockets.add(socket.id); // record the id
// console.log("people in socket so far:" + [...game.sockets]); // print the set so far
// console.log(playerName + " joined room " + roomCode);

// // add player to player list by refreshing full list
// const playerNames = Object.values(game.players).map(id => id.name);
// console.log(playerNames);
// io.to(roomCode).emit('player-list-refresh', playerNames);
// //io.emit('player-list-refresh', playerNames); // debugging
// console.log("Sent the command to refresh the player list by " + playerName);

// // Once there are 2 players, allow start game
// //todo now is object not array
// if (game.players.length === 2) {

// console.log("There are 2 players in lobby");
// // enable the players to start the game
// io.to(roomCode).emit('enable-start');

// ONCE start button is clicked, start game
// socket.on('start-game', () => {

//   console.log("game started by: id:" + socket.id + " name: " + game.players.id);

// send order to get everyone on game screen
// io.to(roomCode).emit('activate-game-screen');

// // reshuffle deck first
// game.deck = generateDeck();

// // deal card data to players
// const hand1 = game.deck.splice(0, 4);
// const hand2 = game.deck.splice(0, 4);
// game.players[0].hand = hand1;
// game.players[1].hand = hand2;

// // update the game for each player
// // (Emit update game state event to each player with state data)
// io.to(game.players[0].id).emit('game-update', (hand1, game.tableCards));
// io.to(game.players[1].id).emit('game-update', (hand2, game.tableCards));

// // when a client plays a card
// socket.on('play-card', (roomCode, playedCard, cardPlayer) => {

//   // retrieve the current game object
//   const game = games[roomCode];

//   // Remove card from players hand
//   cardPlayer.hand = cardPlayer.hand.filter(c => c.suit !== playedCard.suit || c.val !== playedCard.val);

//   // Add the card to the table
//   game.tableCards.push(playedCard);

//   //! Handle picking up cards here

//   // update the game for each player after card plays
//   game.players.forEach(player => {
//     io.to(player.id).emit('game-update', (player, game.tableCards));
//   });
// });
//         });

//       } else { // if opponent hasnt connected yet
//   //! Display waiting for oppoenent message

//   socket.emit('WaitingForPlayers')

// }
//     });
//   };

// });

// // // Pick a port: use an environment variable if available (like on Heroku), or 3000 for local testing
// // const PORT = process.env.PORT || 3000;

// // // Start the server and print a message when it’s ready
// // server.listen(PORT, () =>
// //   console.log(`Server listening on http://localhost:${PORT}`)
// // );

