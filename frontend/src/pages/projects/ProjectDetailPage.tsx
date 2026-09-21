/**
 * Bhumi Prajna - Project Detail Page (M3)
 * Full project view: risk dashboard, SHAP explanations, intervention recommendations,
 * parameter group breakdown, snapshot timeline, and re-predict action.
 * 
 * Layout: STATUS → OVERALL RISK → WHY → WHAT TO DO → CURRENT PROGRESS → HISTORY
 * Model version removed from officer UI (tracked internally in DB/audit).
 * "Confidence" relabeled as "Data Quality" (heuristic: freshness + completeness).
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const RISK_CONFIG: Record<string, {
  label: string; meaning: string;
  border: string; bg: string; text: string; badgeBg: string; badgeText: string;
}> = {
  CRITICAL: {
    label: 'Critical Risk',
    meaning: 'Very high probability of significant delay. Immediate intervention required.',
    border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700',
    badgeBg: 'bg-red-100', badgeText: 'text-red-800',
  },
  HIGH: {
    label: 'High Risk',
    meaning: 'Substantial probability of delay. Prioritise corrective actions this week.',
    border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700',
    badgeBg: 'bg-orange-100', badgeText: 'text-orange-800',
  },
  MEDIUM: {
    label: 'Medium Risk',
    meaning: 'Moderate delay likelihood. Address identified bottlenecks to prevent escalation.',
    border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700',
    badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-800',
  },
  LOW: {
    label: 'Low Risk',
    meaning: 'Project is progressing as expected. Continue monitoring.',
    border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700',
    badgeBg: 'bg-green-100', badgeText: 'text-green-800',
  },
};

const DIRECTION_LABELS: Record<string, string> = {
  increases_risk: 'Increasing risk',
  decreases_risk: 'Reducing risk',
};

function ProgressBar({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-mono font-semibold text-gray-800">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'history'>('overview');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getProject(id);
      setProject(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleRePredict = async () => {
    if (!id) return;
    setPredicting(true);
    setPredictError('');
    try {
      await api.predictProject(id);
      await load();
    } catch (e: any) {
      setPredictError(e?.response?.data?.detail || 'Re-prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  const handleRemove = async () => {
    if (!id) return;
    setRemoving(true);
    setRemoveError('');
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (e: any) {
      setRemoveError(e?.response?.data?.detail || 'Failed to remove project.');
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-gray-500 text-center py-20">Project not found.</div>;
  }

  const pred = project.latest_prediction;
  const snap = project.latest_snapshot;
  const risk = project.risk_category || 'LOW';
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.LOW;
  const prob = project.delay_probability ?? 0;
  const probPct = Math.round(prob * 100);

  // Data quality score (heuristic: freshness + completeness — NOT model calibration)
  const dataQualityPct = pred?.confidence_score !== undefined ? Math.round(pred.confidence_score * 100) : null;
  const freshnessDay = project.data_freshness_days ?? 0;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/projects')} className="hover:text-blue-700 transition-colors">Projects</button>
        <span>/</span>
        <span className="text-gray-800 truncate max-w-xs">{project.project_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{project.project_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {project.district}, {project.state} · {project.project_type} · {project.land_area} ha · {project.affected_families?.toLocaleString()} families
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
              Stage: <strong>{project.current_stage}</strong>
            </span>
            {project.next_stage && (
              <span className="text-xs text-gray-400">→ {project.next_stage}</span>
            )}
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
              Report date: <strong className="font-mono">{project.snapshot_date}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRePredict}
            disabled={predicting}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded border border-gray-300 transition-colors disabled:opacity-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${predicting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {predicting ? 'Predicting...' : 'Re-Predict'}
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/snapshot`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Update Data
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold rounded border border-red-200 hover:border-red-400 transition-colors shadow-sm"
              title="Admin only: remove this project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Admin Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 20, height: 20, color: '#dc2626' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Remove Project</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Admin action — cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>You are about to remove the following project:</p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{project?.project_name}</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{project?.district}, {project?.state}</p>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>The project will be marked as cancelled. All historical snapshots, predictions and audit records are preserved.</p>
            {removeError && <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>{removeError}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowRemoveConfirm(false); setRemoveError(''); }} style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleRemove} disabled={removing} style={{ padding: '8px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: removing ? 0.7 : 1 }}>
                {removing ? 'Removing…' : 'Remove Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {predictError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">{predictError}</div>
      )}

      {/* SYSTEM PURPOSE BANNER — SIH26017 alignment */}
      <div className="bg-blue-900 text-blue-100 rounded-lg px-4 py-2 text-xs flex items-center gap-4 flex-wrap">
        <span className="font-semibold text-white">Bhumi Prajna Early Delay Detection System</span>
        <span className="text-blue-300">PREDICT</span>
        <span className="text-blue-500">→</span>
        <span className="text-blue-300">EXPLAIN</span>
        <span className="text-blue-500">→</span>
        <span className="text-blue-300">PRIORITISE</span>
        <span className="text-blue-500">→</span>
        <span className="text-blue-300">INTERVENE</span>
        <span className="text-blue-500">→</span>
        <span className="text-blue-300">LEARN</span>
      </div>

      {/* ── SECTION 1: OVERALL RISK ── */}
      <div className={`border-l-4 ${cfg.border} ${cfg.bg} rounded-r-xl p-5`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            {/* Risk label */}
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                {cfg.label}
              </span>
              <span className={`text-2xl font-black ${cfg.text}`}>{probPct}% delay probability</span>
            </div>
            <p className={`text-sm ${cfg.text} font-medium`}>{cfg.meaning}</p>
            {pred?.predicted_delay_days && (
              <p className="text-sm text-gray-600 mt-1">
                Expected delay: <strong>~{Math.round(pred.predicted_delay_days)} days</strong> if current trajectory continues.
              </p>
            )}
          </div>

          {/* Probability dial */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={risk === 'CRITICAL' ? '#ef4444' : risk === 'HIGH' ? '#f97316' : risk === 'MEDIUM' ? '#eab308' : '#22c55e'}
                strokeWidth="3"
                strokeDasharray={`${probPct} ${100 - probPct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-base font-bold ${cfg.text}`}>{probPct}%</span>
            </div>
          </div>
        </div>

        {/* Data quality row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 flex-wrap">
          <span>
            Report date: <strong className="font-mono">{project.snapshot_date}</strong>
          </span>
          <span>
            Data age: <strong className={freshnessDay > 60 ? 'text-red-600' : freshnessDay > 30 ? 'text-orange-600' : 'text-gray-800'}>{freshnessDay} days</strong>
            {freshnessDay > 30 && <span className="ml-1 text-amber-700">(stale — update recommended)</span>}
          </span>
          {dataQualityPct !== null && (
            <span title="Data quality score reflects input completeness and freshness — not a statistical confidence interval.">
              Data quality: <strong>{dataQualityPct}%</strong>
              <span className="ml-1 text-gray-400 cursor-help">[?]</span>
            </span>
          )}
        </div>
      </div>

      {/* ── SECTION 2: WHY — SHAP Risk Drivers ── */}
      {pred?.top_factors?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
            Key Delay Factors
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">(SHAP model explanation — why this risk score)</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">These are the factors with the strongest influence on the predicted delay probability, ranked by impact.</p>
          <div className="space-y-3">
            {pred.top_factors.map((f: any) => {
              const isRisk = f.direction === 'increases_risk';
              return (
                <div key={f.feature} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isRisk ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isRisk ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {isRisk ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{f.label}</p>
                    <p className={`text-xs ${isRisk ? 'text-red-600' : 'text-green-600'}`}>
                      {DIRECTION_LABELS[f.direction]} · {(f.contribution * 100).toFixed(1)}% impact
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 3: WHAT TO DO — Intervention Recommendations ── */}
      {pred?.recommendations?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
            Recommended Interventions
          </h2>
          <p className="text-xs text-gray-500 mb-4">Actionable steps based on the top delay factors identified above.</p>
          <div className="space-y-2">
            {pred.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-sm text-gray-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: TABS (Progress / Overview / History) ── */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {([
            { key: 'overview', label: 'Project Overview' },
            { key: 'progress', label: 'Current Progress' },
            { key: 'history', label: 'Snapshot History' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-700 text-blue-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && snap && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="Land Area" value={`${project.land_area} ha`} />
            <StatCard label="Affected Families" value={project.affected_families?.toLocaleString()} />
            <StatCard label="Current Stage" value={project.current_stage} sub={project.next_stage ? `→ ${project.next_stage}` : undefined} />
            <StatCard label="Report Date" value={project.snapshot_date} />
            <StatCard label="Approvals" value={`${snap.approvals_completed}/${snap.approvals_required}`} sub={`${snap.approvals_pending} pending`} />
            <StatCard label="Legal Cases" value={`${snap.legal_cases_pending} pending`} sub={`${snap.legal_cases_total} total`} />
            <StatCard label="Beneficiaries Paid" value={`${snap.beneficiaries_compensated}/${snap.beneficiaries_eligible}`} sub={`₹${snap.compensation_paid_amount?.toFixed(1)}Cr paid`} />
            <StatCard label="Parcels Disputed" value={`${snap.parcels_disputed}/${snap.parcels_total}`} />
          </div>
        )}

        {activeTab === 'progress' && snap && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 border border-blue-100 rounded px-3 py-2">
              <strong>Current Completion %</strong> — These show actual on-ground progress for each parameter group. They are <em>not</em> delay probabilities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Approvals', value: snap.approval_progress_pct ?? 0, color: 'bg-blue-600',
                  hint: `${snap.approvals_completed} of ${snap.approvals_required} completed` },
                { label: 'Compensation Disbursed', value: snap.compensation_progress_pct ?? 0, color: 'bg-purple-600',
                  hint: `${snap.beneficiaries_compensated} of ${snap.beneficiaries_eligible} beneficiaries` },
                { label: 'Documentation Verified', value: snap.documentation_progress_pct ?? 0, color: 'bg-cyan-600',
                  hint: `${snap.documents_verified} of ${snap.documents_required} docs` },
                { label: 'Statutory Notifications', value: snap.notification_progress_pct ?? 0, color: 'bg-teal-600',
                  hint: `${snap.notifications_issued} of ${snap.notifications_required} issued` },
                { label: 'R&R Completed', value: snap.rr_progress_pct ?? 0, color: 'bg-indigo-600',
                  hint: `${snap.rr_families_completed} of ${snap.rr_families_required} families` },
                { label: 'Land Possession', value: snap.possession_progress_pct ?? 0, color: 'bg-green-600',
                  hint: `${snap.land_acquired_for_possession} of ${snap.land_required_for_possession} ha acquired` },
              ].map(item => (
                <ProgressBar key={item.label} label={item.label} value={item.value} color={item.color} hint={item.hint} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {!project.snapshot_history?.length ? (
              <p className="text-gray-500 text-sm">No snapshot history.</p>
            ) : (
              project.snapshot_history.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 font-mono">{s.snapshot_date}</div>
                    <div className="text-xs text-gray-500">{s.current_stage}</div>
                  </div>
                  {i === 0 && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium border border-blue-200">Latest</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
