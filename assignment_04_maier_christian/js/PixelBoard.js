/**
 *  Assignment 4: Create a simple peer-to-peer pixel editor (with only two peers)
 *
 *  Each pixel is represented as a square-shaped div element.
 *  To synchronise the state of your pixel board, please use the automerge JavaScript library, which implements a CRDT.
 *  The function object (class) PixelBoard below already provides necessary setup routines.
 *  Please mind, these do not always implement the most efficient routines and data structures - you can also come up with your own implementations, be creative!
 *  Also, you have to implement the network connection by yourself (or use and adjust the peer connection from assignment 3)
 *
 *  See: https://github.com/automerge/automerge
 */


var mouseIsDown = false
var pixelChanged;



class PixelBoard {


    constructor() {
        this._pixelBoardContainer = document.getElementById("pixelboard"); // div#pixelboard, that should contain all pixel nodes

        this._actorId = Automerge.getActorId(Automerge.init()); // use an automatically generated uuid; could/should be replaced with peerjs uuid.
        this._pixelboardDocument = Automerge.from({ // initialise our shared document object containing a 'pixelBoard' property
            pixelBoard: new Array(32 * 16).fill([0, this._actorId]) // initially fill the pixelboard with empty pixels and our actor id (-> array of 2-tuples)
        })

        this._pixelBoard = this._pixelboardDocument.pixelBoard; // quick variable for accessing the pixelboard
    }

    /**
     * method to 'draw' the pixelboard by creating a div node for each pixel
     */
    draw() {


        this._pixelBoardContainer.innerHTML = ""; // reset the previous pixel raster

        const pixelsDivs = document.createDocumentFragment(); // create in memory (virtual) DOM element container for appending divs
        this._pixelBoard.forEach((elem, i) => {
            let pixel = elem[0]; // first elem of the 2-tuple is the pixel value
            let actor = elem[1]; // second elem is the actor id (our id || other peers id)

            let divNode = document.createElement("div"); // create empty div element to represent a pixel
            divNode.setAttribute("data-value", pixel); // set the data-value attribute with the value of the pixel (0 || 1)


            divNode.addEventListener('mouseup', function() {
                mouseIsDown = false;
                console.log("up")
                sendChangedDiv();
            })

            divNode.addEventListener("mousedown", (event) => {
                console.log('mdown', i);
                mouseIsDown = true;

                this.changePixel(i, event, true); // will be executed after mousedown event
                pixelChanged = i;
                //changedByClick = true;
            }, { once: true })

            divNode.addEventListener('mousemove', (event) => {
                if (mouseIsDown && pixelChanged != i) {
                    // implement drawing logic here

                    console.log('mMove', i);


                    this.changePixel(i, event, false); // will be executed after mousedown event
                    pixelChanged = i;
                }
            }, { once: true })

            // TODO: this should be 'other' in case the other peer has drawn this pixel (also see pixelboard.css)

            if (elem[1] == myId) {

                divNode.className = "me";

            } else {
                divNode.className = "other";
            }

            pixelsDivs.appendChild(divNode); // append the div to our virtual DOM element
        })
        this._pixelBoardContainer.appendChild(pixelsDivs); // finally, append all new divs to the parent div

    }

    /**
     * Method to change a pixel
     * if the pixel was empty (white) before, it will be filled with our actor's colour after that;
     * if the pixel was filled by our actor it will be empty (white) afterwards;
     * or if it was previously filled with the other peer's colour it will be filled with our actor's colour afterwards.
     * @param index - index of the pixel to change
     * @param event - the MouseEvent after the pixel node was clicked
     */
    changePixel(index, event, singleChange) {
        let pixelNode = event.target; // the corresponding div representing the pixel
        let currentValue = pixelNode.getAttribute("data-value"); // the current value (0 || 1) is stored in the data-value attribute
        let newValue = 0; // default case for the new value (iff the pixel was filled before)
        switch (currentValue) {
            case '0':
                newValue = 1; // if the pixel was white before
                break;
            case '1':
                if (pixelNode.className === 'other') newValue = 1; // if the pixel was filled before, but with the color of the other peer
                break;
        }

        this.updatePixelboardDocument(index, newValue);


        pixelNode.setAttribute("data-value", String(newValue)); // update the data-value attribute of the pixel div node
        pixelNode.className = 'me';

        // TODO: notify other peer - but this is done only when mouse button is realised to reduce network load and drawing time when receiving



    }

    /**
     * Method to update the Automerge pixelboard document containing the pixelboard as an array with 2-tuples
     * @param index - the index of the pixel to change
     * @param newValue - the new value (0 || 1) of the pixel
     */
    updatePixelboardDocument(index, newValue) {
        // TODO: implement and call this function where appropriate

        // change the pixel in the documents pixelBoard
        // first write new value from html pixelNode in the index of the array the div belongs to, as the pixelBoard is a part of the doc it is updated automatically
        // first in tupel is the value 1 for full/blue and 0 for empty/white

        pb.pixelboardDocument = Automerge.change(pb._pixelboardDocument, obj => {
            obj.pixelBoard[index][0] = newValue;
            obj.pixelBoard[index][1] = myId
        });


    }

