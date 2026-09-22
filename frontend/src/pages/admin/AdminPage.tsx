/**
 * Bhumi Prajna - Admin User Management Page (M5)
 * CRUD for users. Only ADMIN role can access this page.
 * Backend authorization is always authoritative.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PageHeader, Button, Modal, EmptyState, LoadingSpinner, Pagination } from '../../components/shared';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  CENTRAL_OFFICER: 'Central Officer',
  STATE_OFFICER: 'State Officer',
  DISTRICT_OFFICER: 'District Officer',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-purple-700 bg-purple-100',
  CENTRAL_OFFICER: 'text-[var(--color-accent-700)] bg-[var(--color-accent-100)]',
  STATE_OFFICER: 'text-indigo-700 bg-indigo-100',
  DISTRICT_OFFICER: 'text-cyan-700 bg-cyan-100',
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
];

interface CreateForm {
  email: string; full_name: string; password: string;
  role: string; state: string; district: string;
}

const EMPTY_FORM: CreateForm = {
  email: '', full_name: '', password: '', role: 'DISTRICT_OFFICER', state: '', district: '',
};

const ADD_ICON = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const LOCK_ICON = <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      const data = await api.listUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const set = (field: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        email: form.email, full_name: form.full_name,
        password: form.password, role: form.role,
      };
      if (form.state) payload.state = form.state;
      if (form.district) payload.district = form.district;
      await api.createUser(payload);
      setSuccess(`User ${form.email} created successfully.`);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create user.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x));
    } catch (e) {
      console.error(e);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={LOCK_ICON}
          title="Access Restricted"
          description="Admin panel is only accessible to system administrators."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="User Management"
        subtitle={`${total} registered user${total !== 1 ? 's' : ''}`}
        action={<Button icon={ADD_ICON} onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>Add User</Button>}
      />

      {/* Success banner */}
      {success && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low)' }}>
          {success}
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} maxWidth={440}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Create New User</h2>
          <button
            onClick={() => setShowCreate(false)}
            className="text-base leading-none"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Full Name *</label>
            <input required className="field-input" placeholder="Officer Full Name" value={form.full_name} onChange={set('full_name')} />
          </div>
          <div>
            <label className="field-label">Email *</label>
            <input required type="email" className="field-input" placeholder="officer@gov.in" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="field-label">Password *</label>
            <input required type="password" className="field-input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} minLength={8} />
          </div>
          <div>
            <label className="field-label">Role *</label>
            <select required className="field-input" value={form.role} onChange={set('role')}>
              <option value="CENTRAL_OFFICER">Central Officer</option>
              <option value="STATE_OFFICER">State Officer</option>
              <option value="DISTRICT_OFFICER">District Officer</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          {(form.role === 'STATE_OFFICER' || form.role === 'DISTRICT_OFFICER') && (
            <div>
              <label className="field-label">State *</label>
              <select required className="field-input" value={form.state} onChange={set('state')}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {form.role === 'DISTRICT_OFFICER' && (
            <div>
              <label className="field-label">District *</label>
              <input required className="field-input" placeholder="e.g. Pune" value={form.district} onChange={set('district')} />
            </div>
          )}
          {error && <p className="text-xs" style={{ color: 'var(--risk-critical)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">{submitting ? 'Creating…' : 'Create User'}</Button>
          </div>
        </form>
      </Modal>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="field-input"
          style={{ width: 256 }}
        />
        {search && <Button type="button" variant="ghost" size="md" onClick={() => setSearch('')}>✕ Clear</Button>}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search, or add a new user." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['User', 'Role', 'Scope', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 32, height: 32, background: 'var(--color-accent-600)', fontSize: 12, fontWeight: 700, color: 'white' }}
                      >
                        {u.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{u.full_name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || 'text-gray-500 bg-gray-100'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {u.role === 'DISTRICT_OFFICER' ? `${u.district}, ${u.state}` :
                     u.role === 'STATE_OFFICER' ? u.state :
                     u.role === 'CENTRAL_OFFICER' ? 'All India' : 'System'}
                  </td>
                  <td>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: u.is_active ? 'var(--risk-low-bg)' : 'var(--color-surface)', color: u.is_active ? 'var(--risk-low)' : 'var(--color-text-muted)' }}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {u.id !== user?.id && (
                      <Button
                        variant={u.is_active ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
