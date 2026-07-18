/**
 * TraceEvent — the signature element of the whole UI.
 * A left-border colored rule (not a dot) signals which agent this belongs to.
 * Monospace detail line only when there's real data to show.
 */

import { CheckCircle2, Loader2, Wrench, AlertTriangle } from 'lucide-react';
import { getAgentMeta } from '../utils/constants';

function StatusIcon({ status }) {
  const base = 'flex-shrink-0';
  switch (status) {
    case 'started':
      return <Loader2 size={11} className={`animate-spin ${base}`} style={{ color: 'var(--ink-4)' }} />;
    case 'done':
      return <CheckCircle2 size={11} className={base} style={{ color: '#059669' }} />;
    case 'tool_call':
      return <Wrench size={11} className={base} style={{ color: 'var(--accent)' }} />;
    case 'error':
      return <AlertTriangle size={11} className={base} style={{ color: '#DC2626' }} />;
    default:
      return <CheckCircle2 size={11} className={base} style={{ color: 'var(--ink-4)' }} />;
  }
}

export default function TraceEvent({ event }) {
  const { agent, status, action, detail, timestamp } = event;
  const meta = getAgentMeta(agent);

  const label =
    action
      ? action
      : status === 'started'
      ? `${meta.label} processing`
      : status === 'done'
      ? `${meta.label} done`
      : meta.label;

  return (
    <div
      className={`animate-fade-up pl-3 py-2.5 mb-1 rounded-r-lg ${meta.ruleClass}`}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ color: meta.hex }}
        >
          {meta.label}
        </span>
        <StatusIcon status={status} />
        <span
          className="ml-auto text-[10px] font-mono flex-shrink-0 pr-2"
          style={{ color: 'var(--ink-4)' }}
        >
          {timestamp}
        </span>
      </div>

      {/* Label */}
      <p className="text-xs pr-3 leading-snug" style={{ color: 'var(--ink-2)' }}>
        {label}
      </p>

      {/* Detail — monospace, only when present */}
      {detail && (
        <p
          className="font-mono text-[11px] mt-1 pr-3 leading-snug break-all"
          style={{ color: 'var(--ink-3)' }}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
