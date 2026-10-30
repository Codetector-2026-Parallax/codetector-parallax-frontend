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
  onImageClick?: (src: string, alt: string) => void;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  inline = false,
  className = '',
  style,
  onImageClick,
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

  const handleContainerClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'img') {
      const img = target as HTMLImageElement;
      onImageClick?.(img.src, img.alt || 'Hình ảnh tư liệu');
    }
  };

  if (!html) return null;

  if (inline) {
    return (
      <span
        className={`cp-markdown-inline ${className}`.trim()}
        style={style}
        onClick={onImageClick ? handleContainerClick : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`cp-markdown ${className}`.trim()}
      style={style}
      onClick={onImageClick ? handleContainerClick : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
