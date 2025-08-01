



const socket = io();  // opens a WebSocket to your server


// When start button is clicked
document.getElementById('startBtn').addEventListener('click', () => {
  showRoomList();
});

// shows html page for the roomList (empty so far)
function showRoomList() {
  // Hide main menu
  document.getElementById('mainMenu').style.display = 'none';
  // Show room list (display preset to 'none')
  document.getElementById('roomList').style.display = 'flex';
  // request roomList
  socket.emit('get-rooms');
}

//todo could i just merge these two? **************************
// Handle incoming room list
socket.on('show-rooms', (rooms) => {
  showRooms(rooms);
});

// update room list when game created for those on the roomlist screen
socket.on('show-rooms-bool', roomList => {
  if (document.getElementById('roomList').display != 'none') {
    showRooms(roomList);
  }
});
//todo ********************************************************

// Function to clean, then add all the rooms to the roomList page
function showRooms(rooms) {
  const roomsDiv = document.getElementById('rooms');
  roomsDiv.innerHTML = ""; // reset the roomList to avoid duplication
  // Add each room to the list with its own join button
  rooms.forEach(room => { // loop
    const div = document.createElement('div'); // creates div element
    div.classList.add('room'); // apply .room css
    //! ChatGPT: "Security Note: Using innerHTML + onclick like this is okay in dev, but not best practice in production — a better approach is adding event listeners using JS instead of inline onclick."
    div.innerHTML = `${room} <button onclick="joinRoom('${room}')">Join</button>`;
    roomsDiv.appendChild(div);
  });
}

// When New Game button is clicked
document.getElementById('newGameBtn').addEventListener('click', () => {
  // Hide room list 
  document.getElementById('roomList').style.display = 'none';
  // Show lobby screen (display preset to 'none')
  document.getElementById('lobby').style.display = 'flex';
  // send order to create new game
  socket.emit('create-game');
});

// auto joins the creator of the room to the room
socket.on('game-created', roomCode => {
  joinRoom(roomCode);
  console.log("Order to send join-event put in");
});

function joinRoom(roomCode) {
  // Hide room list 
  document.getElementById('roomList').style.display = 'none';
  // Show lobby screen (display preset to 'none')
  document.getElementById('lobby').style.display = 'flex';
  //!
  socket.emit('check-room');
  //!
  // ask server to join room
  socket.emit('join-game', roomCode);
  console.log("Asking to join game officially sent");
}


// When main menu button is clicked
document.getElementById('mainMenuBtnRmLst').addEventListener('click', () => {
  // Hide room list
  document.getElementById('roomList').style.display = 'none';
  // Show main menu
  document.getElementById('mainMenu').style.display = 'flex';
});


socket.on('room-full', roomCode => {
  // Hide lobby screen (display preset to 'none')
  document.getElementById('lobby').style.display = 'none';
  // Re-show room list 
  document.getElementById('roomList').style.display = 'flex';
  // inform user
  alert("Room " + roomCode + " is full");
});

socket.on('invalid-room', roomCode => {
  // Hide lobby screen (display preset to 'none')
  document.getElementById('lobby').style.display = 'none';
  // Re-show room list 
  document.getElementById('roomList').style.display = 'flex';
  // inform user
  alert("Room " + roomCode + " is invalid");
});

// prompt player for name when entering lobby, send name to server
socket.on('playerName-prompt', () => {
  console.log("name prompt launched");
  let name = "";
  do {
    name = prompt("Enter your name:");
  } while (!name);
  console.log("name input complete: " + name);
  socket.emit('playerName-input', name);
  console.log("name input sent: " + name);
});


// update players list when someone joins
socket.on('player-list-refresh', playerNames => {
  console.log("player-list-refresh event recieved");
  const playersList = document.getElementById('playersList');
  console.log(playerNames);
  playersList.innerHTML = playerNames.join(', ');
  //***.innerHTML = `<strong>Table Cards:</strong> ${table.join(', ')}<br>`;
});

// makes the start button appear to actually play the game from lobby
socket.on('enable-start', () => {
  document.getElementById('startGameBtn').style.display = "flex";
});

// When start game button is clicked
document.getElementById('startGameBtn').addEventListener('click', () => {
  // send order to server to start the game
  socket.emit('start-game');
});

// show game screen when game started
socket.on('activate-game-screen', (myName, oppName) => {
  // Hide lobby 
  document.getElementById('lobby').style.display = 'none';
  // Show game screen
  document.getElementById('game').style.display = 'flex';
  // Add mine and opponents name
  document.getElementById('oppName').innerHTML = `<h3>${oppName}</h3>`;
  document.getElementById('myName').innerHTML = `<h3>${myName}</h3>`;
});


