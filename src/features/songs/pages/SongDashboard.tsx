import { Link, Outlet, useParams } from "react-router";
import {
    Settings,
    Home,
    Bot,
    Sparkles,
    Sliders,
    BookOpen,
    Book,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    StickyNote,
    PenLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSongStore } from "@/features/songs/stores/useSongStore";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router";
import { useSongContext } from "@/features/songs/context/SongContext";
import { useSectionStore } from "@/features/sections/stores/useSectionStore";

export default function SongDashboard() {
    const { songId } = useParams();
    const { getSong } = useSongStore();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(() => {
        // Initialize from localStorage if available
        const savedState = localStorage.getItem('nav-expanded');
        return savedState ? JSON.parse(savedState) : false;
    });

    const { getLastEditedSectionId, sections } = useSectionStore();

    // Check if the last edited section still exists
    const lastEditedSectionId = songId ? getLastEditedSectionId(songId) : null;
    const lastEditedSectionExists = lastEditedSectionId && sections.some(section => section.id === lastEditedSectionId);

    useEffect(() => {
        if (songId) {
            getSong(songId);
        }
    }, [songId, getSong]);

    // Save navigation state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('nav-expanded', JSON.stringify(isExpanded));
    }, [isExpanded]);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const isActive = (path: string) => {
        const currentPath = location.pathname.replace(/\/$/, '');
        const targetPath = path.replace(/\/$/, '');
        if (currentPath.includes('/write') && targetPath.includes('/sections')) {
            return true;
        }
        return currentPath === targetPath;
    };

    const navButton = (icon: React.ReactNode, to: string, label: string) => (
        <Button
            variant="ghost"
            size={isExpanded ? "default" : "icon"}
            className={cn(
                "relative group hover:bg-accent hover:text-accent-foreground transition-all",
                isExpanded ? "justify-start w-full px-3" : "h-9 w-9",
                isActive(to) && "bg-accent text-accent-foreground"
            )}
            asChild
        >
            <Link to={to}>
                <div className="flex items-center">
                    {icon}
                    {isExpanded ? (
                        <span className="ml-2">{label}</span>
                    ) : (
                        <>
                            <span className="sr-only">{label}</span>
                            <span className="absolute left-12 px-2 py-1 ml-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 bg-popover text-popover-foreground rounded shadow-md transition-opacity">
                                {label}
                            </span>
                        </>
                    )}
                </div>
            </Link>
        </Button>
    );

    return (
        <div className="h-screen flex bg-background">
            {/* Fixed Navigation Sidebar */}
            <div
                className={cn(
                    "border-r bg-muted/50 flex flex-col py-4 fixed h-screen transition-all duration-300 ease-in-out",
                    isExpanded ? "w-[150px]" : "w-12"
                )}
            >
                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="self-end mb-4 mr-1"
                >
                    {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                {/* Top Navigation Icons */}
                <div className={cn(
                    "flex-1 flex flex-col space-y-4",
                    isExpanded ? "items-start px-2" : "items-center"
                )}>
                    {songId && (
                        <>
                            {navButton(<BookOpen className="h-5 w-5" />, `/dashboard/${songId}/sections`, "Sections")}
                            {lastEditedSectionId && lastEditedSectionExists && (
                                navButton(
                                    <PenLine className="h-5 w-5" />,
                                    `/dashboard/${songId}/sections/${lastEditedSectionId}`,
                                    "Last Edited"
                                )
                            )}
                            {navButton(<Book className="h-5 w-5" />, `/dashboard/${songId}/song-elements`, "Song Elements")}
                            {navButton(<Sparkles className="h-5 w-5" />, `/dashboard/${songId}/prompts`, "Prompts")}
                            {navButton(<MessageSquare className="h-5 w-5" />, `/dashboard/${songId}/brainstorm`, "Brainstorm")}
                            {navButton(<StickyNote className="h-5 w-5" />, `/dashboard/${songId}/notes`, "Notes")}
                        </>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className={cn(
                    "flex flex-col space-y-4 pb-4",
                    isExpanded ? "items-start px-2" : "items-center"
                )}>
                    <ThemeToggle isExpanded={isExpanded} />
                    {navButton(<Home className="h-5 w-5" />, "/songs", "Songs")}
                    {navButton(<Sliders className="h-5 w-5" />, "/ai-settings", "AI Settings")}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 transition-all duration-300 ease-in-out",
                isExpanded ? "ml-[150px]" : "ml-12"
            )}>
                <Outlet />
            </div>
        </div>
    );
}
