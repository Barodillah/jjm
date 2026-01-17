import React from 'react';

/**
 * Formats a text string into React elements based on simple markdown-like syntax.
 * Supported syntax:
 * - **bold text** -> <strong>bold text</strong>
 * - ## Header -> Large Bold Text
 * - ### Header -> Medium Bold Text
 */
export const formatMessage = (text) => {
    if (!text) return null;

    // Split by newlines to handle block level elements
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        let content = line;
        let type = 'p';
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('### ')) {
            type = 'h3';
            content = trimmedLine.substring(4);
        } else if (trimmedLine.startsWith('## ')) {
            type = 'h2';
            content = trimmedLine.substring(3);
        }

        // Parse inline bold: **text**
        const parts = content.split(/(\*\*.*?\*\*)/g);

        const formattedContent = parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return <strong key={partIndex} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        const key = lineIndex;
        // Styling based on type
        if (type === 'h2') {
            return <h2 key={key} className="text-lg font-bold mt-2 mb-1 leading-tight">{formattedContent}</h2>;
        } else if (type === 'h3') {
            return <h3 key={key} className="text-base font-bold mt-2 mb-1 leading-tight">{formattedContent}</h3>;
        } else {
            // For normal lines
            if (line.trim() === '') {
                return <div key={key} className="h-2" />; // Spacer for empty lines
            }
            return (
                <div key={key} className="mb-0.5 leading-relaxed">
                    {formattedContent}
                </div>
            );
        }
    });
};
