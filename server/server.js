const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

let messages = [];
let users = {};

io.on('connection', socket => {
    console.log(`New connection: ${socket.id}`);

    socket.emit('previousMessages', messages);

    socket.on('login', username => {
        users[socket.id] = username;
        updateUserList();
    });

    socket.on('sendMessage', data => {
        if (data.isPrivate && data.recipientId) {
            
            socket.to(data.recipientId).emit('receivedMessage', data);
            socket.emit('receivedMessage', data);
        } else {

            messages.push(data);
            io.emit('receivedMessage', data);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        updateUserList();
        console.log(`Connection ${socket.id} disconnected.`);
    });

    function updateUserList() {
        io.emit('updateUserList', Object.entries(users).map(([id, username]) => ({ id, username })));
    }
});

const PORT = 23108;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
