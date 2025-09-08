import { SongDatabase, db } from '@/services/database';
import {
    PromptMessage,
    PromptParserConfig,
    ParsedPrompt,
    PromptContext,
    VariableResolver,
} from '@/types/song';
import { useSectionStore } from '@/features/sections/stores/useSectionStore';
import { useSongElementsStore } from '@/features/song-elements/stores/useSongElementsStore';

export class PromptParser {
    private readonly variableResolvers: Record<string, VariableResolver>;

    constructor(private database: SongDatabase) {
        this.variableResolvers = {
            'song_elements': this.resolveSongElements.bind(this),
            'summaries': this.resolveSectionSummaries.bind(this),
            'previous_words': this.resolvePreviousWords.bind(this),
            'pov': this.resolvePoV.bind(this),
            'section_content': this.resolveSectionContent.bind(this),
            'selected_text': this.resolveSelectedText.bind(this),
            'selection': this.resolveSelectedText.bind(this),
            'song_language': this.resolveSongLanguage.bind(this),
            'chat_history': this.resolveChatHisong.bind(this),
            'user_input': this.resolveUserInput.bind(this),
            'brainstorm_context': this.resolveBrainstormContext.bind(this),
            'scenebeat_context': this.resolveSceneBeatContext.bind(this),
            'section_outline': this.resolveSectionOutline.bind(this),
            'section_data': this.resolveSectionData.bind(this),
        };
    }

