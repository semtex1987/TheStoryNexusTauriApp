import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useSongElementsStore } from "../stores/useSongElementsStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// A reusable component for managing a list of strings
const StringListManager = ({ title, items, onAdd, onDelete }: {
    title: string;
    items: string[];
    onAdd: (item: string) => void;
    onDelete: (item: string) => void;
}) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={`New ${title.slice(0, -1).toLowerCase()}...`}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button onClick={handleAdd} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-muted p-2 rounded">
                            <span>{item}</span>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};


export default function SongElementsPage() {
    const { songId } = useParams<{ songId: string }>();
    const { songElements, loadSongElements, addItemToArray, removeItemFromArray, isLoading, error } = useSongElementsStore();

    useEffect(() => {
        if (songId) {
            loadSongElements(songId);
        }
    }, [songId, loadSongElements]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <p className="text-destructive">Error loading song elements: {error}</p>
            </div>
        );
    }

    if (!songElements) {
        return <div className="p-4">No song elements found.</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Song Elements</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your song's themes, motifs, and other important elements.
                    </p>
                </div>
            </div>

            <Separator className="bg-gray-300 dark:bg-gray-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StringListManager
                    title="Themes"
                    items={songElements.themes}
                    onAdd={(item) => addItemToArray(songId!, 'themes', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'themes', item)}
                />
                <StringListManager
                    title="Motifs"
                    items={songElements.motifs}
                    onAdd={(item) => addItemToArray(songId!, 'motifs', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'motifs', item)}
                />
                <StringListManager
                    title="Rhyme Schemes"
                    items={songElements.rhymeSchemes}
                    onAdd={(item) => addItemToArray(songId!, 'rhymeSchemes', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'rhymeSchemes', item)}
                />
                <StringListManager
                    title="Chord Progressions"
                    items={songElements.chordProgressions}
                    onAdd={(item) => addItemToArray(songId!, 'chordProgressions', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'chordProgressions', item)}
                />
                <StringListManager
                    title="Avoid List"
                    items={songElements.avoidList}
                    onAdd={(item) => addItemToArray(songId!, 'avoidList', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'avoidList', item)}
                />
                <StringListManager
                    title="Characters"
                    items={songElements.characters}
                    onAdd={(item) => addItemToArray(songId!, 'characters', item)}
                    onDelete={(item) => removeItemFromArray(songId!, 'characters', item)}
                />
            </div>
        </div>
    );
}
