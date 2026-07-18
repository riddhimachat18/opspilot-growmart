import { Bot, User, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Tailored markdown component map — keeps prose tight inside chat bubbles.
// No full reset needed; just override the elements that typically appear
// in support/sales responses: bold, lists, paragraphs, inline code.
const MD_COMPONENTS = {
  // Paragraphs: remove default margin except between siblings
  p: ({ children }) => (
    <p style={{ margin: '0 0 8px', lineHeight: '1.6' }} className="last:mb-0">
      {children}
    </p>
  ),
  // Bold: slightly brighter so it reads on the dark/light bubble
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: 'inherit' }}>{children}</strong>
  ),
  // Italic
  em: ({ children }) => (
    <em style={{ fontStyle: 'italic' }}>{children}</em>
  ),
  // Ordered list — numbered steps (troubleshooting etc.)
  ol: ({ children }) => (
    <ol style={{ margin: '6px 0 8px', paddingLeft: 18, lineHeight: 1.65 }}>
      {children}
    </ol>
  ),
  // Unordered list
  ul: ({ children }) => (
    <ul style={{ margin: '6px 0 8px', paddingLeft: 18, lineHeight: 1.65 }}>
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: 3 }}>{children}</li>
  ),
  // Inline code — monospace for order IDs, product names etc.
  code: ({ children }) => (
    <code style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.85em',
      backgroundColor: 'rgba(0,0,0,0.08)',
      borderRadius: 4,
      padding: '1px 5px',
    }}>
      {children}
    </code>
  ),
  // Suppress headings — they don't belong in a chat bubble
  h1: ({ children }) => <p style={{ fontWeight: 700, marginBottom: 6 }}>{children}</p>,
  h2: ({ children }) => <p style={{ fontWeight: 700, marginBottom: 6 }}>{children}</p>,
  h3: ({ children }) => <p style={{ fontWeight: 600, marginBottom: 4 }}>{children}</p>,
  // No horizontal rules in chat
  hr: () => null,
};

export default function MessageBubble({ message }) {
  const { role, text, isStreaming } = message;

  if (role === 'user') {
    return (
      <div className="flex justify-end gap-2.5 items-end">
        <div
          className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {text}
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}
          aria-hidden="true"
        >
          <User size={13} style={{ color: 'var(--ink-3)' }} />
        </div>
      </div>
    );
  }

  if (role === 'error') {
    return (
      <div className="flex gap-2.5 items-start">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
          aria-hidden="true"
        >
          <AlertCircle size={13} style={{ color: '#DC2626' }} />
        </div>
        <div
          className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
          role="alert"
        >
          {text}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex gap-2.5 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}
        aria-hidden="true"
      >
        <Bot size={13} style={{ color: 'var(--accent)' }} />
      </div>
      <div
        className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--ink-2)',
        }}
      >
        {text ? (
          <>
            <ReactMarkdown components={MD_COMPONENTS}>
              {text}
            </ReactMarkdown>
            {isStreaming && (
              <span
                className="inline-block w-[2px] h-[0.85em] animate-cursor ml-px align-middle"
                style={{ backgroundColor: 'var(--accent)' }}
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          /* Thinking dots while waiting for first token */
          <span className="flex gap-1.5 items-center h-4" aria-label="Thinking">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--ink-4)', animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--ink-4)', animationDelay: '200ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--ink-4)', animationDelay: '400ms' }} />
          </span>
        )}
      </div>
    </div>
  );
}
