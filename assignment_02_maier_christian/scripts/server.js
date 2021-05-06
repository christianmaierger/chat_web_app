// https://github.com/websockets/ws
const WebSocket = require('ws');

const port = 8080;
// trough that we create a new server listening on port 8080 
// clientTracking activated, old code with own list is left commented
const server = new WebSocket.Server({ clientTracking: true, port: port });


// I will make a map  with users in string form with names to help me track and the keys will pe port numbers of the clients
let clientMap = new Map();
// list to help with only storing names of current users
let currentUsers;

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
        let newClient = JSON.parse(msg);

        console.log('[server] got message from client:', newClient.str);


        socket.send('[client] server got your message: ' + msg);


        if (newClient.str == "newClient") {

            console.log('[server] registers new client named:', newClient.name);


            clientMap.set(socket.clientPort, msg.name);


            // fill list with usernames still registered on server identified by key port
            let i = 0;
            for (let client of server.clients) {
                if (clientMap.has(client)) {
                    currentUsers.push(clientMap.get(client));
                }
                i++;
            }

            let userListInfo = { list: currentUsers, str: "list", user: newClient.name };


            // socket.send(JSON.stringify(userListInfo));


            console.log('[server] now notifying all clients about new client named:', newClient.name);
            i = 0;
            for (let client of server.clients) {
                client.send(JSON.stringify(userListInfo));
                i++;
            }
        }

        if (msg === 'close_connection') {
            // TODO: Implement - closes the current connection


            socket.send("[client] server now disconnects");
            console.log("connection to client from port " + socket.clientPort + " closed")
            socket.close();


            // console.log("connection to client " + socketList.indexOf(socket) + 1 + " closed")

            // when client tracking is not enabled use instead:
            // delete clientPort from (active) client List 
            // removeByValue(socketList, socket);

        } else if (msg === 'list_clients') {
            // TODO: Implement - sends a list of all connected clients to the client 
            // (each client is identified by its remote port)

            socket.send("[client] Number of active client connections of server: " + server.clients.size);
            let i = 1;
            /**  for (let clientSocket of socketList) {
                 socket.send("[server] client " + i + " from port: " + clientSocket.remotePort);
                 i++;
             } */

            for (let client of server.clients) {
                // attention for the WebSocket objects in the Set server.clients, the property for the port is not remotePort, but clientPort!!
                socket.send("[server] client " + i + " from port: " + client.clientPort);
                i++;
            }

        } else if (msg === 'greet_clients') {
            // TODO: Implement - send a welcome message to all connected clients


            for (client of server.clients) {
                client.send("Hello Client sending from port: " + client.clientPort);
            }

            /**  for (const socket of socketList) {
                 socket.send("Hello Client!");
             } */

        }
    });
});