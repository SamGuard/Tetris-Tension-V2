const http = require('http');//Loading http package so i can use a http server
const webSocketServer = require("websocket").server;
const app = require("./app");//Getting app.js in the current folder which holds all the routes the user can take
const shortID = require("short-id");
const { exception } = require('console');
const { finished } = require('stream');

const port = process.env.PORT || 3000;//This means to use port 3000 unless process.env.PORT is set as this variable is set when deployed to heroku

const server = http.createServer(app);//Creates the http server using app.js

server.listen(port);//Listen for incoming connections

console.log("listening on port " + port);


//WebSocketServer
class ID {
    constructor(ip, id) {
        this.ip = ip;
        this.id = id;
    }
};

class Room {
    constructor(roomCode, hostID) {
        this.code = roomCode;
        this.hostID = hostID;
        this.clientID = null;
    }

    addPlayer(id) {
        if (this.clientIP == null) {
            this.clientIP = id;
        } else {
            throw new Error("Cannot add another player to this room");
        }
    }


}

rooms = [];

function genCode() {
    return shortID.generate();
}

function isOriginAllowed(ip) {
    return true;
}

function addRoom(id) {
    let code = genCode();
    rooms.push(new Room(code, id));
    console.log("Created room, IP: " + id.ip + " room code: " + code);
    return code;
}

function findRoomByCode(roomCode) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].code == roomCode) {
            return i;
        }
    }
    return -1;
}

function findPlayerByID(id) {
    for (let i = 0; i < connections.length; i++) {
        if (connections[i].id && connections[i].id.ip == id.ip && connections[i].id.id == id.id) {
            return i;
        }
    }
    return -1;
}

function createRoom(mess, conn){
    conn.id = new ID(conn.socket.remoteAddress, mess.id);
    conn.sendUTF(JSON.stringify({
        purp: "createroom",
        data: { roomCode: addRoom(conn.id) },
        time: Date.now(),
        id: conn.id.id
    }));
}

function joinRoom(mess, conn){
    conn.id = new ID(conn.socket.remoteAddress, mess.id);
    let roomIndex = findRoomByCode(mess.data.roomCode);

    if (roomIndex != -1) {
        rooms[roomIndex].addPlayer(new ID(conn.socket.remoteAddress, mess.id));
        conn.sendUTF(JSON.stringify({
            purp: "joinroom",
            data: { roomCode: rooms[roomIndex].code },
            time: Date.now(),
            id: conn.id.id
        }));

        let playerIndex = findPlayerByID(rooms[roomIndex].hostID);
        if (playerIndex != -1) {
            connections[playerIndex].sendUTF(JSON.stringify({
                purp: "start",
                data: {},
                time: Date.now(),
                id: connections[playerIndex].id.id
            }));
        } else {
            console.log("Error: could not find other player");
        }
    } else {
        conn.sendUTF(JSON.stringify({
            purp: "joinroom",
            data: { roomCode: -1 },
            time: Date.now(),
            id: conn.id.id
        }));
    }
}

function handleMessage(mess, conn) {
    mess = JSON.parse(mess);
    if (mess.purp == "createroom") {
        createRoom(mess, conn);
    } else if (mess.purp == "joinroom") {
        joinRoom(mess, conn);
    } else {
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
    autoAcceptConnections: false
});

let connections = [];

wss.on('request', function (request) {
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