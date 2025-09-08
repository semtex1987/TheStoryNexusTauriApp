import { useSongContext } from '@/features/songs/context/SongContext';
import { useSectionStore } from '@/features/sections/stores/useSectionStore';
import { useEffect, ReactNode } from 'react';
import PlaygroundApp from './App' // using the lexical playground App component
import './index.css' // Ensure the CSS is imported

interface EmbeddedPlaygroundProps {
    maximizeButton?: ReactNode;
}

export default function EmbeddedPlayground({ maximizeButton }: EmbeddedPlaygroundProps) {
    const { currentSectionId } = useSongContext();
    const { getSection, currentSection } = useSectionStore();

    useEffect(() => {
        if (currentSectionId) {
            getSection(currentSectionId);
        }
    }, [currentSectionId, getSection]);

    if (!currentSectionId || !currentSection) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a section to start editing</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">{currentSection.title}</h2>
                {maximizeButton}
            </div>
            <div className="flex-1 overflow-auto">
                <PlaygroundApp />
            </div>
        </div>
    );
}
