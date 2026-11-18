import { useState, useEffect } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { RECORD_SERVICES } from '../constants';
import { subscribeRecords, createRecord } from '../services/records';
import { subscribeStudents } from '../services/users';
import { buildRecordMarkers } from '../utils/calendar';
import { formatDate, formatDayHeader, groupByDate, todayWITA, nowTimeWITA } from '../utils/date';
import Title from '../components/Title';
import Empty from '../components/Empty';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';
import '../styles/records.css';

const RECORD_LEGEND = [
  { color: 'neutral', label: 'Tidak ada catatan' },
  { color: 'green', label: 'Ada pemeriksaan' },
  { color: 'red', label: 'Ada penanganan darurat' },
];

const emptyForm = () => ({
  userId: '',
  date: todayWITA(),
  time: '',
  service: RECORD_SERVICES[0],
  summary: '',
});

export default function Records() {
  const { profile, isStaff } = useAuth();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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
      let finalTime = '';
      if (form.time && form.time.trim()) {
        finalTime = form.time.trim();
      } else if (form.date === todayWITA()) {
        finalTime = nowTimeWITA();
      }

      await createRecord({
        ...form,
        time: finalTime,
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
  const nimOf = (r) => r.nim || students.find((s) => s.id === r.userId)?.nim || '-';

  const filtered = records.filter((r) => {
    if (date && r.date !== date) return false;
    if (isStaff && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const sName = nameOf(r).toLowerCase();
      const sNim = nimOf(r).toLowerCase();
      if (!sName.includes(q) && !sNim.includes(q)) return false;
    }
    return true;
  });

  const grouped = groupByDate(filtered);

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
              Jam (opsional)
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
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
                rows="3"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Tuliskan hasil pemeriksaan, diagnosis, dan tindakan..."
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
          <Calendar
            value={date}
            onChange={setDate}
            markers={buildRecordMarkers(records)}
            legend={RECORD_LEGEND}
          />
        </div>

        {isStaff && (
          <div className="rec-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIM mahasiswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {grouped.map((group) => (
          <div className="rec-day-group" key={group.date}>
            <div className="rec-day-title">{formatDayHeader(group.date)}</div>
            {group.items.map((r) => {
              const isUrgent = r.service === 'Penanganan Darurat';
              return (
                <div
                  className={`rec-item ${isStaff ? 'rec-clickable' : ''}`}
                  key={r.id}
                  onClick={() => {
                    if (isStaff) setSelectedRecord(r);
                  }}
                  onKeyDown={(e) => {
                    if (isStaff && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setSelectedRecord(r);
                    }
                  }}
                  role={isStaff ? 'button' : undefined}
                  tabIndex={isStaff ? 0 : undefined}
                >
                  <div className="rec-item-icon">
                    <ClipboardList size={18} />
                  </div>
                  <div className="rec-item-body">
                    <div className="rec-item-header">
                      <b>{isStaff ? `${nameOf(r)} (${nimOf(r)})` : r.service}</b>
                      <span className={`rec-badge-service ${isUrgent ? 'rec-urgent' : ''}`}>
                        {r.service}
                      </span>
                    </div>
                    <small className="rec-item-meta">
                      {formatDate(r.date)} {r.time ? `· ${r.time} WITA` : ''} · {r.provider || 'Petugas UKESMAS'}
                    </small>
                    <p className="rec-item-summary">{r.summary}</p>
                    {isStaff && <span className="rec-hint-click">Klik untuk detail lengkap →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {!filtered.length && (
          records.length === 0 ? (
            <Empty>Belum ada riwayat pemeriksaan.</Empty>
          ) : (
            <Empty>
              Tidak ada catatan yang cocok.
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setDate('');
                    setSearchQuery('');
                  }}
                >
                  Reset filter
                </button>
              </div>
            </Empty>
          )
        )}
      </div>

      {selectedRecord && (
        <Modal title="Detail Rekam Medis" close={() => setSelectedRecord(null)}>
          <div className="rec-detail-box">
            <div className="rec-detail-row">
              <span className="rec-detail-label">Mahasiswa</span>
              <span className="rec-detail-value">{nameOf(selectedRecord)}</span>
            </div>
            <div className="rec-detail-row">
              <span className="rec-detail-label">NIM</span>
              <span className="rec-detail-value">{nimOf(selectedRecord)}</span>
            </div>
            <div className="rec-detail-row">
              <span className="rec-detail-label">Layanan</span>
              <span className="rec-detail-value">{selectedRecord.service}</span>
            </div>
            <div className="rec-detail-row">
              <span className="rec-detail-label">Tanggal</span>
              <span className="rec-detail-value">{formatDate(selectedRecord.date)}</span>
            </div>
            <div className="rec-detail-row">
              <span className="rec-detail-label">Jam</span>
              <span className="rec-detail-value">{selectedRecord.time ? `${selectedRecord.time} WITA` : '-'}</span>
            </div>
            <div className="rec-detail-row">
              <span className="rec-detail-label">Petugas Pemeriksa</span>
              <span className="rec-detail-value">{selectedRecord.provider || 'Petugas UKESMAS'}</span>
            </div>
            <div className="rec-detail-summary-title">Ringkasan Pemeriksaan:</div>
            <p className="rec-detail-summary-content">{selectedRecord.summary}</p>
          </div>
          <button type="button" className="primary" style={{ width: '100%' }} onClick={() => setSelectedRecord(null)}>
            Tutup
          </button>
        </Modal>
      )}
    </>
  );
}
