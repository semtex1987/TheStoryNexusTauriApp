import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useSectionStore } from '@/features/sections/stores/useSectionStore';
import { useSongContext } from '@/features/songs/context/SongContext';

export function LoadSectionContentPlugin(): null {
    const [editor] = useLexicalComposerContext();
    const { currentSectionId } = useSongContext();
    const { getSection, currentSection } = useSectionStore();
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load section data when section ID changes
    useEffect(() => {
        if (currentSectionId) {
            getSection(currentSectionId);
            setHasLoaded(false);
        }
    }, [currentSectionId, getSection]);

    // Set editor content when section data is available
    useEffect(() => {
        if (!hasLoaded && currentSection?.content && currentSection.id === currentSectionId) {
            try {
                // Parse and set the editor state
                const parsedState = editor.parseEditorState(currentSection.content);
                editor.setEditorState(parsedState);
                setHasLoaded(true);
            } catch (error) {
                console.error('LoadSectionContent - Failed to load content:', error);

                // Only in case of error, try to create an empty editor state
                try {
                    editor.setEditorState(editor.parseEditorState('{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'));
                    setHasLoaded(true);
                } catch (recoveryError) {
                    console.error('LoadSectionContent - Recovery failed:', recoveryError);
                }
            }
        }
    }, [editor, currentSection, currentSectionId, hasLoaded]);

    // Reset hasLoaded when section changes
    useEffect(() => {
        if (currentSectionId) {
            setHasLoaded(false);
        }
    }, [currentSectionId]);

    return null;
}
