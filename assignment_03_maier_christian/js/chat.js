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

let currentPeer;
let btnJoin = document.getElementById("btnJoin");
let btnLeave = document.getElementById("btnLeave");
let btnSendMsg = document.getElementById("btnSend");
let WebRTCDataConnection;
let myId;


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
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);

    myId = id;
    document.getElementById("myId").innerHTML = id;

    /** Periodically get list of ids of all connected PeerJS clients on PeerJS Server: */
    //  setInterval(function() {
    //     peer.listAllPeers((l) => console.log(l))
    // }, 1000);
});

/** This event fires when your client disconnected from the _PeerJS_ Server */
peer.on('disconnected', function() {
    // Nur Connection zum Server lost
    console.warn('disconnected from PeerJS server: ' + options.host);

    // RtC still exists but as client disconnected from signaling server I guess will have to display this
    document.getElementById("myId").innerHTML = "Not Connected";

    // disable connect to other peer button as this is no longer possible
    disableButton(btnJoin);


    // Please mind: this does not affect any already established peer-to-peer connections - 
    // those may still be intact! 
});

peer.on('close', () => {
    // Server ist weg
    console.log('connection to PeerJS server closed');

    // disable connect to other peer button as this is no longer possible
    disableButton(btnJoin);
    // RtC still exists but as client disconnected from signaling server I guess will have to display this
    document.getElementById("myId").innerHTML = "Not Connected";

});

peer.on('error', (err) => {
    console.warn('PeerJS error:', err.message);
    alert('PeerJS error:', err.message);
});


//////////////////////////////  WebRTC related   ////////////////////



/** This event fires each time _another_ client contacted you (via WebRTC)  */
peer.on('connection', function(dataConnection) {
    // SUCCESS

    console.log('received data connection from other peer: ', dataConnection.peer);
    WebRTCDataConnection = dataConnection;

    joinBtnToDisconnectBtn();

    addFunctToLeaveBtn();

    // store current peer id
    currentPeer = WebRTCDataConnection.peer;

    updateWebRTCDataConnection(WebRTCDataConnection);



});



function addFunctToLeaveBtn() {
    btnLeave.addEventListener("click", function() {
        WebRTCDataConnection.close();
        //   changeIdOfConnectedPeerDisplayed("No peer connected");
        disconnectToJoinBtn();
        //  changeConnectionStatus();
    }, { once: true });
}




/** Maybe use a central helper function for setting up and managing your peer connection? */
function updateWebRTCDataConnection(connection) {
    // initialise/update connection and add event listener(s) here
    WebRTCDataConnection = connection;


    /** 
     * This event fires if you initiated the data connection to _another_ client and it was successfull. 
     * Please mind: event listener must be setup anew if your WebRTC connection changed/was updated
     */
    WebRTCDataConnection.on('open', function() {
        // SUCCESS
        console.log('requested data connection was successfully opened');

        currentPeer = WebRTCDataConnection.peer;
        joinBtnToDisconnectBtn();
        addFunctToLeaveBtn();
        changeIdOfConnectedPeerDisplayed(currentPeer);
        changeConnectionStatus();

        enableButton(btnSendMsg);

    });

    WebRTCDataConnection.on('data', function(data) {
        console.log('received data from other peer: ' + data);
        handleData(data);
    });

    WebRTCDataConnection.on('close', function() {
        console.warn('WebRTCConnection to other peer was closed');
        deleteIDOfPeerFromGui();
        disconnectToJoinBtn();
        changeConnectionStatus()
        disableButton(btnSendMsg);
    });


}


// helper functions to handle data from incoming connection

function handleData(msg) {
    // data shall always be string
    document.getElementById("messages").value += "\n" + currentPeer + ": " + msg;
}


//////////////////////////////  UI related   ////////////////////

function deleteIDOfPeerFromGui() {
    document.getElementById("connectedPeers").innerHTML = "No peer connected";
    document.getElementById("peerid").value = "";
}

// helper functions to change gui elements
function changeIdOfConnectedPeerDisplayed(peerID) {
    document.getElementById("connectedPeers").innerHTML = peerID;
    document.getElementById("peerid").value = peerID;


}

function disableButton(elem) {
    console.log(elem);
    elem.classList.add("button_disabled");
}

function enableButton(elem) {
    console.log(elem);
    elem.classList.remove("button_disabled");
}

function joinBtnToDisconnectBtn() {

    btnJoin.classList.add("gone");
    btnLeave.classList.remove("gone");
}

function disconnectToJoinBtn() {

    btnJoin.classList.remove("gone");
    btnLeave.classList.add("gone");
}


function changeConnectionStatus() {
    let status = document.getElementById("connectionStatus").innerHTML;
    if (status == "Not connected") {
        document.getElementById("connectionStatus").innerHTML = "Connected";
        document.getElementById("connectionStatus").className = "peerConnected";
    } else {
        document.getElementById("connectionStatus").innerHTML = "Not connected";
        document.getElementById("connectionStatus").className = "peerNotConnected";
    }
}

// Add event listener to UI components
btnJoin.addEventListener("click", connectToPeer);

btnSendMsg.addEventListener("click", sendMsg);



function connectToPeer() {
    console.log('connectToPeer');
    // TODO: implement

    let peerInputElem = document.getElementById('peerid');

    let peerid = peerInputElem.value;

    if (peerid === "") {
        alert("Sry, peer Id may not be empty");
    } else {

        WebRTCDataConnection = peer.connect(peerid)

        updateWebRTCDataConnection(WebRTCDataConnection);

    }


    // scheint mir eher unnötig zu sein
    function updateWebRTCConnectionStatus() {
        console.log('updateWebRTCConnectionStatus');
        // TODO: implement
    }

}

function sendMsg() {
    console.log('sendMsg');
    let chatInputElem = document.getElementById('myMessage');
    let chatMSG = chatInputElem.value;
    chatInputElem.value = "" 

    if (chatMSG === "") {
        alert("Sry, empty message can not be send");
    } else {

        chatMSG = chatMSG.trim();
        // append msg to chatArea
        document.getElementById("messages").value += "\n" + myId + ": " + chatMSG;

        WebRTCDataConnection.send(chatMSG);
    }
}