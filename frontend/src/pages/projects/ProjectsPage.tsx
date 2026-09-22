/**
 * Bhumi Prajna - Projects List Page (M3)
 * Light government portal theme. White cards, dark navy headings, blue accents.
 * Filterable, paginated table of all projects with risk badges.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PageHeader, Button, RiskBadge, ProgressBar, EmptyState, Pagination, ConfirmDialog } from '../../components/shared';
import type { RiskCategory } from '../../types';

const PROJECT_TYPE_LABELS: Record<string, string> = {
  HIGHWAY: 'Highway', RAILWAY: 'Railway', IRRIGATION: 'Irrigation',
  POWER: 'Power', URBAN: 'Urban Dev', INDUSTRIAL: 'Industrial',
  AIRPORT: 'Airport', PORT: 'Port', PIPELINE: 'Pipeline', OTHER: 'Other',
};

const ADD_ICON = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SEARCH_ICON = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const EMPTY_ICON = <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || '');
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

  const handleRiskChange = (value: string) => {
    setRiskFilter(value);
    setPage(1);
    setSearchParams(value ? { risk: value } : {}, { replace: true });
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="Existing Projects"
        subtitle={`${total} project${total !== 1 ? 's' : ''} in your scope`}
        action={<Button icon={ADD_ICON} onClick={() => navigate('/projects/new')}>Add Project</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>{SEARCH_ICON}</span>
            <input
              type="text" placeholder="Search projects..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="field-input"
              style={{ paddingLeft: 30, width: 220 }}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">Search</Button>
          {search && <Button type="button" variant="ghost" size="md" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>✕ Clear</Button>}
        </form>
        <select
          value={riskFilter}
          onChange={e => handleRiskChange(e.target.value)}
          className="field-input"
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="">All Risks</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 180 }}>
            <div className="w-7 h-7 rounded-full animate-spin" style={{ border: '3px solid var(--color-accent-600)', borderTopColor: 'transparent' }} />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={EMPTY_ICON}
            title="No projects found"
            action={<button onClick={() => navigate('/projects/new')} className="text-xs font-semibold" style={{ color: 'var(--color-accent-600)' }}>Add your first project →</button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Project Name', 'Location', 'Type', 'Stage', 'Risk', 'Delay Prob.', 'Snapshot', ...(isAdmin ? [''] : [])].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="cursor-pointer">
                  <td>
                    <div className="font-semibold truncate" style={{ color: 'var(--color-text-primary)', maxWidth: 280 }}>{p.project_name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{p.affected_families?.toLocaleString()} families · {p.land_area} ha</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-secondary)' }}>{p.district}</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{p.state}</div>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{PROJECT_TYPE_LABELS[p.project_type] || p.project_type}</td>
                  <td>
                    <div className="text-[11px] truncate" style={{ color: 'var(--color-text-secondary)', maxWidth: 140 }}>{p.current_stage}</div>
                  </td>
                  <td>{p.risk_category ? <RiskBadge risk={p.risk_category as RiskCategory} size="sm" /> : <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>No prediction</span>}</td>
                  <td style={{ minWidth: 120 }}>{p.delay_probability != null ? <ProgressBar value={Math.round(p.delay_probability * 100)} label="" size="sm" /> : <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                  <td className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.snapshot_date}</td>
                  {isAdmin && (
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmDelete({ id: p.id, name: p.project_name })}
                        className="btn btn-danger btn-sm"
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

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove Project"
        description="This action cannot be undone"
        confirmLabel={deletingId ? 'Removing…' : 'Remove Project'}
        danger
        loading={!!deletingId}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(''); }}
      >
        <p className="text-[13px] mb-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          You are about to remove the following project:
        </p>
        <div className="rounded-lg px-3.5 py-2.5 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>{confirmDelete?.name}</p>
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
          The project will be marked as cancelled. All historical snapshots, predictions and audit records are preserved.
        </p>
      </ConfirmDialog>
    </div>
  );
}
