import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, ArrowUpRight, GraduationCap, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { FACULTY_DATA, STAFF_DOMAIN, STUDENT_DOMAIN } from '../constants';

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'Email atau password salah.',
  'auth/wrong-password': 'Email atau password salah.',
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/email-already-in-use': 'Email sudah terdaftar.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
  'auth/weak-password': 'Password minimal 6 karakter.',
};

const cleanPrefix = (value) => value.replace(/@.*$/, '').replace(/[^a-zA-Z0-9._-]/g, '');

function EmailPrefixInput({ value, onChange, domain, placeholder }) {
  return (
    <div className="email-input">
      <input
        required
        type="text"
        autoComplete="username"
        value={value}
        onChange={(e) => onChange(cleanPrefix(e.target.value))}
        placeholder={placeholder}
      />
      <span className="email-domain">{domain}</span>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const isRegister = location.pathname === '/register';

  const [portal, setPortal] = useState('student');
  const [form, setForm] = useState({
    name: '',
    emailPrefix: '',
    password: '',
    nim: '',
    faculty: '',
    program: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const programs = FACULTY_DATA[form.faculty] || [];
  const isStaffPortal = !isRegister && portal === 'staff';
  const domain = isStaffPortal ? STAFF_DOMAIN : STUDENT_DOMAIN;

  function switchPortal(next) {
    setPortal(next);
    setError('');
    set('emailPrefix', '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email = form.emailPrefix + domain;
    try {
      if (isRegister) await register({ ...form, email });
      else await login(email, form.password, portal);
      navigate('/dashboard');
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || err.message || 'Terjadi kesalahan.');
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
            : isStaffPortal
              ? 'Masuk sebagai staff atau admin UKESMAS.'
              : 'Masuk untuk mengakses layanan kesehatan mahasiswa.'}
        </p>

        {!isRegister && (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={portal === 'student'}
              className={portal === 'student' ? 'active' : ''}
              onClick={() => switchPortal('student')}
            >
              <GraduationCap size={14} /> Mahasiswa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={portal === 'staff'}
              className={portal === 'staff' ? 'active' : ''}
              onClick={() => switchPortal('staff')}
            >
              <Stethoscope size={14} /> Staff / Admin
            </button>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          {isRegister && (
            <>
              <label>
                Nama lengkap
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
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

          <label>
            {isStaffPortal ? 'Email staff' : 'Email mahasiswa'}
            <EmailPrefixInput
              value={form.emailPrefix}
              onChange={(v) => set('emailPrefix', v)}
              domain={domain}
              placeholder={isStaffPortal ? 'nama' : 'noreg'}
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength="6"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? 'Memproses...' : isRegister ? 'Daftar akun' : 'Masuk ke UKESMAS'}{' '}
            <ArrowUpRight size={15} />
          </button>
        </form>

        {isStaffPortal ? (
          <p className="switch">Akun staff dibuat oleh Head Admin UKESMAS.</p>
        ) : (
          <p className="switch">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button onClick={() => navigate(isRegister ? '/login' : '/register')}>
              {isRegister ? 'Masuk' : 'Daftar'}
            </button>
          </p>
        )}
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
