import { TrendingUp, Clock, AlertOctagon, MessageCircle, Zap } from 'lucide-react';
import { MOCK_STATS, MOCK_AGENT_DISTRIBUTION, MOCK_RECENT_ACTIVITY, getAgentMeta } from '../../utils/constants';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872', ink4: '#2E3A4A',
  accent: '#4F6EF7',
};

const OUTCOME_STYLE = {
  resolved:  { label: 'Resolved',  bg: 'rgba(52,211,153,0.12)',  text: '#34D399' },
  escalated: { label: 'Escalated', bg: 'rgba(251,191,36,0.12)',  text: '#FBBF24' },
  lead:      { label: 'Lead',      bg: 'rgba(79,110,247,0.12)',  text: '#4F6EF7' },
  booked:    { label: 'Booked',    bg: 'rgba(192,132,252,0.12)', text: '#C084FC' },
};

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: C.ink3, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '-0.04em', color: C.ink1, lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 14, fontWeight: 400, color: C.ink3, marginLeft: 3 }}>{unit}</span>}
      </div>
    </div>
  );
}

function AgentBar({ agent, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: C.ink2, fontSize: 12, width: 72, flexShrink: 0 }}>{agent}</span>
      <div style={{ flex: 1, backgroundColor: C.raised, borderRadius: 999, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
      </div>
      <span style={{ color: C.ink3, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', width: 28, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const total = MOCK_AGENT_DISTRIBUTION.reduce((s, a) => s + a.count, 0);

  return (
    <div style={{ padding: '28px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ color: C.ink3, fontSize: 12, margin: 0 }}>GrowMart · demo dataset</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={MessageCircle} label="Conversations"   value={MOCK_STATS.totalConversations}  color="#4F6EF7" />
        <StatCard icon={TrendingUp}    label="Resolution rate" value={MOCK_STATS.resolutionRate} unit="%" color="#34D399" />
        <StatCard icon={Clock}         label="Avg handling"    value={MOCK_STATS.avgHandlingTime}     color="#8899BB" />
        <StatCard icon={AlertOctagon}  label="Escalation rate" value={MOCK_STATS.escalationRate} unit="%" color="#FBBF24" />
        <StatCard icon={Zap}           label="Hours saved"     value={MOCK_STATS.hoursSaved} unit="/wk" color="#C084FC" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Agent distribution */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 18px' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, color: C.ink1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>By agent</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_AGENT_DISTRIBUTION.map(a => <AgentBar key={a.agent} {...a} total={total} />)}
          </div>
          <p style={{ color: C.ink3, fontSize: 11, marginTop: 14, fontFamily: 'JetBrains Mono, monospace' }}>{total} total</p>
        </div>

        {/* Recent activity */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 20px', overflow: 'hidden' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, color: C.ink1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>Recent activity</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Time', 'Agent', 'Summary', 'Outcome'].map(h => (
                  <th key={h} style={{ textAlign: 'left', paddingBottom: 10, paddingRight: 16, color: C.ink3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_RECENT_ACTIVITY.map((row, i) => {
                const meta = getAgentMeta(row.agent);
                const out = OUTCOME_STYLE[row.outcome] ?? { label: row.outcome, bg: C.raised, text: C.ink2 };
                return (
                  <tr key={i} style={{ borderBottom: i < MOCK_RECENT_ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '10px 16px 10px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.ink3, whiteSpace: 'nowrap' }}>{row.time}</td>
                    <td style={{ padding: '10px 16px 10px 0' }}>
                      <span style={{ backgroundColor: meta.bg, color: meta.hex, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', color: C.ink2, fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.summary}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{ backgroundColor: out.bg, color: out.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, fontFamily: 'Inter, sans-serif' }}>{out.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
