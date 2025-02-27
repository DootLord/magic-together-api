import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Card, CardUpdateData, IDeckInfo } from "./types";
import http from 'http';
import { fetchCard, validateCardIndex } from './utils';
import { RateLimiter } from './rateLimiter';

const server = http.createServer();
const cardLimit = parseInt(process.env.CARD_LIMIT || '50', 10);
const rateLimiter = new RateLimiter(
    parseInt(process.env.NEW_CARD_PER_MINUTE || '50'), // 50 requests per minute by default
    60000);

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
let decks: string[][] = [];
// deckList is a reference to a deck in the decks array
let decksInfo: IDeckInfo[] = [];

function parseCardListEntry(cardLine: string): string[] {
    const trimmedLine = cardLine.trim(); // Remove leading/trailing whitespace
    if (!trimmedLine) return []; // Skip empty lines

    // Parse the count and card name
    const [countStr, ...cardNameParts] = trimmedLine.split(/\s+/);
    const count = parseInt(countStr); // NaN if count is not a number, make sure we're actually using a number

    if (isNaN(count) || cardNameParts.length === 0) return []; // Skip invalid lines

    const cardName = cardNameParts.join(' '); // Rejoin the card name parts
    return new Array(count).fill(cardName); // Create an array of length count, filled with cardName
}

io.on('connection', (socket) => {
    socket.emit('cards', cards);

    console.log('a user connected');

    async function createNewCard(name: string) {
        try {
            const card = await fetchCard(name);

            if (!card) {
                socket.emit('error', 'Failed to fetch card. Make sure the card name is correct.');
                return;
            }

            cards.push(card);

            if (cards.length > cardLimit) {
                cards = [];
                // socket.emit('warning', 'Card limit reached. Resetting cards.');
            }

            io.emit('cards', cards);

        } catch (error) {
            console.error('Error fetching card:', error);
            socket.emit('error', 'Failed to fetch card. Make sure the card name is correct.');
        }
    }

    socket.on('newCard', async (cardData: { name?: string }) => {
        if (!rateLimiter.tryRequest(socket.id)) {
            // socket.emit('error', 'Rate limit exceeded. Please wait before requesting more cards.');
            return;
        }

        console.log('Generating new card');
        console.log("Requested by socket: ", socket.id);

        await createNewCard(cardData.name || 'Island');
    });

    // Cards should be a new line separated list of card names
    socket.on('newDeck', async (deckData: { deckName: string, deckList: string }) => {
        const deck = deckData.deckList.split('\n').flatMap((cardLine) => {
            return parseCardListEntry(cardLine);
        });
        const deckIndex = decks.length;
        console.log('Generating new deck with', deck.length, 'cards');
        decks[deckIndex] = deck;
        decksInfo.push({ deckName: deckData.deckName, deckListIndex: deckIndex, date: new Date() });

        console.log(JSON.stringify(decksInfo));
        console.log(JSON.stringify(decks));
    })

    socket.on('getDecks', () => {
        const deckListData = decksInfo.map((deck, index) => {
            return { deckName: decksInfo[index].deckName, deckListIndex: index, date: decksInfo[index].date, cardCount: decks[index].length };
        })
        socket.emit('decks', deckListData);
    })

    socket.on("playTopCardOfDeck", () => {
        const deckIndex = socket.data.selectedDeckIndex;

        if (deckIndex === undefined) {
            console.error('No deck selected for socket at ip', socket.handshake.address);
            return
        }

        console.log(`Playing top card of deck ${deckIndex}`);

        if (!validateCardIndex(deckIndex, decks.length)) {
            console.error('Invalid deck index');
            return;
        }

        if (decks[deckIndex].length === 0) {
            console.error('Deck is empty');
            return;
        }

        const card = decks[deckIndex].shift();

        if (!card) {
            console.error('Failed to play card');
            return;
        }

        createNewCard(card);
    })

    socket.on('selectDeck', (data: { index: number }) => {
        const index = data.index;
        console.log(`Selecting deck ${index}`);
        console.log(`Length of decks array: ${decks.length}`);

        if (!validateCardIndex(data.index, decks.length)) {
            socket.emit('error', 'Invalid deck index');
            return;
        }

        socket.data.selectedDeckIndex = index;
        socket.emit('deckSelected', index);
        console.log(`Socket ${socket.id} selected deck ${socket.data.selectedDeckIndex}`);
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
