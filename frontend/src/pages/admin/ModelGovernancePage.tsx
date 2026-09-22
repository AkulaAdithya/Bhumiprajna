/**
 * Bhumi Prajna - Model Governance Page (M5)
 * Displays all registered model versions with performance metrics.
 * Admin-controlled approval gate. Stale-data check trigger.
 * Prominently displays governance note: no auto-retrain on operational updates.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PageHeader, Button, EmptyState, LoadingSpinner } from '../../components/shared';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:  { label: 'Active',     bg: 'bg-emerald-50', text: 'text-emerald-700' },
  candidate: { label: 'Candidate',  bg: 'bg-amber-50',   text: 'text-amber-700'  },
  archived:  { label: 'Archived',   bg: 'bg-[var(--color-surface)]',  text: 'text-[var(--color-text-muted)]'  },
};

const REFRESH_ICON = (spinning: boolean) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WARNING_ICON = <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--risk-medium)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>;

function MetricBadge({ label, value, highlight }: { label: string; value?: number | null; highlight?: boolean }) {
  if (value == null) return null;
  const display = value < 1 ? `${(value * 100).toFixed(1)}%` : value.toFixed(1);
  return (
    <div
      className="rounded-lg px-3 py-2 text-center bg-white"
      style={{
        border: highlight ? '1.5px solid var(--color-primary-200)' : '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="font-mono font-bold leading-tight"
        style={{ fontSize: 17, color: highlight ? 'var(--color-primary-600)' : 'var(--color-text-primary)' }}
      >{display}</div>
      <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function ModelGovernancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [staleLoading, setStaleLoading] = useState(false);
  const [staleResult, setStaleResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.listModels();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (version: string) => {
    setApproving(version);
    setMessage('');
    try {
      const res = await api.approveModel(version);
      setMessage(`✅ ${res.message}`);
      await load();
    } catch (e: any) {
      setMessage(`❌ ${e?.response?.data?.detail || 'Approval failed'}`);
    } finally {
      setApproving(null);
    }
  };

  const handleStaleCheck = async () => {
    setStaleLoading(true);
    setStaleResult(null);
    try {
      const res = await api.triggerStaleCheck();
      setStaleResult(res);
    } catch (e: any) {
      setStaleResult({ error: e?.response?.data?.detail || 'Failed to run check' });
    } finally {
      setStaleLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="Model Governance"
        subtitle="Prediction model versions, metrics, and controlled deployment."
        action={(isAdmin || user?.role === 'CENTRAL_OFFICER') ? (
          <Button variant="secondary" icon={REFRESH_ICON(staleLoading)} onClick={handleStaleCheck} disabled={staleLoading}>
            {staleLoading ? 'Checking…' : 'Run Stale-Data Check'}
          </Button>
        ) : undefined}
      />

      {/* Governance notice */}
      <div className="rounded-[10px] p-4 flex gap-3" style={{ background: 'var(--risk-medium-bg)', border: '1px solid var(--risk-medium-border)' }}>
        {WARNING_ICON}
        <div className="text-sm" style={{ color: 'var(--risk-medium)' }}>
          <span className="font-semibold">Model Governance Policy: </span>
          The system does <strong>not</strong> automatically retrain on operational project updates.
          New model versions must be validated externally, registered, and explicitly approved by an Administrator before production use.
          Risk explanations are model-associated contributors — not proven causal effects.
        </div>
      </div>

      {/* Stale check result */}
      {staleResult && (
        <div
          className="rounded-[10px] p-4 text-sm"
          style={staleResult.error
            ? { background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical)' }
            : { background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-200)', color: 'var(--color-text-secondary)' }}
        >
          {staleResult.error ? (
            <p>❌ {staleResult.error}</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stale-Data Check Complete</p>
              <p>Projects checked: <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{staleResult.projects_checked}</span></p>
              <p>Stale projects found: <span className="font-mono" style={{ color: 'var(--risk-high)' }}>{staleResult.stale_projects}</span></p>
              <p>Notifications created: <span className="font-mono" style={{ color: 'var(--color-accent-700)' }}>{staleResult.notifications_created}</span></p>
              {staleResult.details?.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {staleResult.details.map((d: any) => (
                    <p key={d.project_id} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      • {d.project_name} — {d.age_days}d stale, {d.notifications_created} alerts sent
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status message */}
      {message && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-200)', color: 'var(--color-text-secondary)' }}>
          {message}
        </div>
      )}

      {/* Model versions */}
      {loading ? (
        <LoadingSpinner message="Loading model versions..." />
      ) : !data?.versions?.length ? (
        <EmptyState title="No model versions registered." />
      ) : (
        <div className="flex flex-col gap-4">
          {data.versions.map((mv: any) => {
            const cfg = STATUS_CONFIG[mv.status] || STATUS_CONFIG.archived;
            const m = mv.metrics || {};
            const isActive = mv.status === 'approved';
            return (
              <div
                key={mv.id}
                className="bg-white rounded-[10px] p-5"
                style={{ border: isActive ? '1px solid var(--risk-low)' : '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}
              >
                {/* Version header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{mv.model_version}</h2>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {isActive && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--risk-low)' }}>● In Production</span>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {mv.model_type} · Trained {mv.training_timestamp ? new Date(mv.training_timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    {mv.notes && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{mv.notes}</p>}
                  </div>
                  {isAdmin && mv.status !== 'approved' && (
                    <Button
                      onClick={() => handleApprove(mv.model_version)}
                      loading={approving === mv.model_version}
                      className="flex-shrink-0"
                    >
                      {approving === mv.model_version ? 'Approving…' : 'Approve for Production'}
                    </Button>
                  )}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                  <MetricBadge label="PR-AUC"    value={m.pr_auc}      highlight />
                  <MetricBadge label="ROC-AUC"   value={m.roc_auc}     highlight />
                  <MetricBadge label="F1"         value={m.f1}          highlight />
                  <MetricBadge label="Precision"  value={m.precision} />
                  <MetricBadge label="Recall"     value={m.recall} />
                  <MetricBadge label="Brier"      value={m.brier_score} />
                  <MetricBadge label="Brier Cal." value={m.brier_after_calibration} />
                </div>

                {/* Details row */}
                <div className="flex flex-wrap gap-4 text-xs pt-3" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
                  <span>Dataset: <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{mv.training_dataset_version || '—'}</span></span>
                  <span>Features: <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{mv.feature_schema_version || '—'}</span></span>
                  <span>MAE: <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{m.mae_days ? `${m.mae_days.toFixed(1)} days` : '—'}</span></span>
                  {mv.model_path && <span>Path: <span className="font-mono truncate max-w-xs" style={{ color: 'var(--color-text-muted)' }}>{mv.model_path}</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
