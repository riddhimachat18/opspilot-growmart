import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Lock, Loader2 } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';
import * as api from '../../utils/api';

const GM = {
  base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8',
  ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E',
  accent:'#E8520A',
};

// ── Mock payment modal ────────────────────────────────────────────────────────
function PaymentModal({ total, onSuccess, onCancel }) {
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'done'

  const handlePay = async () => {
    setStep('processing');
    // 2-second fake processing delay — no real API call
    await new Promise(r => setTimeout(r, 2000));
    setStep('done');
    // Give the "success" state a moment to render before handing off
    setTimeout(onSuccess, 800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(26,20,16,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        backgroundColor: GM.surface, borderRadius: 16, padding: '28px 28px',
        width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        border: `1px solid ${GM.border}`,
      }}>
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Loader2 size={32} style={{ color: GM.accent, marginBottom: 14 }} className="animate-spin" />
            <div style={{ color: GM.ink1, fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans,sans-serif', marginBottom: 6 }}>
              Processing payment…
            </div>
            <div style={{ color: GM.ink3, fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Please wait</div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={22} style={{ color: '#15803D' }} />
            </div>
            <div style={{ color: GM.ink1, fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>Payment successful</div>
          </div>
        )}

        {step === 'form' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 17, color: GM.ink1, margin: 0, letterSpacing: '-0.02em' }}>
                  Pay ₹{total.toLocaleString('en-IN')}
                </h2>
                <p style={{ color: GM.ink3, fontSize: 12, fontFamily: 'Inter,sans-serif', margin: '3px 0 0' }}>GrowMart · Secure checkout</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '4px 10px' }}>
                <Lock size={11} style={{ color: '#15803D' }} />
                <span style={{ color: '#15803D', fontSize: 11, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Secure</span>
              </div>
            </div>

            {/* Dummy card fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', color: GM.ink2, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>
                  Card number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    defaultValue="4242  4242  4242  4242"
                    readOnly
                    style={{ width: '100%', backgroundColor: GM.base, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '10px 14px 10px 40px', fontSize: 14, fontFamily: 'JetBrains Mono,monospace', color: GM.ink2, outline: 'none', boxSizing: 'border-box', cursor: 'default' }}
                  />
                  <CreditCard size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: GM.ink3 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: GM.ink2, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>Expiry</label>
                  <input type="text" defaultValue="12 / 28" readOnly style={{ width: '100%', backgroundColor: GM.base, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '10px 14px', fontSize: 14, fontFamily: 'JetBrains Mono,monospace', color: GM.ink2, outline: 'none', boxSizing: 'border-box', cursor: 'default' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: GM.ink2, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>CVV</label>
                  <input type="text" defaultValue="•••" readOnly style={{ width: '100%', backgroundColor: GM.base, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '10px 14px', fontSize: 14, fontFamily: 'JetBrains Mono,monospace', color: GM.ink2, outline: 'none', boxSizing: 'border-box', cursor: 'default' }} />
                </div>
              </div>
            </div>

            {/* Test card notice */}
            <div style={{ backgroundColor: '#EFF4FF', border: '1px solid #BFCFFE', borderRadius: 8, padding: '8px 12px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>ℹ️</span>
              <span style={{ color: '#1D4ED8', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>
                Test card — no real payment is processed.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handlePay} style={{ flex: 1, backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Lock size={13} /> Pay ₹{total.toLocaleString('en-IN')}
              </button>
              <button onClick={onCancel} style={{ backgroundColor: 'transparent', color: GM.ink2, border: `1px solid ${GM.border}`, borderRadius: 10, padding: '13px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function GrowmartCheckout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, addOrder, addItemById, creditWallet } = useStore();
  const [form, setForm]           = useState({ name: 'Aditi Sharma', email: 'aditi@example.com', address: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [placed, setPlaced]       = useState(false);
  const [placedId, setPlacedId]   = useState(null);
  const [saving, setSaving]       = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setSaving(true);
    setShowPayment(false);
    try {
      const result = await api.placeOrder(
        cartItems.map(i => i.name).join(', '),
        cartTotal
      );
      addOrder({
        order_id:   result.order_id,
        product:    cartItems.map(i => i.name).join(', '),
        amount:     cartTotal,
        status:     'processing',
        order_date: new Date().toISOString().slice(0, 10),
      });
      setPlacedId(result.order_id);
    } catch {
      // Fallback if backend is unreachable
      const fallbackId = `GM-${10250 + Math.floor(Math.random() * 999)}`;
      addOrder({ order_id: fallbackId, product: cartItems.map(i => i.name).join(', '), amount: cartTotal, status: 'processing', order_date: new Date().toISOString().slice(0,10) });
      setPlacedId(fallbackId);
    } finally {
      setSaving(false);
      setPlaced(true);
    }
  };

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (placed) return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={26} style={{ color: '#15803D' }} />
        </div>
        <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', color: GM.ink1, margin: '0 0 10px' }}>Order placed!</h1>
        <p style={{ color: GM.ink2, fontSize: 14, fontFamily: 'Inter,sans-serif', lineHeight: 1.65, margin: '0 0 6px' }}>
          Payment confirmed. Your order is being processed.
        </p>
        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 18px', display: 'inline-block', margin: '16px 0 12px' }}>
          <span style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif' }}>Order ID: </span>
          <span style={{ color: GM.ink1, fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{placedId}</span>
        </div>
        <p style={{ color: GM.ink3, fontSize: 12, fontFamily: 'Inter,sans-serif', marginBottom: 24, lineHeight: 1.6 }}>
          Save this ID — you can use it to ask the agent about your order or request a return.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/growmart')} style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Back to store
          </button>
          <button onClick={() => navigate('/growmart/orders')} style={{ backgroundColor: 'transparent', color: GM.ink2, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '11px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            View orders
          </button>
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />

      {showPayment && (
        <PaymentModal
          total={cartTotal}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 24, letterSpacing: '-0.03em', color: GM.ink1, margin: '0 0 28px' }}>Checkout</h1>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Full name',       key: 'name',    type: 'text',  placeholder: 'Aditi Sharma' },
              { label: 'Email address',   key: 'email',   type: 'email', placeholder: 'aditi@example.com' },
              { label: 'Delivery address',key: 'address', type: 'text',  placeholder: '123, MG Road, Bengaluru — 560001' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', color: GM.ink2, fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '10px 14px', fontSize: 14, fontFamily: 'Inter,sans-serif', color: GM.ink1, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = GM.accent}
                  onBlur={e => e.target.style.borderColor = GM.border}
                />
              </div>
            ))}

            <button type="submit" disabled={saving}
              style={{ backgroundColor: GM.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
              <CreditCard size={15} />
              {saving ? 'Placing order…' : `Continue to payment — ₹${cartTotal.toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div style={{ backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 12, padding: '20px', position: 'sticky', top: 80 }}>
          <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: GM.ink1, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Order summary</h2>
          {cartItems.length === 0 ? (
            <p style={{ color: GM.ink3, fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Your cart is empty.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <div>
                    <div style={{ color: GM.ink1, fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{item.name}</div>
                    <div style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif' }}>×{item.qty}</div>
                  </div>
                </div>
                <span style={{ color: GM.ink1, fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
              </div>
            ))
          )}
          <div style={{ borderTop: `1px solid ${GM.border}`, marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: GM.ink2, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Total</span>
            <span style={{ color: GM.ink1, fontSize: 16, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
