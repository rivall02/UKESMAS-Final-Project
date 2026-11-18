import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { SERVICES, STATUS, TIME_SLOTS } from '../constants';
import {
  createAppointment,
  getSlotCapacity,
  getSlotCounts,
  releaseSlot,
  reserveSlot,
  subscribeSlotCapacity,
  subscribeSlotCounts,
} from '../services/appointments';
import { nowTimeWITA, todayWITA } from '../utils/date';
import Modal from './Modal';
import '../styles/appointments.css';

const EMPTY = { service: SERVICES[0], date: '', time: '', note: '' };

export default function BookingModal({ onClose }) {
  const { profile } = useAuth();
  const [book, setBook] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [releasePending, setReleasePending] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [reload, setReload] = useState(0);
  const [clock, setClock] = useState(() => ({ date: todayWITA(), time: nowTimeWITA() }));

  useEffect(() => {
    const timer = setInterval(() => setClock({ date: todayWITA(), time: nowTimeWITA() }), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!book.date) return;
    let active = true;
    const unsubscribers = [];
    const date = book.date;

    function onError(err) {
      console.error('Gagal memuat ketersediaan:', err);
      if (active) setAvailability({ date, error: 'Ketersediaan jam belum bisa dimuat. Coba lagi.' });
    }

    async function load() {
      try {
        const [counts, capacity] = await Promise.all([getSlotCounts(date), getSlotCapacity()]);
        if (!active) return;
        setAvailability({ date, counts, capacity });
        unsubscribers.push(subscribeSlotCounts(date, (nextCounts) => {
          if (active) setAvailability((previous) => ({ ...previous, counts: nextCounts }));
        }, onError));
        unsubscribers.push(subscribeSlotCapacity((nextCapacity) => {
          if (active) setAvailability((previous) => ({ ...previous, capacity: nextCapacity }));
        }, onError));
      } catch (err) {
        onError(err);
      }
    }

    load();
    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [book.date, reload]);

  const ready = availability?.date === book.date && !availability.error;
  const availabilityError = availability?.date === book.date ? availability.error : '';

  function refreshAvailability() {
    setAvailability(null);
    setReload((value) => value + 1);
  }

  async function retryRelease() {
    if (busy.current || !releasePending) return;
    busy.current = true;
    setSubmitting(true);
    try {
      await releaseSlot(releasePending.date, releasePending.time);
      setReleasePending(null);
      setError('Slot sudah dilepas. Silakan coba membuat janji kembali.');
      refreshAvailability();
    } catch (err) {
      console.error('Gagal melepas slot:', err);
      setError('Slot belum berhasil dilepas. Periksa koneksi lalu coba lagi.');
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy.current || releasePending) return;
    setError('');
    if (!ready) {
      setError('Tunggu sampai ketersediaan jam berhasil dimuat.');
      return;
    }
    const today = todayWITA();
    if (!book.date || book.date < today || !TIME_SLOTS.includes(book.time)) {
      setError('Pilih tanggal dan jam layanan yang valid.');
      return;
    }
    if (book.date === today && book.time < nowTimeWITA()) {
      setError('Jam yang dipilih sudah lewat. Pilih jam lain.');
      setClock({ date: today, time: nowTimeWITA() });
      return;
    }
    busy.current = true;
    setSubmitting(true);
    let reserved = false;
    try {
      reserved = await reserveSlot(book.date, book.time);
      if (!reserved) {
        setError('Slot sudah penuh, pilih jam lain.');
        setBook((previous) => ({ ...previous, time: '' }));
        refreshAvailability();
        return;
      }
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
      setError('Gagal membuat janji temu. Periksa koneksi dan coba lagi.');
      if (reserved) {
        try {
          await releaseSlot(book.date, book.time);
          refreshAvailability();
        } catch (releaseError) {
          console.error('Gagal melepas slot:', releaseError);
          setReleasePending({ date: book.date, time: book.time });
          setError('Janji gagal dibuat dan slot belum berhasil dilepas. Coba lepaskan slot sebelum memesan kembali.');
        }
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Buat janji temu" close={() => { if (!busy.current) onClose(); }}>
      <form className="form appt-booking" onSubmit={handleSubmit} aria-busy={submitting}>
        {error && <p className="appt-message appt-error" role="alert">{error}</p>}
        <fieldset className="appt-fields" disabled={submitting || Boolean(releasePending)}>
          <label>
            Jenis layanan
            <select aria-label="Jenis layanan" value={book.service} onChange={(e) => setBook({ ...book, service: e.target.value })}>
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
              min={clock.date}
              value={book.date}
              onChange={(e) => {
                setBook({ ...book, date: e.target.value, time: '' });
                setError('');
              }}
            />
          </label>
          <label>
            Waktu
            <select aria-label="Waktu" required disabled={!book.date || !ready} value={book.time} onChange={(e) => setBook({ ...book, time: e.target.value })}>
              <option value="">{book.date && !ready && !availabilityError ? 'Memuat jam...' : 'Pilih waktu'}</option>
              {TIME_SLOTS.map((time) => {
                const past = book.date < clock.date || (book.date === clock.date && time < clock.time);
                const full = ready && (availability.counts[time] || 0) >= availability.capacity;
                return (
                  <option key={time} value={time} disabled={past || full}>
                    {time}{past ? ' (lewat)' : full ? ' (penuh)' : ''}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Catatan
            <textarea rows="3" value={book.note} onChange={(e) => setBook({ ...book, note: e.target.value })} />
          </label>
          </fieldset>
        <small className="appt-hint">Jam layanan menggunakan WITA. Setiap janji memiliki slot 30 menit.</small>
        {availabilityError && (
          <div className="appt-message appt-error" role="alert">
            <p>{availabilityError}</p>
            <button type="button" className="appt-retry" disabled={submitting} onClick={refreshAvailability}>Coba lagi</button>
          </div>
        )}
        {releasePending && (
          <button type="button" className="appt-retry" disabled={submitting} onClick={retryRelease}>
            Coba lepaskan slot
          </button>
        )}
        <button className="primary" disabled={submitting || !book.date || !ready || Boolean(releasePending)}>
          {submitting ? 'Mengirim...' : 'Kirim permintaan'}
        </button>
      </form>
    </Modal>
  );
}
