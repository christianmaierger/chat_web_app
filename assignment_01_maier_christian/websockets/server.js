// https://github.com/websockets/ws
const WebSocket = require('ws');

const port = 8080;
// trough that we create a new server listening on port 8080 
// clientTracking activated, old code with own list is left commented
const server = new WebSocket.Server({ clientTracking: true, port: port });

// at first I managed sockets in my own list, now with clientTracking on Server
// let socketList = [];

// helper function to remove elements from arrays by value
// params are a as array and v as value
function removeByValue(a, v) {

    const index = a.indexOf(v);
    a = a.splice(index, 1);
}

// on ist mehtode von node, returned eventemitter, params sind event und callback function, ähnlich zu addEventHandler
server.on('listening', () => console.log('> server running on port ' + port));


// warum die beiden params und wo kommen sie einfach her, finde das krass implizit? Event connection returned das wohl
server.on('connection', (socket, request) => {


    // TODO: find out how to get the information from which port the client connected
    // and create a new property 'clientPort' on the socket object with this value  
    // socket.clientPort = ?
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


    // add socket used to connect to this client to socketList
    // socketList.push(socket);


    socket.on('message', (msg) => {
        console.log('[server] got message from client:', msg);

        socket.send('[client] server got your message: ' + msg);

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