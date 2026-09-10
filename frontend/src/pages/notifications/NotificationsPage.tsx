/**
 * Pravaah - Notifications Page (M4/M5)
 * In-app notification centre with mark-as-read and severity filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-500/30' },
  HIGH:     { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500', border: 'border-orange-500/30' },
  MEDIUM:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500', border: 'border-yellow-500/30' },
  LOW:      { bg: 'bg-slate-700/50', text: 'text-slate-400', dot: 'bg-slate-500', border: 'border-slate-600' },
};

const TYPE_ICONS: Record<string, string> = {
  RISK_ESCALATION: '⚠️',
  RISK_IMPROVEMENT: '✅',
  DATA_STALE: '🕐',
  SYSTEM: 'ℹ️',
};

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
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2144' }}>Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? (
              <span><span className="text-blue-600 font-semibold">{unread} unread</span> · {total} total</span>
            ) : (
              <span>{total} notification{total !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#374151', background: 'white', outline: 'none' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }}
            className="w-4 h-4 rounded text-blue-600"
          />
          Unread only
        </label>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">Alerts appear when risk changes or data goes stale.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => {
              const cfg = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.LOW;
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 px-5 py-4 transition-colors ${isUnread ? 'bg-blue-50/40' : ''} hover:bg-gray-50`}
                >
                  {/* Dot */}
                  <div className="pt-1 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isUnread ? cfg.dot : 'bg-gray-300'}`} />
                  </div>

                  {/* Icon */}
                  <div className="text-lg flex-shrink-0 pt-0.5">
                    {TYPE_ICONS[n.type] || 'ℹ️'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <span className={`text-xs flex-shrink-0 px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                        {n.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">{formatTime(n.created_at)}</span>
                      {n.project_id && (
                        <button
                          onClick={() => navigate(`/projects/${n.project_id}`)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View project →
                        </button>
                      )}
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#374151', fontSize: 13 }}>← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#94a3b8' : '#374151', fontSize: 13 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
