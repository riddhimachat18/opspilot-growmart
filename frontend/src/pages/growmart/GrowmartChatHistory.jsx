import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Clock } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import { fetchChatHistory } from '../../utils/api';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A' };

const AGENT_COLORS = {
  sales_agent: '#2563EB', support_agent: '#059669',
  care_agent: '#9333EA', scheduling_agent: '#D97706',
};
const OUTCOME_STYLE = {
  Purchased:  { bg:'#ECFDF5', text:'#15803D' },
  Resolved:   { bg:'#ECFDF5', text:'#15803D' },
  Refunded:   { bg:'#F5F3FF', text:'#6D28D9' },
  Booked:     { bg:'#EFF4FF', text:'#1D4ED8' },
  Escalated:  { bg:'#FFFBEB', text:'#B45309' },
};

export default function GrowmartChatHistory() {
  const navigate = useNavigate();
  const { addItemById, creditWallet } = useStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
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
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:24,letterSpacing:'-0.03em',color:GM.ink1,margin:'0 0 4px' }}>Chat history</h1>
          <p style={{ color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',margin:0 }}>Past conversations with GrowMart support</p>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:'48px',color:GM.ink3,fontFamily:'Inter,sans-serif' }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign:'center',padding:'64px 24px' }}>
            <MessageSquare size={40} style={{ color:GM.ink4,marginBottom:14 }} />
            <p style={{ color:GM.ink3,fontSize:14,fontFamily:'Inter,sans-serif' }}>No past conversations yet.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {history.map(conv => {
              const agentColor = AGENT_COLORS[conv.agent] ?? '#64748B';
              const agentLabel = conv.agent.replace('_agent','').replace(/^\w/,c=>c.toUpperCase());
              const outcome    = conv.outcome ?? 'Resolved';
              const os         = OUTCOME_STYLE[outcome] ?? { bg:GM.base, text:GM.ink2 };
              const date       = (conv.created_at || '').slice(0,10);
              const time       = (conv.created_at || '').slice(11,16);
              return (
                <div key={conv.id} style={{ backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:12,padding:'16px 20px' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:10 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
                        <span style={{ backgroundColor:`${agentColor}18`,color:agentColor,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.05em' }}>{agentLabel}</span>
                        <span style={{ backgroundColor:os.bg,color:os.text,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,fontFamily:'Inter,sans-serif' }}>{outcome}</span>
                      </div>
                      <div style={{ color:GM.ink1,fontSize:14,fontWeight:600,fontFamily:'Inter,sans-serif',marginBottom:4 }}>{conv.summary}</div>
                      {conv.preview && <div style={{ color:GM.ink3,fontSize:12,fontFamily:'Inter,sans-serif',lineHeight:1.5 }}>{conv.preview}</div>}
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end' }}>
                        <Clock size={11}/>{date}
                      </div>
                      {time && <div style={{ color:GM.ink4,fontSize:11,fontFamily:'Inter,sans-serif',marginTop:1 }}>{time}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop:20,padding:'16px 20px',backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:12,display:'flex',alignItems:'center',gap:12 }}>
          <MessageSquare size={18} style={{ color:GM.accent,flexShrink:0 }} />
          <div>
            <div style={{ color:GM.ink1,fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif' }}>Start a new conversation</div>
            <div style={{ color:GM.ink3,fontSize:12,fontFamily:'Inter,sans-serif' }}>Use the chat button in the bottom right.</div>
          </div>
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
