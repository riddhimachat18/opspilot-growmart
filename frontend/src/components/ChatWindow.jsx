import { useEffect, useRef, useState } from 'react';
import { Send, ChevronDown, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { DEMO_SCENARIOS, getAgentMeta } from '../utils/constants';

function AgentChip({ agent }) {
  if (!agent) return null;
  const meta = getAgentMeta(agent);
  return (
    <div
      className="flex items-center gap-1.5 text-xs mb-2"
      style={{ color: meta.hex }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
        style={{ backgroundColor: meta.hex }}
        aria-hidden="true"
      />
      {meta.label} agent
    </div>
  );
}

function WelcomePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center select-none">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}
        aria-hidden="true"
      >
        <Sparkles size={20} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p
          className="font-display text-base font-semibold mb-2"
          style={{ color: 'var(--ink-1)' }}
        >
          GrowMart customer ops
        </p>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--ink-3)' }}>
          Ask about an order, get product advice, request a refund, or book a callback.
          The right agent handles it automatically.
        </p>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, activeAgent, isProcessing, onSend }) {
  const [input, setInput] = useState('');
  const [showScenarios, setShowScenarios] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isProcessing) return;
    onSend(text);
    setInput('');
    setShowScenarios(false);
  };

  const handleScenarioPick = (prompt) => {
    onSend(prompt);
    setShowScenarios(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <WelcomePlaceholder />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input footer */}
      <div
        className="flex-shrink-0 px-5 pt-3 pb-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <AgentChip agent={activeAgent} />

        {/* Scenario picker */}
        <div className="relative mb-2.5">
          <button
            onClick={() => setShowScenarios((s) => !s)}
            className="flex items-center gap-1 text-xs transition-colors cursor-pointer"
            style={{ color: 'var(--ink-3)' }}
            aria-expanded={showScenarios}
            aria-haspopup="listbox"
          >
            Try a scenario
            <ChevronDown
              size={11}
              className={`transition-transform ${showScenarios ? 'rotate-180' : ''}`}
            />
          </button>

          {showScenarios && (
            <div
              className="absolute bottom-full mb-1.5 left-0 rounded-xl overflow-hidden z-20"
              style={{
                width: '340px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              }}
              role="listbox"
              aria-label="Demo scenarios"
            >
              {DEMO_SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  role="option"
                  onClick={() => handleScenarioPick(s.prompt)}
                  className="w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer"
                  style={{
                    borderBottom: i < DEMO_SCENARIOS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    color: 'var(--ink-2)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-panel)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span
                    className="block text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: 'var(--ink-4)' }}
                  >
                    {s.label}
                  </span>
                  <span className="leading-snug line-clamp-2">{s.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input row */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your order, products, or account…"
            disabled={isProcessing}
            aria-label="Chat input"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-colors"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--ink-1)',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-mid)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            aria-label="Send"
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Send size={14} color="white" />
          </button>
        </form>
      </div>
    </div>
  );
}
