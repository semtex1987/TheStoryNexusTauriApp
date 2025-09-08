import { useEffect, useState, useCallback } from 'react';
import { useSectionStore } from '../stores/useSectionStore';
import Editor from 'react-simple-wysiwyg';
import { cn } from '@/lib/utils';
import type { SectionNotes } from '@/types/song';
import debounce from 'lodash/debounce';

interface SectionNotesEditorProps {
    onClose: () => void;
}

export function SectionNotesEditor({ onClose }: SectionNotesEditorProps) {
    const { currentSection, updateSectionNotes } = useSectionStore();
    const [content, setContent] = useState('');
    const [lastSavedContent, setLastSavedContent] = useState('');

    // Create a debounced save function
    const debouncedSave = useCallback(
        debounce(async (newContent: string) => {
            if (!currentSection) return;

            try {
                const notes: SectionNotes = {
                    content: newContent,
                    lastUpdated: new Date()
                };
                await updateSectionNotes(currentSection.id, notes);
                setLastSavedContent(newContent);
            } catch (error) {
                console.error('Failed to save notes:', error);
            }
        }, 1000),
        [currentSection]
    );

    useEffect(() => {
        if (currentSection?.notes) {
            setContent(currentSection.notes.content);
            setLastSavedContent(currentSection.notes.content);
        } else {
            setContent('');
            setLastSavedContent('');
        }
    }, [currentSection]);

    useEffect(() => {
        if (content !== lastSavedContent) {
            debouncedSave(content);
        }
    }, [content, lastSavedContent, debouncedSave]);

    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    if (!currentSection) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No section selected</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                {currentSection?.notes && (
                    <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(currentSection.notes.lastUpdated).toLocaleString()}
                    </p>
                )}
            </div>
            <Editor
                value={content}
                onChange={(e) => setContent(e.target.value)}
                containerProps={{
                    style: { height: '82vh' },
                    className: cn(
                        "prose prose-sm max-w-none",
                        "dark:prose-invert"
                    )
                }}
                style={{ height: '100%', overflow: 'auto' }}
            />
        </div>
    );
} 