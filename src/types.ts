// Socket.io Types

export interface ServerToClientEvents {
    noArg: () => void;
    decks: (decks: IDeckInfoDownstream[]) => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
    cards: (cards: Card[]) => void;
    error: (message: string) => void;
    deckSelected: (index: number) => void;
}

export interface ClientToServerEvents {
    getDecks: () => void;
    newCard: (cardData: { name: string }) => void;
    newDeck: (deckData: { deckName: string, deckList: string }) => void;
    playTopCardOfDeck: (playData: { index: number }) => void;
    tap: (cardUpdateData: { index: number }) => void;
    cardPositionChange: (cardUpdateData: CardUpdateData) => void;
    clear: () => void;
    selectDeck: (data: { index: number }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    age: number;
    selectedDeckIndex?: number;
}

// Custom Types

export interface Card {
    url?: string; // URL is required for play, but not baseline
    name: string;
    x: number;
    y: number;
    locked: boolean
    tapped: boolean
}

export interface CardUpdateData {
    index: number,
    x: number,
    y: number
}

export interface IDeckInfo {
    deckName: string;
    deckListIndex: number;
    date: Date;
}

export interface IDeckInfoDownstream extends IDeckInfo {
    cardCount: number;
}