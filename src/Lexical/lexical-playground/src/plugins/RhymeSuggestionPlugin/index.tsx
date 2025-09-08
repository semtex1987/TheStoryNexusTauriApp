import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND } from 'lexical';
import { rhymingService } from '@/services/rhymingService';
import { useSongElementsStore } from '@/features/song-elements/stores/useSongElementsStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const RhymeSuggestionPlugin = (): JSX.Element | null => {
    const [editor] = useLexicalComposerContext();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { songElements } = useSongElementsStore();
    const anchorRef = useRef<HTMLElement | null>(null);

    const fetchSuggestions = useCallback(async (word: string) => {
        const rhymes = await rhymingService.getRhymes(word);
        const avoidList = songElements?.avoidList || [];
        const filteredRhymes = rhymes.filter(rhyme => !avoidList.includes(rhyme));
        setSuggestions(filteredRhymes);
        setShowSuggestions(true);
    }, [songElements]);

    useEffect(() => {
        console.log('RhymeSuggestionPlugin: registering KEY_DOWN_COMMAND');
        return editor.registerCommand(
            KEY_DOWN_COMMAND,
            (event: KeyboardEvent) => {
                const { ctrlKey, key } = event;
                if (ctrlKey && key === ' ') { // Ctrl+Space to trigger
                    console.log('RhymeSuggestionPlugin: Ctrl+Space triggered');
                    event.preventDefault();
                    editor.getEditorState().read(() => {
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            anchorRef.current = range.startContainer.parentElement;
                            const textContent = range.startContainer.textContent || '';
                            const words = textContent.slice(0, range.startOffset).trim().split(' ');
                            const lastWord = words[words.length - 1];
                            if (lastWord) {
                                fetchSuggestions(lastWord);
                            }
                        }
                    });
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, fetchSuggestions]);

    const insertRhyme = (rhyme: string) => {
        editor.update(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textContent = range.startContainer.textContent || '';
                const words = textContent.slice(0, range.startOffset).trim().split(' ');
                const lastWord = words[words.length - 1];
                range.setStart(range.startContainer, range.startOffset - lastWord.length);
                range.deleteContents();
                range.insertNode(document.createTextNode(rhyme));
            }
        });
        setShowSuggestions(false);
    };

    if (!showSuggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
                <div ref={anchorRef as React.RefObject<HTMLDivElement>} style={{ position: 'absolute', top: 0, left: 0 }} />
            </PopoverTrigger>
            <PopoverContent className="w-48">
                <ul className="space-y-1">
                    {suggestions.map((rhyme, index) => (
                        <li key={index} onClick={() => insertRhyme(rhyme)} className="cursor-pointer p-1 hover:bg-muted rounded">
                            {rhyme}
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
};

export default RhymeSuggestionPlugin;
