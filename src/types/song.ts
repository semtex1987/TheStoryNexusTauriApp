// Base types for common fields
interface BaseEntity {
    id: string;
    createdAt: Date;
    isDemo?: boolean; // Flag to identify demo content
}

// Core song type
export interface Song extends BaseEntity {
    title: string;
    author: string;
    language: string;
    synopsis?: string;
}

// Section structure
export interface Section extends BaseEntity {
    songId: string;
    title: string;
    summary?: string;
    order: number;
    content: string;
    outline?: SectionOutline;
    wordCount: number;
    povCharacter?: string;
    povType?: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient';
    notes?: SectionNotes;
}

export interface SectionOutline {
    content: string;
    lastUpdated: Date;
}

export interface SectionNotes {
    content: string;
    lastUpdated: Date;
}

// SceneBeat structure
export interface SceneBeat extends BaseEntity {
    songId: string;
    sectionId: string;
    command: string;
    povType?: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient';
    povCharacter?: string;
    generatedContent?: string; // To store the last generated content
    accepted?: boolean; // Whether the generated content was accepted
    metadata?: {
        useMatchedSection?: boolean;
        useMatchedSceneBeat?: boolean;
        useCustomContext?: boolean;
        [key: string]: any; // Allow for additional metadata properties
    };
}

// AI Chat types
export interface AIChat extends BaseEntity {
    songId: string;
    title: string;
    messages: ChatMessage[];
    updatedAt?: Date;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Prompt related types
export interface PromptMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AllowedModel {
    id: string;
    provider: AIProvider;
    name: string;
}

export interface Prompt extends BaseEntity {
    name: string;
    description?: string;
    promptType: 'scene_beat' | 'gen_summary' | 'selection_specific' | 'continue_writing' | 'other' | 'brainstorm';
    messages: PromptMessage[];
    allowedModels: AllowedModel[];
    songId?: string;
    isSystem?: boolean; // Flag to identify system prompts
    temperature?: number;
    maxTokens?: number;
    top_p?: number; // Nucleus sampling: 1.0 means consider all tokens, 0 means disabled
    top_k?: number; // Limit sampling to top k tokens: 50 is default, 0 means disabled
    repetition_penalty?: number; // Penalty for repeating tokens: 1.0 means no penalty, 0 means disabled
    min_p?: number; // Minimum probability for sampling: 0.0 is default, 1.0 means only consider most likely tokens
}

// AI Provider and Model types
export type AIProvider = 'openai' | 'openrouter' | 'local';

export interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
    contextLength: number;
    enabled: boolean;
}

export interface AISettings extends BaseEntity {
    openaiKey?: string;
    openrouterKey?: string;
    availableModels: AIModel[];
    lastModelsFetch?: Date;
    localApiUrl?: string;
}

// Note types
export interface Note extends BaseEntity {
    songId: string;
    title: string;
    content: string;
    type: 'idea' | 'research' | 'todo' | 'other';
    updatedAt: Date;
}

// Song Elements types
export interface SongElements extends BaseEntity {
    songId: string;
    themes: string[];
    motifs: string[];
    rhymeSchemes: string[];
    chordProgressions: string[];
    avoidList: string[];
    characters: string[];
}

// Prompt Parser types
export interface PromptParserConfig {
    songId: string;
    sectionId?: string;
    promptId: string;
    scenebeat?: string;
    cursorPosition?: number;
    previousWords?: string;
    additionalContext?: Record<string, any>;
    povCharacter?: string;
    povType?: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient';
    songLanguage?: string;
    sceneBeatContext?: {
        useMatchedSection: boolean;
        useMatchedSceneBeat: boolean;
        useCustomContext: boolean;
        customContextItems?: string[]; // IDs of selected song elements
    };
}

export interface PromptContext {
    songId: string;
    sectionId?: string;
    scenebeat?: string;
    cursorPosition?: number;
    previousWords?: string;
    sections?: Section[];
    currentSection?: Section;
    songElements?: SongElements | null;
    additionalContext?: Record<string, any>;
    povCharacter?: string;
    povType?: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient';
    songLanguage?: string;
    sceneBeatContext?: {
        useMatchedSection: boolean;
        useMatchedSceneBeat: boolean;
        useCustomContext: boolean;
        customContextItems?: string[]; // IDs of selected song elements
    };
}

export interface ParsedPrompt {
    messages: PromptMessage[];
    error?: string;
}

export type VariableResolver = (context: PromptContext, ...args: string[]) => Promise<string>;
