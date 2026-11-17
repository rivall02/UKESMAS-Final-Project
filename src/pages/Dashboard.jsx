import { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/auth';
import { subscribeAppointments } from '../services/appointments';
import { subscribeRecords } from '../services/records';
import { countStudents } from '../services/users';
import Stat from '../components/Stat';
import AppointmentCard from '../components/AppointmentCard';
import Empty from '../components/Empty';
import BookingModal from '../components/BookingModal';
import DailyTip from '../components/DailyTip';

const logError = (what) => (err) => console.error(`Gagal memuat ${what}:`, err);

export default function Dashboard() {
  const { profile, isStaff } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const scope = { userId: profile.id, isStaff };
    const unsubA = subscribeAppointments(scope, setAppointments, logError('janji temu'));
    const unsubR = subscribeRecords(scope, setRecords, logError('rekam medis'));
    return () => {
      unsubA();
      unsubR();
    };
  }, [profile.id, isStaff]);

  useEffect(() => {
    if (!isStaff) return;
    let alive = true;
    countStudents()
      .then((n) => alive && setStudentCount(n))
      .catch(logError('jumlah mahasiswa'));
    return () => {
      alive = false;
    };
  }, [isStaff]);

  return (
    <>
      <div className="welcome">
        <div>
          <small className="eyebrow">{isStaff ? 'ADMINISTRATION OVERVIEW' : 'STUDENT WELLNESS SPACE'}</small>
          <h1>
            Hai, {profile.name?.split(' ')[0]}! <em>♡</em>
          </h1>
          <p>
            {isStaff
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
          <h2>
            Sehat itu bukan tujuan,
            <br />
            tapi perjalanan. ♡
          </h2>
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

      {!isStaff && <DailyTip />}

      <div className="stats">
        <Stat n={appointments.length} label={isStaff ? 'Total janji temu' : 'Janji temu saya'} icon={<CalendarDays />} />
        <Stat n={records.length} label="Rekam medis" icon={<ClipboardList />} />
        <Stat n={isStaff ? studentCount : 'Aktif'} label={isStaff ? 'Mahasiswa' : 'Status akun'} icon={<Users />} />
      </div>

      <div className="panel">
        <div className="panelhead">
          <div>
            <h3>{isStaff ? 'Janji temu terbaru' : 'Janji temu saya'}</h3>
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
        <button className="outline" onClick={() => (isStaff ? navigate('/appointments') : setBooking(true))}>
          <Plus size={15} />
          {isStaff ? 'Kelola janji temu' : 'Buat janji temu baru'}
        </button>
      </div>

      <div className="quick">
        {(isStaff
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

      {booking && <BookingModal onClose={() => setBooking(false)} />}
    </>
  );
}
