import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PromptForm } from './PromptForm';
import { PromptsList } from './PromptList';
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react';
import type { Prompt } from '@/types/song';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { dbSeeder } from '@/services/dbSeed';
import { usePromptStore } from '../store/promptStore';

export function PromptsManager() {
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | undefined>(undefined);
    const [isCreating, setIsCreating] = useState(false);
    const [showMobileForm, setShowMobileForm] = useState(false);
    const [isReseeding, setIsReseeding] = useState(false);
    const { fetchPrompts } = usePromptStore();

    const handleNewPrompt = () => {
        setSelectedPrompt(undefined);
        setIsCreating(true);
        setShowMobileForm(true);
    };

    const handlePromptSelect = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setIsCreating(false);
        setShowMobileForm(true);
    };

    const handleBack = () => {
        setShowMobileForm(false);
        if (!selectedPrompt) {
            setIsCreating(false);
        }
    };

    const handleSave = () => {
        setShowMobileForm(false);
    };

    const handlePromptDelete = (promptId: string) => {
        if (selectedPrompt?.id === promptId) {
            setSelectedPrompt(undefined);
            setIsCreating(false);
        }
    };

    const handleReseedSystemPrompts = async () => {
        try {
            setIsReseeding(true);
            await dbSeeder.forceReseedSystemPrompts();
            await fetchPrompts();
            toast.success('System prompts reseeded successfully');
        } catch (error) {
            toast.error('Failed to reseed system prompts');
            console.error('Error reseeding system prompts:', error);
        } finally {
            setIsReseeding(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Left panel - Fixed Sidebar */}
            <div className={cn(
                "fixed w-[300px] h-screen border-r border-input bg-muted flex flex-col",
                showMobileForm ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-input">
                    <div className="flex gap-2">
                        <Button
                            onClick={handleNewPrompt}
                            className="flex-1 flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Prompt
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleReseedSystemPrompts}
                            disabled={isReseeding}
                            title="Reseed system prompts"
                        >
                            <RefreshCw className={cn("h-4 w-4", isReseeding && "animate-spin")} />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <PromptsList
                        onPromptSelect={handlePromptSelect}
                        selectedPromptId={selectedPrompt?.id}
                        onPromptDelete={handlePromptDelete}
                    />
                </div>
            </div>

            {/* Right panel - Content Area */}
            <div className="flex-1 pl-[300px] h-screen">
                <div className="max-w-3xl mx-auto p-6">
                    {(isCreating || selectedPrompt) ? (
                        <PromptForm
                            key={selectedPrompt?.id || 'new'}
                            prompt={selectedPrompt}
                            onSave={handleSave}
                            onCancel={() => {
                                setIsCreating(false);
                                setShowMobileForm(false);
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Select a prompt to edit or create a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 