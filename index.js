const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
  }
});

const PORT = 3100;

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.use((socket, next) => {
  const username = socket.handshake.auth.userName;
  console.log('Username: ', username, ' connecting');
  if(!username) {
    return next(new Error('invalid username'));
  }
  socket.username = username;
  next();
});

io.on('connection', (socket) => {
  // fetch existing users and send to client
  const users = [];
  // io.of('/').sockets is a Map of all currently connected Socket instances indexed by ID
  for(let [id, socket] of io.of('/').sockets) {
    users.push({userID: id, username: socket.username});
  }
  console.log('Emitting users: ', users);
  // Send userlist upon a socket connection
  socket.emit("users", users);
  // Send userlist to all clients on every connections?
  // io.emit('users', users);

  // Notify existing users
  socket.broadcast.emit('user connected', {userID: socket.id, username: socket.username});

  // Forward the msg to the right recipient
  socket.on('private message', ({contet, to}) => {
    socket.to(to).emit('private message', {content, from: socket.id});
  });

  // Notify users on disconnection
  socket.on('disconnect', () => {
    socket.broadcast.emit('user disconnected', socket.id);
    console.log(`${socket.username} has disconnected`);
  })
});

server.listen(PORT, () => {
  console.log('Listening on port: ', PORT);
});