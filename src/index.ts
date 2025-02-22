import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Card, CardUpdateData } from "./types";
import express from 'express';
import path from 'path';

const app = express();
const server = require('http').createServer(app);

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: '*'
    }
});

let cards: Card[] = []

app.use(express.static(path.join(__dirname, '../ui/dist')));

io.on('connection', (socket) => {
    socket.emit('cards', cards);


    console.log('a user connected');

    socket.on('newCard', async () => {
        console.log('Generating new card');
        console.log("Requested by socket: ", socket.id);
        try {
            const response = await fetch('https://api.scryfall.com/cards/random');
            const cardJSON = await response.json();

            cards.push({
                url: cardJSON.image_uris.png,
                name: cardJSON.name,
                x: 0,
                y: 0,
                locked: false
            });

            console.log(cards);
            socket.emit('cards', cards);
        } catch (error) {
            console.error('Error fetching card:', error);
        }
    })

    socket.on('cardPositionChange', (updateData: CardUpdateData ) => {
        const { index, x, y } = updateData;
        console.log(`Card ${index} position changed to (${x}, ${y})`);

        //! Need better validation
        if(index < 0 || index >= cards.length) {
            console.error('Invalid card index');
            return;
        }

        cards[index].x = x;
        cards[index].y = y;

        io.emit('cards', cards);
    });
});



server.listen(3000, () => {
    console.log('Server is running on port 3000');
});