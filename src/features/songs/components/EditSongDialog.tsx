import { useEffect, useState } from "react";
import { Song } from "@/types/song";
import { useSongStore } from "@/features/songs/stores/useSongStore";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,

    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



interface EditSongDialogProps {
    song: Song | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditSongDialog({ song, open, onOpenChange }: EditSongDialogProps) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [language, setLanguage] = useState("English");
    const [synopsis, setSynopsis] = useState("");
    const updateSong = useSongStore((state) => state.updateSong);

    useEffect(() => {
        if (song) {
            setTitle(song.title);
            setAuthor(song.author);
            setLanguage(song.language);
            setSynopsis(song.synopsis || "");
        }
    }, [song]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!song) return;

        try {
            await updateSong(song.id, {
                title,
                author,
                language,
                synopsis,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update song:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Song</DialogTitle>
                        <DialogDescription>
                            Make changes to your song details here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter song title"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-author">Author</Label>
                            <Input
                                id="edit-author"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Enter author name"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-language">Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Spanish">Spanish</SelectItem>
                                    <SelectItem value="French">French</SelectItem>
                                    <SelectItem value="German">German</SelectItem>
                                    <SelectItem value="Chinese">Chinese</SelectItem>
                                    <SelectItem value="Japanese">Japanese</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-synopsis">Synopsis</Label>
                            <Input
                                id="edit-synopsis"
                                value={synopsis}
                                onChange={(e) => setSynopsis(e.target.value)}
                                placeholder="Enter a brief synopsis (optional)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 