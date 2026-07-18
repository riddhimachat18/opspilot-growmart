import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../utils/constants';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A', accentDim:'#FEF0E8' };

function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/growmart/products/${product.id}`)}
      style={{ backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ height: 140, backgroundColor: product.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: 52 }}>{product.emoji}</span>
        {product.badge && (
          <span style={{ position: 'absolute', top: 12, left: 12, backgroundColor: product.badge === 'New' ? GM.accent : '#1A1410', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(250,250,248,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Out of stock</span>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif', marginBottom: 4 }}>{product.tagline}</div>
        <div style={{ color: GM.ink1, fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', letterSpacing: '-0.02em', marginBottom: 10 }}>{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: GM.ink1, fontSize: 16, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>₹{product.price.toLocaleString('en-IN')}</span>
          <button style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>View</button>
        </div>
      </div>
    </div>
  );
}

export default function GrowmartHome() {
  const navigate   = useNavigate();
  const { addItemById, creditWallet } = useStore();
  const featured   = PRODUCTS.filter(p => p.inStock).slice(0, 4);

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />

      {/* Hero */}
      <section style={{ backgroundColor: GM.ink1, color: '#fff', padding: '56px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ backgroundColor: GM.accent, display: 'inline-block', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 10px', borderRadius: 4, marginBottom: 18, fontFamily: 'Inter,sans-serif' }}>New arrival</div>
            <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 14px' }}>MagCharge 15W is here.</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', fontFamily: 'Inter,sans-serif', maxWidth: 400 }}>Case-friendly Qi charging at 15W. Snaps to position, charges through cases up to 5mm thick.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/growmart/products/magcharge-15w')} style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 7 }}>
                Shop now <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('/growmart/products')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, padding: '11px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                All products
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 100 }}>🔋</div>
        </div>
      </section>

      {/* Featured products */}
      <section style={{ padding: '56px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: GM.ink1, margin: 0 }}>Featured products</h2>
            <button onClick={() => navigate('/growmart/products')} style={{ background: 'none', border: 'none', color: GM.accent, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section style={{ borderTop: `1px solid ${GM.border}`, borderBottom: `1px solid ${GM.border}`, backgroundColor: GM.surface }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: GM.border }}>
          {[
            { icon: Truck, label: 'Free shipping over ₹999', sub: '3–5 business day delivery' },
            { icon: RotateCcw, label: '10-day returns', sub: 'Hassle-free, no questions asked' },
            { icon: ShieldCheck, label: '1-year warranty', sub: 'On all GrowMart branded products' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} style={{ backgroundColor: GM.surface, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon size={20} style={{ color: GM.accent, flexShrink: 0 }} />
              <div>
                <div style={{ color: GM.ink1, fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{label}</div>
                <div style={{ color: GM.ink3, fontSize: 12, fontFamily: 'Inter,sans-serif', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ padding: '24px 32px', textAlign: 'center' }}>
        <p style={{ color: GM.ink4, fontSize: 12, fontFamily: 'Inter,sans-serif', margin: 0 }}>
          © 2026 GrowMart · <span style={{ color: GM.ink3 }}>Customer support powered by</span> <strong style={{ color: GM.ink2 }}>OpsPilot</strong>
        </p>
      </footer>

      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
