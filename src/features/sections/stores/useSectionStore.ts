import { create } from 'zustand';
import { db } from '../../../services/database';
import type { Section, SectionOutline, SectionNotes } from '../../../types/song';

interface SectionState {
    sections: Section[];
    currentSection: Section | null;
    loading: boolean;
    error: string | null;
    summariesSoFar: string;
    lastEditedSectionIds: Record<string, string>; // Map of songId -> sectionId

    // Actions
    fetchSections: (songId: string) => Promise<void>;
    getSection: (id: string) => Promise<void>;
    createSection: (sectionData: Omit<Section, 'id' | 'createdAt' | 'wordCount'>) => Promise<string>;
    updateSection: (id: string, sectionData: Partial<Section>) => Promise<void>;
    deleteSection: (id: string) => Promise<void>;
    setCurrentSection: (section: Section | null) => void;
    getPreviousSectionSummaries: (songId: string, currentOrder: number) => Promise<string>;
    clearError: () => void;
    updateSectionSummary: (id: string, summary: string) => Promise<void>;
    updateSectionSummaryOptimistic: (id: string, summary: string) => Promise<void>;
    getSectionPlainText: (id: string) => Promise<string>;
    getSectionSummaries: (songId: string, currentOrder: number, includeLatest?: boolean) => Promise<string>;
    getAllSectionSummaries: (songId: string) => Promise<string>;
    updateSectionOutline: (id: string, outline: SectionOutline) => Promise<void>;
    getSectionOutline: (id: string) => Promise<SectionOutline | null>;
    getSectionSummary: (id: string) => Promise<string>;
    getPreviousSection: (sectionId: string) => Promise<Section | null>;
    getSectionPlainTextBySectionOrder: (sectionOrder: number) => Promise<string>;
    updateSectionNotes: (id: string, notes: SectionNotes) => Promise<void>;
    getSectionNotes: (id: string) => Promise<SectionNotes | null>;
    setLastEditedSectionId: (songId: string, sectionId: string) => void;
    getLastEditedSectionId: (songId: string) => string | null;
    updateSectionOrders: (updates: Array<{ id: string, order: number }>) => Promise<void>;
}

