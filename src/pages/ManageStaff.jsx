import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { ROLES, ROLE_LABELS, STAFF_DOMAIN } from '../constants';
import { subscribeStaff, setUserDisabled, createStaffAccount } from '../services/users';
import Title from '../components/Title';
import Empty from '../components/Empty';
import Modal from '../components/Modal';

const EMPTY = { name: '', staffCode: '', role: ROLES.STAFF, phone: '', emailPrefix: '' };

const ERRORS = {
  'auth/email-already-in-use': 'Email ini sudah dipakai akun lain.',
  'auth/invalid-email': 'Format email tidak valid.',
};

export default function ManageStaff() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeStaff(setStaff, (err) => console.error('Gagal memuat staff:', err)), []);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const email = form.emailPrefix + STAFF_DOMAIN;
    try {
      await createStaffAccount({ ...form, email });
      alert(`Akun ${form.name} dibuat. Link untuk membuat password sudah dikirim ke ${email}.`);
      setForm(EMPTY);
      setAdding(false);
    } catch (err) {
      setError(ERRORS[err.code] || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisabled(member) {
    const action = member.disabled ? 'mengaktifkan kembali' : 'menonaktifkan';
    if (!confirm(`Yakin ingin ${action} akun ${member.name}?`)) return;
    try {
      await setUserDisabled(member.id, !member.disabled);
    } catch (err) {
      alert('Gagal memperbarui akun: ' + err.message);
    }
  }

  const sorted = [...staff].sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));

  return (
    <>
      <Title title="Kelola Staff" desc="Buat dan kelola akun staff serta head admin UKESMAS." />
      <div className="panel">
        <div className="panelhead">
          <h3>Akun staff & admin ({staff.length})</h3>
          <button className="primary small" onClick={() => setAdding(true)}>
            <UserPlus size={14} /> Tambah akun
          </button>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kode staff</th>
                <th>Role</th>
                <th>No. WA</th>
                <th>Email</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((x) => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{x.staffCode || '-'}</td>
                  <td>
                    <span className={'role-badge ' + x.role}>{ROLE_LABELS[x.role]}</span>
                  </td>
                  <td>{x.phone || '-'}</td>
                  <td>{x.email}</td>
                  <td>
                    <span className={'status ' + (x.disabled ? 'ditolak' : '')}>
                      {x.disabled ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </td>
                  <td>
                    {x.id !== profile.id && (
                      <button className={x.disabled ? 'textbutton' : 'delete'} onClick={() => toggleDisabled(x)}>
                        {x.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!staff.length && <Empty>Belum ada akun staff.</Empty>}
        </div>
      </div>

      {adding && (
        <Modal title="Tambah akun staff" close={() => setAdding(false)}>
          {error && <div className="auth-error">{error}</div>}
          <form className="form" onSubmit={handleCreate}>
            <label>
              Nama lengkap
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </label>
            <label>
              NIM / Kode staff
              <input required value={form.staffCode} onChange={(e) => set('staffCode', e.target.value)} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value={ROLES.STAFF}>{ROLE_LABELS.staff}</option>
                <option value={ROLES.ADMIN}>{ROLE_LABELS.admin}</option>
              </select>
            </label>
            <label>
              No. WhatsApp
              <input
                required
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="08..."
              />
            </label>
            <label>
              Email
              <div className="email-input">
                <input
                  required
                  value={form.emailPrefix}
                  onChange={(e) => set('emailPrefix', e.target.value.replace(/@.*$/, '').replace(/[^a-zA-Z0-9._-]/g, ''))}
                  placeholder="nama"
                />
                <span className="email-domain">{STAFF_DOMAIN}</span>
              </div>
            </label>
            <small className="privacy">
              Password tidak perlu diisi. Staff akan menerima email untuk membuat password sendiri.
            </small>
            <button className="primary" disabled={saving}>
              {saving ? 'Membuat akun...' : 'Buat akun'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
