// https://github.com/websockets/ws
const WebSocket = require('ws');
const port = 8080;
const server = new WebSocket.Server({ clientTracking: true, port: port });

let clientMap = new Map();
// list to help with only storing names of current users
let currentUsers = [];
let messageHistory = [];

// helper function to remove elements from arrays by value
// params are a as array and v as value
function removeByValue(a, v) {

    const index = a.indexOf(v);
    a = a.splice(index, 1);
}

server.on('listening', () => console.log('> server running on port ' + port));


server.on('connection', (socket, request) => {



    socket.clientPort = request.socket.remotePort;
    console.log('[server] new client connected from port: ', socket.clientPort);

    // hier könnte man pub/sub implementieren um alle connecten clients über den Neuen zu informieren, siehe task 2 Übung 2
    // ganz ehrlich, ich hab die in der Liste, kann die auch einfach durchiterieren, event connection triggert
    // und hier "notifie" ich darüber die anderen Clients, ist einfachstes Pub/sub in meinen Augen

    /** 
    let i = 1;
    for (client of server.clients) {
        client.send("[server] new client connected from port: " + socket.clientPort);
    }
    */

    socket.on('message', (msg) => {

        //deserialize JSON to an normal obj
        let clientMSG = JSON.parse(msg);

        console.log('[server] got message from client:', clientMSG.str);


        if (clientMSG.str == "newClient") {


            //check if we have name in user database and return error message
            if (currentUsers.includes(clientMSG.name)) {
                console.log('[server] name is already taken:', clientMSG.name);
                socket.send(JSON.stringify({ error: "Username already in Server DataBase" }));
                // if not present register user
            } else {

                console.log('[server] registers new client named:', clientMSG.name);

                clientMap.set(socket.clientPort, clientMSG.name);

                currentUsers = Array.from(clientMap, ([name, value]) => (value));

                let i = 0;

                let userListInfo = { list: currentUsers, str: "addUser", name: clientMSG.name };

                console.log('[server] now notifying all clients about current Client List new client named:', clientMSG.name);

                for (let client of server.clients) {
                    if (client != socket) {
                        client.send(JSON.stringify(userListInfo));
                    }
                }

            }
        } else if (clientMSG.str == "newMessage") {
            console.log('[server] new message will be added to history:', clientMSG.chat);

            messageHistory.push({ msg: clientMSG.chat, user: clientMSG.name });

            let msg = { content: clientMSG.chat, name: clientMSG.name, str: "addMessage" }

            for (let client of server.clients) {
                if (client != socket) {
                    client.send(JSON.stringify(msg));
                }
            }


        } else if (clientMSG.str === 'deleteClient') {


            console.log("[server] connection to client from port " + socket.clientPort + " closed")

            // delete this client from server

            clientMap.delete(socket.clientPort);

            // make current memberList
            currentUsers = Array.from(clientMap, ([name, value]) => (value));

            let msg = { name: clientMSG.name, str: "deleteClient" }


            console.log("[server] notifying all clients of disconnected client")
            for (let client of server.clients) {
                if (client != socket) {
                    client.send(JSON.stringify(msg));
                }
            }

            socket.close();

        } else if (clientMSG.str === 'init') {
            currentUsers = Array.from(clientMap, ([name, value]) => (value));
            console.log("[server] will now inform client of active clients")

            let msg = { list: currentUsers, str: "list", user: clientMSG.name, numberOfClients: server.clients.size, history: messageHistory };
            socket.send(JSON.stringify(msg));
        }
    });
});