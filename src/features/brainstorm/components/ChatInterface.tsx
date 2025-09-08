import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptSelectMenu } from "@/components/ui/prompt-select-menu";
import { PromptPreviewDialog } from "@/components/ui/prompt-preview-dialog";
import { useSongElementsStore } from "@/features/song-elements/stores/useSongElementsStore";
import { usePromptStore } from "@/features/prompts/store/promptStore";
import { useAIStore } from "@/features/ai/stores/useAIStore";
import { useBrainstormStore } from "../stores/useBrainstormStore";
import MarkdownRenderer from "./MarkdownRenderer";
import {
  ChatMessage,
  Prompt,
  AllowedModel,
  PromptParserConfig,
  PromptMessage,
} from "@/types/song";
import { createPromptParser } from "@/features/prompts/services/promptParser";

interface ChatInterfaceProps {
  songId: string;
}

export default function ChatInterface({ songId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [includeSongElements, setIncludeSongElements] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<
    PromptMessage[] | undefined
  >(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { songElements, loadSongElements } = useSongElementsStore();
  const { fetchPrompts, prompts, isLoading: promptsLoading, error: promptsError } = usePromptStore();
  const { initialize: initializeAI, getAvailableModels, generateWithPrompt, processStreamedResponse } = useAIStore();
  const { addChat, updateChat, selectedChat, draftMessage, setDraftMessage, clearDraftMessage } = useBrainstormStore();

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedModel, setSelectedModel] = useState<AllowedModel | null>(null);
  const [availableModels, setAvailableModels] = useState<AllowedModel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      await loadSongElements(songId);
      await fetchPrompts();
      await initializeAI();
      const models = await getAvailableModels();
      if (models.length > 0) {
        setAvailableModels(
          models.map((model) => ({
            id: model.id,
            name: model.name,
            provider: model.provider,
          }))
        );
      }
    };
    loadData();
  }, [songId, loadSongElements, fetchPrompts, initializeAI, getAvailableModels]);

  const createPromptConfig = (prompt: Prompt): PromptParserConfig => {
    return {
      promptId: prompt.id,
      songId,
      scenebeat: input.trim(),
      additionalContext: {
        chatHisong: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        includeSongElements,
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPrompt || !selectedModel || isGenerating)
      return;

    try {
      setIsGenerating(true);

      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      clearDraftMessage();

      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, assistantMessage]);

      const config = createPromptConfig(selectedPrompt);
      const response = await generateWithPrompt(config, selectedModel);

      let fullResponse = "";
      await processStreamedResponse(
        response,
        (token) => {
          fullResponse += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        () => {
          const finalMessages: ChatMessage[] = [
            ...updatedMessages,
            {
              id: assistantMessageId,
              role: "assistant",
              content: fullResponse,
              timestamp: new Date(),
            },
          ];
          if (selectedChat) {
            updateChat(selectedChat.id, {
              messages: finalMessages,
              title: selectedChat.title,
            });
          } else {
            const firstUserMessage = finalMessages.find(
              (msg) => msg.role === "user"
            );
            const chatTitle = firstUserMessage
              ? firstUserMessage.content.substring(0, 30) +
                (firstUserMessage.content.length > 30 ? "..." : "")
              : `New Chat ${new Date().toLocaleString()}`;
            addChat(songId, chatTitle, finalMessages).then((newChatId) => {
              setCurrentChatId(newChatId);
            });
          }
          setMessages(finalMessages);
          setIsGenerating(false);
        },
        (error) => {
          toast.error(`Error generating response: ${error.message}`);
          setIsGenerating(false);
        }
      );
    } catch (error) {
      toast.error(
        `Error generating response: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <MarkdownRenderer
                      content={message.content}
                    />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Context selection */}
      <div className="border-t p-2">
        <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                Context
                {contextOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <span className="text-sm">Include Song Elements</span>
              <Switch
                checked={includeSongElements}
                onCheckedChange={setIncludeSongElements}
              />
            </div>
          </div>
          <CollapsibleContent>
            {/* Can add more context options here later */}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex flex-col gap-2">
            <div className="flex-1">
                <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[80px]"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                    }
                }}
                />
            </div>
            <div className="flex gap-2">
                <PromptSelectMenu
                    isLoading={promptsLoading}
                    error={promptsError}
                    prompts={prompts}
                    promptType="brainstorm"
                    selectedPrompt={selectedPrompt}
                    selectedModel={selectedModel}
                    onSelect={setSelectedPrompt}
                />
                <Button
                    type="submit"
                    disabled={
                        isGenerating ||
                        !input.trim() ||
                        !selectedPrompt ||
                        !selectedModel
                    }
                    onClick={handleSubmit}
                    className="mb-[3px]"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
