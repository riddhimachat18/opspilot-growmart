import { NavLink } from 'react-router-dom';
import { MessageSquare, BarChart2, Users } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/chat',      icon: MessageSquare, label: 'Chat'      },
  { to: '/dashboard', icon: BarChart2,     label: 'Analytics' },
  { to: '/crm',       icon: Users,         label: 'CRM'       },
];

export default function SideNav() {
  return (
    <nav
      className="flex flex-col py-4 px-3 flex-shrink-0"
      style={{
        width: '200px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            backgroundColor: 'var(--ink-1)',
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            GM
          </span>
        </div>
        <div>
          <div className="font-display text-sm font-bold leading-none" style={{ color: 'var(--ink-1)' }}>
            GrowMart
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>
            OpsPilot
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'active-nav' : 'inactive-nav'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--ink-3)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
