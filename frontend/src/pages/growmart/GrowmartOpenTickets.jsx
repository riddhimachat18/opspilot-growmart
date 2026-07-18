import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowLeft, Clock, AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import { fetchTickets } from '../../utils/api';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A' };

const STATUS_STYLE = {
  pending:   { label:'Under review', bg:'#FFFBEB', text:'#B45309', Icon: Clock },
  escalated: { label:'Escalated',    bg:'#FEF2F2', text:'#DC2626', Icon: AlertTriangle },
  approved:  { label:'Approved',     bg:'#ECFDF5', text:'#15803D', Icon: CheckCircle2 },
  resolved:  { label:'Resolved',     bg:'#ECFDF5', text:'#15803D', Icon: CheckCircle2 },
};

export default function GrowmartOpenTickets() {
  const navigate = useNavigate();
  const { addItemById, creditWallet } = useStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 32px' }}>
        <button onClick={() => navigate('/growmart')}
          style={{ background:'none',border:'none',cursor:'pointer',color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5,marginBottom:28,padding:0 }}>
          <ArrowLeft size={13}/> Back to store
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:24,letterSpacing:'-0.03em',color:GM.ink1,margin:'0 0 4px' }}>Open tickets</h1>
          <p style={{ color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',margin:0 }}>Issues being reviewed by the GrowMart team</p>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:'48px',color:GM.ink3,fontFamily:'Inter,sans-serif' }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign:'center',padding:'64px 24px' }}>
            <CheckCircle2 size={40} style={{ color:'#15803D',marginBottom:14 }} />
            <p style={{ color:GM.ink2,fontSize:14,fontFamily:'Inter,sans-serif',fontWeight:600 }}>No open tickets</p>
            <p style={{ color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif' }}>All your issues have been resolved.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {tickets.map(ticket => {
              const ss = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.pending;
              const StatusIcon = ss.Icon;
              return (
                <div key={ticket.id} style={{ backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:12,padding:'18px 20px' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:14 }}>
                    <div>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:GM.ink3 }}>{ticket.id}</span>
                        <span style={{ backgroundColor:ss.bg,color:ss.text,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4 }}>
                          <StatusIcon size={9}/>{ss.label}
                        </span>
                      </div>
                      {ticket.order_id && (
                        <div style={{ color:GM.ink3,fontSize:12,fontFamily:'JetBrains Mono,monospace',marginBottom:4 }}>Order {ticket.order_id}</div>
                      )}
                      <div style={{ color:GM.ink2,fontSize:13,fontFamily:'Inter,sans-serif' }}>{ticket.issue}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      {ticket.amount && (
                        <div style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,color:GM.ink1 }}>₹{Number(ticket.amount).toLocaleString('en-IN')}</div>
                      )}
                      <div style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',marginTop:2 }}>
                        {(ticket.created_at || '').slice(0,10)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex',alignItems:'center',gap:8,borderTop:`1px solid ${GM.border}`,paddingTop:12 }}>
                    <button
                      onClick={() => navigate('/growmart')}
                      style={{ background:'none',border:`1px solid ${GM.border}`,borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif',color:GM.ink2,display:'flex',alignItems:'center',gap:6 }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GM.accent;e.currentTarget.style.color=GM.accent;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=GM.border;e.currentTarget.style.color=GM.ink2;}}>
                      <MessageCircle size={12}/> Follow up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Judge prompt */}
        <div style={{ marginTop:24,padding:'14px 18px',backgroundColor:'#EFF4FF',border:'1px solid #BFCFFE',borderRadius:10,display:'flex',alignItems:'center',gap:12 }}>
          <AlertTriangle size={15} style={{ color:'#2563EB',flexShrink:0 }} />
          <div>
            <div style={{ color:'#1E3A8A',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif' }}>Demo note</div>
            <div style={{ color:'#2563EB',fontSize:12,fontFamily:'Inter,sans-serif',lineHeight:1.5 }}>
              The ops team sees these tickets with full transcript, agent trace, and approve/reject controls.{' '}
              <button onClick={() => navigate('/admin/tickets')} style={{ background:'none',border:'none',cursor:'pointer',color:'#1D4ED8',fontWeight:700,fontSize:12,padding:0,textDecoration:'underline',fontFamily:'Inter,sans-serif' }}>
                View in Admin Console →
              </button>
            </div>
          </div>
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
