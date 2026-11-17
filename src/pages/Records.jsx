import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { RECORD_SERVICES } from '../constants';
import { subscribeRecords, createRecord } from '../services/records';
import { subscribeStudents } from '../services/users';
import { buildRecordMarkers } from '../utils/calendar';
import { formatDate, todayWITA } from '../utils/date';
import Title from '../components/Title';
import Empty from '../components/Empty';
import Calendar from '../components/Calendar';

const emptyForm = () => ({ userId: '', date: todayWITA(), service: RECORD_SERVICES[0], summary: '' });

export default function Records() {
  const { profile, isStaff } = useAuth();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(
    () =>
      subscribeRecords({ userId: profile.id, isStaff }, setRecords, (err) =>
        console.error('Gagal memuat rekam medis:', err),
      ),
    [profile.id, isStaff],
  );

  useEffect(() => {
    if (!isStaff) return;
    return subscribeStudents(setStudents, (err) => console.error('Gagal memuat mahasiswa:', err));
  }, [isStaff]);

  async function handleAdd(e) {
    e.preventDefault();
    const student = students.find((s) => s.id === form.userId);
    setSaving(true);
    try {
      await createRecord({
        ...form,
        studentName: student?.name || '',
        nim: student?.nim || '',
        provider: profile.name || 'Petugas UKESMAS',
        providerId: profile.id,
      });
      setForm(emptyForm());
    } catch (err) {
      console.error('Gagal menambah rekam medis:', err);
      alert('Gagal menyimpan catatan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const nameOf = (r) => r.studentName || students.find((s) => s.id === r.userId)?.name || '-';
  const visible = records.filter((r) => !date || r.date === date);

  return (
    <>
      <Title title="Rekam Medis" desc="Riwayat pemeriksaan dan catatan layanan kesehatan." />

      {isStaff && (
        <div className="panel">
          <h3>Tambah catatan pemeriksaan</h3>
          <form className="recordform" onSubmit={handleAdd}>
            <label>
              Mahasiswa
              <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Pilih mahasiswa</option>
                {students.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({x.nim})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tanggal
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              Layanan
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                {RECORD_SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Ringkasan
              <textarea
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </label>
            <button className="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan catatan'}
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panelhead">
          <h3>Riwayat pemeriksaan</h3>
          <Calendar value={date} onChange={setDate} markers={buildRecordMarkers(records)} />
        </div>
        {visible.map((r) => (
          <div className="record" key={r.id}>
            <ClipboardList />
            <div>
              <b>
                {r.service}
                {isStaff && ` — ${nameOf(r)}`}
              </b>
              <small>
                {formatDate(r.date)} · {r.provider || 'Petugas UKESMAS'}
              </small>
              <p>{r.summary}</p>
            </div>
          </div>
        ))}
        {!visible.length && <Empty>Belum ada riwayat pemeriksaan.</Empty>}
      </div>
    </>
  );
}
