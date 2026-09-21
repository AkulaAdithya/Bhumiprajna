/**
 * Bhumi Prajna - Admin User Management Page (M5)
 * CRUD for users. Only ADMIN role can access this page.
 * Backend authorization is always authoritative.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  CENTRAL_OFFICER: 'Central Officer',
  STATE_OFFICER: 'State Officer',
  DISTRICT_OFFICER: 'District Officer',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-purple-700 bg-purple-100',
  CENTRAL_OFFICER: 'text-blue-700 bg-blue-100',
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

const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all";

interface CreateForm {
  email: string; full_name: string; password: string;
  role: string; state: string; district: string;
}

const EMPTY_FORM: CreateForm = {
  email: '', full_name: '', password: '', role: 'DISTRICT_OFFICER', state: '', district: '',
};

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
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold text-gray-600">Access Restricted</h2>
        <p className="text-sm mt-2">Admin panel is only accessible to system administrators.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2144' }}>User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,78,216,0.25)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ {success}
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f2144', margin: 0 }}>Create New User</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Full Name *</label>
                <input required className={inputClass} placeholder="Officer Full Name" value={form.full_name} onChange={set('full_name')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Email *</label>
                <input required type="email" className={inputClass} placeholder="officer@gov.in" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Password *</label>
                <input required type="password" className={inputClass} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} minLength={8} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Role *</label>
                <select required className={inputClass} value={form.role} onChange={set('role')}>
                  <option value="CENTRAL_OFFICER">Central Officer</option>
                  <option value="STATE_OFFICER">State Officer</option>
                  <option value="DISTRICT_OFFICER">District Officer</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              {(form.role === 'STATE_OFFICER' || form.role === 'DISTRICT_OFFICER') && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">State *</label>
                  <select required className={inputClass} value={form.state} onChange={set('state')}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {form.role === 'DISTRICT_OFFICER' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">District *</label>
                  <input required className={inputClass} placeholder="e.g. Pune" value={form.district} onChange={set('district')} />
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ flex: 1, padding: '9px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '9px 0', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {submitting ? <><div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating…</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#374151', background: 'white', outline: 'none', width: 256 }}
        />
        {search && <button onClick={() => setSearch('')} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear</button>}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['User', 'Role', 'Scope', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'white' : '#fafbfc'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {u.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f2144' }}>{u.full_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || 'text-gray-500 bg-gray-100'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                    {u.role === 'DISTRICT_OFFICER' ? `${u.district}, ${u.state}` :
                     u.role === 'STATE_OFFICER' ? u.state :
                     u.role === 'CENTRAL_OFFICER' ? 'All India' : 'System'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: u.is_active ? '#f0fdf4' : '#f8fafc', color: u.is_active ? '#15803d' : '#94a3b8' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: u.is_active ? '#dc2626' : '#15803d', fontWeight: 600 }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span style={{ fontSize: 12, color: '#64748b' }}>Page {page} of {totalPages} · {total} users</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#374151', fontSize: 13 }}>← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#94a3b8' : '#374151', fontSize: 13 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
