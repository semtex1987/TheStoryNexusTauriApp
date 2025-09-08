import { fetch } from '@tauri-apps/plugin-http';

const API_BASE_URL = 'https://api.datamuse.com';

interface DatamuseWord {
    word: string;
    score: number;
    numSyllables?: number;
}

// Helper function to fetch words from the Datamuse API
const fetchWords = async (params: Record<string, string>): Promise<string[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/words`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json() as DatamuseWord[];
            return data.map(item => item.word);
        } else {
            console.error('Datamuse API error:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Failed to fetch from Datamuse API:', error);
        return [];
    }
};

// Helper function to fetch words with syllable count
const fetchWordsWithSyllables = async (params: Record<string, string>): Promise<DatamuseWord[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/words`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        url.searchParams.append('md', 's');

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        if (response.ok) {
            return await response.json() as DatamuseWord[];
        } else {
            console.error('Datamuse API error:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Failed to fetch from Datamuse API:', error);
        return [];
    }
};


export const getRhymes = async (word: string): Promise<string[]> => {
    return fetchWords({ rel_rhy: word });
};

export const getNearRhymes = async (word: string): Promise<string[]> => {
    return fetchWords({ rel_nry: word });
};

export const getRhymesBySyllable = async (word: string, count: number): Promise<string[]> => {
    const results = await fetchWordsWithSyllables({ rel_rhy: word });
    return results
        .filter(item => item.numSyllables === count)
        .map(item => item.word);
};

export const rhymingService = {
    getRhymes,
    getNearRhymes,
    getRhymesBySyllable,
};
