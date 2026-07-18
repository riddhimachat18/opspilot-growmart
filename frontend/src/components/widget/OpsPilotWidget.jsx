/**
 * OpsPilotWidget — floating chat widget for GrowMart storefront.
 *
 * Palette: warm off-white chat (#FFFBF7) / cool light trace (#EEF0F3)
 * The seam between warm chat and cool trace is the signature design detail.
 *
 * Props:
 *   autoMessage — if set, opens the widget and sends this message immediately
 *   onCartUpdate(productId, qty) — called when backend signals cart_updated
 *   onRefund(amount) — called when backend signals refund_issued
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageCircle, Eye, EyeOff, Send, ChevronDown, RotateCcw, Wrench, CheckCircle2, Loader2, GripHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChatSocket } from '../../hooks/useChatSocket';
import { DEMO_SCENARIOS, getAgentMeta } from '../../utils/constants';

const GM_ACCENT = '#E8520A';

// Warm chat palette
const W = {
  chatBg:      '#FFFBF7',
  userBubble:  '#E8520A',
  agentBubble: '#F4F1EC',
  agentText:   '#2D2318',
  inputBg:     '#FFF8F3',
  inputBorder: '#E8E0D8',
  headerBg:    '#FFFFFF',
  headerBorder:'#EDE8E2',
  ink1:        '#2D2318',
  ink2:        '#6B5B4E',
  ink3:        '#A8998C',
};
// Cool trace palette
const T = {
  bg:      '#EEF0F3',
  border:  'rgba(0,0,0,0.07)',
  ink1:    '#1E2530',
  ink2:    '#5A6476',
  ink3:    '#8E98A8',
  surface: '#F8F9FB',
  accent:  '#4F6EF7',
};

const AGENT_HEX = {
  orchestrator: '#64748B', sales_agent: '#2563EB',
  support_agent: '#059669', care_agent: '#9333EA', scheduling_agent: '#D97706',
};

function TraceRow({ ev }) {
  const meta    = getAgentMeta(ev.agent);
  const color   = AGENT_HEX[ev.agent] ?? T.ink2;
  const label   = ev.action || (ev.status === 'started' ? `${meta.label} processing` : ev.status === 'done' ? `${meta.label} done` : meta.label);
  return (
    <div style={{ borderLeft: `2px solid ${color}`, backgroundColor: T.surface, borderRadius: '0 6px 6px 0', padding: '6px 10px', marginBottom: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <span style={{ color, fontSize: 9, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{meta.label}</span>
        {ev.status === 'started'   && <Loader2 size={8} style={{ color: T.ink3 }} className="animate-spin" />}
        {ev.status === 'done'      && <CheckCircle2 size={8} style={{ color: '#059669' }} />}
        {ev.status === 'tool_call' && <Wrench size={8} style={{ color: T.accent }} />}
        <span style={{ marginLeft: 'auto', color: T.ink3, fontSize: 9, fontFamily: 'monospace' }}>{ev.timestamp}</span>
      </div>
      <div style={{ color: T.ink2, fontSize: 11, fontFamily: 'Inter,sans-serif', lineHeight: 1.4 }}>{label}</div>
      {ev.detail && <div style={{ color: T.ink3, fontSize: 10, fontFamily: 'JetBrains Mono,monospace', marginTop: 1, wordBreak: 'break-all' }}>{ev.detail}</div>}
    </div>
  );
}

const MD = {
  p:      ({children}) => <p style={{margin:'0 0 5px',lineHeight:1.6}} className="last:mb-0">{children}</p>,
  strong: ({children}) => <strong style={{fontWeight:600}}>{children}</strong>,
  ol:     ({children}) => <ol style={{margin:'3px 0 5px',paddingLeft:16,lineHeight:1.6}}>{children}</ol>,
  ul:     ({children}) => <ul style={{margin:'3px 0 5px',paddingLeft:16,lineHeight:1.6}}>{children}</ul>,
  li:     ({children}) => <li style={{marginBottom:2}}>{children}</li>,
  code:   ({children}) => <code style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.82em',backgroundColor:'rgba(0,0,0,0.06)',borderRadius:3,padding:'1px 4px'}}>{children}</code>,
  h1:({c})=><p style={{fontWeight:700,marginBottom:3}}>{c}</p>,
  h2:({c})=><p style={{fontWeight:700,marginBottom:3}}>{c}</p>,
  h3:({c})=><p style={{fontWeight:600,marginBottom:2}}>{c}</p>,
  hr:()=>null,
};

const MIN_W = 340, MIN_H = 400, MAX_W = 760, MAX_H = 820;

export default function OpsPilotWidget({ autoMessage, onCartUpdate, onRefund }) {
  const [open, setOpen]             = useState(false);
  const [showTrace, setShowTrace]   = useState(true);
  const [input, setInput]           = useState('');
  const [showScenarios, setShowScenarios] = useState(false);
  const [size, setSize]             = useState({ w: 700, h: 580 });
  const [autoSent, setAutoSent]     = useState(false);
  const [refundToast, setRefundToast] = useState(null); // { amount } — triggers animation

  const bottomRef   = useRef(null);
  const traceRef    = useRef(null);
  const inputRef    = useRef(null);
  const resizeRef   = useRef(null); // drag state

  const { messages, traceEvents, activeAgent, isProcessing, isConnected, lastAction, sendMessage, resetSession } = useChatSocket();

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight; }, [traceEvents]);

  // Auto-open + auto-send when autoMessage is set
  useEffect(() => {
    if (autoMessage) {
      setOpen(true);   // always open the widget when a prompt is provided
      setAutoSent(false);
    }
  }, [autoMessage]);

  useEffect(() => {
    if (autoMessage && open && !autoSent && !isProcessing) {
      setAutoSent(true);
      setTimeout(() => sendMessage(autoMessage), 80);
    }
  }, [autoMessage, open, autoSent, isProcessing, sendMessage]);

  // Handle backend action events
  useEffect(() => {
    if (!lastAction) return;
    if (lastAction.action === 'cart_updated' && onCartUpdate) {
      onCartUpdate(lastAction.product_id, lastAction.quantity ?? 1);
      setTimeout(() => {
        setOpen(false);
        window.location.href = '/growmart/cart';
      }, 800);
    }
    if (lastAction.action === 'refund_issued' && onRefund) {
      onRefund(lastAction.amount);
      // Show the rising coin animation inside the widget
      setRefundToast({ amount: lastAction.amount });
      setTimeout(() => setRefundToast(null), 2200);
    }
  }, [lastAction, onCartUpdate, onRefund]);

  const send = useCallback((text) => {
    if (!text?.trim() || isProcessing) return;
    sendMessage(text);
    setInput('');
    setShowScenarios(false);
  }, [isProcessing, sendMessage]);

  const handleSubmit = (e) => { e.preventDefault(); send(input); };

  // ── Manual resize via drag handle ──────────────────────────────────────────
  const startResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = size.w, startH = size.h;

    const onMove = (ev) => {
      const dw = startX - ev.clientX;  // drag left = wider
      const dh = startY - ev.clientY;  // drag up   = taller
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, startW + dw)),
        h: Math.min(MAX_H, Math.max(MIN_H, startH + dh)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  // ── Collapsed launcher ────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setAutoSent(false); }}
        aria-label="Chat with GrowMart"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          backgroundColor: GM_ACCENT, color: '#fff', border: 'none',
          borderRadius: 999, padding: '12px 22px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif',
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(232,82,10,0.35)',
        }}
      >
        <MessageCircle size={16} />
        Chat with us
      </button>
    );
  }

  const chatWidth = showTrace ? size.w - 272 : size.w;

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        width: size.w, height: size.h,
        display: 'flex', flexDirection: 'column',
        borderRadius: 16,
        boxShadow: '0 16px 56px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #E8E2DC',
      }}
      role="dialog"
      aria-label="GrowMart customer support"
    >
      {/* Resize grip — top-left corner */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        style={{
          position: 'absolute', top: 0, left: 0, width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'nw-resize', zIndex: 10, opacity: 0.4,
        }}
        aria-hidden="true"
      >
        <GripHorizontal size={12} color={W.ink3} style={{ transform: 'rotate(45deg)' }} />
      </div>

      {/* Header */}
      <div style={{
        backgroundColor: W.headerBg, borderBottom: `1px solid ${W.headerBorder}`,
        padding: '10px 14px 10px 28px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: isConnected ? '#22C55E' : '#D1C8C0', flexShrink: 0 }} />
        <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: GM_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>GM</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: W.ink1, fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif', lineHeight: 1.2 }}>GrowMart Support</div>
          {activeAgent ? (() => { const m = getAgentMeta(activeAgent); return (
            <div style={{ color: AGENT_HEX[activeAgent] ?? W.ink3, fontSize: 10, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: AGENT_HEX[activeAgent], display: 'inline-block' }} className="animate-pulse-dot" />
              {m.label} is responding
            </div>
          ); })() : (
            <div style={{ color: W.ink3, fontSize: 10, fontFamily: 'Inter,sans-serif' }}>Usually replies in seconds</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button onClick={() => setShowTrace(v => !v)} title={showTrace ? 'Hide reasoning' : 'Show reasoning'}
            style={{ background: 'none', border: `1px solid ${W.inputBorder}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: showTrace ? T.accent : W.ink3, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'Inter,sans-serif', backgroundColor: showTrace ? 'rgba(79,110,247,0.06)' : 'transparent' }}>
            {showTrace ? <Eye size={10}/> : <EyeOff size={10}/>}
            <span className="hidden sm:inline">{showTrace ? 'Reasoning on' : 'Reasoning off'}</span>
          </button>
          <button onClick={resetSession} title="New session"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: W.ink3, display: 'flex', padding: 3 }}>
            <RotateCcw size={13} />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: W.ink3, display: 'flex', padding: 3 }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Chat area */}
        <div style={{ width: chatWidth, display: 'flex', flexDirection: 'column', backgroundColor: W.chatBg, position: 'relative' }}>
          {/* Refund animation — a rising green coin, appears briefly when a refund lands */}
          {refundToast && (
            <div
              className="animate-refund-rise"
              style={{
                position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20, pointerEvents: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
              aria-live="polite"
            >
              <div style={{
                backgroundColor: '#15803D', color: '#fff',
                borderRadius: 999, padding: '6px 14px',
                fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(21,128,61,0.35)',
              }}>
                <span style={{ fontSize: 16 }}>💚</span>
                +₹{Number(refundToast.amount).toLocaleString('en-IN')} refunded
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
                <div style={{ color: W.ink2, fontSize: 13, fontFamily: 'Inter,sans-serif', lineHeight: 1.65 }}>
                  Hi! Ask about products, your orders, or anything else — I'm here to help.
                </div>
              </div>
            )}
            {messages.map(msg => {
              if (msg.role === 'user') return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ backgroundColor: W.userBubble, color: '#fff', fontSize: 13, padding: '9px 14px', borderRadius: '16px 16px 4px 16px', maxWidth: '80%', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                </div>
              );
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: GM_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>GM</span>
                  </div>
                  <div style={{ backgroundColor: W.agentBubble, fontSize: 13, padding: '9px 14px', borderRadius: '4px 16px 16px 16px', maxWidth: '82%', color: W.agentText, fontFamily: 'Inter,sans-serif', lineHeight: 1.55 }}>
                    {msg.text ? (
                      <>
                        <ReactMarkdown components={MD}>{msg.text}</ReactMarkdown>
                        {msg.isStreaming && <span style={{ display:'inline-block',width:2,height:'0.85em',backgroundColor:GM_ACCENT,marginLeft:1,verticalAlign:'middle' }} className="animate-cursor" />}
                      </>
                    ) : (
                      <span style={{ display:'flex', gap:4, alignItems:'center', height:16 }}>
                        {[0,180,360].map(d => <span key={d} style={{ width:5,height:5,borderRadius:'50%',backgroundColor:W.ink3,display:'inline-block' }} className="animate-pulse-dot" />)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input footer */}
          <div style={{ borderTop: `1px solid ${W.headerBorder}`, padding: '8px 12px 10px', flexShrink: 0, backgroundColor: W.headerBg }}>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <button onClick={() => setShowScenarios(s => !s)}
                style={{ background:'none',border:'none',color:W.ink3,fontSize:11,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:3,padding:0 }}>
                Try a scenario
                <ChevronDown size={10} style={{ transform: showScenarios ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {showScenarios && (
                <div style={{ position:'absolute',bottom:'100%',left:0,width:300,backgroundColor:W.headerBg,border:`1px solid ${W.inputBorder}`,borderRadius:12,overflow:'hidden',marginBottom:4,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:10 }}>
                  {DEMO_SCENARIOS.map((s,i) => (
                    <button key={i} onClick={() => { send(s.prompt); setShowScenarios(false); }}
                      style={{ width:'100%',textAlign:'left',padding:'9px 13px',background:'none',border:'none',borderBottom:i<DEMO_SCENARIOS.length-1?`1px solid ${W.inputBorder}`:'none',cursor:'pointer',color:W.ink2,fontSize:11,fontFamily:'Inter,sans-serif',lineHeight:1.5 }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = W.chatBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div style={{ color:W.ink3,fontSize:9,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:2 }}>{s.label}</div>
                      {s.prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} style={{ display:'flex', gap:7 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask about your order or products…"
                disabled={isProcessing}
                style={{ flex:1,backgroundColor:W.inputBg,border:`1px solid ${W.inputBorder}`,borderRadius:10,padding:'8px 13px',color:W.ink1,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none' }}
                onFocus={e => e.target.style.borderColor = GM_ACCENT}
                onBlur={e => e.target.style.borderColor = W.inputBorder}
              />
              <button type="submit" disabled={!input.trim()||isProcessing}
                style={{ backgroundColor:GM_ACCENT,border:'none',borderRadius:10,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:(!input.trim()||isProcessing)?0.4:1,flexShrink:0 }}>
                <Send size={14} color="#fff" />
              </button>
            </form>
          </div>
        </div>

        {/* Trace panel — cool light gray, visually distinct from warm chat */}
        {showTrace && (
          <div style={{ width: 272, borderLeft: `1px solid #DDE2E8`, display:'flex',flexDirection:'column',flexShrink:0,backgroundColor:T.bg }}>
            <div style={{ padding:'9px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:7,flexShrink:0,backgroundColor:T.surface }}>
              <span style={{ width:6,height:6,borderRadius:'50%',backgroundColor:T.accent }} />
              <span style={{ color:T.ink2,fontSize:10,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.06em',textTransform:'uppercase' }}>Agent reasoning</span>
              {traceEvents.length > 0 && <span style={{ marginLeft:'auto',color:T.ink3,fontSize:9,fontFamily:'monospace' }}>{traceEvents.length}</span>}
            </div>
            <div ref={traceRef} style={{ flex:1,overflowY:'auto',padding:'8px 8px' }}>
              {traceEvents.length === 0
                ? <div style={{ color:T.ink3,fontSize:11,fontFamily:'Inter,sans-serif',textAlign:'center',marginTop:20,lineHeight:1.65,padding:'0 10px' }}>Reasoning steps appear here as the agent works.</div>
                : traceEvents.map(ev => <TraceRow key={ev.id} ev={ev} />)
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
