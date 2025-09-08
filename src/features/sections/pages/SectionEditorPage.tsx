import { useEffect } from "react";
import { useParams } from "react-router";
import { useSongStore } from "@/features/songs/stores/useSongStore";
import { useSectionStore } from "@/features/sections/stores/useSectionStore";
import { useSongContext } from "@/features/songs/context/SongContext";
import { SongEditor } from "@/features/sections/components/SongEditor";

export default function SectionEditorPage() {
    const { songId, sectionId } = useParams<{ songId: string; sectionId: string }>();
    const { getSong, currentSong } = useSongStore();
    const { currentSection, getSection } = useSectionStore();
    const { setSongId, setCurrentSectionId } = useSongContext();

    useEffect(() => {
        if (songId) {
            setSongId(songId);
            getSong(songId);
        }
        if (sectionId) {
            setCurrentSectionId(sectionId);
            getSection(sectionId);
        }

        return () => {
            setCurrentSectionId(null);
        };
    }, [songId, sectionId, getSong, getSection, setSongId, setCurrentSectionId]);

    if (!currentSong) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Loading song...</div>
            </div>
        );
    }

    if (sectionId && !currentSection) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Loading section...</div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <SongEditor />
        </div>
    );
}