// when player recieves game update command with supporting data
socket.on('game-update', (mySursServ, myCardsServ, myPlayServ, tableCardsServ, oppPlayServ, oppCardsCount, oppSursServ, isMyTurn) => {

  // disable push/claim buttons and re-check if selection is valid after
  //todo maybe put these in their respective event listeners at the bottom?
  document.getElementById('toTableBtn').disabled = true;
  document.getElementById('collectBtn').disabled = true;

  // debug log
  console.log("Recieved gam-update:");
  console.dir("My cards: " + myCardsServ, { depth: null });
  console.dir("My play: " + myPlayServ, { depth: null });
  console.dir("Table cards: " + tableCardsServ, { depth: null });
  console.dir("Opp play: " + oppPlayServ, { depth: null });
  console.dir("Opp cards: " + oppCardsCount, { depth: null });

  // fetch display fields
  const oppSurs = document.getElementById('oppSurs');
  const oppCards = document.getElementById('oppCards');
  const oppPlay = document.getElementById('oppPlay');
  const tableCards = document.getElementById('tableCards');
  const myPlay = document.getElementById('myPlay');
  const myCards = document.getElementById('myCards');
  const mySurs = document.getElementById('mySurs')

  // show opponent sur count
  oppSurs.innerHTML = "Surs: " + oppSursServ;

  // show opponent hidden cards based on number
  oppCards.innerHTML = "";
  if (oppCardsCount && oppCardsCount > 0) {
    for (let i = 0; i < oppCardsCount; ++i) {
      // fetch cardback picture
      const cardBack = document.createElement('img');
      cardBack.src = 'cards_png/cardback.jpg';
      cardBack.alt = "cardback";
      cardBack.style.width = '60px';
      cardBack.style.height = 'auto';
      oppCards.appendChild(cardBack);
    }
  } else {
    // keep consistent space to avoid game screen shifting around too much during plays
    const spacer = document.createElement('div');
    spacer.style.height = '60px';
    oppCards.appendChild(spacer);
  }


  // if theres cards in play by opponent, handle showing them here
  oppPlay.innerHTML = "";
  if (oppPlayServ && oppPlayServ.length > 0) {
    if (oppPlayServ) {
      oppPlayServ = oppPlayServ.map(cardToString);
      oppPlayServ.forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = `cards_png/${card}.png`;
        cardImg.alt = cardToString(card);
        cardImg.style.width = '60px';
        cardImg.style.height = 'auto';
        oppPlay.appendChild(cardImg);
      });
    }
  } else {
    // keep consistent space to avoid game screen shifting around too much during plays
    const spacer = document.createElement('div');
    spacer.style.height = '60px';
    oppPlay.appendChild(spacer);
  }

  // fetch and format table cards
  tableCards.innerHTML = "";
  if (tableCardsServ && tableCardsServ.length > 0) {
    tableCardsServObj = tableCardsServ;
    tableCardsServ = tableCardsServ.map(cardToString);
    // add table cards
    tableCardsServ.forEach((card, i) => {
      const cardImg = document.createElement('img');
      cardImg.src = `cards_png/${card}.png`;
      cardImg.alt = cardToString(card);
      cardImg.style.width = '60px';
      cardImg.style.height = 'auto';

      // Put image inside the button
      const button = document.createElement('button');
      button.appendChild(cardImg);

      // add event listener to each button
      button.addEventListener('click', () => {
        console.dir("card to add to play:", tableCardsServObj[i], { depth: null });
        socket.emit('add-to-play', tableCardsServObj[i])
      });

      // enable table cards once its my turn and a card is put into the play area
      if (isMyTurn && myPlayServ && myPlayServ.length > 0) {
        button.disabled = false;
      } else {
        button.disabled = true;
      }

      // Put button inside the div
      const div = document.createElement('div');
      div.classList.add('button');
      div.appendChild(button);

      tableCards.appendChild(div);
    });
  } else {
    // keep consistent space to avoid game screen shifting around too much during plays
    const spacer = document.createElement('div');
    spacer.style.height = '60px';
    tableCards.appendChild(spacer);
  }


  // cards in play
  myPlay.innerHTML = "";
  if (myPlayServ && myPlayServ.length > 0) {
    myPlayServObj = myPlayServ;
    myPlayServ = myPlayServ.map(cardToString);
    myPlayServ.forEach((card, i) => {
      const cardImg = document.createElement('img');
      cardImg.src = `cards_png/${card}.png`;
      cardImg.alt = cardToString(card);
      cardImg.style.width = '60px';
      cardImg.style.height = 'auto';

      /*
      //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // do not button-ize the first card in play as its from user not table
      //  and should not be returnable
      if (i > 0) {
        // Put image inside the button
        const button = document.createElement('button');
        button.appendChild(cardImg);

        // add event listener to each button
        button.addEventListener('click', () => {
          console.dir("return card to table:", myPlayServObj[i], { depth: null });
          socket.emit('remove-from-play', myPlayServObj[i])
        });

        // Put button inside the div
        const div = document.createElement('div');
        div.classList.add('button');
        div.appendChild(button);

        myPlay.appendChild(div);

      } else {
        myPlay.appendChild(cardImg);
      }
      //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
      */

      // Put image inside the button
      const button = document.createElement('button');
      button.appendChild(cardImg);

      // add event listener to each button, first card gets a different one
      if (i === 0) {
        button.addEventListener('click', () => {
          console.dir("return card to hand:", myPlayServObj[i], { depth: null });
          socket.emit('back-to-deck', myPlayServObj[i]);
        });

        // differentiate the first card by background color
        button.style.backgroundColor = '#4da6ff';

        // disable return to deck if there is more than 1 card in play
        // techinically works without this BUT its a better safety net
        console.log("Cards num in play: " + myPlayServ.length);
        if (myPlayServ.length > 1) {
          button.disabled = true;
        }

        // Put button inside the div
        const div = document.createElement('div');
        div.classList.add('button');
        div.appendChild(button);

        myPlay.appendChild(div);

      } else if (i > 0) {
        button.addEventListener('click', () => {
          console.dir("return card to table:", myPlayServObj[i], { depth: null });
          socket.emit('remove-from-play', myPlayServObj[i])
        });

        // Put button inside the div
        const div = document.createElement('div');
        div.classList.add('button');
        div.appendChild(button);

        myPlay.appendChild(div);
      }

    });
  } else {
    // keep consistent space to avoid game screen shifting around too much during plays
    const spacer = document.createElement('div');
    spacer.style.height = '60px';
    myPlay.appendChild(spacer);
  }

  // fetch and format my cards
  myCards.innerHTML = "";
  if (myCardsServ && myCardsServ.length > 0) {
    myCardsServObj = myCardsServ;
    myCardsServ = myCardsServ.map(cardToString);
    // add my cards as buttons
    myCardsServ.forEach((card, i) => {
      const cardImg = document.createElement('img');
      cardImg.src = `cards_png/${card}.png`;
      cardImg.alt = card;
      cardImg.style.width = '60px';
      cardImg.style.height = 'auto';

      // Put image inside the button
      const button = document.createElement('button');
      button.appendChild(cardImg);

      // add event listener to each button
      button.addEventListener('click', () => {
        console.dir("card to play:", myCardsServObj[i], { depth: null });
        socket.emit('play-card', myCardsServObj[i])
      });

      if (!isMyTurn || (myPlayServ && myPlayServ.length > 0)) {
        button.disabled = true;
      }

      // Put button inside the div
      const div = document.createElement('div');
      div.classList.add('button');
      div.appendChild(button);

      // add button div to the list of my cards
      myCards.appendChild(div);
    });
  } else {
    // keep consistent space to avoid game screen shifting around too much during plays
    const spacer = document.createElement('div');
    spacer.style.height = '60px';
    myCards.appendChild(spacer);
  }

  // show my sur count
  mySurs.innerHTML = "Surs: " + mySursServ;

});

