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

let players;

let games = Array(100);
for(let i = 0; i < games.length; i++){
    games[i] = {players: 0, pid: [0, 0]};
}

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    //res.sendFile(express.static(__dirname + '/index.html'));
    res.sendFile('/index.html', {root: __dirname});
});


io.on('connection', function (socket) {
    let playerId = Math.floor((Math.random() * 100) +1);
    console.log(playerId + ' connected');
    socket.on('disconnect', function(){
        console.log(playerId + ' disconnected');
    });
});


