import { TrendingUp, Clock, AlertOctagon, MessageCircle, Zap } from 'lucide-react';
import {
  MOCK_STATS,
  MOCK_AGENT_DISTRIBUTION,
  MOCK_RECENT_ACTIVITY,
  getAgentMeta,
} from '../utils/constants';

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div>
        <span className="font-display text-3xl font-bold" style={{ color: 'var(--ink-1)' }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm ml-1" style={{ color: 'var(--ink-3)' }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

function AgentBar({ agent, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 flex-shrink-0" style={{ color: 'var(--ink-2)' }}>{agent}</span>
      <div
        className="flex-1 rounded-full h-1.5 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-panel)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.6s ease' }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--ink-3)' }}>
        {count}
      </span>
    </div>
  );
}

const OUTCOME_STYLE = {
  resolved:  { label: 'Resolved',  bg: '#ECFDF5', text: '#059669' },
  escalated: { label: 'Escalated', bg: '#FFFBEB', text: '#D97706' },
  lead:      { label: 'Lead',      bg: '#EFF4FF', text: '#2563EB' },
  booked:    { label: 'Booked',    bg: '#FAF5FF', text: '#9333EA' },
};

function OutcomeBadge({ outcome }) {
  const s = OUTCOME_STYLE[outcome] ?? { label: outcome, bg: 'var(--bg-panel)', text: 'var(--ink-3)' };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const total = MOCK_AGENT_DISTRIBUTION.reduce((s, a) => s + a.count, 0);

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--ink-1)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ink-3)' }}>
          Demo dataset · GrowMart ops
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <StatCard icon={MessageCircle} label="Conversations"   value={MOCK_STATS.totalConversations}  color="#2563EB" />
        <StatCard icon={TrendingUp}    label="Resolution rate" value={MOCK_STATS.resolutionRate} unit="%" color="#059669" />
        <StatCard icon={Clock}         label="Avg handling"    value={MOCK_STATS.avgHandlingTime}     color="#64748B" />
        <StatCard icon={AlertOctagon}  label="Escalation rate" value={MOCK_STATS.escalationRate} unit="%" color="#D97706" />
        <StatCard icon={Zap}           label="Hours saved"     value={MOCK_STATS.hoursSaved} unit="/wk" color="#9333EA" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Agent breakdown */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--ink-1)' }}>
            Conversations by agent
          </h2>
          <div className="space-y-3.5">
            {MOCK_AGENT_DISTRIBUTION.map((a) => (
              <AgentBar key={a.agent} {...a} total={total} />
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--ink-4)' }}>
            {total} total
          </p>
        </div>

        {/* Recent activity */}
        <div
          className="xl:col-span-2 rounded-xl p-5 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--ink-1)' }}>
            Recent activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Time', 'Agent', 'Summary', 'Outcome'].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 pr-4 font-medium text-[11px] uppercase tracking-wide last:pr-0"
                      style={{ color: 'var(--ink-4)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_ACTIVITY.map((row, i) => {
                  const meta = getAgentMeta(row.agent);
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: i < MOCK_RECENT_ACTIVITY.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                    >
                      <td className="py-3 pr-4 font-mono" style={{ color: 'var(--ink-4)' }}>
                        {row.time}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: meta.bg, color: meta.hex }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate" style={{ color: 'var(--ink-2)' }}>
                        {row.summary}
                      </td>
                      <td className="py-3">
                        <OutcomeBadge outcome={row.outcome} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
