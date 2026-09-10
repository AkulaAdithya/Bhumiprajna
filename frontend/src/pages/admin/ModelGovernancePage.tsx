/**
 * Pravaah - Model Governance Page (M5)
 * Displays all registered model versions with performance metrics.
 * Admin-controlled approval gate. Stale-data check trigger.
 * Prominently displays governance note: no auto-retrain on operational updates.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:  { label: 'Active',     bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  candidate: { label: 'Candidate',  bg: 'bg-yellow-500/10',  text: 'text-yellow-400' },
  archived:  { label: 'Archived',   bg: 'bg-slate-700',      text: 'text-slate-400'  },
};

function MetricBadge({ label, value, highlight }: { label: string; value?: number | null; highlight?: boolean }) {
  if (value == null) return null;
  const display = value < 1 ? `${(value * 100).toFixed(1)}%` : value.toFixed(1);
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${highlight ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-900/50'}`}>
      <div className={`text-lg font-bold font-mono ${highlight ? 'text-indigo-300' : 'text-slate-200'}`}>{display}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{label}</div>
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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2144' }}>Model Governance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Prediction model versions, metrics, and controlled deployment.
          </p>
        </div>
        {(isAdmin || user?.role === 'CENTRAL_OFFICER') && (
          <button
            onClick={handleStaleCheck}
            disabled={staleLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            <svg className={`w-4 h-4 ${staleLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {staleLoading ? 'Checking…' : 'Run Stale-Data Check'}
          </button>
        )}
      </div>

      {/* Governance notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-amber-800">
          <span className="font-semibold text-amber-700">Model Governance Policy: </span>
          The system does <strong>not</strong> automatically retrain on operational project updates.
          New model versions must be validated externally, registered, and explicitly approved by an Administrator before production use.
          Risk explanations are model-associated contributors — not proven causal effects.
        </div>
      </div>

      {/* Stale check result */}
      {staleResult && (
        <div className={`rounded-xl p-4 border text-sm ${staleResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-gray-700'}`}>
          {staleResult.error ? (
            <p>❌ {staleResult.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold" style={{ color: '#0f2144' }}>Stale-Data Check Complete</p>
              <p>Projects checked: <span style={{ color: '#0f2144' }} className="font-mono">{staleResult.projects_checked}</span></p>
              <p>Stale projects found: <span className="text-orange-600 font-mono">{staleResult.stale_projects}</span></p>
              <p>Notifications created: <span className="text-blue-700 font-mono">{staleResult.notifications_created}</span></p>
              {staleResult.details?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {staleResult.details.map((d: any) => (
                    <p key={d.project_id} className="text-xs text-gray-500">
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
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
          {message}
        </div>
      )}

      {/* Model versions */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.versions?.map((mv: any) => {
            const cfg = STATUS_CONFIG[mv.status] || STATUS_CONFIG.archived;
            const m = mv.metrics || {};
            const isActive = mv.status === 'approved';
            return (
              <div key={mv.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm ${isActive ? 'border-green-400' : 'border-gray-200'}`}
              >
                {/* Version header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold font-mono" style={{ color: '#0f2144' }}>{mv.model_version}</h2>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {isActive && (
                        <span className="text-xs text-green-600 font-semibold">● In Production</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {mv.model_type} · Trained {mv.training_timestamp ? new Date(mv.training_timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    {mv.notes && <p className="text-xs text-gray-400 mt-1">{mv.notes}</p>}
                  </div>
                  {isAdmin && mv.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(mv.model_version)}
                      disabled={approving === mv.model_version}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: approving === mv.model_version ? 0.7 : 1 }}
                    >
                      {approving === mv.model_version ? (
                        <><div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Approving…</>
                      ) : 'Approve for Production'}
                    </button>
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
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>Dataset: <span className="text-gray-600 font-mono">{mv.training_dataset_version || '—'}</span></span>
                  <span>Features: <span className="text-gray-600 font-mono">{mv.feature_schema_version || '—'}</span></span>
                  <span>MAE: <span className="text-gray-600 font-mono">{m.mae_days ? `${m.mae_days.toFixed(1)} days` : '—'}</span></span>
                  {mv.model_path && <span>Path: <span className="text-gray-400 font-mono truncate max-w-xs">{mv.model_path}</span></span>}
                </div>
              </div>
            );
          })}

          {!data?.versions?.length && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No model versions registered.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
