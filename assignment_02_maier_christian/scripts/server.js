// https://github.com/websockets/ws
const WebSocket = require('ws');
const port = 8080;
// running on localhost:8080 for now
const server = new WebSocket.Server({ clientTracking: true, port: port });
// names and adresses of users
let clientMap = new Map();
// list to help with only storing names of current users
let currentUsers = [];
// complete history of all messanges
let messageHistory = [];

server.on('listening', () => console.log('> server running on port ' + port));

server.on('connection', (socket, request) => {
    // when connection is set, get the port the individual client connetcted to
    let clientPort = request.socket.remotePort;
    console.log(`[server] new client connected from port ${clientPort}`);

    socket.on('message', (msg) => {
        //deserialize JSON to an normal obj
        let clientMSG = JSON.parse(msg);
        console.log('[server] got message from client:', clientMSG.str);

        if (clientMSG.str == "newClient") {
            //check if we have name in user database and return error message
            if (currentUsers.includes(clientMSG.name)) {
                console.log('[server] name is already taken:', clientMSG.name);
                socket.send(JSON.stringify({ error: "Username already in Server DataBase", code: 409 }));
                // if not present register user
            } else {
                console.log('[server] registers new client named:', clientMSG.name);
                clientMap.set(clientPort, clientMSG.name);
                currentUsers = Array.from(clientMap, ([name, value]) => (value));

                let userListInfo = { list: currentUsers, str: "addUser", name: clientMSG.name, code: 201 };
                console.log('[server] now notifying all clients about current Client List new client named:', clientMSG.name);

                broadcastMessage(userListInfo, socket);
            }

        } else if (clientMSG.str == "newMessage") {
            console.log('[server] new message will be added to history:', clientMSG.chat);

            var timestamp = Date.now();
            var date = new Date(timestamp);
            hours = date.getHours();
            minutes = date.getMinutes();

            messageHistory.push({ msg: clientMSG.chat, user: clientMSG.name, time: hours + ":" + minutes });
            let msg = { content: clientMSG.chat, name: clientMSG.name, str: "addMessage", time: hours + ":" + minutes, code: 201 }
            console.log("[server] notifying all clients of new message")
            broadcastMessage(msg, socket);

        } else if (clientMSG.str === 'deleteClient') {

            console.log("[server] connection to client from port " + socket.clientPort + " closed")
            // delete this client from server
            clientMap.delete(socket.clientPort);
            // make current memberList
            currentUsers = Array.from(clientMap, ([name, value]) => (value));

            let msg = { name: clientMSG.name, str: "deleteClient", code: 200 }
            console.log("[server] notifying all clients of disconnected client")
            broadcastMessage(msg, socket);


            // current logic just dissconects client from chat, not from server, so socket shall stay open, if the client wants to reconnect
            //socket.close();

        } else if (clientMSG.str === 'init') {
            currentUsers = Array.from(clientMap, ([name, value]) => (value));
            console.log("[server] will now inform client of active clients")

            let msg = { list: currentUsers, str: "list", user: clientMSG.name, numberOfClients: server.clients.size, history: messageHistory, code: 200 };
            socket.send(JSON.stringify(msg));
        }
    });
});

function broadcastMessage(message, sender) {
    for (let client of server.clients) {
        if (client != sender) {
            client.send(JSON.stringify(message));
        }
    }
}