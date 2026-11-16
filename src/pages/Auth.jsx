import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const isRegister = location.pathname === '/register';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    nim: '',
    faculty: '',
    program: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
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
              {[
                ['name', 'Nama lengkap'],
                ['nim', 'NIM'],
                ['faculty', 'Fakultas'],
                ['program', 'Program studi'],
              ].map(([k, l]) => (
                <label key={k}>
                  {l}
                  <input
                    required
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </label>
              ))}
            </>
          )}
          <label>
            Email mahasiswa
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>
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
