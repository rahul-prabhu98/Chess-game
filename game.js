
let board = null;
let game = new Chess();
let $status = $('#status');
let $fen = $('#fen');
let $pgn = $('#pgn');
let txtJoinGame = document.getElementById('txtJoinGame');
let lblGameId = document.getElementById('gameId');
let btnNewGame = document.getElementById('btnNewGame');
let btnJoinGame = document.getElementById('btnJoinGame');
let lblPieceColor = document.getElementById('pieceColor');

let socket = io('/', {transports: ['websocket'], upgrade: false});
let color;
let players;
let gameRoomID;
let play = true;

socket.on('connection', () => {
    console.log("Connected to Socket");
});

socket.on("newGameSuccess", function (gameRoomId) {
    gameRoomID = gameRoomId;
    color = 'white';
    lblPieceColor.innerText = color;
    lblGameId.innerHTML = "Game ID: " + gameRoomID;
    btnNewGame.disabled = true;
    btnJoinGame.disabled = true;
    console.log(gameRoomID);
    players = 1;
});

socket.on("Error", (msg) => {
    console.log(msg);
});

socket.on("playerCountExceed", (msg) => {
    console.log(msg);
});

socket.on("success", () => {
    play = false;
});

socket.on("move", (msg) => {
    console.log("Move Recieved");
    game.move(msg.move);
    board.position(msg.board);
    updateStatus();
});

socket.on("joinGameSuccess", (msg) => {
    gameRoomID = parseInt(msg);
    players = 2;
    color = 'black';
    lblPieceColor.innerText = color;
    play = false;
    lblGameId.innerHTML = "Game ID: " + gameRoomID;
    btnNewGame.disabled = true;
    btnJoinGame.disabled = true;
});

socket.on("gameOver", (gameRoomId) => {
    socket.leave(gameRoomId);
    gameOver();
});

function newGame(){
    console.log("Function newGame initiated");
    socket.emit('newGame', function () {
        console.log("New Game Request Initiated");
    });
}

function gameOver(){
    gameRoomID = null;
    alert("Game Over");
    lblGameId.innerHTML = "Game ID: " + gameRoomID;
    btnNewGame.disabled = false;
    btnJoinGame.disabled = false;
}

function joinGame() {
    socket.emit('joinGame', txtJoinGame.value);
    console.log("Game room join request initiated from client: " + txtJoinGame.value);
}

function onDragStart (source, piece) {

    // A few more rules have been added
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
        return false;
    }
};

function onDrop (source, target) {
    // see if the move is legal
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    if (game.game_over()) {
        socket.emit('move', {move: move, board: game.fen(), room: gameRoomID});
        socket.emit('gameOver', gameRoomID);
        gameOver();
    }

    // illegal move
    if (move === null) return 'snapback';
    else {
        console.log("Move detected: " + move + " Game Fen: " +  game.fen() + " Room: " + gameRoomID);
        socket.emit('move', {move: move, board: game.fen(), room: gameRoomID});
    }

    updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''

    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
        socket.emit('gameOver', gameRoomID);

    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
        socket.emit('gameOver', gameRoomID);
    }

    // game still on
    else {
        status = moveColor + ' to move';

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    $status.html(status);
    $fen.html(game.fen());
    $pgn.html(game.pgn());
}

var config = {
    orientation: color,
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}
board = Chessboard('chessboard', config);

updateStatus();

