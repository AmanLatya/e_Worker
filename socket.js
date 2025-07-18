const socketIo = require("socket.io");
const User = require("./models/User");
const Worker = require("./models/Worker");

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user is Connected " + socket.id)

        socket.on('join', async (data) => {
            const { role, userID } = data;
            if (role === 'user') {
                await User.findByIdAndUpdate(userID, {
                    socketID: socket.id
                })
            } else if (role === 'worker') {
                await Worker.findByIdAndUpdate(userID, {
                    socketID: socket.id
                })
            }
        })

        io.emit('test', "Message Recived");
        socket.on("disconnect", () => {
            console.log("User DisconnectedL: " + socket.id)
        })
    })
}


const sendMessageToSocketId = (socketId, messageObject) => {

    console.log(socketId);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}
module.exports = {
    initializeSocket,
    sendMessageToSocketId
}