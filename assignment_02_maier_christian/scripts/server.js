require('dotenv').config();
const wsPort = process.env.PORT || 8080;
const expressPort = process.env.PORTEXPRESS || 3000;
//const host = process.env.HOST || "localhost";
const cors = require('cors');
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
  };
const path = require('path');
var express = require('express')
var app = express()
app.use(cors(corsOptions));

// send static files to client that makes a http request to host:port/index - default localhost:3000/index
app.use('/scripts/client.js' , (req,res,next)=>{
    res.sendFile(path.join(__dirname,'/client.js'));
    });
app.use('/styles/client.css' , (req,res,next)=>{
    res.sendFile(path.join(__dirname,'../styles/client.css'));
    });
 app.use('/img/logo_mci_hci_200x96.png' , (req,res,next)=>{
    res.sendFile(path.join(__dirname,'../img/logo_mci_hci_200x96.png'));
    });
app.use('/index' , (req,res,next)=>{
res.sendFile(path.join(__dirname,'../client.html'));
});



// send the client the port number to connect to ws for chat
app.get('/port', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(wsPort);
});


// if run in docker container plese make sure the exposed port for the express server is mapped to the one the server in the container listens on
app.listen(expressPort, function () {
   console.log('Express is listening on port 3000 and will send static files to clients!')
})


// https://github.com/websockets/ws
// will handle chat communication with clients
const WebSocket = require('ws');

// running on localhost:8080 for now 
const server = new WebSocket.Server({ clientTracking: true, port: wsPort });

// names and adresses of users
let clientMap = new Map();
// list to help with only storing names of current users
let currentUsers = [];
// complete history of all messages
let messageHistory = [];

// server will on default lsiten on port 8080 for clients connecting to the chat
server.on('listening', () => console.log('> server running on port ' + wsPort));

server.on('error', (e) => console.log(" [server]: an error occured: " + e ) )

server.on('connection', (socket, request) => {
    // when connection is set, get the port the individual client connetcted to
    let clientPort = request.socket.remotePort;
    console.log(`[server] new client connected with adress: ${clientPort}`);

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

            let timestamp = Date.now();
            let date = new Date(timestamp);
            let year = date.getFullYear();
            let month = date.getMonth() + 1; // months are zero-indexed, so add 1
            let day = date.getDate();
            let hours = date.getHours();
            let minutes = date.getMinutes();

            
            let msg = { content: clientMSG.chat, name: clientMSG.name, str: "addMessage", time: day + "/" + month + "/" + year + " " + hours + ":" + minutes, code: 201 };
            messageHistory.push({ msg: clientMSG.chat, user: clientMSG.name, time: day + "/" + month + "/" + year + " " + hours + ":" + minutes });
            console.log("[server] notifying all clients of new message: " + JSON.stringify(msg));
            broadcastMessage(msg, socket);

        } else if (clientMSG.str === 'deleteClient') {

            console.log("[server] connection to client from port " + socket.clientPort + " closed")
            // delete this client from server
            clientMap.delete(socket.clientPort);
            // make current memberList
            currentUsers = Array.from(clientMap, ([name, value]) => (value));
            messageHistory.push(msg);
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