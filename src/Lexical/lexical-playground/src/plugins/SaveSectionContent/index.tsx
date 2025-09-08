import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useSectionStore } from '@/features/sections/stores/useSectionStore';
import { useSongContext } from '@/features/songs/context/SongContext';
import { toast } from 'react-toastify';
import { TOAST_CLOSE_TIMER, TOAST_POSITION } from '@/constants';
import { debounce } from 'lodash';
import { $isSceneBeatNode } from '../../nodes/SceneBeatNode';
import { $getRoot, $getNodeByKey } from 'lexical';

export function SaveSectionContentPlugin(): null {
    const [editor] = useLexicalComposerContext();
    const { currentSectionId } = useSongContext();
    const { updateSection } = useSectionStore();

    // Debounced save function
    const saveContent = useCallback(
        debounce((content: string) => {
            if (currentSectionId) {
                console.log('SaveSectionContent - Saving content for section:', currentSectionId);
                updateSection(currentSectionId, { content })
                    .then(() => {
                        console.log('SaveSectionContent - Content saved successfully');
                    })
                    .catch((error) => {
                        console.error('SaveSectionContent - Failed to save content:', error);
                    });
            }
        }, 1000),
        [currentSectionId, updateSection]
    );

    // Register update listener
    useEffect(() => {
        if (!currentSectionId) return;

        const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
            // Skip if no changes
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
                return;
            }

            // Get the editor state as JSON
            const content = JSON.stringify(editorState.toJSON());

            // Save the content
            saveContent(content);
        });

        return () => {
            removeUpdateListener();
            saveContent.cancel();
        };
    }, [editor, currentSectionId, saveContent]);

    return null;
}
