import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, MessageCircle, ArrowLeft } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../utils/constants';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A', accentDim:'#FEF0E8' };

export default function GrowmartProduct() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { addItem, addItemById, creditWallet } = useStore();
  const [added, setAdded]         = useState(false);
  const [autoMessage, setAutoMessage] = useState(null);

  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ padding: 48, color: GM.ink2, fontFamily: 'Inter,sans-serif' }}>Product not found.</div>
    </div>
  );

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Auto-open widget AND send the message immediately
  const handleAsk = () => {
    setAutoMessage(`I'm looking at the ${product.name} (₹${product.price.toLocaleString('en-IN')}). Does it work well with a phone case on, and is it compatible with my setup?`);
  };

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px' }}>
        <button onClick={() => navigate('/growmart/products')}
          style={{ background:'none',border:'none',cursor:'pointer',color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5,marginBottom:28,padding:0 }}>
          <ArrowLeft size={13}/> All products
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 56, alignItems: 'start' }}>
          {/* Image */}
          <div>
            <div style={{ backgroundColor: product.color+'18', borderRadius: 16, height: 360, display:'flex',alignItems:'center',justifyContent:'center', border:`1px solid ${GM.border}`, marginBottom:16 }}>
              <span style={{ fontSize: 120 }}>{product.emoji}</span>
            </div>
            {product.badge && (
              <span style={{ backgroundColor: product.badge==='New'?GM.accent:'#1A1410', color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:5,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.06em' }}>{product.badge}</span>
            )}
          </div>

          {/* Details */}
          <div>
            <div style={{ color:GM.ink3,fontSize:12,fontFamily:'Inter,sans-serif',marginBottom:6 }}>{product.tagline}</div>
            <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:30,letterSpacing:'-0.03em',color:GM.ink1,margin:'0 0 6px' }}>{product.name}</h1>
            <div style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:26,color:GM.ink1,margin:'0 0 18px' }}>₹{product.price.toLocaleString('en-IN')}</div>
            <p style={{ color:GM.ink2,fontSize:14,lineHeight:1.7,fontFamily:'Inter,sans-serif',margin:'0 0 22px' }}>{product.description}</p>

            {/* Features */}
            <div style={{ marginBottom:22 }}>
              <div style={{ color:GM.ink3,fontSize:11,fontWeight:600,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10 }}>Key features</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {product.features.map(f => (
                  <span key={f} style={{ backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:7,padding:'5px 12px',color:GM.ink2,fontSize:12,fontFamily:'Inter,sans-serif' }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Compatible */}
            <div style={{ marginBottom:28 }}>
              <div style={{ color:GM.ink3,fontSize:11,fontWeight:600,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8 }}>Compatible with</div>
              <div style={{ color:GM.ink2,fontSize:13,fontFamily:'Inter,sans-serif' }}>{product.compatible.join(' · ')}</div>
            </div>

            {/* Stock */}
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:22 }}>
              <span style={{ width:8,height:8,borderRadius:'50%',backgroundColor:product.inStock?'#22C55E':'#F87171',display:'inline-block' }} />
              <span style={{ color:product.inStock?'#15803D':'#DC2626',fontSize:13,fontFamily:'Inter,sans-serif',fontWeight:600 }}>
                {product.inStock?'In stock':'Out of stock'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button onClick={handleAdd} disabled={!product.inStock}
                style={{ backgroundColor:added?'#15803D':GM.accent,color:'#fff',border:'none',borderRadius:10,padding:'13px 24px',fontSize:14,fontWeight:600,cursor:product.inStock?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:product.inStock?1:0.5,transition:'background-color 0.2s' }}>
                {added ? <><Check size={15}/>Added to cart</> : <><ShoppingCart size={15}/>Add to cart</>}
              </button>

              {/* Auto-opens widget AND fires the message */}
              <button onClick={handleAsk}
                style={{ backgroundColor:'transparent',color:GM.ink2,border:`1px solid ${GM.border}`,borderRadius:10,padding:'11px 20px',fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'border-color 0.15s,color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=GM.accent; e.currentTarget.style.color=GM.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=GM.border; e.currentTarget.style.color=GM.ink2; }}>
                <MessageCircle size={14}/>
                Not sure if this fits your setup? Ask our agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Widget receives autoMessage — opens itself and fires send */}
      <OpsPilotWidget
        autoMessage={autoMessage}
        onCartUpdate={addItemById}
        onRefund={creditWallet}
      />
    </div>
  );
}
