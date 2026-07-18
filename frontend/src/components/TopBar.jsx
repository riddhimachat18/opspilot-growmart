import { RotateCcw, Eye, EyeOff, Circle } from 'lucide-react';
import { getAgentMeta } from '../utils/constants';

function ConnectionPip({ isConnected }) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs"
      title={isConnected ? 'Backend connected' : 'Connecting…'}
      style={{ color: isConnected ? '#059669' : 'var(--ink-4)' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConnected ? '' : 'animate-pulse-dot'}`}
        style={{ backgroundColor: isConnected ? '#059669' : 'var(--ink-4)' }}
        aria-hidden="true"
      />
      {isConnected ? 'Live' : 'Connecting…'}
    </span>
  );
}

function ActiveAgentChip({ agent }) {
  if (!agent) return null;
  const meta = getAgentMeta(agent);
  return (
    <span
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: meta.bg,
        color: meta.hex,
        border: `1px solid ${meta.hex}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse-dot flex-shrink-0"
        style={{ backgroundColor: meta.hex }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export default function TopBar({ showTrace, onToggleTrace, onReset, isConnected, activeAgent }) {
  return (
    <header
      className="flex items-center gap-4 px-5 flex-shrink-0"
      style={{
        height: '54px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Page title */}
      <h1
        className="font-display text-sm font-semibold flex-shrink-0"
        style={{ color: 'var(--ink-1)' }}
      >
        Chat
      </h1>

      {/* Divider */}
      <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} aria-hidden="true" />

      {/* Active agent */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <ActiveAgentChip agent={activeAgent} />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <ConnectionPip isConnected={isConnected} />

        <div className="w-px h-4" style={{ backgroundColor: 'var(--border)' }} aria-hidden="true" />

        <button
          onClick={onToggleTrace}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{
            backgroundColor: showTrace ? 'var(--accent-light)' : 'transparent',
            color: showTrace ? 'var(--accent)' : 'var(--ink-3)',
            border: `1px solid ${showTrace ? 'var(--accent-mid)' : 'var(--border)'}`,
          }}
          aria-pressed={showTrace}
        >
          {showTrace ? <Eye size={13} /> : <EyeOff size={13} />}
          {showTrace ? 'Hide reasoning' : 'Show reasoning'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{
            color: 'var(--ink-3)',
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
          }}
          title="Start a new session"
        >
          <RotateCcw size={12} />
          New session
        </button>
      </div>
    </header>
  );
}
