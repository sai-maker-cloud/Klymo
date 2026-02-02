require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {DatabaseConnection} = require("./utils/database");
const http = require('http');
const {Server} = require('socket.io');
const cookieParser = require('cookie-parser');
const {QueueMatchmaking} = require("./utils/QueueMatchmaking");
const {router} = require("./routes/index.routes");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_SIDE_URL,
    credentials: true
}))

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_SIDE_URL,
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_queue", (userData) => {
        socket.userId = userData.userId;
        socket.deviceId = userData.deviceId;
        socket.username = userData.username; 
        socket.bio = userData.bio;           
        socket.interests = userData.interests;

        QueueMatchmaking.addUser(socket);
    });

    socket.on("requeue", () => {
        console.log(`User ${socket.id} requested new match`);
        QueueMatchmaking.deleteUser(socket);
        QueueMatchmaking.addUser(socket);
    });

    socket.on("send_message", (data) => {
        if (data.roomId) {
            socket.to(data.roomId).emit("receive_message", data);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
        QueueMatchmaking.deleteUser(socket);
    });
});

app.use("/api",router)

app.set("io",io);
DatabaseConnection(server);