    async parse(config: PromptParserConfig): Promise<ParsedPrompt> {
        try {
            const prompt = await this.database.prompts.get(config.promptId);
            if (!prompt) throw new Error('Prompt not found');

            const context = await this.buildContext(config);
            const parsedMessages = await this.parseMessages(prompt.messages, context);

            return { messages: parsedMessages };
        } catch (error) {
            console.error('Error parsing prompt:', error);
            return {
                messages: [],
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    private async buildContext(config: PromptParserConfig): Promise<PromptContext> {
        const [sections, currentSection, songElements] = await Promise.all([
            this.database.sections.where('songId').equals(config.songId).toArray(),
            config.sectionId ? this.database.sections.get(config.sectionId) : undefined,
            this.database.songElements.where('songId').equals(config.songId).first()
        ]);

        return {
            ...config,
            sections,
            currentSection,
            songElements,
            povCharacter: config.povCharacter || currentSection?.povCharacter,
            povType: config.povType || currentSection?.povType || 'Third Person Omniscient',
            additionalContext: config.additionalContext || {}
        };
    }

    private async parseMessages(messages: PromptMessage[], context: PromptContext): Promise<PromptMessage[]> {
        return Promise.all(messages.map(async message => ({
            ...message,
            content: await this.parseContent(message.content, context)
        })));
    }

    private async parseContent(content: string, context: PromptContext): Promise<string> {
        let parsedContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
        parsedContent = await this.parseRegularVariables(parsedContent, context);
        parsedContent = parsedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        return parsedContent;
    }

    private async parseRegularVariables(content: string, context: PromptContext): Promise<string> {
        const variableRegex = /\{\{([^}]+)\}\}/g;
        let result = content;

        const matches = Array.from(content.matchAll(variableRegex));

        for (const match of matches) {
            const [fullMatch, variable] = match;
            const [varName, ...params] = variable.trim().split(' ');

            if (varName === 'scenebeat' && context.scenebeat) {
                result = result.replace(fullMatch, context.scenebeat);
                continue;
            }

            if (this.variableResolvers[varName]) {
                try {
                    const resolved = await this.variableResolvers[varName](context, ...params);
                    result = result.replace(fullMatch, resolved || '');
                } catch (error) {
                    console.error(`Error resolving variable ${varName}:`, error);
                    result = result.replace(fullMatch, `[Error: ${error.message}]`);
                }
            } else {
                console.warn(`Unknown variable: ${varName}`);
                result = result.replace(fullMatch, `[Unknown variable: ${varName}]`);
            }
        }

        return result;
    }

    private async resolveSongElements(context: PromptContext): Promise<string> {
        if (!context.songElements) return '';

        const { themes, motifs, rhymeSchemes, chordProgressions, avoidList } = context.songElements;
        const parts = [];
        if (themes.length > 0) parts.push(`Themes: ${themes.join(', ')}`);
        if (motifs.length > 0) parts.push(`Motifs: ${motifs.join(', ')}`);
        if (rhymeSchemes.length > 0) parts.push(`Rhyme Schemes: ${rhymeSchemes.join(', ')}`);
        if (chordProgressions.length > 0) parts.push(`Chord Progressions: ${chordProgressions.join(', ')}`);
        if (avoidList.length > 0) parts.push(`Avoid List: ${avoidList.join(', ')}`);

        return parts.join('\n');
    }

    private async resolveSectionSummaries(context: PromptContext): Promise<string> {
        if (!context.sections) return '';
        const { getSectionSummaries } = useSectionStore.getState();
        if (context.currentSection) {
            return await getSectionSummaries(context.songId, context.currentSection.order);
        } else {
            return await getSectionSummaries(context.songId, Infinity, true);
        }
    }

    private async resolvePreviousWords(context: PromptContext, count: string = '1000'): Promise<string> {
        // ... (keeping this method as is for now)
        return context.previousWords || '';
    }

    private async resolvePoV(context: PromptContext): Promise<string> {
        if (context.povType) {
            const povCharacter = context.povType !== 'Third Person Omniscient' && context.povCharacter
                ? ` (${context.povCharacter})`
                : '';
            return `${context.povType}${povCharacter}`;
        }
        if (context.currentSection?.povType) {
            const povCharacter = context.currentSection.povType !== 'Third Person Omniscient' && context.currentSection.povCharacter
                ? ` (${context.currentSection.povCharacter})`
                : '';
            return `${context.currentSection.povType}${povCharacter}`;
        }
        return 'Third Person Omniscient';
    }

    private async resolveSectionContent(context: PromptContext): Promise<string> {
        if (!context.currentSection) return '';
        if (context.additionalContext?.plainTextContent) {
            return context.additionalContext.plainTextContent;
        }
        console.warn('No plain text content found for section:', context.currentSection.id);
        return '';
    }

    private async resolveSelectedText(context: PromptContext): Promise<string> {
        if (!context.additionalContext?.selectedText) {
            return '';
        }
        return context.additionalContext.selectedText;
    }

    private async resolveSongLanguage(context: PromptContext): Promise<string> {
        return context.songLanguage || 'English';
    }

    private async resolveChatHisong(context: PromptContext): Promise<string> {
        if (!context.additionalContext?.chatHisong?.length) {
            return 'No previous conversation history.';
        }
        return context.additionalContext.chatHisong
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
    }

    private async resolveUserInput(context: PromptContext): Promise<string> {
        if (!context.scenebeat?.trim()) {
            return 'No specific question or topic provided.';
        }
        return context.scenebeat;
    }

    private async resolveBrainstormContext(context: PromptContext): Promise<string> {
        const songElementsText = await this.resolveSongElements(context);
        const sectionSummary = await useSectionStore.getState().getAllSectionSummaries(context.songId);

        let result = '';
        if (sectionSummary) {
            result += `Song Section Summaries:\n${sectionSummary}\n\n`;
        }
        if (songElementsText) {
            result += `Song Elements:\n${songElementsText}\n\n`;
        }
        return result || "No song context is available for this query.";
    }

    private async resolveSceneBeatContext(context: PromptContext): Promise<string> {
        return await this.resolveSongElements(context);
    }

    private async resolveSectionOutline(context: PromptContext): Promise<string> {
        const { getSectionOutline } = useSectionStore.getState();
        const outline = await getSectionOutline(context.currentSection?.id);
        return outline ? outline.content : 'No section outline is available for this prompt.';
    }

    private async resolveSectionData(args: string): Promise<string> {
        const sectionOrder = parseInt(args);
        const { getSectionPlainTextBySectionOrder } = useSectionStore.getState();
        const data = await getSectionPlainTextBySectionOrder(sectionOrder);
        return data ? data : 'No section data is available for this prompt.';
    }
}

export const createPromptParser = () => new PromptParser(db);
