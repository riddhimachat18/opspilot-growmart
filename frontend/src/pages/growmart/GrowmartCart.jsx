import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', accent:'#E8520A' };

export default function GrowmartCart() {
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQty, cartTotal, addItemById, creditWallet } = useStore();

  if (cartItems.length === 0) return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 22, color: GM.ink1, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Your cart is empty</h2>
        <p style={{ color: GM.ink3, fontSize: 14, fontFamily: 'Inter,sans-serif', marginBottom: 24 }}>Browse our products and add something you like.</p>
        <button onClick={() => navigate('/growmart/products')} style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          Shop now
        </button>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', color: GM.ink1, margin: '0 0 28px' }}>Your cart</h1>

        <div style={{ backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          {cartItems.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < cartItems.length - 1 ? `1px solid ${GM.border}` : 'none' }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: GM.ink1, fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>{item.name}</div>
                <div style={{ color: GM.ink3, fontSize: 12, fontFamily: 'Inter,sans-serif' }}>{item.tagline}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${GM.border}`, backgroundColor: GM.surface, cursor: 'pointer', color: GM.ink2, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ width: 24, textAlign: 'center', color: GM.ink1, fontSize: 14, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${GM.border}`, backgroundColor: GM.surface, cursor: 'pointer', color: GM.ink2, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <div style={{ width: 80, textAlign: 'right', color: GM.ink1, fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
              <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8AFA6', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: GM.ink3, fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Order total</div>
            <div style={{ color: GM.ink1, fontSize: 22, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', letterSpacing: '-0.03em' }}>₹{cartTotal.toLocaleString('en-IN')}</div>
          </div>
          <button onClick={() => navigate('/growmart/checkout')} style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 7 }}>
            Checkout <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
