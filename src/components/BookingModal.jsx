import { useState } from 'react';
import { useAuth } from '../contexts/auth';
import { SERVICES, STATUS, TIME_SLOTS } from '../constants';
import { createAppointment } from '../services/appointments';
import { todayWITA } from '../utils/date';
import Modal from './Modal';

const EMPTY = { service: SERVICES[0], date: '', time: '', note: '' };

export default function BookingModal({ onClose }) {
  const { profile } = useAuth();
  const [book, setBook] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAppointment({
        ...book,
        userId: profile.id,
        studentName: profile.name || '',
        nim: profile.nim || '',
        status: STATUS.MENUNGGU,
      });
      onClose();
    } catch (err) {
      console.error('Gagal membuat janji temu:', err);
      alert('Gagal membuat janji temu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Buat janji temu" close={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Jenis layanan
          <select value={book.service} onChange={(e) => setBook({ ...book, service: e.target.value })}>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Tanggal
          <input
            required
            type="date"
            min={todayWITA()}
            value={book.date}
            onChange={(e) => setBook({ ...book, date: e.target.value })}
          />
        </label>
        <label>
          Waktu
          <select required value={book.time} onChange={(e) => setBook({ ...book, time: e.target.value })}>
            <option value="">Pilih waktu</option>
            {TIME_SLOTS.map((x) => (
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
  );
}
