import { useSongElementsStore } from "@/features/song-elements/stores/useSongElementsStore";
import { useSectionStore } from "@/features/sections/stores/useSectionStore";
import { SongElements } from "@/types/song";

export const buildLyricSuggestionPrompt = (currentText: string, songElements: SongElements | null): string => {

    const promptParts = [
        "You are a songwriting assistant. Your task is to provide a lyric suggestion based on the provided context.",
        `The current text of the song section is:\n---\n${currentText}\n---`,
    ];

    if (songElements) {
        if (songElements.themes.length > 0) {
            promptParts.push(`Consider the following themes: ${songElements.themes.join(', ')}.`);
        }
        if (songElements.motifs.length > 0) {
            promptParts.push(`Incorporate these motifs: ${songElements.motifs.join(', ')}.`);
        }
        if (songElements.rhymeSchemes.length > 0) {
            promptParts.push(`Follow one of these rhyme schemes: ${songElements.rhymeSchemes.join(', ')}.`);
        }
        if (songElements.avoidList.length > 0) {
            promptParts.push(`Do not use the following words or phrases: ${songElements.avoidList.join(', ')}.`);
        }
    }

    promptParts.push("Please provide a concise lyric suggestion that continues from the current text.");

    return promptParts.join('\n\n');
};
