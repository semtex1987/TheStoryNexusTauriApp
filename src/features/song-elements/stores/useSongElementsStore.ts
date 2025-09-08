import { create } from 'zustand';
import { db } from '@/services/database';
import type { SongElements } from '@/types/song';

interface SongElementsState {
    songElements: SongElements | null;
    isLoading: boolean;
    error: string | null;
    loadSongElements: (songId: string) => Promise<void>;
    updateSongElements: (songId: string, data: Partial<SongElements>) => Promise<void>;
    addItemToArray: (songId: string, arrayName: keyof Omit<SongElements, 'id' | 'createdAt' | 'songId'>, item: string) => Promise<void>;
    removeItemFromArray: (songId: string, arrayName: keyof Omit<SongElements, 'id' | 'createdAt' | 'songId'>, item: string) => Promise<void>;
}

export const useSongElementsStore = create<SongElementsState>((set, get) => ({
    songElements: null,
    isLoading: false,
    error: null,

    loadSongElements: async (songId: string) => {
        set({ isLoading: true, error: null });
        try {
            let elements = await db.songElements.where({ songId }).first();
            if (!elements) {
                // Create new song elements if they don't exist
                const newElements: SongElements = {
                    id: crypto.randomUUID(),
                    songId,
                    themes: [],
                    motifs: [],
                    rhymeSchemes: [],
                    chordProgressions: [],
                    avoidList: [],
                    characters: [],
                    createdAt: new Date(),
                };
                await db.songElements.add(newElements);
                elements = newElements;
            }
            set({ songElements: elements, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    updateSongElements: async (songId: string, data: Partial<SongElements>) => {
        const { songElements } = get();
        if (!songElements) return;

        try {
            await db.songElements.update(songElements.id, data);
            set(state => ({
                songElements: state.songElements ? { ...state.songElements, ...data } : null,
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    addItemToArray: async (songId, arrayName, item) => {
        const { songElements, updateSongElements } = get();
        if (!songElements) return;

        const currentArray = songElements[arrayName] as string[];
        if (!currentArray.includes(item)) {
            const newArray = [...currentArray, item];
            await updateSongElements(songId, { [arrayName]: newArray });
        }
    },

    removeItemFromArray: async (songId, arrayName, item) => {
        const { songElements, updateSongElements } = get();
        if (!songElements) return;

        const currentArray = songElements[arrayName] as string[];
        const newArray = currentArray.filter(i => i !== item);
        await updateSongElements(songId, { [arrayName]: newArray });
    },
}));
