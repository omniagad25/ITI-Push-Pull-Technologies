console.log("Welcome to chat app");
var apptitle = document.getElementById("apptitle");
var content_div = document.getElementById("content");
var send_button = document.getElementById("send_button");
var message_input = document.getElementById("message");
var onlineusers = document.getElementById("onlineusers");
var privateChatDiv = document.querySelector(".privateChat");
var username = prompt("Please enter your username: ");
apptitle.innerHTML = `Chat App ${username}`;

var mywebsocket = new WebSocket("ws://localhost:8000");

mywebsocket.onopen = function () {
  var data = {
    name: username,
    login: true,
  };
  this.send(JSON.stringify(data));
};

mywebsocket.onmessage = function (event) {
  var message_content = JSON.parse(event.data);
  console.log(message_content);

  if (message_content.logout) {
    content_div.innerHTML += `<div><h3 style="color: red" class="rounded">${message_content.content}</h3></div>`;
  } else if (message_content.sender == username) {

    content_div.innerHTML += `<div style="direction: rtl;"><h4 class="d-inline-block w-auto rounded" style="background: antiquewhite;">${message_content.content}</h4></div>`;
  } else {
    if (message_content.private && message_content.private == username) {
      var privateContentDiv = document.getElementById(
        `privateContent-${message_content.sender}`
      );
      if (privateContentDiv) {
        privateContentDiv.innerHTML += `<div style="direction: rtl;"><h4 class="d-inline-block w-auto rounded" style="background: aquamarine;">${message_content.content}</h4></div>`;
      }
    } else if (!message_content.private) {

      content_div.innerHTML += `<div><h4 class="d-inline-block w-auto rounded" style="background: aquamarine;">${message_content.content}</h4></div>`;
    }
  }

  var online_users = message_content.online;
  onlineusers.innerHTML = "";
  online_users.forEach(function (user) {
    onlineusers.innerHTML += `<li style="cursor:pointer;" class="user" data-username="${user}">${user}</li>`;
  });


  var users = document.querySelectorAll(".user");
  users.forEach(function (user) {
    user.addEventListener("click", function () {
      var recipient = user.dataset.username;
      if (recipient !== username) {
        openPrivateChat(recipient);
      }
    });
  });
};

var privateChatWindows = {};

function openPrivateChat(recipient) {
  if (privateChatWindows[recipient]) {

    privateChatWindows[recipient].classList.remove("d-none");
    return;
  }


  var privateChatWindow = document.createElement("div");
  privateChatWindow.id = `privateChat-${recipient}`;
  privateChatWindow.classList.add("private-chat-window");
  privateChatWindow.innerHTML = `
      <h3>Private Chat with ${recipient}</h3>
      <div id="privateContent-${recipient}" class="private-content border rounded"></div>
      <input id="privateMessage-${recipient}" type="text" class="form-control">
      <button id="privateSend-${recipient}" class="btn btn-primary">Send</button>
  `;


  privateChatDiv.appendChild(privateChatWindow);


  var privateContentDiv = document.getElementById(
    `privateContent-${recipient}`
  );

  privateChatWindows[recipient] = privateChatWindow;


  var privateSendButton = document.getElementById(`privateSend-${recipient}`);
  privateSendButton.addEventListener("click", function () {
    var privateMessageInput = document.getElementById(
      `privateMessage-${recipient}`
    ).value;
    var data = {
      name: username,
      body: privateMessageInput,
      private: recipient,
    };
    mywebsocket.send(JSON.stringify(data));
    document.getElementById(`privateMessage-${recipient}`).value = "";

    privateContentDiv.innerHTML += `<div style="direction: rtl;"><h4 class="d-inline-block w-auto rounded" style="background: aquamarine;">${username}: ${privateMessageInput}</h4></div>`;
  });
}

mywebsocket.onerror = function (event) {
  content_div.innerHTML += `<h2 style="color:red;">Error connecting to server</h2>`;
};

send_button.addEventListener("click", function (event) {
  var usermessage = message_input.value;
  var data = {
    name: username,
    body: usermessage,
  };
  mywebsocket.send(JSON.stringify(data));
  message_input.value = "";
});
