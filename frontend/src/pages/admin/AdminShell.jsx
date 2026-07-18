import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, Users, BookOpen, LogOut, ExternalLink, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7', accentDim: 'rgba(79,110,247,0.14)',
};

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tickets',   icon: Inbox,           label: 'Tickets',   badge: 3 },
  { to: '/admin/crm',       icon: Users,           label: 'CRM' },
  { to: '/admin/kb',        icon: BookOpen,        label: 'Knowledge base' },
];

export default function AdminShell() {
  const navigate = useNavigate();
  const { loginAsCustomer } = useAuth();

  const switchToCustomer = () => {
    loginAsCustomer();
    navigate('/growmart');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: C.base, fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: 216, flexShrink: 0, backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        {/* Workspace header */}
        <div style={{ padding: '16px 16px 0', borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${C.accent} 0%, #8B5CF6 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>OP</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.ink1, fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>GrowMart</div>
              <div style={{ color: C.ink3, fontSize: 10, lineHeight: 1.2 }}>Powered by OpsPilot</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                backgroundColor: isActive ? C.accentDim : 'transparent',
                color: isActive ? C.accent : C.ink2,
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: 'background-color 0.12s',
              })}
              onMouseEnter={e => { if (!e.currentTarget.getAttribute('data-active')) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!e.currentTarget.getAttribute('data-active')) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ backgroundColor: C.accent, color: '#fff', borderRadius: 999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, padding: '0 4px' }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer links */}
        <div style={{ padding: '10px 8px 14px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={switchToCustomer} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, width: '100%', background: 'none', border: 'none', color: C.ink2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ShoppingBag size={13} /> Switch to GrowMart store
          </button>
          <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, width: '100%', background: 'none', border: 'none', color: C.ink3, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ height: 52, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0, gap: 12 }}>
          <span style={{ color: C.ink2, fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, letterSpacing: '-0.01em' }}>GrowMart workspace</span>
          <span style={{ color: C.ink3, fontSize: 12 }}>·</span>
          <span style={{ color: C.ink3, fontSize: 12 }}>ops@growmart.in</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399' }} />
            <span style={{ color: C.ink3, fontSize: 11 }}>Live</span>
          </div>
        </header>

        {/* Page outlet */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: C.base }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
