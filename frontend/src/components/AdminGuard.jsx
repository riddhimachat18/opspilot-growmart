/**
 * AdminGuard — blocks /admin/* routes when role is 'customer'.
 * Shows a clean gate page with a "Switch to admin" button instead of
 * silently redirecting, so judges understand the role separation.
 */
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7',
};

function AdminGatePage() {
  const navigate   = useNavigate();
  const { loginAsAdmin } = useAuth();

  const enter = () => {
    loginAsAdmin();
    navigate('/admin/dashboard');
  };

  return (
    <div style={{ backgroundColor: C.base, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 400, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent} 0%, #8B5CF6 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShieldCheck size={24} color="#fff" />
        </div>

        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 10px' }}>
          Admin Console
        </h1>
        <p style={{ color: C.ink2, fontSize: 14, lineHeight: 1.65, margin: '0 0 28px' }}>
          You're currently browsing as <strong style={{ color: C.ink1 }}>Aditi Sharma</strong> (customer).
          The Admin Console is the ops view — switch accounts to continue.
        </p>

        <button onClick={enter} style={{ width: '100%', backgroundColor: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ShieldCheck size={15} />
          Enter as GrowMart ops team
        </button>

        <button onClick={() => navigate('/growmart')} style={{ width: '100%', background: 'none', border: `1px solid ${C.border2}`, borderRadius: 10, padding: '12px', fontSize: 13, color: C.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ArrowLeft size={13} />
          Back to GrowMart store
        </button>

        <p style={{ color: C.ink3, fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
          Demo note: no real auth. Role switching simulates customer ↔ ops account separation.
        </p>
      </div>
    </div>
  );
}

export default function AdminGuard({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <AdminGatePage />;
}
