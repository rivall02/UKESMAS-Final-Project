import { useState, useRef } from 'react';
import { Camera, Trash2, Save, Loader } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { FACULTY_DATA, ROLE_LABELS } from '../constants';
import { updateUser, upsertDirectory } from '../services/users';
import Title from '../components/Title';
import Avatar from '../components/Avatar';
import ChangePassword from '../components/ChangePassword';
import '../styles/profile.css';

function initialForm(profile) {
  return {
    name: profile.name || '',
    nim: profile.nim || '',
    faculty: profile.faculty || '',
    program: profile.program || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
  };
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.onload = () => {
        let { width, height } = img;
        const maxSide = 256;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const qualities = [0.8, 0.7, 0.6, 0.5];
        let dataUrl = '';
        for (const q of qualities) {
          dataUrl = canvas.toDataURL('image/jpeg', q);
          const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
          if (sizeKb <= 150) break;
        }
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { profile, role, isStudent, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => initialForm(profile));
  const [photo, setPhoto] = useState(() => profile.photo || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const programs = FACULTY_DATA[form.faculty] || [];

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file);
      setPhoto(compressedDataUrl);
    } catch (err) {
      console.error('Gagal kompres foto:', err);
      alert('Gagal memproses foto: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDeletePhoto() {
    setPhoto('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updates = isStudent
        ? {
            name: form.name,
            nim: form.nim,
            faculty: form.faculty,
            program: form.program,
            bio: form.bio.slice(0, 300),
            photo: photo || '',
          }
        : {
            name: form.name,
            phone: form.phone,
            bio: form.bio.slice(0, 300),
            photo: photo || '',
          };

      await updateUser(profile.id, updates);
      if (isStudent) {
        await upsertDirectory(profile.id, { name: form.name, nim: form.nim });
      }
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
          <Avatar user={{ ...profile, photo }} size={60} />
          <div>
            <h3>{form.name || profile.name || 'Pengguna'}</h3>
            <small>{profile.email}</small>
            <span className={'role-badge ' + role}>{ROLE_LABELS[role]}</span>
          </div>
        </div>

        <form className="form profile-form" onSubmit={handleSave}>
          <div className="prof-photo-section">
            <div className="prof-photo-preview">
              <Avatar user={{ name: form.name || profile.name, photo }} size={72} />
            </div>
            <div className="prof-photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="prof-btn-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={13} /> Pilih foto
              </button>
              {photo && (
                <button
                  type="button"
                  className="prof-btn-delete"
                  onClick={handleDeletePhoto}
                >
                  <Trash2 size={13} /> Hapus foto
                </button>
              )}
            </div>
          </div>

          <label>
            Nama lengkap
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>

          <div className="prof-bio-wrap">
            <div className="prof-bio-header">
              <span style={{ fontSize: 10, fontWeight: 700, color: '#715968' }}>Bio</span>
              <span className="prof-bio-counter">{form.bio.length}/300</span>
            </div>
            <textarea
              className="prof-bio-textarea"
              maxLength={300}
              placeholder="Ceritakan sedikit tentang dirimu atau hal penting seputar kesehatanmu..."
              value={form.bio}
              onChange={(e) => set('bio', e.target.value.slice(0, 300))}
            />
          </div>

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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, faculty: e.target.value, program: '' }))
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
