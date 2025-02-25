import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Card, CardUpdateData } from "./types";
import http from 'http';
import { validateCardIndex, fetchRandomCard } from './utils';
import { RateLimiter } from './rateLimiter';

const server = http.createServer();
const cardLimit = parseInt(process.env.CARD_LIMIT || '50', 10);
const rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

let cards: Card[] = [];

io.on('connection', (socket) => {
    socket.emit('cards', cards);

    console.log('a user connected');

    socket.on('newCard', async () => {
        if (!rateLimiter.tryRequest(socket.id)) {
            socket.emit('error', 'Rate limit exceeded. Please wait before requesting more cards.');
            return;
        }

        console.log('Generating new card');
        console.log("Requested by socket: ", socket.id);
        
        try {
            const card = await fetchRandomCard();

            if (!card) {
                socket.emit('error', 'Failed to fetch card');
                return;
            }

            cards.push(card);

            if (cards.length > cardLimit) {
                cards = [];
                socket.emit('warning', 'Card limit reached. Resetting cards.');
            }

            io.emit('cards', cards);

        } catch (error) {
            console.error('Error fetching card:', error);
            socket.emit('error', 'Internal server error');
        }
    });

    socket.on('clear', async () => {
        console.log('Clearing all cards');
        cards = [];
        io.emit('cards', cards);
    });

    socket.on('tap', (updateData: { index: number }) => {
        const index = updateData.index;
        console.log(`Card ${index} tapped`);

        if (!validateCardIndex(index, cards.length)) {
            console.error('Invalid card index');
            return;
        }

        cards[index].tapped = !cards[index].tapped;

        io.emit('cards', cards);
    });

    socket.on('cardPositionChange', (updateData: CardUpdateData) => {
        const { index, x, y } = updateData;
        console.log(`Card ${index} position changed to (${x}, ${y})`);

        if (!validateCardIndex(index, cards.length)) {
            console.error('Invalid card index');
            return;
        }

        cards[index].x = x;
        cards[index].y = y;

        io.emit('cards', cards);
    });
});

server.listen(3000, "0.0.0.0", () => {
    console.log('Server is running on port 3000');
});