export const useSectionStore = create<SectionState>((set, get) => ({
    sections: [],
    currentSection: null,
    loading: false,
    error: null,
    summariesSoFar: '',
    lastEditedSectionIds: JSON.parse(localStorage.getItem('lastEditedSectionIds') || '{}'),

    // Fetch all sections for a song
    fetchSections: async (songId: string) => {
        set({ loading: true, error: null });
        try {
            const sections = await db.sections
                .where('songId')
                .equals(songId)
                .sortBy('order');
            set({ sections, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch sections',
                loading: false
            });
        }
    },

    // Get a single section
    getSection: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const section = await db.sections.get(id);
            if (!section) {
                throw new Error('Section not found');
            }
            set({ currentSection: section, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch section',
                loading: false
            });
        }
    },

    // Create a new section
    createSection: async (sectionData) => {
        set({ loading: true, error: null });
        try {
            // Get all sections for this song and find the highest order
            const songSections = await db.sections
                .where('songId')
                .equals(sectionData.songId)
                .toArray();

            const nextOrder = songSections.length === 0
                ? 1
                : Math.max(...songSections.map(section => section.order)) + 1;

            const sectionId = crypto.randomUUID();

            await db.sections.add({
                ...sectionData,
                id: sectionId,
                order: nextOrder,
                createdAt: new Date(),
                wordCount: sectionData.content.split(/\s+/).length
            });

            const newSection = await db.sections.get(sectionId);
            if (!newSection) throw new Error('Failed to create section');

            set(state => ({
                sections: [...state.sections, newSection].sort((a, b) => a.order - b.order),
                currentSection: newSection,
                loading: false
            }));

            return sectionId;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create section',
                loading: false
            });
            throw error;
        }
    },

    // Update a section
    updateSection: async (id: string, sectionData: Partial<Section>) => {
        set({ loading: true, error: null });
        try {
            if (sectionData.content) {
                sectionData.wordCount = sectionData.content.split(/\s+/).length;
                const section = await db.sections.get(id);
                if (section) {
                    // Store last edited with songId
                    const { lastEditedSectionIds } = get();
                    const newLastEdited = {
                        ...lastEditedSectionIds,
                        [section.songId]: id
                    };
                    set({ lastEditedSectionIds: newLastEdited });
                    localStorage.setItem('lastEditedSectionIds', JSON.stringify(newLastEdited));
                }
            }

            await db.sections.update(id, sectionData);
            const updatedSection = await db.sections.get(id);
            if (!updatedSection) throw new Error('Section not found after update');

            set(state => ({
                sections: state.sections.map(section =>
                    section.id === id ? updatedSection : section
                ),
                currentSection: state.currentSection?.id === id ? updatedSection : state.currentSection,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update section',
                loading: false
            });
        }
    },

    // Delete a section
    deleteSection: async (id: string) => {
        set({ loading: true, error: null });
        try {
            await db.transaction('rw', [db.sections], async () => {
                const sectionToDelete = await db.sections.get(id);
                if (!sectionToDelete) throw new Error('Section not found');

                // Delete the section
                await db.sections.delete(id);

                // Clean up last edited reference if this was the last edited section
                const { lastEditedSectionIds } = get();
                if (lastEditedSectionIds[sectionToDelete.songId] === id) {
                    const newLastEdited = { ...lastEditedSectionIds };
                    delete newLastEdited[sectionToDelete.songId];
                    localStorage.setItem('lastEditedSectionIds', JSON.stringify(newLastEdited));
                    set({ lastEditedSectionIds: newLastEdited });
                }

                // Update all sections with higher order in one operation
                await db.sections
                    .where('songId')
                    .equals(sectionToDelete.songId)
                    .filter(section => section.order > sectionToDelete.order)
                    .modify(section => {
                        section.order -= 1;
                    });

                // Fetch updated sections to reflect in state
                const updatedSections = await db.sections
                    .where('songId')
                    .equals(sectionToDelete.songId)
                    .sortBy('order');

                set(state => ({
                    sections: updatedSections,
                    currentSection: state.currentSection?.id === id ? null : state.currentSection,
                    loading: false
                }));
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete section',
                loading: false
            });
        }
    },

    // Set current section
    setCurrentSection: (section) => {
        set({ currentSection: section });
    },

    // Get summaries for previous sections
    getPreviousSectionSummaries: async (songId: string, currentOrder: number) => {
        try {
            const previousSections = await db.sections
                .where('songId')
                .equals(songId)
                .filter(section => section.order <= currentOrder)
                .sortBy('order');

            const summaries = previousSections
                .map(section => section.summary?.trim() || '')
                .filter(Boolean)
                .join(' ');

            set({ summariesSoFar: summaries });
            return summaries;
        } catch (error) {
            console.error('Error getting previous section summaries:', error);
            return '';
        }
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    },

    // Add new dedicated summary update function
    updateSectionSummary: async (id: string, summary: string) => {
        set({ loading: true, error: null });
        try {
            await db.sections.update(id, { summary });
            const updatedSection = await db.sections.get(id);
            if (!updatedSection) throw new Error('Section not found after update');

            set(state => ({
                sections: state.sections.map(section =>
                    section.id === id ? updatedSection : section
                ),
                currentSection: state.currentSection?.id === id ? updatedSection : state.currentSection,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update section summary',
                loading: false
            });
        }
    },

    // Add a new action that doesn't trigger full section list update
    updateSectionSummaryOptimistic: async (id: string, summary: string) => {
        try {
            await db.sections.update(id, { summary });
            // Optimistic update
            set(state => ({
                sections: state.sections.map(section =>
                    section.id === id
                        ? { ...section, summary }
                        : section
                )
            }));
        } catch (error) {
            console.error('Failed to update summary:', error);
            throw error;
        }
    },

    // New method to get section plain text
    getSectionPlainText: async (id: string) => {
        try {
            console.log('DEBUG: getSectionPlainText called for section ID:', id);
            const section = await db.sections.get(id);
            if (!section) {
                console.error('getSectionPlainText - Section not found:', id);
                return '';
            }

            // Parse the Lexical state
            const editorState = JSON.parse(section.content);
            let plainText = '';

            const processNode = (node: any) => {
                if (node.type === 'text') {
                    plainText += node.text;
                } else if (node.children) {
                    node.children.forEach(processNode);
                }
                if (node.type === 'paragraph') {
                    plainText += '\n\n';
                }
            };

            if (editorState.root?.children) {
                editorState.root.children.forEach(processNode);
            }

            const finalText = plainText.trim();

            return finalText;
        } catch (error) {
            console.error('getSectionPlainText - Failed to parse section content:', error);
            return '';
        }
    },

    // Enhanced summary gathering function with detailed formatting
    getSectionSummaries: async (songId: string, currentOrder: number, includeLatest: boolean = false) => {
        try {
            const sections = await db.sections
                .where('songId')
                .equals(songId)
                .filter(section => includeLatest
                    ? true  // Include all sections
                    : section.order < currentOrder) // Only include previous sections
                .sortBy('order');

            const summaries = sections
                .map(section => {
                    const summary = section.summary?.trim();
                    return summary
                        ? `Section ${section.order} - ${section.title}: ${summary}`
                        : '';
                })
                .filter(Boolean)
                .join(', ');

            return summaries;
        } catch (error) {
            console.error('Error getting section summaries:', error);
            return '';
        }
    },

    // Get a specific section summary by ID
    getSectionSummary: async (id: string) => {
        try {
            const section = await db.sections.get(id);
            if (!section || !section.summary) {
                return '';
            }
            return `Section ${section.order} - ${section.title}:\n${section.summary.trim()}`;
        } catch (error) {
            console.error('Error getting section summary:', error);
            return '';
        }
    },

    // Fetch all summaries for a song
    getAllSectionSummaries: async (songId: string) => {
        try {
            const sections = await db.sections
                .where('songId')
                .equals(songId)
                .sortBy('order');

            const summaries = sections
                .map(section => {
                    const summary = section.summary?.trim();
                    return summary
                        ? `Section ${section.order} - ${section.title}:\n${summary}`
                        : '';
                })
                .filter(Boolean)
                .join('\n\n');

            return summaries;
        } catch (error) {
            console.error('Error getting all section summaries:', error);
            return '';
        }
    },

    // Update section outline
    updateSectionOutline: async (id: string, outline: SectionOutline) => {
        set({ loading: true, error: null });
        try {
            await db.sections.update(id, { outline });
            const updatedSection = await db.sections.get(id);
            if (!updatedSection) throw new Error('Section not found after update');

            set(state => ({
                sections: state.sections.map(section =>
                    section.id === id ? updatedSection : section
                ),
                currentSection: state.currentSection?.id === id ? updatedSection : state.currentSection,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update section outline',
                loading: false
            });
            throw error;
        }
    },

    // Get section outline
    getSectionOutline: async (id: string) => {
        try {
            const section = await db.sections.get(id);
            return section?.outline || null;
        } catch (error) {
            return null;
        }
    },

    getPreviousSection: async (sectionId: string): Promise<Section | null> => {
        try {
            // First get the current section to determine its order and songId
            const currentSection = await db.sections.get(sectionId);
            if (!currentSection) {
                console.error('Current section not found:', sectionId);
                return null;
            }

            // Find all sections with lower order in the same song
            const previousSections = await db.sections
                .where('songId')
                .equals(currentSection.songId)
                .and(section => section.order < currentSection.order)
                .toArray();

            if (previousSections.length === 0) {
                return null; // No previous sections
            }

            // Find the section with the highest order (the immediate previous section)
            return previousSections.reduce((prev, current) =>
                prev.order > current.order ? prev : current
            );
        } catch (error) {
            console.error('Error fetching previous section:', error);
            return null;
        }
    },

    getSectionPlainTextBySectionOrder: async (sectionOrder: number) => {
        const { getSectionPlainText } = useSectionStore.getState();
        const section = await db.sections.where('order').equals(sectionOrder).first();
        if (!section) {
            return 'No section data is available for this order number.';
        }
        return getSectionPlainText(section.id);
    },

    // Add new methods for section notes
    updateSectionNotes: async (id: string, notes: SectionNotes) => {
        set({ loading: true, error: null });
        try {
            await db.sections.update(id, { notes });
            const updatedSection = await db.sections.get(id);
            if (!updatedSection) throw new Error('Section not found after update');

            set(state => ({
                sections: state.sections.map(section =>
                    section.id === id ? updatedSection : section
                ),
                currentSection: state.currentSection?.id === id ? updatedSection : state.currentSection,
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update section notes',
                loading: false
            });
            throw error;
        }
    },

    getSectionNotes: async (id: string) => {
        try {
            const section = await db.sections.get(id);
            return section?.notes || null;
        } catch (error) {
            return null;
        }
    },

    setLastEditedSectionId: (songId: string, sectionId: string) => {
        const { lastEditedSectionIds } = get();
        const newLastEdited = {
            ...lastEditedSectionIds,
            [songId]: sectionId
        };
        set({ lastEditedSectionIds: newLastEdited });
        localStorage.setItem('lastEditedSectionIds', JSON.stringify(newLastEdited));
    },

    getLastEditedSectionId: (songId: string) => {
        const { lastEditedSectionIds } = get();
        return lastEditedSectionIds[songId] || null;
    },

    // Add new method implementation
    updateSectionOrders: async (updates) => {
        set({ loading: true, error: null });
        try {
            await db.transaction('rw', [db.sections], async () => {
                await Promise.all(
                    updates.map(({ id, order }) =>
                        db.sections.update(id, { order })
                    )
                );
            });

            // Update local state
            set(state => ({
                sections: state.sections.map(section => {
                    const update = updates.find(u => u.id === section.id);
                    return update ? { ...section, order: update.order } : section;
                }),
                loading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update section orders',
                loading: false
            });
            throw error;
        }
    },
}));