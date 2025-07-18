const { io } = require("socket.io-client");

const socket = io("http://localhost:7000");

socket.on("connect", () => {
    console.log("✅ Connected to server: ", socket.id);

    // Emit the 'join' event (this is what you want to test)
    socket.emit("join", {
        role: "worker",
        userID: "6872369c6523fb489aaf7018" // put actual MongoDB ID
    });

});

socket.on("new-request", data => {
    console.log("Message Recieved");
    console.log(data);
})

socket.on("request-cancelled", data => {
    console.log("Request is cancelled");
    // console.log(data);
})

socket.on("request-completed", data => {
    console.log("Request is Complete");
    // console.log(data);
})
socket.on("disconnect", () => {
    console.log("❌ Disconnected");
});
