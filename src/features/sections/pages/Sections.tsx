import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/features/sections/components/SectionCard";
import { useSectionStore } from "@/features/sections/stores/useSectionStore";
import { usePromptStore } from "@/features/prompts/store/promptStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSongContext } from "@/features/songs/context/SongContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Section } from "@/types/song";

interface CreateSectionForm {
  title: string;
  povCharacter?: string;
  povType?: "First Person" | "Third Person Limited" | "Third Person Omniscient";
}

export default function Sections() {
  const { songId } = useParams();
  const { setSongId } = useSongContext();
  const {
    sections,
    loading,
    error,
    fetchSections,
    createSection,
    updateSection,
    updateSectionOrders,
  } = useSectionStore();
  const { fetchPrompts } = usePromptStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const form = useForm<CreateSectionForm>({
    defaultValues: {
      povType: "Third Person Omniscient",
    },
  });

  const povType = form.watch("povType");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (songId) {
      setSongId(songId);
      Promise.all([fetchSections(songId), fetchPrompts()]).catch(
        console.error
      );
    }
  }, [songId, fetchSections, setSongId, fetchPrompts]);

  // Reset POV character when switching to omniscient
  useEffect(() => {
    if (povType === "Third Person Omniscient") {
      form.setValue("povCharacter", undefined);
    }
  }, [povType, form]);

  const handleCreateSection = async (data: CreateSectionForm) => {
    if (!songId) return;

    try {
      const nextOrder =
        sections.length === 0
          ? 1
          : Math.max(...sections.map((section) => section.order ?? 0)) + 1;

      // Only include povCharacter if not omniscient
      const povCharacter =
        data.povType !== "Third Person Omniscient"
          ? data.povCharacter
          : undefined;

      await createSection({
        songId,
        title: data.title,
        content: "",
        povCharacter,
        povType: data.povType,
        order: nextOrder,
        outline: { content: "", lastUpdated: new Date() },
      });
      setIsCreateDialogOpen(false);
      form.reset({
        title: "",
        povType: "Third Person Omniscient",
        povCharacter: undefined,
      });
      toast.success("Section created successfully");
    } catch (error) {
      console.error("Failed to create section:", error);
      toast.error("Failed to create section");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    const activeId = active.id.toString();
    const overId = over?.id.toString();

    if (!over || activeId === overId) return;

    const oldIndex = sections.findIndex((section) => section.id === activeId);
    const newIndex = sections.findIndex((section) => section.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    try {
      const updatedSections = arrayMove(sections, oldIndex, newIndex);

      // Use the new bulk update method
      await updateSectionOrders(
        updatedSections.map((section: Section, index) => ({
          id: section.id,
          order: index + 1,
        }))
      );

      toast.success("Section order updated successfully");
    } catch (error) {
      console.error("Failed to update section order:", error);
      toast.error("Failed to update section order");
      // Refetch to ensure UI is in sync with database
      await fetchSections(songId);
    }
  };

  if (!songId) return null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading sections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sections</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={form.handleSubmit(handleCreateSection)}>
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
                <DialogDescription>
                  Add a new section to your song. You can edit the content
                  after creating it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter section title"
                    {...form.register("title", { required: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="povType">POV Type</Label>
                  <Select
                    defaultValue="Third Person Omniscient"
                    onValueChange={(value) =>
                      form.setValue("povType", value as any)
                    }
                  >
                    <SelectTrigger id="povType">
                      <SelectValue placeholder="Select POV type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Person">First Person</SelectItem>
                      <SelectItem value="Third Person Limited">
                        Third Person Limited
                      </SelectItem>
                      <SelectItem value="Third Person Omniscient">
                        Third Person Omniscient
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {povType && povType !== "Third Person Omniscient" && (
                  <div className="grid gap-2">
                    <Label htmlFor="povCharacter">POV Character</Label>
                    <Select
                      onValueChange={(value) =>
                        form.setValue("povCharacter", value)
                      }
                    >
                      <SelectTrigger id="povCharacter">
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Populate this from song elements */}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Create Section</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        {sections.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6">
            <p className="text-muted-foreground mb-4">
              No sections yet. Start writing your song by creating a new
              section.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      songId={songId}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>
    </div>
  );
}
