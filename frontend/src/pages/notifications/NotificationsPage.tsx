/**
 * Bhumi Prajna - Notifications Page (M4/M5)
 * In-app notification centre with mark-as-read and severity filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader, Button, RiskBadge, EmptyState, LoadingSpinner, Pagination } from '../../components/shared';
import type { RiskCategory } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  RISK_ESCALATION: '⚠️',
  RISK_IMPROVEMENT: '✅',
  DATA_STALE: '🕐',
  SYSTEM: 'ℹ️',
};

const EMPTY_ICON = <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (severityFilter) params.severity = severityFilter;
      if (unreadOnly) params.unread_only = 1;
      const data = await api.getNotifications(params);
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, unreadOnly]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadOnes = notifications.filter(n => !n.read_at);
    await Promise.allSettled(unreadOnes.map(n => api.markNotificationRead(n.id)));
    await fetchNotifications();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="Notifications"
        subtitle={
          unread > 0
            ? `${unread} unread · ${total} total`
            : `${total} notification${total !== 1 ? 's' : ''}`
        }
        action={unread > 0 ? <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Mark all as read</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          className="field-input"
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--color-accent-600)' }}
          />
          Unread only
        </label>
      </div>

      {/* List */}
      <div className="bg-white rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        {loading ? (
          <LoadingSpinner message="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={EMPTY_ICON}
            title="No notifications"
            description="Alerts appear when risk changes or data goes stale."
          />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {notifications.map(n => {
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  className="flex gap-4 px-5 py-4 transition-colors card-hover"
                  style={isUnread ? { background: 'var(--color-accent-50)' } : undefined}
                >
                  {/* Dot */}
                  <div className="pt-1 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: isUnread ? 'var(--color-accent-600)' : 'var(--color-border-strong)' }}
                    />
                  </div>

                  {/* Icon */}
                  <div className="text-lg flex-shrink-0 pt-0.5">
                    {TYPE_ICONS[n.type] || 'ℹ️'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: isUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {n.message}
                      </p>
                      <RiskBadge risk={(n.severity || 'LOW') as RiskCategory} size="sm" showDot={false} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatTime(n.created_at)}</span>
                      {n.project_id && (
                        <button
                          onClick={() => navigate(`/projects/${n.project_id}`)}
                          className="text-xs font-semibold"
                          style={{ color: 'var(--color-accent-600)' }}
                        >
                          View project →
                        </button>
                      )}
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
