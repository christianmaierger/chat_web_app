/**
 *  Assignment 3: Create a simple peer-to-peer chat client (with only two peers)
 *  
 *  Please mind, in a peer-to-peer network each node(peer) can act as both, as a client and as a server!
 *  You have to carefully account for both cases; especially the setup procedure can be a bit tricky.
 *  Your app may start a connection to another peer (as a _client_) OR it gets contacted by another peer (as a _server_)
 *  asking for a connection at any time. 
 *  
 *  See: https://peerjs.com/docs.html#api
 */

//////////////////////////////  PeerJS Setup  ////////////////////

const options = {
    host: 'localhost',
    // host: 'scml.hci.uni-bamberg.de', //<- our public peerjs server - give it a try!
    port: 9000,
    path: '/chat'
}

/** Connect with a PeerJS server */
const peer = new Peer(options);

/** You can also provide a custom Id (i.e., your name as plaintext) to the constructor function: 
    The server will then use this one for signalling and discovery */
// let myId = "Anna";
// const peer = new Peer(myId, options);



//////////////////////////////  PeerJS Server related   ////////////////////

/** This event fires when your client connected successfully with a _PeerJS_ Server (via HTTP) */
peer.on('open', function (id) {
    console.log('My peer ID is: ' + id);

    /** Periodically get list of ids of all connected PeerJS clients on PeerJS Server: */
    // setInterval(function () {
    //     peer.listAllPeers((l) => console.log(l))
    // }, 1000);
});

/** This event fires when your client disconnected from the _PeerJS_ Server */
peer.on('disconnected', function () {
    console.warn('disconnected from PeerJS server: ' + options.host);
    // Please mind: this does not affect any already established peer-to-peer connections - 
    // those may still be intact! 
});

peer.on('close', () => {
    console.log('connection to PeerJS server closed');
});

peer.on('error', (err) => {
    console.warn('PeerJS error:', err.message);
})


//////////////////////////////  WebRTC related   ////////////////////

let WebRTCDataConnection = {};

/** This event fires each time _another_ client contacted you (via WebRTC)  */
peer.on('connection', function (dataConnection) {
    // SUCCESS
    console.log('received data connection from other peer: ', dataConnection.peer);
});

/** 
 * This event fires if you initiated the data connection to _another_ client and it was successfull. 
 * Please mind: event listener must be setup anew if your WebRTC connection changed/was updated
 */
WebRTCDataConnection.on('open', function () {
    // SUCCESS
    console.log('requested data connection was successfully opened');
});

WebRTCDataConnection.on('data', function (data) {
    console.log('received data from other peer: ' + data);
});

WebRTCDataConnection.on('close', function () {
    console.warn('WebRTCConnection to other peer was closed');
});

/** Maybe use a central helper function for setting up and managing your peer connection? */
// function updateWebRTCDataConnection(connection) {
//     // initialise/update connection and add event listener(s) here
// }


//////////////////////////////  UI related   ////////////////////

// Add event listener to UI components
function connectToPeer() {
    console.log('connectToPeer');
    // TODO: implement
}

function sendMsg() {
    console.log('sendMsg');
    // TODO: implement
}

function updateWebRTCConnectionStatus() {
    console.log('updateWebRTCConnectionStatus');
    // TODO: implement
}


