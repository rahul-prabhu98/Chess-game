//Requesting following modules
const express = require('express');
const http = require('http');
const socket = require('socket.io');

//Declaring variables
const port = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
server.listen(port);
const io = socket(server);


//Managing map of 100 ongoing games, it contains gameRoomId as key and no. of players connected as Values
let gameMap = new Map();

//Generating 4 digit Game Room ID:
function generateGameRoomId(){
    return Math.floor(1000 + Math.random() * 9000);
}

//New player joining a game
function newGame(){
    let gameRoomId = generateGameRoomId();
    if(gameMap.has(gameRoomId)) {
        newGame();
    }
    else {
        gameMap.set(gameRoomId, 1);
        return gameRoomId;
    }
}

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    //res.sendFile(express.static(__dirname + '/index.html'));
    res.sendFile('/index.html', {root: __dirname});
});


io.on('connection', function (socket) {
    let playerId = Math.floor((Math.random() * 100) +1);
    console.log(playerId + ' connected');

    socket.on('newGame', function () {
       let gameRoomId = newGame();
       socket.join(gameRoomId);
       io.to(gameRoomId).emit("newGameSuccess", gameRoomId);
    });

    socket.on('joinGame', function (gameRoomId) {
        gameRoomId = parseInt(gameRoomId);
        if(gameMap.has(gameRoomId) && gameMap.get(gameRoomId) < 2) {
            gameMap.set(gameRoomId, 2);
            socket.join(gameRoomId);
            socket.to(gameRoomId).emit("success", "Player 2 joined successfully: " + gameRoomId);
            socket.emit("joinGameSuccess", gameRoomId);
        } else if (gameMap.get(gameRoomId) >= 2){
            socket.emit('playerCountExceed', "Cannot join room as two players are playing");
        } else{
            socket.emit('Error', "Game couldn't be joined as game room does not exist");
        }

    });

    socket.on('move', (msg) => {
        console.log("Move recieved at server and sent to: " + msg.room);
        socket.to(parseInt(msg.room)).emit("move", {move: msg.move, board: msg.board});
    });

    socket.on('gameOver', (gameRoomId) => {
        socket.to(parseInt(gameRoomId)).emit("gameOver", gameRoomId);
        gameMap.delete(gameRoomId);
    });

    socket.on('disconnect', function(){
        console.log(playerId + ' disconnected');
    });
});


