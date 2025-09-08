import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND, $getSelection, $isRangeSelection } from 'lexical';
import { aiService } from '@/services/ai/AIService';
import { useSongElementsStore } from '@/features/song-elements/stores/useSongElementsStore';
import { buildLyricSuggestionPrompt } from '@/services/ai/promptBuilder';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

const LyricSuggestionPlugin = (): JSX.Element | null => {
    const [editor] = useLexicalComposerContext();
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const { songElements } = useSongElementsStore();
    const anchorRef = useRef<HTMLElement | null>(null);

    const fetchSuggestion = useCallback(async () => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                anchorRef.current = editor.getElementByKey(selection.anchor.key)?.parentElement || null;
                const currentText = selection.getNodes().map(n => n.getTextContent()).join('\n');
                const prompt = buildLyricSuggestionPrompt(currentText, songElements);
                aiService.getLyricSuggestion(prompt).then(result => {
                    setSuggestion(result);
                    setShowSuggestion(true);
                });
            }
        });
    }, [songElements, editor]);

    useEffect(() => {
        console.log('LyricSuggestionPlugin: registering KEY_DOWN_COMMAND');
        return editor.registerCommand(
            KEY_DOWN_COMMAND,
            (event: KeyboardEvent) => {
                const { altKey, key } = event;
                if (altKey && key.toLowerCase() === 'l') { // Alt+L to trigger
                    console.log('LyricSuggestionPlugin: Alt+L triggered');
                    event.preventDefault();
                    fetchSuggestion();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, fetchSuggestion]);

    const acceptSuggestion = () => {
        if (suggestion) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertText(suggestion);
                }
            });
        }
        setShowSuggestion(false);
    };

    if (!showSuggestion || !suggestion) {
        return null;
    }

    return (
        <Popover open={showSuggestion} onOpenChange={setShowSuggestion}>
            <PopoverTrigger asChild>
                <div ref={anchorRef as React.RefObject<HTMLDivElement>} style={{ position: 'absolute', top: 0, left: 0 }} />
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <p>{suggestion}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setShowSuggestion(false)}>Dismiss</Button>
                    <Button size="sm" onClick={acceptSuggestion}>Accept</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default LyricSuggestionPlugin;
