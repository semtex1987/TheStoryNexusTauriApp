import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

import {
  $applyNodeReplacement,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  DecoratorNode,
} from "lexical";
import {
  Suspense,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ChevronRight,
  Loader2,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { usePromptStore } from "@/features/prompts/store/promptStore";
import {
  AIModel,
  Prompt,
  PromptParserConfig,
  AllowedModel,
  PromptMessage,
  SceneBeat,
} from "@/types/song";
import { useAIStore } from "@/features/ai/stores/useAIStore";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { useSongContext } from "@/features/songs/context/SongContext";
import { useSongElementsStore } from "@/features/song-elements/stores/useSongElementsStore";
import { PromptSelectMenu } from "@/components/ui/prompt-select-menu";
import { PromptPreviewDialog } from "@/components/ui/prompt-preview-dialog";
import { createPromptParser } from "@/features/prompts/services/promptParser";
import { useSectionStore } from "@/features/sections/stores/useSectionStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { sceneBeatService } from "@/features/scenebeats/services/sceneBeatService";
import { debounce } from "lodash";

export type SerializedSceneBeatNode = Spread<
  {
    type: "scene-beat";
    version: 1;
    sceneBeatId: string;
  },
  SerializedLexicalNode
>;

function SceneBeatComponent({ nodeKey }: { nodeKey: NodeKey }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { songId, currentSectionId } = useSongContext();
  const { songElements, loadSongElements } = useSongElementsStore();
  const { currentSection } = useSectionStore();
  const [collapsed, setCollapsed] = useState(false);
  const [command, setCommand] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [streamComplete, setStreamComplete] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const { prompts, fetchPrompts, isLoading, error } = usePromptStore();
  const { generateWithPrompt, processStreamedResponse } = useAIStore();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt>();
  const [selectedModel, setSelectedModel] = useState<AllowedModel>();
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<PromptMessage[]>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [povType, setPovType] = useState<
    | "First Person"
    | "Third Person Limited"
    | "Third Person Omniscient"
    | undefined
  >("Third Person Omniscient");
  const [povCharacter, setPovCharacter] = useState<string | undefined>();
  const [showPovPopover, setShowPovPopover] = useState(false);
  const [tempPovType, setTempPovType] = useState<
    | "First Person"
    | "Third Person Limited"
    | "Third Person Omniscient"
    | undefined
  >("Third Person Omniscient");
  const [tempPovCharacter, setTempPovCharacter] = useState<
    string | undefined
  >();
  const [sceneBeatId, setSceneBeatId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    fetchPrompts().catch((error) => {
      toast.error("Failed to load prompts");
      console.error("Error loading prompts:", error);
    });
    if (songId) {
      loadSongElements(songId);
    }
  }, [fetchPrompts, loadSongElements, songId]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof SceneBeatNode) {
        setSceneBeatId(node.getSceneBeatId());
      }
    });
  }, [editor, nodeKey]);

  useEffect(() => {
    const loadOrCreateSceneBeat = async () => {
      if (isLoaded || !songId || !currentSectionId) return;

      if (sceneBeatId) {
        try {
          const data = await sceneBeatService.getSceneBeat(sceneBeatId);
          if (data) {
            setCommand(data.command || "");
            setPovType(data.povType || currentSection?.povType || "Third Person Omniscient");
            setPovCharacter(data.povCharacter || currentSection?.povCharacter);
            setTempPovType(data.povType || currentSection?.povType || "Third Person Omniscient");
            setTempPovCharacter(data.povCharacter || currentSection?.povCharacter);
            setIsLoaded(true);
          }
        } catch (error) {
          console.error("Error loading SceneBeat:", error);
        }
      } else {
        try {
          const newId = await sceneBeatService.createSceneBeat({
            songId: songId,
            sectionId: currentSectionId,
            command: "",
            povType: currentSection?.povType || "Third Person Omniscient",
            povCharacter: currentSection?.povCharacter,
          });
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node instanceof SceneBeatNode) {
              node.setSceneBeatId(newId);
            }
          });
          setSceneBeatId(newId);
          setPovType(currentSection?.povType || "Third Person Omniscient");
          setPovCharacter(currentSection?.povCharacter);
          setTempPovType(currentSection?.povType || "Third Person Omniscient");
          setTempPovCharacter(currentSection?.povCharacter);
          setIsLoaded(true);
        } catch (error) {
          console.error("Error creating SceneBeat:", error);
        }
      }
    };
    loadOrCreateSceneBeat();
  }, [editor, nodeKey, sceneBeatId, songId, currentSectionId, currentSection, isLoaded]);

  const saveCommand = useMemo(
    () =>
      debounce(async (id: string, newCommand: string) => {
        if (!id) return;
        try {
          await sceneBeatService.updateSceneBeat(id, { command: newCommand });
        } catch (error) {
          console.error("Error saving SceneBeat command:", error);
        }
      }, 500),
    []
  );

  useEffect(() => {
    if (sceneBeatId && isLoaded) {
      saveCommand(sceneBeatId, command);
    }
  }, [command, sceneBeatId, saveCommand, isLoaded]);

  const createPromptConfig = (prompt: Prompt): PromptParserConfig => {
    if (!songId || !currentSectionId) {
      throw new Error("No song or section context found");
    }

    let previousText = "";
    editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
            const textNodes: string[] = [];
            let currentNode = node.getPreviousSibling();
            while (currentNode) {
                if ("getTextContent" in currentNode) {
                    textNodes.unshift(currentNode.getTextContent());
                }
                currentNode = currentNode.getPreviousSibling();
            }
            previousText = textNodes.join("\n");
        }
    });

    return {
      promptId: prompt.id,
      songId: songId,
      sectionId: currentSectionId,
      scenebeat: command.trim(),
      previousWords: previousText,
      povType,
      povCharacter:
        povType !== "Third Person Omniscient" ? povCharacter : undefined,
    };
  };

  const handleGenerateWithPrompt = async () => {
      // ... (omitted for brevity)
  };

  const handleAccept = async () => {
      // ... (omitted for brevity)
  };

  const handleReject = () => {
      // ... (omitted for brevity)
  };

  const handleCommandChange = (newCommand: string) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      setCommand(newCommand);
      return;
    }
    if (newCommand !== command) {
      const newHistory = commandHistory.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== newCommand) {
        const updatedHistory = [...newHistory, newCommand];
        setCommandHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
      }
      setCommand(newCommand);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < commandHistory.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleUndo();
      return;
    }
    if (
      (e.ctrlKey && e.shiftKey && e.key === "z") ||
      (e.ctrlKey && e.key === "y")
    ) {
      e.preventDefault();
      e.stopPropagation();
      handleRedo();
      return;
    }
  };

  const handleDelete = async () => {
    if (sceneBeatId) {
      try {
        await sceneBeatService.deleteSceneBeat(sceneBeatId);
      } catch (error) {
        console.error("Error deleting SceneBeat from database:", error);
        toast.error("Failed to delete scene beat from database");
      }
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  return (
    <div className="relative my-4 rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center hover:bg-accent/50 rounded-md w-6 h-6"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                !collapsed && "rotate-90"
              )}
            />
          </button>
          <span className="font-medium">Scene Beat</span>
        </div>
        <div className="flex items-center gap-2">
            <Popover open={showPovPopover} onOpenChange={setShowPovPopover}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                        <User className="h-4 w-4 mr-2" />
                        <span>
                            POV:{" "}
                            {povType === "Third Person Omniscient"
                                ? "Omniscient"
                                : povCharacter || "Select"}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Point of View</h4>
                            <p className="text-sm text-muted-foreground">
                                Set the POV for this scene beat
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="povType">POV Type</Label>
                            <Select
                                value={tempPovType}
                                onValueChange={(value) => setTempPovType(value as any)}
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
                        {tempPovType !== "Third Person Omniscient" && (
                            <div className="grid gap-2">
                                <Label htmlFor="povCharacter">POV Character</Label>
                                <Select
                                    value={tempPovCharacter}
                                    onValueChange={setTempPovCharacter}
                                >
                                    <SelectTrigger id="povCharacter">
                                        <SelectValue placeholder="Select character" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {songElements?.characters.map((character, index) => (
                                            <SelectItem key={index} value={character}>
                                                {character}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button className="w-full mt-2" onClick={() => {
                            setPovType(tempPovType);
                            setPovCharacter(tempPovCharacter);
                            setShowPovPopover(false);
                        }}>
                            <Check className="h-4 w-4 mr-2" />
                            Save POV Settings
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="space-y-4">
          <div className="p-4">
            <Textarea
              placeholder="Enter your scene beat command here..."
              value={command}
              onChange={(e) => handleCommandChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
            />
          </div>

          {streamedText && (
            <div className="border-t border-border p-2">{streamedText}</div>
          )}

          <div className="flex justify-between items-center border-t border-border p-2">
            <div className="flex gap-2 items-center">
              <PromptSelectMenu
                isLoading={isLoading}
                error={error}
                prompts={prompts}
                promptType="scene_beat"
                selectedPrompt={selectedPrompt}
                selectedModel={selectedModel}
                onSelect={(prompt, model) => {
                    setSelectedPrompt(prompt);
                    setSelectedModel(model);
                }}
              />
              {/* ... (Generate button) */}
            </div>
            {/* ... (Accept/Reject buttons) */}
          </div>
        </div>
      )}
    </div>
  );
}

export class SceneBeatNode extends DecoratorNode<JSX.Element> {
  __sceneBeatId: string;

  constructor(sceneBeatId: string = "", key?: NodeKey) {
    super(key);
    this.__sceneBeatId = sceneBeatId;
  }

  static getType(): string {
    return "scene-beat";
  }

  static clone(node: SceneBeatNode): SceneBeatNode {
    return new SceneBeatNode(node.__sceneBeatId, node.__key);
  }

  static importJSON(serializedNode: SerializedSceneBeatNode): SceneBeatNode {
    return $createSceneBeatNode(serializedNode.sceneBeatId || "");
  }

  exportJSON(): SerializedSceneBeatNode {
    return {
      type: "scene-beat",
      version: 1,
      sceneBeatId: this.__sceneBeatId,
    };
  }

  getSceneBeatId(): string {
    return this.__sceneBeatId;
  }

  setSceneBeatId(id: string): void {
    const writable = this.getWritable();
    writable.__sceneBeatId = id;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "scene-beat-node";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <SceneBeatComponent nodeKey={this.__key} />
      </Suspense>
    );
  }
}

export function $createSceneBeatNode(sceneBeatId: string = ""): SceneBeatNode {
  return $applyNodeReplacement(new SceneBeatNode(sceneBeatId));
}

export function $isSceneBeatNode(
  node: LexicalNode | null | undefined
): node is SceneBeatNode {
  return node instanceof SceneBeatNode;
}
