import React, { useState } from 'react';
import { User, Save, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUser } from '../services/firestore';
import Title from '../components/Title';

const FACULTY_DATA = {
  'Fakultas Ekonomi': ['Akuntansi (S1)', 'Manajemen (S1)', 'Sekretaris (D3)'],
  'Fakultas Filsafat': ['Ilmu Filsafat (S1)', 'Pendidikan Agama (S1)'],
  'Fakultas Keguruan dan Ilmu Pendidikan': [
    'Pendidikan Bahasa Inggris (S1)',
    'Pendidikan Ekonomi (S1)',
    'Pendidikan Luar Sekolah (S1)',
  ],
  'Fakultas Pertanian': ['Agroteknologi (S1)'],
  'Fakultas Keperawatan': ['Ilmu Keperawatan (S1)'],
  'Fakultas Ilmu Komputer': ['Sistem Informasi (S1)', 'Informatika (S1)', 'Teknologi Informasi (S1)'],
  'Fakultas Kedokteran': ['Kedokteran (S1)'],
};

export default function Profile() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || '',
    nim: profile?.nim || '',
    faculty: profile?.faculty || '',
    program: profile?.program || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const programs = FACULTY_DATA[form.faculty] || [];

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updates = {
        name: form.name,
        nim: form.nim,
        faculty: form.faculty,
        program: form.program,
      };
      await updateUser(profile.id, updates);
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
            <h3>{profile?.name || 'Pengguna'}</h3>
            <small>{profile?.email}</small>
            <span className={'role-badge ' + (isAdmin ? 'admin' : 'student')}>
              {isAdmin ? 'Administrator' : 'Mahasiswa'}
            </span>
          </div>
        </div>

        <form className="form profile-form" onSubmit={handleSave}>
          <label>
            Nama lengkap
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          {!isAdmin && (
            <>
              <label>
                NIM
                <input
                  required
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                />
              </label>

              <label>
                Fakultas
                <select
                  required
                  value={form.faculty}
                  onChange={(e) =>
                    setForm({ ...form, faculty: e.target.value, program: '' })
                  }
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
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  disabled={!form.faculty}
                >
                  <option value="">Pilih program studi</option>
                  {programs.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <div className="profile-actions">
            <button className="primary" disabled={saving}>
              {saving ? (
                <><Loader size={14} className="spin" /> Menyimpan...</>
              ) : (
                <><Save size={14} /> Simpan perubahan</>
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
            <b>{profile?.email}</b>
          </div>
          <div className="info-row">
            <span>Role</span>
            <b>{isAdmin ? 'Administrator' : 'Mahasiswa'}</b>
          </div>
          {profile?.createdAt && (
            <div className="info-row">
              <span>Bergabung sejak</span>
              <b>{new Date(profile.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}</b>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
