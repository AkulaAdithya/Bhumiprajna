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
import {
  Button, RiskBadge, KPICard, ProgressBar, EmptyState, LoadingSpinner,
  SectionCard, ConfirmDialog, FreshnessIndicator,
} from '../../components/shared';
import type { RiskCategory } from '../../types';

const RISK_META: Record<RiskCategory, { label: string; meaning: string; color: string; bg: string }> = {
  CRITICAL: {
    label: 'Critical Risk',
    meaning: 'Very high probability of significant delay. Immediate intervention required.',
    color: 'var(--risk-critical)', bg: 'var(--risk-critical-bg)',
  },
  HIGH: {
    label: 'High Risk',
    meaning: 'Substantial probability of delay. Prioritise corrective actions this week.',
    color: 'var(--risk-high)', bg: 'var(--risk-high-bg)',
  },
  MEDIUM: {
    label: 'Medium Risk',
    meaning: 'Moderate delay likelihood. Address identified bottlenecks to prevent escalation.',
    color: 'var(--risk-medium)', bg: 'var(--risk-medium-bg)',
  },
  LOW: {
    label: 'Low Risk',
    meaning: 'Project is progressing as expected. Continue monitoring.',
    color: 'var(--risk-low)', bg: 'var(--risk-low-bg)',
  },
};

const DIRECTION_LABELS: Record<string, string> = {
  increases_risk: 'Increasing risk',
  decreases_risk: 'Reducing risk',
};

