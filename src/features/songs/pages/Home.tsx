import { useEffect, useState, useRef } from "react";
import { useSongStore } from "@/features/songs/stores/useSongStore";
import { CreateSongDialog } from "@/features/songs/components/CreateSongDialog";
import { EditSongDialog } from "@/features/songs/components/EditSongDialog";
import { SongCard } from "@/features/songs/components/SongCard";
import type { Song } from "@/types/song";
import { useSongContext } from "@/features/songs/context/SongContext";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { songExportService } from "@/services/songExportService";

export default function Home() {
    const { songs, fetchSongs } = useSongStore();
    const { resetContext } = useSongContext();
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        resetContext();
        fetchSongs();
    }, [fetchSongs, resetContext]);

    const handleEditSong = (song: Song) => {
        setEditingSong(song);
        setEditDialogOpen(true);
    };

    const handleExportSong = (song: Song) => {
        songExportService.exportSong(song.id);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImportSong = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                await songExportService.importSong(content);

                // Just refresh the song list without navigating
                await fetchSongs();
            } catch (error) {
                console.error("Import failed:", error);
            }
        };

        reader.readAsText(file);
        // Reset the input
        event.target.value = '';
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-8">Song Writing App</h1>
                    <div className="flex justify-center gap-4 mb-8">
                        <CreateSongDialog />
                        <Button variant="outline" onClick={handleImportClick}>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Song
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportSong}
                        />
                    </div>
                </div>

                {songs.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                        No songs yet. Create your first song to get started!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
                        {songs.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onEdit={handleEditSong}
                                onExport={handleExportSong}
                            />
                        ))}
                    </div>
                )}

                <EditSongDialog
                    song={editingSong}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                />
            </div>
        </div>
    );
} 