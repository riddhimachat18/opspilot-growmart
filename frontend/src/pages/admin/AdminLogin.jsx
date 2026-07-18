import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7', accentDim: 'rgba(79,110,247,0.14)',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    loginAsAdmin();
    navigate('/admin/dashboard');
  };

  return (
    <div style={{ backgroundColor: C.base, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent} 0%, #8B5CF6 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>OP</span>
          </div>
          <span style={{ color: C.ink1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em' }}>OpsPilot</span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, borderRadius: 14, padding: '32px 28px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 4px' }}>
            Sign in to your workspace
          </h1>
          <p style={{ color: C.ink3, fontSize: 13, margin: '0 0 28px' }}>GrowMart ops console · demo mode</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Org field — pre-filled */}
            <div>
              <label style={{ display: 'block', color: C.ink3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Workspace
              </label>
              <input
                type="text"
                defaultValue="growmart"
                readOnly
                style={{ width: '100%', backgroundColor: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.ink2, fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'default' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: C.ink3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                defaultValue="ops@growmart.in"
                style={{ width: '100%', backgroundColor: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.ink1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: C.ink3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                defaultValue="demo1234"
                style={{ width: '100%', backgroundColor: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.ink1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <button type="submit" style={{ backgroundColor: C.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Sign in <ArrowRight size={14} />
            </button>
          </form>

          <p style={{ color: C.ink3, fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
            Demo mode — credentials are pre-filled.<br />No real auth is performed.
          </p>
        </div>

        <p style={{ color: C.ink3, fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          ← <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.ink3, cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Back to OpsPilot site</button>
        </p>
      </div>
    </div>
  );
}
