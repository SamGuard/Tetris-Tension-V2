let socket; //defined globally so can be accessed in jQuery events
let roomCode = "";
function createRoom(){
    let data = JSON.stringify({
        purp: "createroom",
        data: {},
        time: Date.now()
    });
    socket.send(data);
}

function joinRoom(){
    let data = JSON.stringify({
        purp: "joinroom",
        data: {roomCode: roomCode},
        time: Date.now()
    });
    socket.send(data);
}

function connectionHandler(){
    let IP = "ws://192.168.0.28:3000";
    socket = new WebSocket(IP);

    socket.onopen = function (e) {
        console.log("[open] Connection established");
    };

    socket.onmessage = function (event) {
        console.log(`[message] Data received from server: ${event.data}`);
        let data = JSON.parse(event.data);

        if(data.purp == "createroom"){
            roomCode = data.data.roomCode;   
        }else if(data.purp == "joinroom"){
            if(roomCode == "-1"){
                console.log("Error joining room");
            }else{
                console.log("Go");
            }

        }else if(data.purp == "start"){
            console.log("Go");
        }

    };


    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
        }
    };

    socket.onerror = function (error) {
        console.log(`[error] ${error.message}`);
    };
}

connectionHandler();

$(document).ready(function () {

    $('#homePage').show();
    $('#createGamePage').hide();

    $('#joinGameButton').click(function(){
        roomCode = $('#codeInput').val();
        joinRoom();
    });

    $('#createGameButton').click(function(){
        $('#homePage').hide();
        $('#createGamePage').show();
        createRoom();
    });

    $('#createBackButton').click(function () {
        $('#homePage').show();
        $('#createGamePage').hide();
    });

});