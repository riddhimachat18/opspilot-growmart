import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchLeads } from '../../utils/api';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7', accentDim: 'rgba(79,110,247,0.14)',
};

const STAGE_STYLE = {
  New:       { bg: C.accentDim,                    text: '#818CF8' },
  Contacted: { bg: 'rgba(79,110,247,0.12)',         text: '#4F6EF7' },
  Qualified: { bg: 'rgba(52,211,153,0.12)',         text: '#34D399' },
};

const AVATAR_COLORS = ['#4F6EF7','#34D399','#C084FC','#FBBF24','#8899BB'];

// Airtable field names can vary — try several common patterns
const field = (lead, ...keys) => {
  for (const k of keys) if (lead[k] !== undefined) return lead[k];
  return '';
};

export default function AdminCRM() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchLeads()
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '28px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:20,letterSpacing:'-0.03em',color:C.ink1,margin:'0 0 4px' }}>CRM</h1>
          <p style={{ color:C.ink3,fontSize:12,margin:0 }}>
            Leads created by the Sales Agent · {leads.length} total
          </p>
        </div>
        <button onClick={load} style={{ background:'none',border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 12px',cursor:'pointer',color:C.ink2,fontSize:12,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:'48px',color:C.ink3,fontSize:13 }}>Loading from Airtable…</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign:'center',padding:'64px',color:C.ink3,fontSize:13 }}>
          No leads yet. Start a sales conversation in the GrowMart widget.
        </div>
      ) : (
        <div style={{ backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontFamily:'Inter,sans-serif' }}>
            <thead>
              <tr style={{ backgroundColor:C.raised,borderBottom:`1px solid ${C.border}` }}>
                {['Name','Email','Interest','Stage','Notes','Created'].map(h => (
                  <th key={h} style={{ textAlign:'left',padding:'12px 16px',color:C.ink3,fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const name     = field(lead,'Name','name');
                const email    = field(lead,'Email','email');
                const interest = field(lead,'Product_Interest','product_interest','ProductInterest','Interest');
                const stage    = field(lead,'Stage','stage') || 'New';
                const notes    = field(lead,'Use_Case_Notes','use_case_notes','Notes','notes');
                const created  = (field(lead,'Created_At','created_at','createdTime') || '').slice(0,10);
                const ss       = STAGE_STYLE[stage] ?? { bg:C.raised, text:C.ink2 };
                return (
                  <tr key={lead.id || i} style={{ borderBottom:i<leads.length-1?`1px solid ${C.border}`:'none' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:28,height:28,borderRadius:'50%',backgroundColor:AVATAR_COLORS[i%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0 }}>
                          {(name[0]||'?').toUpperCase()}
                        </div>
                        <span style={{ color:C.ink1,fontSize:13,fontWeight:600 }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px',color:C.ink3,fontSize:12,fontFamily:'JetBrains Mono,monospace' }}>{email}</td>
                    <td style={{ padding:'12px 16px',color:C.ink2,fontSize:13 }}>{interest}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ backgroundColor:ss.bg,color:ss.text,fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:999,textTransform:'uppercase',letterSpacing:'0.05em' }}>{stage}</span>
                    </td>
                    <td style={{ padding:'12px 16px',color:C.ink3,fontSize:12,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{notes}</td>
                    <td style={{ padding:'12px 16px',color:C.ink3,fontSize:11,fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap' }}>{created}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
