/**
 *  Assignment 5: Create a simple peer-to-peer video chat application
 *
 *  Please provide methods to connect to the other peer.
 *  The start video call button shall only be enabled, if (1) we are connected to another peer and (2) we found a camera & microphone on this computer.
 *  Please also provide methods and UI elements to hang up the call (gracefully).
 * 
 *  See: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 *  See: https://peerjs.com/docs.html#api
 */


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



// Global state variables
var mouseIsDown = false
var pixelChanged;
let audioAvailable = false;
let videoAvailable = false;
let localStream = null;
let remoteStream = null;
let connectedToPeerJSServer = false;
let call = null;
let remotePeerId = null;
let myId;
let WebRTCDataConnection;
let doc;
let pb = new PixelBoard();







// UI (DOM) elements
let btnLeave = document.getElementById("btnLeave");
let btnSendMsg = document.getElementById("btnSend");
const btnJoin = document.getElementById("btnJoin");
const localVideo = document.getElementById("videoLocal");
const remoteVideo = document.getElementById("videoRemote");
const videoBtn = document.getElementById("videoBtn");
videoBtn.disabled = true;
const waitingText = document.getElementById("waitingText");
const peerid = document.getElementById('peerid');
peerid.value = '';


//////////////////////////////  PeerJS Setup  ////////////////////

const options = {
    //host: 'localhost',
   /*  If you DON'T specify 'host' and 'key' options, you will automatically connect to
    PeerServer Cloud service. Please be aware that you will be sharing it with other 
    people and IDs may collide if you set them manually. */
   // host: 'scml.hci.uni-bamberg.de',
    //port: 9000,
    //path: '/chat'
}

/** Connect with a PeerJS server */
const peer = new Peer(options);


//////////////////////////////  PeerJS Server related   ////////////////////

/** This event fires when your client connected successfully with a _PeerJS_ Server (via HTTP) */
peer.on('open', function(id) {
    connectedToPeerJSServer = true;
    console.log('My peer ID is: ' + id);
    myId = id;
    document.getElementById('myId').textContent = myId;
    enableButton(btnJoin);
});



/** This event fires when your client disconnected from the _PeerJS_ Server */
peer.on('disconnected', function() {
    console.warn('disconnected from PeerJS server: ' + options.host);
    // RtC still exists but as client disconnected from signaling server I guess will have to display this
    document.getElementById("myId").innerHTML = "Not Connected";
    // disable connect to other peer button as this is no longer possible
    disableButton(btnJoin);
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
    console.log('peer error:', err.type, err.message);
    switch (err.type) {
        case "server-error":
            alert('Could not connect to signaling server');
            break;
        case "network":
            alert('Disconnected from signaling server');
            connectedToPeerJSServer = false;
            if (!localStream) {
                // Disable button if there is no ongoing video stream
                videoBtn.disabled = true;
            }
            break;
        default:
            alert(err.message);
    }
})


//////////////////////////////  WebRTC related   ////////////////////

/** This event fires each time _another_ client contacted you (via WebRTC)  */
peer.on('connection', function(con) {
    //console.log('received data connection from other peer: ', dataConnection.peer);
    WebRTCDataConnection = con;
    joinBtnToDisconnectBtn();
    addFunctToLeaveBtn();
    remotePeerId = WebRTCDataConnection.peer;
    updateWebRTCDataConnection(WebRTCDataConnection);

});

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

        checkAvailableMediaDevices();
        
        remotePeerId = WebRTCDataConnection.peer;
        joinBtnToDisconnectBtn();
        addFunctToLeaveBtn();

        changeIdOfConnectedPeerDisplayed(remotePeerId);
        changeConnectionStatus();

         enableButton(btnSendMsg);
    });

    WebRTCDataConnection.on('data', function(data) {
        console.log('received data from other peer: ' + data);

        setTimeout(handleData(data), 1);

    });

    WebRTCDataConnection.on('close', function() {
        console.warn('WebRTCConnection to other peer was closed');
        alert('WebRTCConnection to other peer was closed');
        deleteIDOfPeerFromGui();
        disconnectToJoinBtn();
        changeConnectionStatus()

         //clear the pixelboard
        document.getElementById("pixelboard").innerHTML = "";
        pb.pixelBoard = new PixelBoard();
        // text about initialising board is set to visible
        document.getElementById("placeHolderText").classList.remove("hidden")
    });

}

