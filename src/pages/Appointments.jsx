import React, { useState, useEffect } from 'react';
import { Plus, Check, AlertTriangle, MapPin, ClipboardList, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  createRecord,
  createNotification,
} from '../services/firestore';
import Title from '../components/Title';
import AppointmentCard from '../components/AppointmentCard';
import Empty from '../components/Empty';
import Modal from '../components/Modal';

export default function Appointments() {
  const { profile, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [booking, setBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [book, setBook] = useState({ service: 'Konsultasi Umum', date: '', time: '', note: '' });
  const [recordModal, setRecordModal] = useState(null);
  const [recordForm, setRecordForm] = useState({ service: 'Konsultasi Umum', summary: '' });
  const [urgentSound, setUrgentSound] = useState(false);

  const urgentList = appointments.filter((a) => a.priority === 'urgent' && a.status === 'Urgent');
  const normalList = appointments.filter((a) => a.priority !== 'urgent' || a.status !== 'Urgent');

  async function load() {
    try {
      const data = await getAppointments(profile.id, isAdmin);
      setAppointments(data);
      if (isAdmin) {
        const hasUrgent = data.some((a) => a.priority === 'urgent' && a.status === 'Urgent');
        if (hasUrgent) setUrgentSound(true);
      }
    } catch (err) {
      console.error('Gagal memuat janji temu:', err);
    }
  }

  useEffect(() => {
    if (profile) load();
    if (isAdmin) {
      const interval = setInterval(load, 15000);
      return () => clearInterval(interval);
    }
  }, [profile, isAdmin]);

  async function handleBooking(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAppointment({
        ...book,
        userId: profile.id,
        studentName: profile.name || '',
        nim: profile.nim || '',
        status: 'Menunggu',
      });
      await load();
      setBooking(false);
      setBook({ service: 'Konsultasi Umum', date: '', time: '', note: '' });
    } catch (err) {
      console.error('Gagal membuat janji temu:', err);
      alert('Gagal membuat janji temu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(a, status) {
    try {
      await updateAppointmentStatus(a.id, status);
      if (isAdmin && a.userId) {
        const statusMsg = {
          Terjadwal: 'Janji temu kamu telah disetujui dan dijadwalkan.',
          Selesai: 'Janji temu kamu telah selesai.',
          Ditolak: 'Janji temu kamu ditolak. Silakan buat janji baru.',
          Ditangani: 'Janji temu darurat kamu sedang ditangani petugas.',
        };
        if (statusMsg[status]) {
          await createNotification({
            userId: a.userId,
            title: `Status janji temu: ${status}`,
            message: statusMsg[status],
            type: 'appointment',
            appointmentId: a.id,
          });
        }
      }
      await load();
    } catch (err) {
      console.error('Gagal update status:', err);
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    try {
      await createRecord({
        userId: recordModal.userId,
        date: recordModal.date,
        service: recordForm.service,
        summary: recordForm.summary,
        provider: 'Petugas UKESMAS',
        appointmentId: recordModal.id,
      });
      setRecordModal(null);
      setRecordForm({ service: 'Konsultasi Umum', summary: '' });
      alert('Rekam medis berhasil ditambahkan.');
    } catch (err) {
      console.error('Gagal menambah rekam medis:', err);
      alert('Gagal menyimpan rekam medis: ' + err.message);
    }
  }

  const filtered = normalList.filter((a) => filter === 'Semua' || a.status === filter);

  return (
    <>
      <Title title="Janji Temu" desc="Atur dan pantau jadwal kunjungan layanan kesehatan." />

      {isAdmin && urgentList.length > 0 && (
        <div className="urgent-panel">
          <div className="urgent-panel-header">
            <div className="urgent-pulse">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3>Janji Temu Darurat ({urgentList.length})</h3>
              <small>Mahasiswa memerlukan penanganan segera!</small>
            </div>
            {urgentSound && (
              <button className="dismiss-sound" onClick={() => setUrgentSound(false)}>
                <Bell size={14} /> Diamkan
              </button>
            )}
          </div>
          {urgentList.map((a) => (
            <div className="urgent-item" key={a.id}>
              <div className="urgent-info">
                <b>{a.studentName}</b> <span className="badge-urgent">URGENT</span>
                <small>{a.nim}</small>
                <div className="urgent-location">
                  <MapPin size={12} /> {a.location || 'Lokasi tidak tersedia'}
                </div>
                {a.aiSummary && <p className="urgent-summary">{a.aiSummary}</p>}
                <small className="urgent-time">{a.time} · {a.date}</small>
              </div>
              <div className="actions">
                <button onClick={() => handleStatus(a, 'Ditangani')} className="urgent-handle">
                  <Check size={14} /> Tangani
                </button>
                <button onClick={() => handleStatus(a, 'Selesai')}>Selesai</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panelhead">
          <h3>Daftar janji temu</h3>
          <div className="controls">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['Semua', 'Menunggu', 'Terjadwal', 'Selesai', 'Ditolak'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            {!isAdmin && (
              <button className="primary small" onClick={() => setBooking(true)}>
                <Plus size={14} /> Buat janji
              </button>
            )}
          </div>
        </div>
        {filtered.map((a) => (
          <div className="adminrow" key={a.id}>
            <AppointmentCard a={a} />
            {isAdmin && (
              <div className="actions">
                {a.status === 'Menunggu' && (
                  <button onClick={() => handleStatus(a, 'Terjadwal')}>
                    <Check size={14} /> Setujui
                  </button>
                )}
                {a.status === 'Terjadwal' && (
                  <button onClick={() => setRecordModal(a)} className="record-btn">
                    <ClipboardList size={14} /> Rekam Medis
                  </button>
                )}
                {a.status !== 'Selesai' && (
                  <button onClick={() => handleStatus(a, 'Selesai')}>Selesai</button>
                )}
                {!['Ditolak', 'Selesai'].includes(a.status) && (
                  <button className="red" onClick={() => handleStatus(a, 'Ditolak')}>
                    Tolak
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!filtered.length && <Empty>Belum ada janji temu.</Empty>}
      </div>

      {booking && (
        <Modal title="Buat janji temu" close={() => setBooking(false)}>
          <form className="form" onSubmit={handleBooking}>
            <label>
              Jenis layanan
              <select value={book.service} onChange={(e) => setBook({ ...book, service: e.target.value })}>
                <option>Konsultasi Umum</option>
                <option>Konsultasi Kesehatan Mental</option>
                <option>Pemeriksaan Kesehatan</option>
                <option>Konsultasi Gizi</option>
              </select>
            </label>
            <label>
              Tanggal
              <input
                required
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={book.date}
                onChange={(e) => setBook({ ...book, date: e.target.value })}
              />
            </label>
            <label>
              Waktu
              <select required value={book.time} onChange={(e) => setBook({ ...book, time: e.target.value })}>
                <option value="">Pilih waktu</option>
                {['09:00', '10:00', '11:00', '13:00', '14:00'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Catatan
              <textarea rows="3" value={book.note} onChange={(e) => setBook({ ...book, note: e.target.value })} />
            </label>
            <button className="primary" disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim permintaan'}
            </button>
          </form>
        </Modal>
      )}

      {recordModal && (
        <Modal title={`Rekam Medis — ${recordModal.studentName}`} close={() => setRecordModal(null)}>
          <form className="form" onSubmit={handleAddRecord}>
            <label>
              Layanan
              <select value={recordForm.service} onChange={(e) => setRecordForm({ ...recordForm, service: e.target.value })}>
                <option>Konsultasi Umum</option>
                <option>Pemeriksaan Rutin</option>
                <option>Konsultasi Kesehatan Mental</option>
                <option>Konsultasi Gizi</option>
              </select>
            </label>
            <label>
              Ringkasan pemeriksaan
              <textarea
                required
                rows="4"
                value={recordForm.summary}
                onChange={(e) => setRecordForm({ ...recordForm, summary: e.target.value })}
                placeholder="Tuliskan hasil pemeriksaan dan catatan..."
              />
            </label>
            <button className="primary">Simpan rekam medis</button>
          </form>
        </Modal>
      )}
    </>
  );
}
