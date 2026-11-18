import { useState, useEffect, useRef } from 'react';
import { Plus, Check, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { ACTIVE_EMERGENCY_STATUSES, ALL_STATUSES, CANCELLABLE_STATUSES, STATUS, UNFINISHED_STATUSES } from '../constants';
import {
  deleteAppointment,
  releaseSlot,
  setSlotCapacity,
  subscribeAppointments,
  subscribeSlotCapacity,
  updateAppointmentStatus,
} from '../services/appointments';
import { notifyStatusChange } from '../services/notifications';
import { buildAppointmentMarkers } from '../utils/calendar';
import { formatDayHeader, groupByDate, toMinutes } from '../utils/date';
import Title from '../components/Title';
import AppointmentCard from '../components/AppointmentCard';
import Empty from '../components/Empty';
import Calendar from '../components/Calendar';
import UrgentPanel from '../components/UrgentPanel';
import BookingModal from '../components/BookingModal';
import RecordModal from '../components/RecordModal';
import '../styles/appointments.css';

function SlotCapacityControl() {
  const [capacity, setCapacity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const busy = useRef(false);

  useEffect(() => subscribeSlotCapacity((value) => {
    setCapacity(value);
    setError('');
  }, (err) => {
    console.error('Gagal memuat kapasitas:', err);
    setCapacity(null);
    setError('Kapasitas belum bisa dimuat. Coba lagi.');
  }), [reload]);

  async function save(value) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await setSlotCapacity(value);
      setCapacity(value);
      setMessage('Kapasitas tersimpan.');
    } catch (err) {
      console.error('Gagal menyimpan kapasitas:', err);
      setError('Gagal menyimpan kapasitas. Periksa koneksi dan hak akses Head Admin.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="appt-capacity">
      <label>
        Kapasitas per slot
        <select aria-label="Kapasitas per slot" value={capacity ?? ''} disabled={saving || capacity === null} onChange={(e) => save(Number(e.target.value))}>
          <option value="" disabled>Memuat...</option>
          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <small className="appt-hint" role="status">{saving ? 'Menyimpan...' : message}</small>
      {error && (
        <div className="appt-message appt-error" role="alert">
          <p>{error}</p>
          <button className="appt-retry" disabled={saving} onClick={() => setReload((value) => value + 1)}>Muat ulang kapasitas</button>
        </div>
      )}
    </div>
  );
}

export default function Appointments() {
  const { profile, isStudent, isStaff, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [date, setDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [recordFor, setRecordFor] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [busyIds, setBusyIds] = useState([]);
  const [pendingReleases, setPendingReleases] = useState({});

  useEffect(
    () =>
      subscribeAppointments({ userId: profile.id, isStaff }, (items) => {
        setAppointments(items);
        setLoading(false);
        setLoadError('');
      }, (err) => {
        console.error('Gagal memuat janji temu:', err);
        setLoading(false);
        setLoadError('Daftar janji temu belum bisa diperbarui. Periksa koneksi dan coba lagi.');
      }),
    [profile.id, isStaff, reload],
  );

  function lock(id) {
    if (busyIds.length) return false;
    setBusyIds([id]);
    setError('');
    return true;
  }

  function unlock() {
    setBusyIds([]);
  }

  async function retryRelease(a) {
    if (!lock(a.id)) return;
    try {
      await releaseSlot(a.date, a.time);
      setPendingReleases((previous) => {
        const next = { ...previous };
        delete next[a.id];
        return next;
      });
    } catch (err) {
      console.error('Gagal melepas slot:', err);
      setError('Slot belum berhasil dilepas. Periksa koneksi lalu coba lagi.');
    } finally {
      unlock();
    }
  }

  async function handleStatus(a, status) {
    if (!isStaff || !lock(a.id)) return;
    try {
      await updateAppointmentStatus(a.id, status);
      if (status === STATUS.DITOLAK) {
        try {
          await releaseSlot(a.date, a.time);
        } catch (err) {
          console.error('Gagal melepas slot:', err);
          setPendingReleases((previous) => ({ ...previous, [a.id]: a }));
        }
      }
      try {
        await notifyStatusChange(a, status);
      } catch (err) {
        console.error('Gagal mengirim notifikasi:', err);
        setError('Status berhasil diperbarui, tetapi notifikasi belum terkirim.');
      }
    } catch (err) {
      console.error('Gagal update status:', err);
      setError('Gagal memperbarui status. Periksa koneksi dan coba lagi.');
    } finally {
      unlock();
    }
  }

  async function handleCancel(a) {
    if (!isStudent || a.userId !== profile.id || !CANCELLABLE_STATUSES.includes(a.status)) return;
    if (!window.confirm(`Batalkan janji ${a.service} pada ${formatDayHeader(a.date)} pukul ${a.time} WITA?`)) return;
    if (!lock(a.id)) return;
    try {
      await deleteAppointment(a);
    } catch (err) {
      console.error('Gagal membatalkan janji:', err);
      setError('Janji belum berhasil dibatalkan. Periksa koneksi dan pastikan status masih Menunggu atau Terjadwal.');
    } finally {
      unlock();
    }
  }

  const visible = appointments.filter(
    (a) =>
      !(isStaff && a.priority === 'urgent' && ACTIVE_EMERGENCY_STATUSES.includes(a.status)) &&
      (filter === 'Semua' || a.status === filter) &&
      (!date || a.date === date),
  );
  const groups = groupByDate(visible);

  return (
    <>
      <Title title="Janji Temu" desc="Atur dan pantau jadwal kunjungan layanan kesehatan." />

      {isStaff && <UrgentPanel />}
      {isAdmin && <SlotCapacityControl />}

      <div className="panel appt-panel">
        <div className="panelhead appt-panelhead">
          <h3>Daftar janji temu</h3>
          <div className="controls appt-controls">
            <Calendar value={date} onChange={setDate} markers={buildAppointmentMarkers(appointments)} />
            <select aria-label="Filter status janji temu" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['Semua', ...ALL_STATUSES].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            {isStudent && (
              <button className="primary small" onClick={() => setBooking(true)}>
                <Plus size={14} /> Buat janji
              </button>
            )}
          </div>
        </div>
        {error && <p className="appt-message appt-error" role="alert">{error}</p>}
        {loadError && (
          <div className="appt-message appt-error" role="alert">
            <p>{loadError}</p>
            <button className="appt-retry" onClick={() => setReload((value) => value + 1)}>Coba lagi</button>
          </div>
        )}
        {isStaff && Object.values(pendingReleases).map((a) => (
          <div className="appt-message appt-error" role="alert" key={a.id}>
            <p>Janji {a.studentName} sudah ditolak, tetapi slot {a.date} pukul {a.time} belum berhasil dilepas.</p>
            <button className="appt-retry" disabled={busyIds.includes(a.id)} onClick={() => retryRelease(a)}>Coba lepaskan slot</button>
          </div>
        ))}
        {loading && <p className="appt-hint" role="status">Memuat janji temu...</p>}
        {groups.map(({ date: day, items }) => (
          <section className="appt-day" key={day}>
            <h4 className="appt-day-title">
              <span>{day === '-' ? 'Tanpa tanggal' : formatDayHeader(day)}</span>
              <span className="appt-day-summary">· {items.filter((a) => !UNFINISHED_STATUSES.includes(a.status)).length}/{items.length} selesai</span>
            </h4>
            {[...items].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)).map((a) => (
                <div className="adminrow appt-row" key={a.id} aria-busy={busyIds.includes(a.id)}>
                  <AppointmentCard a={a} />
                  {isStudent && a.userId === profile.id && a.priority !== 'urgent' && CANCELLABLE_STATUSES.includes(a.status) && (
                    <div className="actions appt-actions">
                      <button className="red" disabled={busyIds.includes(a.id) || Boolean(loadError)} onClick={() => handleCancel(a)}>
                        {busyIds.includes(a.id) ? 'Membatalkan...' : 'Batalkan'}
                      </button>
                    </div>
                  )}
                  {isStaff && (
                    <fieldset className="actions appt-actions appt-fields" disabled={busyIds.includes(a.id) || Boolean(loadError)}>
                      {a.status === STATUS.MENUNGGU && (
                        <button onClick={() => handleStatus(a, STATUS.TERJADWAL)}>
                          <Check size={14} /> Setujui
                        </button>
                      )}
                      {[STATUS.TERJADWAL, STATUS.DITANGANI].includes(a.status) && a.userId && (
                        <button onClick={() => setRecordFor(a)} className="record-btn">
                          <ClipboardList size={14} /> Rekam Medis
                        </button>
                      )}
                      {![STATUS.SELESAI, STATUS.DITOLAK, STATUS.DIRUJUK].includes(a.status) && (
                        <button onClick={() => handleStatus(a, STATUS.SELESAI)}>Selesai</button>
                      )}
                      {[STATUS.MENUNGGU, STATUS.TERJADWAL].includes(a.status) && (
                        <button className="red" onClick={() => handleStatus(a, STATUS.DITOLAK)}>
                          Tolak
                        </button>
                      )}
                    </fieldset>
                  )}
                </div>
                  ))}
          </section>
        ))}
        {!loading && !loadError && !visible.length && <Empty>Belum ada janji temu.</Empty>}
      </div>

      {booking && <BookingModal onClose={() => setBooking(false)} />}
      {recordFor && <RecordModal appointment={recordFor} onClose={() => setRecordFor(null)} />}
    </>
  );
}