const REFRESH_ICON = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ADD_ICON = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TRASH_ICON = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

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
    return <LoadingSpinner message="Loading project..." />;
  }

  if (!project) {
    return <EmptyState title="Project not found" />;
  }

  const pred = project.latest_prediction;
  const snap = project.latest_snapshot;
  const risk = (project.risk_category || 'LOW') as RiskCategory;
  const meta = RISK_META[risk];
  const prob = project.delay_probability ?? 0;
  const probPct = Math.round(prob * 100);

  // Data quality score (heuristic: freshness + completeness — NOT model calibration)
  const dataQualityPct = pred?.confidence_score !== undefined ? Math.round(pred.confidence_score * 100) : null;
  const freshnessDay = project.data_freshness_days ?? 0;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <button onClick={() => navigate('/projects')} className="transition-colors" style={{ color: 'inherit' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-600)')} onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}>Projects</button>
        <span>/</span>
        <span className="truncate max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>{project.project_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{project.project_name}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {project.district}, {project.state} · {project.project_type} · {project.land_area} ha · {project.affected_families?.toLocaleString()} families
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Stage: <strong>{project.current_stage}</strong>
            </span>
            {project.next_stage && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→ {project.next_stage}</span>
            )}
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Report date: <strong className="font-mono">{project.snapshot_date}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" icon={REFRESH_ICON} loading={predicting} onClick={handleRePredict}>
            {predicting ? 'Predicting...' : 'Re-Predict'}
          </Button>
          <Button variant="primary" icon={ADD_ICON} onClick={() => navigate(`/projects/${id}/snapshot`)}>
            Update Data
          </Button>
          {isAdmin && (
            <Button variant="danger" icon={TRASH_ICON} onClick={() => setShowRemoveConfirm(true)} title="Admin only: remove this project">
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Admin Remove Confirmation Modal */}
      <ConfirmDialog
        open={showRemoveConfirm}
        title="Remove Project"
        description="Admin action — cannot be undone"
        confirmLabel={removing ? 'Removing…' : 'Remove Project'}
        danger
        loading={removing}
        error={removeError}
        onConfirm={handleRemove}
        onCancel={() => { setShowRemoveConfirm(false); setRemoveError(''); }}
      >
        <p className="text-[13px] mb-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          You are about to remove the following project:
        </p>
        <div className="rounded-lg px-3.5 py-2.5 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>{project?.project_name}</p>
          <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-muted)' }}>{project?.district}, {project?.state}</p>
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
          The project will be marked as cancelled. All historical snapshots, predictions and audit records are preserved.
        </p>
      </ConfirmDialog>

      {predictError && (
        <div className="p-3 rounded text-sm" style={{ background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical)' }}>{predictError}</div>
      )}

      {/* SYSTEM PURPOSE BANNER — SIH26017 alignment */}
      <div className="rounded-lg px-4 py-2 text-xs flex items-center gap-4 flex-wrap" style={{ background: 'var(--color-primary-900)' }}>
        <span className="font-semibold text-white">Bhumi Prajna Early Delay Detection System</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>PREDICT</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>EXPLAIN</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>PRIORITISE</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>INTERVENE</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>LEARN</span>
      </div>

      {/* ── SECTION 1: OVERALL RISK ── */}
      <div className="rounded-r-xl p-5" style={{ borderLeft: `4px solid ${meta.color}`, background: meta.bg }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            {/* Risk label */}
            <div className="flex items-center gap-3 mb-2">
              <RiskBadge risk={risk} size="lg" />
              <span className="text-2xl font-black" style={{ color: meta.color }}>{probPct}% delay probability</span>
            </div>
            <p className="text-sm font-medium" style={{ color: meta.color }}>{meta.meaning}</p>
            {pred?.predicted_delay_days && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Expected delay: <strong>~{Math.round(pred.predicted_delay_days)} days</strong> if current trajectory continues.
              </p>
            )}
          </div>

          {/* Probability dial */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={meta.color}
                strokeWidth="3"
                strokeDasharray={`${probPct} ${100 - probPct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-bold" style={{ color: meta.color }}>{probPct}%</span>
            </div>
          </div>
        </div>

        {/* Data quality row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs flex-wrap" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <span>
            Report date: <strong className="font-mono">{project.snapshot_date}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            Data age: <FreshnessIndicator days={freshnessDay} />
          </span>
          {dataQualityPct !== null && (
            <span title="Data quality score reflects input completeness and freshness — not a statistical confidence interval.">
              Data quality: <strong>{dataQualityPct}%</strong>
              <span className="ml-1 cursor-help" style={{ color: 'var(--color-text-muted)' }}>[?]</span>
            </span>
          )}
        </div>
      </div>

      {/* ── SECTION 2: WHY — SHAP Risk Drivers ── */}
      {pred?.top_factors?.length > 0 && (
        <SectionCard>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Key Delay Factors
            <span className="ml-2 text-xs font-normal normal-case" style={{ color: 'var(--color-text-muted)' }}>(SHAP model explanation — why this risk score)</span>
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>These are the factors with the strongest influence on the predicted delay probability, ranked by impact.</p>
          <div className="space-y-3">
            {pred.top_factors.map((f: any) => {
              const isRisk = f.direction === 'increases_risk';
              const color = isRisk ? 'var(--risk-critical)' : 'var(--risk-low)';
              const bg = isRisk ? 'var(--risk-critical-bg)' : 'var(--risk-low-bg)';
              const border = isRisk ? 'var(--risk-critical-border)' : 'var(--risk-low-border)';
              return (
                <div key={f.feature} className="flex items-center gap-3 p-3 rounded-lg" style={{ border: `1px solid ${border}`, background: bg }}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: border, color }}>
                    {isRisk ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{f.label}</p>
                    <p className="text-xs" style={{ color }}>
                      {DIRECTION_LABELS[f.direction]} · {(f.contribution * 100).toFixed(1)}% impact
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── SECTION 3: WHAT TO DO — Intervention Recommendations ── */}
      {pred?.recommendations?.length > 0 && (
        <SectionCard>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Recommended Interventions
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>Actionable steps based on the top delay factors identified above.</p>
          <div className="space-y-2">
            {pred.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-100)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-accent-600)' }}>{i + 1}</span>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{rec}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── SECTION 4: TABS (Progress / Overview / History) ── */}
      <div>
        <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'var(--color-border)' }}>
          {([
            { key: 'overview', label: 'Project Overview' },
            { key: 'progress', label: 'Current Progress' },
            { key: 'history', label: 'Snapshot History' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
              style={{
                borderColor: activeTab === tab.key ? 'var(--color-accent-600)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-accent-700)' : 'var(--color-text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && snap && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <KPICard title="Land Area" value={`${project.land_area} ha`} />
            <KPICard title="Affected Families" value={project.affected_families?.toLocaleString()} />
            <KPICard title="Current Stage" value={project.current_stage} subtitle={project.next_stage ? `→ ${project.next_stage}` : undefined} />
            <KPICard title="Report Date" value={project.snapshot_date} />
            <KPICard title="Approvals" value={`${snap.approvals_completed}/${snap.approvals_required}`} subtitle={`${snap.approvals_pending} pending`} />
            <KPICard title="Legal Cases" value={`${snap.legal_cases_pending} pending`} subtitle={`${snap.legal_cases_total} total`} />
            <KPICard title="Beneficiaries Paid" value={`${snap.beneficiaries_compensated}/${snap.beneficiaries_eligible}`} subtitle={`₹${snap.compensation_paid_amount?.toFixed(1)}Cr paid`} />
            <KPICard title="Parcels Disputed" value={`${snap.parcels_disputed}/${snap.parcels_total}`} />
          </div>
        )}

        {activeTab === 'progress' && snap && (
          <SectionCard>
            <p className="text-xs mb-4 rounded px-3 py-2" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-100)' }}>
              <strong>Current Completion %</strong> — These show actual on-ground progress for each parameter group. They are <em>not</em> delay probabilities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Approvals', value: snap.approval_progress_pct ?? 0, color: 'bg-[var(--color-accent-600)]',
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
                <div key={item.label}>
                  <ProgressBar label={item.label} value={item.value} color={item.color} />
                  {item.hint && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{item.hint}</p>}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {!project.snapshot_history?.length ? (
              <EmptyState title="No snapshot history" />
            ) : (
              project.snapshot_history.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? 'var(--color-accent-600)' : 'var(--color-border-strong)' }} />
                  <div>
                    <div className="text-sm font-semibold font-mono" style={{ color: 'var(--color-text-primary)' }}>{s.snapshot_date}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.current_stage}</div>
                  </div>
                  {i === 0 && (
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-700)', border: '1px solid var(--color-accent-200)' }}>Latest</span>
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
