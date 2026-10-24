import React, { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked with GFM (GitHub Flavored Markdown) and line breaks enabled
marked.use({
  breaks: true,
  gfm: true,
});

interface MarkdownViewProps {
  content?: string | null;
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  inline = false,
  className = '',
  style,
}) => {
  const html = useMemo(() => {
    if (!content || typeof content !== 'string') return '';
    try {
      return inline
        ? (marked.parseInline(content) as string)
        : (marked.parse(content) as string);
    } catch {
      return content;
    }
  }, [content, inline]);

  if (!html) return null;

  if (inline) {
    return (
      <span
        className={`cp-markdown-inline ${className}`.trim()}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`cp-markdown ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
