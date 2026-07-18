import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { getAgentMeta } from '../../utils/constants';
import { fetchAllTickets, resolveTicket as apiResolve } from '../../utils/api';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7', accentDim: 'rgba(79,110,247,0.14)',
};

const STATUS_STYLE = {
  escalated: { label: 'Escalated',     bg: 'rgba(251,191,36,0.12)',  text: '#FBBF24', icon: AlertTriangle },
  pending:   { label: 'Pending review',bg: 'rgba(79,110,247,0.12)',  text: '#4F6EF7', icon: Clock        },
  approved:  { label: 'Approved',      bg: 'rgba(52,211,153,0.12)',  text: '#34D399', icon: CheckCircle2 },
  resolved:  { label: 'Resolved',      bg: 'rgba(52,211,153,0.12)',  text: '#34D399', icon: CheckCircle2 },
};

const TRACE_COLORS = {
  orchestrator: '#8899BB', care_agent: '#C084FC',
  support_agent: '#34D399', sales_agent: '#4F6EF7', scheduling_agent: '#FBBF24',
};

function TraceRow({ ev }) {
  const color = TRACE_COLORS[ev.agent] ?? C.ink2;
  const meta  = getAgentMeta(ev.agent);
  return (
    <div style={{ borderLeft: `2px solid ${color}`, backgroundColor: C.base, borderRadius: '0 6px 6px 0', padding: '6px 10px', marginBottom: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ color, fontSize: 9, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{meta.label}</span>
        {ev.status === 'tool_call'  && <Wrench       size={9} style={{ color: C.accent   }} />}
        {ev.status === 'done'       && <CheckCircle2 size={9} style={{ color: '#34D399'  }} />}
        {ev.status === 'escalated'  && <AlertTriangle size={9} style={{ color: '#FBBF24' }} />}
      </div>
      <div style={{ color: C.ink2, fontSize: 11, fontFamily: 'Inter,sans-serif', lineHeight: 1.4 }}>{ev.action}</div>
      {ev.detail && <div style={{ color: C.ink3, fontSize: 10, fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>{ev.detail}</div>}
    </div>
  );
}

function TicketDetail({ ticket, onBack, onResolved }) {
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(['approved','resolved'].includes(ticket.status));
  const meta = getAgentMeta(ticket.agent);
  const ss   = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.pending;

  const transcript = Array.isArray(ticket.transcript) ? ticket.transcript : [];
  const trace      = Array.isArray(ticket.trace)      ? ticket.trace      : [];

  const handleApprove = async () => {
    setSaving(true);
    try {
      await apiResolve(ticket.id, 'approved');
      setDone(true);
      onResolved(ticket.id, 'approved');
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    setSaving(true);
    try {
      await apiResolve(ticket.id, 'resolved');
      setDone(true);
      onResolved(ticket.id, 'resolved');
    } catch (e) {
      console.error('Resolve failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter,sans-serif' }}>
      <button onClick={onBack}
        style={{ background:'none',border:'none',color:C.ink3,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:5,padding:0,marginBottom:24 }}>
        <ArrowLeft size={13}/> All tickets
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>
        {/* Left */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

          {/* Header */}
          <div style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:16 }}>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
                  <span style={{ color:C.ink3,fontSize:11,fontFamily:'JetBrains Mono,monospace' }}>{ticket.id}</span>
                  <span style={{ backgroundColor:ss.bg,color:ss.text,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:5,textTransform:'uppercase',letterSpacing:'0.05em' }}>{ss.label}</span>
                </div>
                <h2 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:16,color:C.ink1,margin:0,letterSpacing:'-0.02em',lineHeight:1.3 }}>{ticket.issue}</h2>
              </div>
            </div>
            <div style={{ display:'flex',gap:24,flexWrap:'wrap' }}>
              {[
                ['Customer', ticket.customer_name || ticket.customer],
                ['Email',    ticket.customer_email || ticket.email],
                ['Agent',    meta.label],
                ticket.order_id && ['Order', ticket.order_id],
                ticket.amount   && ['Amount', `₹${Number(ticket.amount).toLocaleString('en-IN')}`],
                ['Created', (ticket.created_at||'').slice(0,10)],
              ].filter(Boolean).map(([k,v]) => (
                <div key={k}>
                  <div style={{ color:C.ink3,fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3 }}>{k}</div>
                  <div style={{ color:C.ink2,fontSize:13,fontFamily:k==='Order'||k==='Email'?'JetBrains Mono,monospace':'Inter,sans-serif' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <div style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'18px 20px' }}>
            <h3 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:600,fontSize:13,color:C.ink1,margin:'0 0 14px' }}>Conversation</h3>
            {transcript.length === 0
              ? <p style={{ color:C.ink3,fontSize:12 }}>No transcript recorded.</p>
              : (
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {transcript.map((msg,i) => (
                    <div key={i} style={{ display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'78%',padding:'9px 13px',borderRadius:msg.role==='user'?'14px 14px 3px 14px':'3px 14px 14px 14px',backgroundColor:msg.role==='user'?C.accent:C.raised,border:`1px solid ${C.border}`,color:msg.role==='user'?'#fff':C.ink2,fontSize:13,fontFamily:'Inter,sans-serif',lineHeight:1.55 }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Action */}
          {!done ? (
            <div style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <div style={{ color:C.ink1,fontSize:13,fontWeight:600,marginBottom:3 }}>
                  {ticket.status==='escalated'?`Approve refund — ₹${Number(ticket.amount||0).toLocaleString('en-IN')}`:'Mark as resolved'}
                </div>
                <div style={{ color:C.ink3,fontSize:12 }}>
                  {ticket.status==='escalated'?'Amount exceeds the ₹1,500 auto-approval threshold.':'Close this ticket once handled.'}
                </div>
              </div>
              <button
                onClick={ticket.status==='escalated'?handleApprove:handleResolve}
                disabled={saving}
                style={{ backgroundColor:ticket.status==='escalated'?'#34D399':C.accent,color:ticket.status==='escalated'?'#0B0E14':'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap',opacity:saving?0.6:1 }}>
                {saving?'Saving…':ticket.status==='escalated'?'✓ Approve refund':'✓ Resolve'}
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:10,padding:'14px 20px',display:'flex',alignItems:'center',gap:10 }}>
              <CheckCircle2 size={16} style={{ color:'#34D399' }}/>
              <span style={{ color:'#34D399',fontSize:13,fontWeight:600 }}>
                {ticket.status==='escalated'?`Refund of ₹${Number(ticket.amount||0).toLocaleString('en-IN')} approved and issued.`:'Ticket resolved.'}
              </span>
            </div>
          )}
        </div>

        {/* Right: trace */}
        <div style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'18px 16px',alignSelf:'start' }}>
          <h3 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:600,fontSize:13,color:C.ink1,margin:'0 0 14px',display:'flex',alignItems:'center',gap:7 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',backgroundColor:C.accent,display:'inline-block' }}/>
            Agent reasoning
          </h3>
          {trace.length===0
            ? <p style={{ color:C.ink3,fontSize:11 }}>No trace recorded.</p>
            : trace.map((ev,i) => <TraceRow key={i} ev={ev}/>)
          }
        </div>
      </div>
    </div>
  );
}

export default function AdminTickets() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAllTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleResolved = (id, action) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: action } : t));
  };

  if (selected) {
    return (
      <TicketDetail
        ticket={selected}
        onBack={() => setSelected(null)}
        onResolved={(id, action) => {
          handleResolved(id, action);
          setSelected(t => t ? { ...t, status: action } : t);
        }}
      />
    );
  }

  return (
    <div style={{ padding:'28px 28px',fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:20,letterSpacing:'-0.03em',color:C.ink1,margin:'0 0 4px' }}>Tickets</h1>
          <p style={{ color:C.ink3,fontSize:12,margin:0 }}>Conversations flagged for human review</p>
        </div>
        <button onClick={load} style={{ background:'none',border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 12px',cursor:'pointer',color:C.ink2,fontSize:12,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:'48px',color:C.ink3,fontSize:13 }}>Loading…</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign:'center',padding:'64px',color:C.ink3,fontSize:13 }}>No tickets yet.</div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {tickets.map(ticket => {
            const meta = getAgentMeta(ticket.agent);
            const ss   = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.pending;
            const StatusIcon = ss.icon;
            return (
              <div key={ticket.id}
                onClick={() => setSelected(ticket)}
                style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 20px',cursor:'pointer',display:'flex',alignItems:'center',gap:16 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.border2}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ width:34,height:34,borderRadius:8,backgroundColor:ss.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <StatusIcon size={14} style={{ color:ss.text }}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                    <span style={{ color:C.ink1,fontSize:13,fontWeight:600 }}>{ticket.customer_name||ticket.customer||'Customer'}</span>
                    <span style={{ color:C.ink3,fontSize:11,fontFamily:'JetBrains Mono,monospace' }}>{ticket.id}</span>
                  </div>
                  <div style={{ color:C.ink2,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ticket.issue}</div>
                </div>
                <span style={{ backgroundColor:meta.bg,color:meta.hex,fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:5,textTransform:'uppercase',letterSpacing:'0.05em',flexShrink:0 }}>{meta.label}</span>
                <span style={{ backgroundColor:ss.bg,color:ss.text,fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:5,textTransform:'uppercase',letterSpacing:'0.05em',flexShrink:0 }}>{ss.label}</span>
                {ticket.amount && <span style={{ color:C.ink2,fontSize:13,fontFamily:'DM Sans,monospace',fontWeight:700,flexShrink:0 }}>₹{Number(ticket.amount).toLocaleString('en-IN')}</span>}
                <span style={{ color:C.ink3,fontSize:11,fontFamily:'JetBrains Mono,monospace',flexShrink:0 }}>{(ticket.created_at||'').slice(0,10)}</span>
                <span style={{ color:C.ink3,fontSize:16 }}>›</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
