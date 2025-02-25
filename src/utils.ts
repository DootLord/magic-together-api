import { Card } from './types';

export function validateCardIndex(index: number, length: number): boolean {
    return index >= 0 && index < length;
};

export async function fetchRandomCard(): Promise<Card | null> {
    try {
        const response = await fetch('https://api.scryfall.com/cards/random');
        const cardJSON = await response.json();

        return {
            url: cardJSON.image_uris.png,
            name: cardJSON.name,
            x: 0,
            y: 0,
            locked: false,
            tapped: false
        };
    } catch (error) {
        console.error('Error fetching card:', error);
        return null;
    }
};
