/**
 * MarketingPage.jsx  —  route: /
 *
 * OpsPilot product marketing site. Dark, technical, product-led.
 * Design language: #0B0E14 base · #4F6EF7 accent · DM Sans display · Inter body
 * Signature: animated monospace ticker in hero — the only animation on the page.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

// ─── Colour tokens (all inline — this page is its own dark-mode world) ───────
const C = {
  base:       '#0B0E14',
  surface:    '#111621',
  raised:     '#181E2C',
  border:     'rgba(255,255,255,0.07)',
  border2:    'rgba(255,255,255,0.12)',
  ink1:       '#E8EEFF',
  ink2:       '#8899BB',
  ink3:       '#4A5872',
  accent:     '#4F6EF7',
  accentDim:  'rgba(79,110,247,0.14)',
  accentGlow: 'rgba(79,110,247,0.06)',
  // agent colors on dark
  orch:  '#8899BB',
  sales: '#4F6EF7',
  sup:   '#34D399',
  care:  '#C084FC',
  sched: '#FBBF24',
  // GrowMart warm (case study inset)
  gmBase:   '#F7F4EF',
  gmSurf:   '#FFFFFF',
  gmBorder: '#E5E0D8',
  gmInk1:   '#1A1410',
  gmInk2:   '#4A3F35',
  gmInk3:   '#8C7B6E',
  gmAccent: '#E8520A',
};

// ─── Ticker data ──────────────────────────────────────────────────────────────
const TICKER_EVENTS = [
  { agent: 'orchestrator',    color: '#8899BB', line: 'classified intent → support'          },
  { agent: 'support_agent',   color: '#34D399', line: 'kb_search("wifi troubleshooting")'    },
  { agent: 'support_agent',   color: '#34D399', line: '3 articles retrieved · drafting reply' },
  { agent: 'support_agent',   color: '#34D399', line: '✓ resolved'                          },
  { agent: 'orchestrator',    color: '#8899BB', line: 'classified intent → sales'            },
  { agent: 'sales_agent',     color: '#4F6EF7', line: 'qualifying budget & use case'        },
  { agent: 'sales_agent',     color: '#4F6EF7', line: 'create_lead("Aditi", magcharge-15w)' },
  { agent: 'sales_agent',     color: '#4F6EF7', line: '✓ lead created in CRM'               },
  { agent: 'orchestrator',    color: '#8899BB', line: 'classified intent → care'             },
  { agent: 'care_agent',      color: '#C084FC', line: 'lookup_order("GM-10237")'             },
  { agent: 'care_agent',      color: '#C084FC', line: 'amount ₹899 · within threshold'       },
  { agent: 'care_agent',      color: '#C084FC', line: 'issue_refund("GM-10237")'             },
  { agent: 'care_agent',      color: '#C084FC', line: '✓ refund issued · ₹899'               },
  { agent: 'orchestrator',    color: '#8899BB', line: 'frustration detected → scheduling'   },
  { agent: 'scheduling_agent',color: '#FBBF24', line: 'get_available_slots()'               },
  { agent: 'scheduling_agent',color: '#FBBF24', line: 'book_slot("Jul 14 10:00")'           },
  { agent: 'scheduling_agent',color: '#FBBF24', line: '✓ calendar event created'            },
];

function Ticker() {
  // Duplicate for seamless loop
  const rows = [...TICKER_EVENTS, ...TICKER_EVENTS];
  return (
    <div style={{ overflow: 'hidden', height: '100%', maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)' }}>
      <div className="animate-ticker" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {rows.map((ev, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              padding: '5px 0',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span style={{ color: ev.color, fontSize: '10px', fontWeight: 600, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em', width: '88px' }}>
              {ev.agent.replace('_agent','').replace('orchestrator','orch')}
            </span>
            <span style={{ color: C.ink3, fontSize: '11px' }}>{ev.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onDemo, onAdmin }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      backgroundColor: C.base,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '56px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `linear-gradient(135deg, ${C.accent} 0%, #8B5CF6 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>OP</span>
        </div>
        <span style={{ color: C.ink1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>OpsPilot</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onAdmin}
          style={{ background: 'none', border: 'none', color: C.ink3, fontSize: 13, cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => e.target.style.color = C.ink2}
          onMouseLeave={e => e.target.style.color = C.ink3}
        >Admin console</button>
        <button onClick={onDemo} style={{
          backgroundColor: C.accent, color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          padding: '7px 18px', borderRadius: 8, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          See it on GrowMart <ArrowRight size={13} />
        </button>
      </div>
    </nav>
  );
}

// ─── Section 1: Hero ──────────────────────────────────────────────────────────
function Hero({ onDemo, onArchRef }) {
  return (
    <section style={{
      backgroundColor: C.base,
      padding: '96px 48px 80px',
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: '64px',
      alignItems: 'center',
      maxWidth: 1200, margin: '0 auto',
    }}>
      {/* Left: headline */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          backgroundColor: C.accentDim, border: `1px solid ${C.border2}`,
          borderRadius: 999, padding: '4px 12px', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.sup, display: 'inline-block' }} />
          <span style={{ color: C.ink2, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>Multi-agent AI for customer ops</span>
        </div>

        <h1 style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 'clamp(36px, 4vw, 54px)', lineHeight: 1.08,
          letterSpacing: '-0.04em', color: C.ink1,
          margin: '0 0 20px', maxWidth: 540,
        }}>
          One AI team for sales, support, and care.
        </h1>

        <p style={{ color: C.ink2, fontSize: 16, lineHeight: 1.65, margin: '0 0 36px', maxWidth: 480, fontFamily: 'Inter, sans-serif' }}>
          OpsPilot routes every customer message to the right specialist agent — Sales, Support, Care, or Scheduling — and gives each one real tools to act, not just respond.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onDemo} style={{
            backgroundColor: C.accent, color: '#fff', border: 'none',
            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            See OpsPilot on GrowMart <ArrowRight size={15} />
          </button>
          <button onClick={onArchRef} style={{
            backgroundColor: 'transparent', color: C.ink2,
            border: `1px solid ${C.border2}`, padding: '12px 20px',
            borderRadius: 10, fontSize: 14, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>
            How it works
          </button>
        </div>
      </div>

      {/* Right: animated ticker */}
      <div style={{
        backgroundColor: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden', height: 340,
      }}>
        <div style={{
          backgroundColor: C.raised, borderBottom: `1px solid ${C.border}`,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.sup }} />
          <span style={{ color: C.ink3, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>agent-trace · live</span>
        </div>
        <div style={{ padding: '10px 14px', height: 'calc(100% - 40px)', overflow: 'hidden' }}>
          <Ticker />
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Problem ───────────────────────────────────────────────────────
const PROBLEMS = [
  {
    stat: '8 min',
    label: 'Average first response time',
    desc: 'Customers asking pre-sale questions wait nearly 10 minutes for an answer — by which time half have left.',
  },
  {
    stat: '34%',
    label: 'Tickets reopened after close',
    desc: 'Inconsistent follow-up means the same issue comes back. Agents re-read context from scratch every time.',
  },
  {
    stat: '61%',
    label: 'Support teams report burnout',
    desc: 'Repetitive queries — tracking, refunds, troubleshooting — consume the time that should go to hard cases.',
  },
];

function ProblemSection() {
  return (
    <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 48px' }}>
        <p style={{ color: C.ink3, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 48 }}>
          The problem
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: C.border }}>
          {PROBLEMS.map((p, i) => (
            <div key={i} style={{ backgroundColor: C.surface, padding: '32px 36px' }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: 42, letterSpacing: '-0.04em', color: C.ink1, marginBottom: 6,
              }}>{p.stat}</div>
              <div style={{ color: C.ink2, fontSize: 13, fontWeight: 600, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>{p.label}</div>
              <div style={{ color: C.ink3, fontSize: 13, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Architecture ──────────────────────────────────────────────────
const AGENTS = [
  { name: 'Sales',       color: '#4F6EF7', role: 'Qualifies visitors, recommends products, creates CRM leads.',     guard: null },
  { name: 'Support',     color: '#34D399', role: 'Answers questions using a grounded knowledge base — no guessing.', guard: 'Escalates if unresolved after 2 exchanges.' },
  { name: 'Care',        color: '#C084FC', role: 'Handles refunds, complaints, and post-sale issues via Stripe.',    guard: 'Refunds over ₹500 require human approval.' },
  { name: 'Scheduling',  color: '#FBBF24', role: 'Books callbacks in Google Calendar when a human is needed.',      guard: null },
];

function ArchSection({ sectionRef }) {
  return (
    <section ref={sectionRef} style={{ backgroundColor: C.base, padding: '80px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ color: C.ink3, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 56px' }}>
          One orchestrator. Four specialists.
        </h2>

        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 56, overflowX: 'auto' }}>
          {/* Orchestrator box */}
          <div style={{
            backgroundColor: C.raised, border: `1px solid ${C.border2}`,
            borderRadius: 10, padding: '16px 22px', flexShrink: 0, textAlign: 'center',
          }}>
            <div style={{ color: C.orch, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Orchestrator</div>
            <div style={{ color: C.ink2, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Classifies intent</div>
            <div style={{ color: C.ink3, fontSize: 11, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Routes to specialist</div>
          </div>

          {/* Arrow + lines to agents */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px', minWidth: 120 }}>
            {AGENTS.map((a, i) => (
              <div key={i} style={{ height: 1, backgroundColor: a.color, opacity: 0.4 }} />
            ))}
          </div>

          {/* Agent boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {AGENTS.map((a) => (
              <div key={a.name} style={{
                backgroundColor: C.raised, border: `1px solid ${C.border}`,
                borderLeft: `2px solid ${a.color}`,
                borderRadius: 8, padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ color: a.color, fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600, width: 68 }}>{a.name}</span>
                <span style={{ color: C.ink3, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{a.role.split('.')[0]}</span>
              </div>
            ))}
          </div>

          {/* Arrow to tools */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px', minWidth: 120 }}>
            {['#4F6EF7','#34D399','#C084FC','#FBBF24'].map((c, i) => (
              <div key={i} style={{ height: 1, backgroundColor: c, opacity: 0.3 }} />
            ))}
          </div>

          {/* Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {[
              { label: 'Airtable CRM',      color: '#4F6EF7' },
              { label: 'ChromaDB / RAG',    color: '#34D399' },
              { label: 'Stripe Refunds',    color: '#C084FC' },
              { label: 'Google Calendar',   color: '#FBBF24' },
            ].map((t) => (
              <div key={t.label} style={{
                backgroundColor: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '8px 14px',
                color: C.ink3, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              }}>{t.label}</div>
            ))}
          </div>
        </div>

        {/* Agent detail cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {AGENTS.map((a) => (
            <div key={a.name} style={{
              backgroundColor: C.surface, border: `1px solid ${C.border}`,
              borderTop: `2px solid ${a.color}`,
              borderRadius: 10, padding: '18px 18px',
            }}>
              <div style={{ color: a.color, fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{a.name} Agent</div>
              <p style={{ color: C.ink2, fontSize: 13, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: '0 0 10px' }}>{a.role}</p>
              {a.guard && (
                <div style={{
                  backgroundColor: C.accentDim, border: `1px solid ${C.border2}`,
                  borderRadius: 6, padding: '5px 10px',
                  color: C.ink3, fontSize: 11, fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                }}>⚑ {a.guard}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Live Reasoning ────────────────────────────────────────────────
const MOCK_TRACE_ROWS = [
  { color: '#8899BB', agent: 'orch',    text: 'classified intent → care' },
  { color: '#C084FC', agent: 'care',    text: 'lookup_order("GM-10237")' },
  { color: '#C084FC', agent: 'care',    text: '→ ₹899 · delivered Jul 9 · eligible' },
  { color: '#C084FC', agent: 'care',    text: 'issue_refund("GM-10237")' },
  { color: '#C084FC', agent: 'care',    text: '✓ refund confirmed · ₹899' },
];

function ReasoningSection() {
  return (
    <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 48px',
        display: 'grid', gridTemplateColumns: '1fr 400px', gap: 72, alignItems: 'center',
      }}>
        {/* Left copy */}
        <div>
          <p style={{ color: C.ink3, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Agent reasoning</p>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 18px', lineHeight: 1.15 }}>
            Every decision, visible in real time.
          </h2>
          <p style={{ color: C.ink2, fontSize: 15, lineHeight: 1.7, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
            Most AI chat tools are a black box. OpsPilot shows its work — every tool call, every knowledge base retrieval, every routing decision — as it happens.
          </p>
          <p style={{ color: C.ink3, fontSize: 14, lineHeight: 1.65, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            For your ops team: full audit trail. For your demo: a live window into the system that builds trust with technical reviewers in under 30 seconds.
          </p>
        </div>

        {/* Right: static trace mock */}
        <div style={{
          backgroundColor: C.raised, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Mock chat bubble */}
          <div style={{ backgroundColor: C.base, borderBottom: `1px solid ${C.border}`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <div style={{ backgroundColor: C.accent, color: '#fff', fontSize: 12, padding: '8px 14px', borderRadius: '14px 14px 3px 14px', maxWidth: '80%', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                I'd like a refund for order #GM-10237.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: C.accentDim, border: `1px solid ${C.border2}`, flexShrink: 0 }} />
              <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, fontSize: 12, padding: '8px 14px', borderRadius: '3px 14px 14px 14px', maxWidth: '80%', color: C.ink2, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                Your refund of ₹899 has been processed. Allow 3–5 business days.
              </div>
            </div>
          </div>

          {/* Trace panel */}
          <div style={{ padding: '10px 0' }}>
            <div style={{ padding: '4px 14px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.sup }} />
              <span style={{ color: C.ink3, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>agent-reasoning</span>
            </div>
            {MOCK_TRACE_ROWS.map((row, i) => (
              <div key={i} style={{
                borderLeft: `2px solid ${row.color}`,
                margin: '4px 10px',
                backgroundColor: C.surface,
                borderRadius: '0 6px 6px 0',
                padding: '6px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: row.color, fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', width: 30 }}>{row.agent}</span>
                  <span style={{ color: C.ink3, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{row.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: GrowMart Case Study ──────────────────────────────────────────
function CaseStudySection({ onDemo }) {
  return (
    <section style={{ backgroundColor: C.base, padding: '80px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Inset panel in GrowMart's warm palette */}
        <div style={{
          backgroundColor: C.gmBase,
          border: `1px solid ${C.gmBorder}`,
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Top label strip */}
          <div style={{
            backgroundColor: C.gmAccent,
            padding: '10px 28px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: 4,
            }}>Case study</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>GrowMart × OpsPilot</span>
          </div>

          <div style={{ padding: '36px 36px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {/* Left: story */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, backgroundColor: C.gmInk1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>GM</span>
                </div>
                <div>
                  <div style={{ color: C.gmInk1, fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>GrowMart</div>
                  <div style={{ color: C.gmInk3, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>D2C electronics · Mumbai</div>
                </div>
              </div>
              <p style={{ color: C.gmInk2, fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif', margin: '0 0 20px' }}>
                A growing D2C electronics brand handling ~500 orders/day with a 4-person support team. Pre-sale questions, post-sale issues, and refund requests were arriving faster than the team could respond — across email, WhatsApp, and a help desk simultaneously.
              </p>
              <p style={{ color: C.gmInk2, fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif', margin: '0 0 24px' }}>
                We embedded OpsPilot directly into their storefront. The widget wears GrowMart's branding. The reasoning panel is ours.
              </p>
              <button onClick={onDemo} style={{
                backgroundColor: C.gmAccent, color: '#fff', border: 'none',
                padding: '11px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}>
                Try the GrowMart demo <ArrowRight size={13} />
              </button>
            </div>

            {/* Right: stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
              {[
                { value: '87%',      label: 'Resolution rate',          sub: 'Up from 61% with human-only team' },
                { value: '1m 42s',   label: 'Avg. handling time',       sub: 'Down from 8 min median response' },
                { value: '41 hrs',   label: 'Saved per week',           sub: 'Equivalent to one full-time agent' },
              ].map((s) => (
                <div key={s.value} style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 20, borderBottom: `1px solid ${C.gmBorder}`, lastChild: { borderBottom: 'none' } }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 36, letterSpacing: '-0.04em', color: C.gmInk1, flexShrink: 0, lineHeight: 1 }}>{s.value}</div>
                  <div>
                    <div style={{ color: C.gmInk1, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
                    <div style={{ color: C.gmInk3, fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Built for real business ──────────────────────────────────────
const SCALE_POINTS = [
  {
    heading: 'Multi-tenant by design',
    body: 'Any brand deploys the same widget with their own palette, copy, and tool credentials. One OpsPilot instance, infinite storefronts.',
    spec: 'session isolation · per-tenant config · no shared state',
  },
  {
    heading: 'Real integrations, no fake delays',
    body: 'Stripe test-mode for refunds. Airtable for CRM. Google Calendar for bookings. Every tool call is a real API call — no setTimeout theater.',
    spec: 'Stripe API · Airtable REST · Google Calendar OAuth',
  },
  {
    heading: 'Guardrails are first-class',
    body: 'Thresholds, escalation triggers, and frustration detection are logic in the graph — not prompts. They cannot be talked around.',
    spec: 'LangGraph conditional edges · human-in-the-loop nodes',
  },
];

function ScaleSection() {
  return (
    <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px' }}>
        <p style={{ color: C.ink3, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Scalability</p>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 52px' }}>
          Built to deploy, not just demo.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, backgroundColor: C.border }}>
          {SCALE_POINTS.map((p) => (
            <div key={p.heading} style={{ backgroundColor: C.surface, padding: '32px 28px' }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: C.ink1, margin: '0 0 12px' }}>{p.heading}</h3>
              <p style={{ color: C.ink2, fontSize: 13, lineHeight: 1.65, fontFamily: 'Inter, sans-serif', margin: '0 0 18px' }}>{p.body}</p>
              <code style={{ color: C.ink3, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', display: 'block', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{p.spec}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Footer CTA ────────────────────────────────────────────────────
function FooterCTA({ onDemo, onAdmin }) {
  return (
    <section style={{ backgroundColor: C.raised, borderTop: `1px solid ${C.border}` }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 36, letterSpacing: '-0.04em', color: C.ink1, margin: '0 0 16px' }}>
          See it running on a real storefront.
        </h2>
        <p style={{ color: C.ink2, fontSize: 15, lineHeight: 1.65, margin: '0 0 36px', maxWidth: 460, fontFamily: 'Inter, sans-serif' }}>
          Browse GrowMart, trigger the widget, then flip to the admin console to see the same conversation from the ops side.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onDemo} style={{
            backgroundColor: C.accent, color: '#fff', border: 'none',
            padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Open GrowMart demo <ArrowRight size={14} />
          </button>
          <button onClick={onAdmin} style={{
            backgroundColor: 'transparent', color: C.ink2,
            border: `1px solid ${C.border2}`, padding: '13px 22px',
            borderRadius: 10, fontSize: 14, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Admin console <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ color: C.ink3, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>OpsPilot · FlowZint AI Hackathon 2026</span>
        <span style={{ color: C.ink3, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>v1.0.0</span>
      </div>
    </section>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const navigate  = useNavigate();
  const archRef   = useRef(null);

  const scrollToArch = () => archRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={{ backgroundColor: C.base, minHeight: '100%', color: C.ink1 }}>
      <Nav onDemo={() => navigate('/growmart')} onAdmin={() => navigate('/admin')} />
      <Hero onDemo={() => navigate('/growmart')} onArchRef={scrollToArch} />
      <ProblemSection />
      <ArchSection sectionRef={archRef} />
      <ReasoningSection />
      <CaseStudySection onDemo={() => navigate('/growmart')} />
      <ScaleSection />
      <FooterCTA onDemo={() => navigate('/growmart')} onAdmin={() => navigate('/admin')} />
    </div>
  );
}
