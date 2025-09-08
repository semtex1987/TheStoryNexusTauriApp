import { db } from '@/services/database';
import { SceneBeat } from '@/types/song';

export const sceneBeatService = {
    /**
     * Create a new SceneBeat
     */
    async createSceneBeat(data: Omit<SceneBeat, 'id' | 'createdAt'>): Promise<string> {
        return db.createSceneBeat(data);
    },

    /**
     * Get a SceneBeat by ID
     */
    async getSceneBeat(id: string): Promise<SceneBeat | undefined> {
        return db.getSceneBeat(id);
    },

    /**
     * Update a SceneBeat
     */
    async updateSceneBeat(id: string, data: Partial<SceneBeat>): Promise<void> {
        return db.updateSceneBeat(id, data);
    },

    /**
     * Delete a SceneBeat
     */
    async deleteSceneBeat(id: string): Promise<void> {
        return db.deleteSceneBeat(id);
    },

    /**
     * Get all SceneBeats for a section
     */
    async getSceneBeatsBySection(sectionId: string): Promise<SceneBeat[]> {
        return db.getSceneBeatsBySection(sectionId);
    },

    /**
     * Delete all SceneBeats for a section
     */
    async deleteSceneBeatsBySection(sectionId: string): Promise<void> {
        const sceneBeats = await db.getSceneBeatsBySection(sectionId);
        for (const sceneBeat of sceneBeats) {
            await db.deleteSceneBeat(sceneBeat.id);
        }
    }
}; 