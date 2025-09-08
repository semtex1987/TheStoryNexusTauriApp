import Dexie, { Table } from 'dexie';
import systemPrompts from '@/data/systemPrompts';
import {
    Song,
    Section,
    AIChat,
    Prompt,
    AISettings,
    SongElements,
    SceneBeat,
    Note
} from '../types/song';

export class SongDatabase extends Dexie {
    songs!: Table<Song>;
    sections!: Table<Section>;
    aiChats!: Table<AIChat>;
    prompts!: Table<Prompt>;
    aiSettings!: Table<AISettings>;
    songElements!: Table<SongElements>;
    sceneBeats!: Table<SceneBeat>;
    notes!: Table<Note>;

    constructor() {
        super('SongDatabase');

        this.version(13).stores({
            songs: 'id, title, createdAt, language, isDemo',
            sections: 'id, songId, order, createdAt, isDemo',
            aiChats: 'id, songId, createdAt, isDemo',
            prompts: 'id, name, promptType, songId, createdAt, isSystem',
            aiSettings: 'id, lastModelsFetch',
            songElements: 'id, songId',
            sceneBeats: 'id, songId, sectionId',
            notes: 'id, songId, title, type, createdAt, updatedAt',
        });

        this.on('populate', async () => {
            console.log('Populating database with initial data...');

            // Add system prompts
            for (const promptData of systemPrompts) {
                await this.prompts.add({
                    ...promptData,
                    createdAt: new Date(),
                    isSystem: true
                } as Prompt);
            }

            console.log('Database successfully populated with initial data');
        });
    }

    // Helper method to create a new song with initial structure
    async createNewSong(songData: Omit<Song, 'createdAt'>): Promise<string> {
        return await this.transaction('rw',
            [this.songs],
            async () => {
                const songId = songData.id || crypto.randomUUID();

                // Create the song
                await this.songs.add({
                    id: songId,
                    createdAt: new Date(),
                    ...songData
                });

                return songId;
            });
    }

    // Helper method to get complete song structure
    async getFullSong(songId: string) {
        const song = await this.songs.get(songId);
        if (!song) return null;

        const sections = await this.sections
            .where('songId')
            .equals(songId)
            .sortBy('order');

        return {
            ...song,
            sections
        };
    }


    // Helper methods for SceneBeats
    async getSceneBeatsBySection(sectionId: string): Promise<SceneBeat[]> {
        return this.sceneBeats
            .where('sectionId')
            .equals(sectionId)
            .toArray();
    }

    async getSceneBeat(id: string): Promise<SceneBeat | undefined> {
        return this.sceneBeats.get(id);
    }

    async createSceneBeat(data: Omit<SceneBeat, 'id' | 'createdAt'>): Promise<string> {
        const id = crypto.randomUUID();
        await this.sceneBeats.add({
            id,
            createdAt: new Date(),
            ...data
        } as SceneBeat);
        return id;
    }

    async updateSceneBeat(id: string, data: Partial<SceneBeat>): Promise<void> {
        await this.sceneBeats.update(id, data);
    }

    async deleteSceneBeat(id: string): Promise<void> {
        await this.sceneBeats.delete(id);
    }

    /**
     * Deletes a song and all related data (sections, song elements, etc.)
     * @param songId The ID of the song to delete
     * @returns Promise that resolves when the deletion is complete
     */
    async deleteSongWithRelated(songId: string): Promise<void> {
        return await this.transaction('rw',
            [this.songs, this.sections, this.songElements, this.aiChats, this.sceneBeats],
            async () => {
                // Delete all related sections
                await this.sections
                    .where('songId')
                    .equals(songId)
                    .delete();

                // Delete all related song elements
                await this.songElements
                    .where('songId')
                    .equals(songId)
                    .delete();

                // Delete all related AI chats
                await this.aiChats
                    .where('songId')
                    .equals(songId)
                    .delete();

                // Delete all related SceneBeats
                await this.sceneBeats
                    .where('songId')
                    .equals(songId)
                    .delete();

                // Finally delete the song itself
                await this.songs.delete(songId);

                console.log(`Deleted song ${songId} and all related data`);
            });
    }
}

export const db = new SongDatabase();