import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SongContextType {
    songId: string | null;
    currentSectionId: string | null;
    setSongId: (songId: string | null) => void;
    setCurrentSectionId: (sectionId: string | null) => void;
    resetContext: () => void;
}

const SongContext = createContext<SongContextType | undefined>(undefined);

export function SongProvider({ children }: { children: ReactNode }) {
    const [songId, setSongId] = useState<string | null>(null);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

    const resetContext = () => {
        setSongId(null);
        setCurrentSectionId(null);
    };

    return (
        <SongContext.Provider value={{
            songId,
            currentSectionId,
            setSongId,
            setCurrentSectionId,
            resetContext
        }}>
            {children}
        </SongContext.Provider>
    );
}

export function useSongContext() {
    const context = useContext(SongContext);
    if (!context) {
        throw new Error('useSongContext must be used within a SongProvider');
    }
    return context;
}