// Convert card objects to readable strings like "7H", "QH", etc.
function cardToString(card) {
  const faceVals = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const val = faceVals[card.val] || card.val;
  return val + card.suit;
}

/*
/ / when the cards in play are claim-able enable claim
socket.on('show-done-btn', () => {
  document.getElementById('doneBtn').disabled = false;;
});


/ / When done button is clicked
document.getElementById('doneBtn').addEventListener('click', () => {
  / / send order to server to claim cards
  socket.emit('finalize-turn');
});
*/





// when the cards in play are claim-able enable claim
socket.on('show-to-table-btn', () => {
  document.getElementById('toTableBtn').disabled = false;;
});


// When collect button is clicked
document.getElementById('toTableBtn').addEventListener('click', () => {
  // send order to server to claim cards
  socket.emit('finalize-turn');
});




// when the cards in play are claim-able enable claim
socket.on('show-collect-btn', () => {
  document.getElementById('collectBtn').disabled = false;;
});


// When collect button is clicked
document.getElementById('collectBtn').addEventListener('click', () => {
  // send order to server to claim cards
  socket.emit('finalize-turn');
});



socket.on('show-end-screen', winner => {
  // Set winners name
  document.getElementById('winner').innerHTML = `<h1>${winner}</h1>`;
  // Hide game screen
  document.getElementById('game').style.display = 'none';
  // Show game end screen
  document.getElementById('endScreen').style.display = 'flex';
});


// When main menu button is clicked from winning screen
document.getElementById('mainMenuBtnEndScr').addEventListener('click', () => {
  // Hide game winning screen
  document.getElementById('endScreen').style.display = 'none';
  // Show main menu
  document.getElementById('mainMenu').style.display = 'flex';
  // send request to leave the game
  socket.emit('leave-game');
});





/**
//! NOT WORKING
// Listen for when this player connects to server
//? 'connect' is a built-in automatic event for socket.io
socket.on('connect', () => {
  document.getElementById('log').innerHTML += `<br>Connected as ${playerName} (${socket.id})`;
  //todo When we set up main menu and user input, change below line
  // auto join defealt set room: roomCode.
  socket.emit('join-game', roomCode, playerName, newGame);
});
*/





