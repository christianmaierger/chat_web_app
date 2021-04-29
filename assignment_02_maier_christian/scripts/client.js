let userNameList = [];
let ws;


function initializeUserList() {
    let membersList = document.getElementById("memberList").getElementsByTagName("li");


    let i = 0;
    for (const elem of membersList) {
        userNameList[i] = elem.innerText;
        i++;
    }

}


function sendAndAdd(event) {

    let userNameInputElem = document.getElementById('chatname');
    let userName = userNameInputElem.value;

    let listItem = document.createElement('li');
    listItem.innerHTML = userName.trim();


    if (userNameList.includes(userName) || userName === "") {
        console.log("Sry UserName is already used or empty, choose another");

        // event listener muss wieder erzeugt werden, da er immer nu einmal funktioniert, damit der button dann dissabled ist
        nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAdd(event) }, { once: true });
    } else {
        document.getElementById('memberList').appendChild(listItem);
        ws = new WebSocket("ws://localhost:8080");
        ws.onmessage = msg => console.log(msg.data)


        // festhalten genau der Name ist vergeben
        userNameList.push(userName);

        //Join Chat button hiden
        disableButton(event);
    }



}

function disableButton(event) {

    let elem = event.target;
    console.log(elem);
    elem.classList.add("button_disabled");


}

document.addEventListener("DOMContentLoaded", initializeUserList());

nameButtonListener = document.getElementById('btnJoin').addEventListener('click', (event) => { sendAndAdd(event) }, { once: true });