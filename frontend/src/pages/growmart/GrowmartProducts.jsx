import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../utils/constants';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A', accentDim:'#FEF0E8' };

const BANDS = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: '₹500–₹999', min: 500, max: 999 },
  { label: '₹1000–₹1999', min: 1000, max: 1999 },
  { label: '₹2000+', min: 2000, max: Infinity },
];

function Products() {
  const navigate = useNavigate();
  const { addItemById, creditWallet } = useStore();
  const [band, setBand] = useState(0);
  const filtered = PRODUCTS.filter(p => p.price >= BANDS[band].min && p.price <= BANDS[band].max);

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', color: GM.ink1, margin: 0 }}>All products</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {BANDS.map((b, i) => (
              <button key={i} onClick={() => setBand(i)} style={{
                border: `1px solid ${band===i ? GM.accent : GM.border}`,
                backgroundColor: band===i ? GM.accentDim : GM.surface,
                color: band===i ? GM.accent : GM.ink2,
                padding: '6px 14px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>{b.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id}
              onClick={() => navigate(`/growmart/products/${p.id}`)}
              style={{ backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ height: 140, backgroundColor: p.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: 50 }}>{p.emoji}</span>
                {p.badge && <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: p.badge==='New'?GM.accent:'#1A1410', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.05em' }}>{p.badge}</span>}
                {!p.inStock && <div style={{ position:'absolute',inset:0,backgroundColor:'rgba(250,250,248,0.75)',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',fontWeight:600 }}>Out of stock</span></div>}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',marginBottom:3 }}>{p.tagline}</div>
                <div style={{ color:GM.ink1,fontSize:14,fontWeight:700,fontFamily:'DM Sans,sans-serif',letterSpacing:'-0.02em',marginBottom:10 }}>{p.name}</div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span style={{ color:GM.ink1,fontSize:15,fontWeight:700,fontFamily:'DM Sans,sans-serif' }}>₹{p.price.toLocaleString('en-IN')}</span>
                  <span style={{ color:GM.accent,fontSize:12,fontFamily:'Inter,sans-serif',fontWeight:600 }}>View →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}

export default function GrowmartProducts() {
  return <Products />;
}
