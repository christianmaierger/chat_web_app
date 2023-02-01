let userNameList = [];
let ws = null;
let userName;
let userNameLi;
let nameButtonListener;


function connect() {
    try {
        ws = new WebSocket("ws://localhost:8080");
        ws.onmessage = msg => handleMessage(msg);
        setTimeout(initializeUserList, 100);
        enableButton(document.getElementById("btnJoin")); 
    } catch (error) {
        alert("Unfortunatelly an error connecting occured - Server might not be running properly right now");
    }
}

function disconnect() {

    //send msg button will be graphically disabled
    disableButton(document.getElementById("msgButton"));

    //Leave Chat Button becomes invisible
    document.getElementById("btnLeave").classList.add("hidden");

    //make JoinButton look enabled
    enableButton(document.getElementById("btnJoin"));

    // event listener muss wieder erzeugt werden, da er immer nu einmal funktioniert, damit der button dann dissabled ist
    nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event.target) }, { once: true });

    userNameLi.parentNode.removeChild(userNameLi);

    let msg = { name: userName, str: "deleteClient" }
    ws.send(JSON.stringify(msg));
}


function initializeUserList() {

    const msg = { str: "init", name: userName };
    ws.send(JSON.stringify(msg));
}

// elem is the element/btn triggering the function
function sendAndAddUser(elem) {

    userName = document.getElementById('chatname').value;

    let listItem = document.createElement('li');
    listItem.innerHTML = userName.trim();


    if ( (userNameList.length != 0 && userNameList.includes(userName)) || userName === "") {
        console.log("Sry UserName is already used or empty, choose another");

        // event listener muss wieder erzeugt werden, da er immer nur einmal funktioniert, damit der button dann dissabled ist
        nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event.target) }, { once: true });
    } else {
        // save elem with username to delete it easily when disconnecting
        userNameLi = document.getElementById('memberList').appendChild(listItem);
        console.log(" this is elem/btn: " + elem);

        userNameLi.setAttribute("id", elem);

        // festhalten genau der Name ist vergeben
        userNameList.push(userName);

        // print new user to console, server must push this to all clients
        document.getElementById("chat").value += "\nA new user named " + userName + " joined the chat";

        // send an object containing message and userName
        const msg = { str: "newClient", name: userName };

        // msg has to be serialized, I use build in JSON Support for that
        ws.send(JSON.stringify(msg));

        //Join Chat button will be graphically disabled
        disableButton(elem);

        //Leave Chat Button becomes visible
        document.getElementById("btnLeave").classList.remove("hidden");

        setTimeout(document.getElementById('chatname').value = "", 1000);

        //make msgButton look enabled
        enableButton(document.getElementById("msgButton"));
    }
}

function showAndSendMessage() {
    let chatInputElem = document.getElementById('message');
    let chatMSG = chatInputElem.value;

    chatMSG = chatMSG.trim();
    // append msg to chatArea
    document.getElementById("chat").value += "\n" + userName + ": " + chatMSG;

    const msg = { str: "newMessage", name: userName, chat: chatMSG };
    // msg has to be serialized, I use build in JSON Support for that
    ws.send(JSON.stringify(msg));
    setTimeout(document.getElementById('chatname').value = "", 1000);
}

function disableButton(elem) {
    console.log(elem);
    elem.classList.add("button_disabled");
}

function enableButton(elem) {
    console.log(elem);
    elem.classList.remove("button_disabled");
}

function handleMessage(msg) {
    console.log('[client] got message from server:', msg.data);

    try {
        msg = JSON.parse(msg.data);
    } catch (e) {
        console.log("[client] error parsing JSON file to Object");
        if (msg.error != undefined) {
            alert(msg.error);
        }
    } 
    
    if (msg.str == "" || msg.str == null) {
        alert("msg was null or empty");
    }

    // only for initial list
    if (msg.str == "list") {

        let membersList = document.getElementById("memberList");
        userNameList = msg.list;

        // fill user list in html
        for (const elem of msg.list) {
            listPoint = document.createElement("li");
            listPoint.setAttribute("id", elem);
            liContent = document.createTextNode(elem);
            listPoint.appendChild(liContent);
            membersList.appendChild(listPoint);
        }
        // append msg history from server to chatArea
        for (const it of msg.history) {
            document.getElementById("chat").value += "\n" + it.user + ": " + it.msg;
        }
    }

    // when client is already registered and a new user joins
    if (msg.str == "addUser") {
        let membersList = document.getElementById("memberList");
        userNameList.push(msg.name);

        listPoint = document.createElement("li");
        listPoint.setAttribute("id", msg.name);
        liContent = document.createTextNode(msg.name);
        listPoint.appendChild(liContent);
        membersList.appendChild(listPoint);

        // print new user to console
        document.getElementById("chat").value += "\nA new user named " + msg.name + " joined the chat";

    }
    if (msg.str == "addMessage") {
        // print new message to console
        document.getElementById("chat").value += "\n" + msg.time + " from " + msg.name + ": " + msg.content;
    }
    if (msg.str == "deleteClient") {

        let elem = document.getElementById(msg.name);
        elem.parentElement.removeChild(elem);
    }
}


document.addEventListener("DOMContentLoaded", connect);

document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event.target) }, { once: true });
document.getElementById('msgButton').addEventListener('click', showAndSendMessage);


// event lsiteners for chatname and message field, so hitting enter will trigger sending of the input string
document.getElementById('chatname').addEventListener("keydown", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.key === 'Enter') {
        // Cancel the default action, if needed
        event.preventDefault();

        // Trigger the button element with a click
        document.getElementById("btnJoin").click();
        setTimeout(document.getElementById('chatname').value = "", 1000);
    }
});

document.getElementById('message').addEventListener("keydown", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.key === 'Enter') {
        // Cancel the default action, if needed
        event.preventDefault();

        // Trigger the button element with a click
        document.getElementById("msgButton").click();
        // clear message field after sending trough triggereing send btn
        setTimeout(document.getElementById('message').value = "", 1000);
    }
});

document.getElementById("btnLeave").addEventListener('click', disconnect);