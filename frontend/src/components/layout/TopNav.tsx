/**
 * Bhumi Prajna - Top Navigation
 * Horizontal nav bar: brand, primary navigation, date, notifications, user menu.
 */

import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  badge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
  },
  {
    label: 'Existing Projects',
    path: '/projects',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
  },
  {
    label: 'GIS Map',
    path: '/gis',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    path: '/notifications',
    badge: true,
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    label: 'Audit Trail',
    path: '/audit',
    roles: ['ADMIN', 'CENTRAL_OFFICER'],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: 'Administration',
    path: '/admin',
    roles: ['ADMIN'],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    label: 'Model Governance',
    path: '/admin/models',
    roles: ['ADMIN', 'CENTRAL_OFFICER'],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'System Administrator',
  CENTRAL_OFFICER: 'Central Officer',
  STATE_OFFICER: 'State Officer',
  DISTRICT_OFFICER: 'District Officer',
};

interface TopNavProps {
  unreadCount?: number;
}

export default function TopNav({ unreadCount = 0 }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  const getScopeLabel = (): string => {
    if (user.role === 'CENTRAL_OFFICER') return 'All India';
    if (user.role === 'STATE_OFFICER') return user.state || '';
    if (user.role === 'DISTRICT_OFFICER') return `${user.district}, ${user.state}`;
    return 'System';
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar: brand, date, notifications, user */}
      <div
        className="flex items-center gap-4 px-5"
        style={{ height: 'var(--header-height)', background: 'var(--header-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-extrabold flex-shrink-0 text-white"
            style={{ background: 'linear-gradient(155deg, var(--color-primary-400), var(--color-primary-600))', boxShadow: '0 2px 8px rgba(151,71,42,0.4)' }}
          >
            प्र
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Bhumi Prajna</div>
            <div className="text-[9.5px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Land Acquisition Intelligence</div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Utility cluster */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {today}
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors flex-shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Notifications"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center text-[9px] font-bold text-white rounded-full"
                style={{ minWidth: 15, height: 15, padding: '0 3px', background: 'var(--risk-critical)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--color-border)' }} />

          {/* User menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors"
              style={{ background: menuOpen ? 'var(--color-surface)' : 'transparent' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: 'linear-gradient(155deg, var(--color-primary-400), var(--color-primary-600))' }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-[12.5px] font-semibold m-0" style={{ color: 'var(--color-text-primary)' }}>{user.full_name}</p>
                <p className="text-[10.5px] m-0" style={{ color: 'var(--color-text-muted)' }}>{ROLE_LABELS[user.role]}</p>
              </div>
              <svg className="w-3.5 h-3.5 hidden md:block flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--color-text-muted)">
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden animate-fade-in"
                style={{ background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-semibold m-0" style={{ color: 'var(--color-text-primary)' }}>{user.full_name}</p>
                  <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>{ROLE_LABELS[user.role]}</p>
                  <p className="text-[11px] mt-1 m-0" style={{ color: 'var(--color-text-muted)' }}>Scope: {getScopeLabel()}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-left"
                  style={{ color: 'var(--risk-critical)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--risk-critical-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav strip */}
      <nav
        className="flex items-center gap-1 px-5 overflow-x-auto no-scrollbar"
        style={{
          background: 'linear-gradient(185deg, var(--sidebar-bg) 0%, #241a13 100%)',
          borderBottom: '1px solid var(--sidebar-border)',
          height: 46,
        }}
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="group flex items-center gap-1.5 px-3 h-full text-[13px] font-medium no-underline whitespace-nowrap transition-colors duration-150 flex-shrink-0"
            style={({ isActive }) => ({
              color: isActive ? 'white' : 'var(--sidebar-text)',
              background: isActive ? 'linear-gradient(180deg, rgba(205,127,82,0.24), rgba(205,127,82,0.06))' : 'transparent',
              boxShadow: isActive ? 'inset 0 -2px 0 var(--color-primary-400)' : 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'var(--sidebar-hover)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'transparent';
            }}
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0" style={{ opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span
                    className="flex items-center justify-center text-[9px] font-bold text-white rounded-full"
                    style={{ minWidth: 18, padding: '1px 5px', background: 'var(--risk-critical)' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
