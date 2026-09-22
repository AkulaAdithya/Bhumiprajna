/**
 * Bhumi Prajna - Audit Trail Page (M5 early / M4 wiring)
 * Append-only audit log viewer. Only ADMIN and CENTRAL_OFFICER can access.
 * Shows actor, action, timestamp, project, before/after values.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PageHeader, EmptyState, LoadingSpinner, Pagination } from '../../components/shared';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PROJECT_CREATED:   { label: 'Created',        color: 'var(--risk-low)',      icon: '➕' },
  SNAPSHOT_ADDED:    { label: 'Snapshot Added',  color: 'var(--color-accent-600)', icon: '📸' },
  RISK_ESCALATED:    { label: 'Risk Escalated',  color: 'var(--risk-critical)', icon: '🔴' },
  RISK_IMPROVED:     { label: 'Risk Improved',   color: 'var(--risk-low)',      icon: '🟢' },
  USER_CREATED:      { label: 'User Created',    color: 'var(--color-accent-600)', icon: '👤' },
  USER_UPDATED:      { label: 'User Updated',    color: 'var(--color-text-secondary)', icon: '✏️' },
  MODEL_DEPLOYED:    { label: 'Model Deployed',  color: 'var(--color-accent-600)', icon: '🤖' },
};

const EMPTY_ICON = <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

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
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center" style={{ color: 'var(--color-text-muted)' }}>
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Access Restricted</h2>
        <p className="text-sm mt-2">The audit trail is only visible to Admin and Central Officers.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Your role: <span style={{ color: 'var(--color-text-secondary)' }}>{user?.role}</span></p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="Audit Trail"
        subtitle={`${total} event${total !== 1 ? 's' : ''} recorded · append-only log`}
        action={
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="field-input"
            style={{ width: 'auto', cursor: 'pointer' }}
          >
            <option value="">All Actions</option>
            <option value="PROJECT_CREATED">Project Created</option>
            <option value="SNAPSHOT_ADDED">Snapshot Added</option>
            <option value="RISK_ESCALATED">Risk Escalated</option>
            <option value="RISK_IMPROVED">Risk Improved</option>
            <option value="USER_CREATED">User Created</option>
            <option value="MODEL_DEPLOYED">Model Deployed</option>
          </select>
        }
      />

      {/* Log list */}
      <div className="bg-white rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        {loading ? (
          <LoadingSpinner message="Loading audit trail…" />
        ) : logs.length === 0 ? (
          <EmptyState icon={EMPTY_ICON} title="No audit records found" />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {logs.map(log => {
              const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'var(--color-text-secondary)', icon: '•' };
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id} className="transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                  <div
                    className="flex items-start gap-4 px-5 py-4 cursor-pointer card-hover"
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    {/* Icon */}
                    <div className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                          {log.details && (
                            <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>{log.details}</p>
                          )}
                        </div>
                        <div className="text-xs flex-shrink-0 text-right" style={{ color: 'var(--color-text-muted)' }}>
                          <div>{formatTime(log.timestamp)}</div>
                          {log.actor_email && <div className="mt-0.5">{log.actor_email}</div>}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {log.project_id && (
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/projects/${log.project_id}`); }}
                            className="text-xs font-semibold"
                            style={{ color: 'var(--color-accent-600)' }}
                          >
                            View project →
                          </button>
                        )}
                        {(log.before_values || log.after_values) && (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
                          <div className="rounded-lg p-3" style={{ background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)' }}>
                            <div className="font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--risk-critical)' }}>Before</div>
                            {Object.entries(log.before_values).map(([k, v]) => (
                              <div key={k} className="flex justify-between py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>{k}</span>
                                <span className="font-mono" style={{ color: 'var(--risk-critical)' }}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {log.after_values && (
                          <div className="rounded-lg p-3" style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)' }}>
                            <div className="font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--risk-low)' }}>After</div>
                            {Object.entries(log.after_values).map(([k, v]) => (
                              <div key={k} className="flex justify-between py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>{k}</span>
                                <span className="font-mono" style={{ color: 'var(--risk-low)' }}>{String(v)}</span>
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

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
