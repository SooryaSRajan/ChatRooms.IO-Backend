const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors')
app.use(cors())
let myMap = new Map();
const port = process.env.PORT || 4040;

/**
 * Socket initialized
 */

const io = require('socket.io')(server, {
    cors: '*:*',
    'pingTimeout': 10000
});

/**
 * Generates a unique id when requested by client
 */

function generateId() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/**
 * Returns a unique id when requested by client
 */

app.post('/generate_id', (req, res) => {
    res.send(generateId());
});

io.on('connection', (socket) => {

    console.log('a user connected, client id: ' + socket.id);

    /**
     * Adds user to a channel when the user becomes active and joins the room
     */

    socket.on('join', (lobbyId, name) => {
        socket.join(lobbyId)
        let data = {
            name: name,
            lobbyId: lobbyId,
        }

        /**
         * Maintaining user data to later notify user disconnection
         */
        myMap.set(socket.id, data);
        socket.to(lobbyId).emit('message', name + ' joined', 'center', '')
    })

    /**
     * Called when user disconnected, emits data to other clients in the channel
     */

    socket.on('disconnect', () => {
        let data = myMap.get(socket.id)
        myMap.delete(socket.id)
        io.to(data.lobbyId).emit('message', data.name + ' left', 'center', '')
        console.log("User disconnected ")
    })


    /**
     * Called when clients sends a message, emits message to other clients in the channel
     */

    socket.on('message', (name, position, message, id) => {
        socket.to(id).emit('message', name, position, message)
    })
});

server.listen(port, () => {
    console.log('listening on: ', port);
});