import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const EMAIL_DOMAIN = '@student.unklab.ac.id';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const isRegister = location.pathname === '/register';

  const [form, setForm] = useState({
    name: '',
    emailPrefix: '',
    email: '',
    password: '',
    nim: '',
    faculty: '',
    program: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const programs = form.faculty ? FACULTY_DATA[form.faculty] || [] : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const fullEmail = form.emailPrefix + EMAIL_DOMAIN;
        await register({ ...form, email: fullEmail });
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
          ? 'Email atau password salah.'
          : err.code === 'auth/email-already-in-use'
          ? 'Email sudah terdaftar.'
          : err.message || 'Terjadi kesalahan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="authbox">
        <button className="back" onClick={() => navigate('/')}>
          ← Kembali ke halaman depan
        </button>
        <div className="brand">
          <i><HeartPulse /></i>
          <b>UKESMAS<small>UNIVERSITAS KLABAT</small></b>
        </div>
        <h1>{isRegister ? 'Buat akun UKESMAS' : 'Selamat datang kembali!'}</h1>
        <p>
          {isRegister
            ? 'Daftar sebagai mahasiswa Universitas Klabat.'
            : 'Masuk untuk mengakses layanan kesehatan mahasiswa.'}
        </p>

        {error && <div className="demo" style={{ color: '#c77986', borderColor: '#f5d0d4' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          {isRegister && (
            <>
              <label>
                Nama lengkap
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
              <label>
                NIM
                <input required value={form.nim} onChange={(e) => set('nim', e.target.value)} placeholder="Contoh: 12410056" />
              </label>
              <label>
                Fakultas
                <select
                  required
                  value={form.faculty}
                  onChange={(e) => {
                    set('faculty', e.target.value);
                    set('program', '');
                  }}
                >
                  <option value="">Pilih fakultas</option>
                  {Object.keys(FACULTY_DATA).map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Program studi
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
          )}

          {isRegister ? (
            <label>
              Email mahasiswa
              <div className="email-input">
                <input
                  required
                  type="text"
                  value={form.emailPrefix}
                  onChange={(e) => set('emailPrefix', e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                  placeholder="12410056"
                />
                <span className="email-domain">{EMAIL_DOMAIN}</span>
              </div>
            </label>
          ) : (
            <label>
              Email mahasiswa
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="12410056@student.unklab.ac.id"
              />
            </label>
          )}

          <label>
            Password
            <input
              required
              type="password"
              minLength="6"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? 'Memproses...' : isRegister ? 'Daftar akun' : 'Masuk ke UKESMAS'}{' '}
            <ArrowUpRight size={15} />
          </button>
        </form>

        <p className="switch">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button onClick={() => navigate(isRegister ? '/login' : '/register')}>
            {isRegister ? 'Masuk' : 'Daftar'}
          </button>
        </p>
        <small className="disclaimer">Prototype akademik. Gunakan data fiktif.</small>
      </div>
      <div className="authart">
        <HeartPulse size={110} />
        <span>♡</span>
        <span>✿</span>
      </div>
    </div>
  );
}
