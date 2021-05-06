let userNameList = [];
let ws = null;




function connect() {
    ws = new WebSocket("ws://localhost:8080");
    ws.onmessage = msg => handleMessage(msg);
    alert("Connected!");
}


function initializeUserList() {

    let membersList = document.getElementById("memberList").getElementsByTagName("li");


    setTimeout(() => { ws.send("list") }, 1000);

    let i = 0;
    for (const elem of membersList) {
        userNameList[i] = elem.innerText;
        i++;
    }

}



function sendAndAddUser(event) {

    let userNameInputElem = document.getElementById('chatname');
    let userName = userNameInputElem.value;

    let listItem = document.createElement('li');
    listItem.innerHTML = userName.trim();


    if (userNameList.includes(userName) || userName === "") {
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

        //Join Chat button hiden
        disableButton(event);
    }



}

function disableButton(event) {
    let elem = event.target;
    console.log(elem);
    elem.classList.add("button_disabled");
}



function handleMessage(msg) {
    console.log('[client] got message from server:', msg);



    try {
        let msg = JSON.parse(msg);
    } catch (e) {

    }


    if (msg.str == "" || msg.str == null) {
        alert("Alarm");
    }

    if (msg.str == "list") {

        if (userNameList.includes(msg.user)) {

        }

        for (const iterator of userNameList) {

        }

    }

    if (msg.str == "list") {
        alert("Alarm");
    }

}


document.addEventListener("DOMContentLoaded", connect);

nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAddUser(event) }, { once: true });