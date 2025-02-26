import { Card } from './types';

const scryfallURL = 'https://api.scryfall.com/cards';

export function validateCardIndex(index: number, length: number): boolean {
    return index >= 0 && index < length;
};

export async function fetchCard(cardName?: string): Promise<Card | null> {
    try {
        const requestURL = `${scryfallURL}${
            cardName 
            ? `/named?fuzzy=${encodeURIComponent(cardName)}`
            : '/random'
        }`;

        console.log('Fetching card:', requestURL);

        const response = await fetch(requestURL);
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