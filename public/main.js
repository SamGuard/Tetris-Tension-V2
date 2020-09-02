function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


class ConnectionHandler {
    constructor() {
        this.isHost = false;
        this.gameRunning = false;
        this.roomCode = "";
        this.game;
        this.IP = "wss://" + window.location.host; //"ws://192.168.0.28:3000";
        this.socket = new WebSocket(this.IP);
        this.id = makeid(6);
        console.log("Your id is: " + this.id);
    }

    createRoom() {
        let data = JSON.stringify({
            purp: "createroom",
            data: {},
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }

    joinRoom() {
        let data = JSON.stringify({
            purp: "joinroom",
            data: { roomCode: this.roomCode },
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }



    startGame() {
        console.log("Start game");
        $('#createGamePage').hide();
        $('#homePage').hide();

        $('#gamePage').show();
        this.gameRunning = true;


        console.log("Game running, isHost: " + this.isHost);
        if (this.isHost) {
            this.game = new Game(this.isHost, this.socket);
            gameUpdateInterval = setInterval(function () {
                conHandler.game.update();
            }, 100);
        }else{
            this.setupGameControl();
        }

    }

    setupGameControl(){
        $('#gamePage').html(`
            <div class= "GridContainer" >
                <div class="grid-item-hide"></div>
                <div class="MovementButtons" key="0">UP</div>
                <div class="grid-item-hide"></div>
                <div class="MovementButtons" key="1">LEFT</div>
                <div class="grid-item-hide"></div>
                <div class="MovementButtons" key="2">RIGHT</div>
                <div class="grid-item-hide"></div>
                <div class="MovementButtons" key="3">DOWN</div>
                <div class="grid-item-hide"></div>
            </div > 
        `)

        $('.MovementButtons').click(function () {
            let key = $(this).attr("key");
            let data = JSON.stringify({
                purp: "pass",
                data: { key: key },
                time: Date.now(),
                id: conHandler.id
            });

            conHandler.socket.send(data);
        });
    }

};

let conHandler = new ConnectionHandler();
let gameUpdateInterval = null;
conHandler.socket.onopen = function (e) {
    console.log("[open] Connection established");
};

conHandler.socket.onmessage = function (event) {
    console.log(`[message] Data received from server: ${event.data}`);
    let data = JSON.parse(event.data);

    if (data.id != conHandler.id) {
        console.log("Invalid ID: " + data.id);
        return;
    }

    if (data.purp == "createroom") {
        conHandler.roomCode = data.data.roomCode;
        console.log(conHandler.roomCode);
        $('#createGamePin').html(`<b>${conHandler.roomCode}</b><br>`);
    } else if (data.purp == "joinroom") {
        if (data.data.roomCode == -1) {
            console.log("Error joining room");
        } else {
            conHandler.roomCode = data.data.roomCode;
            conHandler.isHost = false;
            conHandler.startGame();
        }

    } else if (data.purp == "start") {
        conHandler.isHost = true;
        conHandler.startGame();
    } else if(data.purp == "pass"){
        conHandler.game.keyPressed(parseInt(data.data.key));
    }else{
        console.log("Error purpose not recognise");
    }

};


conHandler.socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        console.log('[close] Connection died');
    }
};

conHandler.socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
};

$(document).ready(function () {

    $('#homePage').show();
    $('#createGamePage').hide();
    $('#gamePage').hide();

    $('#joinGameButton').click(function () {
        conHandler.roomCode = $('#codeInput').val();
        conHandler.joinRoom();
    });

    $('#createGameButton').click(function () {
        $('#homePage').hide();
        $('#gamePage').hide();

        $('#createGamePage').show();
        conHandler.createRoom();
    });

    $('#createBackButton').click(function () {
        $('#createGamePage').hide();
        $('#gamePage').hide();

        $('#homePage').show();
    });

});