import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import TraceEvent from './TraceEvent';
import { getAgentMeta } from '../utils/constants';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-5 text-center select-none">
      <Activity size={20} style={{ color: 'var(--ink-4)' }} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-4)' }}>
        Send a message and watch each agent's reasoning appear here step by step.
      </p>
    </div>
  );
}

function ActiveBanner({ agent }) {
  const meta = getAgentMeta(agent);
  return (
    <div
      className="flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-xs font-medium"
      style={{
        backgroundColor: meta.bg,
        border: `1px solid ${meta.hex}25`,
        color: meta.hex,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse-dot flex-shrink-0"
        style={{ backgroundColor: meta.hex }}
        aria-hidden="true"
      />
      {meta.label} is working
    </div>
  );
}

export default function TracePanel({ events, activeAgent, isVisible }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isVisible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isVisible]);

  if (!isVisible) return null;

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{
        width: '288px',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        overflow: 'hidden',
      }}
      aria-label="Agent Trace Panel"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: 'var(--accent)' }} />
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--ink-2)' }}
          >
            Agent reasoning
          </span>
        </div>
        {events.length > 0 && (
          <span
            className="font-mono text-[10px]"
            style={{ color: 'var(--ink-4)' }}
          >
            {events.length}
          </span>
        )}
      </div>

      {/* Active banner */}
      {activeAgent && (
        <div className="pt-2 pb-0">
          <ActiveBanner agent={activeAgent} />
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((ev) => (
            <TraceEvent key={ev.id} event={ev} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}
