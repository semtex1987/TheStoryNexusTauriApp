import { Song } from "@/types/song";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Edit, Trash2, FolderUp } from "lucide-react";
import { useNavigate } from "react-router";
import { useSongStore } from "@/features/songs/stores/useSongStore";
import { DownloadMenu } from "@/components/ui/DownloadMenu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SongCardProps {
    song: Song;
    onEdit: (song: Song) => void;
    onExport: (song: Song) => void;
}

export function SongCard({ song, onEdit, onExport }: SongCardProps) {
    const deleteSong = useSongStore((state) => state.deleteSong);
    const navigate = useNavigate();

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this song?")) {
            await deleteSong(song.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(song);
    };

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExport(song);
    };

    const handleCardClick = () => {
        navigate(`/dashboard/${song.id}/sections`);
    };

    return (
        <Card className="w-full cursor-pointer border-2 border-gray-300 dark:border-gray-700 hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm" onClick={handleCardClick}>
            <CardHeader>
                <CardTitle>{song.title}</CardTitle>
                <CardDescription>By {song.author}</CardDescription>
            </CardHeader>
            <CardContent>
                {song.synopsis && <p className="text-sm text-muted-foreground">{song.synopsis}</p>}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <DownloadMenu type="song" id={song.id} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download options</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleEdit}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edit song details</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleExport}>
                                <FolderUp className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Export song as JSON</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete song</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
} 