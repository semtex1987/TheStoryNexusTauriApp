import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import {
  Pencil,
  Trash2,
  PenLine,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { useSectionStore } from "../stores/useSectionStore";
import type { AllowedModel, Section, Prompt } from "../../../types/song";
import { useNavigate } from "react-router";
import { Textarea } from "../../../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "../../../components/ui/card";
import { Bounce, toast } from "react-toastify";
import { useSongContext } from "@/features/songs/context/SongContext";
import { useAIStore } from "@/features/ai/stores/useAIStore";
import { usePromptStore } from "@/features/prompts/store/promptStore";
import { PromptParserConfig } from "@/types/song";
import { AIGenerateMenu } from "@/components/ui/ai-generate-menu";
import { DownloadMenu } from "@/components/ui/DownloadMenu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionCardProps {
  section: Section;
  songId: string;
}

interface EditSectionForm {
  title: string;
  povCharacter?: string;
  povType?: "First Person" | "Third Person Limited" | "Third Person Omniscient";
}

export function SectionCard({ section, songId }: SectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const expandedStateKey = `section-${section.id}-expanded`;
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(expandedStateKey);
    return stored ? JSON.parse(stored) : false;
  });
  const [summary, setSummary] = useState(section.summary || "");
  const deleteSection = useSectionStore((state) => state.deleteSection);
  const updateSection = useSectionStore((state) => state.updateSection);
  const updateSectionSummaryOptimistic = useSectionStore(
    (state) => state.updateSectionSummaryOptimistic
  );
  const form = useForm<EditSectionForm>({
    defaultValues: {
      title: section.title,
      povCharacter: section.povCharacter,
      povType: section.povType || "Third Person Omniscient",
    },
  });
  const povType = form.watch("povType");
  const { setCurrentSectionId } = useSongContext();
  const navigate = useNavigate();
  const { generateWithPrompt, processStreamedResponse } = useAIStore();
  const { prompts, isLoading, error } = usePromptStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const getSectionPlainText = useSectionStore(
    (state) => state.getSectionPlainText
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      // Add a small delay to ensure the content is rendered
      const timer = setTimeout(() => {
        adjustTextareaHeight();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, adjustTextareaHeight]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [summary, adjustTextareaHeight]);

  useEffect(() => {
    localStorage.setItem(expandedStateKey, JSON.stringify(isExpanded));
  }, [isExpanded, expandedStateKey]);

  // Reset POV character when switching to omniscient
  useEffect(() => {
    if (povType === "Third Person Omniscient") {
      form.setValue("povCharacter", undefined);
    }
  }, [povType, form]);

  const handleDelete = async () => {
    try {
      await deleteSection(section.id);
      setShowDeleteDialog(false);
      toast.success(`Section ${section.order}: ${section.title} deleted`);
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast.error("Failed to delete section");
    }
  };

  const handleEdit = async (data: EditSectionForm) => {
    try {
      // Only include povCharacter if not omniscient
      const povCharacter =
        data.povType !== "Third Person Omniscient"
          ? data.povCharacter
          : undefined;

      await updateSection(section.id, {
        ...data,
        povCharacter,
      });
      setShowEditDialog(false);
      toast.success("Section updated successfully", {
        position: "bottom-center",
        autoClose: 1000,
        closeOnClick: true,
      });
    } catch (error) {
      console.error("Failed to update section:", error);
      toast.error("Failed to update section");
    }
  };

  const handleSaveSummary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (summary !== section.summary) {
      try {
        await updateSectionSummaryOptimistic(section.id, summary);
        toast.success("Summary saved successfully", {
          position: "bottom-center",
          autoClose: 1000,
          closeOnClick: true,
        });
      } catch (error) {
        console.error("Failed to save summary:", error);
        toast.error("Failed to save summary");
      }
    }
  };

  const handleGenerateSummary = async (prompt: Prompt, model: AllowedModel) => {
    try {
      setIsGenerating(true);
      const plainTextContent = await getSectionPlainText(section.id);

      const config: PromptParserConfig = {
        promptId: prompt.id,
        songId: songId,
        sectionId: section.id,
        additionalContext: {
          plainTextContent,
        },
      };

      const response = await generateWithPrompt(config, model);
      let text = "";

      await new Promise<void>((resolve, reject) => {
        processStreamedResponse(
          response,
          (token) => {
            text += token;
            setSummary(text);
          },
          resolve,
          reject
        );
      });

      await updateSectionSummaryOptimistic(section.id, text);
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleWriteClick = () => {
    setCurrentSectionId(section.id);
    navigate(`/dashboard/${songId}/sections/${section.id}`);
  };

  const cardContent = useMemo(
    () => (
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`summary-${section.id}`}>Section Summary</Label>
            <Textarea
              ref={textareaRef}
              id={`summary-${section.id}`}
              placeholder="Enter a brief summary of this section..."
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
              }}
              className="min-h-[100px] overflow-hidden"
            />
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveSummary}
              >
                Save Summary
              </Button>
              <AIGenerateMenu
                isGenerating={isGenerating}
                isLoading={isLoading}
                error={error}
                prompts={prompts}
                promptType="gen_summary"
                buttonText="Generate Summary"
                onGenerate={handleGenerateSummary}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <DownloadMenu type="section" id={section.id} />
            </div>
          </div>
        </div>
      </CardContent>
    ),
    [summary, section.id, isGenerating, isLoading, error, prompts]
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {section.order}: {section.title}
              </h3>
              {section.povCharacter && (
                <span className="text-xs text-muted-foreground">
                  POV: {section.povCharacter} ({section.povType})
                </span>
              )}
              {!section.povCharacter && section.povType && (
                <span className="text-xs text-muted-foreground">
                  POV: {section.povType}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleWriteClick}>
                <PenLine className="h-4 w-4 mr-2" />
                Write
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleExpanded}>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && cardContent}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Section {section.order}:{" "}
              {section.title}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(handleEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Make changes to your section details.
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
                  defaultValue={section.povType || "Third Person Omniscient"}
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
                    value={form.getValues("povCharacter")}
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
