// Socket.io Types

export interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
    cards: (cards: Card[]) => void;
    error: (message: string) => void;
}

export interface ClientToServerEvents {
    newCard: (cardData: { name: string }) => void;
    tap: (cardUpdateData: { index: number }) => void;
    cardPositionChange: (cardUpdateData: CardUpdateData) => void;
    clear: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    age: number;
}

// Custom Types

export interface Card {
    url: string;
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