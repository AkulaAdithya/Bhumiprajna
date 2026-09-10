/**
 * Pravaah - Audit Trail Page (M5 early / M4 wiring)
 * Append-only audit log viewer. Only ADMIN and CENTRAL_OFFICER can access.
 * Shows actor, action, timestamp, project, before/after values.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PROJECT_CREATED:   { label: 'Created',        color: 'text-emerald-400', icon: '➕' },
  SNAPSHOT_ADDED:    { label: 'Snapshot Added',  color: 'text-blue-400',    icon: '📸' },
  RISK_ESCALATED:    { label: 'Risk Escalated',  color: 'text-red-400',     icon: '🔴' },
  RISK_IMPROVED:     { label: 'Risk Improved',   color: 'text-green-400',   icon: '🟢' },
  USER_CREATED:      { label: 'User Created',    color: 'text-indigo-400',  icon: '👤' },
  USER_UPDATED:      { label: 'User Updated',    color: 'text-slate-400',   icon: '✏️' },
  MODEL_DEPLOYED:    { label: 'Model Deployed',  color: 'text-purple-400',  icon: '🤖' },
};

export default function AuditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const pageSize = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (actionFilter) params.action = actionFilter;
      const data = await api.getAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      if (err?.response?.status === 403) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  if (forbidden) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold text-gray-600">Access Restricted</h2>
        <p className="text-sm mt-2">The audit trail is only visible to Admin and Central Officers.</p>
        <p className="text-xs mt-1 text-gray-400">Your role: <span className="text-gray-600">{user?.role}</span></p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2144' }}>Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} event{total !== 1 ? 's' : ''} recorded · append-only log
          </p>
        </div>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#374151', background: 'white', outline: 'none' }}
        >
          <option value="">All Actions</option>
          <option value="PROJECT_CREATED">Project Created</option>
          <option value="SNAPSHOT_ADDED">Snapshot Added</option>
          <option value="RISK_ESCALATED">Risk Escalated</option>
          <option value="RISK_IMPROVED">Risk Improved</option>
          <option value="USER_CREATED">User Created</option>
          <option value="MODEL_DEPLOYED">Model Deployed</option>
        </select>
      </div>

      {/* Log list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No audit records found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => {
              const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-gray-500', icon: '•' };
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="flex items-start gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    {/* Icon */}
                    <div className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                          {log.details && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{log.details}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                          <div>{formatTime(log.timestamp)}</div>
                          {log.actor_email && <div className="mt-0.5 text-gray-300">{log.actor_email}</div>}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {log.project_id && (
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/projects/${log.project_id}`); }}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            View project →
                          </button>
                        )}
                        {(log.before_values || log.after_values) && (
                          <span className="text-xs text-gray-400">
                            {isExpanded ? '▲ Hide details' : '▼ Show changes'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable before/after */}
                  {isExpanded && (log.before_values || log.after_values) && (
                    <div className="px-5 pb-4 ml-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {log.before_values && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div className="text-red-500 font-semibold mb-2 uppercase tracking-wide">Before</div>
                            {Object.entries(log.before_values).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-gray-600 py-0.5">
                                <span>{k}</span>
                                <span className="font-mono text-red-600">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {log.after_values && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <div className="text-green-600 font-semibold mb-2 uppercase tracking-wide">After</div>
                            {Object.entries(log.after_values).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-gray-600 py-0.5">
                                <span>{k}</span>
                                <span className="font-mono text-green-700">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
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
