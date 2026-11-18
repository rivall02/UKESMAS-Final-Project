import { useState } from 'react';
import { useAuth } from '../contexts/auth';
import { RECORD_SERVICES, STATUS } from '../constants';
import { createRecord } from '../services/records';
import { updateAppointmentStatus } from '../services/appointments';
import { notifyStatusChange } from '../services/notifications';
import { formatDate } from '../utils/date';
import Modal from './Modal';
import '../styles/records.css';

export default function RecordModal({ appointment, onClose }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    service: appointment.priority === 'urgent' ? 'Penanganan Darurat' : RECORD_SERVICES[0],
    summary: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createRecord({
        userId: appointment.userId,
        studentName: appointment.studentName || '',
        nim: appointment.nim || '',
        date: appointment.date,
        time: appointment.time || '',
        service: form.service,
        summary: form.summary,
        provider: profile.name || 'Petugas UKESMAS',
        providerId: profile.id,
        appointmentId: appointment.id,
      });
      await updateAppointmentStatus(appointment.id, STATUS.SELESAI);
      await notifyStatusChange(appointment, STATUS.SELESAI);
      onClose();
    } catch (err) {
      console.error('Gagal menambah rekam medis:', err);
      alert('Gagal menyimpan rekam medis: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Rekam Medis — ${appointment.studentName || 'Mahasiswa'}`} close={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="rec-detail-row">
          <span className="rec-detail-label">Jadwal Janji</span>
          <span className="rec-detail-value">
            {formatDate(appointment.date)} {appointment.time ? `· ${appointment.time} WITA` : ''}
          </span>
        </div>
        {appointment.nim && (
          <div className="rec-detail-row">
            <span className="rec-detail-label">NIM Pasien</span>
            <span className="rec-detail-value">{appointment.nim}</span>
          </div>
        )}
        <label>
          Layanan
          <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
            {RECORD_SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Ringkasan pemeriksaan
          <textarea
            required
            rows="4"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Tuliskan hasil pemeriksaan, diagnosa, dan tindakan medis..."
          />
        </label>
        <button className="primary" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan & selesaikan janji temu'}
        </button>
      </form>
    </Modal>
  );
}
