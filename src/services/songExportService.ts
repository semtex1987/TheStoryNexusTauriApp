import { db } from './database';
import type { Song, Section, SongElements, SceneBeat, AIChat } from '@/types/song';
import { toast } from 'react-toastify';

interface SongExport {
    version: string;
    type: 'song';
    exportDate: string;
    song: Song;
    sections: Section[];
    songElements: SongElements | null;
    sceneBeats: SceneBeat[];
    aiChats: AIChat[];
}

export const songExportService = {
    /**
     * Export a complete song with all related data
     */
    exportSong: async (songId: string): Promise<void> => {
        try {
            // Fetch the song and all related data
            const song = await db.songs.get(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            const sections = await db.sections.where('songId').equals(songId).toArray();
            const songElements = await db.songElements.where('songId').equals(songId).first();
            const sceneBeats = await db.sceneBeats.where('songId').equals(songId).toArray();
            const aiChats = await db.aiChats.where('songId').equals(songId).toArray();

            // Create the export object
            const exportData: SongExport = {
                version: '1.0',
                type: 'song',
                exportDate: new Date().toISOString(),
                song,
                sections,
                songElements: songElements || null,
                sceneBeats,
                aiChats
            };

            // Convert to JSON and trigger download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
            const exportName = `song-${song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportName);
            linkElement.click();

            toast.success(`Song "${song.title}" exported successfully`);
        } catch (error) {
            console.error('Song export failed:', error);
            toast.error(`Export failed: ${(error as Error).message}`);
            throw error;
        }
    },

    /**
     * Import a complete song with all related data
     * Returns the ID of the newly imported song
     */
    importSong: async (jsonData: string): Promise<string> => {
        try {
            const data = JSON.parse(jsonData) as SongExport;

            // Validate the data format
            if (!data.type || data.type !== 'song' || !data.song) {
                throw new Error('Invalid song data format');
            }

            // Generate a new ID for the song
            const newSongId = crypto.randomUUID();

            // Create ID mapping to update references
            const idMap = new Map<string, string>();
            idMap.set(data.song.id, newSongId);

            // Create a new song with the new ID
            const newSong: Song = {
                ...data.song,
                id: newSongId,
                createdAt: new Date(),
                title: `${data.song.title} (Imported)`
            };

            // Start a transaction to ensure all-or-nothing import
            await db.transaction('rw',
                [db.songs, db.sections, db.songElements, db.sceneBeats, db.aiChats],
                async () => {
                    // Add the song
                    await db.songs.add(newSong);

                    // Add sections with updated IDs and references
                    for (const section of data.sections) {
                        const newSectionId = crypto.randomUUID();
                        idMap.set(section.id, newSectionId);

                        await db.sections.add({
                            ...section,
                            id: newSectionId,
                            songId: newSongId,
                            createdAt: new Date()
                        });
                    }

                    // Add song elements with updated IDs and references
                    if (data.songElements) {
                        const newSongElementsId = crypto.randomUUID();
                        idMap.set(data.songElements.id, newSongElementsId);

                        await db.songElements.add({
                            ...data.songElements,
                            id: newSongElementsId,
                            songId: newSongId,
                            createdAt: new Date()
                        });
                    }

                    // Add scene beats with updated IDs and references
                    for (const sceneBeat of data.sceneBeats) {
                        const newSceneBeatId = crypto.randomUUID();

                        await db.sceneBeats.add({
                            ...sceneBeat,
                            id: newSceneBeatId,
                            songId: newSongId,
                            sectionId: idMap.get(sceneBeat.sectionId) || sceneBeat.sectionId,
                            createdAt: new Date()
                        });
                    }

                    // Add AI chats with updated IDs and references
                    for (const chat of data.aiChats) {
                        const newChatId = crypto.randomUUID();

                        await db.aiChats.add({
                            ...chat,
                            id: newChatId,
                            songId: newSongId,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            );

            toast.success(`Song "${newSong.title}" imported successfully`);
            return newSongId;
        } catch (error) {
            console.error('Song import failed:', error);
            toast.error(`Import failed: ${(error as Error).message}`);
            throw error;
        }
    }
};