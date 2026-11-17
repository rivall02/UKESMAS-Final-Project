import { useState, useEffect } from 'react';
import { Plus, Check, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { ACTIVE_EMERGENCY_STATUSES, ALL_STATUSES, STATUS } from '../constants';
import { subscribeAppointments, updateAppointmentStatus } from '../services/appointments';
import { notifyStatusChange } from '../services/notifications';
import { buildAppointmentMarkers } from '../utils/calendar';
import Title from '../components/Title';
import AppointmentCard from '../components/AppointmentCard';
import Empty from '../components/Empty';
import Calendar from '../components/Calendar';
import UrgentPanel from '../components/UrgentPanel';
import BookingModal from '../components/BookingModal';
import RecordModal from '../components/RecordModal';

export default function Appointments() {
  const { profile, isStaff } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [date, setDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [recordFor, setRecordFor] = useState(null);

  useEffect(
    () =>
      subscribeAppointments({ userId: profile.id, isStaff }, setAppointments, (err) =>
        console.error('Gagal memuat janji temu:', err),
      ),
    [profile.id, isStaff],
  );

  async function handleStatus(a, status) {
    try {
      await updateAppointmentStatus(a.id, status);
      await notifyStatusChange(a, status);
    } catch (err) {
      console.error('Gagal update status:', err);
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  const visible = appointments.filter(
    (a) =>
      !(isStaff && a.priority === 'urgent' && ACTIVE_EMERGENCY_STATUSES.includes(a.status)) &&
      (filter === 'Semua' || a.status === filter) &&
      (!date || a.date === date),
  );

  return (
    <>
      <Title title="Janji Temu" desc="Atur dan pantau jadwal kunjungan layanan kesehatan." />

      {isStaff && <UrgentPanel />}

      <div className="panel">
        <div className="panelhead">
          <h3>Daftar janji temu</h3>
          <div className="controls">
            <Calendar value={date} onChange={setDate} markers={buildAppointmentMarkers(appointments)} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['Semua', ...ALL_STATUSES].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            {!isStaff && (
              <button className="primary small" onClick={() => setBooking(true)}>
                <Plus size={14} /> Buat janji
              </button>
            )}
          </div>
        </div>
        {visible.map((a) => (
          <div className="adminrow" key={a.id}>
            <AppointmentCard a={a} />
            {isStaff && (
              <div className="actions">
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
              </div>
            )}
          </div>
        ))}
        {!visible.length && <Empty>Belum ada janji temu.</Empty>}
      </div>

      {booking && <BookingModal onClose={() => setBooking(false)} />}
      {recordFor && <RecordModal appointment={recordFor} onClose={() => setRecordFor(null)} />}
    </>
  );
}
