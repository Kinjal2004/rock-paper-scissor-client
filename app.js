const socket = io('https://rock-paper-scissor-backend-9dmr.onrender.com');

// Landing Page Elements
const landingPage = document.getElementById("landingPage");
const generateButton = document.getElementById("generateButton");
const joinIdInput = document.getElementById("joinId");
const joinButton = document.getElementById("joinButton");
let Id;
// Game Page Elements
const gamePage = document.getElementById("gamePage");
const roomIdElement = document.getElementById("roomId");
const localResElement = document.getElementById("local-res");
const localChoiceElement = document.getElementById("local-choice");
const remoteResElement = document.getElementById("remote-res");
const remoteChoiceElement = document.getElementById("remote-choice");
const buttons = document.getElementsByClassName("buttons");
const dialog = document.getElementById("winDialog");
const replay = document.getElementById("replayBtn");

let localRes = 0;
let remoteRes = 0;
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", handleClick);
}

for (let i = 0; i < buttons.length; i++) {
  buttons[i].disabled = true;
}

socket.on("joined",()=>{
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }
  document.getElementById("userJoinedId").innerHTML = "User-Joined";

const removeText = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  document.getElementById("userJoinedId").innerHTML = "";
};

removeText();
})

// Socket event listener for "generatedId"
socket.on("generatedId", (uniqueId) => {
  roomIdElement.innerHTML = uniqueId;
  Id = uniqueId;
  showGamePage()
});

// Socket event listener for "foundRoom"
socket.on("foundRoom", (roomId) => {
  roomIdElement.innerHTML = roomId;
  Id = roomId
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }
  showGamePage()
});

// Socket event listener for "noSuchRoom"
socket.on("noSuchRoom", () => {
  prompt("No such Room");
});

socket.on("disconnected",()=>{
  console.log('disconnect')
  showDialog("Your Opponent Has Disconnected")
  replay.innerHTML="Leave Room"
  replay.addEventListener("click",()=>{
    closeDialog()
    showLandingPage()
  })
})


let localChoice = null;
let remoteChoice = null;
let localChoiceReady = false;
let remoteChoiceReady = false;

function handleClick(event) {
  const clickedButton = event.target;
  const LChoice = clickedButton.innerHTML;

    // Check if local choice has already been made
    if (localChoiceReady) {
      return;  // Exit the function without further processing
    }

  socket.emit("local-choice", { LChoice, Id });
  var imageElement = document.createElement('img');
  imageElement.src = LChoice+".png";
  imageElement.style.width="120px";
  imageElement.style.height="120px";
  localChoiceElement.innerHTML = '';
  localChoiceElement.appendChild(imageElement);
  

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
  

  localChoice = LChoice;
  localChoiceReady = true;

  // Check if both choices are ready
  if (localChoiceReady && remoteChoiceReady) {
    proceedWithGame();
  } else {
   // console.log("Waiting for opponent");
  }
}

socket.on("remote-choice", (Lchoice) => {

  remoteChoice = Lchoice;
  remoteChoiceReady = true;

  // Check if both choices are ready
  if (localChoiceReady && remoteChoiceReady) {
    proceedWithGame();
  } else {
    //console.log("Waiting for opponent");
  }
});

function proceedWithGame() {
  var imageElement2 = document.createElement('img');
  imageElement2.src = remoteChoice+".png";
  imageElement2.style.width="120px"
  imageElement2.style.height= "120px"
  remoteChoiceElement.innerHTML = '';
  remoteChoiceElement.appendChild(imageElement2)

  if (localChoice === remoteChoice) {
    // It's a tie
  } else if (
    (localChoice === "Rock" && remoteChoice === "Scissor") ||
    (localChoice === "Paper" && remoteChoice === "Rock") ||
    (localChoice === "Scissor" && remoteChoice === "Paper")
  ) {
    // Local wins
    localRes++;
  } else  if (
    (localChoice === "Scissor" && remoteChoice === "Rock") ||
    (localChoice === "Rock" && remoteChoice === "Paper") ||
    (localChoice === "Paper" && remoteChoice === "Scissor")
  ) {
    // Remote wins
    remoteRes++;
  }

  remoteResElement.innerHTML = "Remote: " + remoteRes;
  localResElement.innerHTML = "Local: " + localRes;

  if (localRes === 3) {
    showDialog("You Won");
  } else if (remoteRes === 3) {
    showDialog("Your Opponent Won");
  }

  setTimeout(() => {
    // Enable all buttons
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
    }
    // Reset choices and flags
    localChoiceElement.innerHTML = "";
    remoteChoiceElement.innerHTML = "Loading...";
    localChoice = null;
    remoteChoice = null;
    localChoiceReady = false;
    remoteChoiceReady = false;
    console.log("ran")
  }, 1000);
}

socket.on("replay-requested", () => {
  document.getElementById("replayMessage").innerHTML = "Replay Requested";

  replay.addEventListener("click", () => {
    socket.emit("approved", Id);
    closeDialog();
    localRes = 0;
    remoteRes = 0;
    remoteResElement.innerHTML = "Remote: " + remoteRes;
    localResElement.innerHTML = "Local: " + localRes;
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
    }
  });
});

replay.addEventListener("click", () => {
  socket.emit("replay-request", Id);
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
});

socket.on("replay-approved", () => {
  closeDialog();
  localRes = 0;
  remoteRes = 0;
  remoteResElement.innerHTML = "Remote: " + remoteRes;
  localResElement.innerHTML = "Local: " + localRes;
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }
  
  replay.addEventListener("click", () => {
    socket.emit("replay-request", Id);
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  });
});





// Function to show the game page
function showGamePage() {
  landingPage.style.display = "none";
  gamePage.style.display = "block";
}

function showLandingPage(){
  landingPage.style.display="block";
  gamePage.style.display="none";
}

// Function to show the win dialog
function showDialog(message) {
  dialog.showModal()
  document.getElementById("winMessage").innerHTML = message;
}

// Function to close the win dialog
function closeDialog() {
  dialog.close()
  document.getElementById("replayMessage").innerHTML=""
}

// Socket event listener for "generateRoom"
generateButton.addEventListener("click", () => {
  socket.emit("generateRoom");
  dialog.removeAttribute("open");
});

// Socket event listener for "joinRoom"
joinButton.addEventListener("click", () => {
  const roomId = joinIdInput.value;
  socket.emit("joinRoom", roomId);
});
