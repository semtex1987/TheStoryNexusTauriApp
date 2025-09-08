import { create } from 'zustand';
import { db } from '@/services/database';
import type { Song } from '@/types/song';

interface SongState {
    songs: Song[];
    currentSong: Song | null;
    loading: boolean;
    error: string | null;

    // Actions
    fetchSongs: () => Promise<void>;
    getSong: (id: string) => Promise<void>;
    createSong: (song: Omit<Song, 'id' | 'createdAt'>) => Promise<string>;
    updateSong: (id: string, song: Partial<Song>) => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
    setCurrentSong: (song: Song | null) => void;
    clearError: () => void;
}

export const useSongStore = create<SongState>((set, _get) => ({
    songs: [],
    currentSong: null,
    loading: false,
    error: null,

    // Fetch all songs
    fetchSongs: async () => {
        set({ loading: true, error: null });
        try {
            const songs = await db.songs.toArray();
            set({ songs, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch songs',
                loading: false
            });
        }
    },

    // Get a single song
    getSong: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const song = await db.getFullSong(id);
            if (!song) {
                throw new Error('Song not found');
            }
            set({ currentSong: song, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch song',
                loading: false
            });
        }
    },

    // Create a new song
    createSong: async (songData) => {
        const songDataWithId = {
            ...songData,
            id: crypto.randomUUID()
        };
        set({ loading: true, error: null });
        try {
            const songId = await db.createNewSong(songDataWithId);
            const newSong = await db.songs.get(songId);
            if (!newSong) throw new Error('Failed to create song');

            set(state => ({
                songs: [...state.songs, newSong],
                currentSong: newSong,
                loading: false
            }));

            return songId;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create song',
                loading: false
            });
            throw error;
        }
    },

    // Update a song
    updateSong: async (id: string, songData: Partial<Song>) => {
        set({ loading: true, error: null });
        try {
            await db.songs.update(id, songData);
            const updatedSong = await db.songs.get(id);
            if (!updatedSong) throw new Error('Song not found after update');

            set(state => ({
                songs: state.songs.map(song =>
                    song.id === id ? updatedSong : song
                ),
                currentSong: state.currentSong?.id === id ? updatedSong : state.currentSong,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update song',
                loading: false
            });
        }
    },

    // Delete a song
    deleteSong: async (id: string) => {
        set({ loading: true, error: null });
        try {
            await db.deleteSongWithRelated(id);
            set(state => ({
                songs: state.songs.filter(song => song.id !== id),
                currentSong: state.currentSong?.id === id ? null : state.currentSong,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete song',
                loading: false
            });
        }
    },

    // Set current song
    setCurrentSong: (song) => {
        set({ currentSong: song });
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    }
}));