/**
 * Pravaah - Projects List Page (M3)
 * Light government portal theme. White cards, dark navy headings, blue accents.
 * Filterable, paginated table of all projects with risk badges.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const RISK_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  CRITICAL: { label: 'Critical', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  HIGH:     { label: 'High',     bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  MEDIUM:   { label: 'Medium',   bg: '#fefce8', text: '#a16207', dot: '#eab308' },
  LOW:      { label: 'Low',      bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  HIGHWAY: 'Highway', RAILWAY: 'Railway', IRRIGATION: 'Irrigation',
  POWER: 'Power', URBAN: 'Urban Dev', INDUSTRIAL: 'Industrial',
  AIRPORT: 'Airport', PORT: 'Port', PIPELINE: 'Pipeline', OTHER: 'Other',
};

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, color: '#374151', background: 'white', outline: 'none',
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const pageSize = 15;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (riskFilter) params.risk_category = riskFilter;
      const data = await api.getProjects(params);
      setProjects(data.projects);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, riskFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(1);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setDeleteError('');
    try {
      await api.deleteProject(confirmDelete.id);
      setConfirmDelete(null);
      fetchProjects();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.detail || 'Failed to remove project.');
    } finally {
      setDeletingId(null);
    }
  };

  const riskBadge = (risk: string | null) => {
    if (!risk) return <span style={{ fontSize: 11, color: '#94a3b8' }}>No prediction</span>;
    const meta = RISK_META[risk] || RISK_META.LOW;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.text }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
        {meta.label}
      </span>
    );
  };

  const probBar = (prob: number | null) => {
    if (prob === null || prob === undefined) return <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>;
    const pct = Math.round(prob * 100);
    const color = pct >= 75 ? '#ef4444' : pct >= 50 ? '#f97316' : pct >= 25 ? '#eab308' : '#22c55e';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 60, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', fontWeight: 600 }}>{pct}%</span>
      </div>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f2144', margin: 0 }}>Existing Projects</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{total} project{total !== 1 ? 's' : ''} in your scope</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,78,216,0.25)' }}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" placeholder="Search projects..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, width: 220 }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = '#93c5fd'}
              onBlur={e => (e.target as HTMLElement).style.borderColor = '#e2e8f0'}
            />
          </div>
          <button type="submit" style={{ ...inputStyle, cursor: 'pointer', background: '#f8fafc', fontWeight: 600 }}>Search</button>
          {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear</button>}
        </form>
        <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">All Risks</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
            <div style={{ width: 28, height: 28, border: '3px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : projects.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 8, color: '#94a3b8' }}>
            <svg style={{ width: 40, height: 40, opacity: 0.4 }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No projects found</p>
            <button onClick={() => navigate('/projects/new')} style={{ marginTop: 8, fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first project →</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Project Name', 'Location', 'Type', 'Stage', 'Risk', 'Delay Prob.', 'Snapshot', ...(isAdmin ? [''] : [])].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'white' : '#fafbfc'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f2144', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.affected_families?.toLocaleString()} families · {p.land_area} ha</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#374151' }}>{p.district}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.state}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{PROJECT_TYPE_LABELS[p.project_type] || p.project_type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: '#374151', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.current_stage}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{riskBadge(p.risk_category)}</td>
                  <td style={{ padding: '12px 16px' }}>{probBar(p.delay_probability)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.snapshot_date}</td>
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmDelete({ id: p.id, name: p.project_name })}
                        style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                        title="Remove project (Admin only)"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#64748b' }}>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#374151' }}>← Prev</button>
            <span style={{ padding: '6px 12px', color: '#64748b' }}>Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#94a3b8' : '#374151' }}>Next →</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 20, height: 20, color: '#dc2626' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2144', margin: 0 }}>Remove Project</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>This action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
              You are about to remove the following project:
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f2144', margin: 0 }}>{confirmDelete.name}</p>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              The project will be marked as cancelled. All historical snapshots, predictions and audit records are preserved.
            </p>
            {deleteError && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 6 }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setConfirmDelete(null); setDeleteError(''); }} style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
                style={{ padding: '8px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deletingId ? 0.7 : 1 }}
              >
                {deletingId ? 'Removing…' : 'Remove Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
