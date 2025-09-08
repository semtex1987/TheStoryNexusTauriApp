import { useState } from "react";
import { BookOpen, Tags, Maximize, Minimize, User, Download, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmbeddedPlayground from "@/Lexical/lexical-playground/src/EmbeddedPlayground";
import { SectionOutline } from "./SectionOutline";
import { SectionPOVEditor } from "@/features/sections/components/SectionPOVEditor";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useSongContext } from "@/features/songs/context/SongContext";
import { DownloadMenu } from "@/components/ui/DownloadMenu";
import { SectionNotesEditor } from "@/features/sections/components/SectionNotesEditor";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type DrawerType = "sectionOutline" | "sectionPOV" | "sectionNotes" | null;

export function SongEditor() {
    const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const { currentSectionId } = useSongContext();

    const handleOpenDrawer = (drawer: DrawerType) => {
        setOpenDrawer(drawer === openDrawer ? null : drawer);
    };

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    const maximizeButton = (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleMaximize}
            title={isMaximized ? "Minimize Editor" : "Maximize Editor"}
        >
            {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
    );

    return (
        <div className="h-full flex">
            {/* Main Editor Area */}
            <div className={`flex-1 flex justify-center ${isMaximized ? '' : 'px-4'}`}>
                <div className={`h-full flex flex-col ${isMaximized ? 'w-full' : 'max-w-[1024px] w-full'}`}>
                    <EmbeddedPlayground maximizeButton={maximizeButton} />
                </div>
            </div>

            {/* Right Sidebar with Buttons */}
            <div className="w-48 border-l h-full flex flex-col py-4 space-y-2 bg-muted/20">
                <Button
                    variant={openDrawer === "sectionOutline" ? "default" : "outline"}
                    size="sm"
                    className="mx-2 justify-start"
                    onClick={() => handleOpenDrawer("sectionOutline")}
                >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Outline
                </Button>

                <Button
                    variant={openDrawer === "sectionPOV" ? "default" : "outline"}
                    size="sm"
                    className="mx-2 justify-start"
                    onClick={() => handleOpenDrawer("sectionPOV")}
                >
                    <User className="h-4 w-4 mr-2" />
                    Edit POV
                </Button>

                <Button
                    variant={openDrawer === "sectionNotes" ? "default" : "outline"}
                    size="sm"
                    className="mx-2 justify-start"
                    onClick={() => handleOpenDrawer("sectionNotes")}
                >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Section Notes
                </Button>

                {currentSectionId && (
                    <DownloadMenu
                        type="section"
                        id={currentSectionId}
                        variant="outline"
                        size="sm"
                        showIcon={true}
                        label="Download"
                        className="mx-2 justify-start"
                    />
                )}
            </div>

            {/* Section Outline Drawer */}
            <Drawer open={openDrawer === "sectionOutline"} onOpenChange={(open) => !open && setOpenDrawer(null)}>
                <DrawerContent className="max-h-[80vh]">
                    <DrawerHeader>
                        <DrawerTitle>Section Outline</DrawerTitle>
                        <DrawerDescription>
                            Outline and notes for your current section.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 overflow-y-auto max-h-[60vh]">
                        <SectionOutline />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Section POV Drawer */}
            <Drawer open={openDrawer === "sectionPOV"} onOpenChange={(open) => !open && setOpenDrawer(null)}>
                <DrawerContent className="max-h-[80vh]">
                    <DrawerHeader>
                        <DrawerTitle>Edit Section POV</DrawerTitle>
                        <DrawerDescription>
                            Change the point of view character and perspective for this section.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 overflow-y-auto max-h-[60vh]">
                        <SectionPOVEditor onClose={() => setOpenDrawer(null)} />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Replace the Section Notes Drawer with this Sheet */}
            <Sheet open={openDrawer === "sectionNotes"} onOpenChange={(open) => !open && setOpenDrawer(null)}>
                <SheetContent
                    side="right"
                    className="h-[100vh] min-w-[800px]"
                >
                    <SheetHeader>
                        <SheetTitle>Scribble</SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto h-[100vh]">
                        <SectionNotesEditor onClose={() => setOpenDrawer(null)} />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
