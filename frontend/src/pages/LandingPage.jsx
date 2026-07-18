/**
 * Landing page — two-column layout.
 * Left: headline + pillars + CTA (left-aligned, not centered)
 * Right: a live-feeling mock trace panel that shows the system in action
 *        before judges even click the demo button.
 *
 * This avoids the centered-gradient-text hero which is the default AI design.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Wrench } from 'lucide-react';
import { AGENT_META } from '../utils/constants';

/* A static mock of the trace panel to show on the landing page */
const MOCK_TRACE = [
  { agent: 'orchestrator',    status: 'done',      label: 'Classified intent — Care',              detail: null },
  { agent: 'care_agent',      status: 'started',   label: 'Care Agent processing',                 detail: null },
  { agent: 'care_agent',      status: 'tool_call',  label: 'Looking up order #GM-10237',           detail: 'lookup_order("GM-10237")' },
  { agent: 'care_agent',      status: 'tool_call',  label: 'Issuing refund — ₹899',                detail: 'issue_refund("GM-10237", 899)' },
  { agent: 'care_agent',      status: 'done',       label: 'Refund confirmed',                     detail: null },
];

const RULE_COLOR = {
  orchestrator:    '#64748B',
  sales_agent:     '#2563EB',
  support_agent:   '#059669',
  care_agent:      '#9333EA',
  scheduling_agent:'#D97706',
};

const AGENT_LABEL = {
  orchestrator:    'Orchestrator',
  sales_agent:     'Sales',
  support_agent:   'Support',
  care_agent:      'Care',
  scheduling_agent:'Scheduling',
};

const BG = {
  orchestrator:    '#F1F5F9',
  care_agent:      '#FAF5FF',
  support_agent:   '#ECFDF5',
  sales_agent:     '#EFF4FF',
  scheduling_agent:'#FFFBEB',
};

function MockTraceRow({ agent, status, label, detail }) {
  const color = RULE_COLOR[agent] ?? '#64748B';
  const bg    = BG[agent] ?? '#F8FAFC';
  const agentLabel = AGENT_LABEL[agent] ?? 'Agent';

  return (
    <div
      className="pl-3 py-2.5 mb-1 rounded-r-lg"
      style={{ borderLeft: `2px solid ${color}`, backgroundColor: 'white' }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ color }}
        >
          {agentLabel}
        </span>
        {status === 'done'
          ? <CheckCircle2 size={10} style={{ color: '#059669' }} />
          : status === 'tool_call'
          ? <Wrench size={10} style={{ color: '#2563EB' }} />
          : null
        }
      </div>
      <p className="text-xs" style={{ color: '#3D4A5C' }}>{label}</p>
      {detail && (
        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#8896AB' }}>{detail}</p>
      )}
    </div>
  );
}

const PILLARS = [
  {
    heading: 'Acts, not just answers',
    body: 'Every agent runs real tools. Refunds hit Stripe. Leads land in the CRM. Calendar events book for real.',
  },
  {
    heading: 'Routes by intent',
    body: 'The orchestrator classifies every message and dispatches to the right specialist — no manual routing rules.',
  },
  {
    heading: 'Escalates responsibly',
    body: 'Refunds over ₹500 need a human. Frustrated customers get a callback booked. Guardrails are part of the design.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-full flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-10 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--ink-1)',
            }}
            aria-hidden="true"
          >
            <span
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              GM
            </span>
          </div>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--ink-1)' }}>
            GrowMart
          </span>
          <span className="text-xs" style={{ color: 'var(--ink-4)' }}>
            × OpsPilot
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs transition-colors cursor-pointer"
            style={{ color: 'var(--ink-3)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--ink-1)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--ink-3)'}
          >
            Analytics
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Open demo
            <ArrowRight size={12} />
          </button>
        </div>
      </nav>

      {/* Main two-column */}
      <main className="flex-1 flex items-center px-10 py-16 max-w-6xl mx-auto w-full gap-16">

        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Agent badges — small, functional, not decorative */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.entries(AGENT_META).map(([key, m]) => (
              <span
                key={key}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: m.bg,
                  color: m.hex,
                  border: `1px solid ${m.hex}20`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <h1
            className="font-display font-bold leading-[1.1] mb-5"
            style={{ fontSize: '2.6rem', color: 'var(--ink-1)', letterSpacing: '-0.03em' }}
          >
            One AI ops team.<br />
            Sales, support, and care.
          </h1>

          <p
            className="text-base leading-relaxed mb-8 max-w-lg"
            style={{ color: 'var(--ink-2)' }}
          >
            GrowMart's support layer, rebuilt with specialist agents that route, act, and escalate — not just respond. Watch every decision in real time.
          </p>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white mb-10 cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Try the live demo
            <ArrowRight size={15} />
          </button>

          {/* Pillars — horizontal list, not cards */}
          <div
            className="space-y-5 pt-8"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {PILLARS.map(({ heading, body }) => (
              <div key={heading} className="flex gap-3">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink-1)' }}>{heading}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — live mock trace panel */}
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden"
          style={{
            width: '320px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.07)',
          }}
        >
          {/* Mock chat bubble at top */}
          <div
            className="px-4 py-4"
            style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex justify-end mb-3">
              <div
                className="text-xs text-white px-3 py-2 rounded-xl rounded-br-sm max-w-[80%]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                I'd like a refund for order #GM-10237. It broke after a week.
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}
              />
              <div
                className="text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[80%]"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
              >
                Your refund of ₹899 has been processed. Allow 3–5 business days.
              </div>
            </div>
          </div>

          {/* Mock trace panel */}
          <div style={{ backgroundColor: 'var(--bg-panel)' }}>
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#059669' }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                Agent reasoning
              </span>
            </div>
            <div className="px-3 py-3 space-y-0">
              {MOCK_TRACE.map((t, i) => (
                <MockTraceRow key={i} {...t} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
