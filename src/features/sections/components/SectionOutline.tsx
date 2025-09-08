import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { useSectionStore } from "../stores/useSectionStore";
import { Save } from "lucide-react";

export function SectionOutline() {
    const { currentSection, updateSectionOutline } = useSectionStore();
    const [outlineContent, setOutlineContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Load outline content when current section changes
    useEffect(() => {
        if (currentSection?.outline?.content) {
            setOutlineContent(currentSection.outline.content);
        } else {
            setOutlineContent("");
        }
    }, [currentSection]);

    const handleSave = async () => {
        if (!currentSection) return;

        setIsSaving(true);
        try {
            await updateSectionOutline(currentSection.id, {
                content: outlineContent,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error("Failed to save outline:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="section-outline-container">
            <div className="p-4 border-b flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !currentSection}
                >
                    <Save className="h-4 w-4 mr-1" />
                    Save Outline
                </Button>
            </div>
            <div className="section-outline-content">
                <Textarea
                    className="h-full min-h-[200px] resize-none"
                    placeholder="Enter your section outline here..."
                    value={outlineContent}
                    onChange={(e) => setOutlineContent(e.target.value)}
                    disabled={!currentSection}
                />
            </div>
        </div>
    );
} 