/**
 * Bhumi Prajna - Dashboard Page (M3 — Live Data)
 * Light government portal theme. White KPI cards with colored icon squares.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader, Button, KPICard, RiskBadge, ProgressBar, EmptyState, SectionCard } from '../../components/shared';
import type { RiskCategory } from '../../types';

const ICONS = {
  projects: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>,
  critical: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
  high: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
  medium: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
  low: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  add: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  map: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>,
  folder: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>,
  view: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const KPI_DEFS = [
    { label: 'Total Ongoing Projects', value: stats?.total_ongoing ?? 0, sub: 'Across your scope', variant: 'default' as const, icon: ICONS.projects },
    { label: 'Critical Risk', value: stats?.critical_count ?? 0, sub: 'Immediate action needed', variant: 'critical' as const, icon: ICONS.critical },
    { label: 'High Risk', value: stats?.high_count ?? 0, sub: 'Requires close monitoring', variant: 'high' as const, icon: ICONS.high },
    { label: 'Medium Risk', value: stats?.medium_count ?? 0, sub: 'Monitor regularly', variant: 'medium' as const, icon: ICONS.medium },
    { label: 'Low Risk', value: stats?.low_count ?? 0, sub: 'On track', variant: 'low' as const, icon: ICONS.low },
  ];

  const quickNav = [
    { label: 'View All Projects', desc: 'Browse and filter', path: '/projects', icon: ICONS.folder },
    { label: 'Add New Project', desc: 'Enter project data', path: '/projects/new', icon: ICONS.add },
    { label: 'GIS Map', desc: 'Geographic view', path: '/gis', icon: ICONS.map },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Decision Support Dashboard"
        subtitle="Predictive Intelligence for Faster, Fairer and Transparent Land Acquisition"
        action={<Button icon={ICONS.add} onClick={() => navigate('/projects/new')}>Add Project</Button>}
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-[10px] border animate-pulse" style={{ borderColor: 'var(--color-border)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {KPI_DEFS.map(k => (
            <KPICard key={k.label} title={k.label} value={k.value} subtitle={k.sub} variant={k.variant} icon={k.icon} onClick={k.variant !== 'default' ? () => navigate(`/projects?risk=${k.variant.toUpperCase()}`) : undefined} />
          ))}
        </div>
      )}

      {/* High-Risk Projects table */}
      <SectionCard
        noPadding
        title="High-Risk Projects"
        subtitle="Projects requiring immediate attention"
        action={<button onClick={() => navigate('/projects')} className="text-xs font-semibold" style={{ color: 'var(--color-accent-600)' }}>View all →</button>}
      >
        {loading ? (
          <div className="p-5 flex flex-col gap-2.5">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-md animate-pulse" style={{ background: 'var(--color-surface)' }} />)}
          </div>
        ) : !stats?.high_risk_projects?.length ? (
          <EmptyState
            icon={ICONS.low}
            title="No high-risk projects"
            description="All projects are on track, or no projects added yet."
            action={<button onClick={() => navigate('/projects/new')} className="text-xs font-semibold" style={{ color: 'var(--color-accent-600)' }}>Add your first project →</button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Project Name', 'Location', 'Predicted Delay', 'Risk Level', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {stats.high_risk_projects.map((p: any) => {
                const pct = Math.round((p.delay_probability ?? 0) * 100);
                return (
                  <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="cursor-pointer">
                    <td>
                      <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{p.project_name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{p.current_stage}</div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{p.district}, {p.state}</td>
                    <td style={{ minWidth: 140 }}>
                      <ProgressBar value={pct} label="" size="sm" />
                    </td>
                    <td><RiskBadge risk={p.risk_category as RiskCategory} size="sm" /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: 'var(--color-accent-600)' }}
                      >
                        {ICONS.view} View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-4">
        {quickNav.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-[10px] border text-left card-hover"
            style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-50)', color: 'var(--color-accent-600)' }}>
              {item.icon}
            </div>
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
