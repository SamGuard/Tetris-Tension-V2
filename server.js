const http = require('http');//Loading http package so i can use a http server
const webSocketServer = require("websocket").server;
const app = require("./app");//Getting app.js in the current folder which holds all the routes the user can take
const ids = require("short-id");
const { exception } = require('console');

const port = process.env.PORT || 3000;//This means to use port 3000 unless process.env.PORT is set as this variable is set when deployed to heroku

const server = http.createServer(app);//Creates the http server using app.js

server.listen(port);//Listen for incoming connections

console.log("listening on port " + port);


//WebSocketServer

class Room {
    constructor(roomCode, hostIP){
        this.code = roomCode;
        this.hostIP = hostIP;
        this.clientIP = null;
    }

    addPlayer(ip){
        if(this.clientIP == null){
            this.clientIP = ip;
        }else{
            throw new Error("Cannot add another player to this room");
        }
    }

    
}

rooms = [];

function genCode(){
    return "ABCDEF";
}

function isOriginAllowed(ip){
    return true;
}

function addRoom(IP){
    let code = genCode();
    rooms.push(new Room(code, IP));
    console.log("Created room, IP: " + IP + " room code: " + code);
    return code;
}

function handleMessage(mess, conn){
    mess = JSON.parse(mess);
    if(mess.purp == "createroom"){
        conn.sendUTF(JSON.stringify({
            purp: "createRoom",
            data: {roomCode: addRoom(conn.socket.remoteAddress)},
            time: Date.now()
        }));
    }else if(mess.purp == "joinroom"){
        for(let i = 0; i < rooms.length; i++){
            if(rooms[i].code == mess.data.roomCode){
                rooms[i].addPlayer(conn.socket.remoteAddress);
                conn.sendUTF(JSON.stringify({
                    purp: "joinroom",
                    data: { roomCode: rooms[i].code },
                    time: Date.now()
                }));
                
                for(let j = 0; j < connections.length; j++){
                    if(connections[j].socket.remoteAddress == rooms[i].hostIP){
                        connections[j].sendUTF(JSON.stringify({
                            purp: "start",
                            data: { },
                            time: Date.now()
                        }));
                        break;
                    }
                }

                return;
            }
        }
    }else{
        conn.sendUTF(JSON.stringify({
            purp: "error",
            data: "",
            time: Date.now()
        }));
    }
}

var WebSocketServer = require('websocket').server;

wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections:  false
});

let connections = [];

wss.on('request', function(request){
    if (!isOriginAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted. IP: ' + connection.remoteAddress);

    connection.on('message', function (message) {
        console.log('Received Message: ' + message.utf8Data);
        handleMessage(message.utf8Data, connection);
    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    connections.push(connection);
    
});