import { $generateHtmlFromNodes } from '@lexical/html';
import { LexicalEditor } from 'lexical';
import { Song, Section } from '@/types/song';
import { db } from '@/services/database';

/**
 * Converts Lexical JSON content to HTML
 * @param jsonContent The Lexical JSON content string
 * @returns HTML string representation of the content
 */
export async function convertLexicalToHtml(jsonContent: string): Promise<string> {
    try {
        // Parse the Lexical state
        const editorState = JSON.parse(jsonContent);

        // Create a temporary DOM element to hold the HTML
        const container = document.createElement('div');

        // Process nodes recursively
        const processNode = (node: any, parentElement: HTMLElement) => {
            if (node.type === 'text') {
                const textNode = document.createTextNode(node.text);
                parentElement.appendChild(textNode);
            } else if (node.type === 'paragraph') {
                const p = document.createElement('p');
                if (node.children) {
                    node.children.forEach((child: any) => processNode(child, p));
                }
                parentElement.appendChild(p);
            } else if (node.type === 'heading') {
                const headingTag = `h${node.tag}`;
                const heading = document.createElement(headingTag);
                if (node.children) {
                    node.children.forEach((child: any) => processNode(child, heading));
                }
                parentElement.appendChild(heading);
            } else if (node.children) {
                // For other node types with children, process the children
                node.children.forEach((child: any) => processNode(child, parentElement));
            }
        };

        // Process the root node
        if (editorState.root?.children) {
            editorState.root.children.forEach((node: any) => processNode(node, container));
        }

        return container.innerHTML;
    } catch (error) {
        console.error('Failed to convert Lexical to HTML:', error);
        return '';
    }
}

/**
 * Downloads content as a file
 * @param content The content to download
 * @param filename The name of the file
 * @param contentType The MIME type of the content
 */
export function downloadAsFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
}

/**
 * Downloads a song as HTML or plain text
 * @param songId The ID of the song to download
 * @param format The format to download ('html' or 'text')
 */
export async function downloadSong(songId: string, format: 'html' | 'text') {
    try {
        // Get the song
        const song = await db.songs.get(songId);
        if (!song) {
            throw new Error('Song not found');
        }

        // Get all sections for the song
        const sections = await db.sections
            .where('songId')
            .equals(songId)
            .sortBy('order');

        if (format === 'html') {
            // Create HTML content
            let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${song.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    h2 { margin-top: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 24px; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${song.title}</h1>
  <div class="meta">
    <p>Author: ${song.author}</p>
    ${song.synopsis ? `<p>Synopsis: ${song.synopsis}</p>` : ''}
  </div>`;

            // Add each section
            for (const section of sections) {
                htmlContent += `<div class="section">
    <h2 class="section-title">Section ${section.order}: ${section.title}</h2>`;

                // Convert section content to HTML
                const sectionHtml = await convertLexicalToHtml(section.content);
                htmlContent += `<div class="section-content">${sectionHtml}</div>
  </div>`;
            }

            htmlContent += `</body>
</html>`;

            // Download the HTML file
            downloadAsFile(htmlContent, `${song.title}.html`, 'text/html');
        } else {
            // Create plain text content
            let textContent = `${song.title}\n`;
            textContent += `Author: ${song.author}\n`;
            if (song.synopsis) {
                textContent += `Synopsis: ${song.synopsis}\n`;
            }
            textContent += '\n\n';

            // Add each section
            for (const section of sections) {
                textContent += `Section ${section.order}: ${section.title}\n\n`;

                // Get section plain text
                try {
                    // Parse the Lexical state
                    const editorState = JSON.parse(section.content);
                    let plainText = '';

                    const processNode = (node: any) => {
                        if (node.type === 'text') {
                            plainText += node.text;
                        } else if (node.children) {
                            node.children.forEach(processNode);
                        }
                        if (node.type === 'paragraph') {
                            plainText += '\n\n';
                        }
                    };

                    if (editorState.root?.children) {
                        editorState.root.children.forEach(processNode);
                    }

                    textContent += plainText.trim() + '\n\n';
                } catch (error) {
                    console.error('Failed to parse section content:', error);
                }
            }

            // Download the text file
            downloadAsFile(textContent, `${song.title}.txt`, 'text/plain');
        }
    } catch (error) {
        console.error('Failed to download song:', error);
        throw error;
    }
}

/**
 * Downloads a section as HTML or plain text
 * @param sectionId The ID of the section to download
 * @param format The format to download ('html' or 'text')
 */
export async function downloadSection(sectionId: string, format: 'html' | 'text') {
    try {
        // Get the section
        const section = await db.sections.get(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Get the song
        const song = await db.songs.get(section.songId);
        if (!song) {
            throw new Error('Song not found');
        }

        if (format === 'html') {
            // Create HTML content
            let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${song.title} - Section ${section.order}: ${section.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    h2 { margin-top: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 24px; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${song.title}</h1>
  <div class="section">
    <h2 class="section-title">Section ${section.order}: ${section.title}</h2>`;

            // Convert section content to HTML
            const sectionHtml = await convertLexicalToHtml(section.content);
            htmlContent += `<div class="section-content">${sectionHtml}</div>
  </div>
</body>
</html>`;

            // Download the HTML file
            downloadAsFile(htmlContent, `${song.title} - Section ${section.order}.html`, 'text/html');
        } else {
            // Create plain text content
            let textContent = `${song.title}\n`;
            textContent += `Section ${section.order}: ${section.title}\n\n`;

            // Get section plain text
            try {
                // Parse the Lexical state
                const editorState = JSON.parse(section.content);
                let plainText = '';

                const processNode = (node: any) => {
                    if (node.type === 'text') {
                        plainText += node.text;
                    } else if (node.children) {
                        node.children.forEach(processNode);
                    }
                    if (node.type === 'paragraph') {
                        plainText += '\n\n';
                    }
                };

                if (editorState.root?.children) {
                    editorState.root.children.forEach(processNode);
                }

                textContent += plainText.trim();
            } catch (error) {
                console.error('Failed to parse section content:', error);
            }

            // Download the text file
            downloadAsFile(textContent, `${song.title} - Section ${section.order}.txt`, 'text/plain');
        }
    } catch (error) {
        console.error('Failed to download section:', error);
        throw error;
    }
} 