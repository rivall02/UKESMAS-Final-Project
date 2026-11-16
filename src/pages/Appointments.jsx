import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
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

  async function load() {
    try {
      const data = await getAppointments(profile.id, isAdmin);
      setAppointments(data);
    } catch (err) {
      console.error('Gagal memuat janji temu:', err);
    }
  }

  useEffect(() => {
    if (profile) load();
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
      await load();
    } catch (err) {
      console.error('Gagal update status:', err);
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  const filtered = appointments.filter((a) => filter === 'Semua' || a.status === filter);

  return (
    <>
      <Title title="Janji Temu" desc="Atur dan pantau jadwal kunjungan layanan kesehatan." />
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
    </>
  );
}
