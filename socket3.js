const { io } = require("socket.io-client");

const socket = io("http://localhost:7000");

socket.on("connect", () => {
  console.log("✅ Connected to server: ", socket.id);

  // Emit the 'join' event (this is what you want to test)
  socket.emit("join", {
    role: "user",
    userID: "687249b1183b96638abdf755" // put actual MongoDB ID
  });
});

socket.on("request-accepted", data => {
  console.log("Your Request is accepted")
  console.log(data);
})

socket.on("request-confirm", data => {
  console.log("Your Request is Confirm")
  console.log(data);
})
socket.on("request-cancelled", data => {
  console.log("Your Request is cancel")
  // console.log(data);
})

socket.on("request-completed", data => {
  console.log("Your Request is Complete")
  // console.log(data);
})
socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
