'use client';

import React, { useEffect, useState } from 'react';
import { CrmShell, useCrmToast } from '@/component/layout/crm-shell';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AHASS';
  active: boolean;
  createdAt: string;
};

export function AdminView() {
  const { showToast } = useCrmToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [me, setMe] = useState<{ name: string; email: string; role: 'ADMIN' | 'AHASS' } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AHASS' as 'ADMIN' | 'AHASS' });
  const [passwordForm, setPasswordForm] = useState({ password: '' });
  const [resettingData, setResettingData] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Gagal memuat pengguna.');
      }
      setUsers(result.users || []);
    } catch (loadError) {
      setError((loadError as Error).message || 'Gagal memuat daftar akun.');
    }
  };

  const refreshMe = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Gagal memuat profil Anda.');
      }
      setMe(result.user);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([refreshMe(), refreshUsers()]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Gagal menambahkan akun.');
      }

      setForm({ name: '', email: '', password: '', role: 'AHASS' });
      setNotice('Akun baru berhasil dibuat.');
      await refreshUsers();
    } catch (submitError) {
      setError((submitError as Error).message || 'Gagal menambahkan akun.');
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/admin/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Gagal mengubah password.');
      }

      setPasswordForm({ password: '' });
      setNotice('Password berhasil diubah.');
    } catch (submitError) {
      setError((submitError as Error).message || 'Gagal mengubah password.');
    }
  };

  const handleResetLocalData = async () => {
    if (process.env.NODE_ENV !== 'development') {
      showToast('error', 'Reset data hanya tersedia di local development.');
      return;
    }

    if (resetConfirmation !== 'HAPUS DATA LOCAL') {
      showToast('warning', 'Reset dibatalkan karena teks konfirmasi tidak sesuai.');
      return;
    }

    setResettingData(true);
    try {
      const response = await fetch('/api/admin/reset-data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Reset data gagal.');
      }

      showToast('success', result.message);
      setResetDialogOpen(false);
      setResetConfirmation('');
    } catch (resetError) {
      showToast('error', (resetError as Error).message || 'Reset data gagal.');
    } finally {
      setResettingData(false);
    }
  };

  return (
    <CrmShell title="Admin Field" crumb="Admin & Follow-up">
      <div className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Admin Field</h2>
          <p>Kelola akun pengguna, tetapkan role, dan ubah password akun aktif.</p>
        </div>

        {notice && <div className="alert success">{notice}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="card" style={{ marginBottom: '16px' }}>
          <h3><i className="fas fa-user-shield" aria-hidden="true" /> Profil Aktif</h3>
          {me ? (
            <div style={{ display: 'grid', gap: '6px' }}>
              <div><strong>Nama:</strong> {me.name}</div>
              <div><strong>Email:</strong> {me.email}</div>
              <div><strong>Role:</strong> {me.role}</div>
            </div>
          ) : (
            <div className="kpi-hint">Memuat profil...</div>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="card" style={{ marginBottom: '16px', border: '1px solid #FCA5A5' }}>
            <h3><i className="fas fa-database" aria-hidden="true" /> Reset Data Local</h3>
            <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>
              Menghapus seluruh data bisnis hasil upload secara permanen. Akun pengguna dan admin tidak dihapus.
            </p>
            <button type="button" className="btn-submit" style={{ background: '#991B1B' }} onClick={() => setResetDialogOpen(true)} disabled={resettingData}>
              <i className="fas fa-trash" aria-hidden="true" /> {resettingData ? 'Menghapus...' : 'Hapus Data Bisnis Local'}
            </button>
          </div>
        )}

        {resetDialogOpen && (
          <div className="modal-overlay show" role="dialog" aria-modal="true" aria-labelledby="reset-data-title">
            <div className="modal-box">
              <h2 id="reset-data-title">Konfirmasi Reset Data</h2>
              <p style={{ marginBottom: '16px', lineHeight: 1.5 }}>
                Semua data bisnis hasil upload akan dihapus permanen. Akun user dan admin tetap dipertahankan.
              </p>
              <div className="form-group">
                <label htmlFor="reset-confirmation">Ketik HAPUS DATA LOCAL</label>
                <input
                  id="reset-confirmation"
                  value={resetConfirmation}
                  onChange={(event) => setResetConfirmation(event.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-reset" onClick={() => { setResetDialogOpen(false); setResetConfirmation(''); }} disabled={resettingData}>
                  Batal
                </button>
                <button type="button" className="btn-submit" style={{ background: '#991B1B' }} onClick={handleResetLocalData} disabled={resettingData || resetConfirmation !== 'HAPUS DATA LOCAL'}>
                  {resettingData ? 'Menghapus...' : 'Konfirmasi Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: '16px' }}>
          <h3><i className="fas fa-user-plus" aria-hidden="true" /> Buat Akun Baru</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="user-name">Nama</label>
              <input id="user-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="user-email">Email</label>
              <input id="user-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="user-password">Password</label>
              <input id="user-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required minLength={6} />
            </div>
            <div className="form-group">
              <label htmlFor="user-role">Role</label>
              <select id="user-role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'ADMIN' | 'AHASS' }))}>
                <option value="AHASS">AHASS</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>Simpan Akun</button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <h3><i className="fas fa-key" aria-hidden="true" /> Ubah Password Akun Saya</h3>
          <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="my-password">Password Baru</label>
              <input id="my-password" type="password" value={passwordForm.password} onChange={(event) => setPasswordForm({ password: event.target.value })} minLength={6} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">Update Password</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3><i className="fas fa-users" aria-hidden="true" /> Daftar Akun</h3>
          {loading ? (
            <div className="kpi-hint">Memuat daftar akun...</div>
          ) : users.length === 0 ? (
            <div className="kpi-hint">Belum ada akun yang dibuat.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.active ? 'Aktif' : 'Nonaktif'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CrmShell>
  );
}