function handleData(msg) {
    // data shall always be JSON that will be parsed here
   
    // when using Autmoerge save()/load() I always had the problem that the msg received was an ArrayBuffer
    //and even when I tried to put it into ByteArray with the length specified by Automerge, then load did not work 
    /*   var buf = new ArrayBuffer(msg.length); // 1 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=msg.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
let arr = new Uint8Array(buf);
 let newDoc = Automerge.load(bufView);
 console.log(newDoc); */
 message = JSON.parse(msg);
 if ( message.docu != undefined) {
   let doc2 = Automerge.init();
   let newDoc = Automerge.from({ // initialise our shared document object containing a 'pixelBoard' property
           pixelBoard: message.docu.pixelBoard
     }) //  fill the pixelboard with the changed pixelboard from other client

    // when I merge with existing pixelBoard then GUi does not block but result seems more inconsistent
    pb.pixelboardDocument = Automerge.merge(doc2, newDoc)
 } else  {
  document.getElementById("messages").value += "\n" + remotePeerId + ": " + message;
 }
}

function sendChangedDiv() {
    console.log('sendChangedDiv');

    // send the changed doc to other peer
    const msg = { docu: pb._pixelboardDocument };
    // const docString = Automerge.save(pb.pixelboardDocument)
     console.log(pb.pixelboardDocument);
    // msg has to be serialized, I use build in JSON Support for that  
    WebRTCDataConnection.send(JSON.stringify(msg));

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

         jsonObj = { msg: chatMSG };

        WebRTCDataConnection.send(JSON.stringify(chatMSG));
    }
}


// call from other peer
peer.on('call', function(call) {
    console.log('got call from other peer');
    // ask user for permission before accepting the call
    if (localStream == null && confirm(`Incoming call from peer ${call.peer} - do you accept?`)) {
        // Start local stream and then answer the call
        console.log("start stream will be called ");
        startStream().then(() => call.answer(localStream));
        console.log("start stream  called ");
    } else {
        // Already accepted before - just answer the call and show remote if not already shown
        call.answer(localStream);
        if (!remoteStream) {
            console.log("other stream should start because took too long");
            call.on('stream', function(_remoteStream) {
                showRemoteStream(_remoteStream);
            });
        }
    }

    // disable remote video if call was closed by other peer
    call.on('close', function() {
        console.log('call was closed');
        remoteVideo.srcObject = null;
        remoteVideo.style.display = "none";
        remoteStream = null;
        stopStream();
    });


    call.on('stream', function(_remoteStream) {
        console.log(" stream incoming other stream should start");
        showRemoteStream(_remoteStream);

    });
});

function connectToOtherPeer() {
    let peerInputElem = document.getElementById('peerid');
    let peerid = peerInputElem.value;

    if (peerid === "") {
        alert("Sry, peer ID may not be empty");
    } else if (peerid === myId ){
        alert("Sry, peer ID may not be own ID");
    }  
    else {
        try {
            WebRTCDataConnection = peer.connect(peerid)
            updateWebRTCDataConnection(WebRTCDataConnection);
        } catch {
            alert("Error connecting to peer, maybe ID was false");
        }
    }
}

//////////////////////////////  UI related   ////////////////////

// Add event listener to UI components
videoBtn.addEventListener("click", toggleVideo);
btnJoin.addEventListener("click", connectToOtherPeer);
btnSendMsg.addEventListener("click", sendMsg);


