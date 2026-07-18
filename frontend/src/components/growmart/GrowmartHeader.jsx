import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Package, MessageSquare, Ticket, LogOut, Wallet, ChevronDown, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

const GM = {
  base: '#FAFAF8', surface: '#FFFFFF', border: '#E5E0D8',
  ink1: '#1A1410', ink2: '#4A3F35', ink3: '#8C7B6E', ink4: '#B8AFA6',
  accent: '#E8520A', accentDim: '#FEF0E8',
};

function AccountMenu({ onClose }) {
  const navigate = useNavigate();
  const { user, wallet, cartCount, wishlist, orders } = useStore();
  const { loginAsAdmin } = useAuth();

  const items = [
    { icon: Package,       label: 'Orders',        sub: `${orders.length} orders`,                          path: '/growmart/orders'       },
    { icon: Heart,         label: 'Wishlist',       sub: `${wishlist.length} saved`,                         path: '/growmart/wishlist'      },
    { icon: ShoppingCart,  label: 'Cart',           sub: cartCount > 0 ? `${cartCount} items` : 'Empty',    path: '/growmart/cart'          },
    { icon: MessageSquare, label: 'Chat history',   sub: 'View past conversations',                          path: '/growmart/chat-history'  },
    { icon: Ticket,        label: 'Open tickets',   sub: 'Issues under review',                              path: '/growmart/tickets'       },
  ];

  const handleSwitchAdmin = () => {
    loginAsAdmin();
    onClose();
    navigate('/admin/dashboard');
  };

  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 268, backgroundColor: GM.surface,
        border: `1px solid ${GM.border}`, borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Profile header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${GM.border}`, backgroundColor: GM.base }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: GM.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>{user.avatar}</span>
          </div>
          <div>
            <div style={{ color: GM.ink1, fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', letterSpacing: '-0.01em' }}>{user.name}</div>
            <div style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif' }}>{user.email}</div>
          </div>
        </div>
        {/* Wallet */}
        <div style={{ marginTop: 12, backgroundColor: GM.surface, border: `1px solid ${GM.border}`, borderRadius: 9, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={13} style={{ color: GM.accent, flexShrink: 0 }} />
          <span style={{ color: GM.ink2, fontSize: 12, fontFamily: 'Inter,sans-serif' }}>GrowMart Wallet</span>
          <span style={{ marginLeft: 'auto', color: GM.ink1, fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', letterSpacing: '-0.02em' }}>
            ₹{wallet.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Nav items — all go to real GrowMart customer pages */}
      <div style={{ padding: '6px 0' }}>
        {items.map(({ icon: Icon, label, sub, path }) => (
          <button key={label} onClick={() => { navigate(path); onClose(); }}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = GM.base}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Icon size={14} style={{ color: GM.ink3, flexShrink: 0 }} />
            <div>
              <div style={{ color: GM.ink1, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{label}</div>
              <div style={{ color: GM.ink3, fontSize: 11, fontFamily: 'Inter,sans-serif' }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Admin switch + sign out */}
      <div style={{ borderTop: `1px solid ${GM.border}`, padding: '6px 0 4px' }}>
        {/* Switch to admin — clearly labelled as a demo action */}
        <button onClick={handleSwitchAdmin}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF4FF'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ShieldCheck size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#1D4ED8', fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Switch to Admin Console</div>
            <div style={{ color: '#60A5FA', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>GrowMart ops view</div>
          </div>
        </button>

        <button onClick={onClose}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, color: GM.ink3, fontSize: 13, fontFamily: 'Inter,sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = GM.base}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function GrowmartHeader() {
  const navigate = useNavigate();
  const { cartCount, wallet, walletFlash, user } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <header style={{ backgroundColor: GM.surface, borderBottom: `1px solid ${GM.border}`, position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <button onClick={() => navigate('/growmart')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: GM.ink1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', letterSpacing: '-0.02em' }}>GM</span>
          </div>
          <span style={{ color: GM.ink1, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em' }}>GrowMart</span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[['Shop', '/growmart/products'], ['About', '/growmart'], ['Support', '/growmart']].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: GM.ink2, fontSize: 14, fontFamily: 'Inter,sans-serif', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.color = GM.ink1}
              onMouseLeave={e => e.currentTarget.style.color = GM.ink2}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Wallet pill */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              backgroundColor: walletFlash?.type === 'credit' ? '#ECFDF5' : GM.base,
              border: `1px solid ${walletFlash?.type === 'credit' ? '#A7F3D0' : GM.border}`,
              borderRadius: 999, padding: '5px 12px',
              transition: 'background-color 0.4s, border-color 0.4s',
            }}>
            <Wallet size={13} style={{ color: walletFlash?.type === 'credit' ? '#059669' : GM.ink3 }} />
            <span style={{ color: walletFlash?.type === 'credit' ? '#059669' : GM.ink1, fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>
              ₹{wallet.toLocaleString('en-IN')}
            </span>
            {walletFlash?.type === 'credit' && (
              <span style={{ color: '#059669', fontSize: 11, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>
                +₹{walletFlash.amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Cart */}
          <button onClick={() => navigate('/growmart/cart')}
            style={{ background: 'none', border: `1px solid ${GM.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: GM.ink2, fontSize: 13, fontFamily: 'Inter,sans-serif' }}>
            <ShoppingCart size={15} />
            Cart
            {cartCount > 0 && (
              <span style={{ backgroundColor: GM.accent, color: '#fff', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{cartCount}</span>
            )}
          </button>

          {/* Account avatar */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${menuOpen ? GM.accent : GM.border}`, borderRadius: 999, padding: '4px 10px 4px 4px', cursor: 'pointer' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: GM.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>{user.avatar}</span>
              </div>
              <span style={{ color: GM.ink1, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
              <ChevronDown size={12} style={{ color: GM.ink3, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </div>
    </header>
  );
}
