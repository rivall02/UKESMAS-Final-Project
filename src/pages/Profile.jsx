import { useState } from 'react';
import { User, Save, Loader } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { FACULTY_DATA, ROLE_LABELS } from '../constants';
import { updateUser, upsertDirectory } from '../services/users';
import Title from '../components/Title';
import ChangePassword from '../components/ChangePassword';

function initialForm(profile) {
  return {
    name: profile.name || '',
    nim: profile.nim || '',
    faculty: profile.faculty || '',
    program: profile.program || '',
    phone: profile.phone || '',
  };
}

export default function Profile() {
  const { profile, role, isStudent, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => initialForm(profile));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const programs = FACULTY_DATA[form.faculty] || [];

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updates = isStudent
        ? { name: form.name, nim: form.nim, faculty: form.faculty, program: form.program }
        : { name: form.name, phone: form.phone };
      await updateUser(profile.id, updates);
      if (isStudent) await upsertDirectory(profile.id, updates);
      refreshProfile(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Gagal menyimpan profil:', err);
      alert('Gagal menyimpan profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Title title="Profil Saya" desc="Kelola informasi pribadi akun kamu." />

      <div className="panel">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={32} />
          </div>
          <div>
            <h3>{profile.name || 'Pengguna'}</h3>
            <small>{profile.email}</small>
            <span className={'role-badge ' + role}>{ROLE_LABELS[role]}</span>
          </div>
        </div>

        <form className="form profile-form" onSubmit={handleSave}>
          <label>
            Nama lengkap
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>

          {isStudent ? (
            <>
              <label>
                NIM
                <input
                  required
                  inputMode="numeric"
                  value={form.nim}
                  onChange={(e) => set('nim', e.target.value.replace(/\D/g, ''))}
                  placeholder="1050...."
                />
              </label>
              <label>
                Fakultas
                <select
                  required
                  value={form.faculty}
                  onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value, program: '' }))}
                >
                  <option value="">Pilih fakultas</option>
                  {Object.keys(FACULTY_DATA).map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Program Studi
                <select
                  required
                  value={form.program}
                  onChange={(e) => set('program', e.target.value)}
                  disabled={!form.faculty}
                >
                  <option value="">Pilih program studi</option>
                  {programs.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label>
              No. WhatsApp
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="08..."
              />
            </label>
          )}

          <div className="profile-actions">
            <button className="primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader size={14} className="spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={14} /> Simpan perubahan
                </>
              )}
            </button>
            {saved && <span className="save-success">Profil berhasil diperbarui!</span>}
          </div>
        </form>
      </div>

      <div className="panel" style={{ marginTop: 15 }}>
        <h3>Informasi Akun</h3>
        <div className="account-info">
          <div className="info-row">
            <span>Email</span>
            <b>{profile.email}</b>
          </div>
          <div className="info-row">
            <span>Role</span>
            <b>{ROLE_LABELS[role]}</b>
          </div>
          {!isStudent && (
            <div className="info-row">
              <span>Kode staff</span>
              <b>{profile.staffCode || '-'}</b>
            </div>
          )}
          {profile.createdAt && (
            <div className="info-row">
              <span>Bergabung sejak</span>
              <b>
                {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </b>
            </div>
          )}
        </div>
      </div>

      <ChangePassword />
    </>
  );
}