// helper functions to change gui elements
function deleteIDOfPeerFromGui() {
    document.getElementById("connectedPeers").innerHTML = "No peer connected";
    document.getElementById("peerid").value = "";
}

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

function addFunctToLeaveBtn() {
    btnLeave.addEventListener("click", function() {
        WebRTCDataConnection.close();
        //   changeIdOfConnectedPeerDisplayed("No peer connected");
        disconnectToJoinBtn();
        //  changeConnectionStatus();
    }, { once: true });
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

function toggleVideo() {
    if (localStream == null) {
        startStream();
    } else {
        stopStream();
    }
}

document.getElementById('peerid').addEventListener("keydown", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();

        // Trigger the button element with a click
        btnJoin.click();
      //  setTimeout(document.getElementById('chatname').value = "", 1000);
    }
});

document.getElementById('myMessage').addEventListener("keydown", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();

        // Trigger the button element with a click
       btnSendMsg.click();
      //  setTimeout(document.getElementById('myMessage').value = "", 1000);
    }
});


/**
 * Please mind: this is an asynchronous function!
 * Rember that async funtions are dispatched via the microtask queue (Complementary II)
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 * See: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
 */
async function checkAvailableMediaDevices() {
    // TODO: get device list and check if audio or video inputs are available

    const promise = navigator.mediaDevices.enumerateDevices().then((devices) => {
        console.log(devices);
        for (const device of devices) {
            if (device.kind == "audioinput") {
                audioAvailable = true;
            }
            if (device.kind == "videoinput") {
                videoAvailable = true;

            }
        }
    });

    promise.then(function() {
        if (audioAvailable || videoAvailable) {

            console.log("btnEnabled");
            videoBtn.disabled = false;
            enableButton(videoBtn);
        } else {
            alert("Sry no Audio or Video Input Device availible");
        }
    });
}

function showRemoteStream(stream) {
    remoteStream = stream;
    remoteVideo.style.display = "block"
    console.log("remote stream should be set");
    remoteVideo.srcObject = stream;
}

/**
 * Please mind: this is an asynchronous function!
 * Rember that async funtions are dispatched via the microtask queue (Complementary II)
 * 
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 * See: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
 */
async function startStream() {
    console.log("start stream");
    if (!connectedToPeerJSServer) {
        console.error("need connection to server to find other peer by ID");
        return;
    }

    const constraints = { audio: audioAvailable, video: videoAvailable }
    try {

        // TODO: get local video stream AND add it to the local video html element
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = localStream;

        console.log("got stream:", localStream);
        // show video element
        localVideo.style.display = "block"

        // disable audio for local video feed
        localVideo.muted = true;

        waitingText.style.display = "block";
        videoBtn.textContent = "Hang up"

        console.log(remoteStream + " " + remotePeerId);

        if (remoteStream == null && remotePeerId) {
            // TODO: call other peer by ID
            call = peer.call(remotePeerId, localStream);
            // TODO: listen for stream event for this call AND show remote stream if event was fired
            console.log(remoteStream + " " + remotePeerId);
            call.on("call", function(call) {
                call.answer(localStream);
                call.on('stream', function(_remoteStream) {
                    showRemoteStream(_remoteStream);

                });
                // disable remote video if call was closed by other peer
                call.on('close', function() {
                    console.log('call was closed');
                    remoteVideo.style.display = "none";
                   remoteStream = null;
                    stopStream();
                });

            });
        }
    } catch (err) {
        console.error(err);
    }
}





function stopStream() {
    console.log('stop all streams');
    waitingText.style.display = "none";

    localVideo.srcObject = null;
    localVideo.style.display = "none";

    remoteVideo.srcObject = null;
    remoteVideo.style.display = "none";

    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;

    if (call) {
        console.log("closing call");
        call.close();
        call = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
        remoteStream = null;
    }

    videoBtn.textContent = "Start video call"
    if (!connectedToPeerJSServer) {
        videoBtn.disabled = true;
    }
}