    /**
     * Setter to update the Automerge pixelboard document
     * @param newDoc - the new document
     */
    set pixelboardDocument(newDoc) {
        this._pixelboardDocument = newDoc;
        this._pixelBoard = this._pixelboardDocument.pixelBoard;
        this.draw();

    }

    get pixelboardDocument() {
        return this._pixelboardDocument;
    }

    get pixelBoard() {
        return this._pixelBoard;
    }

}

let pb = new PixelBoard();
let peer;
let myId;
let btnJoin = document.getElementById("btnJoin");
let btnLeave = document.getElementById("btnLeave");
let WebRTCDataConnection;
let doc;





const options = {
    // host: 'localhost',
    host: 'scml.hci.uni-bamberg.de', //<- our public peerjs server - give it a try!
    port: 9000,
    path: '/chat'
}

/** Connect with a PeerJS server */
peer = new Peer(options);

/** This event fires when your client connected successfully with a _PeerJS_ Server (via HTTP) */
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);

    myId = id;
    document.getElementById("myId").innerHTML = id;

    enableButton(btnJoin);

    /** Periodically get list of ids of all connected PeerJS clients on PeerJS Server: */
    //  setInterval(function() {
    //     peer.listAllPeers((l) => console.log(l))
    // }, 1000);
});


/** This event fires when your client disconnected from the _PeerJS_ Server */
peer.on('disconnected', function() {
    // Nur Connection zum Server lost
    console.warn('disconnected from PeerJS server: ' + options.host);
    alert('disconnected from PeerJS server: ' + options.host);
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
    alert('connection to PeerJS server closed');

    // disable connect to other peer button as this is no longer possible
    disableButton(btnJoin);
    // RtC still exists but as client disconnected from signaling server I guess will have to display this
    document.getElementById("myId").innerHTML = "Not Connected";

});

peer.on('error', (err) => {

    error = err;
    alert('PeerJS error:', error.message);
    console.warn('PeerJS error:', error.message);

});




//////////////////////////////  WebRTC related   ////////////////////



/** This event fires each time _another_ client contacted you (via WebRTC)  */
peer.on('connection', function(dataConnection) {
    // SUCCESS



    //console.log('received data connection from other peer: ', dataConnection.peer);
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


        // as this is a cooperative system drawing on board will only be enabled when connected to peer, so both can use that sapace
        pb.draw();



        // text about initialising board is set to hidden
        document.getElementById("placeHolderText").classList.add("hidden");

        currentPeer = WebRTCDataConnection.peer;
        joinBtnToDisconnectBtn();
        addFunctToLeaveBtn();
        changeIdOfConnectedPeerDisplayed(currentPeer);
        changeConnectionStatus();
    });

    WebRTCDataConnection.on('data', function(data) {
        //console.log('received data from other peer: ' + data);

        setTimeout(handleData(data), 1);

    });

    WebRTCDataConnection.on('close', function() {
        console.warn('WebRTCConnection to other peer was closed');
        alert('WebRTCConnection to other peer was closed');
        deleteIDOfPeerFromGui();
        disconnectToJoinBtn();
        changeConnectionStatus()
            // text about initialising board is set to visible
        document.getElementById("placeHolderText").classList.remove("hidden")
    });


}


// helper functions to handle data from incoming connection

function handleData(msg) {
    // data shall always be JSON that will be parsed here
    msG = JSON.parse(msg);

    // when using Autmoerge save()/load() I always had the problem that the msg received was an ArrayBuffer
    //and even when I tried to put it into ByteArray with the length specified by Automerge, then load did not work 

    let doc2 = Automerge.init();

    let newDoc = Automerge.from({ // initialise our shared document object containing a 'pixelBoard' property
            pixelBoard: msG.docu.pixelBoard
        }) //  fill the pixelboard with the changed pixelboard from other client


    // when I merge with existing pixelBoard then GUi does not block but result seems more inconsistent
    pb.pixelboardDocument = Automerge.merge(doc2, newDoc)


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


function connectToPeer() {
    //console.log('connectToPeer');

    let peerInputElem = document.getElementById('peerid');

    let peerid = peerInputElem.value;

    if (peerid === "") {
        alert("Sry, peer Id may not be empty");
    } else {

        try {
            WebRTCDataConnection = peer.connect(peerid)

            updateWebRTCDataConnection(WebRTCDataConnection);

        } catch {
            alert("Error connecting to peer, maybe ID was false");
        }

    }


    // scheint mir eher unnötig zu sein
    function updateWebRTCConnectionStatus() {
        console.log('updateWebRTCConnectionStatus');
        // TODO: implement
    }

}

function sendChangedDiv() {
    console.log('sendChangedDiv');



    // send the changed doc to other peer
    const msg = { docu: pb._pixelboardDocument };

    // const docString = Automerge.save(pb.pixelboardDocument)



    // console.log(pb.pixelboardDocument);
    // msg has to be serialized, I use build in JSON Support for that  
    WebRTCDataConnection.send(JSON.stringify(msg));

}