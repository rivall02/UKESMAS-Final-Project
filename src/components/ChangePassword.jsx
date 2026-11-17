import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { KeyRound, Eye, EyeOff, Loader } from 'lucide-react';
import { auth } from '../config/firebase';

const EMPTY = { current: '', next: '', confirm: '' };

const ERRORS = {
  'auth/wrong-password': 'Password lama salah.',
  'auth/invalid-credential': 'Password lama salah.',
  'auth/weak-password': 'Password baru minimal 6 karakter.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
  'auth/requires-recent-login': 'Sesi terlalu lama. Keluar lalu masuk lagi, kemudian ulangi.',
};

export default function ChangePassword() {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const type = show ? 'text' : 'password';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (form.next !== form.confirm) return setError('Konfirmasi password baru tidak sama.');
    if (form.next === form.current) return setError('Password baru harus berbeda dari password lama.');

    setSaving(true);
    try {
      const user = auth.currentUser;
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, form.current));
      await updatePassword(user, form.next);
      setForm(EMPTY);
      setSuccess(true);
    } catch (err) {
      setError(ERRORS[err.code] || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 15 }}>
      <div className="panelhead">
        <h3>Ganti Password</h3>
        <button type="button" className="textbutton" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="save-success">Password berhasil diganti. Gunakan password baru saat login berikutnya.</div>}
      <form className="form profile-form" onSubmit={handleSubmit}>
        <label>
          Password lama
          <input
            required
            type={type}
            autoComplete="current-password"
            value={form.current}
            onChange={(e) => set('current', e.target.value)}
          />
        </label>
        <label>
          Password baru
          <input
            required
            minLength="6"
            type={type}
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => set('next', e.target.value)}
          />
        </label>
        <label>
          Ulangi password baru
          <input
            required
            minLength="6"
            type={type}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
          />
        </label>
        <div className="profile-actions">
          <button className="primary" disabled={saving}>
            {saving ? (
              <>
                <Loader size={14} className="spin" /> Menyimpan...
              </>
            ) : (
              <>
                <KeyRound size={14} /> Ganti password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
