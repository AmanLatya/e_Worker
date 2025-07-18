const { io } = require("socket.io-client");

const socket = io("http://localhost:7000");

socket.on("connect", () => {
    console.log("✅ Connected to server: ", socket.id);

    // Emit the 'join' event (this is what you want to test)
    socket.emit("join", {
        role: "worker",
        userID: "687237506523fb489aaf7021" // put actual MongoDB ID
    });

});

socket.on("new-request", data => {
    console.log("Message Recieved")
    console.log(data);
})
socket.on("disconnect", () => {
    console.log("❌ Disconnected");
});
