import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  CalendarDays,
  ClipboardList,
  BookHeart,
  Sparkles,
  Users,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAppointments, getRecords, getUsers, createAppointment } from '../services/firestore';
import Stat from '../components/Stat';
import AppointmentCard from '../components/AppointmentCard';
import Empty from '../components/Empty';
import Modal from '../components/Modal';

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [booking, setBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [book, setBook] = useState({ service: 'Konsultasi Umum', date: '', time: '', note: '' });

  useEffect(() => {
    async function load() {
      try {
        const [a, r] = await Promise.all([
          getAppointments(profile.id, isAdmin),
          getRecords(profile.id, isAdmin),
        ]);
        setAppointments(a);
        setRecords(r);
        if (isAdmin) {
          const users = await getUsers();
          setUserCount(users.filter((u) => u.role === 'student').length);
        }
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      }
    }
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
      const a = await getAppointments(profile.id, isAdmin);
      setAppointments(a);
      setBooking(false);
      setBook({ service: 'Konsultasi Umum', date: '', time: '', note: '' });
    } catch (err) {
      console.error('Gagal membuat janji temu:', err);
      alert('Gagal membuat janji temu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="welcome">
        <div>
          <small className="eyebrow">
            {isAdmin ? 'ADMINISTRATION OVERVIEW' : 'STUDENT WELLNESS SPACE'}
          </small>
          <h1>
            {isAdmin ? 'Halo, Admin UKESMAS!' : `Hai, ${profile?.name?.split(' ')[0]}!`}{' '}
            <em>♡</em>
          </h1>
          <p>
            {isAdmin
              ? 'Pantau aktivitas layanan kesehatan mahasiswa.'
              : 'Bagaimana kabarmu hari ini? Yuk, tetap sehat dan semangat menjalani hari.'}
          </p>
        </div>
        <span className="date">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      <section className="hero">
        <div>
          <small>YOUR HEALTH MATTERS</small>
          <h2>Sehat itu bukan tujuan,<br />tapi perjalanan. ♡</h2>
          <p>Mulai langkah kecil untuk menjaga kesehatan fisik dan mentalmu bersama UKESMAS.</p>
          <button className="white" onClick={() => navigate('/health')}>
            Jelajahi tips sehat <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="heroicon">
          <HeartPulse size={78} />
          <span>✿</span>
        </div>
      </section>

      <div className="stats">
        <Stat n={appointments.length} label={isAdmin ? 'Total janji temu' : 'Janji temu saya'} icon={<CalendarDays />} />
        <Stat n={records.length} label="Rekam medis" icon={<ClipboardList />} />
        <Stat
          n={isAdmin ? userCount : 'Aktif'}
          label={isAdmin ? 'Mahasiswa' : 'Status akun'}
          icon={<Users />}
        />
      </div>

      <div className="panel">
        <div className="panelhead">
          <div>
            <h3>{isAdmin ? 'Janji temu terbaru' : 'Janji temu saya'}</h3>
            <small>Jadwal konsultasi kesehatan</small>
          </div>
          <button className="link" onClick={() => navigate('/appointments')}>
            Lihat semua →
          </button>
        </div>
        {appointments.slice(0, 3).map((a) => (
          <AppointmentCard key={a.id} a={a} />
        ))}
        {!appointments.length && <Empty>Belum ada janji temu.</Empty>}
        <button className="outline" onClick={() => (isAdmin ? navigate('/appointments') : setBooking(true))}>
          <Plus size={15} />
          {isAdmin ? 'Kelola janji temu' : 'Buat janji temu baru'}
        </button>
      </div>

      <div className="quick">
        {(isAdmin
          ? [
              ['Janji Temu', CalendarDays, '/appointments'],
              ['Mahasiswa', Users, '/students'],
              ['Rekam Medis', ClipboardList, '/records'],
              ['Edukasi', BookHeart, '/health'],
            ]
          : [
              ['Buat janji', CalendarDays, '/appointments'],
              ['Rekam medis', ClipboardList, '/records'],
              ['Tanya AI', Sparkles, '/ai'],
              ['Tips sehat', BookHeart, '/health'],
            ]
        ).map(([t, Icon, path]) => (
          <button key={path} onClick={() => navigate(path)}>
            <Icon />
            <b>{t}</b>
          </button>
        ))}
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
