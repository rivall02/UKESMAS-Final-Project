import { useState, useEffect } from 'react';
import { UserPlus, Pencil, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { ROLES, ROLE_LABELS, STAFF_DOMAIN } from '../constants';
import {
  subscribeStaff,
  setUserDisabled,
  createStaffAccount,
  updateStaffAccount,
  sendStaffPasswordReset,
} from '../services/users';
import Title from '../components/Title';
import Empty from '../components/Empty';
import Modal from '../components/Modal';

const EMPTY = { name: '', staffCode: '', role: ROLES.STAFF, phone: '', emailPrefix: '', password: '', confirm: '' };

const ERRORS = {
  'auth/email-already-in-use': 'Email ini sudah dipakai akun lain.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Password minimal 6 karakter.',
};

const cleanPrefix = (v) => v.replace(/@.*$/, '').replace(/[^a-zA-Z0-9._-]/g, '');
const cleanPhone = (v) => v.replace(/[^\d+]/g, '');

export default function ManageStaff() {
  const { profile, refreshProfile } = useAuth();
  const [staff, setStaff] = useState([]);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeStaff(setStaff, (err) => console.error('Gagal memuat staff:', err)), []);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const isSelf = editing?.id === profile.id;

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setError('');
    setShowPassword(false);
    setMode('create');
  }

  function openEdit(member) {
    setForm({
      ...EMPTY,
      name: member.name || '',
      staffCode: member.staffCode || '',
      role: member.role,
      phone: member.phone || '',
    });
    setEditing(member);
    setError('');
    setMode('edit');
  }

  function close() {
    setMode(null);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'create' && form.password !== form.confirm) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    setSaving(true);
    try {
      const data = { name: form.name, staffCode: form.staffCode, role: form.role, phone: form.phone };
      if (mode === 'create') {
        const email = form.emailPrefix + STAFF_DOMAIN;
        await createStaffAccount({ ...data, email, password: form.password });
        alert(`Akun ${form.name} berhasil dibuat.\nEmail: ${email}\nBerikan password ke staff tersebut secara pribadi.`);
      } else {
        await updateStaffAccount(editing.id, isSelf ? { ...data, role: editing.role } : data);
        if (isSelf) refreshProfile({ name: data.name, staffCode: data.staffCode, phone: data.phone });
      }
      close();
    } catch (err) {
      setError(ERRORS[err.code] || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm(`Kirim link ganti password ke ${editing.email}? Link hanya sampai jika email tersebut benar-benar aktif.`)) return;
    try {
      await sendStaffPasswordReset(editing.email);
      alert('Link ganti password sudah dikirim.');
    } catch (err) {
      setError(err.message);
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
          <button className="primary small" onClick={openCreate}>
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
                  <td className="staff-actions">
                    <button className="textbutton" onClick={() => openEdit(x)} title="Edit akun">
                      <Pencil size={13} /> Edit
                    </button>
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

      {mode && (
        <Modal title={mode === 'create' ? 'Tambah akun staff' : `Edit akun — ${editing.name}`} close={close}>
          {error && <div className="auth-error">{error}</div>}
          <form className="form" onSubmit={handleSubmit}>
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
              <select value={form.role} onChange={(e) => set('role', e.target.value)} disabled={isSelf}>
                <option value={ROLES.STAFF}>{ROLE_LABELS.staff}</option>
                <option value={ROLES.ADMIN}>{ROLE_LABELS.admin}</option>
              </select>
            </label>
            {isSelf && <small className="privacy">Kamu tidak bisa mengubah role akunmu sendiri.</small>}
            <label>
              No. WhatsApp
              <input
                required
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone', cleanPhone(e.target.value))}
                placeholder="08..."
              />
            </label>

            {mode === 'create' ? (
              <>
                <label>
                  Email
                  <div className="email-input">
                    <input
                      required
                      value={form.emailPrefix}
                      onChange={(e) => set('emailPrefix', cleanPrefix(e.target.value))}
                      placeholder="nama"
                    />
                    <span className="email-domain">{STAFF_DOMAIN}</span>
                  </div>
                </label>
                <label>
                  Password
                  <div className="password-input">
                    <input
                      required
                      minLength="6"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} title="Tampilkan password">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                <label>
                  Ulangi password
                  <input
                    required
                    minLength="6"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(e) => set('confirm', e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Email
                  <input value={editing.email} disabled />
                </label>
                <small className="privacy">
                  Email dan password tidak bisa diubah dari sini. Untuk mengganti password, kirim link ke email staff
                  (hanya jika email tersebut aktif).
                </small>
                <button type="button" className="outline" onClick={handleResetPassword}>
                  Kirim link ganti password
                </button>
              </>
            )}

            <button className="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : mode === 'create' ? 'Buat akun' : 'Simpan perubahan'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
