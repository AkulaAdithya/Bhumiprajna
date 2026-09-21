/**
 * Bhumi Prajna - Dashboard Page (M3 — Live Data)
 * Light government portal theme matching dashboard-reference.png.
 * White KPI cards with colored icon squares, dark navy headings.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const RISK_META: Record<string, { label: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; dotColor: string }> = {
  CRITICAL: { label: 'Critical',  iconBg: '#fee2e2', iconColor: '#dc2626', badgeBg: '#fef2f2', badgeText: '#b91c1c', dotColor: '#ef4444' },
  HIGH:     { label: 'High',      iconBg: '#ffedd5', iconColor: '#ea580c', badgeBg: '#fff7ed', badgeText: '#c2410c', dotColor: '#f97316' },
  MEDIUM:   { label: 'Medium',    iconBg: '#fef9c3', iconColor: '#ca8a04', badgeBg: '#fefce8', badgeText: '#a16207', dotColor: '#eab308' },
  LOW:      { label: 'Low',       iconBg: '#dcfce7', iconColor: '#16a34a', badgeBg: '#f0fdf4', badgeText: '#15803d', dotColor: '#22c55e' },
};

function KPICard({ label, value, sub, iconBg, iconColor, icon }: {
  label: string; value: number | string; sub?: string;
  iconBg: string; iconColor: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 30, fontWeight: 800, color: '#0f2144', margin: '2px 0 0', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scopeLabel = () => {
    const labels: Record<string, string> = {
      ADMIN: 'All India View', CENTRAL_OFFICER: 'All India View',
      STATE_OFFICER: `${user?.state} View`,
      DISTRICT_OFFICER: `${user?.district}, ${user?.state}`,
    };
    return labels[user?.role || ''] || '';
  };

  const KPI_DEFS = [
    {
      label: 'Total Ongoing Projects', value: stats?.total_ongoing ?? 0, sub: 'Across your scope',
      iconBg: '#dbeafe', iconColor: '#1d4ed8',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>,
    },
    {
      label: 'Critical Risk', value: stats?.critical_count ?? 0, sub: 'Immediate action needed',
      iconBg: '#fee2e2', iconColor: '#dc2626',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
    },
    {
      label: 'High Risk', value: stats?.high_count ?? 0, sub: 'Requires close monitoring',
      iconBg: '#ffedd5', iconColor: '#ea580c',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
    },
    {
      label: 'Medium Risk', value: stats?.medium_count ?? 0, sub: 'Monitor regularly',
      iconBg: '#fef9c3', iconColor: '#ca8a04',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
    },
    {
      label: 'Low Risk', value: stats?.low_count ?? 0, sub: 'On track',
      iconBg: '#dcfce7', iconColor: '#16a34a',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f2144', margin: 0 }}>Decision Support Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Predictive Intelligence for Faster, Fairer and Transparent Land Acquisition
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right', display: 'none' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{scopeLabel()}</div>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: '#1d4ed8', color: 'white',
              fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(29,78,216,0.25)',
            }}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Project
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 96, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {KPI_DEFS.map(k => (
            <KPICard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* High-Risk Projects table */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 16, height: 16, color: '#ea580c' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f2144', margin: 0 }}>High-Risk Projects</h2>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Projects requiring immediate attention</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ height: 48, background: '#f8fafc', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : !stats?.high_risk_projects?.length ? (
          <div style={{ padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
            <svg style={{ width: 36, height: 36, opacity: 0.4 }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No high-risk projects</p>
            <p style={{ fontSize: 12, margin: 0 }}>All projects are on track, or no projects added yet.</p>
            <button onClick={() => navigate('/projects/new')} style={{ marginTop: 8, fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first project →</button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 0, padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              {['Project Name', 'Location', 'Predicted Delay', 'Risk Level', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px' }}>{h}</div>
              ))}
            </div>
            {stats.high_risk_projects.map((p: any, i: number) => {
              const meta = RISK_META[p.risk_category] || RISK_META.HIGH;
              const pct = Math.round((p.delay_probability ?? 0) * 100);
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
                    alignItems: 'center', padding: '12px 20px',
                    borderBottom: i < stats.high_risk_projects.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <div style={{ padding: '0 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2144' }}>{p.project_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.current_stage}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', padding: '0 16px' }}>{p.district}, {p.state}</div>
                  <div style={{ padding: '0 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{pct}%</div>
                    <div style={{ width: 80, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? '#ef4444' : pct >= 50 ? '#f97316' : '#eab308', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ padding: '0 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: meta.badgeBg, color: meta.badgeText }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'View All Projects', desc: 'Browse and filter', path: '/projects',
            icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> },
          { label: 'Add New Project', desc: 'Enter project data', path: '/projects/new',
            icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
          { label: 'GIS Map', desc: 'Geographic view', path: '/gis',
            icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg> },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', background: 'white', borderRadius: 10,
              border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(29,78,216,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2144' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
