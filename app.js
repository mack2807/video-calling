const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const socketIO = require('socket.io');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
    path: "/socket"
});

// Set up PeerJS server using ExpressPeerServer and attach to the same server
const peerServer = ExpressPeerServer(server, {
    path: "/peerjs",
    proxied: true // required if behind a proxy like Heroku
});

// Attach PeerJS server to Express app
app.use('/peerjs', peerServer);

// Handle Socket.IO connections
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });

        socket.on('chat', (content) => {
            socket.broadcast.to(roomId).emit('new-message', content);
        });
    });
});

// Set port for the combined server
const port = process.env.PORT || 3002;
server.listen(port, () => console.log(`Server listening on port ${port}`));
