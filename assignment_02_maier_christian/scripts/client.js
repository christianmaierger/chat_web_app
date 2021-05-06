let userNameList = [];
let ws = null;
let userName;




function connect() {
    ws = new WebSocket("ws://localhost:8080");
    ws.onmessage = msg => handleMessage(msg);
    setTimeout(initializeUserList, 100);
}

function disconect() {

    //Join Chat button will be graphically disabled
    disableButton(document.getElementById("msgButton"));

    //Leave Chat Button becomes invisible
    document.getElementById("btnLeave").classList.add("hidden");

    //make JoinButton look enabled
    enableButton(document.getElementById("btnJoin"));

    // event listener muss wieder erzeugt werden, da er immer nu einmal funktioniert, damit der button dann dissabled ist
    nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event.target) }, { once: true });
}


function initializeUserList() {

    const msg = { str: "init", name: userName };

    ws.send(JSON.stringify(msg));

}


function sendAndAddUser(elem) {

    let userNameInputElem = document.getElementById('chatname');
    userName = userNameInputElem.value;

    let listItem = document.createElement('li');
    listItem.innerHTML = userName.trim();


    if (userNameList.size != 0 && (userNameList.includes(userName) || userName === "")) {
        console.log("Sry UserName is already used or empty, choose another");

        // event listener muss wieder erzeugt werden, da er immer nu einmal funktioniert, damit der button dann dissabled ist
        nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event) }, { once: true });
    } else {
        document.getElementById('memberList').appendChild(listItem);


        // festhalten genau der Name ist vergeben
        userNameList.push(userName);

        // print new user to console, guess in the end server must push this to all clients
        document.getElementById("chat").value += "\nA new user named " + userName + " joined the chat";

        // send an object containing message and userName
        const msg = { str: "newClient", name: userName };

        // msg has to be serialized, I use build in JSON Support for that
        ws.send(JSON.stringify(msg));

        //Join Chat button will be graphically disabled
        disableButton(elem);

        //Leave Chat Button becomes visible
        document.getElementById("btnLeave").classList.remove("hidden");

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
    }

    if (msg.str == "" || msg.str == null) {
        alert("msg was null or empty");
    }

    if (msg.error != undefined) {
        alert(msg.error);
    }

    // only for initial list
    if (msg.str == "list") {


        let membersList = document.getElementById("memberList");

        //let membersINHTML = document.getElementById("memberList").getElementsByTagName("li");
        console.log(msg.list);

        userNameList = msg.list;

        // fill user lsit in html
        for (const elem of msg.list) {
            listPoint = document.createElement("li");
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
        liContent = document.createTextNode(msg.name);
        listPoint.appendChild(liContent);
        membersList.appendChild(listPoint);

        // print new user to console
        document.getElementById("chat").value += "\nA new user named " + msg.name + " joined the chat";

    }
    if (msg.str == "addMessage") {




        // print new message to console
        document.getElementById("chat").value += "\n" + msg.name + ": " + msg.content;

    }

}


document.addEventListener("DOMContentLoaded", connect);

nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event.target) }, { once: true });
msgButtonListener = document.getElementById('msgButton').addEventListener('click', showAndSendMessage);
document.getElementById("btnLeave").addEventListener('click', disconect);