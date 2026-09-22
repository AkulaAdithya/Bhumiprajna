/**
 * Bhumi Prajna - App Layout
 * Main layout shell: navy sidebar + top bar + light content area.
 */

import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import TopNav from './TopNav';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchUnread = () => {
      api.getNotifications({ page_size: 1 })
        .then(data => { if (!cancelled) setUnreadCount(data.unread ?? 0); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-9 h-9 rounded-full animate-spin"
            style={{ border: '3px solid var(--color-accent-600)', borderTopColor: 'transparent' }}
          />
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Loading Bhumi Prajna…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)' }}>
      <TopNav unreadCount={unreadCount} />
      <main className="flex-1 w-full mx-auto box-border" style={{ padding: 24, maxWidth: 1400 }}>
        <Outlet />
      </main>
    </div>
  );
}
